import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import syntaxError from 'syntax-error'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

const packageJson = require(path.join(__dirname, 'package.json'))

const excludedFolders = new Set([
  'node_modules',
  '.git',
  'KumaSession',
  'SharkSession',
  'SharkLiteJadiBot',
  'tmp'
])

const folders = [
  '.',
  ...Object.values(packageJson.directories || {})
]

const files = new Set()

function searchJavaScriptFiles(folder) {
  const absoluteFolder = path.resolve(__dirname, folder)

  if (!fs.existsSync(absoluteFolder)) {
    console.warn(`Carpeta omitida porque no existe: ${folder}`)
    return
  }

  for (const entry of fs.readdirSync(absoluteFolder, {
    withFileTypes: true
  })) {
    if (excludedFolders.has(entry.name)) continue

    const filePath = path.join(absoluteFolder, entry.name)

    if (entry.isDirectory()) {
      searchJavaScriptFiles(filePath)
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.add(filePath)
    }
  }
}

for (const folder of folders) {
  searchJavaScriptFiles(folder)
}

const orderedFiles = [...files].sort()
let errors = 0

console.log(`\nRevisando ${orderedFiles.length} archivos JavaScript...\n`)

for (const file of orderedFiles) {
  if (file === __filename) continue

  const relativePath = path.relative(__dirname, file)

  try {
    const source = fs.readFileSync(file, 'utf8')

    const error = syntaxError(source, file, {
      sourceType: 'module',
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true
    })

    if (error) {
      errors++
      console.error(`✗ Error de sintaxis: ${relativePath}`)
      console.error(error.message || error)
      console.error('')
      continue
    }

    console.log(`✓ Correcto: ${relativePath}`)
  } catch (error) {
    errors++
    console.error(`✗ No se pudo revisar: ${relativePath}`)
    console.error(error.message)
    console.error('')
  }
}

console.log('')

if (errors > 0) {
  console.error(`Se encontraron ${errors} archivo(s) con errores.`)
  process.exitCode = 1
} else {
  console.log('✓ Revisión finalizada: no se encontraron errores de sintaxis.')
}
