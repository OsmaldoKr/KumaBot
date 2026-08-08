import { sticker } from '../lib/sticker.js'

const greetingGifs = [
  'https://media.tenor.com/FJzcVnWgHjgAAAAM/wave.gif',
  'https://media.tenor.com/DDnp-TLMTWQAAAAC/hello-anime.gif',
  'https://media.tenor.com/MmTMEtRSIOUAAAAC/nijima-ibuki-d4dj-first-mix.gif'
]

const hugGifs = [
  'https://media.tenor.com/8Q3YjI5M6QkAAAAC/anime-hug.gif',
  'https://media.tenor.com/jU9VxIt6fWIAAAAC/anime-hug.gif',
  'https://media.tenor.com/8uCZwUEQnWEAAAAC/anime-hug.gif'
]

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function getTargetJid(m) {
  if (m.mentionedJid?.[0]) return m.mentionedJid[0]
  if (m.quoted?.sender) return m.quoted.sender
  return null
}

function formatDate(timestamp) {
  if (!timestamp) return 'No disponible'

  return new Date(Number(timestamp) * 1000)
    .toLocaleString('es-NI')
}

async function requireAdmin(m, conn, isAdmin, isOwner, isROwner) {
  if (isAdmin || isOwner || isROwner) return true

  await global.dfail('admin', m, conn)
  return false
}

const handler = async (
  m,
  {
    conn,
    command,
    usedPrefix,
    text,
    participants,
    groupMetadata,
    isAdmin,
    isOwner,
    isROwner
  }
) => {
  const normalizedCommand = command.toLowerCase()

  const isGroupInfo = /^(infogrupo|gro?upinfo|info(gro?up|gc))$/i.test(
    normalizedCommand
  )

  const isAdmins = /^(admins|@admins|dmins)$/i.test(
    normalizedCommand
  )

  const isGroupLink = /^(enlace|link(gro?up)?)$/i.test(
    normalizedCommand
  )

  const isInspect = /^(inspect|inspeccionar|revisar)$/i.test(
    normalizedCommand
  )

  const isGreet = normalizedCommand === 'saludar'
  const isHug = normalizedCommand === 'abrazar'

  try {
    if (isGroupInfo) {
      const image = await conn
        .profilePictureUrl(m.chat, 'image')
        .catch(() => null)

      const admins = participants.filter(
        (participant) => participant.admin
      )

      const owner =
        groupMetadata.owner ||
        admins.find(
          (participant) => participant.admin === 'superadmin'
        )?.id ||
        'No disponible'

      const adminList = admins.length
        ? admins
            .map(
              (admin, index) =>
                `${index + 1}. @${admin.id.split('@')[0]}`
            )
            .join('\n')
        : 'No hay administradores detectados.'

      const info = [
        '╭─〔 *INFORMACIÓN DEL GRUPO* 〕',
        `├ ID: ${groupMetadata.id || m.chat}`,
        `├ Nombre: ${groupMetadata.subject || 'Sin nombre'}`,
        `├ Participantes: ${participants.length}`,
        `├ Creador: ${owner === 'No disponible' ? owner : `@${owner.split('@')[0]}`}`,
        `├ Descripción: ${groupMetadata.desc || 'Sin descripción'}`,
        '├─ *Administradores*',
        adminList,
        '╰──────────────'
      ].join('\n')

      return conn.sendFile(
        m.chat,
        image || global.sharkImg?.getRandom?.(),
        'grupo.jpg',
        info,
        m,
        false,
        {
          mentions: [
            ...admins.map((admin) => admin.id),
            ...(owner === 'No disponible' ? [] : [owner])
          ]
        }
      )
    }

    if (isAdmins) {
      const admins = participants.filter(
        (participant) => participant.admin
      )

      if (!admins.length) {
        return m.reply('No se encontraron administradores.')
      }

      const extraMessage = text
        ? `\n\n📢 ${text}`
        : ''

      const adminList = admins
        .map(
          (admin, index) =>
            `${index + 1}. @${admin.id.split('@')[0]}`
        )
        .join('\n')

      return conn.sendMessage(
        m.chat,
        {
          text: `👑 *Administradores del grupo*\n\n${adminList}${extraMessage}`,
          mentions: admins.map((admin) => admin.id)
        },
        { quoted: m }
      )
    }

    if (isGroupLink) {
      if (!await requireAdmin(m, conn, isAdmin, isOwner, isROwner)) {
        return
      }

      const inviteCode = await conn.groupInviteCode(m.chat)

      return m.reply(
        `🔗 *Enlace del grupo:*\n\nhttps://chat.whatsapp.com/${inviteCode}`
      )
    }

    if (isInspect) {
      const match = text.match(
        /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i
      )

      const inviteCode = match?.[1]

      if (!inviteCode) {
        return m.reply(
          `Uso: ${usedPrefix}${command} https://chat.whatsapp.com/...`
        )
      }

      const info = await conn.groupGetInviteInfo(inviteCode)

      const result = [
        '╭─〔 *INSPECCIÓN DE GRUPO* 〕',
        `├ ID: ${info.id || 'No disponible'}`,
        `├ Nombre: ${info.subject || 'No disponible'}`,
        `├ Creado: ${formatDate(info.creation)}`,
        `├ Participantes: ${info.size || 'No disponible'}`,
        `├ Descripción: ${info.desc || 'Sin descripción'}`,
        '╰──────────────'
      ].join('\n')

      return conn.sendFile(
        m.chat,
        info.descOwner
          ? await conn.profilePictureUrl(info.id, 'image').catch(
              () => global.sharkImg?.getRandom?.()
            )
          : global.sharkImg?.getRandom?.(),
        'grupo-inspeccion.jpg',
        result,
        m
      )
    }

    if (isGreet || isHug) {
      const target = getTargetJid(m)

      if (!target) {
        return m.reply(
          `Menciona o responde a una persona.\n\nEjemplo: ${usedPrefix}${command} @usuario`
        )
      }

      if (target === m.sender) {
        return m.reply('No puedes usar este comando contigo mismo.')
      }

      const senderName = await conn.getName(m.sender)
      const targetName = await conn.getName(target)

      const action = isGreet ? 'saludando a' : 'abrazando a'
      const emoji = isGreet ? '👋' : '🤗'
      const gif = randomItem(
        isGreet ? greetingGifs : hugGifs
      )

      const stickerBuffer = await sticker(
        null,
        gif,
        `${senderName} está ${action} ${targetName}`
      )

      await conn.sendFile(
        m.chat,
        stickerBuffer,
        'interaccion.webp',
        '',
        m,
        true
      )

      return conn.sendMessage(
        m.chat,
        {
          text: `${emoji} @${m.sender.split('@')[0]} está ${action} @${target.split('@')[0]}.`,
          mentions: [m.sender, target]
        },
        { quoted: m }
      )
    }
  } catch (error) {
    console.error(`Error en ${command}:`, error)

    return m.reply(
      'No se pudo procesar el comando. Revisa que KumaBot tenga los permisos necesarios.'
    )
  }
}

handler.command = /^(infogrupo|gro?upinfo|info(gro?up|gc)|admins|@admins|dmins|enlace|link(gro?up)?|inspect|inspeccionar|revisar|saludar|abrazar)$/i

handler.group = true
handler.register = true

export default handler
