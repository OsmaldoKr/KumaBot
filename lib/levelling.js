export const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75

function getMultiplier(multiplier) {
  const value = Number(multiplier ?? global.multiplier ?? 1)

  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(
      'El multiplicador debe ser un número mayor que cero.',
    )
  }

  return value
}

/**
 * Obtiene el rango de experiencia requerido para un nivel.
 *
 * @param {number} level Nivel consultado.
 * @param {number} [multiplier] Dificultad del sistema.
 * @returns {{ min: number, max: number, xp: number }}
 */
export function xpRange(
  level,
  multiplier = global.multiplier || 1,
) {
  const currentLevel = Number(level)

  if (!Number.isFinite(currentLevel) || currentLevel < 0) {
    throw new TypeError(
      'El nivel debe ser un número entero mayor o igual a cero.',
    )
  }

  const normalizedLevel = Math.floor(currentLevel)
  const normalizedMultiplier = getMultiplier(multiplier)

  const min =
    normalizedLevel === 0
      ? 0
      : Math.round(
          Math.pow(normalizedLevel, growth) *
          normalizedMultiplier,
        ) + 1

  const max = Math.round(
    Math.pow(normalizedLevel + 1, growth) *
    normalizedMultiplier,
  )

  return {
    min,
    max,
    xp: max - min,
  }
}

/**
 * Encuentra el nivel equivalente a una cantidad de experiencia.
 *
 * @param {number} xp Experiencia acumulada.
 * @param {number} [multiplier] Dificultad del sistema.
 * @returns {number}
 */
export function findLevel(
  xp,
  multiplier = global.multiplier || 1,
) {
  const experience = Number(xp)

  if (experience === Infinity) return Infinity
  if (Number.isNaN(experience)) return NaN
  if (experience <= 0) return -1

  const normalizedMultiplier = getMultiplier(multiplier)

  let lower = 0
  let upper = 1

  while (xpRange(upper, normalizedMultiplier).min <= experience) {
    lower = upper
    upper *= 2

    if (!Number.isFinite(upper)) {
      return Infinity
    }
  }

  while (lower <= upper) {
    const middle = Math.floor((lower + upper) / 2)
    const range = xpRange(middle, normalizedMultiplier)

    if (
      range.min <= experience &&
      experience <= range.max
    ) {
      return middle
    }

    if (range.min > experience) {
      upper = middle - 1
    } else {
      lower = middle + 1
    }
  }

  return Math.max(0, upper)
}

/**
 * Comprueba si un usuario puede subir de nivel.
 *
 * @param {number} level Nivel actual.
 * @param {number} xp Experiencia acumulada.
 * @param {number} [multiplier] Dificultad del sistema.
 * @returns {boolean}
 */
export function canLevelUp(
  level,
  xp,
  multiplier = global.multiplier || 1,
) {
  const currentLevel = Number(level)
  const experience = Number(xp)

  if (
    !Number.isFinite(currentLevel) ||
    currentLevel < 0 ||
    Number.isNaN(experience) ||
    experience <= 0
  ) {
    return false
  }

  if (experience === Infinity) return true

  return Math.floor(currentLevel) < findLevel(
    experience,
    multiplier,
  )
}
