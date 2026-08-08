import { dirname, resolve } from 'node:path'
import {
  existsSync,
  readFileSync,
  promises as fs,
} from 'node:fs'

class Database {
  /**
   * Crea una base de datos JSON local.
   *
   * @param {string} filepath Ruta del archivo JSON.
   * @param {...any} jsonArgs Argumentos para JSON.stringify.
   */
  constructor(filepath, ...jsonArgs) {
    if (!filepath) {
      throw new Error('Debes indicar la ruta del archivo JSON.')
    }

    this.file = resolve(filepath)
    this.logger = console
    this._jsonArgs = jsonArgs.length ? jsonArgs : [null, 2]
    this._data = {}
    this._writeQueue = Promise.resolve()

    this._load()
  }

  get data() {
    return this._data
  }

  set data(value) {
    this._data = value || {}
    this.save()
  }

  /**
   * Carga el contenido del archivo JSON.
   *
   * @returns {object}
   */
  _load() {
    try {
      if (!existsSync(this.file)) {
        this._data = {}
        return this._data
      }

      const content = readFileSync(this.file, 'utf8')

      this._data = content.trim()
        ? JSON.parse(content)
        : {}

      return this._data
    } catch (error) {
      this.logger.error(
        `No se pudo leer la base de datos JSON: ${error.message}`,
      )

      this._data = {}

      return this._data
    }
  }

  /**
   * Recarga la base de datos desde el disco.
   *
   * @returns {Promise<object>}
   */
  async load() {
    return this._load()
  }

  /**
   * Programa el guardado de datos evitando escrituras simultáneas.
   *
   * @returns {Promise<string>}
   */
  save() {
    this._writeQueue = this._writeQueue
      .catch(() => {})
      .then(() => this._save())

    return this._writeQueue
  }

  /**
   * Guarda el contenido actual en disco.
   *
   * @returns {Promise<string>}
   */
  async _save() {
    const folder = dirname(this.file)

    if (!existsSync(folder)) {
      await fs.mkdir(folder, {
        recursive: true,
      })
    }

    const temporaryFile = `${this.file}.tmp`
    const content = JSON.stringify(
      this._data,
      ...this._jsonArgs,
    )

    await fs.writeFile(temporaryFile, content, 'utf8')
    await fs.rename(temporaryFile, this.file)

    return this.file
  }
}

export default Database
