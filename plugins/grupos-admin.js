function getTargetJid(m, text = '') {
  if (m.mentionedJid?.[0]) {
    return m.mentionedJid[0]
  }

  if (m.quoted?.sender) {
    return m.quoted.sender
  }

  const number = text.replace(/\D/g, '')

  return number
    ? `${number}@s.whatsapp.net`
    : null
}

function languageText(key, fallback, ...args) {
  try {
    return global.lenguajeGB?.[key]?.(...args) || fallback
  } catch {
    return fallback
  }
}

function isOwnerJid(jid) {
  const number = jid?.split('@')[0]

  return (global.owner || []).some(
    ([ownerNumber]) => String(ownerNumber) === number
  )
}

async function requireAdmin(m, conn, isAdmin, isOwner, isROwner) {
  if (isAdmin || isOwner || isROwner) return true

  await global.dfail('admin', m, conn)
  return false
}

async function requireOwner(m, conn, isROwner) {
  if (isROwner) return true

  await global.dfail('rowner', m, conn)
  return false
}

async function requireBotAdmin(m, conn, isBotAdmin) {
  if (isBotAdmin) return true

  await global.dfail('botAdmin', m, conn)
  return false
}

function resultMessage(action, target) {
  const number = target.split('@')[0]

  const messages = {
    promote: `✅ @${number} ahora es administrador(a).`,
    demote: `✅ @${number} ya no es administrador(a).`,
    remove: `✅ @${number} fue eliminado(a) del grupo.`,
    add: `✅ @${number} fue agregado(a) al grupo.`
  }

  return messages[action] || '✅ Acción realizada.'
}

const handler = async (
  m,
  {
    conn,
    text,
    usedPrefix,
    command,
    args,
    isOwner,
    isAdmin,
    isROwner,
    isBotAdmin,
    participants,
    groupMetadata
  }
) => {
  if (!m.isGroup) {
    return m.reply('Este comando solo puede utilizarse dentro de un grupo.')
  }

  const chat = global.db.data.chats[m.chat] || {}
  const botJid = conn.user.jid

  global.db.data.settings[botJid] ||= {}

  const botSettings = global.db.data.settings[botJid]
  const normalizedCommand = command.toLowerCase()

  const isPromote = /^(promote|daradmin|darpoder)$/i.test(normalizedCommand)
  const isDemote = /^(demote|quitarpoder|quitaradmin)$/i.test(normalizedCommand)
  const isSetWelcome = /^(setwelcome|bienvenida|edit(?:ar)?welcome?)$/i.test(
    normalizedCommand
  )
  const isSetBye = /^(setbye|despedida|edit(?:ar)?bye?)$/i.test(
    normalizedCommand
  )
  const isSetDescription = /^(setdesk|setdesc|newdesc|descripción|descripcion|cambiardesc)$/i.test(
    normalizedCommand
  )
  const isSetName = /^(setname|newnombre|nuevonombre|cambiarnombre)$/i.test(
    normalizedCommand
  )
  const isSetPicture = /^(setpp(group|grup|gc)?|cambiarpp)$/i.test(
    normalizedCommand
  )
  const isRevokeLink = /^(nuevolink|nuevoenlace|revoke|resetlink)$/i.test(
    normalizedCommand
  )
  const isKick = /^(kick|echar|hechar|sacar|ban)$/i.test(
    normalizedCommand
  )
  const isGroupMode = /^(group|grupo)$/i.test(
    normalizedCommand
  )
  const isTagAll = /^(tagall|invocar|invocacion|todos|invocación)$/i.test(
    normalizedCommand
  )
  const isBanUser = /^(prohibir|prohibit|privar|deprive)$/i.test(
    normalizedCommand
  )
  const isAdd = /^(add|agregar|invitar|invite|añadir)$/i.test(
    normalizedCommand
  )

  try {
    if (isPromote || isDemote) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) return
      if (!await requireBotAdmin(m, conn, isBotAdmin)) return

      const target = getTargetJid(m, text)

      if (!target) {
        return m.reply(
          `Menciona, responde o escribe un número.\n\nEjemplo: ${usedPrefix}${command} @usuario`
        )
      }

      if (target === botJid) {
        return m.reply('No puedo cambiar mis propios permisos.')
      }

      const action = isPromote ? 'promote' : 'demote'

      const result = await conn.groupParticipantsUpdate(
        m.chat,
        [target],
        action
      )

      const status = result?.[0]?.status

      if (status && status !== '200') {
        throw new Error(`WhatsApp devolvió el estado ${status}.`)
      }

      return conn.sendMessage(
        m.chat,
        {
          text: resultMessage(action, target),
          mentions: [target]
        },
        { quoted: m }
      )
    }

    if (isSetWelcome) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) return

      if (!text) {
        return m.reply(
          [
            'Escribe el mensaje de bienvenida.',
            '',
            `Ejemplo: ${usedPrefix}${command} ¡Bienvenido(a), @user a @subject!`,
            '',
            'Variables disponibles:',
            '@user · @subject · @desc'
          ].join('\n')
        )
      }

      chat.sWelcome = text

      return m.reply('✅ Mensaje de bienvenida actualizado.')
    }

    if (isSetBye) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) return

      if (!text) {
        return m.reply(
          [
            'Escribe el mensaje de despedida.',
            '',
            `Ejemplo: ${usedPrefix}${command} Adiós, @user.`
          ].join('\n')
        )
      }

      chat.sBye = text

      return m.reply('✅ Mensaje de despedida actualizado.')
    }

    if (isSetDescription) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) return
      if (!await requireBotAdmin(m, conn, isBotAdmin)) return

      if (!text) {
        return m.reply(
          `Uso: ${usedPrefix}${command} Nueva descripción del grupo`
        )
      }

      await conn.groupUpdateDescription(m.chat, text)

      return m.reply('✅ Descripción del grupo actualizada.')
    }

    if (isSetName) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) return
      if (!await requireBotAdmin(m, conn, isBotAdmin)) return

      if (!text) {
        return m.reply(
          `Uso: ${usedPrefix}${command} Nuevo nombre del grupo`
        )
      }

      await conn.groupUpdateSubject(m.chat, text)

      return m.reply('✅ Nombre del grupo actualizado.')
    }

    if (isSetPicture) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) return
      if (!await requireBotAdmin(m, conn, isBotAdmin)) return

      const quoted = m.quoted || m
      const mime = quoted.mimetype || quoted.mediaType || ''

      if (!/image/i.test(mime)) {
        return m.reply(
          'Responde a una imagen para usarla como foto del grupo.'
        )
      }

      const image = await quoted.download()

      if (!image) {
        return m.reply('No se pudo descargar la imagen.')
      }

      await conn.updateProfilePicture(m.chat, image)

      return m.reply('✅ Foto del grupo actualizada.')
    }

    if (isRevokeLink) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) return
      if (!await requireBotAdmin(m, conn, isBotAdmin)) return

      const inviteCode = await conn.groupRevokeInvite(m.chat)
      const link = `https://chat.whatsapp.com/${inviteCode}`

      return m.reply(
        `✅ Enlace renovado.\n\nNuevo enlace:\n${link}`
      )
    }

    if (isKick) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) return
      if (!await requireBotAdmin(m, conn, isBotAdmin)) return

      if (!botSettings.restrict) {
        return m.reply(
          'La opción restringir está desactivada. El propietario debe activarla con #on restringir.'
        )
      }

      const target = getTargetJid(m, text)

      if (!target) {
        return m.reply(
          `Menciona o responde al usuario.\n\nEjemplo: ${usedPrefix}${command} @usuario`
        )
      }

      if (target === botJid) {
        return m.reply('No puedo eliminarme a mí mismo.')
      }

      if (isOwnerJid(target)) {
        return m.reply('No se puede expulsar a un propietario del bot.')
      }

      const result = await conn.groupParticipantsUpdate(
        m.chat,
        [target],
        'remove'
      )

      const status = result?.[0]?.status

      if (status && status !== '200') {
        throw new Error(`No se pudo eliminar al usuario. Estado: ${status}`)
      }

      return conn.sendMessage(
        m.chat,
        {
          text: resultMessage('remove', target),
          mentions: [target]
        },
        { quoted: m }
      )
    }

    if (isGroupMode) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) return
      if (!await requireBotAdmin(m, conn, isBotAdmin)) return

      const mode = (args[0] || '').toLowerCase()

      const modes = {
        open: 'not_announcement',
        abrir: 'not_announcement',
        close: 'announcement',
        cerrar: 'announcement'
      }

      const setting = modes[mode]

      if (!setting) {
        return m.reply(
          [
            'Uso:',
            `${usedPrefix}${command} abrir`,
            `${usedPrefix}${command} cerrar`
          ].join('\n')
        )
      }

      await conn.groupSettingUpdate(m.chat, setting)

      return m.reply(
        setting === 'announcement'
          ? '✅ Grupo cerrado: solo los administradores pueden enviar mensajes.'
          : '✅ Grupo abierto: todos pueden enviar mensajes.'
      )
    }

    if (isTagAll) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) return

      if (!text) {
        return m.reply(
          `Uso: ${usedPrefix}${command} Mensaje para todos`
        )
      }

      const users = participants
        .map((participant) => conn.decodeJid(participant.id))
        .filter(Boolean)

      const mentions = users
        .map((jid) => `@${jid.split('@')[0]}`)
        .join('\n')

      return conn.sendMessage(
        m.chat,
        {
          text: `📢 *Aviso para todos*\n\n${text}\n\n${mentions}`,
          mentions: users
        },
        { quoted: m }
      )
    }

    if (isBanUser) {
      if (!await requireOwner(m, conn, isROwner)) return

      const target = getTargetJid(m, text)

      if (!target) {
        return m.reply(
          `Menciona o responde al usuario.\n\nEjemplo: ${usedPrefix}${command} @usuario`
        )
      }

      if (target === botJid || isOwnerJid(target)) {
        return m.reply('No se puede prohibir al bot ni a sus propietarios.')
      }

      global.db.data.users[target] ||= {}

      global.db.data.users[target].banned = true
      global.db.data.users[target].BannedReason =
        `Prohibido por ${m.sender.split('@')[0]}`

      await conn.sendMessage(
        m.chat,
        {
          text: `🚫 @${target.split('@')[0]} fue prohibido de KumaBot.`,
          mentions: [target]
        },
        { quoted: m }
      )

      await conn.sendMessage(
        target,
        {
          text: '🚫 Has sido prohibido del uso de KumaBot.'
        }
      ).catch(() => {})

      return
    }

    if (isAdd) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) return
      if (!await requireBotAdmin(m, conn, isBotAdmin)) return

      if (!botSettings.restrict) {
        return m.reply(
          'La opción restringir está desactivada. El propietario debe activarla con #on restringir.'
        )
      }

      const target = getTargetJid(m, text)

      if (!target) {
        return m.reply(
          `Uso: ${usedPrefix}${command} 50512345678`
        )
      }

      const result = await conn.groupParticipantsUpdate(
        m.chat,
        [target],
        'add'
      )

      const status = result?.[0]?.status

      if (status === '200' || !status) {
        return conn.sendMessage(
          m.chat,
          {
            text: resultMessage('add', target),
            mentions: [target]
          },
          { quoted: m }
        )
      }

      const inviteCode = await conn.groupInviteCode(m.chat)
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`

      return m.reply(
        `No se pudo agregar a @${target.split('@')[0]} directamente.\n\nComparte este enlace de invitación con esa persona:\n${inviteLink}`
      )
    }
  } catch (error) {
    console.error(`Error en ${command}:`, error)

    return m.reply(
      `${languageText('smsMalError3', 'Ocurrió un error.')}\nNo se pudo completar la acción solicitada.`
    )
  }
}

handler.command = /^(promote|daradmin|darpoder|demote|quitarpoder|quitaradmin|setwelcome|bienvenida|edit(?:ar)?wel(?:come)?|setbye|despedida|edit(?:ar)?bye?|setdesk|setdesc|newdesc|descripción|descripcion|cambiardesc|setname|newnombre|nuevonombre|cambiarnombre|cambiarpp|setpp(group|grup|gc)?|nuevolink|nuevoenlace|revoke|resetlink|kick|echar|hechar|sacar|ban|group|grupo|tagall|invocar|invocacion|todos|invocación|prohibir|prohibit|privar|deprive|add|agregar|invitar|invite|añadir)$/i

handler.group = true
handler.register = true

export default handler
