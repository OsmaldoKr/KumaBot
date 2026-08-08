const stdouts = []

let previousWrite = null

export let isModified = false

/**
 * Intercepta la salida de process.stdout.
 *
 * @param {number} maxLength Cantidad máxima de fragmentos guardados.
 * @returns {{
 *   disable: () => void,
 *   logs: () => Buffer,
 *   isModified: boolean
 * }}
 */
export default function captureStdout(maxLength = 200) {
  if (isModified) {
    return {
      disable,
      logs,
      get isModified() {
        return isModified
      },
    }
  }

  previousWrite = process.stdout.write.bind(process.stdout)

  process.stdout.write = (chunk, encoding, callback) => {
    const buffer = Buffer.isBuffer(chunk)
      ? Buffer.from(chunk)
      : Buffer.from(String(chunk), typeof encoding === 'string' ? encoding : 'utf8')

    stdouts.push(buffer)

    if (stdouts.length > maxLength) {
      stdouts.shift()
    }

    return previousWrite(chunk, encoding, callback)
  }

  isModified = true

  return {
    disable,
    logs,
    get isModified() {
      return isModified
    },
  }
}

/**
 * Restaura process.stdout.write a su estado original.
 */
export function disable() {
  if (!isModified || !previousWrite) return

  process.stdout.write = previousWrite
  previousWrite = null
  isModified = false
}

/**
 * Devuelve todos los registros capturados como Buffer.
 *
 * @returns {Buffer}
 */
export function logs() {
  return Buffer.concat(stdouts)
}

/**
 * Elimina los registros guardados de memoria.
 */
export function clearLogs() {
  stdouts.length = 0
}
