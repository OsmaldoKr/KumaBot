const groupLinkRegex = /(?:https?:\/\/)?chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i

function languageText(key, fallback) {
  try {
    return global.lenguajeGB?.[key]?.() || fallback
  } catch {
    return fallback
  }
}

export async function before(
  m,
  {
    conn,
    isAdmin,
    isBotAdmin,
    isOwner,
    isROwner
  }
) {
  if (!m.isGroup || m.fromMe || m.isBaileys) return false

  const chat = global.db.data.chats[m.chat] || {}
  const botSettings = global.db.data.settings[this.user.jid] || {}
  const messageText = m.text || ''

  if (!chat.antiLink) return false

  const groupLink = messageText.match(groupLinkRegex)

  if (!groupLink) return false

  // Dueños y administradores pueden compartir enlaces.
  if (isOwner || isROwner || isAdmin) return false

  if (!isBotAdmin) {
    await m.reply(
      `${languageText('smsAvisoFG', '⚠️')} Necesito ser administrador para moderar enlaces de grupos.`
    )

    return true
  }

  if (!botSettings.restrict) {
    await m.reply(
      `${languageText('smsAvisoAG', '⚠️')} La moderación automática está desactivada por el propietario.`
    )

    return true
  }

  try {
    const currentGroupCode = await conn.groupInviteCode(m.chat)
    const currentGroupLink = `https://chat.whatsapp.com/${currentGroupCode}`

    // No sanciona a alguien que comparte el enlace del mismo grupo.
    if (messageText.includes(currentGroupLink)) {
      return m.reply(
        languageText(
          'smsWaMismoEnlace',
          'Ese es el enlace de este mismo grupo.'
        )
      )
    }
  } catch (error) {
    console.error('No se pudo verificar el enlace del grupo:', error.message)
  }

  const userNumber = m.sender.split('@')[0]
  const mention = `@${userNumber}`

  await conn.sendMessage(
    m.chat,
    {
      text: `${languageText('smsEnlaceWat', 'Los enlaces de otros grupos no están permitidos.')} ${mention}`,
      mentions: [m.sender]
    },
    { quoted: m }
  )

  try {
    await conn.sendMessage(m.chat, {
      delete: m.key
    })
  } catch (error) {
    console.error('No se pudo eliminar el mensaje:', error.message)
  }

  try {
    await conn.groupParticipantsUpdate(
      m.chat,
      [m.sender],
      'remove'
    )
  } catch (error) {
    console.error('No se pudo expulsar al usuario:', error.message)
  }

  return true
}
