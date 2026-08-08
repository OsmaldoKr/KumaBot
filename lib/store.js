import {
  BufferJSON,
  initAuthCreds,
  proto,
} from '@whiskeysockets/baileys'

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'

import { dirname } from 'node:path'

const KEY_MAP = {
  'pre-key': 'preKeys',
  session: 'sessions',
  'sender-key': 'senderKeys',
  'app-state-sync-key': 'appStateSyncKeys',
  'app-state-sync-version': 'appStateVersions',
  'sender-key-memory': 'senderKeyMemory',
}

/**
 * Vincula los eventos de contactos, grupos y presencia al objeto de conexión.
 *
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 */
function bind(conn) {
  if (!conn.chats) {
    conn.chats = {}
  }

  function normalizeJid(jid) {
    return conn.decodeJid ? conn.decodeJid(jid) : jid
  }

  function updateNameToDb(contacts) {
    try {
      const contactList = contacts?.contacts || contacts || []

      for (const contact of contactList) {
        const id = normalizeJid(contact.id)

        if (!id || id === 'status@broadcast') continue

        const currentChat = conn.chats[id] || { id }

        conn.chats[id] = {
          ...currentChat,
          ...contact,
          id,
          ...(id.endsWith('@g.us')
            ? {
                subject:
                  contact.subject ||
                  contact.name ||
                  currentChat.subject ||
                  '',
              }
            : {
                name:
                  contact.notify ||
                  contact.name ||
                  currentChat.name ||
                  currentChat.notify ||
                  '',
              }),
        }
      }
    } catch (error) {
      console.error('Error al actualizar contactos:', error.message)
    }
  }

  conn.ev.on('contacts.upsert', updateNameToDb)
  conn.ev.on('contacts.set', updateNameToDb)
  conn.ev.on('groups.update', updateNameToDb)

  conn.ev.on('chats.set', async ({ chats = [] }) => {
    try {
      for (const chatData of chats) {
        const id = normalizeJid(chatData.id)

        if (!id || id === 'status@broadcast') continue

        const isGroup = id.endsWith('@g.us')
        const chat = conn.chats[id] || { id }

        chat.isChats = !chatData.readOnly

        if (chatData.name) {
          chat[isGroup ? 'subject' : 'name'] = chatData.name
        }

        if (isGroup) {
          const metadata = await conn.groupMetadata(id).catch(() => null)

          if (metadata) {
            chat.metadata = metadata
            chat.subject = chatData.name || metadata.subject || ''
          }
        }

        conn.chats[id] = chat
      }
    } catch (error) {
      console.error('Error al actualizar chats:', error.message)
    }
  })

  conn.ev.on(
    'group-participants.update',
    async ({ id, participants, action }) => {
      try {
        const groupId = normalizeJid(id)

        if (!groupId || groupId === 'status@broadcast') return

        const chat = conn.chats[groupId] || { id: groupId }
        chat.isChats = true

        const metadata = await conn.groupMetadata(groupId).catch(() => null)

        if (metadata) {
          chat.subject = metadata.subject || ''
          chat.metadata = metadata
        }

        chat.lastParticipantsUpdate = {
          participants,
          action,
          timestamp: Date.now(),
        }

        conn.chats[groupId] = chat
      } catch (error) {
        console.error(
          'Error al actualizar participantes del grupo:',
          error.message,
        )
      }
    },
  )

  conn.ev.on('groups.update', async (updates = []) => {
    try {
      for (const update of updates) {
        const id = normalizeJid(update.id)

        if (!id || id === 'status@broadcast' || !id.endsWith('@g.us')) {
          continue
        }

        const chat = conn.chats[id] || { id }
        chat.isChats = true

        const metadata = await conn.groupMetadata(id).catch(() => null)

        if (metadata) {
          chat.metadata = metadata
          chat.subject = update.subject || metadata.subject || ''
        } else if (update.subject) {
          chat.subject = update.subject
        }

        conn.chats[id] = chat
      }
    } catch (error) {
      console.error('Error al actualizar grupos:', error.message)
    }
  })

  conn.ev.on('chats.upsert', async (event) => {
    try {
      const chats = Array.isArray(event) ? event : event?.chats || []

      for (const chatData of chats) {
        const id = normalizeJid(chatData.id)

        if (!id || id === 'status@broadcast') continue

        conn.chats[id] = {
          ...(conn.chats[id] || {}),
          ...chatData,
          id,
          isChats: true,
        }
      }
    } catch (error) {
      console.error('Error al registrar nuevos chats:', error.message)
    }
  })

  conn.ev.on('presence.update', ({ id, presences = {} }) => {
    try {
      const sender = Object.keys(presences)[0] || id
      const senderId = normalizeJid(sender)

      if (!senderId) return

      const presenceData = presences[sender] || {}
      const presence =
        presenceData.lastKnownPresence ||
        presenceData.presences ||
        'available'

      const senderChat = conn.chats[senderId] || { id: senderId }

      senderChat.presences = presence
      conn.chats[senderId] = senderChat

      if (id?.endsWith('@g.us')) {
        conn.chats[id] = {
          ...(conn.chats[id] || {}),
          id,
          isChats: true,
        }
      }
    } catch (error) {
      console.error('Error al actualizar presencia:', error.message)
    }
  })

  return conn
}

/**
 * Crea un estado de autenticación de Baileys en un único archivo.
 *
 * No compartas ni subas este archivo a GitHub: contiene las credenciales
 * de la sesión de WhatsApp.
 *
 * @param {string} filename Ruta del archivo de sesión.
 * @param {import('pino').Logger} [logger] Logger opcional.
 * @returns {{
 *   state: object,
 *   saveState: () => void
 * }}
 */
function useSingleFileAuthState(filename, logger) {
  let creds
  let keys = {}

  if (existsSync(filename)) {
    try {
      const savedState = JSON.parse(
        readFileSync(filename, 'utf-8'),
        BufferJSON.reviver,
      )

      creds = savedState.creds || initAuthCreds()
      keys = savedState.keys || {}
    } catch (error) {
      logger?.warn(
        `No se pudo leer la sesión anterior: ${error.message}`,
      )

      creds = initAuthCreds()
      keys = {}
    }
  } else {
    creds = initAuthCreds()
  }

  function saveState() {
    logger?.trace('Guardando estado de autenticación.')

    const directory = dirname(filename)

    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true })
    }

    const temporaryFile = `${filename}.tmp`

    writeFileSync(
      temporaryFile,
      JSON.stringify({ creds, keys }, BufferJSON.replacer, 2),
      'utf-8',
    )

    renameSync(temporaryFile, filename)
  }

  return {
    state: {
      creds,

      keys: {
        get(type, ids) {
          const keyName = KEY_MAP[type]

          if (!keyName) return {}

          return ids.reduce((result, id) => {
            let value = keys[keyName]?.[id]

            if (value && type === 'app-state-sync-key') {
              value = proto.AppStateSyncKeyData.fromObject(value)
            }

            if (value) {
              result[id] = value
            }

            return result
          }, {})
        },

        set(data) {
          for (const type of Object.keys(data)) {
            const keyName = KEY_MAP[type]

            if (!keyName) continue

            keys[keyName] = keys[keyName] || {}
            Object.assign(keys[keyName], data[type])
          }

          saveState()
        },
      },
    },

    saveState,
  }
}

/**
 * Busca un mensaje previamente guardado dentro de conn.chats.
 *
 * Úsala así:
 * loadMessage.call(conn, jid, messageId)
 *
 * @param {string} jid ID del chat.
 * @param {string} id ID del mensaje.
 * @returns {object | null}
 */
function loadMessage(jid, id = null) {
  const conn = this

  if (!conn?.chats) return null

  if (!id) {
    id = jid
    jid = null
  }

  if (jid) {
    const chatId = conn.decodeJid ? conn.decodeJid(jid) : jid
    const messages = conn.chats[chatId]?.messages || []

    return messages.find((message) => message?.key?.id === id) || null
  }

  for (const chat of Object.values(conn.chats)) {
    const messages = chat?.messages || []
    const message = messages.find((item) => item?.key?.id === id)

    if (message) return message
  }

  return null
}

export default {
  bind,
  useSingleFileAuthState,
  loadMessage,
}

export {
  bind,
  useSingleFileAuthState,
  loadMessage,
}
