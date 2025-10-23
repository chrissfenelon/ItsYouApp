import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Types de jeux supportés
 */
export type GameType = 'morpion' | 'puissance4' | 'quiz' | 'wordsearch' | 'dominos';

/**
 * Interface de base pour l'état d'un jeu
 */
export interface BaseGameState {
  gameType: GameType;
  timestamp: string;
  isActive: boolean;
}

/**
 * État du jeu Morpion
 */
export interface MorpionGameState extends BaseGameState {
  gameType: 'morpion';
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  winner: string | null;
  gameMode: 'solo' | 'duo';
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * État du jeu Puissance 4
 */
export interface Puissance4GameState extends BaseGameState {
  gameType: 'puissance4';
  board: (string | null)[][];
  currentPlayer: 'red' | 'yellow';
  winner: string | null;
  gameMode: 'solo' | 'duo';
  difficulty?: 'easy' | 'medium' | 'hard';
  moveHistory: number[];
}

/**
 * État du jeu Quiz
 */
export interface QuizGameState extends BaseGameState {
  gameType: 'quiz';
  currentQuestionIndex: number;
  score: number;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
  }>;
  mode: 'normal' | 'custom';
  categoryId?: string;
  totalQuestions: number;
}

/**
 * État du jeu de recherche de mots
 */
export interface WordSearchGameState extends BaseGameState {
  gameType: 'wordsearch';
  grid: string[][];
  foundWords: string[];
  remainingWords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  startTime: string;
  elapsedTime: number;
}

/**
 * État du jeu Dominos
 */
export interface DominosGameState extends BaseGameState {
  gameType: 'dominos';
  playerHand: Array<[number, number]>;
  computerHand: Array<[number, number]>;
  board: Array<[number, number]>;
  currentPlayer: 'player' | 'computer';
  score: {
    player: number;
    computer: number;
  };
}

/**
 * Union de tous les types d'états de jeu
 */
export type GameState =
  | MorpionGameState
  | Puissance4GameState
  | QuizGameState
  | WordSearchGameState
  | DominosGameState;

/**
 * Clés de stockage pour chaque type de jeu
 */
const STORAGE_KEYS: Record<GameType, string> = {
  morpion: '@ItsYouApp:gameState:morpion',
  puissance4: '@ItsYouApp:gameState:puissance4',
  quiz: '@ItsYouApp:gameState:quiz',
  wordsearch: '@ItsYouApp:gameState:wordsearch',
  dominos: '@ItsYouApp:gameState:dominos',
};

/**
 * Service de gestion de l'état des jeux
 *
 * Permet de sauvegarder et restaurer l'état des jeux dans AsyncStorage,
 * permettant aux utilisateurs de reprendre une partie en cours.
 *
 * @example
 * // Sauvegarder l'état du jeu
 * await GameStateManager.saveGameState('morpion', {
 *   gameType: 'morpion',
 *   board: [...],
 *   currentPlayer: 'X',
 *   isActive: true,
 *   timestamp: new Date().toISOString(),
 * });
 *
 * // Restaurer l'état du jeu
 * const state = await GameStateManager.restoreGameState('morpion');
 * if (state) {
 *   // Reprendre la partie
 * }
 */
export class GameStateManager {
  /**
   * Sauvegarde l'état d'un jeu dans AsyncStorage
   *
   * @param gameType - Type de jeu
   * @param state - État du jeu à sauvegarder
   * @returns Promise résolue quand la sauvegarde est terminée
   */
  static async saveGameState<T extends GameState>(
    gameType: GameType,
    state: T
  ): Promise<void> {
    try {
      const stateWithTimestamp = {
        ...state,
        timestamp: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS[gameType],
        JSON.stringify(stateWithTimestamp)
      );

      console.log(`État du jeu ${gameType} sauvegardé avec succès`);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de l'état du jeu ${gameType}:`, error);
      throw new Error(`Impossible de sauvegarder l'état du jeu ${gameType}`);
    }
  }

  /**
   * Restaure l'état d'un jeu depuis AsyncStorage
   *
   * @param gameType - Type de jeu
   * @returns L'état du jeu ou null si aucun état n'existe
   */
  static async restoreGameState<T extends GameState>(
    gameType: GameType
  ): Promise<T | null> {
    try {
      const stateJson = await AsyncStorage.getItem(STORAGE_KEYS[gameType]);

      if (!stateJson) {
        console.log(`Aucun état sauvegardé trouvé pour ${gameType}`);
        return null;
      }

      const state = JSON.parse(stateJson) as T;

      // Vérifier si l'état est encore actif
      if (!state.isActive) {
        console.log(`L'état du jeu ${gameType} n'est plus actif`);
        return null;
      }

      console.log(`État du jeu ${gameType} restauré avec succès`);
      return state;
    } catch (error) {
      console.error(`Erreur lors de la restauration de l'état du jeu ${gameType}:`, error);
      return null;
    }
  }

  /**
   * Supprime l'état sauvegardé d'un jeu
   *
   * @param gameType - Type de jeu
   * @returns Promise résolue quand la suppression est terminée
   */
  static async clearGameState(gameType: GameType): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS[gameType]);
      console.log(`État du jeu ${gameType} supprimé avec succès`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'état du jeu ${gameType}:`, error);
      throw new Error(`Impossible de supprimer l'état du jeu ${gameType}`);
    }
  }

  /**
   * Vérifie si un état de jeu sauvegardé existe
   *
   * @param gameType - Type de jeu
   * @returns true si un état existe, false sinon
   */
  static async hasGameState(gameType: GameType): Promise<boolean> {
    try {
      const state = await this.restoreGameState(gameType);
      return state !== null && state.isActive;
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'état du jeu ${gameType}:`, error);
      return false;
    }
  }

  /**
   * Met à jour l'état d'un jeu existant
   *
   * @param gameType - Type de jeu
   * @param updates - Mises à jour partielles de l'état
   * @returns Promise résolue quand la mise à jour est terminée
   */
  static async updateGameState<T extends GameState>(
    gameType: GameType,
    updates: Partial<T>
  ): Promise<void> {
    try {
      const currentState = await this.restoreGameState<T>(gameType);

      if (!currentState) {
        throw new Error(`Aucun état de jeu trouvé pour ${gameType}`);
      }

      const updatedState = {
        ...currentState,
        ...updates,
        timestamp: new Date().toISOString(),
      };

      await this.saveGameState(gameType, updatedState as T);
      console.log(`État du jeu ${gameType} mis à jour avec succès`);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'état du jeu ${gameType}:`, error);
      throw new Error(`Impossible de mettre à jour l'état du jeu ${gameType}`);
    }
  }

  /**
   * Marque un jeu comme terminé (désactive l'état)
   *
   * @param gameType - Type de jeu
   * @returns Promise résolue quand la mise à jour est terminée
   */
  static async endGame(gameType: GameType): Promise<void> {
    try {
      await this.updateGameState(gameType, { isActive: false });
      console.log(`Jeu ${gameType} marqué comme terminé`);
    } catch (error) {
      console.error(`Erreur lors de la fin du jeu ${gameType}:`, error);
      throw new Error(`Impossible de terminer le jeu ${gameType}`);
    }
  }

  /**
   * Supprime tous les états de jeux sauvegardés
   *
   * @returns Promise résolue quand toutes les suppressions sont terminées
   */
  static async clearAllGameStates(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      console.log('Tous les états de jeux ont été supprimés');
    } catch (error) {
      console.error('Erreur lors de la suppression de tous les états de jeux:', error);
      throw new Error('Impossible de supprimer tous les états de jeux');
    }
  }

  /**
   * Récupère tous les états de jeux actifs
   *
   * @returns Un objet contenant tous les états de jeux actifs
   */
  static async getAllActiveGameStates(): Promise<Partial<Record<GameType, GameState>>> {
    const activeStates: Partial<Record<GameType, GameState>> = {};

    for (const gameType of Object.keys(STORAGE_KEYS) as GameType[]) {
      const state = await this.restoreGameState(gameType);
      if (state && state.isActive) {
        activeStates[gameType] = state;
      }
    }

    return activeStates;
  }

  /**
   * Récupère l'âge d'un état de jeu sauvegardé en millisecondes
   *
   * @param gameType - Type de jeu
   * @returns L'âge en millisecondes ou null si aucun état n'existe
   */
  static async getGameStateAge(gameType: GameType): Promise<number | null> {
    try {
      const state = await this.restoreGameState(gameType);
      if (!state) {
        return null;
      }

      const timestamp = new Date(state.timestamp);
      const now = new Date();
      return now.getTime() - timestamp.getTime();
    } catch (error) {
      console.error(`Erreur lors du calcul de l'âge de l'état du jeu ${gameType}:`, error);
      return null;
    }
  }

  /**
   * Supprime les états de jeux trop anciens
   *
   * @param maxAgeInDays - Âge maximum en jours (par défaut 7)
   * @returns Promise résolue quand le nettoyage est terminé
   */
  static async cleanupOldGameStates(maxAgeInDays: number = 7): Promise<void> {
    try {
      const maxAgeMs = maxAgeInDays * 24 * 60 * 60 * 1000;

      for (const gameType of Object.keys(STORAGE_KEYS) as GameType[]) {
        const age = await this.getGameStateAge(gameType);
        if (age !== null && age > maxAgeMs) {
          await this.clearGameState(gameType);
          console.log(`État du jeu ${gameType} supprimé (trop ancien)`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des anciens états de jeux:', error);
    }
  }
}

export default GameStateManager;
