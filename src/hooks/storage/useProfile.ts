import { useState, useEffect, useCallback } from 'react';
import { PlayerProfile, Avatar, PlayerStats } from '../../types/wordSearch.types';
import { ProfileService } from '../../services/storage/ProfileService';
import auth from '@react-native-firebase/auth';

export const useProfile = () => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger le profil au démarrage et s'authentifier anonymement
  useEffect(() => {
    initializeProfile();
  }, []);

  const initializeProfile = async () => {
    try {
      // S'authentifier anonymement auprès de Firebase pour le multijoueur
      await auth().signInAnonymously();
      console.log('Authentification Firebase réussie');

      // Charger le profil local
      await loadProfile();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      // Continuer même si l'auth échoue, charger juste le profil
      await loadProfile();
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const loadedProfile = await ProfileService.loadProfile();
      setProfile(loadedProfile);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = useCallback(async (name: string, avatar: Avatar, photoURL?: string) => {
    try {
      const newProfile = await ProfileService.createProfile(name, avatar, photoURL);
      setProfile(newProfile);
      return newProfile;
    } catch (error) {
      console.error('Erreur lors de la création du profil:', error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<PlayerProfile>) => {
    try {
      const updatedProfile = await ProfileService.updateProfile(updates);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
      return updatedProfile;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }, []);

  const addXP = useCallback(async (xp: number) => {
    try {
      const result = await ProfileService.addXP(xp);
      setProfile(result.profile);
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'XP:', error);
      throw error;
    }
  }, []);

  const addCoins = useCallback(async (coins: number) => {
    try {
      const updatedProfile = await ProfileService.addCoins(coins);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de pièces:', error);
      throw error;
    }
  }, []);

  const spendCoins = useCallback(async (coins: number) => {
    try {
      const updatedProfile = await ProfileService.spendCoins(coins);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Erreur lors de la dépense de pièces:', error);
      throw error;
    }
  }, []);

  const unlockTheme = useCallback(async (themeId: string, price: number) => {
    try {
      // Dépenser les pièces d'abord
      await ProfileService.spendCoins(price);
      // Puis débloquer le thème
      const updatedProfile = await ProfileService.unlockTheme(themeId);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Erreur lors du déblocage du thème:', error);
      throw error;
    }
  }, []);

  const completeLevel = useCallback(async (levelId: number) => {
    try {
      const updatedProfile = await ProfileService.completeLevel(levelId);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Erreur lors de la complétion du niveau:', error);
      throw error;
    }
  }, []);

  const addPowerUp = useCallback(async (powerUpType: keyof PlayerProfile['powerUps'], quantity: number) => {
    try {
      const updatedProfile = await ProfileService.addPowerUp(powerUpType, quantity);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de power-up:', error);
      throw error;
    }
  }, []);

  const usePowerUp = useCallback(async (powerUpType: keyof PlayerProfile['powerUps']) => {
    try {
      const updatedProfile = await ProfileService.usePowerUp(powerUpType);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Erreur lors de l\'utilisation de power-up:', error);
      throw error;
    }
  }, []);

  const resetProgress = useCallback(async () => {
    try {
      const resetProfile = await ProfileService.resetProgress();
      setProfile(resetProfile);
      return resetProfile;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }, []);

  const deleteProfile = useCallback(async () => {
    try {
      await ProfileService.deleteProfile();
      setProfile(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du profil:', error);
      throw error;
    }
  }, []);

  const updateStats = useCallback(async (statsUpdate: Partial<PlayerStats>) => {
    try {
      const updatedProfile = await ProfileService.updateStats(statsUpdate);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des stats:', error);
      throw error;
    }
  }, []);

  return {
    profile,
    loading,
    createProfile,
    updateProfile,
    addXP,
    addCoins,
    spendCoins,
    unlockTheme,
    completeLevel,
    addPowerUp,
    usePowerUp,
    resetProgress,
    deleteProfile,
    updateStats,
    refreshProfile: loadProfile,
  };
};
