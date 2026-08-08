import { DOMImplementation, XMLSerializer } from 'xmldom'
import JsBarcode from 'jsbarcode'
import { JSDOM } from 'jsdom'
import { readFileSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const src = join(__dirname, '..', 'src')

const welcomeSvgPath = join(src, 'welcome.svg')
const avatarPath = join(src, 'avatar_contact.png')
const backgroundPath = join(src, 'Aesthetic', 'Aesthetic_000.jpeg')

const svgTemplate = readFileSync(welcomeSvgPath, 'utf-8')

const toBase64 = (buffer, mime) =>
  `data:${mime};base64,${Buffer.from(buffer).toString('base64')}`

function createBarcode(data) {
  const serializer = new XMLSerializer()
  const document = new DOMImplementation().createDocument(
    'http://www.w3.org/1999/xhtml',
    'html',
    null,
  )

  const svgNode = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg',
  )

  JsBarcode(svgNode, data || '000000', {
    xmlDocument: document,
    format: 'CODE128',
    displayValue: false,
    margin: 0,
    width: 2,
    height: 80,
  })

  return serializer.serializeToString(svgNode)
}

function setImage(element, value) {
  if (!element) return

  element.setAttribute('href', value)
  element.setAttributeNS(
    'http://www.w3.org/1999/xlink',
    'xlink:href',
    value,
  )
}

function setText(element, value) {
  if (element) {
    element.textContent = String(value || '')
  }
}

function renderWithImageMagick(svg, format = 'png') {
  return new Promise((resolve, reject) => {
    const buffers = []
    const command = process.platform === 'win32' ? 'magick' : 'convert'
    const args =
      process.platform === 'win32'
        ? ['convert', 'svg:-', `${format}:-`]
        : ['svg:-', `${format}:-`]

    const processImage = spawn(command, args)

    processImage.on('error', () => {
      reject(
        new Error(
          'No se encontró ImageMagick. Instala ImageMagick y verifica que el comando magick o convert esté disponible.',
        ),
      )
    })

    processImage.stderr.on('data', (chunk) => {
      console.error(chunk.toString())
    })

    processImage.stdout.on('data', (chunk) => {
      buffers.push(chunk)
    })

    processImage.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ImageMagick terminó con código ${code}.`))
        return
      }

      resolve(Buffer.concat(buffers))
    })

    processImage.stdin.end(Buffer.from(svg))
  })
}

/**
 * Genera un SVG de bienvenida personalizado.
 *
 * @param {object} options
 * @param {string} options.wid Número o ID del usuario.
 * @param {string} options.pp Foto de perfil como URL o data URI.
 * @param {string} options.title Título del grupo.
 * @param {string} options.name Nombre del usuario.
 * @param {string} options.text Texto de bienvenida.
 * @param {string} options.background Fondo como URL o data URI.
 * @returns {Promise<string>}
 */
async function genSVG({
  wid = '',
  pp = '',
  title = '',
  name = '',
  text = '',
  background = '',
} = {}) {
  const { document } = new JSDOM(svgTemplate, {
    contentType: 'image/svg+xml',
  }).window

  const barcodeSvg = createBarcode(String(wid).replace(/\D/g, ''))
  const barcodeImage = await renderWithImageMagick(barcodeSvg, 'png')
  const barcodeBase64 = toBase64(barcodeImage, 'image/png')

  const elements = {
    code: document.querySelector('#_1661899539392 > g:nth-child(6) > image'),
    pp: document.querySelector('#_1661899539392 > g:nth-child(3) > image'),
    text: document.querySelector('#_1661899539392 > text.fil1.fnt0'),
    title: document.querySelector('#_1661899539392 > text.fil2.fnt1'),
    name: document.querySelector('#_1661899539392 > text.fil2.fnt2'),
    bg: document.querySelector('#_1661899539392 > g:nth-child(2) > image'),
  }

  setImage(elements.code, barcodeBase64)
  setImage(elements.pp, pp)
  setImage(elements.bg, background)
  setText(elements.title, title)
  setText(elements.name, name)
  setText(elements.text, text)

  return document.documentElement.outerHTML
}

/**
 * Renderiza la imagen de bienvenida.
 *
 * @param {object} options Datos del usuario y del grupo.
 * @param {'png' | 'jpg' | 'webp'} format Formato de salida.
 * @returns {Promise<Buffer>}
 */
async function render({
  wid = '',
  pp = existsSync(avatarPath)
    ? toBase64(readFileSync(avatarPath), 'image/png')
    : '',
  name = '',
  title = '',
  text = '',
  background = existsSync(backgroundPath)
    ? toBase64(readFileSync(backgroundPath), 'image/jpeg')
    : '',
} = {}, format = 'png') {
  const svg = await genSVG({
    wid,
    pp,
    title,
    name,
    text,
    background,
  })

  return renderWithImageMagick(svg, format)
}

export {
  genSVG,
  render,
  toBase64,
}

export default render
