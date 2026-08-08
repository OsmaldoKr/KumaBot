import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

const __dirname = global.__dirname(import.meta.url)

/**
 * Genera una imagen de subida de nivel.
 *
 * @param {string} text Nombre o texto del usuario.
 * @param {number} level Nuevo nivel alcanzado.
 * @returns {Promise<Buffer>} Imagen JPG generada.
 */
export function levelup(text, level) {
  return new Promise((resolve, reject) => {
    const support = global.support || {}

    if (!support.convert && !support.magick && !support.gm) {
      reject(
        new Error(
          'ImageMagick o GraphicsMagick no está instalado en el servidor.'
        )
      )
      return
    }

    const fontDirectory = join(__dirname, '../src/font')
    const textFont = join(fontDirectory, 'texts.otf')
    const levelFont = join(fontDirectory, 'level_c.otf')
    const template = join(__dirname, '../src/lvlup_template.jpg')

    if (
      !existsSync(textFont) ||
      !existsSync(levelFont) ||
      !existsSync(template)
    ) {
      reject(
        new Error(
          'Faltan recursos para generar el nivel: fuentes o plantilla.'
        )
      )
      return
    }

    const safeText = String(text)
      .replace(/[\r\n]/g, ' ')
      .slice(0, 24)

    const safeLevel = Math.max(1, Number(level) || 1)

    let levelPosition = '+1385+260'

    if (safeLevel > 2) levelPosition = '+1370+260'
    if (safeLevel > 10) levelPosition = '+1330+260'
    if (safeLevel > 50) levelPosition = '+1310+260'
    if (safeLevel > 100) levelPosition = '+1260+260'

    let executable = 'convert'
    let initialArgs = []

    if (support.gm) {
      executable = 'gm'
      initialArgs = ['convert']
    } else if (support.magick) {
      executable = 'magick'
      initialArgs = ['convert']
    }

    const argumentsList = [
      ...initialArgs,
      template,

      '-font',
      textFont,
      '-fill',
      '#0F3E6A',
      '-pointsize',
      '68',
      '-interline-spacing',
      '-7.5',
      '-annotate',
      '+153+200',
      safeText,

      '-font',
      levelFont,
      '-fill',
      '#0A2A48',
      '-pointsize',
      '140',
      '-interline-spacing',
      '-1.2',
      '-annotate',
      levelPosition,
      String(safeLevel),

      'jpg:-'
    ]

    const output = []
    const errors = []

    const process = spawn(executable, argumentsList)

    process.stdout.on('data', (chunk) => {
      output.push(chunk)
    })

    process.stderr.on('data', (chunk) => {
      errors.push(chunk)
    })

    process.on('error', reject)

    process.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            Buffer.concat(errors).toString() ||
            `El generador de nivel terminó con código ${code}.`
          )
        )
        return
      }

      const image = Buffer.concat(output)

      if (!image.length) {
        reject(
          new Error('No se generó ninguna imagen de nivel.')
        )
        return
      }

      resolve(image)
    })
  })
}
