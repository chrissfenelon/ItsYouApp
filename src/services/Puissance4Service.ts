import firestore from '@react-native-firebase/firestore';
import { CellValue, Puissance4Stakes } from '../types/puissance4.types';
import { PlayerProfile } from '../types/wordSearch.types';
import { PUISSANCE4_CONFIG } from '../constants/Puissance4Constants';
import { withRetry, getErrorMessage } from '../utils/networkUtils';

const PUISSANCE4_GAMES_COLLECTION = 'puissance4_games';
const PUISSANCE4_HISTORY_COLLECTION = 'puissance4_history';

export interface Puissance4Player {
  id: string;
  profile: PlayerProfile;
  color: 'Rouge' | 'Jaune';
  isReady: boolean;
}

export interface Puissance4Move {
  playerId: string;
  color: 'Rouge' | 'Jaune';
  column: number;
  row: number;
  timestamp: number;
}

export interface Puissance4Game {
  id: string;
  roomCode: string;
  hostId: string;
  players: Puissance4Player[];
  maxPlayers: 2;
  status: 'waiting' | 'playing' | 'finished';
  board: (CellValue | null)[]; // Tableau plat pour Firestore (6x7 = 42 éléments)
  currentPlayer: 'Rouge' | 'Jaune';
  moves: Puissance4Move[];
  winner: 'Rouge' | 'Jaune' | 'draw' | null;
  winningLine: { row: number; col: number }[];
  stakes: Puissance4Stakes | null;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  updatedAt: number;
}

export class Puissance4Service {
  /**
   * Convertir un board plat en board 2D pour l'affichage
   */
  static flatTo2D(flatBoard: (CellValue | null)[]): CellValue[][] {
    const board: CellValue[][] = [];
    for (let row = 0; row < PUISSANCE4_CONFIG.ROWS; row++) {
      const rowData: CellValue[] = [];
      for (let col = 0; col < PUISSANCE4_CONFIG.COLS; col++) {
        const index = row * PUISSANCE4_CONFIG.COLS + col;
        rowData.push(flatBoard[index] || null);
      }
      board.push(rowData);
    }
    return board;
  }

  /**
   * Convertir un board 2D en board plat pour Firestore
   */
  static twoDToFlat(board2D: CellValue[][]): (CellValue | null)[] {
    const flatBoard: (CellValue | null)[] = [];
    for (let row = 0; row < PUISSANCE4_CONFIG.ROWS; row++) {
      for (let col = 0; col < PUISSANCE4_CONFIG.COLS; col++) {
        flatBoard.push(board2D[row][col] || null);
      }
    }
    return flatBoard;
  }

  /**
   * Obtenir une cellule depuis le board plat
   */
  static getCell(flatBoard: (CellValue | null)[], row: number, col: number): CellValue | null {
    const index = row * PUISSANCE4_CONFIG.COLS + col;
    return flatBoard[index] || null;
  }

  /**
   * Définir une cellule dans le board plat
   */
  static setCell(flatBoard: (CellValue | null)[], row: number, col: number, value: CellValue | null): (CellValue | null)[] {
    const newBoard = [...flatBoard];
    const index = row * PUISSANCE4_CONFIG.COLS + col;
    newBoard[index] = value;
    return newBoard;
  }

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
        .collection(PUISSANCE4_GAMES_COLLECTION)
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
   * Créer une nouvelle partie de Puissance 4
   */
  static async createGame(hostProfile: PlayerProfile, stakes?: Puissance4Stakes): Promise<string> {
    return withRetry(async () => {
      const roomCode = await this.generateUniqueRoomCode();

      // Plateau vide - Firestore ne supporte pas les nested arrays
      // On stocke le board comme un tableau plat de 42 éléments (6 rows x 7 cols)
      const emptyBoard: (CellValue | null)[] = Array(PUISSANCE4_CONFIG.ROWS * PUISSANCE4_CONFIG.COLS).fill(null);

      const hostPlayer: Puissance4Player = {
        id: hostProfile.id,
        profile: hostProfile,
        color: 'Rouge', // L'hôte est toujours Rouge
        isReady: false,
      };

      const gameData: Omit<Puissance4Game, 'id'> = {
        roomCode,
        hostId: hostProfile.id,
        players: [hostPlayer],
        maxPlayers: 2,
        status: 'waiting',
        board: emptyBoard,
        currentPlayer: 'Rouge',
        moves: [],
        winner: null,
        winningLine: [],
        stakes: stakes || null,
        createdAt: Date.now(),
        startedAt: null,
        completedAt: null,
        updatedAt: Date.now(),
      };

      const docRef = await firestore()
        .collection(PUISSANCE4_GAMES_COLLECTION)
        .add(gameData);

      console.log('Puissance 4 game created:', {
        gameId: docRef.id,
        roomCode,
      });

      return docRef.id;
    }, { maxRetries: 3 }, 'createPuissance4Game');
  }

  /**
   * Rejoindre une partie via le code room
   */
  static async joinGameByCode(
    roomCode: string,
    playerProfile: PlayerProfile
  ): Promise<string> {
    const snapshot = await firestore()
      .collection(PUISSANCE4_GAMES_COLLECTION)
      .where('roomCode', '==', roomCode)
      .where('status', '==', 'waiting')
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('Partie non trouvée ou déjà commencée');
    }

    const gameDoc = snapshot.docs[0];
    const game = { id: gameDoc.id, ...gameDoc.data() } as Puissance4Game;

    // Vérifier qu'il n'y a qu'un seul joueur
    if (game.players.length >= 2) {
      throw new Error('La partie est complète (2 joueurs maximum)');
    }

    // Vérifier que le joueur n'est pas déjà dans la partie
    if (game.players.some(p => p.id === playerProfile.id)) {
      throw new Error('Vous êtes déjà dans cette partie');
    }

    const newPlayer: Puissance4Player = {
      id: playerProfile.id,
      profile: playerProfile,
      color: 'Jaune', // Le second joueur est toujours Jaune
      isReady: false,
    };

    await gameDoc.ref.update({
      players: firestore.FieldValue.arrayUnion(newPlayer),
      updatedAt: Date.now(),
    });

    console.log('Player joined Puissance 4 game:', {
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
    const gameRef = firestore().collection(PUISSANCE4_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as Puissance4Game;
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
   * Mettre à jour les enjeux de la partie (hôte seulement)
   */
  static async updateGameStakes(
    gameId: string,
    stakes: Puissance4Stakes
  ): Promise<void> {
    const gameRef = firestore().collection(PUISSANCE4_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as Puissance4Game;

    if (game.status !== 'waiting') {
      throw new Error('Les enjeux ne peuvent être modifiés qu\'avant le début de la partie');
    }

    await gameRef.update({
      stakes,
      updatedAt: Date.now(),
    });

    console.log('Game stakes updated:', { gameId, stakes });
  }

  /**
   * Démarrer la partie (hôte seulement)
   */
  static async startGame(gameId: string, hostId: string): Promise<void> {
    const gameRef = firestore().collection(PUISSANCE4_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as Puissance4Game;

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

    console.log('Puissance 4 game started:', { gameId });
  }

  /**
   * Jouer un coup
   */
  static async playMove(
    gameId: string,
    playerId: string,
    columnIndex: number
  ): Promise<void> {
    return withRetry(async () => {
      const gameRef = firestore().collection(PUISSANCE4_GAMES_COLLECTION).doc(gameId);
      const gameDoc = await gameRef.get();

      if (!gameDoc.exists) {
        throw new Error('Partie non trouvée');
      }

      const game = { id: gameDoc.id, ...gameDoc.data() } as Puissance4Game;

      if (game.status !== 'playing') {
        throw new Error('La partie n\'est pas en cours');
      }

      // Trouver le joueur
      const player = game.players.find(p => p.id === playerId);
      if (!player) {
        throw new Error('Joueur non trouvé');
      }

      // Vérifier que c'est son tour
      if (player.color !== game.currentPlayer) {
        throw new Error('Ce n\'est pas votre tour');
      }

      // Trouver la ligne disponible (de bas en haut)
      let rowIndex = -1;
      for (let row = PUISSANCE4_CONFIG.ROWS - 1; row >= 0; row--) {
        if (this.getCell(game.board, row, columnIndex) === null) {
          rowIndex = row;
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error('Cette colonne est pleine');
      }

      // Mettre à jour le plateau (format plat)
      const newBoard = this.setCell(game.board, rowIndex, columnIndex, player.color);

      // Ajouter le coup à l'historique
      const move: Puissance4Move = {
        playerId,
        color: player.color,
        column: columnIndex,
        row: rowIndex,
        timestamp: Date.now(),
      };

      const newMoves = [...game.moves, move];

      // Vérifier la victoire
      const winResult = this.checkWinner(newBoard, rowIndex, columnIndex, player.color);

      let updateData: any = {
        board: newBoard,
        moves: newMoves,
        updatedAt: Date.now(),
      };

      if (winResult.winner) {
        // Victoire
        updateData.winner = player.color;
        updateData.winningLine = winResult.line;
        updateData.status = 'finished';
        updateData.completedAt = Date.now();

        // Sauvegarder dans l'historique
        await this.saveGameHistory(game, player.color, newMoves.length);
      } else if (this.isBoardFull(newBoard)) {
        // Match nul
        updateData.winner = 'draw';
        updateData.status = 'finished';
        updateData.completedAt = Date.now();

        // Sauvegarder dans l'historique
        await this.saveGameHistory(game, 'draw', newMoves.length);
      } else {
        // Passer au joueur suivant
        updateData.currentPlayer = game.currentPlayer === 'Rouge' ? 'Jaune' : 'Rouge';
      }

      await gameRef.update(updateData);

      console.log('Move played:', {
        gameId,
        playerId,
        column: columnIndex,
        row: rowIndex,
        winner: updateData.winner,
      });
    }, { maxRetries: 2 }, 'playPuissance4Move');
  }

  /**
   * Vérifier s'il y a un gagnant (board au format plat)
   */
  static checkWinner(
    board: (CellValue | null)[],
    row: number,
    col: number,
    color: 'Rouge' | 'Jaune'
  ): { winner: boolean; line: { row: number; col: number }[] } {
    const directions = [
      { dr: 0, dc: 1 },  // Horizontal →
      { dr: 1, dc: 0 },  // Vertical ↓
      { dr: 1, dc: 1 },  // Diagonale ↘
      { dr: 1, dc: -1 }, // Diagonale ↙
    ];

    for (const { dr, dc } of directions) {
      const line: { row: number; col: number }[] = [{ row, col }];
      let count = 1;

      // Direction positive
      let r = row + dr;
      let c = col + dc;
      while (
        r >= 0 &&
        r < PUISSANCE4_CONFIG.ROWS &&
        c >= 0 &&
        c < PUISSANCE4_CONFIG.COLS &&
        this.getCell(board, r, c) === color
      ) {
        line.push({ row: r, col: c });
        count++;
        r += dr;
        c += dc;
      }

      // Direction négative
      r = row - dr;
      c = col - dc;
      while (
        r >= 0 &&
        r < PUISSANCE4_CONFIG.ROWS &&
        c >= 0 &&
        c < PUISSANCE4_CONFIG.COLS &&
        this.getCell(board, r, c) === color
      ) {
        line.unshift({ row: r, col: c });
        count++;
        r -= dr;
        c -= dc;
      }

      if (count >= PUISSANCE4_CONFIG.WIN_LENGTH) {
        return { winner: true, line };
      }
    }

    return { winner: false, line: [] };
  }

  /**
   * Vérifier si le plateau est plein (board au format plat)
   */
  static isBoardFull(board: (CellValue | null)[]): boolean {
    // Vérifier si la première ligne (indices 0-6) est pleine
    for (let col = 0; col < PUISSANCE4_CONFIG.COLS; col++) {
      if (this.getCell(board, 0, col) === null) {
        return false;
      }
    }
    return true;
  }

  /**
   * Abandonner la partie
   */
  static async forfeitGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = firestore().collection(PUISSANCE4_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as Puissance4Game;

    // Trouver le joueur qui abandonne
    const forfeitingPlayer = game.players.find(p => p.id === playerId);
    if (!forfeitingPlayer) {
      throw new Error('Joueur non trouvé');
    }

    // L'autre joueur gagne
    const winnerColor = forfeitingPlayer.color === 'Rouge' ? 'Jaune' : 'Rouge';

    await gameRef.update({
      status: 'finished',
      winner: winnerColor,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Sauvegarder dans l'historique avec indication d'abandon
    await this.saveGameHistory(game, winnerColor, game.moves.length, true);

    console.log('Game forfeited:', { gameId, playerId, winner: winnerColor });
  }

  /**
   * Quitter la partie
   */
  static async leaveGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = firestore().collection(PUISSANCE4_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return;
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as Puissance4Game;
    const updatedPlayers = game.players.filter(p => p.id !== playerId);

    if (updatedPlayers.length === 0) {
      // Supprimer la partie si plus de joueurs
      await gameRef.delete();
      console.log('Puissance 4 game deleted (no players left):', { gameId });
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
    onUpdate: (game: Puissance4Game) => void,
    onError?: (error: Error) => void
  ): () => void {
    return firestore()
      .collection(PUISSANCE4_GAMES_COLLECTION)
      .doc(gameId)
      .onSnapshot(
        (snapshot) => {
          if (snapshot.exists) {
            const game = { id: snapshot.id, ...snapshot.data() } as Puissance4Game;
            onUpdate(game);
          }
        },
        (error) => {
          console.error('Error subscribing to Puissance 4 game:', error);
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
    game: Puissance4Game,
    result: 'Rouge' | 'Jaune' | 'draw',
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
        : game.players.find(p => p.color === result)?.id || null;

      const loserId = result === 'draw'
        ? null
        : game.players.find(p => p.color !== result)?.id || null;

      await firestore().collection(PUISSANCE4_HISTORY_COLLECTION).add({
        gameId: game.id,
        roomCode: game.roomCode,
        players: [player1.id, player2.id],
        playerProfiles: [player1.profile, player2.profile],
        winner: winnerId,
        loser: loserId,
        result,
        moveCount,
        duration,
        stakes: game.stakes,
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
   * Obtenir l'historique des parties d'un utilisateur
   */
  static async getUserGameHistory(userId: string, limit: number = 20) {
    try {
      const snapshot = await firestore()
        .collection(PUISSANCE4_HISTORY_COLLECTION)
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
        .collection(PUISSANCE4_HISTORY_COLLECTION)
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
