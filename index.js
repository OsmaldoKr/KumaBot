import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import cluster from 'node:cluster'
import { createInterface } from 'node:readline'
import cfonts from 'cfonts'
import chalk from 'chalk'
import yargs from 'yargs/yargs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const { name = 'Mi Bot', author = 'Desconocido' } = require(
  join(__dirname, 'package.json')
)

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

let botProcess = null
let reiniciando = false

function colorAleatorio() {
  return chalk.rgb(
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256)
  )
}

function mostrarBanner() {
  try {
    console.log(colorAleatorio()('👺 Iniciando...'))

    cfonts.say('Osmaldo\nKR\nBeta', {
      font: 'block',
      align: 'center',
      colors: ['#3456ff', '#00ffff'],
      background: 'transparent',
      letterSpacing: 1,
      lineHeight: 1,
      space: true
    })
  } catch {
    cfonts.say('Kuma\nBot', {
      font: 'chrome',
      align: 'center',
      gradient: ['red', 'magenta']
    })
  }

  cfonts.say(`Desarrollado por @${author || 'OsmaldoKr'}`, {
    font: 'console',
    align: 'center',
    colors: ['candy']
  })

  console.log(chalk.gray(`Bot: ${name}`))
}

function iniciarBot() {
  if (botProcess) return

  const args = process.argv.slice(2)

  cluster.setupPrimary({
    exec: join(__dirname, 'main.js'),
    args
  })

  botProcess = cluster.fork()

  botProcess.on('message', mensaje => {
    if (mensaje === 'reset') {
      reiniciarBot()
      return
    }

    if (mensaje === 'uptime') {
      botProcess.send({
        tipo: 'uptime',
        segundos: process.uptime()
      })
    }
  })

  botProcess.on('exit', (codigo, signal) => {
    botProcess = null

    if (reiniciando) {
      reiniciando = false
      iniciarBot()
      return
    }

    console.error(
      chalk.red(`⚠️ main.js se cerró. Código: ${codigo}, señal: ${signal}`)
    )

    setTimeout(iniciarBot, 3000)
  })
}

function reiniciarBot() {
  if (!botProcess) {
    iniciarBot()
    return
  }

  reiniciando = true
  botProcess.kill()
}

const opciones = yargs(process.argv.slice(2))
  .option('test', {
    type: 'boolean',
    default: false
  })
  .exitProcess(false)
  .parseSync()

if (!opciones.test) {
  rl.on('line', texto => {
    const comando = texto.trim()

    if (!comando) return

    if (comando === 'reset') {
      reiniciarBot()
      return
    }

    botProcess?.send(comando)
  })
}

mostrarBanner()
iniciarBot()
