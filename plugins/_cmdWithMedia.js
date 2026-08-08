const {
  proto,
  generateWAMessage,
  areJidsSameUser
} = (await import('@whiskeysockets/baileys')).default

export async function all(m, { chatUpdate }) {
  if (m.isBaileys || !m.message || !m.msg?.fileSha256) {
    return
  }

  const stickerDatabase = global.db.data.sticker || {}

  const stickerHash = Buffer
    .from(m.msg.fileSha256)
    .toString('base64')

  const stickerData = stickerDatabase[stickerHash]

  if (!stickerData) return

  const {
    text,
    mentionedJid = []
  } = stickerData

  if (!text) return

  try {
    const generatedMessage = await generateWAMessage(
      m.chat,
      {
        text,
        mentions: mentionedJid
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
    generatedMessage.pushName = m.pushName

    if (m.isGroup) {
      generatedMessage.participant = m.sender
    }

    const messageUpdate = {
      ...chatUpdate,
      messages: [
        proto.WebMessageInfo.fromObject(generatedMessage)
      ],
      type: 'append'
    }

    this.ev.emit('messages.upsert', messageUpdate)
  } catch (error) {
    console.error(
      'Error al ejecutar el comando del sticker:',
      error.message
    )
  }
}
