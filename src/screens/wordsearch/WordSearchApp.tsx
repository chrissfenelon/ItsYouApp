import React, { useState, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import auth from '@react-native-firebase/auth';
import MenuScreen from './MenuScreen';
import DifficultySelectionScreen from './DifficultySelectionScreen';
import ThemeSelectionScreen from './ThemeSelectionScreen';
import GameScreen from './GameScreen';
import ShopScreen from './ShopScreen';
import LevelsScreen from './LevelsScreen';
import MultiplayerMenuScreen from './MultiplayerMenuScreen';
import MultiplayerLobbyScreen from './MultiplayerLobbyScreen';
import MultiplayerGameScreen from './MultiplayerGameScreen';
import CooperativeLobbyScreen from './CooperativeLobbyScreen';
import CooperativeGameScreen from './CooperativeGameScreen';
import SettingsScreen from './SettingsScreen';
import EditProfileModal from '../../components/wordsearch/modals/EditProfileModal';
import AvatarSelectorModal from '../../components/wordsearch/modals/AvatarSelectorModal';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { usePreferences } from '../../hooks/storage/usePreferences';
import { Difficulty, WordTheme, ShopItem, MultiplayerGame, Avatar, PlayerStats } from '../../types/wordSearch.types';
import { WORD_THEMES } from '../../data/themes';
import { LevelDefinition, getBonusWordsForLevel } from '../../data/levels';
import { useProfile } from '../../hooks/storage/useProfile';

type Screen = 'menu' | 'difficulty' | 'theme' | 'game' | 'shop' | 'levels' | 'multiplayerMenu' | 'multiplayerLobby' | 'multiplayerGame' | 'cooperativeLobby' | 'cooperativeGame' | 'settings';

interface WordSearchAppProps {
  userPhotoURL?: string;
}

const WordSearchApp: React.FC<WordSearchAppProps> = ({ userPhotoURL }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [selectedTheme, setSelectedTheme] = useState<WordTheme | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<LevelDefinition | null>(null);
  const [currentMultiplayerGameId, setCurrentMultiplayerGameId] = useState<string | null>(null);
  const [isMultiplayerHost, setIsMultiplayerHost] = useState(false);
  const [currentCooperativeGameId, setCurrentCooperativeGameId] = useState<string | null>(null);
  const [isCooperativeHost, setIsCooperativeHost] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAvatarSelectorModal, setShowAvatarSelectorModal] = useState(false);
  const [tempSelectedAvatar, setTempSelectedAvatar] = useState<Avatar | undefined>(undefined);

  const gameCompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const { currentTheme } = usePreferences();

  const {
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
    resetProgress,
    deleteProfile,
    updateStats,
  } = useProfile();

  // Créer un profil par défaut si aucun n'existe
  useEffect(() => {
    if (!loading && !profile) {
      // Use photoURL from props (main app context) or Firebase Auth
      const photoURL = userPhotoURL || auth().currentUser?.photoURL || undefined;
      createProfile('Joueur', { type: 'emoji', value: '👤' }, photoURL);
    }
  }, [loading, profile, createProfile, userPhotoURL]);

  // Synchroniser le photoURL du profil principal avec le profil Word Search
  useEffect(() => {
    if (!loading && profile && userPhotoURL && profile.photoURL !== userPhotoURL) {
      console.log('Synchronizing photoURL with main app profile:', userPhotoURL);
      updateProfile({ photoURL: userPhotoURL });
    }
  }, [loading, profile, userPhotoURL, updateProfile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (gameCompleteTimeoutRef.current) {
        clearTimeout(gameCompleteTimeoutRef.current);
      }
    };
  }, []);

  const handlePlaySolo = () => {
    setCurrentScreen('difficulty');
  };

  const handleShowLevels = () => {
    setCurrentScreen('levels');
  };

  const handleSelectLevel = (level: LevelDefinition) => {
    setSelectedLevel(level);
    setSelectedDifficulty(level.difficulty);

    // Get the theme for this level
    const theme = WORD_THEMES.find(t => t.id === level.themeId);
    if (theme) {
      setSelectedTheme({
        ...theme,
        unlocked: profile?.unlockedThemes.includes(theme.id) || false,
      });
      setCurrentScreen('game');
    }
  };

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setCurrentScreen('theme');
  };

  const handleSelectTheme = (theme: WordTheme) => {
    setSelectedTheme(theme);
    setSelectedLevel(null); // Clear level when selecting custom theme
    setCurrentScreen('game');
  };

  const handleGameComplete = async (result: any) => {
    if (!profile) return;

    try {
      // Mettre à jour les statistiques
      const statsUpdate: Partial<PlayerStats> = {
        gamesPlayed: (profile.stats.gamesPlayed || 0) + 1,
        totalWordsFound: (profile.stats.totalWordsFound || 0) + (result.wordsFound || 0),
        totalScore: (profile.stats.totalScore || 0) + result.score,
      };

      // Si le jeu est gagné (tous les mots trouvés)
      if (result.allWordsFound) {
        statsUpdate.gamesWon = (profile.stats.gamesWon || 0) + 1;
      }

      // Mettre à jour le meilleur temps si applicable
      if (result.timeElapsed && (!profile.stats.bestTime || result.timeElapsed < profile.stats.bestTime)) {
        statsUpdate.bestTime = result.timeElapsed;
      }

      await updateStats(statsUpdate);

      // Marquer le niveau comme complété si on joue en mode niveau
      if (selectedLevel) {
        await completeLevel(selectedLevel.id);
      }

      // Ajouter les pièces
      await addCoins(result.coinsEarned);

      // Ajouter l'XP et vérifier le level up
      const xpResult = await addXP(result.xpEarned);

      if (xpResult.leveledUp) {
        showAlert({
          title: '🎉 Niveau Supérieur !',
          message: `Félicitations ! Tu es maintenant niveau ${xpResult.newLevel} !\nTu as gagné ${50 * (xpResult.newLevel - (xpResult.newLevel - 1))} pièces bonus !`,
          type: 'success',
        });
      }

      gameCompleteTimeoutRef.current = setTimeout(() => {
        // Retourner à l'écran des niveaux si on jouait en mode niveau
        if (selectedLevel) {
          setCurrentScreen('levels');
        } else {
          setCurrentScreen('menu');
        }
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des résultats:', error);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!profile) return;

    try {
      if (item.type === 'theme') {
        // Débloquer un thème
        const themeId = item.id.replace('theme_', '');
        await unlockTheme(themeId, item.price);
      } else if (item.type === 'powerup') {
        // Pour les power-ups, dépenser les pièces et ajouter à l'inventaire
        await spendCoins(item.price);

        // Map shop item ID to power-up type
        const powerUpMapping: Record<string, { type: keyof typeof profile.powerUps; quantity: number }> = {
          'time_freeze': { type: 'timeFreeze', quantity: 1 },
          'highlight_first': { type: 'highlightFirst', quantity: 1 },
        };

        const powerUpInfo = powerUpMapping[item.id];
        if (powerUpInfo) {
          await addPowerUp(powerUpInfo.type, powerUpInfo.quantity);
        }
      } else if (item.type === 'consumable') {
        // Pour les consommables (hints), dépenser les pièces et ajouter à l'inventaire
        await spendCoins(item.price);

        // Map consumable items to power-ups
        const consumableMapping: Record<string, { type: keyof typeof profile.powerUps; quantity: number }> = {
          'hint_letter': { type: 'revealLetter', quantity: 1 },
          'hint_word': { type: 'revealWord', quantity: 1 },
          'hint_bundle_5': { type: 'revealLetter', quantity: 5 },
          'hint_bundle_10': { type: 'revealLetter', quantity: 10 },
        };

        const consumableInfo = consumableMapping[item.id];
        if (consumableInfo) {
          await addPowerUp(consumableInfo.type, consumableInfo.quantity);
        }
      } else {
        // Pour les autres types, juste dépenser les pièces
        await spendCoins(item.price);
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  const handlePlayMultiplayer = () => {
    setCurrentScreen('multiplayerMenu');
  };

  const handleMultiplayerGameCreated = (gameId: string, isHost: boolean) => {
    setCurrentMultiplayerGameId(gameId);
    setIsMultiplayerHost(isHost);
    setCurrentScreen('multiplayerLobby');
  };

  const handleMultiplayerGameStart = (game: MultiplayerGame) => {
    setCurrentScreen('multiplayerGame');
  };

  const handleMultiplayerGameComplete = (result: any) => {
    // Show results and return to menu
    const message = result.winner?.id === profile?.id
      ? `🎉 Félicitations ! Vous avez gagné !\n\nScore: ${result.winner.score}`
      : `😔 Partie terminée\n\n${result.winner?.profile.name || 'Un adversaire'} a gagné avec ${result.winner?.score || 0} points.`;

    showAlert({
      title: 'Partie terminée',
      message,
      type: result.winner?.id === profile?.id ? 'success' : 'info',
      buttons: [
        { text: 'OK', onPress: () => setCurrentScreen('menu') },
      ],
    });
  };

  const handleCooperativeGameCreated = (gameId: string, isHost: boolean) => {
    setCurrentCooperativeGameId(gameId);
    setIsCooperativeHost(isHost);
    setCurrentScreen('cooperativeLobby');
  };

  const handleCooperativeGameStart = (game: any) => {
    setCurrentScreen('cooperativeGame');
  };

  const handleCooperativeGameComplete = (result: any) => {
    const message = result.success
      ? `🎉 Victoire ! Vous avez trouvé tous les mots ensemble !\n\nTemps: ${result.time}s\nScore total: ${result.totalScore}`
      : `😔 Temps écoulé\n\nMots trouvés: ${result.wordsFound}/${result.totalWords}`;

    showAlert({
      title: 'Partie coopérative terminée',
      message,
      type: result.success ? 'success' : 'warning',
      buttons: [
        { text: 'OK', onPress: () => setCurrentScreen('menu') },
      ],
    });
  };

  const handleExitMultiplayer = () => {
    setCurrentMultiplayerGameId(null);
    setCurrentScreen('menu');
  };

  const handleShowSettings = () => {
    setCurrentScreen('settings');
  };

  const handleEditProfile = () => {
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async (name: string, avatar: Avatar) => {
    try {
      await updateProfile({ name, avatar });
      showAlert({
        title: 'Succès',
        message: 'Profil mis à jour !',
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le profil',
        type: 'error',
      });
    }
  };

  // Theme object pour CustomAlert
  const theme = {
    romantic: {
      primary: currentTheme.colors.primary,
    },
  };

  if (loading || !profile) {
    return null; // ou un écran de chargement
  }

  // Filtrer les thèmes débloqués
  const availableThemes = WORD_THEMES.map(theme => ({
    ...theme,
    unlocked: profile.unlockedThemes.includes(theme.id),
  }));

  // Render current screen
  switch (currentScreen) {
    case 'menu':
      return (
        <MenuScreen
          onPlaySolo={handlePlaySolo}
          onPlayMultiplayer={handlePlayMultiplayer}
          onSettings={handleShowSettings}
          onShop={() => setCurrentScreen('shop')}
          onLevels={handleShowLevels}
          onEditProfile={handleEditProfile}
          playerName={profile.name}
          coins={profile.coins}
          level={profile.level}
          avatar={profile.avatar}
        />
      );

    case 'difficulty':
      return (
        <DifficultySelectionScreen
          onSelectDifficulty={handleSelectDifficulty}
          onBack={handleBackToMenu}
        />
      );

    case 'theme':
      return (
        <ThemeSelectionScreen
          themes={availableThemes}
          onSelectTheme={handleSelectTheme}
          onBack={() => setCurrentScreen('difficulty')}
          userCoins={profile.coins}
        />
      );

    case 'shop':
      return (
        <ShopScreen
          onBack={handleBackToMenu}
          userCoins={profile.coins}
          onPurchase={handlePurchase}
        />
      );

    case 'levels':
      return (
        <LevelsScreen
          onSelectLevel={handleSelectLevel}
          onBack={handleBackToMenu}
        />
      );

    case 'game':
      if (!selectedTheme) return null;

      // Get bonus words if playing a level
      const bonusWords = selectedLevel ? getBonusWordsForLevel(selectedLevel.id) : [];

      return (
        <GameScreen
          difficulty={selectedDifficulty}
          words={selectedTheme.words}
          themeId={selectedTheme.id}
          themeName={selectedTheme.name}
          levelId={selectedLevel?.id}
          bonusWords={bonusWords}
          onExit={handleBackToMenu}
          onGameComplete={handleGameComplete}
        />
      );

    case 'multiplayerMenu':
      return (
        <MultiplayerMenuScreen
          onGameCreated={handleMultiplayerGameCreated}
          onCoopGameCreated={handleCooperativeGameCreated}
          onBack={handleBackToMenu}
        />
      );

    case 'multiplayerLobby':
      return (
        <MultiplayerLobbyScreen
          gameId={currentMultiplayerGameId}
          playerProfile={profile}
          isHost={isMultiplayerHost}
          onStartGame={handleMultiplayerGameStart}
          onBack={handleBackToMenu}
        />
      );

    case 'multiplayerGame':
      if (!currentMultiplayerGameId) {
        setCurrentScreen('menu');
        return null;
      }

      return (
        <MultiplayerGameScreen
          gameId={currentMultiplayerGameId}
          playerId={profile.id}
          onExit={handleExitMultiplayer}
          onGameComplete={handleMultiplayerGameComplete}
        />
      );

    case 'cooperativeLobby':
      return (
        <CooperativeLobbyScreen
          gameId={currentCooperativeGameId}
          playerProfile={profile}
          isHost={isCooperativeHost}
          onStartGame={handleCooperativeGameStart}
          onBack={handleBackToMenu}
        />
      );

    case 'cooperativeGame':
      if (!currentCooperativeGameId) {
        setCurrentScreen('menu');
        return null;
      }

      return (
        <CooperativeGameScreen
          gameId={currentCooperativeGameId}
          playerId={profile.id}
          onExit={handleExitMultiplayer}
          onGameComplete={handleCooperativeGameComplete}
        />
      );

    case 'settings':
      return (
        <>
          <SettingsScreen
            profile={profile}
            onBack={handleBackToMenu}
            onEditProfile={handleEditProfile}
            onResetProgress={resetProgress}
            onDeleteProfile={deleteProfile}
          />

          {/* Modals */}
          <EditProfileModal
            visible={showEditProfileModal}
            profile={profile}
            onClose={() => {
              setShowEditProfileModal(false);
              setTempSelectedAvatar(undefined);
            }}
            onSave={handleSaveProfile}
            onSelectAvatar={() => {
              setShowEditProfileModal(false);
              setShowAvatarSelectorModal(true);
            }}
            selectedAvatar={tempSelectedAvatar}
          />

          <AvatarSelectorModal
            visible={showAvatarSelectorModal}
            currentAvatar={tempSelectedAvatar || profile.avatar}
            onClose={() => {
              setShowAvatarSelectorModal(false);
              setShowEditProfileModal(true);
            }}
            onSelect={(avatar) => {
              setTempSelectedAvatar(avatar);
              setShowAvatarSelectorModal(false);
              setShowEditProfileModal(true);
            }}
          />

          {/* Custom Alert */}
          {alertConfig && (
            <CustomAlert
              visible={isVisible}
              title={alertConfig.title}
              message={alertConfig.message}
              buttons={alertConfig.buttons}
              onClose={hideAlert}
              theme={theme}
              type={alertConfig.type}
            />
          )}
        </>
      );

    default:
      return null;
  }
};

export default WordSearchApp;
