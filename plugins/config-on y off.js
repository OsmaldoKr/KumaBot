const ENABLE_COMMANDS = /^(on|enable|enabled|true|1)$/i

const groupSettings = {
  welcome: {
    property: 'welcome',
    aliases: ['welcome', 'bienvenida']
  },
  detect: {
    property: 'detect',
    aliases: ['detect', 'avisos', 'autodetectar']
  },
  antiver: {
    property: 'antiver',
    aliases: [
      'antiver',
      'modover',
      'modoobservar',
      'modobservar',
      'antiviewonce'
    ]
  },
  antilink: {
    property: 'antiLink',
    aliases: ['antilink', 'antienlace']
  },
  antilink2: {
    property: 'antiLink2',
    aliases: ['antilink2', 'antienlace2']
  },
  antitiktok: {
    property: 'antiTiktok',
    aliases: ['antitiktok', 'antitk', 'antitik']
  },
  antiyoutube: {
    property: 'antiYoutube',
    aliases: ['antiyoutube', 'antiyt']
  },
  antitelegram: {
    property: 'antiTelegram',
    aliases: ['antitelegram', 'antitl', 'antitele', 'antitg', 'antitel']
  },
  antifacebook: {
    property: 'antiFacebook',
    aliases: ['antifacebook', 'antifb', 'antifbook']
  },
  antiinstagram: {
    property: 'antiInstagram',
    aliases: [
      'antiinstagram',
      'antinstagram',
      'antiig',
      'antig',
      'antiinsta',
      'antinsta'
    ]
  },
  antitwitter: {
    property: 'antiTwitter',
    aliases: [
      'antitwitter',
      'antitw',
      'antitwit',
      'antitwter',
      'antitwiter'
    ]
  },
  antifake: {
    property: 'antifake',
    aliases: [
      'antiinternacional',
      'antinternacional',
      'antinternational',
      'antifake',
      'antifalsos',
      'antivirtuales',
      'antiextranjeros'
    ]
  },
  modoadmin: {
    property: 'modoadmin',
    aliases: ['modoadmin', 'modeadmin']
  },
  reaction: {
    property: 'reaction',
    aliases: [
      'reaction',
      'reaccion',
      'reacciones',
      'reaciones',
      'emojis',
      'antiemojis'
    ]
  }
}

const ownerSettings = {
  restrict: {
    property: 'restrict',
    aliases: ['restrict', 'restringir']
  },
  public: {
    property: 'public',
    aliases: ['public', 'publico']
  },
  jadibotmd: {
    property: 'jadibotmd',
    aliases: ['jadibotmd', 'modejadibot', 'serbotmd', 'modoserbot']
  },
  autoread: {
    property: 'autoread',
    aliases: ['autoread', 'autovisto']
  },
  anticall: {
    property: 'antiCall',
    aliases: ['anticall', 'antillamar', 'antillamada']
  },
  antiprivate: {
    property: 'antiPrivate',
    aliases: ['antiprivado', 'antiprivate', 'privado']
  }
}

function findSetting(settings, type) {
  return Object.values(settings).find((setting) =>
    setting.aliases.includes(type)
  )
}

function state(enabled) {
  return enabled ? '✅ Activado' : '❌ Desactivado'
}

async function deny(type, m, conn) {
  await global.dfail(type, m, conn)
  return false
}

function createMenu(prefix, chat, bot, isGroup) {
  const groupValue = (property) =>
    isGroup
      ? state(Boolean(chat[property]))
      : '🌻 Solo grupos'

  return [
    '╭─〔 *CONFIGURACIÓN DE KUMABOT* 〕',
    '│',
    '├─ *Opciones para administradores*',
    `├ ${groupValue('detect')}  ${prefix}on/off avisos`,
    `├ ${groupValue('welcome')}  ${prefix}on/off bienvenida`,
    `├ ${groupValue('antiLink')}  ${prefix}on/off antienlace`,
    `├ ${groupValue('antiLink2')}  ${prefix}on/off antienlace2`,
    `├ ${groupValue('antiTiktok')}  ${prefix}on/off antitiktok`,
    `├ ${groupValue('antiYoutube')}  ${prefix}on/off antiyoutube`,
    `├ ${groupValue('antiTelegram')}  ${prefix}on/off antitelegram`,
    `├ ${groupValue('antiFacebook')}  ${prefix}on/off antifacebook`,
    `├ ${groupValue('antiInstagram')}  ${prefix}on/off antiinstagram`,
    `├ ${groupValue('antiTwitter')}  ${prefix}on/off antitwitter`,
    `├ ${groupValue('antifake')}  ${prefix}on/off antifake`,
    `├ ${groupValue('modoadmin')}  ${prefix}on/off modoadmin`,
    `├ ${groupValue('reaction')}  ${prefix}on/off reaccion`,
    `├ ${groupValue('antiver')}  ${prefix}on/off antiver`,
    `├ ${state(!chat.delete)}  ${prefix}on/off antieliminar`,
    '│',
    '├─ *Opciones exclusivas del dueño principal*',
    `├ ${state(bot.restrict)}  ${prefix}on/off restringir`,
    `├ ${state(!global.opts.self)}  ${prefix}on/off publico`,
    `├ ${state(bot.jadibotmd)}  ${prefix}on/off modoserbot`,
    `├ ${state(bot.antiPrivate)}  ${prefix}on/off antiprivado`,
    `├ ${state(bot.antiCall)}  ${prefix}on/off antillamar`,
    `├ ${state(global.opts.autoread)}  ${prefix}on/off autovisto`,
    '╰──────────────'
  ].join('\n')
}

const handler = async (
  m,
  {
    conn,
    usedPrefix,
    command,
    args,
    isOwner,
    isAdmin,
    isROwner
  }
) => {
  const enabled = ENABLE_COMMANDS.test(command)
  const type = (args[0] || '').toLowerCase()

  const chat = global.db.data.chats[m.chat] || {}
  const botJid = conn.user.jid

  global.db.data.settings[botJid] ||= {}

  const bot = global.db.data.settings[botJid]

  if (!type) {
    return m.reply(
      createMenu(usedPrefix, chat, bot, m.isGroup)
    )
  }

  // Anti-eliminar conserva la lógica inversa usada por handler.js.
  if (
    ['antidelete', 'antieliminar', 'delete'].includes(type)
  ) {
    if (!m.isGroup) {
      return m.reply('Esta opción solo puede configurarse en grupos.')
    }

    if (!(isAdmin || isOwner || isROwner)) {
      return deny('admin', m, conn)
    }

    chat.delete = !enabled

    return m.reply(
      `✅ Anti-eliminar ${enabled ? 'activado' : 'desactivado'} para este grupo.`
    )
  }

  const groupSetting = findSetting(groupSettings, type)

  if (groupSetting) {
    if (!m.isGroup) {
      return m.reply('Esta opción solo puede configurarse en grupos.')
    }

    if (!(isAdmin || isOwner || isROwner)) {
      return deny('admin', m, conn)
    }

    chat[groupSetting.property] = enabled

    return m.reply(
      `✅ *${type}* fue ${enabled ? 'activado' : 'desactivado'} para este grupo.`
    )
  }

  const ownerSetting = findSetting(ownerSettings, type)

  if (ownerSetting) {
    if (!isROwner) {
      return deny('rowner', m, conn)
    }

    switch (ownerSetting.property) {
      case 'public':
        global.opts.self = !enabled
        break

      case 'autoread':
        bot.autoread2 = enabled
        global.opts.autoread = enabled
        break

      default:
        bot[ownerSetting.property] = enabled
        break
    }

    return m.reply(
      `✅ *${type}* fue ${enabled ? 'activado' : 'desactivado'} globalmente.`
    )
  }

  return m.reply(
    `⚠️ No reconozco la opción *${type}*.\n\n` +
    createMenu(usedPrefix, chat, bot, m.isGroup)
  )
}

handler.command = /^(on|off|enable|disable|enabled|disabled|true|false|1|0)$/i

export default handler
