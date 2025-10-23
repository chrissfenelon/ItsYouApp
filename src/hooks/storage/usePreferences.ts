import { useState, useEffect, useCallback } from 'react';
import { PreferencesService, UserPreferences } from '../../services/storage/PreferencesService';
import { AppTheme, getTheme } from '../../data/constants/themes';

export const usePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(getTheme('light'));
  const [loading, setLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Update theme when preferences change
  useEffect(() => {
    if (preferences) {
      setCurrentTheme(getTheme(preferences.theme));
    }
  }, [preferences?.theme]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const loadedPreferences = await PreferencesService.loadPreferences();
      setPreferences(loadedPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = useCallback(
    async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      try {
        const updatedPreferences = await PreferencesService.updatePreference(key, value);
        setPreferences(updatedPreferences);
        return updatedPreferences;
      } catch (error) {
        console.error('Error updating preference:', error);
        throw error;
      }
    },
    []
  );

  const toggleTheme = useCallback(async () => {
    if (!preferences) return;

    const newTheme = preferences.theme === 'light' ? 'dark' : 'light';
    await updatePreference('theme', newTheme);
  }, [preferences, updatePreference]);

  const resetPreferences = useCallback(async () => {
    try {
      const defaultPreferences = await PreferencesService.resetPreferences();
      setPreferences(defaultPreferences);
      return defaultPreferences;
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    }
  }, []);

  return {
    preferences,
    currentTheme,
    loading,
    updatePreference,
    toggleTheme,
    resetPreferences,
  };
};
