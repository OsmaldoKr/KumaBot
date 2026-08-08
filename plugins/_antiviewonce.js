export async function before(m) {
  if (!m.isGroup) return false

  const chat = global.db.data.chats[m.chat] || {}

  if (!chat.antiver || chat.isBanned) return false

  const isViewOnce =
    m.mtype === 'viewOnceMessage' ||
    m.mtype === 'viewOnceMessageV2' ||
    m.mtype === 'viewOnceMessageV2Extension'

  if (!isViewOnce) return false

  await this.sendMessage(
    m.chat,
    {
      text: '⚠️ Se detectó un mensaje configurado para verse una sola vez. KumaBot respeta la privacidad del remitente y no guarda ni reenvía ese contenido.'
    },
    { quoted: m }
  )

  return false
}
