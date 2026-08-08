import { createHash } from 'node:crypto'

function getSerial(jid) {
  return createHash('md5')
    .update(jid)
    .digest('hex')
    .slice(0, 6)
}

function parseRegistration(text = '') {
  const match = text.trim().match(
    /^(.+?)\s*[.|,|-]\s*(\d{1,3})$/
  )

  if (!match) return null

  return {
    name: match[1].trim(),
    age: Number(match[2])
  }
}

const handler = async (
  m,
  {
    conn,
    text,
    usedPrefix,
    command
  }
) => {
  global.db.data.users[m.sender] ||= {}

  const user = global.db.data.users[m.sender]

  if (user.registered) {
    return m.reply(
      `Ya estás registrado(a). Consulta tu perfil con: ${usedPrefix}perfil`
    )
  }

  const data = parseRegistration(text)

  if (!data) {
    return m.reply(
      [
        'Formato incorrecto.',
        '',
        `Uso: ${usedPrefix}${command} Nombre.Edad`,
        `Ejemplo: ${usedPrefix}${command} Osmaldo.20`
      ].join('\n')
    )
  }

  const { name, age } = data

  if (name.length < 2) {
    return m.reply('El nombre debe tener al menos 2 caracteres.')
  }

  if (name.length > 30) {
    return m.reply('El nombre no puede superar 30 caracteres.')
  }

  if (age < 13 || age > 99) {
    return m.reply(
      'La edad debe estar entre 13 y 99 años.'
    )
  }

  const serial = getSerial(m.sender)

  user.name = name
  user.age = age
  user.regTime = Date.now()
  user.registered = true

  const number = m.sender.split('@')[0]

  const caption = [
    '✅ *REGISTRO COMPLETADO*',
    '',
    `*Usuario:* @${number}`,
    `*Nombre:* ${name}`,
    `*Edad:* ${age}`,
    `*ID de registro:* \`${serial}\``,
    '',
    `Consulta tu perfil con: ${usedPrefix}perfil`,
    `Puedes anularlo con: ${usedPrefix}anulareg ${serial}`
  ].join('\n')

  await conn.sendMessage(
    m.chat,
    {
      text: caption,
      mentions: [m.sender]
    },
    { quoted: m }
  )

  return m.reply('🎉 Registro guardado correctamente.')
}

handler.command = /^(verify|verificar|reg|register|registro)$/i

export default handler
