import firestore from '@react-native-firebase/firestore';
import { MultiplayerGame, MultiplayerPlayer, PlayerProfile, Grid } from '../../types/wordSearch.types';

export class MultiplayerService {
  private static GAMES_COLLECTION = 'multiplayer_games';

  /**
   * Générer un code de salon unique à 6 caractères
   */
  private static generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Créer un nouveau jeu avec code de salon
   */
  static async createGame(
    hostProfile: PlayerProfile,
    difficulty: string,
    theme: string,
    maxPlayers: number = 4
  ): Promise<string> {
    try {
      const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const roomCode = this.generateRoomCode();

      // Nettoyer le profil pour éviter les valeurs undefined
      const cleanProfile = {
        ...hostProfile,
        photoURL: hostProfile.photoURL || null,
      };

      const hostPlayer: MultiplayerPlayer = {
        id: cleanProfile.id,
        profile: cleanProfile,
        wordsFound: [],
        score: 0,
        isReady: true, // L'hôte est automatiquement prêt
        isConnected: true,
        voiceMuted: false,
      };

      const game: MultiplayerGame = {
        id: gameId,
        hostId: hostProfile.id,
        players: [hostPlayer],
        grid: { cells: [], size: 0, words: [] }, // Sera généré au démarrage
        difficulty: difficulty as any,
        theme,
        status: 'waiting',
        maxPlayers,
        roomCode,
      };

      // Filter out undefined values for Firestore
      const gameData: any = {
        id: game.id,
        hostId: game.hostId,
        players: game.players,
        grid: game.grid,
        difficulty: game.difficulty,
        theme: game.theme,
        status: game.status,
        maxPlayers: game.maxPlayers,
        roomCode: game.roomCode,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore()
        .collection(this.GAMES_COLLECTION)
        .doc(gameId)
        .set(gameData);

      return gameId;
    } catch (error) {
      console.error('Erreur lors de la création du jeu:', error);
      throw error;
    }
  }

  /**
   * Rejoindre un jeu via son code de salon
   */
  static async joinGameByCode(roomCode: string, playerProfile: PlayerProfile): Promise<string> {
    try {
      // Rechercher le jeu par code de salon
      const querySnapshot = await firestore()
        .collection(this.GAMES_COLLECTION)
        .where('roomCode', '==', roomCode.toUpperCase())
        .where('status', '==', 'waiting')
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        throw new Error('Aucun salon trouvé avec ce code');
      }

      const gameDoc = querySnapshot.docs[0];
      const game = gameDoc.data() as MultiplayerGame;

      if (game.players.length >= game.maxPlayers) {
        throw new Error('Le salon est plein');
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

      const newPlayer: MultiplayerPlayer = {
        id: cleanProfile.id,
        profile: cleanProfile,
        wordsFound: [],
        score: 0,
        isReady: false,
        isConnected: true,
        voiceMuted: false,
      };

      await gameDoc.ref.update({
        players: [...game.players, newPlayer],
      });

      return gameDoc.id;
    } catch (error: any) {
      console.error('Erreur lors de la connexion au jeu:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau lobby multijoueur
   */
  static async createLobby(
    hostProfile: PlayerProfile,
    difficulty: string,
    theme: string,
    maxPlayers: number = 4
  ): Promise<string> {
    try {
      const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const hostPlayer: MultiplayerPlayer = {
        id: hostProfile.id,
        profile: hostProfile,
        wordsFound: [],
        score: 0,
        isReady: true, // L'hôte est automatiquement prêt
        isConnected: true,
        voiceMuted: false,
      };

      const game: MultiplayerGame = {
        id: gameId,
        hostId: hostProfile.id,
        players: [hostPlayer],
        grid: { cells: [], size: 0, words: [] }, // Sera généré au démarrage
        difficulty: difficulty as any,
        theme,
        status: 'waiting',
        maxPlayers,
      };

      // Filter out undefined values for Firestore
      const gameData: any = {
        id: game.id,
        hostId: game.hostId,
        players: game.players,
        grid: game.grid,
        difficulty: game.difficulty,
        theme: game.theme,
        status: game.status,
        maxPlayers: game.maxPlayers,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore()
        .collection(this.GAMES_COLLECTION)
        .doc(gameId)
        .set(gameData);

      return gameId;
    } catch (error) {
      console.error('Erreur lors de la création du lobby:', error);
      throw error;
    }
  }

  /**
   * Rejoindre un lobby existant
   */
  static async joinLobby(gameId: string, playerProfile: PlayerProfile): Promise<void> {
    try {
      const gameRef = firestore().collection(this.GAMES_COLLECTION).doc(gameId);
      const gameSnap = await gameRef.get();

      if (!gameSnap.exists) {
        throw new Error('Lobby introuvable');
      }

      const game = gameSnap.data() as MultiplayerGame;

      if (game.status !== 'waiting') {
        throw new Error('La partie a déjà commencé');
      }

      if (game.players.length >= game.maxPlayers) {
        throw new Error('Le lobby est plein');
      }

      const newPlayer: MultiplayerPlayer = {
        id: playerProfile.id,
        profile: playerProfile,
        wordsFound: [],
        score: 0,
        isReady: false,
        isConnected: true,
        voiceMuted: false,
      };

      await gameRef.update({
        players: [...game.players, newPlayer],
      });
    } catch (error) {
      console.error('Erreur lors de la jonction au lobby:', error);
      throw error;
    }
  }

  /**
   * Quitter un lobby
   */
  static async leaveLobby(gameId: string, playerId: string): Promise<void> {
    try {
      const gameRef = firestore().collection(this.GAMES_COLLECTION).doc(gameId);
      const gameSnap = await gameRef.get();

      if (!gameSnap.exists) return;

      const game = gameSnap.data() as MultiplayerGame;
      const updatedPlayers = game.players.filter(p => p.id !== playerId);

      // Si l'hôte quitte et qu'il y a d'autres joueurs, transférer l'hôte
      if (game.hostId === playerId && updatedPlayers.length > 0) {
        await gameRef.update({
          players: updatedPlayers,
          hostId: updatedPlayers[0].id,
        });
      } else if (updatedPlayers.length === 0) {
        // Si plus personne, supprimer le lobby
        await gameRef.delete();
      } else {
        await gameRef.update({
          players: updatedPlayers,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sortie du lobby:', error);
      throw error;
    }
  }

  /**
   * Marquer un joueur comme prêt
   */
  static async setPlayerReady(gameId: string, playerId: string, isReady: boolean): Promise<void> {
    try {
      const gameRef = firestore().collection(this.GAMES_COLLECTION).doc(gameId);
      const gameSnap = await gameRef.get();

      if (!gameSnap.exists) return;

      const game = gameSnap.data() as MultiplayerGame;
      const updatedPlayers = game.players.map(p =>
        p.id === playerId ? { ...p, isReady } : p
      );

      await gameRef.update({
        players: updatedPlayers,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut prêt:', error);
      throw error;
    }
  }

  /**
   * Démarrer la partie (uniquement l'hôte)
   */
  static async startGame(gameId: string, grid: Grid): Promise<void> {
    try {
      const gameRef = firestore().collection(this.GAMES_COLLECTION).doc(gameId);

      // Convertir la grille en format compatible avec Firestore
      // Firestore ne supporte pas les tableaux imbriqués, donc on aplatit cells
      const flattenedCells = grid.cells.flat();
      const gridData = {
        ...grid,
        cells: flattenedCells,
      };

      await gameRef.update({
        status: 'playing',
        grid: gridData,
        startedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Erreur lors du démarrage de la partie:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le score et les mots trouvés d'un joueur
   */
  static async updatePlayerProgress(
    gameId: string,
    playerId: string,
    wordsFound: string[],
    score: number
  ): Promise<void> {
    try {
      const gameRef = firestore().collection(this.GAMES_COLLECTION).doc(gameId);
      const gameSnap = await gameRef.get();

      if (!gameSnap.exists) return;

      const game = gameSnap.data() as MultiplayerGame;
      const updatedPlayers = game.players.map(p =>
        p.id === playerId ? { ...p, wordsFound, score } : p
      );

      await gameRef.update({
        players: updatedPlayers,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du progrès:', error);
      throw error;
    }
  }

  /**
   * Terminer la partie et déclarer le gagnant
   */
  static async finishGame(gameId: string, winnerId: string): Promise<void> {
    try {
      const gameRef = firestore().collection(this.GAMES_COLLECTION).doc(gameId);

      await gameRef.update({
        status: 'finished',
        winnerId,
        finishedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Erreur lors de la fin de partie:', error);
      throw error;
    }
  }

  /**
   * Écouter les changements du lobby/partie en temps réel
   */
  static subscribeToGame(
gameId: string, callback: (game: MultiplayerGame) => void, p0: (error: any) => void  ): () => void {
    const gameRef = firestore().collection(this.GAMES_COLLECTION).doc(gameId);

    const unsubscribe = gameRef.onSnapshot((snapshot) => {
      if (snapshot.exists) {
        const game = snapshot.data() as MultiplayerGame;
        callback(game);
      }
    });

    return unsubscribe;
  }

  /**
   * Rechercher les lobbies disponibles
   */
  static async findAvailableLobbies(): Promise<MultiplayerGame[]> {
    try {
      const querySnapshot = await firestore()
        .collection(this.GAMES_COLLECTION)
        .where('status', '==', 'waiting')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const lobbies: MultiplayerGame[] = [];

      querySnapshot.forEach((doc) => {
        lobbies.push(doc.data() as MultiplayerGame);
      });

      return lobbies.filter(lobby => lobby.players.length < lobby.maxPlayers);
    } catch (error) {
      console.error('Erreur lors de la recherche de lobbies:', error);
      return [];
    }
  }

  /**
   * Toggle le mute du micro d'un joueur
   */
  static async toggleVoiceMute(gameId: string, playerId: string, muted: boolean): Promise<void> {
    try {
      const gameRef = firestore().collection(this.GAMES_COLLECTION).doc(gameId);
      const gameSnap = await gameRef.get();

      if (!gameSnap.exists) return;

      const game = gameSnap.data() as MultiplayerGame;
      const updatedPlayers = game.players.map(p =>
        p.id === playerId ? { ...p, voiceMuted: muted } : p
      );

      await gameRef.update({
        players: updatedPlayers,
      });
    } catch (error) {
      console.error('Erreur lors du toggle voice mute:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un document de jeu (helper method)
   */
  static async updateDoc(gameId: string, updates: Partial<MultiplayerGame>): Promise<void> {
    try {
      const gameRef = firestore().collection(this.GAMES_COLLECTION).doc(gameId);
      await gameRef.update(updates as any);
    } catch (error) {
      console.error('Error updating multiplayer game:', error);
      throw new Error('Impossible de mettre à jour la partie. Vérifiez votre connexion.');
    }
  }
}
