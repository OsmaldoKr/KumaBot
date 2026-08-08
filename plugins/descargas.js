import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

import {
  googleImage,
  tiktokdl,
  youtubedl,
  youtubedlv2
} from '@bochilteam/scraper'

import { facebook } from '@xct007/frieren-scraper'
import axios from 'axios'
import cheerio from 'cheerio'
import Spotify from 'spotifydl-x'
import yts from 'yt-search'

const TEMP_DIRECTORY = './tmp'
const MAX_DOWNLOAD_MB = 95

function getText(key, fallback) {
  try {
    return global.lenguajeGB?.[key]?.() || fallback
  } catch {
    return fallback
  }
}

function isValidUrl(value) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function ensureTempDirectory() {
  if (!fs.existsSync(TEMP_DIRECTORY)) {
    fs.mkdirSync(TEMP_DIRECTORY, { recursive: true })
  }
}

function sanitizeFileName(name = 'archivo') {
  return String(name)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .trim()
    .slice(0, 80) || 'archivo'
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-NI').format(Number(value) || 0)
}

function formatDuration(seconds) {
  const total = Number(seconds) || 0
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainingSeconds = total % 60

  return [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(remainingSeconds).padStart(2, '0')
  ]
    .filter(Boolean)
    .join(':')
}

function getImageBuffer(response) {
  if (!response?.data) return null

  return Buffer.isBuffer(response.data)
    ? response.data
    : Buffer.from(response.data)
}

async function reportError(m, conn, error, usedPrefix, command) {
  console.error(`Error en ${command}:`, error)

  await m.react(global.notsent || '❗').catch(() => {})

  return m.reply(
    [
      getText('smsMalError3', 'Ocurrió un error al procesar la solicitud.'),
      '',
      `Puedes reportarlo con: ${usedPrefix}reporte ${command}`
    ].join('\n')
  )
}

async function getYoutubeInfo(url) {
  if (!isValidUrl(url)) {
    throw new Error('La URL de YouTube no es válida.')
  }

  return youtubedl(url).catch(() => youtubedlv2(url))
}

async function sendYoutubePreview(m, conn, video, mode) {
  const duration = formatDuration(video.duration?.seconds)
  const views = formatNumber(video.views)

  const text = [
    '╭─〔 *YOUTUBE* 〕',
    `├ Título: ${video.title}`,
    `├ Duración: ${duration || 'No disponible'}`,
    `├ Vistas: ${views || 'No disponible'}`,
    `├ Modo: ${mode}`,
    '╰──────────────'
  ].join('\n')

  return conn.sendMessage(m.chat, {
    text,
    contextInfo: {
      externalAdReply: {
        title: global.wm || 'KumaBot',
        body: global.wait2 || 'Procesando solicitud...',
        thumbnailUrl: video.thumbnail,
        sourceUrl: video.url,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  })
}

async function findYoutubeVideo(query) {
  const result = await yts(query)
  const video = result.videos?.[0]

  if (!video?.url) {
    throw new Error('No se encontró ningún resultado de YouTube.')
  }

  return video
}

async function downloadYoutubeAudio(m, conn, url, asDocument = false) {
  const data = await getYoutubeInfo(url)
  const quality = data.audio?.['128kbps'] || data.audio?.['160kbps']

  if (!quality?.download) {
    throw new Error('No se encontró audio compatible para este video.')
  }

  const downloadUrl = await quality.download()
  const title = sanitizeFileName(data.title)
  const size = quality.fileSizeH || 'Tamaño no disponible'

  if (asDocument) {
    return conn.sendMessage(
      m.chat,
      {
        document: { url: downloadUrl },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
        caption: `🎵 *${title}*\n⚖️ ${size}`
      },
      { quoted: m }
    )
  }

  return conn.sendMessage(
    m.chat,
    {
      audio: { url: downloadUrl },
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`
    },
    { quoted: m }
  )
}

async function downloadYoutubeVideo(m, conn, url, quality = '360p', asDocument = false) {
  const data = await getYoutubeInfo(url)
  const selected = data.video?.[quality] || data.video?.['360p']

  if (!selected?.download) {
    throw new Error('No se encontró video disponible en esa calidad.')
  }

  const downloadUrl = await selected.download()
  const title = sanitizeFileName(data.title)
  const size = selected.fileSizeH || 'Tamaño no disponible'

  if (asDocument) {
    return conn.sendMessage(
      m.chat,
      {
        document: { url: downloadUrl },
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`,
        caption: `🎬 *${title}*\n⚖️ ${size}`
      },
      { quoted: m }
    )
  }

  return conn.sendMessage(
    m.chat,
    {
      video: { url: downloadUrl },
      mimetype: 'video/mp4',
      fileName: `${title}.mp4`,
      caption: `🎬 *${title}*\n⚖️ ${size}`
    },
    { quoted: m }
  )
}

async function getMediaFireData(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  })

  const $ = cheerio.load(response.data)
  const link = $('#downloadButton').attr('href')
  const name = $('#downloadButton').attr('aria-label') ||
    $('.promoDownloadName').text().trim() ||
    'archivo'

  if (!link) {
    throw new Error('No se encontró un enlace de descarga de MediaFire.')
  }

  const head = await axios.head(link)

  return {
    link,
    name: sanitizeFileName(name),
    mime: head.headers['content-type'] || 'application/octet-stream'
  }
}

async function handler(m, { conn, text, usedPrefix, command, args }) {
  const normalizedCommand = command.toLowerCase()

  const isImageSearch = /^(gimage|imagen?)$/i.test(normalizedCommand)
  const isPlayAudio = normalizedCommand === 'play'
  const isPlayVideo = normalizedCommand === 'play2'
  const isYoutubeAudio = /^(fgmp3|dlmp3|getaud|yt(a|mp3)?)$/i.test(normalizedCommand)
  const isYoutubeAudioDocument = /^(ytmp3doc|ytadoc)$/i.test(normalizedCommand)
  const isYoutubeVideo = /^(fgmp4|dlmp4|getvid|yt(v|mp4)?)$/i.test(normalizedCommand)
  const isYoutubeVideoDocument = /^(ytmp4doc|ytvdoc)$/i.test(normalizedCommand)
  const isYoutubeMaximum = normalizedCommand === 'ytmax'
  const isYoutubeMaximumDocument = normalizedCommand === 'ytmaxdoc'
  const isFacebook = /^(facebook|fb|facebookdl|fbdl)$/i.test(normalizedCommand)
  const isMediaFire = /^(mediafire(dl)?|dlmediafire)$/i.test(normalizedCommand)
  const isTikTok = /^(tkdl|tiktok)$/i.test(normalizedCommand)
  const isAiImage = /^(dalle|openiamage|aiimage|aiimg|aimage|iaimagen|openaimage|openaiimage)$/i.test(normalizedCommand)
  const isJourney = /^(openjourney|journey|midjourney)$/i.test(normalizedCommand)
  const isSpotify = /^(spotify|music)$/i.test(normalizedCommand)
  const isSpotifySearch = /^(spot(ify)?search)$/i.test(normalizedCommand)
  const isInstagram = /^(i(nsta)?g(ram)?(dl)?|igimage|igdownload)$/i.test(normalizedCommand)
  const isTwitter = /^((dl)?tw(it(ter(dl|x)?)?)?|x|t?tx)$/i.test(normalizedCommand)

  try {
    if (isImageSearch) {
      if (!text) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} gatos`
        )
      }

      const blockedTerms = [
        'porn',
        'porno',
        'gore',
        'hentai',
        'desnudo',
        'desnuda',
        'sexo',
        'sex',
        'nsfw',
        'rule34',
        'pedofilia'
      ]

      if (blockedTerms.some(term => text.toLowerCase().includes(term))) {
        return m.reply('⚠️ Esa búsqueda no está permitida.')
      }

      await m.react(global.waitemot || '⌛')

      const images = await googleImage(text)
      const image = images.getRandom?.() || images[0]

      if (!image) {
        throw new Error('No se encontraron imágenes.')
      }

      await conn.sendFile(
        m.chat,
        image,
        'imagen.jpg',
        `🖼️ Resultado para: *${text}*`,
        m
      )

      return m.react(global.sent || '✅')
    }

    if (isPlayAudio || isPlayVideo) {
      if (!text) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} nombre de canción`
        )
      }

      await m.react(global.waitemot || '⌛')

      const video = await findYoutubeVideo(text)
      const preview = await sendYoutubePreview(
        m,
        conn,
        video,
        isPlayAudio ? 'Audio' : 'Video'
      )

      if (isPlayAudio) {
        await downloadYoutubeAudio(m, conn, video.url)
      } else {
        await downloadYoutubeVideo(m, conn, video.url)
      }

      await preview.react?.(global.correct || '✅').catch(() => {})
      return m.react(global.sent || '✅')
    }

    if (isYoutubeAudio || isYoutubeAudioDocument) {
      const url = args[0]

      if (!url) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} https://youtu.be/ejemplo`
        )
      }

      await m.reply(global.wait || 'Descargando audio...')
      await downloadYoutubeAudio(m, conn, url, isYoutubeAudioDocument)

      return m.react(global.sent || '✅')
    }

    if (isYoutubeVideo || isYoutubeVideoDocument) {
      const url = args[0]
      const quality = `${args[1] || '360'}p`

      if (!url) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} URL 360`
        )
      }

      await m.reply(global.wait || 'Descargando video...')
      await downloadYoutubeVideo(m, conn, url, quality, isYoutubeVideoDocument)

      return m.react(global.sent || '✅')
    }
        if (isYoutubeMaximum || isYoutubeMaximumDocument) {
      const url = args[0]

      if (!url) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} https://youtu.be/ejemplo`
        )
      }

      await m.reply(global.wait || 'Buscando la máxima calidad disponible...')

      const data = await getYoutubeInfo(url)

      const qualities = [
        '2160p',
        '1440p',
        '1080p',
        '720p',
        '480p',
        '360p',
        '240p',
        '144p'
      ]

      const quality = qualities.find(item => data.video?.[item])

      if (!quality) {
        throw new Error('No se encontró una calidad de video compatible.')
      }

      await downloadYoutubeVideo(
        m,
        conn,
        url,
        quality,
        isYoutubeMaximumDocument
      )

      return m.react(global.sent || '✅')
    }

    if (isFacebook) {
      const url = args[0]

      if (!url || !/facebook\.com|fb\.watch/i.test(url)) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} https://www.facebook.com/...`
        )
      }

      await m.reply(global.wait || 'Descargando video de Facebook...')

      let downloadUrl = null

      try {
        const result = await facebook.v1(url)

        if (result.urls?.length) {
          downloadUrl =
            result.urls[0]?.hd ||
            result.urls[0]?.sd ||
            result.urls[1]?.hd ||
            result.urls[1]?.sd
        }
      } catch (error) {
        console.warn('Primer método de Facebook falló:', error.message)
      }

      if (!downloadUrl && global.lolkeysapi) {
        const endpoint = new URL('https://api.lolhuman.xyz/api/facebook')

        endpoint.searchParams.set('apikey', global.lolkeysapi)
        endpoint.searchParams.set('url', url)

        const response = await fetch(endpoint)
        const data = await response.json()

        downloadUrl = data.result?.[0] || data.result?.[1] || null
      }

      if (!downloadUrl) {
        throw new Error('No se pudo obtener el video de Facebook.')
      }

      await conn.sendFile(
        m.chat,
        downloadUrl,
        'facebook.mp4',
        '✅ Video de Facebook descargado.',
        m
      )

      return m.react(global.sent || '✅')
    }

    if (isMediaFire) {
      const url = args[0]

      if (!url || !/mediafire\.com/i.test(url)) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} https://www.mediafire.com/file/...`
        )
      }

      await m.reply(global.wait || 'Analizando archivo de MediaFire...')

      const file = await getMediaFireData(url)

      await conn.sendFile(
        m.chat,
        file.link,
        file.name,
        [
          '🗂️ *Archivo de MediaFire*',
          `Nombre: ${file.name}`,
          `Tipo: ${file.mime}`
        ].join('\n'),
        m,
        false,
        {
          mimetype: file.mime,
          asDocument: true
        }
      )

      return m.react(global.sent || '✅')
    }

    if (isTikTok) {
      const url = args[0]

      if (!url || !/tiktok\.com/i.test(url)) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} https://vm.tiktok.com/...`
        )
      }

      await m.reply(global.wait || 'Descargando TikTok...')

      const result = await tiktokdl(url)

      const videoUrl =
        result.video?.no_watermark2 ||
        result.video?.no_watermark ||
        result.video?.no_watermark_hd ||
        result.video?.no_watermark_raw

      if (!videoUrl) {
        throw new Error('No se encontró una descarga de TikTok disponible.')
      }

      const author = result.author?.nickname || 'TikTok'
      const description = result.description || 'Video descargado desde TikTok.'

      await conn.sendFile(
        m.chat,
        videoUrl,
        'tiktok.mp4',
        `💜 *${author}*\n\n${description}`,
        m
      )

      if (result.music?.play_url || result.audio?.play_url) {
        const audioUrl = result.music?.play_url || result.audio?.play_url

        await conn.sendMessage(
          m.chat,
          {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: 'tiktok-audio.mp3'
          },
          { quoted: m }
        )
      }

      return m.react(global.sent || '✅')
    }

    if (isAiImage || isJourney) {
      const prompt = text || m.quoted?.text

      if (!prompt) {
        return m.reply(
          `${getText('smsMalused3', 'Escribe una descripción para crear la imagen.')}\n${usedPrefix}${command} un mapache azul en una biblioteca`
        )
      }

      if (!global.lolkeysapi) {
        return m.reply(
          'La API de imágenes no está configurada. Agrega LOLHUMAN_API_KEY a las variables de entorno.'
        )
      }

      await m.reply(global.wait || 'Generando imagen...')

      const endpoint = new URL(
        isJourney
          ? 'https://api.lolhuman.xyz/api/diffusion-prompt'
          : 'https://api.lolhuman.xyz/api/dall-e'
      )

      endpoint.searchParams.set('apikey', global.lolkeysapi)

      if (isJourney) {
        endpoint.searchParams.set('prompt', prompt)
      } else {
        endpoint.searchParams.set('text', prompt)
      }

      await conn.sendFile(
        m.chat,
        endpoint.toString(),
        'kumabot-ai.jpg',
        `🖼️ Imagen generada\n\n_${prompt}_`,
        m
      )

      return m.react(global.sent || '✅')
    }

    if (isSpotifySearch) {
      if (!text) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} nombre de canción`
        )
      }

      if (!global.lolkeysapi) {
        return m.reply(
          'La búsqueda de Spotify no está configurada. Agrega LOLHUMAN_API_KEY a las variables de entorno.'
        )
      }

      await m.reply(global.wait || 'Buscando en Spotify...')

      const endpoint = new URL(
        'https://api.lolhuman.xyz/api/spotifysearch'
      )

      endpoint.searchParams.set('apikey', global.lolkeysapi)
      endpoint.searchParams.set('query', text)

      const response = await fetch(endpoint)
      const data = await response.json()
      const results = data.result || []

      if (!results.length) {
        return m.reply('No se encontraron resultados en Spotify.')
      }

      const output = results
        .slice(0, 8)
        .map((track, index) => {
          return [
            `*${index + 1}. ${track.title || track.name || 'Sin título'}*`,
            `Artista: ${track.artists || 'Desconocido'}`,
            `Enlace: ${track.link || 'No disponible'}`
          ].join('\n')
        })
        .join('\n\n──────────────\n\n')

      return m.reply(`🔎 *Resultados para: ${text}*\n\n${output}`)
    }

    if (isSpotify) {
      if (!text) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} nombre de canción o enlace de Spotify`
        )
      }

      if (!global.lolkeysapi) {
        return m.reply(
          'Spotify requiere LOLHUMAN_API_KEY configurada como variable de entorno.'
        )
      }

      await m.reply(global.wait || 'Buscando canción en Spotify...')

      let spotifyUrl = text

      if (!/open\.spotify\.com\/track/i.test(spotifyUrl)) {
        const endpoint = new URL(
          'https://api.lolhuman.xyz/api/spotifysearch'
        )

        endpoint.searchParams.set('apikey', global.lolkeysapi)
        endpoint.searchParams.set('query', text)

        const response = await fetch(endpoint)
        const data = await response.json()

        spotifyUrl = data.result?.[0]?.link

        if (!spotifyUrl) {
          throw new Error('No se encontró la canción en Spotify.')
        }
      }

      const clientId = process.env.SPOTIFY_CLIENT_ID
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        return m.reply(
          'Faltan SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en las variables de entorno.'
        )
      }

      ensureTempDirectory()

      const spotify = new Spotify.default({
        clientId,
        clientSecret
      })

      const track = await spotify.getTrack(spotifyUrl)
      const audio = await spotify.downloadTrack(spotifyUrl)

      if (!audio) {
        throw new Error('No se pudo descargar el audio de Spotify.')
      }

      const fileName = `${randomUUID()}.mp3`
      const filePath = path.join(TEMP_DIRECTORY, fileName)

      fs.writeFileSync(filePath, audio)

      try {
        const title = sanitizeFileName(track.name || 'spotify-audio')
        const artists = track.artists || 'Artista desconocido'

        if (track.cover_url) {
          await conn.sendFile(
            m.chat,
            track.cover_url,
            'spotify.jpg',
            `💚 *SPOTIFY*\n\n🎵 ${title}\n🎙️ ${artists}`,
            m
          )
        }

        await conn.sendMessage(
          m.chat,
          {
            audio: fs.readFileSync(filePath),
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
          },
          { quoted: m }
        )
      } finally {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }

      return m.react(global.sent || '✅')
    }
        if (isInstagram) {
      const url = args[0]

      if (!url || !/instagram\.com/i.test(url)) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} https://www.instagram.com/reel/...`
        )
      }

      if (!global.lolkeysapi) {
        return m.reply(
          'Instagram requiere LOLHUMAN_API_KEY configurada como variable de entorno.'
        )
      }

      await m.reply(global.wait || 'Descargando contenido de Instagram...')

      const endpoint = new URL(
        'https://api.lolhuman.xyz/api/instagram'
      )

      endpoint.searchParams.set('apikey', global.lolkeysapi)
      endpoint.searchParams.set('url', url)

      const response = await fetch(endpoint)
      const data = await response.json()
      const mediaUrl = data.result

      if (!mediaUrl) {
        throw new Error('No se encontró contenido descargable de Instagram.')
      }

      await conn.sendFile(
        m.chat,
        mediaUrl,
        'instagram.mp4',
        `📷 Contenido descargado de Instagram.\n🔗 ${url}`,
        m
      )

      return m.react(global.sent || '✅')
    }

    if (isTwitter) {
      const url = args[0]

      if (!url || !/(twitter\.com|x\.com)/i.test(url)) {
        return m.reply(
          `${getText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} https://x.com/usuario/status/...`
        )
      }

      if (!global.lolkeysapi) {
        return m.reply(
          'X/Twitter requiere LOLHUMAN_API_KEY configurada como variable de entorno.'
        )
      }

      await m.reply(global.wait || 'Descargando contenido de X/Twitter...')

      const endpoint = new URL(
        'https://api.lolhuman.xyz/api/twitter'
      )

      endpoint.searchParams.set('apikey', global.lolkeysapi)
      endpoint.searchParams.set('url', url)

      const response = await fetch(endpoint)
      const data = await response.json()
      const result = data.result

      const mediaUrl =
        result?.media?.[0]?.url ||
        result?.media?.[0]?.hd ||
        result?.media?.[0]?.sd

      if (!mediaUrl) {
        throw new Error('No se encontró contenido descargable de X/Twitter.')
      }

      const title = String(result.title || 'Contenido de X/Twitter')
        .replace(/https?:\/\/t\.co\/\S+/gi, '')
        .trim()

      await conn.sendFile(
        m.chat,
        mediaUrl,
        'twitter.mp4',
        `🖤 ${title}\n\n🔗 ${url}`,
        m
      )

      return m.react(global.sent || '✅')
    }
  } catch (error) {
    return reportError(m, conn, error, usedPrefix, command)
  }
}

handler.command = /^(gimage|imagen?|play|play2|fgmp3|dlmp3|getaud|yt(a|mp3)?|ytmp3doc|ytadoc|fgmp4|dlmp4|getvid|yt(v|mp4)?|ytmp4doc|ytvdoc|facebook|fb|facebookdl|fbdl|mediafire(dl)?|dlmediafire|ytmax|ytmaxdoc|tiktok|tkdl|dalle|openiamage|aiimage|aiimg|aimage|iaimagen|openaimage|openaiimage|openjourney|journey|midjourney|spotify|music|spot(ify)?search|i(nsta)?g(ram)?(dl)?|igimage|igdownload|(dl)?tw(it(ter(dl|x)?)?)?|x|t?tx)$/i

handler.register = true
handler.limit = 2

export default handler
