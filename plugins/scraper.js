import cheerio from 'cheerio'
import fetch from 'node-fetch'

async function getPage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  })

  if (!response.ok) {
    throw new Error(
      `No se pudo abrir la página. Estado: ${response.status}`
    )
  }

  return response
}

function extractImages(scriptContent) {
  const match = scriptContent.match(
    /"images"\s*:\s*(\[[\s\S]*?\])\s*[,}]/
  )

  if (!match?.[1]) return []

  try {
    const images = JSON.parse(match[1])

    return Array.isArray(images)
      ? images
          .filter((image) => typeof image === 'string')
          .map((image) => encodeURI(image))
      : []
  } catch {
    return []
  }
}

async function sekaikomikDl(url) {
  const response = await getPage(url)
  const html = await response.text()
  const $ = cheerio.load(html)

  const scripts = $('script')
    .map((_, element) => $(element).html() || '')
    .toArray()

  for (const script of scripts) {
    if (!/wp-content|images/i.test(script)) continue

    const images = extractImages(script)

    if (images.length) {
      return images
    }
  }

  throw new Error('No se encontraron imágenes en esta página.')
}

async function facebookDl(url) {
  const homeResponse = await getPage('https://fdownloader.net/')
  const homeHtml = await homeResponse.text()
  const $ = cheerio.load(homeHtml)

  const token = $('input[name="__RequestVerificationToken"]').attr('value')

  if (!token) {
    throw new Error('No se encontró el token del servicio.')
  }

  const response = await fetch(
    'https://fdownloader.net/api/ajaxSearch',
    {
      method: 'POST',
      headers: {
        Cookie: homeResponse.headers.get('set-cookie') || '',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: 'https://fdownloader.net/',
        'User-Agent': 'Mozilla/5.0'
      },
      body: new URLSearchParams({
        __RequestVerificationToken: token,
        q: url
      })
    }
  )

  if (!response.ok) {
    throw new Error(
      `El servicio de Facebook devolvió el estado ${response.status}`
    )
  }

  const json = await response.json()
  const $$ = cheerio.load(json.data || '')

  const result = {}

  $$('.button.is-success.is-small.download-link-fb').each(
    (_, element) => {
      const title = $$(element).attr('title') || ''
      const quality = title.split(' ')[1] || 'SD'
      const link = $$(element).attr('href')

      if (link) {
        result[quality] = link
      }
    }
  )

  if (!Object.keys(result).length) {
    throw new Error('No se encontraron enlaces de descarga.')
  }

  return result
}

export {
  sekaikomikDl,
  facebookDl
}
