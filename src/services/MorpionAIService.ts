export type AIPersonality = 'aggressive' | 'defensive' | 'balanced';
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface AIMove {
  row: number;
  col: number;
  confidence: number;
  reasoning: string;
}

interface PositionCache {
  [key: string]: number;
}

interface MCTSNode {
  visits: number;
  wins: number;
  children: Map<string, MCTSNode>;
  move?: { row: number; col: number };
}

/**
 * Enhanced Morpion AI Service with dynamic board support and advanced strategies
 */
export class MorpionAIService {
  private static positionCache: PositionCache = {};
  private static openingBook3x3: Map<string, { row: number; col: number }> = new Map();

  /**
   * Initialize opening book for 3x3 expert play
   */
  private static initializeOpeningBook() {
    if (this.openingBook3x3.size > 0) return;

    // Perfect opening moves for 3x3
    this.openingBook3x3.set('000000000', { row: 1, col: 1 }); // Empty board -> center
    this.openingBook3x3.set('X00000000', { row: 1, col: 1 }); // Corner -> center
    this.openingBook3x3.set('0X0000000', { row: 1, col: 1 }); // Edge -> center
    this.openingBook3x3.set('00X000000', { row: 1, col: 1 }); // Corner -> center
    this.openingBook3x3.set('000X00000', { row: 0, col: 0 }); // Center -> corner
    this.openingBook3x3.set('0000X0000', { row: 0, col: 0 }); // Center -> corner
  }

  /**
   * Get the best move for the AI based on difficulty and personality
   */
  static getBestMove(
    board: (string | null)[][],
    aiSymbol: 'X' | 'O',
    difficulty: AIDifficulty,
    personality: AIPersonality = 'balanced',
    boardSize?: number
  ): AIMove {
    const size = boardSize || board.length;
    const availableMoves = this.getAvailableMoves(board);

    if (availableMoves.length === 0) {
      throw new Error('No available moves');
    }

    // Clear cache if it gets too large
    if (Object.keys(this.positionCache).length > 10000) {
      this.positionCache = {};
    }

    // For easy difficulty, sometimes make random moves
    if (difficulty === 'easy' && Math.random() < 0.4) {
      const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      return {
        ...randomMove,
        confidence: 0.3,
        reasoning: 'Coup aléatoire (facile)'
      };
    }

    switch (difficulty) {
      case 'easy':
        return this.getEasyMove(board, aiSymbol, availableMoves, personality);
      case 'medium':
        return this.getMediumMove(board, aiSymbol, availableMoves, personality);
      case 'hard':
        return this.getHardMove(board, aiSymbol, availableMoves, personality, size);
      case 'expert':
        return this.getExpertMove(board, aiSymbol, availableMoves, personality, size);
      default:
        return this.getMediumMove(board, aiSymbol, availableMoves, personality);
    }
  }

  /**
   * Easy AI - Fait plus d'erreurs intentionnelles, bloque seulement 30% du temps
   */
  private static getEasyMove(
    board: (string | null)[][],
    aiSymbol: 'X' | 'O',
    availableMoves: { row: number; col: number }[],
    personality: AIPersonality
  ): AIMove {
    const playerSymbol = aiSymbol === 'X' ? 'O' : 'X';

    // Toujours gagner si possible
    for (const move of availableMoves) {
      const testBoard = this.makeTestMove(board, move.row, move.col, aiSymbol);
      if (this.checkWinner(testBoard)) {
        return {
          ...move,
          confidence: 0.9,
          reasoning: 'Coup gagnant trouvé!'
        };
      }
    }

    // Bloquer seulement 30% du temps (au lieu de 50%)
    if (Math.random() < 0.3) {
      for (const move of availableMoves) {
        const testBoard = this.makeTestMove(board, move.row, move.col, playerSymbol);
        if (this.checkWinner(testBoard)) {
          return {
            ...move,
            confidence: 0.6,
            reasoning: 'Blocage de l\'adversaire'
          };
        }
      }
    }

    // 50% de coups complètement aléatoires (au lieu de 40%)
    if (Math.random() < 0.5) {
      const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      return {
        ...randomMove,
        confidence: 0.3,
        reasoning: 'Coup aléatoire'
      };
    }

    // Sinon coup stratégique faible
    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    return {
      ...randomMove,
      confidence: 0.3,
      reasoning: 'Coup stratégique aléatoire'
    };
  }

  /**
   * Medium AI - Good pattern recognition and strategy
   */
  private static getMediumMove(
    board: (string | null)[][],
    aiSymbol: 'X' | 'O',
    availableMoves: { row: number; col: number }[],
    personality: AIPersonality
  ): AIMove {
    const playerSymbol = aiSymbol === 'X' ? 'O' : 'X';

    // Always check for immediate win
    for (const move of availableMoves) {
      const testBoard = this.makeTestMove(board, move.row, move.col, aiSymbol);
      if (this.checkWinner(testBoard)) {
        return {
          ...move,
          confidence: 1.0,
          reasoning: 'Victoire assurée!'
        };
      }
    }

    // Always block opponent wins
    for (const move of availableMoves) {
      const testBoard = this.makeTestMove(board, move.row, move.col, playerSymbol);
      if (this.checkWinner(testBoard)) {
        return {
          ...move,
          confidence: 0.9,
          reasoning: 'Blocage crucial'
        };
      }
    }

    // Check for fork opportunities (aggressive personality)
    if (personality === 'aggressive') {
      const forkMove = this.findForkOpportunity(board, aiSymbol, availableMoves);
      if (forkMove) {
        return {
          ...forkMove,
          confidence: 0.85,
          reasoning: 'Création d\'une fourchette!'
        };
      }
    }

    // Block opponent forks (defensive personality)
    if (personality === 'defensive') {
      const blockFork = this.findForkOpportunity(board, playerSymbol, availableMoves);
      if (blockFork) {
        return {
          ...blockFork,
          confidence: 0.8,
          reasoning: 'Blocage de fourchette'
        };
      }
    }

    // Strategic moves based on personality
    return this.getStrategicMove(board, aiSymbol, availableMoves, personality, 'medium');
  }

  /**
   * Hard AI - Advanced strategy with lookahead
   */
  private static getHardMove(
    board: (string | null)[][],
    aiSymbol: 'X' | 'O',
    availableMoves: { row: number; col: number }[],
    personality: AIPersonality,
    boardSize: number
  ): AIMove {
    // Use minimax with depth based on board size
    const depth = boardSize <= 3 ? 8 : boardSize === 4 ? 6 : 4;
    const bestMove = this.minimax(board, depth, true, aiSymbol, aiSymbol, -Infinity, Infinity, personality);

    if (bestMove.move) {
      return {
        row: bestMove.move.row,
        col: bestMove.move.col,
        confidence: 0.95,
        reasoning: `Coup optimal calculé (${depth} coups d'avance)`
      };
    }

    // Fallback to medium strategy
    return this.getMediumMove(board, aiSymbol, availableMoves, personality);
  }

  /**
   * Expert AI - Perfect play using full minimax or MCTS
   */
  private static getExpertMove(
    board: (string | null)[][],
    aiSymbol: 'X' | 'O',
    availableMoves: { row: number; col: number }[],
    personality: AIPersonality,
    boardSize: number
  ): AIMove {
    this.initializeOpeningBook();

    // Use opening book for 3x3
    if (boardSize === 3 && availableMoves.length > 6) {
      const boardKey = this.boardToString(board);
      const openingMove = this.openingBook3x3.get(boardKey);
      if (openingMove && board[openingMove.row][openingMove.col] === null) {
        return {
          ...openingMove,
          confidence: 1.0,
          reasoning: 'Ouverture parfaite du livre'
        };
      }
    }

    // For large boards (5x5+), use MCTS
    if (boardSize >= 5 && availableMoves.length > 15) {
      return this.getMCTSMove(board, aiSymbol, availableMoves, 1000);
    }

    // Use full minimax for smaller boards
    const depth = boardSize <= 3 ? 10 : boardSize === 4 ? 8 : 6;
    const bestMove = this.minimax(board, depth, true, aiSymbol, aiSymbol, -Infinity, Infinity, personality);

    if (bestMove.move) {
      return {
        row: bestMove.move.row,
        col: bestMove.move.col,
        confidence: 1.0,
        reasoning: 'Calcul stratégique parfait'
      };
    }

    // Fallback
    return this.getHardMove(board, aiSymbol, availableMoves, personality, boardSize);
  }

  /**
   * Minimax algorithm with alpha-beta pruning and personality
   */
  private static minimax(
    board: (string | null)[][],
    depth: number,
    isMaximizing: boolean,
    aiSymbol: 'X' | 'O',
    currentPlayer: 'X' | 'O',
    alpha: number,
    beta: number,
    personality: AIPersonality = 'balanced'
  ): { score: number; move?: { row: number; col: number } } {
    // Check cache
    const boardKey = this.boardToString(board) + depth + isMaximizing;
    if (this.positionCache[boardKey] !== undefined) {
      return { score: this.positionCache[boardKey] };
    }

    const playerSymbol = aiSymbol === 'X' ? 'O' : 'X';
    const winner = this.checkWinner(board);

    // Terminal states with depth-based scoring
    if (winner) {
      const score = winner === aiSymbol ? 100 + depth : -100 - depth;
      this.positionCache[boardKey] = score;
      return { score };
    }

    if (this.isBoardFull(board) || depth === 0) {
      const score = this.evaluatePosition(board, aiSymbol, personality);
      this.positionCache[boardKey] = score;
      return { score };
    }

    const availableMoves = this.getAvailableMoves(board);

    // Sort moves by heuristic for better pruning
    const sortedMoves = this.sortMovesByHeuristic(board, availableMoves, currentPlayer, aiSymbol);
    let bestMove: { row: number; col: number } | undefined;

    if (isMaximizing) {
      let maxScore = -Infinity;

      for (const move of sortedMoves) {
        const testBoard = this.makeTestMove(board, move.row, move.col, currentPlayer);
        const result = this.minimax(
          testBoard,
          depth - 1,
          false,
          aiSymbol,
          playerSymbol, // FIXED: Switch to opponent
          alpha,
          beta,
          personality
        );

        if (result.score > maxScore) {
          maxScore = result.score;
          bestMove = move;
        }

        alpha = Math.max(alpha, result.score);
        if (beta <= alpha) break; // Alpha-beta pruning
      }

      this.positionCache[boardKey] = maxScore;
      return { score: maxScore, move: bestMove };
    } else {
      let minScore = Infinity;

      for (const move of sortedMoves) {
        const testBoard = this.makeTestMove(board, move.row, move.col, currentPlayer);
        const result = this.minimax(
          testBoard,
          depth - 1,
          true,
          aiSymbol,
          aiSymbol, // FIXED: Switch back to AI
          alpha,
          beta,
          personality
        );

        if (result.score < minScore) {
          minScore = result.score;
          bestMove = move;
        }

        beta = Math.min(beta, result.score);
        if (beta <= alpha) break; // Alpha-beta pruning
      }

      this.positionCache[boardKey] = minScore;
      return { score: minScore, move: bestMove };
    }
  }

  /**
   * Monte Carlo Tree Search for large boards
   */
  private static getMCTSMove(
    board: (string | null)[][],
    aiSymbol: 'X' | 'O',
    availableMoves: { row: number; col: number }[],
    iterations: number
  ): AIMove {
    const root: MCTSNode = { visits: 0, wins: 0, children: new Map() };
    const playerSymbol = aiSymbol === 'X' ? 'O' : 'X';

    for (let i = 0; i < iterations; i++) {
      let node = root;
      let simulationBoard = board.map(row => [...row]);
      let currentPlayer: 'X' | 'O' = aiSymbol;
      const path: MCTSNode[] = [root];

      // Selection & Expansion
      while (!this.checkWinner(simulationBoard) && !this.isBoardFull(simulationBoard)) {
        const moves = this.getAvailableMoves(simulationBoard);

        if (node.children.size < moves.length) {
          // Expand
          const unexploredMoves = moves.filter(
            m => !node.children.has(`${m.row},${m.col}`)
          );
          const move = unexploredMoves[Math.floor(Math.random() * unexploredMoves.length)];
          const child: MCTSNode = { visits: 0, wins: 0, children: new Map(), move };
          node.children.set(`${move.row},${move.col}`, child);
          node = child;
          simulationBoard = this.makeTestMove(simulationBoard, move.row, move.col, currentPlayer);
          path.push(node);
          break;
        } else {
          // Select best UCB1
          let bestUCB = -Infinity;
          let bestChild: MCTSNode | undefined = undefined;

          node.children.forEach((child: MCTSNode) => {
            const ucb = child.visits === 0
              ? Infinity
              : child.wins / child.visits + Math.sqrt(2 * Math.log(node.visits) / child.visits);
            if (ucb > bestUCB) {
              bestUCB = ucb;
              bestChild = child;
            }
          });

          if (bestChild && bestChild.move) {
            node = bestChild;
            simulationBoard = this.makeTestMove(simulationBoard, bestChild.move.row, bestChild.move.col, currentPlayer);
            path.push(node);
          } else {
            break; // Exit if no valid child
          }
        }

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      }

      // Simulation (random playout)
      let simPlayer = currentPlayer;
      while (!this.checkWinner(simulationBoard) && !this.isBoardFull(simulationBoard)) {
        const moves = this.getAvailableMoves(simulationBoard);
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        simulationBoard = this.makeTestMove(simulationBoard, randomMove.row, randomMove.col, simPlayer);
        simPlayer = simPlayer === 'X' ? 'O' : 'X';
      }

      // Backpropagation
      const winner = this.checkWinner(simulationBoard);
      const score = winner === aiSymbol ? 1 : winner === playerSymbol ? 0 : 0.5;

      path.forEach(n => {
        n.visits++;
        n.wins += score;
      });
    }

    // Select best move
    let bestMove: { row: number; col: number } | undefined = undefined;
    let bestVisits = -1;

    root.children.forEach((child: MCTSNode) => {
      if (child.visits > bestVisits && child.move) {
        bestVisits = child.visits;
        bestMove = { row: child.move.row, col: child.move.col };
      }
    });

    if (bestMove) {
      return {
        row: bestMove.row,
        col: bestMove.col,
        confidence: 0.95,
        reasoning: `MCTS (${iterations} simulations)`
      };
    }

    // Fallback
    return {
      ...availableMoves[0],
      confidence: 0.5,
      reasoning: 'Coup par défaut'
    };
  }

  /**
   * Find fork opportunity (two ways to win)
   */
  private static findForkOpportunity(
    board: (string | null)[][],
    symbol: 'X' | 'O',
    availableMoves: { row: number; col: number }[]
  ): { row: number; col: number } | null {
    for (const move of availableMoves) {
      const testBoard = this.makeTestMove(board, move.row, move.col, symbol);
      let winningMoves = 0;

      // Count how many winning moves this creates
      for (const nextMove of this.getAvailableMoves(testBoard)) {
        const testBoard2 = this.makeTestMove(testBoard, nextMove.row, nextMove.col, symbol);
        if (this.checkWinner(testBoard2)) {
          winningMoves++;
        }
      }

      if (winningMoves >= 2) {
        return move;
      }
    }

    return null;
  }

  /**
   * Evaluate board position heuristically
   */
  private static evaluatePosition(
    board: (string | null)[][],
    aiSymbol: 'X' | 'O',
    personality: AIPersonality
  ): number {
    const size = board.length;
    const playerSymbol = aiSymbol === 'X' ? 'O' : 'X';
    let score = 0;

    // Center control bonus
    const center = Math.floor(size / 2);
    if (board[center]?.[center] === aiSymbol) {
      score += personality === 'aggressive' ? 5 : 3;
    } else if (board[center]?.[center] === playerSymbol) {
      score -= personality === 'defensive' ? 5 : 3;
    }

    // Corner control
    const corners = [
      [0, 0], [0, size - 1],
      [size - 1, 0], [size - 1, size - 1]
    ];

    corners.forEach(([r, c]) => {
      if (board[r]?.[c] === aiSymbol) score += 2;
      else if (board[r]?.[c] === playerSymbol) score -= 2;
    });

    return score;
  }

  /**
   * Sort moves by heuristic for better alpha-beta pruning
   */
  private static sortMovesByHeuristic(
    board: (string | null)[][],
    moves: { row: number; col: number }[],
    currentPlayer: 'X' | 'O',
    aiSymbol: 'X' | 'O'
  ): { row: number; col: number }[] {
    const size = board.length;
    const center = Math.floor(size / 2);

    return moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Prioritize center
      if (a.row === center && a.col === center) scoreA += 10;
      if (b.row === center && b.col === center) scoreB += 10;

      // Prioritize corners
      if ((a.row === 0 || a.row === size - 1) && (a.col === 0 || a.col === size - 1)) scoreA += 5;
      if ((b.row === 0 || b.row === size - 1) && (b.col === 0 || b.col === size - 1)) scoreB += 5;

      // Check if move creates immediate win
      const testBoardA = this.makeTestMove(board, a.row, a.col, currentPlayer);
      const testBoardB = this.makeTestMove(board, b.row, b.col, currentPlayer);

      if (this.checkWinner(testBoardA)) scoreA += 1000;
      if (this.checkWinner(testBoardB)) scoreB += 1000;

      return scoreB - scoreA;
    });
  }

  /**
   * Get strategic move based on personality
   */
  private static getStrategicMove(
    board: (string | null)[][],
    aiSymbol: 'X' | 'O',
    availableMoves: { row: number; col: number }[],
    personality: AIPersonality,
    difficulty: 'medium' | 'hard'
  ): AIMove {
    const size = board.length;
    const center = Math.floor(size / 2);

    // Prefer center if available
    if (board[center][center] === null) {
      return {
        row: center,
        col: center,
        confidence: 0.8,
        reasoning: 'Prise du centre'
      };
    }

    // Prefer corners
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: size - 1 },
      { row: size - 1, col: 0 },
      { row: size - 1, col: size - 1 }
    ];

    const availableCorners = corners.filter(corner =>
      board[corner.row][corner.col] === null
    );

    if (availableCorners.length > 0) {
      const corner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
      return {
        ...corner,
        confidence: 0.7,
        reasoning: 'Position stratégique en coin'
      };
    }

    // Otherwise pick best available move
    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    return {
      ...randomMove,
      confidence: 0.5,
      reasoning: 'Positionnement tactique'
    };
  }

  /**
   * Helper: Convert board to string for caching
   */
  private static boardToString(board: (string | null)[][]): string {
    return board.flat().map(cell => cell || '0').join('');
  }

  /**
   * Helper: Get available moves
   */
  private static getAvailableMoves(board: (string | null)[][]): { row: number; col: number }[] {
    const moves: { row: number; col: number }[] = [];
    const size = board.length;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === null) {
          moves.push({ row, col });
        }
      }
    }

    return moves;
  }

  /**
   * Helper: Make test move
   */
  private static makeTestMove(
    board: (string | null)[][],
    row: number,
    col: number,
    symbol: string
  ): (string | null)[][] {
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = symbol;
    return newBoard;
  }

  /**
   * Helper: Check winner (supports dynamic board sizes)
   */
  private static checkWinner(board: (string | null)[][]): string | null {
    const size = board.length;
    const winCondition = size <= 5 ? 3 : size === 6 ? 4 : 5; // Dynamic win condition

    // Check rows
    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= size - winCondition; col++) {
        const firstCell = board[row][col];
        if (!firstCell) continue;

        let isWin = true;
        for (let k = 1; k < winCondition; k++) {
          if (board[row][col + k] !== firstCell) {
            isWin = false;
            break;
          }
        }
        if (isWin) return firstCell;
      }
    }

    // Check columns
    for (let col = 0; col < size; col++) {
      for (let row = 0; row <= size - winCondition; row++) {
        const firstCell = board[row][col];
        if (!firstCell) continue;

        let isWin = true;
        for (let k = 1; k < winCondition; k++) {
          if (board[row + k][col] !== firstCell) {
            isWin = false;
            break;
          }
        }
        if (isWin) return firstCell;
      }
    }

    // Check diagonals (top-left to bottom-right)
    for (let row = 0; row <= size - winCondition; row++) {
      for (let col = 0; col <= size - winCondition; col++) {
        const firstCell = board[row][col];
        if (!firstCell) continue;

        let isWin = true;
        for (let k = 1; k < winCondition; k++) {
          if (board[row + k][col + k] !== firstCell) {
            isWin = false;
            break;
          }
        }
        if (isWin) return firstCell;
      }
    }

    // Check diagonals (top-right to bottom-left)
    for (let row = 0; row <= size - winCondition; row++) {
      for (let col = winCondition - 1; col < size; col++) {
        const firstCell = board[row][col];
        if (!firstCell) continue;

        let isWin = true;
        for (let k = 1; k < winCondition; k++) {
          if (board[row + k][col - k] !== firstCell) {
            isWin = false;
            break;
          }
        }
        if (isWin) return firstCell;
      }
    }

    return null;
  }

  /**
   * Helper: Check if board is full
   */
  private static isBoardFull(board: (string | null)[][]): boolean {
    return board.every(row => row.every(cell => cell !== null));
  }

  /**
   * Get AI personality description
   */
  static getPersonalityDescription(personality: AIPersonality): string {
    switch (personality) {
      case 'aggressive':
        return 'Priorise les attaques et victoires rapides';
      case 'defensive':
        return 'Focus sur le blocage et positionnement prudent';
      case 'balanced':
        return 'Adapte la stratégie selon la situation';
      default:
        return 'Approche stratégique équilibrée';
    }
  }

  /**
   * Get difficulty description
   */
  static getDifficultyDescription(difficulty: AIDifficulty): string {
    switch (difficulty) {
      case 'easy':
        return 'Fait des erreurs occasionnelles, bon pour débuter';
      case 'medium':
        return 'Stratégie solide avec bonne reconnaissance';
      case 'hard':
        return 'Planification avancée, pense plusieurs coups à l\'avance';
      case 'expert':
        return 'Jeu parfait, extrêmement difficile';
      default:
        return 'Niveau de difficulté équilibré';
    }
  }

  /**
   * Get combined AI description
   */
  static getAIDescription(difficulty: AIDifficulty, personality: AIPersonality): string {
    const difficultyDesc = this.getDifficultyDescription(difficulty);
    const personalityDesc = this.getPersonalityDescription(personality);
    return `${difficultyDesc}. ${personalityDesc}`;
  }

  /**
   * Clear position cache
   */
  static clearCache(): void {
    this.positionCache = {};
  }
}

export default MorpionAIService;
