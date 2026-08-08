import { watchFile, unwatchFile, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import chalk from 'chalk'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'

import { es } from './lib/idiomas/total-idiomas.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function getRandomItem(items) {
  if (!Array.isArray(items) || items.length === 0) return undefined

  return items[Math.floor(Math.random() * items.length)]
}

if (!Array.prototype.getRandom) {
  Object.defineProperty(Array.prototype, 'getRandom', {
    value() {
      return getRandomItem(this)
    },
    enumerable: false
  })
}

function readAsset(...segments) {
  const filePath = path.join(__dirname, ...segments)

  if (!existsSync(filePath)) {
    console.warn(chalk.yellow(`Archivo no encontrado: ${filePath}`))
    return null
  }

  return readFileSync(filePath)
}

function environmentList(name) {
  return String(process.env[name] || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const ownerNumber = process.env.OWNER_NUMBER || ''
const botNumber = process.env.BOT_NUMBER || '50578000739'

const keysZens = environmentList('ZENZ_API_KEYS')
const keysXteam = environmentList('XTEAM_API_KEYS')
const keysNeoxr = environmentList('NEOXR_API_KEYS')

global.owner = [
  [ownerNumber, process.env.OWNER_NAME || 'Osmaldo Krㅤ🔱', true],
  [botNumber, process.env.BOT_NAME || 'KumaBotㅤ👺', false]
]

global.mods = []
global.prems = []

global.lenguajeGB = es
global.baileys = '@whiskeysockets/baileys'

global.openai_key = process.env.OPENAI_API_KEY || ''
global.openai_org_id = process.env.OPENAI_ORGANIZATION_ID || ''

global.keysZens = keysZens
global.keysxxx = getRandomItem(keysZens) || ''

global.keysxteammm = keysXteam
global.keysxteam = getRandomItem(keysXteam) || ''

global.keysneoxrrr = keysNeoxr
global.keysneoxr = getRandomItem(keysNeoxr) || ''

global.lolkeysapi = process.env.LOLHUMAN_API_KEY || ''
global.itsrose = environmentList('ITSROSE_API_KEYS')


global.APIs = {
  xteam: 'https://api.xteam.xyz',
  dzx: 'https://api.dhamzxploit.my.id',
  lol: 'https://api.lolhuman.xyz',
  violetics: 'https://violetics.pw',
  neoxr: 'https://api.neoxr.my.id',
  zenzapis: 'https://api.zahwazein.xyz',
  akuari: 'https://api.akuari.my.id',
  akuari2: 'https://apimu.my.id',
  fgmods: 'https://api-fgmods.ddns.net',
  botcahx: 'https://api.botcahx.biz.id',
  ibeng: 'https://api.ibeng.tech',
  rose: 'https://api.itsrose.site',
  popcat: 'https://api.popcat.xyz',
  xcoders: 'https://api-xcoders.site'
}

global.APIKeys = {
  'https://api.xteam.xyz': global.keysxteam,
  'https://api.lolhuman.xyz': global.lolkeysapi,
  'https://api.neoxr.my.id': global.keysneoxr,
  'https://violetics.pw': process.env.VIOLETICS_API_KEY || '',
  'https://api.zahwazein.xyz': global.keysxxx,
  'https://api-fgmods.ddns.net': process.env.FGMODS_API_KEY || '',
  'https://api.botcahx.biz.id': process.env.BOTCAHX_API_KEY || '',
  'https://api.ibeng.tech': process.env.IBENG_API_KEY || '',
  'https://api.itsrose.site': getRandomItem(global.itsrose) || '',
  'https://api-xcoders.site': process.env.XCODERS_API_KEY || ''
}

global.cheerio = cheerio
global.fs = {
  existsSync,
  readFileSync
}
global.fetch = fetch
global.axios = axios
global.moment = moment

global.packname = process.env.PACKNAME || 'Osmaldo KRㅤ🔱'
global.author = process.env.STICKER_AUTHOR || 'KumaBotㅤ👺'

global.official = [
  [ownerNumber, 'Osmaldo KR', 1],
  [botNumber, 'KumaBot', 1]
]

global.mail = process.env.CONTACT_EMAIL || 'tu-correo@example.com'
global.desc = process.env.BOT_DESCRIPTION || 'Ocupado trabajando'
global.desc2 = process.env.BOT_DESCRIPTION_LONG || ''
global.country = process.env.COUNTRY_FLAG || '🇳🇮'

global.vs = '1.0.0'
global.vsJB = '1.0.0'
global.sk = 'KumaBot'

global.yt = process.env.YOUTUBE_URL || 'https://youtube.com'
global.yt2 = global.yt
global.ig = process.env.INSTAGRAM_URL || 'https://instagram.com'
global.md = process.env.GITHUB_URL || 'https://github.com/OsmaldoKr/KumaBot'
global.nna = process.env.WHATSAPP_GROUP_URL || ''
global.asistencia = `https://wa.me/${ownerNumber}`

global.wm = 'KumaBotㅤ👺 : OsmaldoKRㅤ🔱'
global.igfg = 'KumaBotㅤ👺'

global.wait = global.lenguajeGB.smsMeWait?.() || 'Espere un momento...'
global.wait2 = global.lenguajeGB.smsWait?.() || 'Procesando...'
global.nomorown = global.owner[0][0]

const menuAssets = [
  'Menu3.jpg',
  'img1.jpg',
  'img2.jpg',
  'img3.jpg',
  'img4.jpg',
  'img5.jpg',
  'img6.jpg',
  'img7.jpg',
  'img8.jpg',
  'img9.jpg',
  'img10.jpg',
  'img11.jpg'
]

const localImages = menuAssets.map((file) =>
  readAsset('media', 'menus', file)
)

global.imagen1 = localImages[0]
global.imagen2 = localImages[1]
global.imagen3 = localImages[2]
global.imagen4 = localImages[3]
global.imagen5 = localImages[4]
global.imagen6 = localImages[5]
global.imagen7 = localImages[6]
global.imagen8 = localImages[7]
global.imagen9 = localImages[8]
global.imagen10 = localImages[9]
global.imagen11 = localImages[10]
global.imagen12 = localImages[11]

global.img = 'https://i.ibb.co/J784tdX/img1.jpg'
global.img2 = 'https://i.ibb.co/ryLsVqX/img2.jpg'
global.img3 = 'https://i.ibb.co/SJhrb5x/img3.jpg'
global.img5 = 'https://i.ibb.co/9wLvQY5/img5.jpg'
global.img6 = 'https://i.ibb.co/TRQ7JZV/img6.jpg'
global.img7 = 'https://i.ibb.co/NYJrqWC/img7.jpg'
global.img8 = 'https://i.ibb.co/dkC7xTn/img8.jpg'
global.img9 = 'https://i.ibb.co/587rC6x/img9.jpg'
global.img10 = 'https://i.ibb.co/n0wmyww/img10.jpg'
global.img11 = 'https://i.ibb.co/XtP1Q58/img11.jpg'
global.img12 = 'https://i.ibb.co/8xJCqS7/img12.jpg'
global.img13 = 'https://i.ibb.co/tPgJfbB/img13.jpg'
global.img14 = 'https://i.ibb.co/p3z1zhH/img14.jpg'
global.img15 = 'https://i.ibb.co/3fc6F2M/img15.jpg'
global.img17 = 'https://i.ibb.co/FqSbcFz/img17.jpg'
global.img18 = 'https://i.ibb.co/LdbB9fz/img18.jpg'
global.img19 = 'https://i.ibb.co/hdymxG8/img19.jpg'
global.img20 = 'https://i.ibb.co/SxW94dZ/img20.jpg'
global.img21 = 'https://i.ibb.co/8NLkqwH/img21.webp'

global.welshark = [
  global.ig,
  global.yt2,
  global.yt,
  global.md
]

global.redesMenu = [
  global.nna,
  global.md,
  global.ig,
  global.yt,
  global.asistencia
].filter(Boolean)

global.sharkMenu = [
  global.img,
  global.img2,
  global.img6,
  global.img7,
  global.img8,
  global.img9,
  global.img13,
  global.img14,
  global.img15,
  global.img17,
  global.img18,
  global.img19,
  global.img20,
  global.img21
]

global.sharkImg = localImages.filter(Boolean)

global.htki = '*⭑•̩̩͙⊱•••• ☪*'
global.htka = '*☪ ••••̩̩͙⊰•⭑*'
global.htjava = '⫹⫺'

global.correct = '✅'
global.fault = '💔'
global.alert = '⚠️'
global.sending = '📋'
global.sent = '❇️'
global.notsent = '❗'
global.waitemot = '⌛'
global.waitemot2 = '⏳'

global.multiplier = 60

watchFile(__filename, () => {
  unwatchFile(__filename)

  console.log(
    chalk.bold.greenBright(
      global.lenguajeGB.smsConfigBot?.().trim() ||
      'Configuración actualizada.'
    )
  )

  import(`${__filename}?update=${Date.now()}`)
})
