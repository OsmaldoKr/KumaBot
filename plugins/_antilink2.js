const urlRegex = /https?:\/\/[^\s]+/i

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

  if (!chat.antiLink2) return false

  const detectedUrl = messageText.match(urlRegex)

  if (!detectedUrl) return false

  // Los dueños y administradores pueden enviar enlaces.
  if (isOwner || isROwner || isAdmin) return false

  if (!isBotAdmin) {
    await m.reply(
      `${languageText('smsAvisoFG', '⚠️')} Necesito ser administrador para moderar enlaces.`
    )

    return true
  }

  if (!botSettings.restrict) {
    await m.reply(
      `${languageText('smsAvisoAG', '⚠️')} La moderación automática está desactivada por el propietario.`
    )

    return true
  }

  const currentGroupLink = `https://chat.whatsapp.com/${
    await conn.groupInviteCode(m.chat).catch(() => '')
  }`

  // Permite el enlace del grupo actual.
  if (
    currentGroupLink !== 'https://chat.whatsapp.com/' &&
    messageText.includes(currentGroupLink)
  ) {
    return m.reply(
      languageText(
        'smsWaMismoEnlace',
        'Ese es el enlace de este mismo grupo.'
      )
    )
  }

  const userNumber = m.sender.split('@')[0]
  const mention = `@${userNumber}`

  await conn.sendMessage(
    m.chat,
    {
      text: `${languageText('smsEnlaceWatt', 'Los enlaces no están permitidos en este grupo.')} ${mention}`,
      mentions: [m.sender]
    },
    { quoted: m }
  )

  try {
    await conn.sendMessage(m.chat, {
      delete: m.key
    })
  } catch (error) {
    console.error('No se pudo eliminar el enlace:', error.message)
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

