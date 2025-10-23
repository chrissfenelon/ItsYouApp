import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerProfile, Avatar, PlayerStats } from '../../types/wordSearch.types';

const PROFILE_KEY = '@wordSearch:profile';
const STATS_KEY = '@wordSearch:stats';

export class ProfileService {
  /**
   * Créer un nouveau profil
   */
  static async createProfile(name: string, avatar: Avatar, photoURL?: string): Promise<PlayerProfile> {
    const profile: PlayerProfile = {
      id: Date.now().toString(),
      name,
      avatar,
      photoURL, // Photo Firebase Auth pour affichage dans les jeux multiplayer
      level: 1,
      xp: 0,
      coins: 0,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalWordsFound: 0,
        totalScore: 0,
        bestTime: 0,
        favortieDifficulty: 'easy',
        multiplayerWins: 0,
        multiplayerGames: 0,
      },
      unlockedThemes: ['animals', 'food', 'sports'], // Thèmes de départ
      unlockedAvatars: [],
      completedLevels: [],
      powerUps: {
        revealLetter: 3, // Start with 3 free hints
        revealWord: 1, // Start with 1 free reveal
        timeFreeze: 0,
        highlightFirst: 0,
      },
      createdAt: Date.now(),
    };

    await this.saveProfile(profile);
    return profile;
  }

  /**
   * Sauvegarder le profil
   */
  static async saveProfile(profile: PlayerProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      throw error;
    }
  }

  /**
   * Charger le profil
   */
  static async loadProfile(): Promise<PlayerProfile | null> {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      if (data) {
        const profile = JSON.parse(data);
        let needsSave = false;

        // Migration: Add powerUps if missing (for old profiles)
        if (!profile.powerUps) {
          profile.powerUps = {
            revealLetter: 3,
            revealWord: 1,
            timeFreeze: 0,
            highlightFirst: 0,
          };
          needsSave = true;
        }

        // Migration: Add photoURL if missing (for old profiles)
        if (profile.photoURL === undefined) {
          profile.photoURL = null;
          needsSave = true;
        }

        if (needsSave) {
          await this.saveProfile(profile);
        }

        return profile;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      return null;
    }
  }

  /**
   * Mettre à jour le profil
   */
  static async updateProfile(updates: Partial<PlayerProfile>): Promise<PlayerProfile | null> {
    try {
      const profile = await this.loadProfile();
      if (!profile) return null;

      const updatedProfile = { ...profile, ...updates };
      await this.saveProfile(updatedProfile);

      // Synchroniser avec Firestore et les parties actives si le nom ou l'avatar a changé
      if (updates.name || updates.avatar) {
        const { ProfileSyncService } = await import('../ProfileSyncService');
        await ProfileSyncService.syncAllGameProfiles(
          updatedProfile.id,
          updatedProfile.name,
          updatedProfile.avatar.type === 'photo' ? updatedProfile.avatar.value : null
        );
        await ProfileSyncService.updateActiveGamesProfile(
          updatedProfile.id,
          updatedProfile.name,
          updatedProfile.avatar
        );
      }

      return updatedProfile;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return null;
    }
  }

  /**
   * Ajouter de l'XP et vérifier le niveau
   */
  static async addXP(xp: number): Promise<{ leveledUp: boolean; newLevel: number; profile: PlayerProfile }> {
    const profile = await this.loadProfile();
    if (!profile) throw new Error('Profil non trouvé');

    const oldLevel = profile.level;
    profile.xp += xp;

    // Calculer le nouveau niveau
    const newLevel = this.calculateLevel(profile.xp);
    profile.level = newLevel;

    // Récompense de niveau si level up
    const leveledUp = newLevel > oldLevel;
    if (leveledUp) {
      profile.coins += 50 * (newLevel - oldLevel); // 50 pièces par niveau
    }

    await this.saveProfile(profile);

    return {
      leveledUp,
      newLevel,
      profile,
    };
  }

  /**
   * Ajouter des pièces
   */
  static async addCoins(coins: number): Promise<PlayerProfile> {
    const profile = await this.loadProfile();
    if (!profile) throw new Error('Profil non trouvé');

    profile.coins += coins;
    await this.saveProfile(profile);
    return profile;
  }

  /**
   * Dépenser des pièces
   */
  static async spendCoins(coins: number): Promise<PlayerProfile> {
    const profile = await this.loadProfile();
    if (!profile) throw new Error('Profil non trouvé');

    if (profile.coins < coins) {
      throw new Error('Pas assez de pièces');
    }

    profile.coins -= coins;
    await this.saveProfile(profile);
    return profile;
  }

  /**
   * Débloquer un thème
   */
  static async unlockTheme(themeId: string): Promise<PlayerProfile> {
    const profile = await this.loadProfile();
    if (!profile) throw new Error('Profil non trouvé');

    if (!profile.unlockedThemes.includes(themeId)) {
      profile.unlockedThemes.push(themeId);
      await this.saveProfile(profile);
    }

    return profile;
  }

  /**
   * Marquer un niveau comme complété
   */
  static async completeLevel(levelId: number): Promise<PlayerProfile> {
    const profile = await this.loadProfile();
    if (!profile) throw new Error('Profil non trouvé');

    if (!profile.completedLevels.includes(levelId)) {
      profile.completedLevels.push(levelId);
      await this.saveProfile(profile);
    }

    return profile;
  }

  /**
   * Ajouter des power-ups
   */
  static async addPowerUp(powerUpType: keyof PlayerProfile['powerUps'], quantity: number): Promise<PlayerProfile> {
    const profile = await this.loadProfile();
    if (!profile) throw new Error('Profil non trouvé');

    profile.powerUps[powerUpType] += quantity;
    await this.saveProfile(profile);
    return profile;
  }

  /**
   * Utiliser un power-up
   */
  static async usePowerUp(powerUpType: keyof PlayerProfile['powerUps']): Promise<PlayerProfile> {
    const profile = await this.loadProfile();
    if (!profile) throw new Error('Profil non trouvé');

    if (profile.powerUps[powerUpType] <= 0) {
      throw new Error('Pas assez de power-ups');
    }

    profile.powerUps[powerUpType] -= 1;
    await this.saveProfile(profile);
    return profile;
  }

  /**
   * Mettre à jour les statistiques
   */
  static async updateStats(statsUpdate: Partial<PlayerStats>): Promise<PlayerProfile> {
    const profile = await this.loadProfile();
    if (!profile) throw new Error('Profil non trouvé');

    profile.stats = { ...profile.stats, ...statsUpdate };
    await this.saveProfile(profile);
    return profile;
  }

  /**
   * Calculer le niveau basé sur l'XP total
   */
  private static calculateLevel(totalXP: number): number {
    let level = 1;
    let xpNeeded = 0;

    while (level < 100) {
      const xpForNextLevel = Math.floor(100 * Math.pow(1.15, level - 1));
      xpNeeded += xpForNextLevel;
      if (totalXP < xpNeeded) {
        break;
      }
      level++;
    }

    return level;
  }

  /**
   * Réinitialiser la progression (garder nom et avatar)
   */
  static async resetProgress(): Promise<PlayerProfile> {
    try {
      const currentProfile = await this.loadProfile();
      if (!currentProfile) throw new Error('Profil non trouvé');

      // Garder seulement le nom et l'avatar
      const resetProfile: PlayerProfile = {
        id: currentProfile.id,
        name: currentProfile.name,
        avatar: currentProfile.avatar,
        level: 1,
        xp: 0,
        coins: 0,
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          totalWordsFound: 0,
          totalScore: 0,
          bestTime: 0,
          favortieDifficulty: 'easy',
          multiplayerWins: 0,
          multiplayerGames: 0,
        },
        unlockedThemes: ['animals', 'food', 'sports'],
        unlockedAvatars: [],
        completedLevels: [],
        powerUps: {
          revealLetter: 3,
          revealWord: 1,
          timeFreeze: 0,
          highlightFirst: 0,
        },
        createdAt: currentProfile.createdAt,
      };

      await this.saveProfile(resetProfile);
      return resetProfile;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }

  /**
   * Supprimer le profil
   */
  static async deleteProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_KEY);
      await AsyncStorage.removeItem(STATS_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression du profil:', error);
      throw error;
    }
  }
}
