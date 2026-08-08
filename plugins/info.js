import os from 'node:os'
import { performance } from 'node:perf_hooks'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

function languageText(key, fallback, ...args) {
  try {
    return global.lenguajeGB?.[key]?.(...args) || fallback
  } catch {
    return fallback
  }
}

function formatBytes(bytes = 0) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']

  if (!bytes) return '0 B'

  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / (1024 ** index)

  return `${value.toFixed(2)} ${units[index]}`
}

function formatUptime(seconds = process.uptime()) {
  const total = Math.floor(seconds)

  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainingSeconds = total % 60

  return [
    `${days}d`,
    `${String(hours).padStart(2, '0')}h`,
    `${String(minutes).padStart(2, '0')}m`,
    `${String(remainingSeconds).padStart(2, '0')}s`
  ].join(' ')
}

function getRandomImage() {
  if (Array.isArray(global.sharkImg) && global.sharkImg.length) {
    return global.sharkImg.getRandom?.() || global.sharkImg[0]
  }

  return global.imagen1 || null
}

function getOwners() {
  return (global.owner || [])
    .filter(([number]) => number)
    .map(([number, name, isDeveloper]) => ({
      jid: `${String(number).replace(/\D/g, '')}@s.whatsapp.net`,
      number: String(number).replace(/\D/g, ''),
      name: name || 'Propietario',
      isDeveloper: Boolean(isDeveloper)
    }))
}

function getSystemInformation() {
  const memory = process.memoryUsage()

  return {
    platform: `${os.platform()} ${os.release()}`,
    hostname: os.hostname(),
    architecture: os.arch(),
    totalMemory: formatBytes(os.totalmem()),
    freeMemory: formatBytes(os.freemem()),
    usedMemory: formatBytes(os.totalmem() - os.freemem()),
    processMemory: Object.entries(memory)
      .map(([key, value]) => `${key}: ${formatBytes(value)}`)
      .join('\n')
  }
}

async function getPackageInfo(dirname) {
  try {
    const raw = await readFile(
      join(dirname, '../package.json'),
      'utf8'
    )

    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function reportError(m, error, usedPrefix, command) {
  console.error(`Error en ${command}:`, error)

  await m.react(global.notsent || '❗').catch(() => {})

  return m.reply(
    [
      languageText(
        'smsMalError3',
        'Ocurrió un error al procesar el comando.'
      ),
      '',
      `Puedes reportarlo con: ${usedPrefix}reporte ${command}`
    ].join('\n')
  )
}

const handler = async (
  m,
  {
    conn,
    command,
    usedPrefix,
    args,
    text,
    __dirname,
    isOwner,
    isROwner
  }
) => {
  const normalizedCommand = command.toLowerCase()

  const isStatus = /^(estado|status|estate|state|stado|stats|botstatus)$/i.test(
    normalizedCommand
  )

  const isOfficialAccounts = /^(cuentasoficiales|sharkig|cuentassk|accountssk|igshark|cuentasshark)$/i.test(
    normalizedCommand
  )

  const isOfficialGroups = /^(kumabotgroups|gruposoficiales|gruposk|groupssk|kumabotgroups|grupos)$/i.test(
    normalizedCommand
  )

  const isInstall = /^(instalarbot|procesobot|botinstall|installbot)$/i.test(
    normalizedCommand
  )

  const isOwnerInfo = /^(owner|creator|propietario|dueño|dueña|propietaria|creadora|creador)$/i.test(
    normalizedCommand
  )

  const isGroupList = /^(grouplist|listagrupos|grupolista)$/i.test(
    normalizedCommand
  )

  const isBotInfo = /^(infobot|informacionbot)$/i.test(
    normalizedCommand
  )

  const isContacts = /^(contacto|contactos|contacts)$/i.test(
    normalizedCommand
  )

  const isPing = /^(ping|speed|velocidad|rapidez|velocity)$/i.test(
    normalizedCommand
  )

  const isReport = /^(report|request|reporte|bugs|bug|reportowner|reportes|reportar)$/i.test(
    normalizedCommand
  )

  try {
    if (isStatus) {
      const users = global.db.data.users || {}
      const chats = global.db.data.chats || {}

      const totalUsers = Object.keys(users).length
      const registeredUsers = Object.values(users)
        .filter((user) => user.registered)
        .length

      const bannedUsers = Object.values(users)
        .filter((user) => user.banned)
        .length

      const bannedChats = Object.values(chats)
        .filter((chat) => chat.isBanned)
        .length

      const status = [
        '╭─〔 *ESTADO DE KUMABOT* 〕',
        `├ Versión: ${global.vs || '1.0.0'}`,
        `├ Usuarios: ${totalUsers}`,
        `├ Registrados: ${registeredUsers}/${totalUsers}`,
        `├ Usuarios prohibidos: ${bannedUsers}`,
        `├ Grupos bloqueados: ${bannedChats}`,
        `├ Tiempo activo: ${formatUptime()}`,
        '╰──────────────'
      ].join('\n')

      return conn.sendFile(
        m.chat,
        getRandomImage(),
        'kumabot-estado.jpg',
        status,
        m
      )
    }

    if (isOfficialAccounts) {
      const accounts = [
        `GitHub: ${global.md || 'No configurado'}`,
        `Instagram: ${global.ig || 'No configurado'}`,
        `YouTube: ${global.yt || 'No configurado'}`,
        `Contacto: ${global.asistencia || 'No configurado'}`
      ].join('\n\n')

      return conn.sendFile(
        m.chat,
        getRandomImage(),
        'kumabot-redes.jpg',
        `🌐 *Cuentas oficiales de KumaBot*\n\n${accounts}`,
        m
      )
    }

    if (isOfficialGroups) {
      const groupLinks = [
        global.nna,
        ...(global.redesMenu || [])
      ]
        .filter((link) => /chat\.whatsapp\.com/i.test(link))
        .filter((link, index, list) => list.indexOf(link) === index)

      if (!groupLinks.length) {
        return m.reply(
          'No hay grupos oficiales configurados actualmente.'
        )
      }

      return m.reply(
        `👥 *Grupos oficiales de KumaBot*\n\n${groupLinks
          .map((link, index) => `${index + 1}. ${link}`)
          .join('\n')}`
      )
    }

    if (isInstall) {
      const termux = [
        '*📱 INSTALACIÓN EN TERMUX*',
        '```bash',
        'pkg update -y',
        'pkg install -y git nodejs ffmpeg imagemagick',
        `git clone ${global.md || 'https://github.com/OsmaldoKr/KumaBot'}`,
        'cd KumaBot',
        'npm install',
        'npm start',
        '```'
      ].join('\n')

      const windows = [
        '*💻 INSTALACIÓN EN WINDOWS*',
        '1. Instala Node.js, Git, FFmpeg e ImageMagick.',
        `2. Clona el repositorio: ${global.md || 'No configurado'}`,
        '3. Ejecuta npm install',
        '4. Ejecuta npm start'
      ].join('\n')

      return m.reply(`${termux}\n\n${windows}`)
    }

    if (isOwnerInfo) {
      const owners = getOwners()

      const text = [
        '👑 *Propietarios de KumaBot*',
        '',
        ...owners.map(
          (owner, index) =>
            `${index + 1}. ${owner.name}\n   wa.me/${owner.number}`
        )


      ].join('\n')

      return conn.sendFile(
        m.chat,
        getRandomImage(),
        'kumabot-owner.jpg',
        text,
        m,
        false,
        {
          mentions: owners.map((owner) => owner.jid)
        }
      )


      if (isGroupList) {
        if (!isROwner) {
          await global.dfail('rowner', m, conn)
          return
        }

        const groups = Object.values(
          await conn.groupFetchAllParticipating()
        )

        const output = [
          `📋 *Grupos de KumaBot: ${groups.length}*`,
          '',
          ...groups.map(
            (group, index) =>
              [
                `${index + 1}. *${group.subject || 'Sin nombre'}*`,
                `ID: ${group.id}`,
                `Participantes: ${group.participants?.length || 0}`
              ].join('\n')
          )
        ].join('\n\n')

        return m.reply(output.slice(0, 60000))
      }

      if (isBotInfo) {
        const packageInfo = await getPackageInfo(__dirname)
        const chats = Object.entries(conn.chats || {})

        const groupCount = chats.filter(
          ([jid]) => jid.endsWith('@g.us')
        ).length

        const privateCount = chats.filter(
          ([jid]) =>
            jid.endsWith('@s.whatsapp.net') &&
            !jid.includes('status')
        ).length

        const info = [
          '╭─〔 *INFORMACIÓN DE KUMABOT* 〕',
          `├ Nombre: ${global.sk || packageInfo.name || 'KumaBot'}`,
          `├ Versión: ${global.vs || packageInfo.version || '1.0.0'}`,
          `├ Prefijo: ${usedPrefix}`,
          `├ Tiempo activo: ${formatUptime()}`,
          `├ Chats privados: ${privateCount}`,
          `├ Grupos: ${groupCount}`,
          `├ Usuarios: ${Object.keys(global.db.data.users || {}).length}`,
          '╰──────────────'
        ].join('\n')

        return conn.sendFile(
          m.chat,
          getRandomImage(),
          'kumabot-info.jpg',
          info,
          m
        )
      }

      if (isContacts) {
        const owners = getOwners()

        if (!owners.length) {
          return m.reply('No hay contactos oficiales configurados.')
        }

        const contactText = [
          '📞 *Contactos oficiales*',
          '',
          ...owners.map(
            (owner) => `• ${owner.name}: wa.me/${owner.number}`
          )
        ].join('\n')

        return m.reply(contactText)
      }

      if (isPing) {
        const start = performance.now()
        const system = getSystemInformation()
        const end = performance.now()

        const ping = [
          '🏓 *KumaBot responde correctamente*',
          '',
          `Tiempo de respuesta: ${(end - start).toFixed(2)} ms`,
          `Sistema: ${system.platform}`,
          `Arquitectura: ${system.architecture}`,
          `Equipo: ${system.hostname}`,
          `RAM usada: ${system.usedMemory}/${system.totalMemory}`,
          `RAM libre: ${system.freeMemory}`,
          '',
          '*Memoria del proceso*',
          '```',
          system.processMemory,
          '```'
        ].join('\n')

        return conn.sendFile(
          m.chat,
          getRandomImage(),
          'kumabot-ping.jpg',
          ping,
          m
        )
      }

      if (isReport) {
        if (!text) {
          return m.reply(
            `Uso: ${usedPrefix}${command} Describe el error o sugerencia.`
          )
        }

        if (text.length < 8) {
          return m.reply(
            'El reporte debe tener al menos 8 caracteres.'
          )
        }

        if (text.length > 1000) {
          return m.reply(
            'El reporte no puede superar 1000 caracteres.'
          )
        }

        const senderNumber = m.sender.split('@')[0]
        const developers = getOwners()
          .filter((owner) => owner.isDeveloper)

        if (!developers.length) {
          return m.reply(
            'No hay desarrolladores configurados para recibir reportes.'
          )
        }

        const report = [
          '📩 *Nuevo reporte de KumaBot*',
          `Usuario: @${senderNumber}`,
          `Chat: ${m.chat}`,
          '',
          text
        ].join('\n')

        for (const developer of developers) {
          await conn.sendMessage(
            developer.jid,
            {
              text: report,
              mentions: [m.sender]
            }
          ).catch((error) => {
            console.error(
              `No se pudo enviar el reporte a ${developer.number}:`,
              error.message
            )
          })
        }

        return m.reply(
          '✅ Tu reporte fue enviado a los desarrolladores de KumaBot.'
        )
      }
    }

    handler.command = /^(estado|status|estate|state|stado|stats|botstatus|cuentasoficiales|sharkig|cuentassk|accountssk|igshark|cuentasshark|kumabotgroups|gruposoficiales|gruposk|groupssk|grupos|instalarbot|procesobot|botinstall|installbot|owner|creator|propietario|dueño|dueña|propietaria|creadora|creador|grouplist|listagrupos|grupolista|infobot|informacionbot|contacto|contactos|contacts|ping|speed|velocidad|rapidez|velocity|report|request|reporte|bugs|bug|reportowner|reportes|reportar)$/i

    export default handler
  } catch (error) {
    return reportError(m, error, usedPrefix, command)
  }
}
