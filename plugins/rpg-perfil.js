import { createHash } from 'node:crypto'
import PhoneNumber from 'awesome-phonenumber'

function getSerial(jid) {
  return createHash('sha256')
    .update(jid)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase()
}

function getInternationalNumber(jid) {
  const number = jid.split('@')[0]

  try {
    return PhoneNumber(`+${number}`).getNumber('international') || `+${number}`
  } catch {
    return `+${number}`
  }
}

const handler = async (m, { conn }) => {
  const target =
    m.mentionedJid?.[0] ||
    m.quoted?.sender ||
    m.sender

  const user = global.db.data.users[target]

  if (!user) {
    return m.reply(
      'Ese usuario todavía no está registrado en KumaBot.'
    )
  }

  const profilePicture = await conn
    .profilePictureUrl(target, 'image')
    .catch(() => global.sharkImg?.getRandom?.() || global.imagen1)

  const number = target.split('@')[0]
  const displayName = user.name || await conn.getName(target)

  const profile = [
    lenguajeGB.smsPerfil0?.() || '👤 *PERFIL DE USUARIO*',
    '',
    `*⎔ ${lenguajeGB.smsPerfil1?.() || 'Usuario'}*`,
    `• @${number}`,
    '',
    `*⎔ ${lenguajeGB.smsPerfil2?.() || 'Nombre'}*`,
    `• ${displayName}`,
    '',
    `*⎔ ${lenguajeGB.smsPerfil3?.() || 'Edad'}*`,
    `• ${user.age || 'No registrada'}`,
    '',
    `*⎔ ${lenguajeGB.smsPerfil4?.() || 'Número'}*`,
    `• ${getInternationalNumber(target)}`,
    '',
    `*⎔ ${lenguajeGB.smsPerfil5?.() || 'ID de registro'}*`,
    `• \`${getSerial(target)}\``
  ].join('\n')

  await conn.sendFile(
    m.chat,
    profilePicture,
    'kumabot-perfil.jpg',
    profile,
    m,
    false,
    {
      mentions: [target]
    }
  )
}

handler.command = /^(perfil|profile)$/i
handler.register = true

export default handler
