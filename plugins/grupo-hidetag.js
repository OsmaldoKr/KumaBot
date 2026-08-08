const handler = async (
  m,
  {
    conn,
    text,
    participants
  }
) => {
  if (!text && !m.quoted) {
    return m.reply(
      'Escribe un mensaje o responde a un archivo.\n\nEjemplo:\n#hidetag Reunión a las 7 PM.'
    )
  }

  const users = participants
    .map((participant) => conn.decodeJid(participant.id))
    .filter(Boolean)

  const quoted = m.quoted
  const messageText = text || quoted?.text || ''

  try {
    if (!quoted) {
      return conn.sendMessage(
        m.chat,
        {
          text: messageText,
          mentions: users
        },
        { quoted: m }
      )
    }

    const mime = quoted.mimetype || quoted.mediaType || ''
    const media = await quoted.download?.()

    if (/image/i.test(mime) && media) {
      return conn.sendMessage(
        m.chat,
        {
          image: media,
          caption: messageText,
          mentions: users
        },
        { quoted: m }
      )
    }

    if (/video/i.test(mime) && media) {
      return conn.sendMessage(
        m.chat,
        {
          video: media,
          mimetype: 'video/mp4',
          caption: messageText,
          mentions: users
        },
        { quoted: m }
      )
    }

    if (/audio/i.test(mime) && media) {
      return conn.sendMessage(
        m.chat,
        {
          audio: media,
          mimetype: mime || 'audio/mpeg',
          fileName: 'kumabot-audio.mp3',
          mentions: users
        },
        { quoted: m }
      )
    }

    if (/sticker|webp/i.test(mime) && media) {
      await conn.sendMessage(
        m.chat,
        {
          sticker: media
        },
        { quoted: m }
      )

      if (messageText) {
        return conn.sendMessage(
          m.chat,
          {
            text: messageText,
            mentions: users
          },
          { quoted: m }
        )
      }

      return
    }

    return conn.sendMessage(
      m.chat,
      {
        text: messageText,
        mentions: users
      },
      { quoted: m }
    )
  } catch (error) {
    console.error('Error en hidetag:', error.message)

    return m.reply(
      'No se pudo enviar la notificación. Intenta responder a otro mensaje.'
    )
  }
}

handler.command = /^(hidetag|notificar|notify)$/i
handler.group = true
handler.admin = true

export default handler
