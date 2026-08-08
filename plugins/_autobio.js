const handler = (m) => m

const UPDATE_INTERVAL = 10 * 60 * 1000

handler.all = async function () {
  const botJid = this.user.jid

  global.db.data.settings[botJid] ||= {}

  const settings = global.db.data.settings[botJid]
  const now = Date.now()

  // Evita cambiar la biografía con cada mensaje.
  if (
    settings.status &&
    now - settings.status < UPDATE_INTERVAL
  ) {
    return
  }

  const uptime = formatUptime(process.uptime() * 1000)

  const commands = lenguajeGB.lenguaje() === 'es'
    ? '#estado • #menu • #serbot • #creador'
    : '#status • #menu • #jadibot • #owner'

  const bio = `${global.packname} ✅ Activo: ${uptime} ⌛ ${commands}`

  try {
    await this.updateProfileStatus(bio)
    settings.status = now

    console.log('Biografía de KumaBot actualizada.')
  } catch (error) {
    console.error(
      'No se pudo actualizar la biografía:',
      error.message
    )
  }
}

export default handler

function formatUptime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000)

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [
    `${days}d`,
    `${String(hours).padStart(2, '0')}h`,
    `${String(minutes).padStart(2, '0')}m`,
    `${String(seconds).padStart(2, '0')}s`
  ].join(' ')
}
