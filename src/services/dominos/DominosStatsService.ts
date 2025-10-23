import firestore from '@react-native-firebase/firestore';
import { DominosGame } from '../../types/dominos.types';

const DOMINOS_STATS_COLLECTION = 'dominos_stats';
const DOMINOS_HISTORY_COLLECTION = 'dominos_history';

export interface DominosPlayerStats {
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  totalTilesPlaced: number;
  totalTilesDrawn: number;
  fastestWinTime: number | null;
  averageGameTime: number;
  winStreak: number;
  bestWinStreak: number;
  lastPlayed: number;
}

export interface DominosGameHistory {
  id: string;
  gameId: string;
  playerId: string;
  opponentId: string;
  opponentName: string;
  won: boolean;
  tilesPlaced: number;
  tilesDrawn: number;
  finalTilesLeft: number;
  finalScore: number;
  gameTime: number;
  endReason: 'emptied_hand' | 'lowest_score' | 'opponent_left';
  playedAt: number;
}

export class DominosStatsService {
  /**
   * Obtenir les statistiques d'un joueur
   */
  static async getPlayerStats(userId: string): Promise<DominosPlayerStats> {
    try {
      const doc = await firestore()
        .collection(DOMINOS_STATS_COLLECTION)
        .doc(userId)
        .get();

      if (doc.exists) {
        return doc.data() as DominosPlayerStats;
      }

      // Retourner des stats par défaut si elles n'existent pas
      return {
        userId,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        totalTilesPlaced: 0,
        totalTilesDrawn: 0,
        fastestWinTime: null,
        averageGameTime: 0,
        winStreak: 0,
        bestWinStreak: 0,
        lastPlayed: 0,
      };
    } catch (error) {
      console.error('Error getting dominos stats:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les statistiques après une partie
   */
  static async updateStatsAfterGame(
    userId: string,
    game: DominosGame
  ): Promise<void> {
    try {
      const statsRef = firestore().collection(DOMINOS_STATS_COLLECTION).doc(userId);
      const currentStats = await this.getPlayerStats(userId);

      const player = game.players.find((p) => p.id === userId);
      if (!player) return;

      const won = game.winnerId === userId;
      const opponent = game.players.find((p) => p.id !== userId);

      // Calculer les statistiques de la partie
      const tilesPlaced = 7 - player.hand.length;
      const tilesDrawn = player.tilesCount - 7; // Approximatif
      const gameTime = game.completedAt && game.startedAt
        ? game.completedAt - game.startedAt
        : 0;

      // Mettre à jour la série de victoires
      let newWinStreak = won ? currentStats.winStreak + 1 : 0;
      let newBestWinStreak = Math.max(currentStats.bestWinStreak, newWinStreak);

      // Mettre à jour le temps moyen
      const totalGames = currentStats.gamesPlayed + 1;
      const newAverageGameTime =
        ((currentStats.averageGameTime * currentStats.gamesPlayed) + gameTime) / totalGames;

      // Mettre à jour le temps de victoire le plus rapide
      let newFastestWinTime = currentStats.fastestWinTime;
      if (won && gameTime > 0) {
        if (!newFastestWinTime || gameTime < newFastestWinTime) {
          newFastestWinTime = gameTime;
        }
      }

      const updatedStats: DominosPlayerStats = {
        userId,
        gamesPlayed: currentStats.gamesPlayed + 1,
        gamesWon: currentStats.gamesWon + (won ? 1 : 0),
        gamesLost: currentStats.gamesLost + (won ? 0 : 1),
        totalTilesPlaced: currentStats.totalTilesPlaced + tilesPlaced,
        totalTilesDrawn: currentStats.totalTilesDrawn + tilesDrawn,
        fastestWinTime: newFastestWinTime,
        averageGameTime: newAverageGameTime,
        winStreak: newWinStreak,
        bestWinStreak: newBestWinStreak,
        lastPlayed: Date.now(),
      };

      await statsRef.set(updatedStats);

      // Ajouter à l'historique
      const historyEntry: Omit<DominosGameHistory, 'id'> = {
        gameId: game.id,
        playerId: userId,
        opponentId: opponent?.id || '',
        opponentName: opponent?.profile.name || 'Inconnu',
        won,
        tilesPlaced,
        tilesDrawn,
        finalTilesLeft: player.hand.length,
        finalScore: player.score,
        gameTime,
        endReason: game.winReason || 'opponent_left',
        playedAt: Date.now(),
      };

      await firestore()
        .collection(DOMINOS_HISTORY_COLLECTION)
        .add(historyEntry);

      console.log('Dominos stats updated:', { userId, won });
    } catch (error) {
      console.error('Error updating dominos stats:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'historique des parties d'un joueur
   */
  static async getGameHistory(
    userId: string,
    limit: number = 20
  ): Promise<DominosGameHistory[]> {
    try {
      const snapshot = await firestore()
        .collection(DOMINOS_HISTORY_COLLECTION)
        .where('playerId', '==', userId)
        .orderBy('playedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DominosGameHistory[];
    } catch (error) {
      console.error('Error getting game history:', error);
      throw error;
    }
  }

  /**
   * Obtenir le classement global
   */
  static async getLeaderboard(limit: number = 10): Promise<DominosPlayerStats[]> {
    try {
      const snapshot = await firestore()
        .collection(DOMINOS_STATS_COLLECTION)
        .orderBy('gamesWon', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data()) as DominosPlayerStats[];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }
}
