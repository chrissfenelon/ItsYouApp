import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SoundService } from '../services/SoundService';

export interface DominosSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoPlayEnabled: boolean;
  showHints: boolean;
  animationsEnabled: boolean;
  animationSpeed: 'fast' | 'normal' | 'slow';
  confirmBeforePass: boolean;
  autoPlaceTile: boolean;
  showOpponentTilesCount: boolean;
}

const DEFAULT_SETTINGS: DominosSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  autoPlayEnabled: false,
  showHints: true,
  animationsEnabled: true,
  animationSpeed: 'normal',
  confirmBeforePass: true,
  autoPlaceTile: false,
  showOpponentTilesCount: true,
};

const STORAGE_KEY = '@dominos_settings';

export const useDominosSettings = () => {
  const [settings, setSettings] = useState<DominosSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading dominos settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<DominosSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Sync with SoundService for audio/haptic settings
      if (newSettings.soundEnabled !== undefined) {
        await SoundService.updateSettings({ sfxEnabled: newSettings.soundEnabled });
      }
      if (newSettings.vibrationEnabled !== undefined) {
        await SoundService.updateSettings({ hapticEnabled: newSettings.vibrationEnabled });
      }
    } catch (error) {
      console.error('Error saving dominos settings:', error);
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error('Error resetting dominos settings:', error);
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    resetSettings,
  };
};
