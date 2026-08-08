import fetch from 'node-fetch'

const stringify = (object) =>
  JSON.stringify(object, null, 2)

const parse = (text) =>
  JSON.parse(text, (_key, value) => {
    if (
      value !== null &&
      typeof value === 'object' &&
      value.type === 'Buffer' &&
      Array.isArray(value.data)
    ) {
      return Buffer.from(value.data)
    }

    return value
  })

class CloudDBAdapter {
  /**
   * Adaptador para una base de datos JSON remota.
   *
   * @param {string} url URL del endpoint.
   * @param {object} options Configuración adicional.
   * @param {(object: any) => string} [options.serialize]
   * @param {(text: string) => any} [options.deserialize]
   * @param {RequestInit} [options.fetchOptions]
   */
  constructor(
    url,
    {
      serialize = stringify,
      deserialize = parse,
      fetchOptions = {},
    } = {},
  ) {
    if (!/^https?:\/\//i.test(url || '')) {
      throw new Error(
        'La URL de CloudDB debe comenzar con http:// o https://',
      )
    }

    this.url = url
    this.serialize = serialize
    this.deserialize = deserialize
    this.fetchOptions = fetchOptions
  }

  /**
   * Obtiene los datos remotos.
   *
   * @returns {Promise<object | null>}
   */
  async read() {
    try {
      const response = await fetch(this.url, {
        ...this.fetchOptions,
        method: 'GET',
        headers: {
          accept: 'application/json, text/plain;q=0.9',
          ...(this.fetchOptions.headers || {}),
        },
      })

      if (!response.ok) {
        throw new Error(
          `CloudDB respondió con código ${response.status}.`,
        )
      }

      const content = await response.text()

      if (!content.trim()) return {}

      return this.deserialize(content)
    } catch (error) {
      console.error(
        `No se pudo leer CloudDB: ${error.message}`,
      )

      return null
    }
  }

  /**
   * Guarda los datos en el endpoint remoto.
   *
   * @param {object} data Datos serializables.
   * @returns {Promise<string>}
   */
  async write(data) {
    if (!data || typeof data !== 'object') {
      throw new TypeError(
        'Los datos de CloudDB deben ser un objeto válido.',
      )
    }

    const response = await fetch(this.url, {
      ...this.fetchOptions,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/plain;q=0.9',
        ...(this.fetchOptions.headers || {}),
      },
      body: this.serialize(data),
    })

    if (!response.ok) {
      const message = await response.text()

      throw new Error(
        `No se pudo guardar CloudDB (${response.status}): ${message}`,
      )
    }

    return response.text()
  }
}

export default CloudDBAdapter

export {
  parse,
  stringify,
}
