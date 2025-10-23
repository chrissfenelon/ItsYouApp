import { CellValue, AIMove, AIDifficulty } from '../types/puissance4.types';
import { PUISSANCE4_CONFIG, AI_REASONING_MESSAGES } from '../constants/Puissance4Constants';

/**
 * Service d'Intelligence Artificielle pour le Puissance 4
 * Implémente l'algorithme MiniMax avec élagage Alpha-Beta
 */
export class Puissance4AIService {
  private static readonly ROWS = PUISSANCE4_CONFIG.ROWS;
  private static readonly COLS = PUISSANCE4_CONFIG.COLS;
  private static readonly WIN_LENGTH = PUISSANCE4_CONFIG.WIN_LENGTH;

  /**
   * Point d'entrée principal - retourne le meilleur coup selon la difficulté
   */
  static getBestMove(
    board: CellValue[][],
    aiColor: 'Rouge' | 'Jaune',
    difficulty: AIDifficulty = 'moyen'
  ): AIMove {
    const playerColor: 'Rouge' | 'Jaune' = aiColor === 'Rouge' ? 'Jaune' : 'Rouge';

    // Vérifier si on peut gagner immédiatement (TOUJOURS prioritaire)
    const winningMove = this.findImmediateWin(board, aiColor);
    if (winningMove !== null) {
      return {
        column: winningMove,
        score: 10000,
        reasoning: this.getRandomMessage(AI_REASONING_MESSAGES.WINNING_MOVE),
      };
    }

    // Pour mode facile, ne pas bloquer systématiquement
    if (difficulty === 'facile') {
      return this.getEasyMove(board, aiColor, playerColor);
    }

    // Pour autres difficultés, bloquer le joueur s'il peut gagner
    const blockingMove = this.findImmediateWin(board, playerColor);
    if (blockingMove !== null) {
      return {
        column: blockingMove,
        score: 5000,
        reasoning: this.getRandomMessage(AI_REASONING_MESSAGES.BLOCKING_MOVE),
      };
    }

    // Stratégie selon la difficulté
    switch (difficulty) {
      case 'moyen':
        return this.getMediumMove(board, aiColor, playerColor);
      case 'difficile':
        return this.getHardMove(board, aiColor, playerColor);
      case 'expert':
        return this.getExpertMove(board, aiColor, playerColor);
      default:
        return this.getRandomMove(board);
    }
  }

  /**
   * IA Facile - Fait des erreurs intentionnelles, bloque seulement 40% du temps
   */
  private static getEasyMove(
    board: CellValue[][],
    aiColor: 'Rouge' | 'Jaune',
    playerColor: 'Rouge' | 'Jaune'
  ): AIMove {
    const availableCols = this.getAvailableColumns(board);
    const centerCol = Math.floor(this.COLS / 2);

    // Bloquer seulement 40% du temps (au lieu de 100%)
    if (Math.random() < 0.4) {
      const blockingMove = this.findImmediateWin(board, playerColor);
      if (blockingMove !== null) {
        return {
          column: blockingMove,
          score: 5000,
          reasoning: this.getRandomMessage(AI_REASONING_MESSAGES.BLOCKING_MOVE),
        };
      }
    }

    // 30% de chance de jouer complètement au hasard
    if (Math.random() < 0.3) {
      const randomCol = availableCols[Math.floor(Math.random() * availableCols.length)];
      return {
        column: randomCol,
        score: 0,
        reasoning: this.getRandomMessage(AI_REASONING_MESSAGES.RANDOM_MOVE),
      };
    }

    // 50% de chance de jouer au centre si disponible
    if (Math.random() < 0.5 && availableCols.includes(centerCol)) {
      return {
        column: centerCol,
        score: 50,
        reasoning: this.getRandomMessage(AI_REASONING_MESSAGES.CENTER_CONTROL),
      };
    }

    // Sinon jouer aléatoirement
    const randomCol = availableCols[Math.floor(Math.random() * availableCols.length)];
    return {
      column: randomCol,
      score: 0,
      reasoning: this.getRandomMessage(AI_REASONING_MESSAGES.RANDOM_MOVE),
    };
  }

  /**
   * IA Moyenne - Heuristique simple + préférence centre
   */
  private static getMediumMove(
    board: CellValue[][],
    aiColor: 'Rouge' | 'Jaune',
    playerColor: 'Rouge' | 'Jaune'
  ): AIMove {
    const depth = PUISSANCE4_CONFIG.AI.MINIMAX_DEPTH.moyen;
    return this.getMiniMaxMove(board, aiColor, playerColor, depth);
  }

  /**
   * IA Difficile - MiniMax profondeur 5
   */
  private static getHardMove(
    board: CellValue[][],
    aiColor: 'Rouge' | 'Jaune',
    playerColor: 'Rouge' | 'Jaune'
  ): AIMove {
    const depth = PUISSANCE4_CONFIG.AI.MINIMAX_DEPTH.difficile;
    return this.getMiniMaxMove(board, aiColor, playerColor, depth);
  }

  /**
   * IA Expert - MiniMax profondeur 7
   */
  private static getExpertMove(
    board: CellValue[][],
    aiColor: 'Rouge' | 'Jaune',
    playerColor: 'Rouge' | 'Jaune'
  ): AIMove {
    const depth = PUISSANCE4_CONFIG.AI.MINIMAX_DEPTH.expert;
    return this.getMiniMaxMove(board, aiColor, playerColor, depth);
  }

  /**
   * Algorithme MiniMax avec élagage Alpha-Beta
   */
  private static getMiniMaxMove(
    board: CellValue[][],
    aiColor: 'Rouge' | 'Jaune',
    playerColor: 'Rouge' | 'Jaune',
    depth: number
  ): AIMove {
    let bestScore = -Infinity;
    let bestColumn = Math.floor(this.COLS / 2); // Centre par défaut
    const availableCols = this.getAvailableColumns(board);

    // Ordonner les colonnes pour optimiser l'élagage (colonnes centrales d'abord)
    const orderedCols = this.orderColumnsByImportance(availableCols);

    for (const col of orderedCols) {
      const newBoard = this.simulateMove(board, col, aiColor);
      const score = this.minimax(
        newBoard,
        depth - 1,
        -Infinity,
        Infinity,
        false,
        aiColor,
        playerColor
      );

      if (score > bestScore) {
        bestScore = score;
        bestColumn = col;
      }
    }

    // Générer un raisonnement basé sur le score
    let reasoning: string;
    if (bestScore > 900) {
      reasoning = this.getRandomMessage(AI_REASONING_MESSAGES.WINNING_MOVE);
    } else if (bestScore > 400) {
      reasoning = this.getRandomMessage(AI_REASONING_MESSAGES.STRATEGIC_MOVE);
    } else if (bestScore > 0) {
      reasoning = this.getRandomMessage(AI_REASONING_MESSAGES.CENTER_CONTROL);
    } else {
      reasoning = this.getRandomMessage(AI_REASONING_MESSAGES.DEFENSIVE_MOVE);
    }

    return { column: bestColumn, score: bestScore, reasoning };
  }

  /**
   * Fonction MiniMax récursive avec Alpha-Beta pruning
   */
  private static minimax(
    board: CellValue[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiColor: 'Rouge' | 'Jaune',
    playerColor: 'Rouge' | 'Jaune'
  ): number {
    // Cas terminaux
    const winner = this.checkWinner(board);
    if (winner === aiColor) return 1000 + depth; // Préférer victoires rapides
    if (winner === playerColor) return -1000 - depth;
    if (this.isBoardFull(board)) return 0;
    if (depth === 0) return this.evaluatePosition(board, aiColor, playerColor);

    const availableCols = this.getAvailableColumns(board);
    const orderedCols = this.orderColumnsByImportance(availableCols);

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const col of orderedCols) {
        const newBoard = this.simulateMove(board, col, aiColor);
        const score = this.minimax(
          newBoard,
          depth - 1,
          alpha,
          beta,
          false,
          aiColor,
          playerColor
        );
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break; // Élagage Alpha-Beta
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const col of orderedCols) {
        const newBoard = this.simulateMove(board, col, playerColor);
        const score = this.minimax(
          newBoard,
          depth - 1,
          alpha,
          beta,
          true,
          aiColor,
          playerColor
        );
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break; // Élagage Alpha-Beta
      }
      return minScore;
    }
  }

  /**
   * Fonction d'évaluation heuristique d'une position
   */
  private static evaluatePosition(
    board: CellValue[][],
    aiColor: 'Rouge' | 'Jaune',
    playerColor: 'Rouge' | 'Jaune'
  ): number {
    let score = 0;

    // Évaluer toutes les fenêtres possibles de 4 cases
    // Horizontal
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col <= this.COLS - this.WIN_LENGTH; col++) {
        const window = [
          board[row][col],
          board[row][col + 1],
          board[row][col + 2],
          board[row][col + 3],
        ];
        score += this.evaluateWindow(window, aiColor, playerColor);
      }
    }

    // Vertical
    for (let col = 0; col < this.COLS; col++) {
      for (let row = 0; row <= this.ROWS - this.WIN_LENGTH; row++) {
        const window = [
          board[row][col],
          board[row + 1][col],
          board[row + 2][col],
          board[row + 3][col],
        ];
        score += this.evaluateWindow(window, aiColor, playerColor);
      }
    }

    // Diagonale descendante (\)
    for (let row = 0; row <= this.ROWS - this.WIN_LENGTH; row++) {
      for (let col = 0; col <= this.COLS - this.WIN_LENGTH; col++) {
        const window = [
          board[row][col],
          board[row + 1][col + 1],
          board[row + 2][col + 2],
          board[row + 3][col + 3],
        ];
        score += this.evaluateWindow(window, aiColor, playerColor);
      }
    }

    // Diagonale montante (/)
    for (let row = this.WIN_LENGTH - 1; row < this.ROWS; row++) {
      for (let col = 0; col <= this.COLS - this.WIN_LENGTH; col++) {
        const window = [
          board[row][col],
          board[row - 1][col + 1],
          board[row - 2][col + 2],
          board[row - 3][col + 3],
        ];
        score += this.evaluateWindow(window, aiColor, playerColor);
      }
    }

    // Bonus pour contrôle du centre
    const centerCol = Math.floor(this.COLS / 2);
    let centerCount = 0;
    for (let row = 0; row < this.ROWS; row++) {
      if (board[row][centerCol] === aiColor) centerCount++;
    }
    score += centerCount * 3;

    return score;
  }

  /**
   * Évalue une fenêtre de 4 cases avec scoring amélioré
   */
  private static evaluateWindow(
    window: CellValue[],
    aiColor: 'Rouge' | 'Jaune',
    playerColor: 'Rouge' | 'Jaune'
  ): number {
    let score = 0;
    const aiCount = window.filter(cell => cell === aiColor).length;
    const playerCount = window.filter(cell => cell === playerColor).length;
    const emptyCount = window.filter(cell => cell === null).length;

    // Fenêtre favorable à l'IA (scores augmentés)
    if (aiCount === 4) {
      score += 1000;  // Victoire = score très élevé
    } else if (aiCount === 3 && emptyCount === 1) {
      score += 100;   // Quasi-victoire = très important
    } else if (aiCount === 2 && emptyCount === 2) {
      score += 10;    // Opportunité à développer
    } else if (aiCount === 1 && emptyCount === 3) {
      score += 1;     // Début de séquence
    }

    // Fenêtre favorable au joueur - blocage plus agressif
    if (playerCount === 3 && emptyCount === 1) {
      score -= 200;   // URGENT - bloquer absolument
    } else if (playerCount === 2 && emptyCount === 2) {
      score -= 50;    // Bloquer opportunité adverse
    } else if (playerCount === 1 && emptyCount === 3) {
      score -= 5;     // Surveiller
    }

    // Pénaliser les fenêtres mixtes (bloquées)
    if (aiCount > 0 && playerCount > 0) {
      score -= 5;     // Fenêtre inutile
    }

    return score;
  }

  /**
   * Trouve un coup gagnant immédiat
   */
  private static findImmediateWin(
    board: CellValue[][],
    color: 'Rouge' | 'Jaune'
  ): number | null {
    for (let col = 0; col < this.COLS; col++) {
      if (this.canPlayColumn(board, col)) {
        const newBoard = this.simulateMove(board, col, color);
        if (this.checkWinner(newBoard) === color) {
          return col;
        }
      }
    }
    return null;
  }

  /**
   * Vérifie s'il y a un gagnant
   */
  private static checkWinner(board: CellValue[][]): 'Rouge' | 'Jaune' | null {
    // Vérifier toutes les directions pour chaque case
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const color = board[row][col];
        if (!color) continue;

        // Horizontal
        if (col <= this.COLS - this.WIN_LENGTH) {
          let win = true;
          for (let i = 1; i < this.WIN_LENGTH; i++) {
            if (board[row][col + i] !== color) {
              win = false;
              break;
            }
          }
          if (win) return color;
        }

        // Vertical
        if (row <= this.ROWS - this.WIN_LENGTH) {
          let win = true;
          for (let i = 1; i < this.WIN_LENGTH; i++) {
            if (board[row + i][col] !== color) {
              win = false;
              break;
            }
          }
          if (win) return color;
        }

        // Diagonale \
        if (
          row <= this.ROWS - this.WIN_LENGTH &&
          col <= this.COLS - this.WIN_LENGTH
        ) {
          let win = true;
          for (let i = 1; i < this.WIN_LENGTH; i++) {
            if (board[row + i][col + i] !== color) {
              win = false;
              break;
            }
          }
          if (win) return color;
        }

        // Diagonale /
        if (row >= this.WIN_LENGTH - 1 && col <= this.COLS - this.WIN_LENGTH) {
          let win = true;
          for (let i = 1; i < this.WIN_LENGTH; i++) {
            if (board[row - i][col + i] !== color) {
              win = false;
              break;
            }
          }
          if (win) return color;
        }
      }
    }

    return null;
  }

  /**
   * HELPERS
   */

  private static getAvailableColumns(board: CellValue[][]): number[] {
    return Array.from({ length: this.COLS }, (_, i) => i).filter(col =>
      this.canPlayColumn(board, col)
    );
  }

  private static canPlayColumn(board: CellValue[][], col: number): boolean {
    return board[0][col] === null;
  }

  private static findAvailableRow(board: CellValue[][], col: number): number {
    for (let row = this.ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) return row;
    }
    return -1;
  }

  private static simulateMove(
    board: CellValue[][],
    col: number,
    color: 'Rouge' | 'Jaune'
  ): CellValue[][] {
    const newBoard = board.map(row => [...row]);
    const row = this.findAvailableRow(board, col);
    if (row !== -1) {
      newBoard[row][col] = color;
    }
    return newBoard;
  }

  private static isBoardFull(board: CellValue[][]): boolean {
    return board[0].every(cell => cell !== null);
  }

  private static getRandomMove(board: CellValue[][]): AIMove {
    const availableCols = this.getAvailableColumns(board);
    const column = availableCols[Math.floor(Math.random() * availableCols.length)];

    return {
      column,
      score: 0,
      reasoning: this.getRandomMessage(AI_REASONING_MESSAGES.RANDOM_MOVE),
    };
  }

  /**
   * Ordonne les colonnes par importance (centre d'abord)
   * Optimise l'élagage Alpha-Beta
   */
  private static orderColumnsByImportance(columns: number[]): number[] {
    const centerCol = Math.floor(this.COLS / 2);
    return [...columns].sort((a, b) => {
      const distA = Math.abs(a - centerCol);
      const distB = Math.abs(b - centerCol);
      return distA - distB;
    });
  }

  /**
   * Sélectionne un message aléatoire
   */
  private static getRandomMessage(messages: string[]): string {
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

export default Puissance4AIService;
