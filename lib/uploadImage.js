import fetch, { Blob, FormData } from 'node-fetch'
import { fileTypeFromBuffer } from 'file-type'

const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

/**
 * Sube una imagen a Telegraph.
 *
 * @param {Buffer} buffer Buffer de imagen.
 * @returns {Promise<string>} URL pública temporal de la imagen.
 */
export default async function uploadImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Debes proporcionar un buffer de imagen válido.')
  }

  const fileType = await fileTypeFromBuffer(buffer)

  if (!fileType || !SUPPORTED_MIME_TYPES.has(fileType.mime)) {
    throw new Error('Formato no compatible. Usa una imagen JPG, PNG o WEBP.')
  }

  const form = new FormData()
  const blob = new Blob([buffer], {
    type: fileType.mime,
  })

  form.append('file', blob, `imagen.${fileType.ext}`)

  const response = await fetch('https://telegra.ph/upload', {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    throw new Error(`Telegraph respondió con código ${response.status}.`)
  }

  const result = await response.json()

  if (result?.error) {
    throw new Error(result.error)
  }

  if (!Array.isArray(result) || !result[0]?.src) {
    throw new Error('Telegraph no devolvió una URL de imagen.')
  }

  return `https://telegra.ph${result[0].src}`
}
