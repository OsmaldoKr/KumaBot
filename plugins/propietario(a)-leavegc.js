const handler = async (m, { conn }) => {
  if (!m.isGroup) {
    return m.reply(
      'Este comando solo puede utilizarse dentro del grupo que deseas abandonar.'
    )
  }

  try {
    await conn.sendMessage(
      m.chat,
      {
        text: lenguajeGB.smsLeave?.() ||
          '👋 KumaBot se retirará del grupo. ¡Hasta pronto!'
      },
      { quoted: m }
    )

    await conn.groupLeave(m.chat)
  } catch (error) {
    console.error('No se pudo salir del grupo:', error.message)

    await m.reply(
      'No se pudo abandonar el grupo. Inténtalo nuevamente.'
    )
  }
}

handler.command = /^(salir|leavegc|salirdelgrupo|leave)$/i
handler.group = true
handler.owner = true

export default handler
