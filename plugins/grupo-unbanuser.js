function getTargetJid(m, text = '') {
  const mentioned = m.mentionedJid?.[0]

  if (mentioned) return mentioned

  if (m.quoted?.sender) {
    return m.quoted.sender
  }

  const number = text.replace(/\D/g, '')

  if (!number) return null

  return `${number}@s.whatsapp.net`
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
  const targetJid = getTargetJid(m, text)

  if (!targetJid) {
    return m.reply(
      [
        'Indica el número, menciona al usuario o responde a su mensaje.',
        '',
        `Ejemplo: ${usedPrefix}${command} 50512345678`
      ].join('\n')
    )
  }

  const user = global.db.data.users[targetJid]

  if (!user) {
    return m.reply(
      'Ese usuario todavía no aparece registrado en la base de datos del bot.'
    )
  }

  const number = targetJid.split('@')[0]

  if (!user.banned) {
    return m.reply(
      `@${number} no estaba prohibido en KumaBot.`,
      null,
      { mentions: [targetJid] }
    )
  }

  user.banned = false
  user.BannedReason = ''

  await conn.sendMessage(
    m.chat,
    {
      text: `✅ @${number} fue desprohibido de KumaBot.`,
      mentions: [targetJid]
    },
    { quoted: m }
  )

  await conn.sendMessage(
    targetJid,
    {
      text: `✅ Has sido desprohibido de KumaBot por @${m.sender.split('@')[0]}.`,
      mentions: [m.sender]
    }
  ).catch(() => {})

  return true
}

handler.command = /^(desprohibir|unprohibit|desprivar|undeprive)$/i
handler.owner = true
handler.register = true

export default handler
