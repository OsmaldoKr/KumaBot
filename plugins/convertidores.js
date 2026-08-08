import { webp2mp4, webp2png } from '../lib/webp2mp4.js'
import { toPTT } from '../lib/converter.js'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'
import fetch from 'node-fetch'
import gtts from 'node-gtts'
import {
  existsSync,
  readFileSync,
  unlinkSync
} from 'node:fs'
import { join } from 'node:path'

function languageText(key, fallback) {
  try {
    return global.lenguajeGB?.[key]?.() || fallback
  } catch {
    return fallback
  }
}

function formatBytes(bytes) {
  if (!bytes) return 'No disponible'

  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / (1024 ** index)

  return `${value.toFixed(2)} ${units[index]}`
}

async function shortUrl(url) {
  try {
    const response = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    )

    return await response.text()
  } catch {
    return url
  }
}

async function reportError(m, error, usedPrefix, command) {
  console.error(`Error en ${command}:`, error)

  return m.reply(
    [
      languageText(
        'smsMalError3',
        'Ocurrió un error al procesar el archivo.'
      ),
      '',
      `Puedes reportarlo con: ${usedPrefix}reporte ${command}`
    ].join('\n')
  )
}

function createTTS(text, language = 'es') {
  return new Promise((resolve, reject) => {
    const fileName = `tts-${Date.now()}.wav`
    const filePath = join(
      global.__dirname(import.meta.url),
      '../tmp',
      fileName
    )

    try {
      const tts = gtts(language)

      tts.save(filePath, text, () => {
        try {
          const buffer = readFileSync(filePath)

          if (existsSync(filePath)) {
            unlinkSync(filePath)
          }

          resolve(buffer)
        } catch (error) {
          reject(error)
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

const handler = async (
  m,
  {
    conn,
    command,
    usedPrefix,
    args
  }
) => {
  const normalizedCommand = command.toLowerCase()

  const isToImage = /^(toimg|toimage|img|jpg|jpeg|png)$/i.test(
    normalizedCommand
  )

  const isToUrl = /^(tourl|url|upload)$/i.test(
    normalizedCommand
  )

  const isToVideo = /^(tovideo|tomp4|mp4)$/i.test(
    normalizedCommand
  )

  const isToGif = /^(togif|togifau|gif|gifau)$/i.test(
    normalizedCommand
  )

  const isToAudio = /^(tovn|toptt|toaudio|tomp3|mp3)$/i.test(
    normalizedCommand
  )

  const isTTS = /^(tovoice|totts|tts)$/i.test(
    normalizedCommand
  )

  try {
    if (isToImage) {
      const quoted = m.quoted

      if (!quoted) {
        return m.reply(
          languageText(
            'smsToimg',
            'Responde a un sticker para convertirlo en imagen.'
          )
        )
      }

      const mime = quoted.mimetype || quoted.mediaType || ''

      if (!/webp/i.test(mime)) {
        return m.reply(
          'Responde a un sticker para convertirlo en imagen PNG.'
        )
      }

      await m.reply(global.wait || 'Convirtiendo sticker a imagen...')

      const media = await quoted.download()
      const output = await webp2png(media)

      return conn.sendFile(
        m.chat,
        output,
        'kumabot-imagen.png',
        '✅ Sticker convertido a PNG.',
        m
      )
    }

    if (isToUrl) {
      const quoted = m.quoted || m
      const mime = quoted.mimetype || quoted.mediaType || quoted.msg?.mimetype || ''

      if (!mime) {
        return m.reply(
          languageText(
            'smsConURL',
            'Responde a un archivo multimedia para subirlo.'
          )
        )
      }

      await m.reply(global.wait || 'Subiendo archivo...')

      const media = await quoted.download()

      const isImageOrVideo = /image|video/i.test(mime)

      const link = await (
        isImageOrVideo
          ? uploadImage(media)
          : uploadFile(media)
      )

      const shortLink = await shortUrl(link)

      const caption = [
        languageText('smsConURL1', 'Enlace:'),
        `» ${link}`,
        '',
        languageText('smsConURL2', 'Tamaño:'),
        `» ${formatBytes(media.length)}`,
        '',
        languageText('smsConURL3', 'Tipo:'),
        `» ${isImageOrVideo ? 'Imagen o video' : 'Archivo'}`,
        '',
        languageText('smsConURL4', 'Enlace corto:'),
        `» ${shortLink}`
      ].join('\n')

      return m.reply(caption)
    }

    if (isToVideo) {
      const quoted = m.quoted

      if (!quoted) {
        return m.reply(
          languageText(
            'smsConVIDEO',
            'Responde a un sticker o GIF para convertirlo en video.'
          )
        )
      }

      const mime = quoted.mimetype || quoted.mediaType || ''

      if (!/webp|gif/i.test(mime)) {
        return m.reply(
          languageText(
            'smsConVIDEO2',
            'Solo se pueden convertir stickers o GIF.'
          )
        )
      }

      await m.reply(global.wait || 'Convirtiendo a video...')

      const media = await quoted.download()
      const output = await webp2mp4(media)

      return conn.sendFile(
        m.chat,
        output,
        'kumabot-video.mp4',
        languageText(
          'smsConVIDEO3',
          '✅ Conversión a video completada.'
        ),
        m
      )
    }

    if (isToGif) {
      const quoted = m.quoted

      if (!quoted) {
        return m.reply(
          languageText(
            'smsConGIF',
            'Responde a un video para convertirlo en GIF.'
          )
        )
      }

      const mime = quoted.mimetype || quoted.mediaType || ''

      if (!/video\/mp4/i.test(mime)) {
        return m.reply(
          languageText(
            'smsConGIF2',
            'Solo se pueden convertir videos MP4.'
          )
        )
      }

      await m.reply(global.wait || 'Convirtiendo video a GIF...')

      const media = await quoted.download()

      return conn.sendMessage(
        m.chat,
        {
          video: media,
          gifPlayback: true,
          caption: languageText(
            'smsConGIF3',
            '✅ Video convertido a GIF.'
          )
        },
        { quoted: m }
      )
    }

    if (isToAudio) {
      const quoted = m.quoted || m
      const mime =
        quoted.mimetype ||
        quoted.mediaType ||
        quoted.msg?.mimetype ||
        ''

      if (!/audio|video/i.test(mime)) {
        return m.reply(
          languageText(
            'smsConVN',
            'Responde a un audio o video para convertirlo en nota de voz.'
          )
        )
      }

      await m.reply(global.wait || 'Convirtiendo a nota de voz...')

      const media = await quoted.download()
      const audio = await toPTT(media, 'mp4')

      if (!audio?.data) {
        throw new Error('No se pudo convertir el archivo a audio.')
      }

      return conn.sendMessage(
        m.chat,
        {
          audio: audio.data,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true
        },
        { quoted: m }
      )
    }

    if (isTTS) {
      const defaultLanguage = global.lenguajeGB?.lenguaje?.() || 'es'

      let language = args[0]
      let text = args.slice(1).join(' ')

      if (!language || language.length !== 2) {
        language = defaultLanguage
        text = args.join(' ')
      }

      if (!text && m.quoted?.text) {
        text = m.quoted.text
      }

      if (!text) {
        return m.reply(
          `Uso: ${usedPrefix}${command} es Hola, soy KumaBot`
        )
      }

      await m.reply(global.wait || 'Generando audio...')

      const audio = await createTTS(
        text.slice(0, 500),
        language
      )

      return conn.sendMessage(
        m.chat,
        {
          audio,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true
        },
        { quoted: m }
      )
    }
  } catch (error) {
    return reportError(m, error, usedPrefix, command)
  }
}

handler.command = /^(toimg|toimage|img|jpe?g|png|tourl|url|upload|tovideo|tomp4|mp4|togif|togifau|gif|gifau|tovn|toptt|toaudio|tomp3|mp3|tovoice|totts|tts)$/i

export default handler
