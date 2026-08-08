declare class TicTacToe {
  /** Nombre del jugador X. */
  playerX: string

  /** Nombre del jugador O. */
  playerO: string

  /** false: turno de X. true: turno de O. */
  _currentTurn: boolean

  /** Posiciones ocupadas por X. */
  _x: number

  /** Posiciones ocupadas por O. */
  _o: number

  /** Cantidad de movimientos realizados. */
  turns: number

  constructor(playerX?: string, playerO?: string)

  /** Tablero completo como número binario. */
  get board(): number

  /** Jugador que debe realizar el siguiente movimiento. */
  get currentTurn(): string

  /** Jugador contrario al turno actual. */
  get enemyTurn(): string

  /** Ganador de la partida o false si aún no existe. */
  get winner(): string | false

  /** Indica si la partida terminó por victoria o empate. */
  get isEnded(): boolean

  /**
   * Comprueba si un estado contiene una combinación ganadora.
   */
  static check(state: number): boolean

  /**
   * Convierte coordenadas a una posición binaria.
   */
  static toBinary(x?: number, y?: number): number

  /**
   * Realiza un movimiento usando una posición de 0 a 8.
   *
   * - -3: partida terminada
   * - -2: turno inválido
   * - -1: posición inválida
   * - 0: casilla ocupada
   * - 1: movimiento realizado
   */
  turn(
    player: 0 | 1,
    index: number,
  ): -3 | -2 | -1 | 0 | 1

  /**
   * Realiza un movimiento usando columna y fila, ambas de 0 a 2.
   */
  turn(
    player: 0 | 1,
    x: number,
    y: number,
  ): -3 | -2 | -1 | 0 | 1

  /**
   * Genera las nueve casillas del tablero.
   */
  static render(
    boardX?: number,
    boardO?: number,
  ): Array<'X' | 'O' | number>

  /**
   * Genera las nueve casillas del tablero actual.
   */
  render(): Array<'X' | 'O' | number>
}

export default TicTacToe
