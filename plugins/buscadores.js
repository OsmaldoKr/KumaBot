import OpenAI from 'openai'
import axios from 'axios'
import googleIt from 'google-it'
import yts from 'yt-search'

const MAX_RESULTS = 7
const MAX_AI_TEXT_LENGTH = 3000

function languageText(key, fallback, ...args) {
  try {
    return global.lenguajeGB?.[key]?.(...args) || fallback
  } catch {
    return fallback
  }
}

function cleanText(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(value, maxLength = 350) {
  const text = cleanText(value)

  return text.length > maxLength
    ? `${text.slice(0, maxLength - 3)}...`
    : text
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return null
  }

  return new OpenAI({ apiKey })
}

async function reportError(m, error, usedPrefix, command) {
  console.error(`Error en ${command}:`, error)

  await m.react(global.notsent || '❗').catch(() => {})

  return m.reply(
    [
      languageText(
        'smsMalError3',
        'Ocurrió un error al procesar tu solicitud.'
      ),
      '',
      `Puedes reportarlo con: ${usedPrefix}reporte ${command}`
    ].join('\n')
  )
}

async function searchGoogle(query) {
  const results = await googleIt({
    query,
    disableConsole: true
  })

  return results
    .filter((item) => item.title && item.link)
    .slice(0, MAX_RESULTS)
}

async function searchGitHub(username) {
  const response = await axios.get(
    `https://api.github.com/users/${encodeURIComponent(username)}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'KumaBot'
      }
    }
  )

  return response.data
}

function formatGoogleResults(query, results) {
  const lines = [
    `🔎 *Resultados de Google para:* ${query}`,
    ''
  ]

  for (const [index, item] of results.entries()) {
    lines.push(
      `*${index + 1}. ${cleanText(item.title)}*`,
      truncate(item.snippet || 'Sin descripción disponible.'),
      item.link,
      ''
    )
  }

  return lines.join('\n')
}

function formatYouTubeResults(query, results) {
  const lines = [
    `▶️ *Resultados de YouTube para:* ${query}`,
    ''
  ]

  for (const [index, video] of results.entries()) {
    lines.push(
      `*${index + 1}. ${video.title || 'Sin título'}*`,
      `Duración: ${video.timestamp || 'No disponible'}`,
      `Vistas: ${new Intl.NumberFormat('es-NI').format(video.views || 0)}`,
      `Publicado: ${video.ago || 'No disponible'}`,
      video.url || 'Sin enlace disponible',
      ''
    )
  }

  return lines.join('\n')
}

function formatGitHubProfile(profile) {
  const unavailable = 'No disponible'

  return [
    '╭─〔 *PERFIL DE GITHUB* 〕',
    `├ Usuario: ${profile.login || unavailable}`,
    `├ Nombre: ${profile.name || unavailable}`,
    `├ Biografía: ${profile.bio || unavailable}`,
    `├ Empresa: ${profile.company || unavailable}`,
    `├ Ubicación: ${profile.location || unavailable}`,
    `├ Correo: ${profile.email || unavailable}`,
    `├ Blog: ${profile.blog || unavailable}`,
    `├ Repositorios: ${profile.public_repos ?? 0}`,
    `├ Gists públicos: ${profile.public_gists ?? 0}`,
    `├ Seguidores: ${profile.followers ?? 0}`,
    `├ Siguiendo: ${profile.following ?? 0}`,
    `├ Tipo de cuenta: ${profile.type || unavailable}`,
    `╰ Enlace: ${profile.html_url || unavailable}`
  ].join('\n')
}

const handler = async (
  m,
  {
    conn,
    command,
    usedPrefix,
    args,
    text
  }
) => {
  const normalizedCommand = command.toLowerCase()

  const isGoogle = /^(googlef?)$/i.test(normalizedCommand)
  const isOpenAI = /^(openai|chatgpt|ia|ai)$/i.test(normalizedCommand)
  const isSimSimi = /^(bot|simi|simsimi|alexa|bixby|cortana|siri|okgoogle)$/i.test(
    normalizedCommand
  )
  const isGitHub = /^(githubstalk|usuariogithub|usergithub)$/i.test(
    normalizedCommand
  )
  const isYouTubeSearch = /^(yt|yts|ytsearch)$/i.test(
    normalizedCommand
  )

  const query = text || m.quoted?.text || ''

  try {
    if (isGoogle) {
      if (!query) {
        return m.reply(
          `${languageText('smsMalused3', 'Uso incorrecto:')}\n${usedPrefix}${command} ¿Qué son las matemáticas?`
        )
      }

      await m.react(global.waitemot || '⌛')

      const results = await searchGoogle(query)

      if (!results.length) {
        return m.reply('No encontré resultados para esa búsqueda.')
      }

      await m.reply(formatGoogleResults(query, results))

      return m.react(global.sent || '✅')
    }

    if (isOpenAI) {
      if (!query) {
        return m.reply(
          [
            languageText(
              'smsOpenai1',
              'Escribe una pregunta para usar la inteligencia artificial.'
            ),
            '',
            `Ejemplo: ${usedPrefix}${command} Explícame qué es Flutter.`
          ].join('\n')
        )
      }

      if (query.length > MAX_AI_TEXT_LENGTH) {
        return m.reply(
          `Tu consulta es demasiado larga. Máximo: ${MAX_AI_TEXT_LENGTH} caracteres.`
        )
      }

      const client = getOpenAIClient()

      if (!client) {
        return m.reply(
          'La IA no está configurada. Agrega OPENAI_API_KEY como variable de entorno.'
        )
      }

      await conn.sendPresenceUpdate('composing', m.chat)
      await m.react(global.waitemot || '⌛')

      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        instructions: [
          'Eres KumaBot, un asistente útil dentro de WhatsApp.',
          'Responde siempre en español claro y natural.',
          'Da respuestas breves salvo que el usuario solicite detalle.',
          'No inventes enlaces, fuentes ni datos.'
        ].join(' '),
        input: query
      })

      const answer = cleanText(response.output_text)

      if (!answer) {
        throw new Error('OpenAI no devolvió texto en la respuesta.')
      }

      await m.reply(answer)

      return m.react(global.sent || '✅')
    }

    if (isSimSimi) {
      if (!query) {
        return m.reply(
          `${languageText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} Hola, ¿cómo estás?`
        )
      }

      await conn.sendPresenceUpdate('composing', m.chat)

      const language = global.lenguajeGB?.lenguaje?.() || 'es'
      const endpoint = new URL('https://api.simsimi.net/v2/')

      endpoint.searchParams.set('text', query)
      endpoint.searchParams.set('lc', language)

      const response = await fetch(endpoint)
      const data = await response.json()

      if (!data.success) {
        throw new Error('SimSimi no devolvió una respuesta válida.')
      }

      return m.reply(data.success)
    }

    if (isGitHub) {
      if (!query) {
        return m.reply(
          `${languageText('smsGit1', 'Escribe un usuario de GitHub.')}\n${usedPrefix}${command} OsmaldoKr`
        )
      }

      await m.reply(
        languageText('smsGit2', 'Buscando perfil de GitHub...')
      )

      const profile = await searchGitHub(query.replace(/^@/, ''))
      const profileText = formatGitHubProfile(profile)

      await conn.sendFile(
        m.chat,
        profile.avatar_url || global.sharkMenu?.getRandom?.(),
        'github-perfil.jpg',
        profileText,
        m
      )

      return m.react(global.sent || '✅')
    }

    if (isYouTubeSearch) {
      if (!query) {
        return m.reply(
          `${languageText('smsMalused2', 'Uso incorrecto:')}\n${usedPrefix}${command} KumaBot`
        )
      }

      await m.reply(global.wait || 'Buscando en YouTube...')

      const result = await yts(query)

      const videos = (result.videos || [])
        .filter((video) => video.url)
        .slice(0, MAX_RESULTS)

      if (!videos.length) {
        return m.reply('No se encontraron videos en YouTube.')
      }

      await conn.sendFile(
        m.chat,
        videos[0].thumbnail,
        'youtube-resultados.jpg',
        formatYouTubeResults(query, videos),
        m
      )

      return m.react(global.sent || '✅')
    }
  } catch (error) {
    return reportError(m, error, usedPrefix, command)
  }
}

handler.command = /^(googlef?|openai|chatgpt|ia|ai|bot|simi|simsimi|alexa|bixby|cortana|siri|okgoogle|githubstalk|usuariogithub|usergithub|yt|yts|ytsearch)$/i

handler.register = true
handler.limit = 1

export default handler
