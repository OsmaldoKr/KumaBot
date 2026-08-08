const {
  proto,
  generateWAMessage,
  areJidsSameUser
} = (await import('@whiskeysockets/baileys')).default

function escapeRegex(value) {
  return String(value).replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&')
}

function matchesPluginCommand(plugin, command) {
  if (plugin.command instanceof RegExp) {
    return plugin.command.test(command)
  }

  if (Array.isArray(plugin.command)) {
    return plugin.command.some((item) =>
      item instanceof RegExp
        ? item.test(command)
        : item === command
    )
  }

  return typeof plugin.command === 'string' &&
    plugin.command === command
}

export async function all(m, { chatUpdate }) {
  if (m.isBaileys || !m.message) return

  const buttonResponse = m.message.buttonsResponseMessage
  const templateResponse = m.message.templateButtonReplyMessage
  const listResponse = m.message.listResponseMessage

  if (!buttonResponse && !templateResponse && !listResponse) {
    return
  }

  const selectedId =
    buttonResponse?.selectedButtonId ||
    templateResponse?.selectedId ||
    listResponse?.singleSelectReply?.selectedRowId

  const selectedText =
    buttonResponse?.selectedDisplayText ||
    templateResponse?.selectedDisplayText ||
    listResponse?.title ||
    ''

  if (!selectedId) return

  let isCommand = false

  for (const name in global.plugins || {}) {
    const plugin = global.plugins[name]

    if (
      !plugin ||
      plugin.disabled ||
      typeof plugin !== 'function' ||
      !plugin.command
    ) {
      continue
    }

    if (!global.opts?.restrict && plugin.tags?.includes('admin')) {
      continue
    }

    const prefix = plugin.customPrefix || this.prefix || global.prefix

    const prefixes =
      prefix instanceof RegExp
        ? [prefix]
        : Array.isArray(prefix)
          ? prefix
          : [prefix]

    for (const item of prefixes) {
      const regex =
        item instanceof RegExp
          ? item
          : new RegExp(`^${escapeRegex(item)}`)

      const match = regex.exec(selectedId)

      if (!match) continue

      const usedPrefix = match[0]
      const command = selectedId
        .slice(usedPrefix.length)
        .trim()
        .split(/\s+/)[0]
        ?.toLowerCase()

      if (
        command &&
        matchesPluginCommand(plugin, command)
      ) {
        isCommand = true
        break
      }
    }

    if (isCommand) break
  }

  const responseText = isCommand
    ? selectedId
    : selectedText || selectedId

  try {
    const generatedMessage = await generateWAMessage(
      m.chat,
      {
        text: responseText,
        mentions: m.mentionedJid || []
      },
      {
        userJid: this.user.id,
        quoted: m.quoted?.fakeObj
      }
    )

    generatedMessage.key.fromMe = areJidsSameUser(
      m.sender,
      this.user.id
    )

    generatedMessage.key.id = m.key.id
    generatedMessage.pushName = m.name

    if (m.isGroup) {
      generatedMessage.key.participant = m.sender
      generatedMessage.participant = m.sender
    }

    const messageUpdate = {
      ...chatUpdate,
      messages: [
        proto.WebMessageInfo
          .fromObject(generatedMessage)
      ],
      type: 'append'
    }

    this.ev.emit('messages.upsert', messageUpdate)
  } catch (error) {
    console.error(
      'No se pudo procesar la respuesta del botón:',
      error.message
    )
  }
}
