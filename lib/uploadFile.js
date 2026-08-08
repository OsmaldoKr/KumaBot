import fetch, { Blob, FormData } from 'node-fetch'
import { fileTypeFromBuffer } from 'file-type'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

function validateBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Debes proporcionar un buffer de archivo válido.')
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('El archivo supera el límite máximo de 100 MB.')
  }
}

async function createFileData(buffer) {
  validateBuffer(buffer)

  const fileType = await fileTypeFromBuffer(buffer)
  const extension = fileType?.ext || 'bin'
  const mimeType = fileType?.mime || 'application/octet-stream'

  return {
    blob: new Blob([buffer], { type: mimeType }),
    filename: `archivo.${extension}`,
  }
}

/**
 * Sube un archivo temporal a file.io.
 * El servicio elimina el archivo después de un día.
 *
 * @param {Buffer} buffer Buffer del archivo.
 * @returns {Promise<string>} URL de descarga.
 */
async function fileIO(buffer) {
  const { blob, filename } = await createFileData(buffer)
  const form = new FormData()

  form.append('file', blob, filename)

  const response = await fetch('https://file.io/?expires=1d', {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    throw new Error(`file.io respondió con código ${response.status}.`)
  }

  const result = await response.json()

  if (!result?.success || !result?.link) {
    throw new Error(result?.message || 'file.io no pudo subir el archivo.')
  }

  return result.link
}

/**
 * Sube un archivo al servidor RESTfulAPI.
 *
 * @param {Buffer} buffer Buffer del archivo.
 * @returns {Promise<string>} URL pública del archivo.
 */
async function restfulApi(buffer) {
  const { blob, filename } = await createFileData(buffer)
  const form = new FormData()

  form.append('file', blob, filename)

  const response = await fetch('https://storage.restfulapi.my.id/upload', {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    throw new Error(
      `RESTfulAPI respondió con código ${response.status}.`,
    )
  }

  const result = await response.json()
  const url = result?.files?.[0]?.url

  if (!url) {
    throw new Error('RESTfulAPI no devolvió una URL de descarga.')
  }

  return url
}

/**
 * Sube un archivo usando servicios de respaldo.
 *
 * No uses esta función para credenciales, sesiones, bases de datos
 * ni archivos privados: los enlaces quedan accesibles públicamente.
 *
 * @param {Buffer} buffer Buffer del archivo.
 * @returns {Promise<string>} URL pública del archivo.
 */
export default async function uploadFile(buffer) {
  const uploadServices = [restfulApi, fileIO]
  let lastError

  for (const upload of uploadServices) {
    try {
      return await upload(buffer)
    } catch (error) {
      lastError = error
      console.error(`Error al subir archivo: ${error.message}`)
    }
  }

  throw lastError || new Error('No fue posible subir el archivo.')
}

export {
  fileIO,
  restfulApi,
}
