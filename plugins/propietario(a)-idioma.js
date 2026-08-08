import { es } from '../lib/idiomas/total-idiomas.js'

const handler = async (
  m,
  {
    usedPrefix,
    command,
    args
  }
) => {
  const language = (args[0] || 'es').toLowerCase()

  if (!['es', 'español', 'spanish'].includes(language)) {
    return m.reply(
      [
        '🌎 *Idioma disponible en KumaBot*',
        '',
        `• Español: ${usedPrefix}${command} es`,
        '',
        'Por ahora KumaBot está configurado únicamente en español.'
      ].join('\n')
    )
  }

  global.lenguajeGB = es

  return m.reply(
    [
      '✅ *Idioma actualizado correctamente.*',
      '',
      'KumaBot ahora utilizará español en sus mensajes.'
    ].join('\n')
  )
}

handler.command = /^(idioma|language|idiomas|languages)$/i
handler.owner = true

export default handler
