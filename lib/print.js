import { WAMessageStubType } from '@whiskeysockets/baileys'
import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'
import { watchFile } from 'node:fs'
import { fileURLToPath } from 'node:url'
import urlRegexSafe from 'url-regex-safe'

const urlRegex = urlRegexSafe({ strict: false })

const terminalImage = global.opts?.img
  ? (await import('terminal-image')).default
  : null

function formatBytes(bytes = 0) {
  const value = Number(bytes) || 0

  if (value <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  )

  return `${(value / 1024 ** index).toFixed(1)} ${units[index]}`
}

function getTimestamp(timestamp) {
  if (!timestamp) return new Date()

  const seconds =
    typeof timestamp === 'object'
      ? timestamp.low || timestamp.toNumber?.() || Date.now() / 1000
      : timestamp

  return new Date(Number(seconds) * 1000)
}

function getFileSize(message) {
  if (!message) return 0

  if (message.vcard) return message.vcard.length
  if (message.fileLength?.low) return message.fileLength.low
  if (message.fileLength) return Number(message.fileLength) || 0
  if (message.axolotlSenderKeyDistributionMessage) {
    return message.axolotlSenderKeyDistributionMessage.length
  }

  return 0
}

function getPhone(jid = '') {
  const number = String(jid).replace(/@.+/, '')

  if (!/^\d+$/.test(number)) return jid

  return (
    PhoneNumber(`+${number}`).getNumber('international') ||
    `+${number}`
  )
}

function formatMarkdown(text, depth = 4) {
  const markdownRegex =
    /(\*|_|~)(.+?)\1|`([\s\S]+?)`/g

  return String(text).replace(
    markdownRegex,
    (match, symbol, content, monospace) => {
      const value = content || monospace || ''

      if (!symbol || depth <= 0) return value
      if (symbol === '*') return chalk.bold(value)
      if (symbol === '_') return chalk.italic(value)
      if (symbol === '~') return chalk.strikethrough(value)

      return value
    },
  )
}

function formatMessageType(message) {
  if (!message?.mtype) return 'Mensaje'

  return message.mtype
    .replace(/Message$/i, '')
    .replace('audio', message.msg?.ptt ? 'PTT' : 'audio')
    .replace(/^./, (letter) => letter.toUpperCase())
}

export default async function printMessage(m, conn = { user: {} }) {
  const senderId = m.sender || ''
  const chatId = m.chat || ''
  const user = global.db?.data?.users?.[senderId] || {}
  const botJid = conn.user?.jid || conn.user?.id || ''
  const botName = conn.user?.name || global.packname || 'KumaBot'

  const senderName = await conn.getName?.(senderId).catch?.(() => '') ||
    conn.getName?.(senderId) ||
    ''

  const chatName = await conn.getName?.(chatId).catch?.(() => '') ||
    conn.getName?.(chatId) ||
    ''

  const sender = `${getPhone(senderId)}${
    senderName ? ` ~${senderName}` : ''
  }`

  const bot = `${getPhone(botJid)} ~${botName}`
  const filesize = getFileSize(m.msg)
  const messageDate = getTimestamp(m.messageTimestamp)

  const chatDisplay = chatId.endsWith('@s.whatsapp.net')
    ? chalk.cyanBright(chatId)
    : `${chalk.greenBright(chatId)} ${
        chatName ? chalk.greenBright(`⇢ ${chatName}`) : ''
      }`

  let imagePreview = null

  try {
    if (
      terminalImage &&
      /sticker|image/i.test(m.mtype || '') &&
      typeof m.download === 'function'
    ) {
      imagePreview = await terminalImage.buffer(await m.download())
    }
  } catch (error) {
    console.error(chalk.red(`No se pudo mostrar la imagen: ${error.message}`))
  }

  console.log(
    `${chalk.bold.greenBright('✪▸▸')} ${chalk.bold.magenta(
      'KumaBot',
    )} ${chalk.bold.greenBright('◂◂✪')}
┊» ${chalk.black(chalk.whiteBright(bot))}
┊» ${chalk.magenta(
      `${messageDate.toLocaleString()} · ${
        m.messageStubType
          ? WAMessageStubType[m.messageStubType]
          : 'Mensaje'
      } · ${formatBytes(filesize)}`,
    )}
┊» ${chalk.blue(global.vs || '1.0.0')} 🦈 · ${chalk.black(
      chalk.yellowBright(`[${formatMessageType(m)}]`),
    )}
┊» ${chalk.cyan(sender)} ${chalk.white(
      `"${user.name || ''}"`,
    )}
┊» ${chatDisplay}
╰─────────────────────•`,
  )

  if (imagePreview) {
    console.log(imagePreview.trimEnd())
  }

  if (typeof m.text === 'string' && m.text.trim()) {
    let log = m.text.replace(/\u200e+/g, '')

    if (log.length < 1024) {
      log = log.replace(urlRegex, (url) => chalk.blueBright(url))
    }

    log = formatMarkdown(log)

    for (const jid of m.mentionedJid || []) {
      const name = await conn.getName?.(jid).catch?.(() => '') ||
        conn.getName?.(jid) ||
        jid.split('@')[0]

      log = log.replace(
        new RegExp(`@${jid.split('@')[0]}`, 'g'),
        chalk.blueBright(`@${name}`),
      )
    }

    if (m.error != null) {
      console.log(chalk.red(log))
    } else if (m.isCommand) {
      console.log(chalk.yellow(log))
    } else {
      console.log(log)
    }
  }

  if (m.messageStubParameters?.length) {
    const participants = await Promise.all(
      m.messageStubParameters.map(async (jid) => {
        const normalized = conn.decodeJid?.(jid) || jid
        const name = await conn.getName?.(normalized).catch?.(() => '') ||
          conn.getName?.(normalized) ||
          ''

        return chalk.gray(
          `${getPhone(normalized)}${name ? ` ~${name}` : ''}`,
        )
      }),
    )

    console.log(participants.join(', '))
  }

  if (/document/i.test(m.mtype || '')) {
    console.log(`🗂️ ${m.msg?.fileName || m.msg?.displayName || 'Documento'}`)
  } else if (/contact/i.test(m.mtype || '')) {
    console.log(`👤 ${m.msg?.displayName || 'Contacto'}`)
  } else if (/audio/i.test(m.mtype || '')) {
    const duration = Number(m.msg?.seconds) || 0
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60

    console.log(
      `${m.msg?.ptt ? '🎤 PTT' : '🎵 AUDIO'} ` +
      `${String(minutes).padStart(2, '0')}:` +
      `${String(seconds).padStart(2, '0')}`,
    )
  }

  console.log()
}

const file = fileURLToPath(import.meta.url)

watchFile(file, () => {
  console.log(chalk.redBright("Archivo actualizado: 'lib/print.js'"))
})
