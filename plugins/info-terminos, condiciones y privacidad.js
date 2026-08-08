const handler = async (m, { usedPrefix, command }) => {
  const terms = [
    '╭─〔 *TÉRMINOS DE KUMABOT* 〕',
    '│',
    '├ 1. Usa el bot con respeto.',
    '├ 2. No uses comandos para acosar, spam o molestar a otros.',
    '├ 3. Los administradores del grupo son responsables de su configuración.',
    '├ 4. No compartas la carpeta KumaSession ni claves de API.',
    '├ 5. KumaBot no almacena mensajes fuera de la base de datos necesaria para funcionar.',
    '├ 6. El uso de comandos de descarga debe respetar las normas y derechos de cada plataforma.',
    '├ 7. El propietario puede actualizar o desactivar funciones en cualquier momento.',
    '│',
    `├ Más ayuda: ${usedPrefix}menu`,
    '╰──────────────'
  ].join('\n')

  await m.reply(terms)
}

handler.command = /^(terminos|términos|terms|condiciones|privacidad)$/i
handler.register = true

export default handler
