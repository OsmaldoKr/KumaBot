import { createHash } from 'node:crypto'

function getSerial(jid) {
  return createHash('md5')
    .update(jid)
    .digest('hex')
    .slice(0, 6)
}

const handler = async (
  m,
  {
    args,
    usedPrefix,
    command
  }
) => {
  const serial = getSerial(m.sender)

  if (!args[0]) {
    return m.reply(
      [
        'Debes indicar tu ID de registro.',
        '',
        `Ejemplo: ${usedPrefix}${command} ${serial}`,
        `Consulta tu ID con: ${usedPrefix}idregistro`
      ].join('\n')
    )
  }

  if (args[0].toLowerCase() !== serial.toLowerCase()) {
    return m.reply(
      [
        'El ID de registro no es correcto.',
        '',
        `Consulta tu ID con: ${usedPrefix}idregistro`
      ].join('\n')
    )
  }

  const user = global.db.data.users[m.sender]

  if (!user?.registered) {
    return m.reply('No tienes un registro activo.')
  }

  user.registered = false
  user.regTime = -1
  user.age = 0

  return m.reply(
    [
      '✅ Tu registro fue anulado correctamente.',
      '',
      `Puedes registrarte otra vez con: ${usedPrefix}verificar Nombre.Edad`
    ].join('\n')
  )
}

handler.command = /^(anulareg|unreg|unregister)$/i
handler.register = true

export default handler
