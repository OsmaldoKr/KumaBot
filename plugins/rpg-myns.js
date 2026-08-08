import { createHash } from 'node:crypto'

const handler = async (m) => {
  const serial = createHash('sha256')
    .update(m.sender)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase()

  await m.reply(
    [
      lenguajeGB.smsIDserie?.() ||
        '🪪 Tu identificador de registro es:',
      '',
      `\`${serial}\``
    ].join('\n')
  )
}

handler.command = /^(myns|ceksn|numid|idregistro|idregister)$/i
handler.register = true

export default handler
