import makeWASocketBase, {
  areJidsSameUser,
  downloadContentFromMessage,
  downloadMediaMessage,
  extractMessageContent,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  getContentType,
  jidDecode,
  proto,
} from '@whiskeysockets/baileys'

import chalk from 'chalk'
import { fileTypeFromBuffer } from 'file-type'
import {
  existsSync,
  mkdirSync,
  promises as fs,
  readFileSync,
} from 'node:fs'

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, isDeepStrictEqual } from 'node:util'
import fetch from 'node-fetch'
import PhoneNumber from 'awesome-phonenumber'

import { sticker } from './sticker.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const tmpDirectory = path.join(__dirname, '../tmp')

const MEDIA_TYPES = [
  'imageMessage',
  'videoMessage',
  'audioMessage',
  'stickerMessage',
  'documentMessage',
]

function ensureTempDirectory() {
  if (!existsSync(tmpDirectory)) {
    mkdirSync(tmpDirectory, { recursive: true })
  }
}

function normalizeJid(jid = '') {
  if (!jid || typeof jid !== 'string') return jid || null

  if (/:\d+@/i.test(jid)) {
    const decoded = jidDecode(jid)

    if (decoded?.user && decoded?.server) {
      return `${decoded.user}@${decoded.server}`
    }
  }

  return jid.trim()
}

function parseMention(text = '') {
  return [
    ...String(text).matchAll(/@([0-9]{5,16})/g),
  ].map((match) => `${match[1]}@s.whatsapp.net`)
}

function createLogger() {
  const print = (label, color, ...args) => {
    console.log(
      color(` ${label} `),
      chalk.gray(`[${new Date().toLocaleTimeString()}]`),
      format(...args),
    )
  }

  return {
    info: (...args) => print('INFO', chalk.bgGreen.black, ...args),
    error: (...args) => print('ERROR', chalk.bgRed.white, ...args),
    warn: (...args) => print('AVISO', chalk.bgYellow.black, ...args),
    debug: (...args) => print('DEBUG', chalk.bgBlue.white, ...args),
    trace: (...args) => print('TRACE', chalk.bgGray.white, ...args),
    child: () => createLogger(),
  }
}

async function getBufferFromSource(source) {
  if (Buffer.isBuffer(source)) return source

  if (source instanceof ArrayBuffer) {
    return Buffer.from(source)
  }

  if (ArrayBuffer.isView(source)) {
    return Buffer.from(
      source.buffer,
      source.byteOffset,
      source.byteLength,
    )
  }

  if (typeof source === 'string') {
    if (/^data:.*?;base64,/i.test(source)) {
      return Buffer.from(source.split(',')[1], 'base64')
    }

    if (/^https?:\/\//i.test(source)) {
      const response = await fetch(source)

      if (!response.ok) {
        throw new Error(
          `No se pudo descargar el archivo: ${response.status}`,
        )
      }

      return Buffer.from(await response.arrayBuffer())
    }

    if (existsSync(source)) {
      return readFileSync(source)
    }

    return Buffer.from(source)
  }

  throw new TypeError('No se pudo convertir el recurso a Buffer.')
}

async function getFile(source, saveToFile = false) {
  ensureTempDirectory()

  const data = await getBufferFromSource(source)
  const fileType = await fileTypeFromBuffer(data)

  const mime = fileType?.mime || 'application/octet-stream'
  const ext = fileType?.ext || 'bin'

  let filename = null

  if (typeof source === 'string' && existsSync(source)) {
    filename = source
  }

  if (saveToFile && !filename) {
    filename = path.join(
      tmpDirectory,
      `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
    )

    await fs.writeFile(filename, data)
  }

  return {
    data,
    filename,
    mime,
    ext,

    async deleteFile() {
      if (filename && existsSync(filename)) {
        await fs.unlink(filename)
      }
    },
  }
}

function getMessageText(message) {
  if (!message) return ''

  if (typeof message === 'string') return message

  return (
    message.text ||
    message.caption ||
    message.contentText ||
    message.selectedDisplayText ||
    message?.hydratedTemplate?.hydratedContentText ||
    ''
  )
}

function getMediaMessage(message) {
  if (!message) return null

  const content =
    message.url || message.directPath
      ? { messageType: null, message }
      : null

  if (content) return content

  const extracted = extractMessageContent(message)

  if (!extracted) return null

  const messageType = getContentType(extracted)

  if (!MEDIA_TYPES.includes(messageType)) return null

  return {
    messageType,
    message: extracted[messageType],
  }
}

function isNumber(value) {
  return Number.isFinite(Number(value))
}

function getRandom() {
  if (Array.isArray(this) || typeof this === 'string') {
    return this[Math.floor(Math.random() * this.length)]
  }

  return Math.floor(Math.random() * Number(this))
}

function nullish(value) {
  return value === null || value === undefined
}
export function makeWASocket(connectionOptions, options = {}) {
  const conn = makeWASocketBase(connectionOptions)

  Object.defineProperties(conn, {
    chats: {
      value: { ...(options.chats || {}) },
      writable: true,
      enumerable: true,
    },

    logger: {
      value: createLogger(),
      writable: false,
      enumerable: true,
    },

    decodeJid: {
      value: normalizeJid,
      enumerable: true,
    },

    parseMention: {
      value: parseMention,
      enumerable: true,
    },

    getFile: {
      value: getFile,
      enumerable: true,
    },

    getName: {
      value(jid = '', withoutContact = false) {
        const id = normalizeJid(jid)

        if (!id) return ''

        if (id === '0@s.whatsapp.net') return 'WhatsApp'

        if (id === normalizeJid(conn.user?.id)) {
          return conn.user?.name || conn.user?.verifiedName || 'KumaBot'
        }

        const contact = conn.chats[id] || {}

        if (id.endsWith('@g.us')) {
          return contact.subject || contact.name || 'Grupo'
        }

        if (withoutContact) {
          return `+${id.replace(/@.+/, '')}`
        }

        return (
          contact.name ||
          contact.notify ||
          contact.verifiedName ||
          contact.vname ||
          `+${id.replace(/@.+/, '')}`
        )
      },
      enumerable: true,
    },

    downloadM: {
      async value(message, type, saveToFile = false) {
        const stream = await downloadContentFromMessage(message, type)
        const chunks = []

        for await (const chunk of stream) {
          chunks.push(chunk)
        }

        const buffer = Buffer.concat(chunks)

        if (!saveToFile) return buffer

        const file = await getFile(buffer, true)

        return file.filename
      },
      enumerable: true,
    },

    downloadMediaMessage: {
      async value(message) {
        return downloadMediaMessage(
          message,
          'buffer',
          {},
          {
            logger: createLogger(),
            reuploadRequest: conn.updateMediaMessage,
          },
        )
      },
      enumerable: true,
    },

    sendFile: {
      async value(
        jid,
        source,
        filename = '',
        caption = '',
        quoted = null,
        ptt = false,
        messageOptions = {},
      ) {
        const file = await getFile(source, true)
        let { data, mime, ext } = file
        let type = 'document'

        const optionsCopy = { ...messageOptions }

        if (
          /webp/i.test(mime) ||
          (/image/i.test(mime) && optionsCopy.asSticker)
        ) {
          if (!/webp/i.test(mime)) {
            data = await sticker(
              data,
              '',
              global.packname || 'KumaBot',
              global.author || 'KumaBot',
            )
          }

          type = 'sticker'
        } else if (/image/i.test(mime)) {
          type = 'image'
        } else if (/video/i.test(mime)) {
          type = 'video'
        } else if (/audio/i.test(mime)) {
          type = 'audio'
        }

        if (optionsCopy.asDocument) {
          type = 'document'
        }

        delete optionsCopy.asSticker
        delete optionsCopy.asDocument
        delete optionsCopy.asImage
        delete optionsCopy.asVideo

        const message = {
          [type]: data,
          caption: type === 'image' || type === 'video' ? caption : undefined,
          mimetype:
            optionsCopy.mimetype ||
            (type === 'audio' && ptt
              ? 'audio/ogg; codecs=opus'
              : mime),
          fileName: filename || `archivo.${ext}`,
          ptt: type === 'audio' ? Boolean(ptt) : undefined,
          ...optionsCopy,
        }

        try {
          return await conn.sendMessage(jid, message, {
            quoted,
            ...optionsCopy,
          })
        } finally {
          await file.deleteFile().catch(() => {})
        }
      },
      enumerable: true,
    },

    reply: {
      value(jid, text = '', quoted = null, messageOptions = {}) {
        if (Buffer.isBuffer(text)) {
          return conn.sendFile(
            jid,
            text,
            'archivo',
            '',
            quoted,
            false,
            messageOptions,
          )
        }

        return conn.sendMessage(
          jid,
          {
            text: String(text),
            mentions: parseMention(text),
            ...messageOptions,
          },
          {
            quoted,
            ...messageOptions,
          },
        )
      },
      enumerable: true,
    },

    sendContact: {
      async value(jid, data, quoted = null, messageOptions = {}) {
        const contactsData =
          Array.isArray(data?.[0]) ? data : [data]

        const contacts = contactsData
          .filter(Boolean)
          .map(([number, name = 'Contacto']) => {
            const phone = String(number).replace(/\D/g, '')
            const cleanName = String(name).replace(/\n/g, '\\n')

            return {
              displayName: cleanName,
              vcard: [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `FN:${cleanName}`,
                `TEL;type=CELL;type=VOICE;waid=${phone}:${PhoneNumber(
                  `+${phone}`,
                ).getNumber('international') || `+${phone}`}`,
                'END:VCARD',
              ].join('\n'),
            }
          })

        return conn.sendMessage(
          jid,
          {
            contacts: {
              displayName:
                contacts.length === 1
                  ? contacts[0].displayName
                  : `${contacts.length} contactos`,
              contacts,
            },
          },
          {
            quoted,
            ...messageOptions,
          },
        )
      },
      enumerable: true,
    },

    sendList: {
      async value(
        jid,
        title = '',
        text = '',
        footer = '',
        buttonText = 'Seleccionar',
        buffer = null,
        listSections = [],
        quoted = null,
        messageOptions = {},
      ) {
        if (Array.isArray(buffer)) {
          messageOptions = quoted || {}
          quoted = listSections
          listSections = buffer
        }

        const sections = (listSections || []).map(
          ([sectionTitle = '', rows = []]) => ({
            title: sectionTitle,
            rows: rows.map(
              ([rowTitle = '', rowId = '', description = '']) => ({
                title: rowTitle,
                rowId: rowId || rowTitle,
                description,
              }),
            ),
          }),
        )

        return conn.sendMessage(
          jid,
          {
            title,
            text,
            footer,
            buttonText,
            sections,
            ...messageOptions,
          },
          {
            quoted,
            ...messageOptions,
          },
        )
      },
      enumerable: true,
    },

    sendButton: {
      async value(
        jid,
        text = '',
        footer = '',
        buffer = null,
        buttons = [],
        quoted = null,
        messageOptions = {},
      ) {
        const normalizedButtons = (buttons || []).map(
          ([displayText, buttonId]) => ({
            buttonId,
            buttonText: { displayText },
            type: 1,
          }),
        )

        const message = {
          text,
          footer,
          buttons: normalizedButtons,
          headerType: 1,
          mentions: parseMention(text),
          ...messageOptions,
        }

        if (buffer) {
          const media = await getFile(buffer)

          if (/image/i.test(media.mime)) {
            message.image = media.data
            message.caption = text
            delete message.text
            message.headerType = 4
          }
        }

        return conn.sendMessage(jid, message, {
          quoted,
          ...messageOptions,
        })
      },
      enumerable: true,
    },

    cMod: {
      value(jid, message, text = '', sender = conn.user?.id, options = {}) {
        const copy = proto.WebMessageInfo.fromObject(
          proto.WebMessageInfo.toObject(message),
        )

        if (copy.key) {
          copy.key.remoteJid = jid
          copy.key.fromMe = areJidsSameUser(
            normalizeJid(sender),
            normalizeJid(conn.user?.id),
          )

          if (jid.endsWith('@g.us')) {
            copy.key.participant = normalizeJid(sender)
          }
        }

        const messageType = getContentType(copy.message)

        if (messageType) {
          const content = copy.message[messageType]

          if (typeof content === 'string') {
            copy.message[messageType] = text || content
          } else if (content?.caption) {
            content.caption = text || content.caption
          } else if (content?.text) {
            content.text = text || content.text
          }

          copy.message[messageType] = {
            ...content,
            ...options,
          }
        }

        return proto.WebMessageInfo.fromObject(copy)
      },
      enumerable: true,
    },

    copyNForward: {
      async value(jid, message, forceForward = false, messageOptions = {}) {
        const content = await generateForwardMessageContent(
          message,
          forceForward,
        )

        const messageType = getContentType(content)
        const contextInfo =
          messageType && content[messageType]?.contextInfo
            ? content[messageType].contextInfo
            : {}

        content[messageType].contextInfo = {
          ...contextInfo,
          ...messageOptions.contextInfo,
        }

        const generated = generateWAMessageFromContent(
          jid,
          content,
          {
            userJid: conn.user?.id,
            quoted: messageOptions.quoted,
          },
        )

        await conn.relayMessage(jid, generated.message, {
          messageId: generated.key.id,
        })

        return generated
      },
      enumerable: true,
    },

    serializeM: {
      value(message) {
        return smsg(conn, message)
      },
      enumerable: true,
    },
  })

  conn.user = conn.user || {}
  conn.user.jid = normalizeJid(conn.user.id)

  return conn
}
let isSerialized = false

function createQuotedMessage(self, contextInfo) {
  const quotedMessage = contextInfo?.quotedMessage

  if (!quotedMessage) return null

  const quotedType = getContentType(quotedMessage)

  if (!quotedType) return null

  const quotedInfo = proto.WebMessageInfo.fromObject({
    key: {
      remoteJid: contextInfo.remoteJid || self.chat,
      fromMe: areJidsSameUser(
        normalizeJid(contextInfo.participant),
        normalizeJid(self.conn?.user?.id),
      ),
      id: contextInfo.stanzaId,
      participant: contextInfo.participant,
    },
    message: quotedMessage,
    participant: contextInfo.participant,
  })

  const quoted = smsg(self.conn, quotedInfo, true)

  Object.defineProperty(quoted, 'sender', {
    value: normalizeJid(
      contextInfo.participant ||
      contextInfo.remoteJid ||
      self.chat,
    ),
    enumerable: true,
    configurable: true,
  })

  return quoted
}

/**
 * Convierte un mensaje de Baileys a un formato más cómodo para plugins.
 *
 * @param {object} conn Conexión de WhatsApp.
 * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} message
 * @param {boolean} [hasParent=false]
 * @returns {object}
 */
export function smsg(conn, message, hasParent = false) {
  if (!message) return message

  serialize()

  const output = proto.WebMessageInfo.fromObject(message)
  output.conn = conn

  if (!hasParent && output.message?.protocolMessage?.key) {
    conn.ev.emit(
      'message.delete',
      output.message.protocolMessage.key,
    )
  }

  return output
}

/**
 * Agrega propiedades y métodos útiles a los mensajes de Baileys.
 */
export function serialize() {
  if (isSerialized) return

  isSerialized = true

  Object.defineProperties(proto.WebMessageInfo.prototype, {
    conn: {
      value: null,
      writable: true,
      enumerable: false,
      configurable: true,
    },

    id: {
      get() {
        return this.key?.id || ''
      },
      enumerable: true,
      configurable: true,
    },

    isBaileys: {
      get() {
        return (
          this.id.startsWith('3EB0') ||
          this.id.length === 16
        )
      },
      enumerable: true,
      configurable: true,
    },

    chat: {
      get() {
        const groupId =
          this.message?.senderKeyDistributionMessage?.groupId

        return normalizeJid(
          this.key?.remoteJid ||
          (groupId !== 'status@broadcast' ? groupId : '') ||
          '',
        )
      },
      enumerable: true,
      configurable: true,
    },

    isGroup: {
      get() {
        return this.chat.endsWith('@g.us')
      },
      enumerable: true,
      configurable: true,
    },

    sender: {
      get() {
        const sender =
          this.key?.fromMe
            ? this.conn?.user?.id
            : this.participant ||
              this.key?.participant ||
              this.chat

        return this.conn?.decodeJid(sender) || normalizeJid(sender)
      },
      enumerable: true,
      configurable: true,
    },

    fromMe: {
      get() {
        return (
          Boolean(this.key?.fromMe) ||
          areJidsSameUser(
            normalizeJid(this.sender),
            normalizeJid(this.conn?.user?.id),
          )
        )
      },
      enumerable: true,
      configurable: true,
    },

    mtype: {
      get() {
        return getContentType(this.message) || ''
      },
      enumerable: true,
      configurable: true,
    },

    msg: {
      get() {
        return this.mtype ? this.message?.[this.mtype] || null : null
      },
      enumerable: true,
      configurable: true,
    },

    mediaMessage: {
      get() {
        const result = getMediaMessage(this.message)

        if (!result) return null

        return {
          [result.messageType]: result.message,
        }
      },
      enumerable: true,
      configurable: true,
    },

    mediaType: {
      get() {
        return this.mediaMessage
          ? Object.keys(this.mediaMessage)[0]
          : null
      },
      enumerable: true,
      configurable: true,
    },

    text: {
      get() {
        return getMessageText(this.msg)
      },
      enumerable: true,
      configurable: true,
    },

    mentionedJid: {
      get() {
        return this.msg?.contextInfo?.mentionedJid || []
      },
      enumerable: true,
      configurable: true,
    },

    pushName: {
      get() {
        return this.pushName || this.name || ''
      },
      set(value) {
        this._pushName = value
      },
      enumerable: true,
      configurable: true,
    },

    name: {
      get() {
        return (
          this._pushName ||
          this.conn?.getName(this.sender) ||
          ''
        )
      },
      enumerable: true,
      configurable: true,
    },

    quoted: {
      get() {
        return createQuotedMessage(
          this,
          this.msg?.contextInfo,
        )
      },
      enumerable: true,
      configurable: true,
    },

    download: {
      value(saveToFile = false) {
        if (!this.mediaMessage || !this.mediaType) {
          return null
        }

        return this.conn?.downloadM(
          this.mediaMessage[this.mediaType],
          this.mediaType.replace(/Message$/i, ''),
          saveToFile,
        )
      },
      enumerable: true,
      configurable: true,
    },

    reply: {
      value(text, chatId = this.chat, options = {}) {
        return this.conn?.reply(
          chatId,
          text,
          this,
          options,
        )
      },
      enumerable: true,
      configurable: true,
    },

    react: {
      value(text) {
        return this.conn?.sendMessage(this.chat, {
          react: {
            text,
            key: this.key,
          },
        })
      },
      enumerable: true,
      configurable: true,
    },

    delete: {
      value() {
        return this.conn?.sendMessage(this.chat, {
          delete: this.key,
        })
      },
      enumerable: true,
      configurable: true,
    },

    copy: {
      value() {
        return smsg(
          this.conn,
          proto.WebMessageInfo.fromObject(
            proto.WebMessageInfo.toObject(this),
          ),
        )
      },
      enumerable: true,
      configurable: true,
    },

    forward: {
      value(jid, force = false, options = {}) {
        return this.conn?.sendMessage(
          jid,
          {
            forward: this,
            force,
            ...options,
          },
          options,
        )
      },
      enumerable: true,
      configurable: true,
    },

    copyNForward: {
      value(jid, forceForward = false, options = {}) {
        return this.conn?.copyNForward(
          jid,
          this,
          forceForward,
          options,
        )
      },
      enumerable: true,
      configurable: true,
    },

    cMod: {
      value(
        jid,
        text = '',
        sender = this.sender,
        options = {},
      ) {
        return this.conn?.cMod(
          jid,
          this,
          text,
          sender,
          options,
        )
      },
      enumerable: true,
      configurable: true,
    },

    getQuotedObj: {
      value() {
        return this.quoted
      },
      enumerable: true,
      configurable: true,
    },

    getQuotedMessage: {
      get() {
        return this.getQuotedObj()
      },
      enumerable: true,
      configurable: true,
    },
  })
}

/**
 * Compara un valor con una lista de opciones.
 *
 * @param {*} check Valor que se quiere comprobar.
 * @param {Array} input Valores esperados.
 * @param {Array} output Resultados correspondientes.
 * @returns {*|null}
 */
export function logic(check, input, output) {
  if (input.length !== output.length) {
    throw new Error(
      'Las listas de entrada y salida deben tener la misma longitud.',
    )
  }

  for (let index = 0; index < input.length; index += 1) {
    if (isDeepStrictEqual(check, input[index])) {
      return output[index]
    }
  }

  return null
}

/**
 * Añade utilidades de compatibilidad usadas por plugins antiguos.
 */
export function protoType() {
  if (!Buffer.prototype.toArrayBufferV2) {
    Buffer.prototype.toArrayBufferV2 = function toArrayBufferV2() {
      return this.buffer.slice(
        this.byteOffset,
        this.byteOffset + this.byteLength,
      )
    }
  }

  if (!ArrayBuffer.prototype.toBuffer) {
    ArrayBuffer.prototype.toBuffer = function toBuffer() {
      return Buffer.from(this)
    }
  }

  if (!Uint8Array.prototype.getFileType) {
    Uint8Array.prototype.getFileType = async function getFileType() {
      return fileTypeFromBuffer(Buffer.from(this))
    }
  }

  if (!String.prototype.isNumber) {
    String.prototype.isNumber = isNumber
    Number.prototype.isNumber = isNumber
  }

  if (!String.prototype.capitalize) {
    String.prototype.capitalize = function capitalize() {
      return this.charAt(0).toUpperCase() + this.slice(1)
    }
  }

  if (!String.prototype.capitalizeV2) {
    String.prototype.capitalizeV2 = function capitalizeV2() {
      return this.split(' ')
        .map((word) => word.capitalize())
        .join(' ')
    }
  }

  if (!String.prototype.decodeJid) {
    String.prototype.decodeJid = function decodeJidString() {
      return normalizeJid(this.toString())
    }
  }

  if (!Number.prototype.toTimeString) {
    Number.prototype.toTimeString = function toTimeString() {
      const totalSeconds = Math.floor(Number(this) / 1000)

      const days = Math.floor(totalSeconds / 86400)
      const hours = Math.floor((totalSeconds % 86400) / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      return [
        days ? `${days} día(s)` : '',
        hours ? `${hours} hora(s)` : '',
        minutes ? `${minutes} minuto(s)` : '',
        seconds ? `${seconds} segundo(s)` : '',
      ]
        .filter(Boolean)
        .join(' ')
    }
  }

  if (!Array.prototype.getRandom) {
    Array.prototype.getRandom = getRandom
    String.prototype.getRandom = getRandom
    Number.prototype.getRandom = getRandom
  }
}

protoType()
serialize()

export default {
  makeWASocket,
  smsg,
  serialize,
  logic,
  protoType,
}

