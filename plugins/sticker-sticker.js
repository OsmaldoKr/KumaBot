import { sticker } from '../lib/sticker.js'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'
import { webp2png } from '../lib/webp2mp4.js'

const MAX_VIDEO_SECONDS = 10

function isUrl(value = '') {
  try {
    const url = new URL(value)

    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

async function makeStickerFromMedia(media, mime) {
  let result = await sticker(
    media,
    false,
    global.packname,
    global.author
  )

  if (result) return result

  let uploadUrl

  if (/webp/i.test(mime)) {
    const image = await webp2png(media)
    uploadUrl = await uploadImage(image)
  } else if (/image/i.test(mime)) {
    uploadUrl = await uploadImage(media)
  } else {
    uploadUrl = await uploadFile(media)
  }

  return sticker(
    false,
    uploadUrl,
    global.packname,
    global.author
  )
}

const handler = async (
  m,
  {
    conn,
    args,
    usedPrefix,
    command,
    text
  }
) => {
  const quoted = m.quoted || m
  const mime =
    quoted.mimetype ||
    quoted.mediaType ||
    quoted.msg?.mimetype ||
    ''

  const url = args[0] || text

  if (!/webp|image|video/i.test(mime) && !url) {
    return m.reply(
      [
        'Responde a una imagen, video o sticker.',
        '',
        `También puedes usar: ${usedPrefix}${command} https://ejemplo.com/imagen.jpg`
      ].join('\n')
    )
  }

  if (/video/i.test(mime)) {
    const duration = Number(
      quoted.seconds ||
      quoted.msg?.seconds ||
      0
    )

    if (duration > MAX_VIDEO_SECONDS) {
      return m.reply(
        `El video no debe durar más de ${MAX_VIDEO_SECONDS} segundos.`
      )
    }
  }

  try {
    await m.react(global.waitemot || '⌛')

    let stickerBuffer

    if (/webp|image|video/i.test(mime)) {
      const media = await quoted.download()

      if (!media) {
        throw new Error('No se pudo descargar el archivo multimedia.')
      }

      stickerBuffer = await makeStickerFromMedia(media, mime)
    } else {
      if (!isUrl(url)) {
        return m.reply(
          'El enlace proporcionado no es válido.'
        )
      }

      stickerBuffer = await sticker(
        false,
        url,
        global.packname,
        global.author
      )
    }

    if (!stickerBuffer) {
      throw new Error('No se pudo generar el sticker.')
    }

    await conn.sendFile(
      m.chat,
      stickerBuffer,
      'kumabot-sticker.webp',
      '',
      m,
      true,
      {
        asSticker: true
      }
    )

    return m.react(global.sent || '✅')
  } catch (error) {
    console.error('Error al crear sticker:', error)

    return m.reply(
      [
        'No se pudo crear el sticker.',
        '',
        `Si el error continúa, repórtalo con: ${usedPrefix}reporte ${command}`
      ].join('\n')
    )
  }
}

handler.command = /^(s|sticker|stickers|stickerimage|stickervideo|stickergif|stickerimg)$/i

export default handler
