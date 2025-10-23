import firestore from '@react-native-firebase/firestore';
import { CooperativeGame, CooperativePlayer, PlayerCursor, SelectionUpdate, WordFoundEvent } from '../../types/cooperativeGame.types';
import { PlayerProfile, Cell } from '../../types/wordSearch.types';
import { WordSearchGenerator } from '../wordsearch/WordSearchGenerator';

const COOPERATIVE_GAMES_COLLECTION = 'cooperative_games';

// Couleurs pour les joueurs
const PLAYER_COLORS = [
  '#FF6B6B', // Rouge
  '#4ECDC4', // Cyan
  '#45B7D1', // Bleu
  '#FFA07A', // Orange
  '#98D8C8', // Vert
  '#F7DC6F', // Jaune
  '#BB8FCE', // Violet
  '#F8B739', // Or
];

export class CooperativeGameService {
  /**
   * Générer un code de room unique
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
   * Créer une nouvelle partie coopérative
   */
  static async createCooperativeGame(
    hostProfile: PlayerProfile,
    difficulty: 'easy' | 'medium' | 'hard' | 'expert',
    themeId: string,
    words: string[],
    maxPlayers: number = 4,
    levelId?: number
  ): Promise<string> {
    const roomCode = this.generateRoomCode();
    const gridSize = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 12 : difficulty === 'hard' ? 15 : 18;
    const timeLimit = difficulty === 'easy' ? 600 : difficulty === 'medium' ? 480 : difficulty === 'hard' ? 420 : 360;

    // Configuration de difficulté
    const difficultyConfig = {
      gridSize,
      wordCount: difficulty === 'easy' ? 8 : difficulty === 'medium' ? 10 : difficulty === 'hard' ? 12 : 15,
      wordLengthRange: [3, 10] as [number, number],
      timeLimit,
      coinReward: 50,
      xpReward: 100,
      directions: ['horizontal', 'vertical', 'diagonal'] as any[],
      fillStrategy: 'random' as const,
    };

    // Générer la grille
    const generator = new WordSearchGenerator(gridSize);
    const grid = generator.generateGrid(words, difficultyConfig, []);

    console.log('Generated grid:', {
      size: grid.size,
      wordsCount: grid.words.length,
      cellsLength: grid.cells.length,
      firstRowLength: grid.cells[0]?.length,
      sampleCell: grid.cells[0]?.[0],
    });

    // Flatten cells for Firestore
    const flattenedCells = grid.cells.flat();
    console.log('Flattened cells:', {
      length: flattenedCells.length,
      sampleCell: flattenedCells[0],
    });

    // Nettoyer le profil pour éviter les valeurs undefined
    const cleanProfile = {
      ...hostProfile,
      photoURL: hostProfile.photoURL || null,
    };

    const hostPlayer: CooperativePlayer = {
      id: cleanProfile.id,
      profile: cleanProfile,
      isReady: true,
      currentSelection: [],
      cursorPosition: null,
      wordsFound: [],
      score: 0,
    };

    // Filter out undefined values for Firestore
    const gameData: any = {
      roomCode,
      hostId: hostProfile.id,
      players: [hostPlayer],
      maxPlayers,
      status: 'waiting',
      grid: {
        cells: flattenedCells as any,
        size: grid.size,
        words: grid.words,
      },
      words: grid.words.map(w => w.text),
      wordsFound: [],
      difficulty,
      themeId,
      timeLimit,
      timeRemaining: timeLimit,
      activeSelections: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Ajouter les champs optionnels seulement s'ils sont définis
    if (levelId !== undefined) {
      gameData.levelId = levelId;
    }

    const docRef = await firestore()
      .collection(COOPERATIVE_GAMES_COLLECTION)
      .add(gameData);

    return docRef.id;
  }

  /**
   * Rejoindre une partie via le code room
   */
  static async joinGameByCode(roomCode: string, playerProfile: PlayerProfile): Promise<string> {
    const snapshot = await firestore()
      .collection(COOPERATIVE_GAMES_COLLECTION)
      .where('roomCode', '==', roomCode)
      .where('status', '==', 'waiting')
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('Partie non trouvée ou déjà commencée');
    }

    const gameDoc = snapshot.docs[0];
    const game = { id: gameDoc.id, ...gameDoc.data() } as CooperativeGame;

    if (game.players.length >= game.maxPlayers) {
      throw new Error('La partie est complète');
    }

    // Check if player already in game by ID
    if (game.players.some(p => p.id === playerProfile.id)) {
      console.log('Player already in game, returning game ID');
      return gameDoc.id; // Already in game, just return the game ID
    }

    // Check for duplicate based on photoURL or name (to prevent same user with different IDs)
    const isDuplicate = game.players.some(p => {
      // If both have photoURL and they match, it's the same user
      if (p.profile.photoURL && playerProfile.photoURL && p.profile.photoURL === playerProfile.photoURL) {
        return true;
      }
      // If names match exactly, likely the same user
      if (p.profile.name && playerProfile.name && p.profile.name === playerProfile.name) {
        return true;
      }
      return false;
    });

    if (isDuplicate) {
      throw new Error('Vous êtes déjà dans cette partie avec un autre appareil ou compte');
    }

    // Nettoyer le profil pour éviter les valeurs undefined
    const cleanProfile = {
      ...playerProfile,
      photoURL: playerProfile.photoURL || null,
    };

    const newPlayer: CooperativePlayer = {
      id: cleanProfile.id,
      profile: cleanProfile,
      isReady: false,
      currentSelection: [],
      cursorPosition: null,
      wordsFound: [],
      score: 0,
    };

    await gameDoc.ref.update({
      players: firestore.FieldValue.arrayUnion(newPlayer),
      updatedAt: Date.now(),
    });

    return gameDoc.id;
  }

  /**
   * Définir le statut ready d'un joueur
   */
  static async setPlayerReady(gameId: string, playerId: string, isReady: boolean): Promise<void> {
    const gameRef = firestore().collection(COOPERATIVE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as CooperativeGame;
    const updatedPlayers = game.players.map(p =>
      p.id === playerId ? { ...p, isReady } : p
    );

    await gameRef.update({
      players: updatedPlayers,
      updatedAt: Date.now(),
    });
  }

  /**
   * Démarrer la partie (host seulement)
   */
  static async startGame(gameId: string, hostId: string): Promise<void> {
    const gameRef = firestore().collection(COOPERATIVE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as CooperativeGame;

    if (game.hostId !== hostId) {
      throw new Error('Seul l\'hôte peut démarrer la partie');
    }

    if (game.players.length < 2) {
      throw new Error('Au moins 2 joueurs sont nécessaires');
    }

    if (!game.players.every(p => p.isReady)) {
      throw new Error('Tous les joueurs doivent être prêts');
    }

    await gameRef.update({
      status: 'playing',
      startedAt: Date.now(),
      timeRemaining: game.timeLimit,
      updatedAt: Date.now(),
    });
  }

  /**
   * Mettre à jour la position du curseur en temps réel
   */
  static async updateCursorPosition(
    gameId: string,
    playerId: string,
    position: { row: number; col: number } | null
  ): Promise<void> {
    const gameRef = firestore().collection(COOPERATIVE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) return;

    const game = { id: gameDoc.id, ...gameDoc.data() } as CooperativeGame;
    const updatedPlayers = game.players.map(p =>
      p.id === playerId ? { ...p, cursorPosition: position } : p
    );

    await gameRef.update({
      players: updatedPlayers,
      updatedAt: Date.now(),
    });
  }

  /**
   * Mettre à jour la sélection en cours d'un joueur en temps réel
   */
  static async updatePlayerSelection(
    gameId: string,
    playerId: string,
    cells: Cell[]
  ): Promise<void> {
    const gameRef = firestore().collection(COOPERATIVE_GAMES_COLLECTION).doc(gameId);

    await gameRef.update({
      [`activeSelections.${playerId}`]: {
        cells,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    });
  }

  /**
   * Soumettre un mot trouvé
   */
  static async submitWord(
    gameId: string,
    playerId: string,
    word: string,
    cells: Cell[]
  ): Promise<boolean> {
    const gameRef = firestore().collection(COOPERATIVE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as CooperativeGame;

    // Vérifier si le mot est dans la liste
    const normalizedWord = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const foundWord = game.words.find(
      w => w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedWord
    );

    if (!foundWord) {
      return false;
    }

    // Vérifier si le mot n'a pas déjà été trouvé
    if (game.wordsFound.includes(foundWord)) {
      return false;
    }

    // Calculer le score (10 points par lettre)
    const score = foundWord.length * 10;

    // Mettre à jour le joueur et le jeu
    const updatedPlayers = game.players.map(p =>
      p.id === playerId
        ? {
            ...p,
            wordsFound: [...p.wordsFound, foundWord],
            score: p.score + score,
            currentSelection: [],
          }
        : p
    );

    const updatedWordsFound = [...game.wordsFound, foundWord];
    const isComplete = updatedWordsFound.length === game.words.length;

    await gameRef.update({
      players: updatedPlayers,
      wordsFound: updatedWordsFound,
      status: isComplete ? 'completed' : 'playing',
      completedAt: isComplete ? Date.now() : null,
      [`activeSelections.${playerId}`]: firestore.FieldValue.delete(),
      updatedAt: Date.now(),
    });

    return true;
  }

  /**
   * Quitter la partie
   */
  static async leaveGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = firestore().collection(COOPERATIVE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) return;

    const game = { id: gameDoc.id, ...gameDoc.data() } as CooperativeGame;
    const updatedPlayers = game.players.filter(p => p.id !== playerId);

    if (updatedPlayers.length === 0) {
      // Supprimer la partie si plus de joueurs
      await gameRef.delete();
    } else {
      // Si l'hôte quitte, assigner un nouvel hôte
      const newHostId = game.hostId === playerId ? updatedPlayers[0].id : game.hostId;

      await gameRef.update({
        players: updatedPlayers,
        hostId: newHostId,
        updatedAt: Date.now(),
      });
    }
  }

  /**
   * S'abonner aux changements de la partie
   */
  static subscribeToGame(
    gameId: string,
    onUpdate: (game: CooperativeGame) => void,
    onError?: (error: Error) => void
  ): () => void {
    return firestore()
      .collection(COOPERATIVE_GAMES_COLLECTION)
      .doc(gameId)
      .onSnapshot(
        (snapshot) => {
          if (snapshot.exists) {
            const game = { id: snapshot.id, ...snapshot.data() } as CooperativeGame;

            // Reconstruct 2D grid
            if (game.grid && Array.isArray(game.grid.cells) && !Array.isArray(game.grid.cells[0])) {
              console.log('Reconstructing grid from flat array, size:', game.grid.size);
              const flatCells = game.grid.cells as any[];
              const gridSize = game.grid.size;
              const cells2D: any[][] = [];
              for (let i = 0; i < gridSize; i++) {
                cells2D[i] = flatCells.slice(i * gridSize, (i + 1) * gridSize);
              }
              game.grid = { ...game.grid, cells: cells2D };
              console.log('Grid reconstructed, first row sample:', cells2D[0]?.slice(0, 3));
            } else {
              console.log('Grid reconstruction check:', {
                hasGrid: !!game.grid,
                hasCells: !!game.grid?.cells,
                cellsIsArray: Array.isArray(game.grid?.cells),
                firstCellIsArray: Array.isArray(game.grid?.cells?.[0]),
              });
            }

            onUpdate(game);
          }
        },
        (error) => {
          if (onError) {
            onError(error);
          }
        }
      );
  }

  /**
   * Obtenir la couleur d'un joueur
   */
  static getPlayerColor(playerId: string, players: CooperativePlayer[]): string {
    const index = players.findIndex(p => p.id === playerId);
    return PLAYER_COLORS[index % PLAYER_COLORS.length];
  }
}
