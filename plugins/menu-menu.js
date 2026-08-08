function formatUptime(seconds = process.uptime()) {
  const total = Math.floor(seconds)

  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainingSeconds = total % 60

  return [
    `${String(hours).padStart(2, '0')}h`,
    `${String(minutes).padStart(2, '0')}m`,
    `${String(remainingSeconds).padStart(2, '0')}s`
  ].join(' ')
}

const handler = async (
  m,
  {
    conn,
    usedPrefix
  }
) => {
  const user = global.db.data.users[m.sender] || {}
  const displayName = user.registered
    ? user.name
    : m.pushName || 'Usuario'

  const menu = [
    '╭─〔 *👺 KUMABOT · MENÚ PRINCIPAL* 〕',
    `├ Hola, @${m.sender.split('@')[0]}`,
    `├ Usuario: ${displayName}`,
    `├ Tiempo activo: ${formatUptime()}`,
    `├ Prefijo: ${usedPrefix}`,
    '│',
    '├─〔 *ℹ️ INFORMACIÓN* 〕',
    `├ ${usedPrefix}estado`,
    `├ ${usedPrefix}infobot`,
    `├ ${usedPrefix}ping`,
    `├ ${usedPrefix}owner`,
    `├ ${usedPrefix}contactos`,
    `├ ${usedPrefix}cuentasoficiales`,
    `├ ${usedPrefix}terminos`,
    `├ ${usedPrefix}report <mensaje>`,
    '│',
    '├─〔 *🤖 IA Y BÚSQUEDA* 〕',
    `├ ${usedPrefix}google <consulta>`,
    `├ ${usedPrefix}chatgpt <pregunta>`,
    `├ ${usedPrefix}simi <mensaje>`,
    `├ ${usedPrefix}githubstalk <usuario>`,
    `├ ${usedPrefix}yts <búsqueda>`,
    `├ ${usedPrefix}imagen <búsqueda>`,
    '│',
    '├─〔 *🎬 DESCARGAS* 〕',
    `├ ${usedPrefix}play <canción>`,
    `├ ${usedPrefix}play2 <video>`,
    `├ ${usedPrefix}yta <enlace>`,
    `├ ${usedPrefix}ytv <enlace>`,
    `├ ${usedPrefix}ytmax <enlace>`,
    `├ ${usedPrefix}tiktok <enlace>`,
    `├ ${usedPrefix}facebook <enlace>`,
    `├ ${usedPrefix}instagram <enlace>`,
    `├ ${usedPrefix}twitter <enlace>`,
    `├ ${usedPrefix}mediafire <enlace>`,
    `├ ${usedPrefix}spotify <nombre o enlace>`,
    '│',
    '├─〔 *🔄 CONVERSIONES* 〕',
    `├ ${usedPrefix}toimg  — Responde a un sticker`,
    `├ ${usedPrefix}tourl  — Responde a un archivo`,
    `├ ${usedPrefix}tomp4  — Responde a un sticker`,
    `├ ${usedPrefix}togif  — Responde a un video`,
    `├ ${usedPrefix}tovn   — Responde a audio o video`,
    `├ ${usedPrefix}tts es <texto>`,
    '│',
    '├─〔 *👥 COMANDOS DE GRUPO* 〕',
    `├ ${usedPrefix}infogrupo`,
    `├ ${usedPrefix}admins <mensaje opcional>`,
    `├ ${usedPrefix}enlace`,
    `├ ${usedPrefix}saludar @usuario`,
    `├ ${usedPrefix}abrazar @usuario`,
    `├ ${usedPrefix}notificar <mensaje>`,
    `├ ${usedPrefix}daradmin @usuario`,
    `├ ${usedPrefix}quitaradmin @usuario`,
    `├ ${usedPrefix}sacar @usuario`,
    `├ ${usedPrefix}grupo abrir`,
    `├ ${usedPrefix}grupo cerrar`,
    '│',
    '├─〔 *⚙️ CONFIGURACIÓN DE GRUPO* 〕',
    `├ ${usedPrefix}on bienvenida`,
    `├ ${usedPrefix}off bienvenida`,
    `├ ${usedPrefix}on avisos`,
    `├ ${usedPrefix}on antienlace`,
    `├ ${usedPrefix}on antienlace2`,
    `├ ${usedPrefix}on antitiktok`,
    `├ ${usedPrefix}on antiyoutube`,
    `├ ${usedPrefix}on antitelegram`,
    `├ ${usedPrefix}on antifacebook`,
    `├ ${usedPrefix}on antiinstagram`,
    `├ ${usedPrefix}on antitwitter`,
    `├ ${usedPrefix}on reaccion`,
    `├ ${usedPrefix}on modoadmin`,
    '│',
    '├─〔 *👑 PROPIETARIO* 〕',
    `├ ${usedPrefix}on publico`,
    `├ ${usedPrefix}on restringir`,
    `├ ${usedPrefix}on antiprivado`,
    `├ ${usedPrefix}on antillamar`,
    `├ ${usedPrefix}prohibir @usuario`,
    `├ ${usedPrefix}desprohibir @usuario`,
    '╰──────────────',
    '',
    'KumaBot · Desarrollado por OsmaldoKr'
  ].join('\n')

  await conn.sendMessage(
    m.chat,
    {
      text: menu,
      mentions: [m.sender]
    },
    { quoted: m }
  )
}

handler.command = /^(menu|menú|help|ayuda|comandos|commands|\?)$/i

export default handler
