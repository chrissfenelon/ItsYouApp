import firestore from '@react-native-firebase/firestore';
import { MorpionGame, Player, GameRoom, GameEvent } from '../types/games';
import { Puissance4Game, Puissance4Move, CellValue } from '../types/puissance4.types';
import { PUISSANCE4_CONFIG } from '../constants/Puissance4Constants';

export class FirebaseGameService {
  private static gamesCollection = firestore().collection('games');
  private static gameRoomsCollection = firestore().collection('gameRooms');

  // Create a new game room
  static async createGameRoom(
    hostId: string,
    hostName: string,
    gameType: 'morpion' | 'fourInARow' | 'puzzle' | 'crosswords' | 'quizCouple'
  ): Promise<string> {
    try {
      const roomData: Omit<GameRoom, 'id'> = {
        name: `${hostName}'s ${gameType} game`,
        gameType,
        hostId,
        players: [{
          id: hostId,
          name: hostName,
          isHost: true,
        }],
        maxPlayers: 2,
        isPrivate: false,
        createdAt: new Date(),
      };

      const docRef = await this.gameRoomsCollection.add(roomData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating game room:', error);
      throw error;
    }
  }

  // Join an existing game room
  static async joinGameRoom(roomId: string, player: Player): Promise<void> {
    try {
      const roomRef = this.gameRoomsCollection.doc(roomId);

      await firestore().runTransaction(async (transaction) => {
        const roomDoc = await transaction.get(roomRef);

        if (!roomDoc.exists) {
          throw new Error('Game room not found');
        }

        const roomData = roomDoc.data() as GameRoom;

        if (roomData.players.length >= roomData.maxPlayers) {
          throw new Error('Game room is full');
        }

        if (roomData.players.some(p => p.id === player.id)) {
          throw new Error('Player already in room');
        }

        const updatedPlayers = [...roomData.players, player];
        transaction.update(roomRef, { players: updatedPlayers });
      });
    } catch (error) {
      console.error('Error joining game room:', error);
      throw error;
    }
  }

  // Start a Morpion game
  static async startMorpionGame(roomId: string, players: Player[]): Promise<string> {
    try {
      const gameData: Omit<MorpionGame, 'id'> = {
        type: 'morpion',
        status: 'playing',
        players,
        currentPlayer: players[0].id, // Host starts first
        board: [
          [null, null, null],
          [null, null, null],
          [null, null, null],
        ],
        moves: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.gamesCollection.add(gameData);

      // Update the room with the current game
      await this.gameRoomsCollection.doc(roomId).update({
        currentGame: {
          id: docRef.id,
          ...gameData,
        }
      });

      return docRef.id;
    } catch (error) {
      console.error('Error starting Morpion game:', error);
      throw error;
    }
  }

  // Make a move in Morpion
  static async makeMorpionMove(
    gameId: string,
    playerId: string,
    row: number,
    col: number,
    symbol: 'X' | 'O'
  ): Promise<void> {
    try {
      const gameRef = this.gamesCollection.doc(gameId);

      await firestore().runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);

        if (!gameDoc.exists) {
          throw new Error('Game not found');
        }

        const gameData = gameDoc.data() as MorpionGame;

        // Validate move
        if (gameData.status !== 'playing') {
          throw new Error('Game is not in playing state');
        }

        if (gameData.currentPlayer !== playerId) {
          throw new Error('Not your turn');
        }

        if (gameData.board[row][col] !== null) {
          throw new Error('Cell already occupied');
        }

        // Update board
        const newBoard = [...gameData.board];
        newBoard[row][col] = symbol;

        // Add move to history
        const newMove = {
          playerId,
          row,
          col,
          symbol,
          timestamp: new Date(),
        };

        // Check for winner
        const winner = this.checkMorpionWinner(newBoard);
        const isDraw = this.checkMorpionDraw(newBoard);

        // Switch current player
        const nextPlayer = gameData.players.find(p => p.id !== playerId)?.id;

        const updateData: Partial<MorpionGame> = {
          board: newBoard,
          moves: [...gameData.moves, newMove],
          updatedAt: new Date(),
        };

        if (winner) {
          updateData.status = 'finished';
          updateData.winner = playerId;
        } else if (isDraw) {
          updateData.status = 'finished';
        } else {
          updateData.currentPlayer = nextPlayer;
        }

        transaction.update(gameRef, updateData);
      });
    } catch (error) {
      console.error('Error making move:', error);
      throw error;
    }
  }

  // Listen to game updates
  static subscribeToGame(gameId: string, callback: (game: MorpionGame | null) => void): () => void {
    const unsubscribe = this.gamesCollection.doc(gameId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          const gameData = { id: doc.id, ...doc.data() } as MorpionGame;
          callback(gameData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to game updates:', error);
        callback(null);
      }
    );

    return unsubscribe;
  }

  // Listen to room updates
  static subscribeToRoom(roomId: string, callback: (room: GameRoom | null) => void): () => void {
    const unsubscribe = this.gameRoomsCollection.doc(roomId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          const roomData = { id: doc.id, ...doc.data() } as GameRoom;
          callback(roomData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to room updates:', error);
        callback(null);
      }
    );

    return unsubscribe;
  }

  // Send invite to partner
  static async sendGameInvite(
    fromUserId: string,
    fromUserName: string,
    toUserId: string,
    gameType: string,
    roomId: string
  ): Promise<void> {
    try {
      const inviteData = {
        type: 'GAME_INVITE',
        fromUserId,
        fromUserName,
        toUserId,
        gameType,
        roomId,
        timestamp: new Date(),
        status: 'pending',
      };

      await firestore().collection('invites').add(inviteData);
    } catch (error) {
      console.error('Error sending game invite:', error);
      throw error;
    }
  }

  // Get pending invites for a user
  static async getPendingInvites(userId: string): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection('invites')
        .where('toUserId', '==', userId)
        .where('status', '==', 'pending')
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting pending invites:', error);
      return [];
    }
  }

  // Helper function to check Morpion winner
  private static checkMorpionWinner(board: (string | null)[][]): string | null {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
        return board[i][0];
      }
    }

    // Check columns
    for (let j = 0; j < 3; j++) {
      if (board[0][j] && board[0][j] === board[1][j] && board[1][j] === board[2][j]) {
        return board[0][j];
      }
    }

    // Check diagonals
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      return board[0][0];
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      return board[0][2];
    }

    return null;
  }

  // Helper function to check Morpion draw
  private static checkMorpionDraw(board: (string | null)[][]): boolean {
    return board.every(row => row.every(cell => cell !== null));
  }

  // Leave game room
  static async leaveGameRoom(roomId: string, playerId: string): Promise<void> {
    try {
      const roomRef = this.gameRoomsCollection.doc(roomId);

      await firestore().runTransaction(async (transaction) => {
        const roomDoc = await transaction.get(roomRef);

        if (!roomDoc.exists) {
          return;
        }

        const roomData = roomDoc.data() as GameRoom;
        const updatedPlayers = roomData.players.filter(p => p.id !== playerId);

        if (updatedPlayers.length === 0) {
          // Delete room if no players left
          transaction.delete(roomRef);
        } else {
          // Update room with remaining players
          transaction.update(roomRef, { players: updatedPlayers });
        }
      });
    } catch (error) {
      console.error('Error leaving game room:', error);
      throw error;
    }
  }

  // ========================================
  // PUISSANCE 4 METHODS
  // ========================================

  /**
   * Créer une nouvelle partie de Puissance 4
   */
  static async createPuissance4Game(
    players: Player[],
    isMultiplayer: boolean = true
  ): Promise<string> {
    try {
      // Créer le plateau vide (6 lignes x 7 colonnes)
      const emptyBoard: CellValue[][] = Array(PUISSANCE4_CONFIG.ROWS)
        .fill(null)
        .map(() => Array(PUISSANCE4_CONFIG.COLS).fill(null));

      const gameData: Omit<Puissance4Game, 'id'> = {
        type: 'puissance4',
        status: 'en_cours',
        players,
        currentPlayer: players[0].id, // Le joueur 1 (Rouge) commence
        board: emptyBoard,
        moves: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.gamesCollection.add(gameData);
      console.log('🎮 Puissance 4 game created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating Puissance 4 game:', error);
      throw error;
    }
  }

  /**
   * Jouer un coup dans une colonne
   */
  static async playPuissance4Move(
    gameId: string,
    playerId: string,
    column: number
  ): Promise<void> {
    try {
      const gameRef = this.gamesCollection.doc(gameId);

      await firestore().runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);

        if (!gameDoc.exists) {
          throw new Error('Partie introuvable');
        }

        const gameData = gameDoc.data() as Puissance4Game;

        // Validations
        if (gameData.status !== 'en_cours') {
          throw new Error('La partie est terminée');
        }

        if (gameData.currentPlayer !== playerId) {
          throw new Error('Ce n\'est pas votre tour');
        }

        // Vérifier si la colonne est pleine
        if (!this.canPlayColumn(gameData.board, column)) {
          throw new Error('Cette colonne est pleine');
        }

        // Trouver la ligne disponible (gravité)
        const row = this.findAvailableRow(gameData.board, column);
        if (row === -1) {
          throw new Error('Colonne pleine');
        }

        // Déterminer la couleur du joueur
        const playerIndex = gameData.players.findIndex(p => p.id === playerId);
        const color: 'Rouge' | 'Jaune' = playerIndex === 0 ? 'Rouge' : 'Jaune';

        // Mettre à jour le plateau
        const newBoard = gameData.board.map(r => [...r]);
        newBoard[row][column] = color;

        // Ajouter le coup à l'historique
        const newMove: Puissance4Move = {
          playerId,
          column,
          row,
          color,
          timestamp: new Date(),
        };

        // Vérifier s'il y a un gagnant
        const winResult = this.checkPuissance4Winner(newBoard, row, column, color);

        // Vérifier le match nul
        const isDraw = this.isPuissance4BoardFull(newBoard);

        // Préparer les données de mise à jour
        const updateData: Partial<Puissance4Game> = {
          board: newBoard,
          moves: [...gameData.moves, newMove],
          updatedAt: new Date(),
        };

        if (winResult.winner) {
          updateData.status = 'termine';
          updateData.winner = playerId;
          updateData.winningLine = winResult.line || undefined;
        } else if (isDraw) {
          updateData.status = 'termine';
        } else {
          // Passer au joueur suivant
          const nextPlayer = gameData.players.find(p => p.id !== playerId)?.id;
          updateData.currentPlayer = nextPlayer;
        }

        transaction.update(gameRef, updateData);
      });
    } catch (error) {
      console.error('❌ Error playing Puissance 4 move:', error);
      throw error;
    }
  }

  /**
   * Abandonner une partie de Puissance 4
   */
  static async forfeitPuissance4Game(gameId: string, playerId: string): Promise<void> {
    try {
      const gameRef = this.gamesCollection.doc(gameId);

      await firestore().runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);

        if (!gameDoc.exists) {
          throw new Error('Partie introuvable');
        }

        const gameData = gameDoc.data() as Puissance4Game;

        if (gameData.status !== 'en_cours') {
          throw new Error('La partie est déjà terminée');
        }

        // Le gagnant est l'autre joueur
        const winner = gameData.players.find(p => p.id !== playerId)?.id;

        transaction.update(gameRef, {
          status: 'termine',
          winner,
          updatedAt: new Date(),
        });
      });
    } catch (error) {
      console.error('❌ Error forfeiting Puissance 4 game:', error);
      throw error;
    }
  }

  /**
   * Écouter les mises à jour d'une partie de Puissance 4
   */
  static subscribeToPuissance4Game(
    gameId: string,
    callback: (game: Puissance4Game | null) => void
  ): () => void {
    const unsubscribe = this.gamesCollection.doc(gameId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          const gameData = { id: doc.id, ...doc.data() } as Puissance4Game;
          callback(gameData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('❌ Error listening to Puissance 4 game:', error);
        callback(null);
      }
    );

    return unsubscribe;
  }

  // ========================================
  // HELPER FUNCTIONS - PUISSANCE 4
  // ========================================

  /**
   * Vérifier si on peut jouer dans une colonne
   */
  private static canPlayColumn(board: CellValue[][], column: number): boolean {
    return board[0][column] === null;
  }

  /**
   * Trouver la ligne disponible dans une colonne (gravité)
   */
  private static findAvailableRow(board: CellValue[][], column: number): number {
    for (let row = PUISSANCE4_CONFIG.ROWS - 1; row >= 0; row--) {
      if (board[row][column] === null) {
        return row;
      }
    }
    return -1;
  }

  /**
   * Vérifier s'il y a un gagnant (4 jetons alignés)
   */
  private static checkPuissance4Winner(
    board: CellValue[][],
    row: number,
    col: number,
    color: 'Rouge' | 'Jaune'
  ): { winner: boolean; line: { row: number; col: number }[] | null } {
    const directions = [
      { dr: 0, dc: 1 },  // Horizontal →
      { dr: 1, dc: 0 },  // Vertical ↓
      { dr: 1, dc: 1 },  // Diagonale ↘
      { dr: 1, dc: -1 }, // Diagonale ↙
    ];

    for (const { dr, dc } of directions) {
      const line: { row: number; col: number }[] = [{ row, col }];

      // Compter dans la direction positive
      let count = 1;
      let r = row + dr;
      let c = col + dc;
      while (
        r >= 0 && r < PUISSANCE4_CONFIG.ROWS &&
        c >= 0 && c < PUISSANCE4_CONFIG.COLS &&
        board[r][c] === color
      ) {
        line.push({ row: r, col: c });
        count++;
        r += dr;
        c += dc;
      }

      // Compter dans la direction négative
      r = row - dr;
      c = col - dc;
      while (
        r >= 0 && r < PUISSANCE4_CONFIG.ROWS &&
        c >= 0 && c < PUISSANCE4_CONFIG.COLS &&
        board[r][c] === color
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

    return { winner: false, line: null };
  }

  /**
   * Vérifier si le plateau est plein (match nul)
   */
  private static isPuissance4BoardFull(board: CellValue[][]): boolean {
    return board[0].every(cell => cell !== null);
  }
}

export default FirebaseGameService;