import express from 'express'
import { createServer } from 'node:http'
import { toBuffer } from 'qrcode'
import fetch from 'node-fetch'

function connect(conn, port) {
  const app = express()
  const server = createServer(app)

  global.app = app
  global.server = server

  let currentQr = null
  let connected = false

  conn.ev.on('connection.update', ({ connection, qr }) => {
    if (qr) {
      currentQr = qr
      connected = false
      console.log('Nuevo código QR generado.')
    }

    if (connection === 'open') {
      connected = true
      currentQr = null
    }

    if (connection === 'close') {
      connected = false
    }
  })

  app.get('/health', (_, res) => {
    res.status(200).json({
      status: 'online',
      whatsapp: connected ? 'connected' : 'disconnected',
      qrAvailable: Boolean(currentQr)
    })
  })

  app.get('/', async (req, res) => {
    const qrToken = process.env.QR_TOKEN

    if (qrToken && req.query.token !== qrToken) {
      return res.status(403).json({
        error: 'Acceso no autorizado.'
      })
    }

    if (connected) {
      return res.status(200).json({
        message: 'WhatsApp ya está conectado.'
      })
    }

    if (!currentQr) {
      return res.status(503).json({
        message: 'El código QR todavía no está disponible. Recarga en unos segundos.'
      })
    }

    try {
      const image = await toBuffer(currentQr, {
        type: 'png',
        width: 360,
        margin: 2,
        errorCorrectionLevel: 'M'
      })

      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'no-store')
      res.end(image)
    } catch (error) {
      console.error('No se pudo generar el QR:', error)
      res.status(500).json({
        error: 'No se pudo generar el código QR.'
      })
    }
  })

  server.listen(port, () => {
    console.log(`Servidor web iniciado en el puerto ${port}`)
    console.log(`Estado del bot: http://localhost:${port}/health`)

    if (global.opts?.keepalive) {
      keepAlive()
    }
  })

  server.on('error', (error) => {
    console.error('Error en el servidor web:', error.message)
  })
}

function pipeEmit(event, event2, prefix = '') {
  const oldEmit = event.emit

  event.emit = function (eventName, ...args) {
    oldEmit.call(event, eventName, ...args)
    event2.emit(`${prefix}${eventName}`, ...args)
    return true
  }

  return {
    unpipeEmit() {
      event.emit = oldEmit
    }
  }
}

function keepAlive() {
  const url =
    process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPL_SLUG && process.env.REPL_OWNER
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : null

  if (!url) {
    console.warn('Keep-alive omitido: no se detectó una URL pública.')
    return
  }

  setInterval(() => {
    fetch(url).catch((error) => {
      console.error('Error en keep-alive:', error.message)
    })
  }, 5 * 60 * 1000)
}

export default connect
export { pipeEmit }
