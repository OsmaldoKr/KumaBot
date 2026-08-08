import { sticker } from '../lib/sticker.js'

const MAX_VIDEO_SECONDS = 7

function getFirstUrl(text = '') {
  const match = text.match(
    /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp|gif|mp4)(?:\?[^\s]*)?/i
  )

  return match?.[0] || null
}

const handler = (m) => m

handler.all = async function (m) {
  const chat = global.db.data.chats[m.chat] || {}

  if (!chat.autosticker || !m.isGroup) return false

  const message = m.msg || m
  const mime = message.mimetype || m.mediaType || ''
  let stickerBuffer = null

  try {
    // Evita convertir nuevamente un sticker ya existente.
    if (/webp/i.test(mime)) return false

    if (/image/i.test(mime)) {
      const image = await m.download?.()

      if (!image) return false

      stickerBuffer = await sticker(
        image,
        false,
        global.packname,
        global.author
      )
    } else if (/video/i.test(mime)) {
      const duration = Number(message.seconds || 0)

      if (duration > MAX_VIDEO_SECONDS) {
        return m.reply(
          `⚠️ El video no debe durar más de ${MAX_VIDEO_SECONDS} segundos.`
        )
      }

      const video = await m.download?.()

      if (!video) return false

      stickerBuffer = await sticker(
        video,
        false,
        global.packname,
        global.author
      )
    } else {
      const url = getFirstUrl(m.text)

      if (!url) return false

      stickerBuffer = await sticker(
        false,
        url,
        global.packname,
        global.author
      )
    }

    if (stickerBuffer) {
      await this.sendFile(
        m.chat,
        stickerBuffer,
        'kumabot-sticker.webp',
        '',
        m,
        true,
        { asSticker: true }
      )
    }
  } catch (error) {
    console.error('Error en autosticker:', error.message)
  }

  return false
}

export default handler
