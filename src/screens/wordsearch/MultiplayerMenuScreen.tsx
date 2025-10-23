import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { WORD_SEARCH_COLORS } from '../../data/constants/colors';
import { Difficulty } from '../../types/wordSearch.types';
import { MultiplayerService } from '../../services/multiplayer/MultiplayerService';
import { CooperativeGameService } from '../../services/multiplayer/CooperativeGameService';
import { WORD_THEMES } from '../../data/themes';
import auth from '@react-native-firebase/auth';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useApp } from '../../context/AppContext';

interface MultiplayerMenuScreenProps {
  onGameCreated: (gameId: string, isHost: boolean) => void;
  onCoopGameCreated: (gameId: string, isHost: boolean) => void;
  onBack: () => void;
}

const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
  { value: 'expert', label: 'Expert' },
];

const MultiplayerMenuScreen: React.FC<MultiplayerMenuScreenProps> = ({
  onGameCreated,
  onCoopGameCreated,
  onBack,
}) => {
  const { user } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [activeTab, setActiveTab] = useState<'competitive' | 'cooperative' | 'join'>('competitive');
  const [roomCode, setRoomCode] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const maxPlayers = 2; // Fixed to 2 players
  const [loading, setLoading] = useState(false);

  const handleCreateGame = async () => {
    if (!user) {
      showAlert({
        title: 'Erreur',
        message: 'Utilisateur non connecté',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // Ensure user is authenticated
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('User not authenticated, signing in anonymously...');
        await auth().signInAnonymously();
        console.log('Anonymous sign-in successful');
      }

      // Build player profile from main app user (same as Quiz Couple)
      const playerProfile = {
        id: user.id,
        name: user.name || 'Joueur',
        avatar: {
          type: (user.profilePicture?.startsWith('http') || user.profilePicture?.startsWith('file://')) ? 'photo' as const : 'emoji' as const,
          value: user.profilePicture || '👤',
        },
        photoURL: user.photoURL || null,
        level: user.level || 1,
        xp: user.xp || 0,
        coins: user.coins || 0,
        stats: user.stats || {
          gamesPlayed: 0,
          gamesWon: 0,
          totalWordsFound: 0,
          totalScore: 0,
          bestTime: 0,
          favortieDifficulty: 'easy' as const,
          multiplayerWins: 0,
          multiplayerGames: 0,
        },
        unlockedThemes: user.unlockedThemes || [],
        unlockedAvatars: user.unlockedAvatars || [],
        completedLevels: user.completedLevels || [],
        powerUps: user.powerUps || {
          revealLetter: 0,
          revealWord: 0,
          timeFreeze: 0,
          highlightFirst: 0,
        },
        createdAt: user.createdAt || Date.now(),
      };

      const gameId = await MultiplayerService.createGame(
        playerProfile,
        selectedDifficulty,
        'Animaux', // Default theme, can be made configurable
        maxPlayers
      );
      onGameCreated(gameId, true);
    } catch (error: any) {
      console.error('Erreur lors de la création du jeu:', error);
      showAlert({
        title: 'Erreur',
        message: error?.message || 'Impossible de créer la partie',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoopGame = async () => {
    if (!user) {
      showAlert({
        title: 'Erreur',
        message: 'Utilisateur non connecté',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // Ensure user is authenticated
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('User not authenticated, signing in anonymously...');
        await auth().signInAnonymously();
        console.log('Anonymous sign-in successful');
      }

      // Get words from default theme (animals)
      const animalTheme = WORD_THEMES.find(t => t.id === 'animals');
      const words = animalTheme?.words || [];

      if (words.length === 0) {
        showAlert({
          title: 'Erreur',
          message: 'Aucun mot disponible pour ce thème',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      // Build player profile from main app user (same as Quiz Couple)
      const playerProfile = {
        id: user.id,
        name: user.name || 'Joueur',
        avatar: {
          type: (user.profilePicture?.startsWith('http') || user.profilePicture?.startsWith('file://')) ? 'photo' as const : 'emoji' as const,
          value: user.profilePicture || '👤',
        },
        photoURL: user.photoURL || null,
        level: user.level || 1,
        xp: user.xp || 0,
        coins: user.coins || 0,
        stats: user.stats || {
          gamesPlayed: 0,
          gamesWon: 0,
          totalWordsFound: 0,
          totalScore: 0,
          bestTime: 0,
          favortieDifficulty: 'easy' as const,
          multiplayerWins: 0,
          multiplayerGames: 0,
        },
        unlockedThemes: user.unlockedThemes || [],
        unlockedAvatars: user.unlockedAvatars || [],
        completedLevels: user.completedLevels || [],
        powerUps: user.powerUps || {
          revealLetter: 0,
          revealWord: 0,
          timeFreeze: 0,
          highlightFirst: 0,
        },
        createdAt: user.createdAt || Date.now(),
      };

      const gameId = await CooperativeGameService.createCooperativeGame(
        playerProfile,
        selectedDifficulty,
        'animals',
        words,
        maxPlayers
      );
      onCoopGameCreated(gameId, true);
    } catch (error: any) {
      console.error('Erreur lors de la création du jeu coopératif:', error);
      showAlert({
        title: 'Erreur',
        message: error?.message || 'Impossible de créer la partie coopérative',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!user) {
      showAlert({
        title: 'Erreur',
        message: 'Utilisateur non connecté',
        type: 'error',
      });
      return;
    }

    if (!roomCode.trim()) {
      showAlert({
        title: 'Erreur',
        message: 'Veuillez entrer un code de salon',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // Build player profile from main app user (same as Quiz Couple)
      const playerProfile = {
        id: user.id,
        name: user.name || 'Joueur',
        avatar: {
          type: (user.profilePicture?.startsWith('http') || user.profilePicture?.startsWith('file://')) ? 'photo' as const : 'emoji' as const,
          value: user.profilePicture || '👤',
        },
        photoURL: user.photoURL || null,
        level: user.level || 1,
        xp: user.xp || 0,
        coins: user.coins || 0,
        stats: user.stats || {
          gamesPlayed: 0,
          gamesWon: 0,
          totalWordsFound: 0,
          totalScore: 0,
          bestTime: 0,
          favortieDifficulty: 'easy' as const,
          multiplayerWins: 0,
          multiplayerGames: 0,
        },
        unlockedThemes: user.unlockedThemes || [],
        unlockedAvatars: user.unlockedAvatars || [],
        completedLevels: user.completedLevels || [],
        powerUps: user.powerUps || {
          revealLetter: 0,
          revealWord: 0,
          timeFreeze: 0,
          highlightFirst: 0,
        },
        createdAt: user.createdAt || Date.now(),
      };

      // Try cooperative first, then competitive
      try {
        const gameId = await CooperativeGameService.joinGameByCode(roomCode.toUpperCase(), playerProfile);
        onCoopGameCreated(gameId, false);
      } catch {
        const gameId = await MultiplayerService.joinGameByCode(roomCode.toUpperCase(), playerProfile);
        onGameCreated(gameId, false);
      }
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de rejoindre la partie',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Multijoueur</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'competitive' && styles.activeTab]}
            onPress={() => setActiveTab('competitive')}
          >
            <Text style={[styles.tabText, activeTab === 'competitive' && styles.activeTabText]}>
              Compétitif
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'cooperative' && styles.activeTab]}
            onPress={() => setActiveTab('cooperative')}
          >
            <Text style={[styles.tabText, activeTab === 'cooperative' && styles.activeTabText]}>
              Coopératif
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'join' && styles.activeTab]}
            onPress={() => setActiveTab('join')}
          >
            <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>
              Rejoindre
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'competitive' ? (
            <View style={styles.createSection}>
              <Text style={styles.sectionTitle}>Créer une partie compétitive</Text>

              {/* Difficulty Selection */}
              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Difficulté</Text>
                <View style={styles.optionButtons}>
                  {difficultyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        selectedDifficulty === option.value && styles.optionButtonActive,
                      ]}
                      onPress={() => setSelectedDifficulty(option.value)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          selectedDifficulty === option.value && styles.optionButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                onPress={handleCreateGame}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={WORD_SEARCH_COLORS.textWhite} />
                ) : (
                  <Text style={styles.actionButtonText}>Créer la Partie</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.helpText}>
                Le premier à trouver tous les mots gagne !
              </Text>
            </View>
          ) : activeTab === 'cooperative' ? (
            <View style={styles.createSection}>
              <Text style={styles.sectionTitle}>Créer une partie coopérative</Text>

              {/* Difficulty Selection */}
              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Difficulté</Text>
                <View style={styles.optionButtons}>
                  {difficultyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        selectedDifficulty === option.value && styles.optionButtonActive,
                      ]}
                      onPress={() => setSelectedDifficulty(option.value)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          selectedDifficulty === option.value && styles.optionButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                onPress={handleCreateCoopGame}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={WORD_SEARCH_COLORS.textWhite} />
                ) : (
                  <Text style={styles.actionButtonText}>Créer la Partie Coopérative</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.helpText}>
                M deja konnen se mwen kap toujou genyen😂
              </Text>
            </View>
          ) : (
            <View style={styles.joinSection}>
              <Text style={styles.sectionTitle}>Rejoindre une partie</Text>

              <Text style={styles.inputLabel}>Code du salon</Text>
              <TextInput
                style={styles.input}
                value={roomCode}
                onChangeText={setRoomCode}
                placeholder="Entrer le code (ex: ABC123)"
                placeholderTextColor={WORD_SEARCH_COLORS.textSecondary}
                autoCapitalize="characters"
                maxLength={6}
              />

              <TouchableOpacity
                style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                onPress={handleJoinGame}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={WORD_SEARCH_COLORS.textWhite} />
                ) : (
                  <Text style={styles.actionButtonText}>Rejoindre</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.helpText}>
                Demande le code à ton partenaire qui a créé la partie
              </Text>
            </View>
          )}
        </View>
      </View>
      <CustomAlert
        visible={isVisible}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
        buttons={alertConfig?.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WORD_SEARCH_COLORS.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: WORD_SEARCH_COLORS.primary,
    fontWeight: '600',
  },
  title: {
    flex: 2,
    fontSize: 28,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  activeTabText: {
    color: WORD_SEARCH_COLORS.textWhite,
  },
  content: {
    flex: 1,
  },
  createSection: {
    flex: 1,
  },
  joinSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 24,
  },
  optionGroup: {
    marginBottom: 24,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 12,
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderWidth: 2,
    borderColor: WORD_SEARCH_COLORS.cardBg,
  },
  optionButtonActive: {
    backgroundColor: WORD_SEARCH_COLORS.primary + '20',
    borderColor: WORD_SEARCH_COLORS.primary,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  optionButtonTextActive: {
    color: WORD_SEARCH_COLORS.primary,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: WORD_SEARCH_COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
  helpText: {
    fontSize: 14,
    color: WORD_SEARCH_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MultiplayerMenuScreen;
