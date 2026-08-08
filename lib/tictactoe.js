class TicTacToe {
  constructor(playerX = 'x', playerO = 'o') {
    this.playerX = playerX
    this.playerO = playerO

    this._currentTurn = false
    this._x = 0
    this._o = 0
    this.turns = 0
  }

  get board() {
    return this._x | this._o
  }

  get currentTurn() {
    return this._currentTurn ? this.playerO : this.playerX
  }

  get enemyTurn() {
    return this._currentTurn ? this.playerX : this.playerO
  }

  get winner() {
    if (TicTacToe.check(this._x)) return this.playerX
    if (TicTacToe.check(this._o)) return this.playerO

    return false
  }

  get isEnded() {
    return Boolean(this.winner) || this.board === 0b111111111
  }

  /**
   * Comprueba si un tablero contiene una combinación ganadora.
   *
   * @param {number} state Estado binario del jugador.
   * @returns {boolean}
   */
  static check(state) {
    const winningCombinations = [
      0b000000111,
      0b000111000,
      0b111000000,
      0b001001001,
      0b010010010,
      0b100100100,
      0b100010001,
      0b001010100,
    ]

    return winningCombinations.some(
      (combination) => (state & combination) === combination,
    )
  }

  /**
   * Convierte coordenadas del tablero a posición binaria.
   *
   * @param {number} x Columna: 0 a 2.
   * @param {number} y Fila: 0 a 2.
   * @returns {number}
   */
  static toBinary(x = 0, y = 0) {
    if (x < 0 || x > 2 || y < 0 || y > 2) {
      throw new Error('Posición inválida.')
    }

    return 1 << (x + 3 * y)
  }

  /**
   * Realiza un turno.
   *
   * @param {0 | 1} player 0 representa X y 1 representa O.
   * @param {number} x Posición de 0 a 8, o columna si se incluye y.
   * @param {number} [y] Fila de 0 a 2.
   * @returns {-3 | -2 | -1 | 0 | 1}
   *
   * - -3: La partida ya terminó.
   * - -2: No es el turno de ese jugador.
   * - -1: Posición inválida.
   * - 0: Casilla ocupada.
   * - 1: Movimiento realizado.
   */
  turn(player = 0, x = 0, y = null) {
    if (this.isEnded) return -3

    if (player !== 0 && player !== 1) return -2

    let position

    if (y === null || y === undefined) {
      if (x < 0 || x > 8) return -1
      position = 1 << x
    } else {
      if (x < 0 || x > 2 || y < 0 || y > 2) return -1
      position = TicTacToe.toBinary(x, y)
    }

    const expectedPlayer = this._currentTurn ? 1 : 0

    if (player !== expectedPlayer) return -2
    if (this.board & position) return 0

    if (this._currentTurn) {
      this._o |= position
    } else {
      this._x |= position
    }

    this._currentTurn = !this._currentTurn
    this.turns += 1

    return 1
  }

  /**
   * Dibuja el tablero.
   *
   * @param {number} boardX Posiciones de X.
   * @param {number} boardO Posiciones de O.
   * @returns {Array<'X' | 'O' | number>}
   */
  static render(boardX = 0, boardO = 0) {
    return Array.from({ length: 9 }, (_, index) => {
      const position = 1 << index

      if (boardX & position) return 'X'
      if (boardO & position) return 'O'

      return index + 1
    })
  }

  /**
   * Dibuja el tablero actual.
   *
   * @returns {Array<'X' | 'O' | number>}
   */
  render() {
    return TicTacToe.render(this._x, this._o)
  }
}

export default TicTacToe
