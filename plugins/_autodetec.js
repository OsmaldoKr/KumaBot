function languageText(key, fallback, ...args) {
  try {
    return global.lenguajeGB?.[key]?.(...args) || fallback
  } catch {
    return fallback
  }
}

export async function before(m, { conn, groupMetadata }) {
  if (!m.isGroup || !m.messageStubType) return false

  const chat = global.db.data.chats[m.chat] || {}

  if (!chat.detect) return false

  const sender = m.sender
  const mention = `@${sender.split('@')[0]}`
  const parameters = m.messageStubParameters || []

  const notice = languageText(
    'smsAvisoIIG',
    'ℹ️ *Aviso del grupo*'
  )

  const groupImage = await conn
    .profilePictureUrl(m.chat, 'image')
    .catch(() => null)

  let message = null
  let mentions = [sender]
  let image = null

  switch (m.messageStubType) {
    case 21:
      // Cambió el nombre del grupo.
      message = languageText(
        'smsAutodetec1',
        `${notice}\n${mention} cambió el nombre del grupo.`,
        notice,
        mention,
        m
      )
      break

    case 22:
      // Cambió la foto del grupo.
      message = languageText(
        'smsAutodetec2',
        `${notice}\n${mention} cambió la imagen del grupo.`,
        notice,
        mention,
        groupMetadata
      )

      image = groupImage
      break

    case 23:
      // Se renovó el enlace de invitación.
      message = languageText(
        'smsAutodetec4',
        `${notice}\n${mention} renovó el enlace del grupo.`,
        notice,
        groupMetadata,
        mention
      )
      break

    case 25:
      // Cambió la descripción del grupo.
      message = languageText(
        'smsAutodetec3',
        `${notice}\n${mention} cambió la descripción del grupo.`,
        notice,
        mention,
        m,
        groupMetadata
      )
      break

    case 26:
      // Cambió la configuración de mensajes del grupo.
      message = languageText(
        'smsAutodetec5',
        `${notice}\n${mention} cambió la configuración del grupo.`,
        notice,
        groupMetadata,
        m,
        mention
      )
      break

    case 29:
      // Un usuario fue ascendido a administrador.
      message = languageText(
        'smsAutodetec6',
        `${notice}\n${mention} ascendió a un participante como administrador.`,
        notice,
        m,
        groupMetadata,
        mention
      )

      mentions = [sender, ...parameters]
      break

    case 30:
      // Un administrador perdió sus permisos.
      message = languageText(
        'smsAutodetec7',
        `${notice}\n${mention} quitó permisos de administrador a un participante.`,
        notice,
        m,
        groupMetadata,
        mention
      )

      mentions = [sender, ...parameters]
      break

    default:
      return false
  }

  try {
    if (image) {
      await conn.sendMessage(
        m.chat,
        {
          image: { url: image },
          caption: message,
          mentions
        },
        { quoted: m }
      )
    } else {
      await conn.sendMessage(
        m.chat,
        {
          text: message,
          mentions
        },
        { quoted: m }
      )
    }
  } catch (error) {
    console.error(
      'No se pudo enviar el aviso de cambios del grupo:',
      error.message
    )
  }

  return false
}
