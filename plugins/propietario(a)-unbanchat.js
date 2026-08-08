const handler = async (m) => {
  const chat = global.db.data.chats[m.chat]

  if (!chat) {
    return m.reply(
      lenguajeGB.smsUnbanCH1?.() ||
      'Este chat no está registrado en la base de datos.'
    )
  }

  if (!chat.isBanned) {
    return m.reply(
      lenguajeGB.smsUnbanCH2?.() ||
      'Este chat no se encuentra bloqueado.'
    )
  }

  chat.isBanned = false

  return m.reply(
    lenguajeGB.smsUnbanCH3?.() ||
    '✅ Este chat fue desbloqueado correctamente.'
  )
}

handler.command = /^(unbanchat|desbanearchat|desbanchat)$/i
handler.owner = true

export default handler
