import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'

const ytIdRegex =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube(?:-nocookie)?\.com\/(?:shorts\/|watch\?(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)([-_0-9A-Za-z]{11})/i

/**
 * Envía una petición POST con formulario.
 *
 * @param {string} url
 * @param {Record<string, string | number>} formData
 * @returns {Promise<Response>}
 */
async function post(url, formData) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
    },
    body: new URLSearchParams(formData),
  })

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} al conectar con el conversor.`)
  }

  return response
}

/**
 * Descarga un video de YouTube mediante un conversor externo.
 *
 * @param {string} url Enlace de YouTube.
 * @param {string} quality Calidad visible: 360p, 720p, 128kbps, etc.
 * @param {'mp3' | 'mp4'} type Formato de salida.
 * @param {string} bitrate Calidad usada por el conversor.
 * @param {string} server Servidor del conversor.
 * @returns {Promise<{
 *   dl_link: string,
 *   thumb: string,
 *   title: string,
 *   filesizeF: string,
 *   filesize: number
 * }>}
 */
async function yt(url, quality, type, bitrate, server = 'en68') {
  const match = url.match(ytIdRegex)

  if (!match) {
    throw new Error('El enlace de YouTube no es válido.')
  }

  if (!['mp3', 'mp4'].includes(type)) {
    throw new Error('El formato debe ser mp3 o mp4.')
  }

  const videoId = match[1]
  const videoUrl = `https://youtu.be/${videoId}`

  const analysisResponse = await post(
    `https://www.y2mate.com/mates/${server}/analyze/ajax`,
    {
      url: videoUrl,
      q_auto: 0,
      ajax: 1,
    },
  )

  const analysis = await analysisResponse.json()

  if (!analysis?.result) {
    throw new Error('El conversor no pudo analizar el video.')
  }

  const { document } = new JSDOM(analysis.result).window
  const tables = document.querySelectorAll('table')
  const table = type === 'mp4' ? tables[0] : tables[1]

  if (!table) {
    throw new Error(`No hay opciones disponibles para convertir a ${type}.`)
  }

  const formatLinks = [...table.querySelectorAll('td > a[href="#"]')]
  const formats = {}

  for (const link of formatLinks) {
    const format = link.textContent.trim()
    const sizeCell = link.parentElement?.nextElementSibling?.nextElementSibling
    const size = sizeCell?.textContent?.trim()

    if (!format || !size || /\.3gp/i.test(format)) continue

    formats[format] = size
  }

  const filesizeF = formats[quality]

  if (!filesizeF) {
    throw new Error(`La calidad ${quality} no está disponible.`)
  }

  const idMatch = document.body.innerHTML.match(/var\s+k__id\s*=\s*"([^"]+)"/i)
  const conversionId = idMatch?.[1]

  if (!conversionId) {
    throw new Error('No fue posible obtener el identificador de conversión.')
  }

  const thumb = document.querySelector('img')?.src || ''
  const title = document.querySelector('b')?.textContent?.trim() || 'Video de YouTube'

  const conversionResponse = await post(
    `https://www.y2mate.com/mates/${server}/convert`,
    {
      type: 'youtube',
      _id: conversionId,
      v_id: videoId,
      ajax: 1,
      token: '',
      ftype: type,
      fquality: bitrate,
    },
  )

  const conversion = await conversionResponse.json()
  const linkMatch = conversion?.result?.match(/<a[^>]+href="([^"]+)"/i)
  const dlLink = linkMatch?.[1]

  if (!dlLink) {
    throw new Error('El conversor no devolvió un enlace de descarga.')
  }

  const numberSize = Number.parseFloat(filesizeF.replace(',', '.')) || 0
  const filesize = /GB$/i.test(filesizeF)
    ? numberSize * 1024 * 1024
    : /MB$/i.test(filesizeF)
      ? numberSize * 1024
      : numberSize

  return {
    dl_link: dlLink,
    thumb,
    title,
    filesizeF,
    filesize,
  }
}

export default {
  yt,
  ytIdRegex,

  /**
   * Convierte un video de YouTube a audio MP3 de 128 kbps.
   */
  yta(url, server = 'en68') {
    return yt(url, '128kbps', 'mp3', '128', server)
  },

  /**
   * Convierte un video de YouTube a MP4 de 360p.
   */
  ytv(url, server = 'en68') {
    return yt(url, '360p', 'mp4', '360', server)
  },

  servers: ['id4', 'en60', 'en61', 'en68'],
}
