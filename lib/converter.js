import { promises as fs } from 'node:fs'
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const tempDirectory = join(__dirname, '../tmp')

function normalizeExtension(extension = 'bin') {
  return String(extension)
    .replace(/^\./, '')
    .replace(/[^a-z0-9]/gi, '') || 'bin'
}

async function ensureTempDirectory() {
  await fs.mkdir(tempDirectory, {
    recursive: true,
  })
}

/**
 * Ejecuta FFmpeg para convertir un archivo multimedia.
 *
 * @param {Buffer} buffer Buffer multimedia.
 * @param {string[]} args Argumentos adicionales de FFmpeg.
 * @param {string} ext Extensión de entrada.
 * @param {string} ext2 Extensión de salida.
 * @returns {Promise<{
 *   data: Buffer,
 *   filename: string,
 *   delete: () => Promise<void>
 * }>}
 */
function ffmpeg(buffer, args = [], ext = 'bin', ext2 = 'bin') {
  return new Promise(async (resolve, reject) => {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      reject(new Error('Debes proporcionar un buffer multimedia válido.'))
      return
    }

    await ensureTempDirectory()

    const inputExtension = normalizeExtension(ext)
    const outputExtension = normalizeExtension(ext2)
    const id = randomUUID()

    const inputFile = join(
      tempDirectory,
      `${id}.${inputExtension}`,
    )

    const outputFile = join(
      tempDirectory,
      `${id}-convertido.${outputExtension}`,
    )

    try {
      await fs.writeFile(inputFile, buffer)

      const processFfmpeg = spawn(
        'ffmpeg',
        [
          '-y',
          '-i',
          inputFile,
          ...args,
          outputFile,
        ],
        {
          stdio: ['ignore', 'ignore', 'pipe'],
        },
      )

      let errorOutput = ''

      processFfmpeg.stderr.on('data', (chunk) => {
        errorOutput += chunk.toString()
      })

      processFfmpeg.on('error', async (error) => {
        await fs.unlink(inputFile).catch(() => {})
        reject(
          new Error(
            `No se pudo ejecutar FFmpeg: ${error.message}`,
          ),
        )
      })

      processFfmpeg.on('close', async (code) => {
        await fs.unlink(inputFile).catch(() => {})

        if (code !== 0) {
          await fs.unlink(outputFile).catch(() => {})

          reject(
            new Error(
              `FFmpeg terminó con código ${code}.\n${errorOutput}`,
            ),
          )

          return
        }

        try {
          const data = await fs.readFile(outputFile)

          resolve({
            data,
            filename: outputFile,

            async delete() {
              await fs.unlink(outputFile).catch(() => {})
            },
          })
        } catch (error) {
          reject(error)
        }
      })
    } catch (error) {
      await fs.unlink(inputFile).catch(() => {})
      await fs.unlink(outputFile).catch(() => {})
      reject(error)
    }
  })
}

/**
 * Convierte audio o video a nota de voz OGG/Opus para WhatsApp.
 *
 * @param {Buffer} buffer Buffer multimedia.
 * @param {string} ext Extensión del archivo original.
 */
function toPTT(buffer, ext) {
  return ffmpeg(
    buffer,
    [
      '-vn',
      '-c:a',
      'libopus',
      '-b:a',
      '128k',
      '-vbr',
      'on',
    ],
    ext,
    'ogg',
  )
}

/**
 * Convierte audio o video a audio Opus.
 *
 * @param {Buffer} buffer Buffer multimedia.
 * @param {string} ext Extensión del archivo original.
 */
function toAudio(buffer, ext) {
  return ffmpeg(
    buffer,
    [
      '-vn',
      '-c:a',
      'libopus',
      '-b:a',
      '128k',
      '-vbr',
      'on',
      '-compression_level',
      '10',
    ],
    ext,
    'opus',
  )
}

/**
 * Convierte un video a MP4 compatible con WhatsApp.
 *
 * @param {Buffer} buffer Buffer de video.
 * @param {string} ext Extensión del archivo original.
 */
function toVideo(buffer, ext) {
  return ffmpeg(
    buffer,
    [
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ar',
      '44100',
      '-crf',
      '32',
      '-preset',
      'medium',
      '-movflags',
      '+faststart',
    ],
    ext,
    'mp4',
  )
}

export {
  ffmpeg,
  toAudio,
  toPTT,
  toVideo,
}
