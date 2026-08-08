import { EventEmitter } from 'node:events'
import {
  createReadStream,
  existsSync,
  promises as fs,
} from 'node:fs'

import { dirname, basename, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { google } from 'googleapis'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TOKEN_PATH = join(__dirname, '..', 'token.json')

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'

/*
 * drive.file permite trabajar con archivos creados o autorizados para la app.
 * Para acceder a todo tu Drive debes usar:
 * https://www.googleapis.com/auth/drive
 */
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
]

function escapeQuery(value = '') {
  return String(value).replace(/'/g, "\\'")
}

function normalizePath(value = '/') {
  const path = String(value || '/').replace(/\\/g, '/')

  if (path === '/' || path === '.') return '/'

  return `/${path}`
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
}

/**
 * Gestiona la autenticación OAuth2 de Google.
 */
class GoogleAuth extends EventEmitter {
  constructor({
    tokenPath = TOKEN_PATH,
    redirectUri = 'http://localhost:3000/oauth2callback',
    scopes = SCOPES,
  } = {}) {
    super()

    this.tokenPath = tokenPath
    this.redirectUri = redirectUri
    this.scopes = scopes
    this.client = null
  }

  /**
   * Inicializa OAuth2.
   *
   * @param {object} credentials Credenciales descargadas desde Google Cloud.
   * @returns {Promise<import('google-auth-library').OAuth2Client>}
   */
  async authorize(credentials) {
    const config = credentials.installed ||
      credentials.web ||
      credentials

    const clientId = config.client_id
    const clientSecret = config.client_secret

    if (!clientId || !clientSecret) {
      throw new Error(
        'Las credenciales de Google no contienen client_id y client_secret.',
      )
    }

    const redirectUri =
      config.redirect_uris?.[0] ||
      this.redirectUri

    const client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    )

    let token

    if (existsSync(this.tokenPath)) {
      token = JSON.parse(
        await fs.readFile(this.tokenPath, 'utf8'),
      )
    } else {
      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: this.scopes,
      })

      this.emit('auth', authUrl)

      token = await new Promise((resolve) => {
        this.once('token', resolve)
      })
    }

    if (typeof token === 'string') {
      const response = await client.getToken(token)
      token = response.tokens
    }

    if (!token?.access_token && !token?.refresh_token) {
      throw new Error('No se recibió un token válido de Google.')
    }

    client.setCredentials(token)

    await fs.mkdir(dirname(this.tokenPath), {
      recursive: true,
    })

    await fs.writeFile(
      this.tokenPath,
      JSON.stringify(token, null, 2),
      'utf8',
    )

    this.client = client

    return client
  }

  /**
   * Entrega el código OAuth recibido en la URL de autorización.
   *
   * @param {string} code Código de autorización.
   */
  token(code) {
    this.emit('token', code)
  }
}

/**
 * Cliente básico para Google Drive.
 */
class GoogleDrive extends GoogleAuth {
  constructor(options = {}) {
    super(options)

    this.drive = null
  }

  async authorize(credentials) {
    const client = await super.authorize(credentials)

    this.drive = google.drive({
      version: 'v3',
      auth: client,
    })

    return client
  }

  ensureAuthorized() {
    if (!this.drive) {
      throw new Error(
        'Primero debes ejecutar await drive.authorize(credentials).',
      )
    }
  }

  async findChild(parentId, name, mimeType = null) {
    const query = [
      `'${escapeQuery(parentId)}' in parents`,
      `name = '${escapeQuery(name)}'`,
      'trashed = false',
    ]

    if (mimeType) {
      query.push(`mimeType = '${mimeType}'`)
    }

    const response = await this.drive.files.list({
      q: query.join(' and '),
      fields: 'files(id, name, mimeType, size, modifiedTime)',
      pageSize: 1,
      spaces: 'drive',
    })

    return response.data.files?.[0] || null
  }

  /**
   * Busca una carpeta por ruta.
   *
   * @param {string} folderPath Ruta, por ejemplo: /KumaBot/Backups
   * @param {boolean} create Crea las carpetas inexistentes.
   * @returns {Promise<string>}
   */
  async getFolderID(folderPath = '/', create = false) {
    this.ensureAuthorized()

    const cleanPath = normalizePath(folderPath)

    if (cleanPath === '/') return 'root'

    const folders = cleanPath
      .split('/')
      .filter(Boolean)

    let parentId = 'root'

    for (const folderName of folders) {
      let folder = await this.findChild(
        parentId,
        folderName,
        FOLDER_MIME_TYPE,
      )

      if (!folder && create) {
        const response = await this.drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: FOLDER_MIME_TYPE,
            parents: [parentId],
          },
          fields: 'id, name',
        })

        folder = response.data
      }

      if (!folder?.id) {
        throw new Error(
          `No existe la carpeta: ${cleanPath}`,
        )
      }

      parentId = folder.id
    }

    return parentId
  }

  /**
   * Obtiene información de un archivo mediante su ruta de Drive.
   *
   * @param {string} remotePath Ejemplo: /KumaBot/archivo.json
   * @returns {Promise<object | null>}
   */
  async infoFile(remotePath) {
    this.ensureAuthorized()

    const cleanPath = normalizePath(remotePath)
    const filename = posix.basename(cleanPath)
    const folderPath = posix.dirname(cleanPath)

    if (!filename || filename === '/') return null

    const parentId = await this.getFolderID(folderPath)
    const file = await this.findChild(parentId, filename)

    return file
  }

  /**
   * Lista el contenido de una carpeta de Drive.
   *
   * @param {string} folderPath Ruta de carpeta.
   * @returns {Promise<object[]>}
   */
  async folderList(folderPath = '/') {
    this.ensureAuthorized()

    const folderId = await this.getFolderID(folderPath)

    const response = await this.drive.files.list({
      q: `'${escapeQuery(folderId)}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime)',
      orderBy: 'folder,name',
      spaces: 'drive',
    })

    return response.data.files || []
  }

  /**
   * Descarga un archivo de Drive.
   *
   * @param {string} remotePath Ruta del archivo.
   * @param {string|null} destination Ruta local opcional.
   * @returns {Promise<Buffer|string>}
   */
  async downloadFile(remotePath, destination = null) {
    this.ensureAuthorized()

    const file = await this.infoFile(remotePath)

    if (!file?.id) {
      throw new Error(`No existe el archivo: ${remotePath}`)
    }

    const response = await this.drive.files.get(
      {
        fileId: file.id,
        alt: 'media',
      },
      {
        responseType: 'arraybuffer',
      },
    )

    const buffer = Buffer.from(response.data)

    if (!destination) {
      return buffer
    }

    await fs.mkdir(dirname(destination), {
      recursive: true,
    })

    await fs.writeFile(destination, buffer)

    return destination
  }

  /**
   * Sube un archivo local a Google Drive.
   *
   * @param {string} localPath Ruta local del archivo.
   * @param {string} folderPath Carpeta remota.
   * @param {string|null} remoteName Nombre final opcional.
   * @returns {Promise<object>}
   */
  async uploadFile(
    localPath,
    folderPath = '/',
    remoteName = null,
  ) {
    this.ensureAuthorized()

    if (!existsSync(localPath)) {
      throw new Error(`No existe el archivo local: ${localPath}`)
    }

    const parentId = await this.getFolderID(
      folderPath,
      true,
    )

    const response = await this.drive.files.create({
      requestBody: {
        name: remoteName || basename(localPath),
        parents: [parentId],
      },
      media: {
        mimeType: 'application/octet-stream',
        body: createReadStream(localPath),
      },
      fields: 'id, name, mimeType, size, modifiedTime, webViewLink',
    })

    return response.data
  }
}

export {
  GoogleAuth,
  GoogleDrive,
  SCOPES,
}
