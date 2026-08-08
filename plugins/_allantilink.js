const blockedLinks = [
  {
    setting: 'antiTiktok',
    regex: /(?:https?:\/\/)?(?:www\.|vm\.|vt\.)?tiktok\.com/i,
    languageKey: 'smsEnlaceTik',
    name: 'TikTok'
  },
  {
    setting: 'antiYoutube',
    regex: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)/i,
    languageKey: 'smsEnlaceYt',
    name: 'YouTube'
  },
  {
    setting: 'antiTelegram',
    regex: /(?:https?:\/\/)?(?:www\.)?(?:telegram\.me|telegram\.org|t\.me)/i,
    languageKey: 'smsEnlaceTel',
    name: 'Telegram'
  },
  {
    setting: 'antiFacebook',
    regex: /(?:https?:\/\/)?(?:www\.|m\.)?(?:facebook\.com|fb\.watch|fb\.me)/i,
    languageKey: 'smsEnlaceFb',
    name: 'Facebook'
  },
  {
    setting: 'antiInstagram',
    regex: /(?:https?:\/\/)?(?:www\.)?instagram\.com/i,
    languageKey: 'smsEnlaceIg',
    name: 'Instagram'
  },
  {
    setting: 'antiTwitter',
    regex: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)/i,
    languageKey: 'smsEnlaceTw',
    name: 'X/Twitter'
  }
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

  // Los dueños y administradores no son sancionados.
  if (isOwner || isROwner || isAdmin) return false

  const blocked = blockedLinks.find(
    (link) => chat[link.setting] && link.regex.test(messageText)
  )

  if (!blocked) return false

  const userNumber = m.sender.split('@')[0]
  const mention = `@${userNumber}`

  if (!isBotAdmin) {
    await m.reply(
      `${languageText('smsAvisoFG', '⚠️')} Necesito ser administrador para moderar enlaces de ${blocked.name}.`
    )

    return true
  }

  if (!botSettings.restrict) {
    await m.reply(
      `${languageText('smsAvisoAG', '⚠️')} La moderación automática está desactivada por el propietario.`
    )

    return true
  }

  const warning = languageText(
    blocked.languageKey,
    `Los enlaces de ${blocked.name} no están permitidos en este grupo.`
  )

  await conn.sendMessage(
    m.chat,
    {
      text: `${languageText('smsAvisoAG', '⚠️')} ${warning}\n\n${mention}, tu mensaje será eliminado.`,
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
