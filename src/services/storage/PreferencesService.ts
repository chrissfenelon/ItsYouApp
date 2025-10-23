import AsyncStorage from '@react-native-async-storage/async-storage';
import { SoundService } from '../SoundService';

const PREFERENCES_KEY = '@wordsearch_preferences';

export interface UserPreferences {
  // Theme
  theme: 'light' | 'dark';

  // Audio
  musicEnabled: boolean;
  musicVolume: number; // 0-100
  soundEffectsEnabled: boolean;
  soundEffectsVolume: number; // 0-100

  // Notifications
  notificationsEnabled: boolean;
  dailyReminderEnabled: boolean;
  multiplayerNotificationsEnabled: boolean;

  // Game
  defaultDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  showHints: boolean;
  vibrationsEnabled: boolean;

  // Misc
  language: 'fr' | 'en';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  // Theme
  theme: 'light',

  // Audio
  musicEnabled: true,
  musicVolume: 70,
  soundEffectsEnabled: true,
  soundEffectsVolume: 80,

  // Notifications
  notificationsEnabled: true,
  dailyReminderEnabled: false,
  multiplayerNotificationsEnabled: true,

  // Game
  defaultDifficulty: 'medium',
  showHints: true,
  vibrationsEnabled: true,

  // Misc
  language: 'fr',
};

export class PreferencesService {
  /**
   * Load user preferences from storage
   */
  static async loadPreferences(): Promise<UserPreferences> {
    try {
      const preferencesJson = await AsyncStorage.getItem(PREFERENCES_KEY);

      if (!preferencesJson) {
        // First time - save defaults
        await this.savePreferences(DEFAULT_PREFERENCES);
        return DEFAULT_PREFERENCES;
      }

      const preferences = JSON.parse(preferencesJson);
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_PREFERENCES, ...preferences };
    } catch (error) {
      console.error('Error loading preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Save user preferences to storage
   */
  static async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      const preferencesJson = JSON.stringify(preferences);
      await AsyncStorage.setItem(PREFERENCES_KEY, preferencesJson);
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }

  /**
   * Update a single preference
   */
  static async updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<UserPreferences> {
    try {
      const preferences = await this.loadPreferences();
      preferences[key] = value;
      await this.savePreferences(preferences);

      // Sync with SoundService for audio/haptic settings
      if (key === 'musicEnabled') {
        await SoundService.updateSettings({ musicEnabled: value as boolean });
      } else if (key === 'soundEffectsEnabled') {
        await SoundService.updateSettings({ sfxEnabled: value as boolean });
      } else if (key === 'vibrationsEnabled') {
        await SoundService.updateSettings({ hapticEnabled: value as boolean });
      } else if (key === 'musicVolume') {
        await SoundService.updateSettings({ musicVolume: (value as number) / 100 });
      } else if (key === 'soundEffectsVolume') {
        await SoundService.updateSettings({ sfxVolume: (value as number) / 100 });
      }

      return preferences;
    } catch (error) {
      console.error('Error updating preference:', error);
      throw error;
    }
  }

  /**
   * Reset preferences to defaults
   */
  static async resetPreferences(): Promise<UserPreferences> {
    try {
      await this.savePreferences(DEFAULT_PREFERENCES);
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    }
  }

  /**
   * Get default preferences
   */
  static getDefaults(): UserPreferences {
    return { ...DEFAULT_PREFERENCES };
  }
}
