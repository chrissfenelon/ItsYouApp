import AsyncStorage from '@react-native-async-storage/async-storage';
import { SoundService } from '../SoundService';

const SETTINGS_KEY = '@quiz_couple_settings';

export interface QuizSettings {
  // Audio & Notifications
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationsEnabled: boolean;
  notificationsEnabled: boolean;

  // Gameplay
  autoNextQuestion: boolean;
  showHints: boolean;

  // Game Configuration
  difficultyLevel: 'facile' | 'moyen' | 'difficile';
  questionsPerGame: number;
  timePerQuestion: number;
}

const DEFAULT_SETTINGS: QuizSettings = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationsEnabled: true,
  notificationsEnabled: true,
  autoNextQuestion: false,
  showHints: true,
  difficultyLevel: 'moyen',
  questionsPerGame: 10,
  timePerQuestion: 15,
};

export class QuizSettingsService {
  /**
   * Charger les paramètres
   */
  static async loadSettings(): Promise<QuizSettings> {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...settings };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading quiz settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Sauvegarder les paramètres
   */
  static async saveSettings(settings: QuizSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving quiz settings:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un paramètre spécifique
   */
  static async updateSetting<K extends keyof QuizSettings>(
    key: K,
    value: QuizSettings[K]
  ): Promise<void> {
    try {
      const settings = await this.loadSettings();
      settings[key] = value;
      await this.saveSettings(settings);

      // Sync with SoundService for audio/haptic settings
      if (key === 'soundEnabled') {
        await SoundService.updateSettings({ sfxEnabled: value as boolean });
      } else if (key === 'musicEnabled') {
        await SoundService.updateSettings({ musicEnabled: value as boolean });
      } else if (key === 'vibrationsEnabled') {
        await SoundService.updateSettings({ hapticEnabled: value as boolean });
      }
    } catch (error) {
      console.error('Error updating quiz setting:', error);
      throw error;
    }
  }

  /**
   * Réinitialiser aux paramètres par défaut
   */
  static async resetSettings(): Promise<void> {
    try {
      await this.saveSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Error resetting quiz settings:', error);
      throw error;
    }
  }
}
