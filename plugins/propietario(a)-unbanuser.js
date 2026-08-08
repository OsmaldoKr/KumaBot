function getTargetJid(m, text = '') {
  if (m.mentionedJid?.[0]) {
    return m.mentionedJid[0]
  }

  if (m.quoted?.sender) {
    return m.quoted.sender
  }

  const number = text.replace(/\D/g, '')

  return number
    ? `${number}@s.whatsapp.net`
    : null
}

const handler = async (
  m,
  {
    conn,
    text,
    usedPrefix,
    command
  }
) => {
  const target = getTargetJid(m, text)

  if (!target) {
    return m.reply(
      [
        'Menciona, responde o escribe el número del usuario.',
        '',
        `Ejemplo: ${usedPrefix}${command} 50512345678`
      ].join('\n')
    )
  }

  const user = global.db.data.users[target]

  if (!user) {
    return m.reply(
      'Ese usuario no está registrado en la base de datos de KumaBot.'
    )
  }

  const number = target.split('@')[0]

  if (!user.banned) {
    return m.reply(
      `@${number} no está prohibido.`,
      null,
      { mentions: [target] }
    )
  }

  user.banned = false
  user.BannedReason = ''

  await conn.sendMessage(
    m.chat,
    {
      text: `✅ @${number} fue desprohibido de KumaBot.`,
      mentions: [target]
    },
    { quoted: m }
  )

  await conn.sendMessage(
    target,
    {
      text: `✅ Has sido desprohibido de KumaBot por @${m.sender.split('@')[0]}.`,
      mentions: [m.sender]
    }
  ).catch(() => {})

  return true
}

handler.command = /^((unban|desban)(user|usuario|earuser|earusuario))$/i
handler.owner = true

export default handler
