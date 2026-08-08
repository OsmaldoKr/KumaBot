const blockedWhatsAppLinks = [
  'wa.me/settings',
  'wa.me/channel',
  'whatsapp.com/channel'
]

const handler = (m) => m

handler.before = async function (
  m,
  {
    conn,
    isAdmin,
    isBotAdmin,
    isOwner,
    isROwner
  }
) {
  if (!m.isGroup || !isBotAdmin || !m.text) {
    return false
  }

  // No aplica sanciones al dueño ni a administradores.
  if (isOwner || isROwner || isAdmin) {
    return false
  }

  const messageText = m.text.toLowerCase()

  const hasBlockedLink = blockedWhatsAppLinks.some(
    (link) => messageText.includes(link)
  )

  if (!hasBlockedLink) {
    return false
  }

  try {
    await conn.sendMessage(
      m.chat,
      {
        text: `⚠️ @${m.sender.split('@')[0]}, ese enlace de WhatsApp no está permitido en este grupo.`,
        mentions: [m.sender]
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, {
      delete: m.key
    })

    await conn.groupParticipantsUpdate(
      m.chat,
      [m.sender],
      'remove'
    )
  } catch (error) {
    console.error(
      'No se pudo aplicar la moderación del enlace:',
      error.message
    )
  }

  return true
}

export default handler
