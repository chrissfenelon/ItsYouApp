import firestore from '@react-native-firebase/firestore';
import { PlayerProfile } from '../types/wordSearch.types';
import { withRetry } from '../utils/networkUtils';

const MORPION_GAMES_COLLECTION = 'morpion_games';
const MORPION_HISTORY_COLLECTION = 'morpion_history';

export type MorpionSymbol = 'X' | 'O';
export type CellValue = MorpionSymbol | null;

export interface MorpionPlayer {
  id: string;
  profile: PlayerProfile;
  symbol: MorpionSymbol;
  isReady: boolean;
}

export interface MorpionMove {
  playerId: string;
  symbol: MorpionSymbol;
  position: number; // 0-8 pour une grille 3x3, 0-15 pour 4x4, etc.
  timestamp: number;
}

export interface MorpionGame {
  id: string;
  roomCode: string;
  hostId: string;
  players: MorpionPlayer[];
  maxPlayers: 2;
  status: 'waiting' | 'playing' | 'finished' | 'paused';
  board: CellValue[]; // Tableau plat (9 éléments pour 3x3, 16 pour 4x4, etc.)
  boardSize: number; // 3, 4, ou 5
  winCondition: number; // Nombre de symboles alignés pour gagner
  currentPlayer: MorpionSymbol;
  moves: MorpionMove[];
  winner: MorpionSymbol | 'draw' | null;
  winningLine: number[];
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  updatedAt: number;
  pausedAt: number | null;
  pausedBy: string | null; // ID du joueur qui a causé la pause (disconnection)
  pauseReason: 'player_disconnected' | 'manual' | null;
}

export class MorpionService {
  /**
   * Générer un code de room unique (6 caractères)
   */
  static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Vérifier si un code de room est déjà utilisé
   */
  static async isRoomCodeTaken(roomCode: string): Promise<boolean> {
    try {
      const snapshot = await firestore()
        .collection(MORPION_GAMES_COLLECTION)
        .where('roomCode', '==', roomCode)
        .where('status', 'in', ['waiting', 'playing'])
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking room code:', error);
      return false;
    }
  }

  /**
   * Générer un code de room unique en vérifiant qu'il n'existe pas déjà
   */
  static async generateUniqueRoomCode(maxAttempts: number = 5): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = this.generateRoomCode();
      const isTaken = await this.isRoomCodeTaken(code);

      if (!isTaken) {
        return code;
      }

      console.warn(`Room code ${code} already exists, generating a new one (attempt ${attempt + 1}/${maxAttempts})`);
    }

    return this.generateRoomCode();
  }

  /**
   * Créer une nouvelle partie de Morpion
   */
  static async createGame(
    hostProfile: PlayerProfile,
    boardSize: number = 3,
    winCondition?: number
  ): Promise<string> {
    return withRetry(async () => {
      const roomCode = await this.generateUniqueRoomCode();

      // Plateau vide
      const totalCells = boardSize * boardSize;
      const emptyBoard: CellValue[] = Array(totalCells).fill(null);

      // Par défaut, winCondition = boardSize (toute la ligne)
      const finalWinCondition = winCondition || boardSize;

      const hostPlayer: MorpionPlayer = {
        id: hostProfile.id,
        profile: hostProfile,
        symbol: 'X', // L'hôte est toujours X
        isReady: false,
      };

      const gameData: Omit<MorpionGame, 'id'> = {
        roomCode,
        hostId: hostProfile.id,
        players: [hostPlayer],
        maxPlayers: 2,
        status: 'waiting',
        board: emptyBoard,
        boardSize,
        winCondition: finalWinCondition,
        currentPlayer: 'X',
        moves: [],
        winner: null,
        winningLine: [],
        createdAt: Date.now(),
        startedAt: null,
        completedAt: null,
        updatedAt: Date.now(),
        pausedAt: null,
        pausedBy: null,
        pauseReason: null,
      };

      const docRef = await firestore()
        .collection(MORPION_GAMES_COLLECTION)
        .add(gameData);

      console.log('Morpion game created:', {
        gameId: docRef.id,
        roomCode,
        boardSize,
        winCondition: finalWinCondition,
      });

      return docRef.id;
    }, { maxRetries: 3 }, 'createMorpionGame');
  }

  /**
   * Trouver une partie par son code room
   */
  static async findGameByCode(roomCode: string): Promise<string | null> {
    try {
      const snapshot = await firestore()
        .collection(MORPION_GAMES_COLLECTION)
        .where('roomCode', '==', roomCode)
        .where('status', '==', 'waiting')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].id;
    } catch (error) {
      console.error('Error finding game by code:', error);
      throw error;
    }
  }

  /**
   * Rejoindre une partie via le code room
   */
  static async joinGameByCode(
    roomCode: string,
    playerProfile: PlayerProfile
  ): Promise<string> {
    const snapshot = await firestore()
      .collection(MORPION_GAMES_COLLECTION)
      .where('roomCode', '==', roomCode)
      .where('status', '==', 'waiting')
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('Partie non trouvée ou déjà commencée');
    }

    const gameDoc = snapshot.docs[0];
    const game = { id: gameDoc.id, ...gameDoc.data() } as MorpionGame;

    // Vérifier qu'il n'y a qu'un seul joueur
    if (game.players.length >= 2) {
      throw new Error('La partie est complète (2 joueurs maximum)');
    }

    // Vérifier que le joueur n'est pas déjà dans la partie
    if (game.players.some(p => p.id === playerProfile.id)) {
      throw new Error('Vous êtes déjà dans cette partie');
    }

    const newPlayer: MorpionPlayer = {
      id: playerProfile.id,
      profile: playerProfile,
      symbol: 'O', // Le second joueur est toujours O
      isReady: false,
    };

    await gameDoc.ref.update({
      players: firestore.FieldValue.arrayUnion(newPlayer),
      updatedAt: Date.now(),
    });

    console.log('Player joined Morpion game:', {
      gameId: gameDoc.id,
      playerId: playerProfile.id,
      playerName: playerProfile.name,
    });

    return gameDoc.id;
  }

  /**
   * Définir le statut ready d'un joueur
   */
  static async setPlayerReady(
    gameId: string,
    playerId: string,
    isReady: boolean
  ): Promise<void> {
    const gameRef = firestore().collection(MORPION_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as MorpionGame;
    const updatedPlayers = game.players.map(p =>
      p.id === playerId ? { ...p, isReady } : p
    );

    await gameRef.update({
      players: updatedPlayers,
      updatedAt: Date.now(),
    });

    console.log('Player ready status updated:', {
      gameId,
      playerId,
      isReady,
    });
  }

  /**
   * Démarrer la partie (hôte seulement)
   */
  static async startGame(gameId: string, hostId: string): Promise<void> {
    const gameRef = firestore().collection(MORPION_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as MorpionGame;

    if (game.hostId !== hostId) {
      throw new Error('Seul l\'hôte peut démarrer la partie');
    }

    if (game.players.length !== 2) {
      throw new Error('Exactement 2 joueurs sont nécessaires');
    }

    if (!game.players.every(p => p.isReady)) {
      throw new Error('Tous les joueurs doivent être prêts');
    }

    await gameRef.update({
      status: 'playing',
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log('Morpion game started:', { gameId });
  }

  /**
   * Jouer un coup
   */
  static async playMove(
    gameId: string,
    playerId: string,
    position: number
  ): Promise<void> {
    return withRetry(async () => {
      const gameRef = firestore().collection(MORPION_GAMES_COLLECTION).doc(gameId);
      const gameDoc = await gameRef.get();

      if (!gameDoc.exists) {
        throw new Error('Partie non trouvée');
      }

      const game = { id: gameDoc.id, ...gameDoc.data() } as MorpionGame;

      if (game.status !== 'playing') {
        if (game.status === 'paused') {
          throw new Error('La partie est en pause');
        }
        throw new Error('La partie n\'est pas en cours');
      }

      // Trouver le joueur
      const player = game.players.find(p => p.id === playerId);
      if (!player) {
        throw new Error('Joueur non trouvé');
      }

      // Vérifier que c'est son tour
      if (player.symbol !== game.currentPlayer) {
        throw new Error('Ce n\'est pas votre tour');
      }

      // Vérifier que la case est vide
      if (game.board[position] !== null) {
        throw new Error('Cette case est déjà occupée');
      }

      // Mettre à jour le plateau
      const newBoard = [...game.board];
      newBoard[position] = player.symbol;

      // Ajouter le coup à l'historique
      const move: MorpionMove = {
        playerId,
        symbol: player.symbol,
        position,
        timestamp: Date.now(),
      };

      const newMoves = [...game.moves, move];

      // Vérifier la victoire
      const winResult = this.checkWinner(newBoard, game.boardSize, game.winCondition, player.symbol);

      let updateData: any = {
        board: newBoard,
        moves: newMoves,
        updatedAt: Date.now(),
      };

      if (winResult.winner) {
        // Victoire
        updateData.winner = player.symbol;
        updateData.winningLine = winResult.line;
        updateData.status = 'finished';
        updateData.completedAt = Date.now();

        // Sauvegarder dans l'historique
        await this.saveGameHistory(game, player.symbol, newMoves.length);
      } else if (this.isBoardFull(newBoard)) {
        // Match nul
        updateData.winner = 'draw';
        updateData.status = 'finished';
        updateData.completedAt = Date.now();

        // Sauvegarder dans l'historique
        await this.saveGameHistory(game, 'draw', newMoves.length);
      } else {
        // Passer au joueur suivant
        updateData.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
      }

      await gameRef.update(updateData);

      console.log('Move played:', {
        gameId,
        playerId,
        position,
        winner: updateData.winner,
      });
    }, { maxRetries: 2 }, 'playMorpionMove');
  }

  /**
   * Convertir position 1D en coordonnées 2D
   */
  static positionTo2D(position: number, boardSize: number): { row: number; col: number } {
    return {
      row: Math.floor(position / boardSize),
      col: position % boardSize,
    };
  }

  /**
   * Convertir coordonnées 2D en position 1D
   */
  static position2DTo1D(row: number, col: number, boardSize: number): number {
    return row * boardSize + col;
  }

  /**
   * Vérifier s'il y a un gagnant
   */
  static checkWinner(
    board: CellValue[],
    boardSize: number,
    winCondition: number,
    symbol: MorpionSymbol
  ): { winner: boolean; line: number[] } {
    // Vérifier toutes les lignes
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col <= boardSize - winCondition; col++) {
        const line: number[] = [];
        let count = 0;

        for (let i = 0; i < winCondition; i++) {
          const pos = this.position2DTo1D(row, col + i, boardSize);
          if (board[pos] === symbol) {
            line.push(pos);
            count++;
          }
        }

        if (count === winCondition) {
          return { winner: true, line };
        }
      }
    }

    // Vérifier toutes les colonnes
    for (let col = 0; col < boardSize; col++) {
      for (let row = 0; row <= boardSize - winCondition; row++) {
        const line: number[] = [];
        let count = 0;

        for (let i = 0; i < winCondition; i++) {
          const pos = this.position2DTo1D(row + i, col, boardSize);
          if (board[pos] === symbol) {
            line.push(pos);
            count++;
          }
        }

        if (count === winCondition) {
          return { winner: true, line };
        }
      }
    }

    // Vérifier les diagonales (haut-gauche vers bas-droite)
    for (let row = 0; row <= boardSize - winCondition; row++) {
      for (let col = 0; col <= boardSize - winCondition; col++) {
        const line: number[] = [];
        let count = 0;

        for (let i = 0; i < winCondition; i++) {
          const pos = this.position2DTo1D(row + i, col + i, boardSize);
          if (board[pos] === symbol) {
            line.push(pos);
            count++;
          }
        }

        if (count === winCondition) {
          return { winner: true, line };
        }
      }
    }

    // Vérifier les diagonales (haut-droite vers bas-gauche)
    for (let row = 0; row <= boardSize - winCondition; row++) {
      for (let col = winCondition - 1; col < boardSize; col++) {
        const line: number[] = [];
        let count = 0;

        for (let i = 0; i < winCondition; i++) {
          const pos = this.position2DTo1D(row + i, col - i, boardSize);
          if (board[pos] === symbol) {
            line.push(pos);
            count++;
          }
        }

        if (count === winCondition) {
          return { winner: true, line };
        }
      }
    }

    return { winner: false, line: [] };
  }

  /**
   * Vérifier si le plateau est plein
   */
  static isBoardFull(board: CellValue[]): boolean {
    return board.every(cell => cell !== null);
  }

  /**
   * Abandonner la partie
   */
  static async forfeitGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = firestore().collection(MORPION_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as MorpionGame;

    // Trouver le joueur qui abandonne
    const forfeitingPlayer = game.players.find(p => p.id === playerId);
    if (!forfeitingPlayer) {
      throw new Error('Joueur non trouvé');
    }

    // L'autre joueur gagne
    const winnerSymbol = forfeitingPlayer.symbol === 'X' ? 'O' : 'X';

    await gameRef.update({
      status: 'finished',
      winner: winnerSymbol,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Sauvegarder dans l'historique avec indication d'abandon
    await this.saveGameHistory(game, winnerSymbol, game.moves.length, true);

    console.log('Game forfeited:', { gameId, playerId, winner: winnerSymbol });
  }

  /**
   * Quitter la partie
   */
  static async leaveGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = firestore().collection(MORPION_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return;
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as MorpionGame;
    const updatedPlayers = game.players.filter(p => p.id !== playerId);

    if (updatedPlayers.length === 0) {
      // Supprimer la partie si plus de joueurs
      await gameRef.delete();
      console.log('Morpion game deleted (no players left):', { gameId });
    } else {
      // Si l'hôte quitte, assigner un nouvel hôte
      const newHostId = game.hostId === playerId ? updatedPlayers[0].id : game.hostId;

      await gameRef.update({
        players: updatedPlayers,
        hostId: newHostId,
        updatedAt: Date.now(),
      });

      console.log('Player left game:', {
        gameId,
        playerId,
        newHostId: newHostId !== game.hostId ? newHostId : undefined,
      });
    }
  }

  /**
   * S'abonner aux changements de la partie
   */
  static subscribeToGame(
    gameId: string,
    onUpdate: (game: MorpionGame) => void,
    onError?: (error: Error) => void
  ): () => void {
    return firestore()
      .collection(MORPION_GAMES_COLLECTION)
      .doc(gameId)
      .onSnapshot(
        (snapshot) => {
          if (snapshot.exists) {
            const game = { id: snapshot.id, ...snapshot.data() } as MorpionGame;
            onUpdate(game);
          }
        },
        (error) => {
          console.error('Error subscribing to Morpion game:', error);
          if (onError) {
            onError(error);
          }
        }
      );
  }

  /**
   * Sauvegarder la partie dans l'historique
   */
  static async saveGameHistory(
    game: MorpionGame,
    result: MorpionSymbol | 'draw',
    moveCount: number,
    forfeited: boolean = false
  ): Promise<void> {
    try {
      const player1 = game.players[0];
      const player2 = game.players[1];

      if (!player1 || !player2) {
        console.error('Cannot save history: missing players');
        return;
      }

      const duration = game.completedAt && game.startedAt
        ? game.completedAt - game.startedAt
        : 0;

      const winnerId = result === 'draw'
        ? null
        : game.players.find(p => p.symbol === result)?.id || null;

      const loserId = result === 'draw'
        ? null
        : game.players.find(p => p.symbol !== result)?.id || null;

      await firestore().collection(MORPION_HISTORY_COLLECTION).add({
        gameId: game.id,
        roomCode: game.roomCode,
        players: [player1.id, player2.id],
        playerProfiles: [player1.profile, player2.profile],
        winner: winnerId,
        loser: loserId,
        result,
        moveCount,
        duration,
        boardSize: game.boardSize,
        winCondition: game.winCondition,
        winningLine: game.winningLine,
        forfeited,
        timestamp: Date.now(),
        mode: 'online',
      });

      console.log('Game history saved:', {
        gameId: game.id,
        result,
        moveCount,
        forfeited,
      });
    } catch (error) {
      console.error('Error saving game history:', error);
    }
  }

  /**
   * Mettre la partie en pause (en cas de déconnexion)
   */
  static async pauseGame(
    gameId: string,
    playerId: string,
    reason: 'player_disconnected' | 'manual' = 'player_disconnected'
  ): Promise<void> {
    try {
      const gameRef = firestore().collection(MORPION_GAMES_COLLECTION).doc(gameId);
      const gameDoc = await gameRef.get();

      if (!gameDoc.exists) {
        throw new Error('Partie non trouvée');
      }

      const game = { id: gameDoc.id, ...gameDoc.data() } as MorpionGame;

      // Ne peut mettre en pause que si la partie est en cours
      if (game.status !== 'playing') {
        console.warn(`Cannot pause game with status: ${game.status}`);
        return;
      }

      // Vérifier que le joueur fait partie de la partie
      const player = game.players.find(p => p.id === playerId);
      if (!player) {
        throw new Error('Joueur non trouvé dans la partie');
      }

      await gameRef.update({
        status: 'paused',
        pausedAt: Date.now(),
        pausedBy: playerId,
        pauseReason: reason,
        updatedAt: Date.now(),
      });

      console.log('Game paused:', {
        gameId,
        playerId,
        reason,
      });
    } catch (error) {
      console.error('Error pausing game:', error);
      throw error;
    }
  }

  /**
   * Reprendre la partie après une pause
   */
  static async resumeGame(gameId: string, playerId: string): Promise<void> {
    try {
      const gameRef = firestore().collection(MORPION_GAMES_COLLECTION).doc(gameId);
      const gameDoc = await gameRef.get();

      if (!gameDoc.exists) {
        throw new Error('Partie non trouvée');
      }

      const game = { id: gameDoc.id, ...gameDoc.data() } as MorpionGame;

      // Ne peut reprendre que si la partie est en pause
      if (game.status !== 'paused') {
        console.warn(`Cannot resume game with status: ${game.status}`);
        return;
      }

      // Vérifier que le joueur fait partie de la partie
      const player = game.players.find(p => p.id === playerId);
      if (!player) {
        throw new Error('Joueur non trouvé dans la partie');
      }

      // Vérifier que c'est le joueur qui a causé la pause qui reprend
      // (sauf si c'était une pause manuelle, n'importe quel joueur peut reprendre)
      if (game.pauseReason === 'player_disconnected' && game.pausedBy !== playerId) {
        throw new Error('Seul le joueur déconnecté peut reprendre la partie');
      }

      await gameRef.update({
        status: 'playing',
        pausedAt: null,
        pausedBy: null,
        pauseReason: null,
        updatedAt: Date.now(),
      });

      console.log('Game resumed:', {
        gameId,
        playerId,
      });
    } catch (error) {
      console.error('Error resuming game:', error);
      throw error;
    }
  }

  /**
   * Vérifier si une partie peut être reprise
   */
  static async canResumeGame(gameId: string): Promise<boolean> {
    try {
      const gameDoc = await firestore()
        .collection(MORPION_GAMES_COLLECTION)
        .doc(gameId)
        .get();

      if (!gameDoc.exists) {
        return false;
      }

      const game = { id: gameDoc.id, ...gameDoc.data() } as MorpionGame;

      // Peut reprendre si en pause et pas trop ancien (30 minutes max)
      if (game.status === 'paused' && game.pausedAt) {
        const timeSincePause = Date.now() - game.pausedAt;
        const MAX_PAUSE_TIME = 30 * 60 * 1000; // 30 minutes

        return timeSincePause < MAX_PAUSE_TIME;
      }

      return false;
    } catch (error) {
      console.error('Error checking if game can be resumed:', error);
      return false;
    }
  }

  /**
   * Nettoyer les parties en pause trop anciennes
   */
  static async cleanupOldPausedGames(): Promise<void> {
    try {
      const MAX_PAUSE_TIME = 30 * 60 * 1000; // 30 minutes
      const cutoffTime = Date.now() - MAX_PAUSE_TIME;

      const snapshot = await firestore()
        .collection(MORPION_GAMES_COLLECTION)
        .where('status', '==', 'paused')
        .where('pausedAt', '<', cutoffTime)
        .get();

      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'finished',
          winner: null,
          completedAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      await batch.commit();

      console.log(`Cleaned up ${snapshot.docs.length} old paused games`);
    } catch (error) {
      console.error('Error cleaning up old paused games:', error);
    }
  }

  /**
   * Obtenir l'historique des parties d'un utilisateur
   */
  static async getUserGameHistory(userId: string, limit: number = 20) {
    try {
      const snapshot = await firestore()
        .collection(MORPION_HISTORY_COLLECTION)
        .where('players', 'array-contains', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error fetching user game history:', error);
      return [];
    }
  }

  /**
   * Obtenir l'historique des parties entre deux joueurs
   */
  static async getHeadToHeadHistory(user1Id: string, user2Id: string) {
    try {
      const snapshot = await firestore()
        .collection(MORPION_HISTORY_COLLECTION)
        .where('players', 'array-contains', user1Id)
        .orderBy('timestamp', 'desc')
        .get();

      // Filtrer pour ne garder que les parties avec user2Id
      const games = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((game: any) => game.players.includes(user2Id));

      return games;
    } catch (error) {
      console.error('Error fetching head-to-head history:', error);
      return [];
    }
  }
}
