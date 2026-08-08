import crypto from 'node:crypto'
import { fileTypeFromBuffer } from 'file-type'
import webp from 'node-webpmux'
import { Sticker } from 'wa-sticker-formatter'

import { ffmpeg } from './converter.js'

const STICKER_FILTER =
  'scale=512:512:force_original_aspect_ratio=decrease,' +
  'fps=15,' +
  'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,' +
  'format=rgba,' +
  'setsar=1'

const support = {
  ffmpeg: true,
  ffprobe: true,
  ffmpegWebp: true,
  convert: false,
  magick: false,
  gm: false,
  find: false,
}

function isUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return ['']

  return categories.map((category) => String(category))
}

/**
 * Convierte una imagen a WebP usando FFmpeg.
 *
 * @param {Buffer} img Buffer de imagen.
 * @param {string} [url] URL, no se utiliza si ya existe un buffer.
 * @returns {Promise<Buffer>}
 */
async function sticker2(img, url = '') {
  return sticker4(img, url)
}

/**
 * Convierte contenido multimedia a sticker mediante wa-sticker-formatter.
 *
 * @param {Buffer|null} img Buffer de imagen o video.
 * @param {string} [url] URL pública del archivo.
 * @param {string} [packname]
 * @param {string} [author]
 * @param {string[]} [categories]
 * @param {object} [extra]
 * @returns {Promise<Buffer>}
 */
async function sticker3(
  img,
  url = '',
  packname = '',
  author = '',
  categories = [''],
  extra = {},
) {
  return sticker5(img, url, packname, author, categories, extra)
}

/**
 * Convierte imagen o video a WebP mediante FFmpeg.
 *
 * @param {Buffer} img Buffer multimedia.
 * @param {string} [url] URL pública del archivo.
 * @returns {Promise<Buffer>}
 */
async function sticker4(img, url = '') {
  let media = img

  if (!media && !url) {
    throw new Error('Debes proporcionar una imagen, video o URL.')
  }

  if (!media && isUrl(url)) {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`No se pudo descargar el archivo: ${response.status}`)
    }

    media = Buffer.from(await response.arrayBuffer())
  }

  if (!Buffer.isBuffer(media)) {
    media = Buffer.from(media)
  }

  const type = await fileTypeFromBuffer(media)
  const isVideo = /video/i.test(type?.mime || '')

  const options = isVideo
    ? [
        '-vf',
        STICKER_FILTER,
        '-loop',
        '0',
        '-an',
        '-vsync',
        '0',
      ]
    : [
        '-vf',
        STICKER_FILTER,
      ]

  return ffmpeg(
    media,
    options,
    type?.ext || 'png',
    'webp',
  )
}

/**
 * Crea un sticker con paquete, autor y categorías.
 *
 * @param {Buffer|null} img Buffer multimedia.
 * @param {string} [url] URL pública del archivo.
 * @param {string} [packname]
 * @param {string} [author]
 * @param {string[]} [categories]
 * @param {object} [extra]
 * @returns {Promise<Buffer>}
 */
async function sticker5(
  img,
  url = '',
  packname = '',
  author = '',
  categories = [''],
  extra = {},
) {
  const source = img || url

  if (!source) {
    throw new Error('Debes proporcionar una imagen, video o URL.')
  }

  const metadata = {
    type: 'default',
    pack: packname || global.packname || 'KumaBot',
    author: author || global.author || 'KumaBot',
    categories: normalizeCategories(categories),
    quality: 80,
    ...extra,
  }

  const stickerImage = new Sticker(source, metadata)

  return stickerImage.toBuffer()
}

/**
 * Alternativa de conversión con FFmpeg.
 *
 * @param {Buffer} img Buffer multimedia.
 * @param {string} [url] URL pública del archivo.
 * @returns {Promise<Buffer>}
 */
async function sticker6(img, url = '') {
  return sticker4(img, url)
}

/**
 * Agrega metadatos EXIF compatibles con stickers de WhatsApp.
 *
 * @param {Buffer} webpSticker Buffer WebP.
 * @param {string} [packname]
 * @param {string} [author]
 * @param {string[]} [categories]
 * @param {object} [extra]
 * @returns {Promise<Buffer>}
 */
async function addExif(
  webpSticker,
  packname = '',
  author = '',
  categories = [''],
  extra = {},
) {
  if (!Buffer.isBuffer(webpSticker)) {
    throw new Error('El sticker debe ser un Buffer WebP.')
  }

  const image = new webp.Image()

  const metadata = {
    'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
    'sticker-pack-name': packname || global.packname || 'KumaBot',
    'sticker-pack-publisher': author || global.author || 'KumaBot',
    emojis: normalizeCategories(categories),
    ...extra,
  }

  const exifHeader = Buffer.from([
    0x49, 0x49, 0x2a, 0x00,
    0x08, 0x00, 0x00, 0x00,
    0x01, 0x00,
    0x41, 0x57,
    0x07, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x16, 0x00, 0x00, 0x00,
  ])

  const jsonBuffer = Buffer.from(JSON.stringify(metadata), 'utf8')
  const exif = Buffer.concat([exifHeader, jsonBuffer])

  exif.writeUIntLE(jsonBuffer.length, 14, 4)

  await image.load(webpSticker)
  image.exif = exif

  return image.save(null)
}

/**
 * Genera un sticker desde una imagen, video o URL.
 *
 * @param {Buffer|null} img Buffer multimedia.
 * @param {string} [url] URL pública del archivo.
 * @param {string} [packname] Nombre del paquete.
 * @param {string} [author] Autor del sticker.
 * @param {string[]} [categories] Emojis asociados.
 * @param {object} [extra] Metadatos extra.
 * @returns {Promise<Buffer>}
 */
async function sticker(
  img,
  url = '',
  packname = '',
  author = '',
  categories = [''],
  extra = {},
) {
  let lastError

  const methods = [
    () => sticker5(img, url, packname, author, categories, extra),
    async () => {
      const converted = await sticker4(img, url)

      return addExif(
        converted,
        packname,
        author,
        categories,
        extra,
      )
    },
  ]

  for (const method of methods) {
    try {
      const result = await method()

      if (Buffer.isBuffer(result) && result.length > 0) {
        return result
      }
    } catch (error) {
      lastError = error
      console.error(`Error creando sticker: ${error.message}`)
    }
  }

  throw lastError || new Error('No fue posible crear el sticker.')
}

export {
  sticker,
  sticker2,
  sticker3,
  sticker4,
  sticker5,
  sticker6,
  addExif,
  support,
}
