const handler = (m) => m

handler.all = async function (m) {
  // WhatsApp usa el tipo 68 para ciertos mensajes no compatibles con escritorio.
  if (m.messageStubType !== 68) return

  try {
    await this.modifyChat(
      m.chat,
      'clear',
      {
        includeStarred: false
      }
    )

    console.log(
      `Chat limpiado automáticamente: ${m.chat}`
    )
  } catch (error) {
    console.error(
      'No se pudo limpiar el chat automáticamente:',
      error.message
    )
  }
}

export default handler
