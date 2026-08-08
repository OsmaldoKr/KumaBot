import fetch from 'node-fetch'

const API_URL = 'https://srvcdn8.2convert.me/api/json'
const TASK_URL = 'https://srvcdn8.2convert.me/api/json/task'

const HEADERS = {
  origin: 'https://en1.y2mate.is',
  referer: 'https://en1.y2mate.is/',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/113.0.0.0 Safari/537.36',
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function request(url, options = {}) {
  const response = await fetch(url, options)

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} en el conversor.`)
  }

  return response.json()
}

/**
 * Obtiene el mejor formato disponible para audio o video.
 *
 * @param {string} url Enlace del video.
 * @param {'audio' | 'video'} type Tipo de archivo deseado.
 * @returns {Promise<object>}
 */
async function bestFormat(url, type = 'audio') {
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('Debes proporcionar un enlace válido.')
  }

  if (!['audio', 'video'].includes(type)) {
    throw new Error('El tipo debe ser audio o video.')
  }

  const json = await request(`${API_URL}?url=${encodeURIComponent(url)}`, {
    method: 'GET',
    headers: HEADERS,
  })

  if (json?.error || !json?.formats) {
    throw new Error('No se pudieron obtener los formatos disponibles.')
  }

  if (type === 'audio') {
    const audioFormats = Array.isArray(json.formats.audio)
      ? json.formats.audio
      : []

    const preferredQualities = [192, 128, 64, 48]

    const format = preferredQualities
      .map((quality) =>
        audioFormats.find(
          (item) => Number(item.quality) === quality,
        ),
      )
      .find(Boolean)

    if (!format) {
      throw new Error('No hay formatos de audio disponibles.')
    }

    return format
  }

  const videoFormats = Array.isArray(json.formats.video)
    ? json.formats.video
    : []

  if (!videoFormats.length) {
    throw new Error('No hay formatos de video disponibles.')
  }

  return videoFormats[videoFormats.length - 1]
}

/**
 * Solicita la conversión y espera el enlace de descarga final.
 *
 * @param {string} hash Identificador o hash del formato seleccionado.
 * @returns {Promise<object>}
 */
async function getUrlDl(hash) {
  if (!hash) {
    throw new Error('No se recibió el identificador de descarga.')
  }

  const task = await request(API_URL, {
    method: 'POST',
    headers: {
      ...HEADERS,
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: new URLSearchParams({ hash }),
  })

  if (task?.error || !task?.taskId) {
    throw new Error('No fue posible crear la tarea de conversión.')
  }

  const maxAttempts = 60

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await sleep(1000)

    const status = await request(TASK_URL, {
      method: 'POST',
      headers: {
        ...HEADERS,
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: new URLSearchParams({
        taskId: task.taskId,
      }),
    })

    if (status?.error || status?.status === 'error') {
      throw new Error('La conversión no pudo completarse.')
    }

    if (status?.status === 'finished') {
      return status
    }
  }

  throw new Error('La conversión tardó demasiado tiempo. Intenta nuevamente.')
}

export {
  bestFormat,
  getUrlDl,
}
