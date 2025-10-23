import AsyncStorage from '@react-native-async-storage/async-storage';
import { SoundService } from '../SoundService';

const MORPION_SETTINGS_KEY = '@morpion_settings';

export interface MorpionSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationsEnabled: boolean;
  notificationsEnabled: boolean;
  showGridLines: boolean;
  autoSaveGame: boolean;
  defaultBoardSize: 3 | 4 | 5;
  defaultWinCondition: 3 | 4 | 5;
  animationsEnabled: boolean;
}

const DEFAULT_SETTINGS: MorpionSettings = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationsEnabled: true,
  notificationsEnabled: true,
  showGridLines: true,
  autoSaveGame: true,
  defaultBoardSize: 3,
  defaultWinCondition: 3,
  animationsEnabled: true,
};

export class MorpionSettingsService {
  /**
   * Load settings from storage
   */
  static async loadSettings(): Promise<MorpionSettings> {
    try {
      const settingsString = await AsyncStorage.getItem(MORPION_SETTINGS_KEY);
      if (settingsString) {
        const savedSettings = JSON.parse(settingsString);
        return { ...DEFAULT_SETTINGS, ...savedSettings };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading Morpion settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings to storage
   */
  static async saveSettings(settings: MorpionSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(MORPION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving Morpion settings:', error);
      throw error;
    }
  }

  /**
   * Update a single setting
   */
  static async updateSetting<K extends keyof MorpionSettings>(
    key: K,
    value: MorpionSettings[K]
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
      console.error('Error updating Morpion setting:', error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  static async resetSettings(): Promise<void> {
    try {
      await this.saveSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Error resetting Morpion settings:', error);
      throw error;
    }
  }
}
