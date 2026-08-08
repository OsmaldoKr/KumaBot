import './config.js'

import { createRequire } from 'node:module'
import path, { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { platform } from 'node:process'
import {
  readdirSync,
  statSync,
  unlinkSync,
  existsSync,
  readFileSync,
  watch
} from 'node:fs'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { format } from 'node:util'

import * as ws from 'ws'
import yargs from 'yargs'
import lodash from 'lodash'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import pino from 'pino'
import { Low, JSONFile } from 'lowdb'

import { makeWASocket, protoType, serialize } from './lib/simple.js'
import store from './lib/store.js'

const require = createRequire(import.meta.url)
const { proto } = (await import('@whiskeysockets/baileys')).default

const {
  DisconnectReason,
  useMultiFileAuthState,
  MessageRetryMap,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = await import('@whiskeysockets/baileys')

const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

protoType()
serialize()

global.__filename = function filename(
  pathURL = import.meta.url,
  removePrefix = platform !== 'win32'
) {
  if (!removePrefix) return pathToFileURL(pathURL).toString()

  return /file:\/\/\//.test(pathURL)
    ? fileURLToPath(pathURL)
    : pathURL
}

global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}

global.__require = function requireModule(directory = import.meta.url) {
  return createRequire(directory)
}

const __dirname = global.__dirname(import.meta.url)

global.API = (
  name,
  apiPath = '/',
  query = {},
  apiKeyQueryName
) => {
  const baseUrl = name in global.APIs ? global.APIs[name] : name
  const apiKey = apiKeyQueryName
    ? {
        [apiKeyQueryName]:
          global.APIKeys[
            name in global.APIs ? global.APIs[name] : name
          ]
      }
    : {}

  const params = { ...query, ...apiKey }

  return Object.keys(params).length
    ? `${baseUrl}${apiPath}?${new URLSearchParams(params)}`
    : `${baseUrl}${apiPath}`
}

global.timestamp = {
  start: new Date()
}

global.videoList = []
global.videoListXXX = []

global.opts = yargs(process.argv.slice(2))
  .exitProcess(false)
  .parse()

global.prefix = new RegExp(
  '^[' +
    (global.opts.prefix || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@aA')
      .replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') +
    ']'
)

const databaseFile = global.opts._[0]
  ? `${global.opts._[0]}_database.json`
  : 'database.json'

global.db = new Low(new JSONFile(databaseFile))
global.DATABASE = global.db

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!global.db.READ) {
          clearInterval(interval)
          resolve(global.db.data)
        }
      }, 1000)
    })
  }

  if (global.db.data !== null) return global.db.data

  global.db.READ = true

  try {
    await global.db.read()
  } catch (error) {
    console.error('Error al leer database.json:', error.message)
  }

  global.db.READ = false

  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {})
  }

  global.db.chain = lodash.chain(global.db.data)

  return global.db.data
}

await global.loadDatabase()

global.chatgpt = new Low(
  new JSONFile(join(__dirname, 'db', 'chatgpt.json'))
)

global.loadChatgptDB = async function loadChatgptDB() {
  if (global.chatgpt.READ) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!global.chatgpt.READ) {
          clearInterval(interval)
          resolve(global.chatgpt.data)
        }
      }, 1000)
    })
  }

  if (global.chatgpt.data !== null) return global.chatgpt.data

  global.chatgpt.READ = true

  try {
    await global.chatgpt.read()
  } catch (error) {
    console.error('Error al leer la base de ChatGPT:', error.message)
  }

  global.chatgpt.READ = false

  global.chatgpt.data = {
    users: {},
    ...(global.chatgpt.data || {})
  }

  global.chatgpt.chain = lodash.chain(global.chatgpt.data)

  return global.chatgpt.data
}

await global.loadChatgptDB()

global.authFile = 'KumaSession'

const { state, saveCreds } = await useMultiFileAuthState(global.authFile)
const { version } = await fetchLatestBaileysVersion()

const msgRetryCounterMap = new Map()

let conn
let handler
let isInit = false
let reconnecting = false

function texto(key, fallback = '') {
  try {
    return global.lenguajeGB?.[key]?.() || fallback
  } catch {
    return fallback
  }
}

function crearConexion() {
  return makeWASocket({
    printQRInTerminal: true,

    patchMessageBeforeSending: (message) => {
      const necesitaParche = Boolean(
        message.buttonsMessage ||
        message.templateMessage ||
        message.listMessage
      )

      if (!necesitaParche) return message

      return {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadataVersion: 2,
              deviceListMetadata: {}
            },
            ...message
          }
        }
      }
    },

    getMessage: async (key) => {
      try {
        const mensaje = await store?.loadMessage(key.remoteJid, key.id)

        return mensaje || proto.Message.fromObject({})
      } catch {
        return proto.Message.fromObject({})
      }
    },

    msgRetryCounterMap,
    logger: pino({ level: 'silent' }),

    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino({ level: 'silent' })
      )
    },

    browser: ['Osmaldo KR Bot', 'Chrome', '1.0.0'],
    version,
    defaultQueryTimeoutMs: undefined
  })
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update

  global.stopped = connection

  if (isNewLogin) conn.isInit = true

  if (update.qr) {
    console.log(chalk.yellow(texto('smsCodigoQR', 'Escanea el código QR.')))
  }

  if (connection === 'open') {
    reconnecting = false
    console.log(chalk.green(texto('smsConexion', 'Bot conectado correctamente.')))
    return
  }

  if (connection !== 'close') return

  const statusCode =
    lastDisconnect?.error?.output?.statusCode ||
    lastDisconnect?.error?.output?.payload?.statusCode

  const sesionCerrada = statusCode === DisconnectReason.loggedOut

  console.log(
    chalk.red(
      texto('smsConexionOFF', 'Conexión cerrada.') +
        (statusCode ? ` Código: ${statusCode}` : '')
    )
  )

  if (sesionCerrada) {
    console.log(
      chalk.red(
        'La sesión fue cerrada. Elimina la carpeta KumaSession y vuelve a escanear el QR.'
      )
    )
    return
  }

  if (!reconnecting) {
    reconnecting = true

    setTimeout(() => {
      global.reloadHandler(true).catch(console.error)
    }, 3000)
  }
}

global.reloadHandler = async function reloadHandler(restartConnection = false) {
  try {
    const nuevoHandler = await import(`./handler.js?update=${Date.now()}`)

    if (Object.keys(nuevoHandler).length) {
      handler = nuevoHandler
    }
  } catch (error) {
    console.error('No se pudo cargar handler.js:', error)
    return false
  }

  if (restartConnection) {
    try {
      conn?.ev?.removeAllListeners()
      conn?.ws?.close()
    } catch {}

    conn = crearConexion()
    global.conn = conn
    isInit = false
  }

  if (!conn) {
    conn = crearConexion()
    global.conn = conn
  }

  if (isInit) {
    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('group-participants.update', conn.participantsUpdate)
    conn.ev.off('groups.update', conn.groupsUpdate)
    conn.ev.off('message.delete', conn.onDelete)
    conn.ev.off('call', conn.onCall)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)
  }

  conn.welcome = texto('smsWelcome')
  conn.bye = texto('smsBye')
  conn.spromote = texto('smsSpromote')
  conn.sdemote = texto('smsSdemote')
  conn.sDesc = texto('smsSdesc')
  conn.sSubject = texto('smsSsubject')
  conn.sIcon = texto('smsSicon')
  conn.sRevoke = texto('smsSrevoke')

  conn.handler = handler.handler.bind(conn)
  conn.participantsUpdate = handler.participantsUpdate.bind(conn)
  conn.groupsUpdate = handler.groupsUpdate.bind(conn)
  conn.onDelete = handler.deleteUpdate.bind(conn)
  conn.onCall = handler.callUpdate.bind(conn)
  conn.connectionUpdate = connectionUpdate.bind(conn)
  conn.credsUpdate = saveCreds.bind(conn)

  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('group-participants.update', conn.participantsUpdate)
  conn.ev.on('groups.update', conn.groupsUpdate)
  conn.ev.on('message.delete', conn.onDelete)
  conn.ev.on('call', conn.onCall)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)

  isInit = true

  return true
}

const pluginFolder = join(__dirname, 'plugins', 'index')
const pluginFilter = (filename) => /\.js$/i.test(filename)

global.plugins = {}

async function cargarPlugins() {
  if (!existsSync(pluginFolder)) {
    console.warn(chalk.yellow(`No existe la carpeta de plugins: ${pluginFolder}`))
    return
  }

  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)

      global.plugins[filename] = module.default || module
    } catch (error) {
      console.error(`Error al cargar el plugin ${filename}:`, error)
      delete global.plugins[filename]
    }
  }
}

global.reload = async function reloadPlugin(_, filename) {
  if (!filename) return

  filename = filename.toString()

  if (!pluginFilter(filename)) return

  const filePath = join(pluginFolder, filename)

  if (!existsSync(filePath)) {
    delete global.plugins[filename]
    console.log(chalk.yellow(`Plugin eliminado: ${filename}`))
    return
  }

  const errorSintaxis = syntaxerror(readFileSync(filePath), filename, {
    sourceType: 'module',
    allowAwaitOutsideFunction: true
  })

  if (errorSintaxis) {
    console.error(
      chalk.red(`Error de sintaxis en ${filename}\n${format(errorSintaxis)}`)
    )
    return
  }

  try {
    const module = await import(
      `${global.__filename(filePath)}?update=${Date.now()}`
    )

    global.plugins[filename] = module.default || module

    global.plugins = Object.fromEntries(
      Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
    )

    console.log(chalk.cyan(`Plugin actualizado: ${filename}`))
  } catch (error) {
    console.error(`No se pudo actualizar ${filename}:`, error)
  }
}

function clearTmp() {
  const folders = [tmpdir(), join(__dirname, 'tmp')]

  for (const folder of folders) {
    if (!existsSync(folder)) continue

    for (const file of readdirSync(folder)) {
      const filePath = join(folder, file)

      try {
        const stats = statSync(filePath)

        if (
          stats.isFile() &&
          Date.now() - stats.mtimeMs >= 3 * 60 * 1000
        ) {
          unlinkSync(filePath)
        }
      } catch (error) {
        console.error(`No se pudo limpiar ${filePath}:`, error.message)
      }
    }
  }
}

function purgeOldFiles() {
  const folders = ['./SharkSession', './SharkLiteJadiBot']
  const limite = Date.now() - 30 * 60 * 1000

  for (const folder of folders) {
    if (!existsSync(folder)) continue

    for (const file of readdirSync(folder)) {
      const filePath = join(folder, file)

      try {
        const stats = statSync(filePath)

        if (
          stats.isFile() &&
          stats.mtimeMs < limite &&
          file !== 'creds.json'
        ) {
          unlinkSync(filePath)
          console.log(chalk.green(`Archivo temporal eliminado: ${file}`))
        }
      } catch (error) {
        console.error(`No se pudo limpiar ${filePath}:`, error.message)
      }
    }
  }
}

async function quickTest() {
  const commands = [
    ['ffmpeg', []],
    ['ffprobe', []],
    [
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-filter_complex',
        'color',
        '-frames:v',
        '1',
        '-f',
        'webp',
        '-'
      ]
    ],
    ['convert', []],
    ['magick', []],
    ['gm', []],
    ['find', ['--version']]
  ]

  const results = await Promise.all(
    commands.map(([command, args]) => {
      return new Promise((resolve) => {
        const process = spawn(command, args)

        process.on('close', (code) => resolve(code !== 127))
        process.on('error', () => resolve(false))
      })
    })
  )

  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = results

  global.support = {
    ffmpeg,
    ffprobe,
    ffmpegWebp,
    convert,
    magick,
    gm,
    find
  }

  Object.freeze(global.support)
}

process.on('uncaughtException', (error) => {
  console.error('Error no controlado:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('Promesa rechazada:', error)
})

process.on('message', (message) => {
  if (message === 'reset') {
    process.send?.('reset')
  }

  if (message === 'uptime') {
    process.send?.({
      type: 'uptime',
      seconds: process.uptime()
    })
  }
})

await cargarPlugins()

if (existsSync(pluginFolder)) {
  watch(pluginFolder, (_, filename) => {
    global.reload(_, filename).catch(console.error)
  })
}

await global.reloadHandler()

if (global.opts.server) {
  const server = await import('./server.js')
  server.default(global.conn, PORT)
}

setInterval(async () => {
  if (global.db.data) {
    await global.db.write().catch(console.error)
  }

  if (global.chatgpt.data) {
    await global.chatgpt.write().catch(console.error)
  }
}, 30 * 1000)

setInterval(() => {
  if (global.stopped === 'close') return

  clearTmp()
  console.log(chalk.cyan(texto('smsClearTmp', 'Archivos temporales limpiados.')))
}, 4 * 60 * 1000)

setInterval(() => {
  purgeOldFiles()
}, 30 * 60 * 1000)

quickTest()
  .then(() => {
    console.log(chalk.cyan(texto('smsCargando', 'Bot cargado correctamente.')))
  })
  .catch(console.error)
