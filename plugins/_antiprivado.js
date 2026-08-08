const allowedCommands = [
  'estado',
  'bots'
]

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
    isOwner,
    isROwner
  }
) {
  if (m.isGroup || m.fromMe || m.isBaileys || !m.message) {
    return false
  }

  const messageText = (m.text || '').toLowerCase()

  // Permite los comandos necesarios para gestionar bots secundarios.
  if (allowedCommands.some(command => messageText.includes(command))) {
    return false
  }

  const botJid = this.user.jid
  const settings = global.db.data.settings[botJid] || {}
  const user = global.db.data.users[m.sender]

  if (!settings.antiPrivate || !user) {
    return false
  }

  // Los dueños no se bloquean aunque escriban en privado.
  if (isOwner || isROwner) {
    return false
  }

  if (!Number.isInteger(user.warn)) {
    user.warn = 0
  }

  user.warn += 1

  const userNumber = m.sender.split('@')[0]
  const maximumWarnings = 6

  if (user.warn < maximumWarnings) {
    await conn.sendMessage(
      m.chat,
      {
        text: [
          `*${languageText('smsCreA', '⚠️ Advertencia')}*`,
          `@${userNumber}, ${languageText('smsprivado', 'el uso privado del bot no está permitido.')}`,
          `Advertencia: ${user.warn}/${maximumWarnings}`
        ].join('\n'),
        mentions: [m.sender]
      },
      { quoted: m }
    )

    return true
  }

  user.warn = 0

  await conn.sendMessage(
    m.chat,
    {
      text: `@${userNumber}, alcanzaste el límite de advertencias. Serás bloqueado.`,
      mentions: [m.sender]
    },
    { quoted: m }
  )

  try {
    await conn.updateBlockStatus(m.sender, 'block')
  } catch (error) {
    console.error('No se pudo bloquear al usuario:', error.message)
  }

  return true
}
