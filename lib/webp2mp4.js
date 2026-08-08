import fetch, { Blob, FormData } from 'node-fetch'
import { JSDOM } from 'jsdom'

const EZGIF_BASE_URL = 'https://ezgif.com'

function isUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

function assertResponse(response, step) {
  if (!response.ok) {
    throw new Error(`Ezgif falló durante ${step}. Código: ${response.status}`)
  }
}

function getInputValues(document) {
  const values = {}

  for (const input of document.querySelectorAll('form input[name]')) {
    values[input.name] = input.value || ''
  }

  return values
}

function createFormData(source) {
  const form = new FormData()

  if (isUrl(source)) {
    form.append('new-image-url', source)
    return form
  }

  const buffer = Buffer.isBuffer(source)
    ? source
    : Buffer.from(source)

  const blob = new Blob([buffer], {
    type: 'image/webp',
  })

  form.append('new-image', blob, 'imagen.webp')

  return form
}

async function convert(source, type) {
  if (!source) {
    throw new Error('Debes proporcionar una imagen WebP o una URL.')
  }

  const uploadForm = createFormData(source)

  const uploadResponse = await fetch(
    `https://s6.ezgif.com/webp-to-${type}`,
    {
      method: 'POST',
      body: uploadForm,
    },
  )

  assertResponse(uploadResponse, 'la subida del archivo')

  const uploadHtml = await uploadResponse.text()
  const { document } = new JSDOM(uploadHtml).window
  const fields = getInputValues(document)

  if (!fields.file) {
    throw new Error('Ezgif no pudo procesar el archivo WebP.')
  }

  const convertForm = new FormData()

  for (const [name, value] of Object.entries(fields)) {
    convertForm.append(name, value)
  }

  const conversionResponse = await fetch(
    `${EZGIF_BASE_URL}/webp-to-${type}/${fields.file}`,
    {
      method: 'POST',
      body: convertForm,
    },
  )

  assertResponse(conversionResponse, 'la conversión del archivo')

  const conversionHtml = await conversionResponse.text()
  const { document: resultDocument } = new JSDOM(conversionHtml).window

  const selector =
    type === 'mp4'
      ? 'div#output p.outfile video source'
      : 'div#output p.outfile img'

  const element = resultDocument.querySelector(selector)
  const fileUrl = element?.getAttribute('src')

  if (!fileUrl) {
    throw new Error(`No se obtuvo el archivo convertido a ${type}.`)
  }

  return new URL(fileUrl, conversionResponse.url).toString()
}

/**
 * Convierte una imagen WebP en un video MP4.
 *
 * @param {Buffer|string} source Buffer WebP o URL pública.
 * @returns {Promise<string>} URL temporal del archivo MP4.
 */
async function webp2mp4(source) {
  return convert(source, 'mp4')
}

/**
 * Convierte una imagen WebP en una imagen PNG.
 *
 * @param {Buffer|string} source Buffer WebP o URL pública.
 * @returns {Promise<string>} URL temporal del archivo PNG.
 */
async function webp2png(source) {
  return convert(source, 'png')
}

export {
  webp2mp4,
  webp2png,
}
