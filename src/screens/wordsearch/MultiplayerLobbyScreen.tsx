import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { WORD_SEARCH_COLORS } from '../../data/constants/colors';
import { MultiplayerGame, PlayerProfile, Difficulty } from '../../types/wordSearch.types';
import { MultiplayerService } from '../../services/multiplayer/MultiplayerService';
import { WordSearchGenerator } from '../../services/wordsearch/WordSearchGenerator';
import { DIFFICULTY_CONFIGS } from '../../data/constants/gameRules';
import { WORD_THEMES } from '../../data/themes';
import { AvatarDisplay } from '../../utils/avatarUtils';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useApp } from '../../context/AppContext';

interface MultiplayerLobbyScreenProps {
  gameId: string | null;
  playerProfile: PlayerProfile;
  isHost: boolean;
  onStartGame: (game: MultiplayerGame) => void;
  onBack: () => void;
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
  expert: 'Expert',
};

const MultiplayerLobbyScreen: React.FC<MultiplayerLobbyScreenProps> = ({
  gameId,
  playerProfile,
  isHost,
  onStartGame,
  onBack,
}) => {
  const { user } = useApp(); // Get Firebase Auth user ID
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [game, setGame] = useState<MultiplayerGame | null>(null);
  const [isReady, setIsReady] = useState(isHost);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    // S'abonner aux mises à jour du lobby
    const unsubscribe = MultiplayerService.subscribeToGame(
      gameId,
      (updatedGame) => {
        setGame(updatedGame);
        setLoading(false);

        // Si le jeu démarre, naviguer vers l'écran de jeu
        if (updatedGame.status === 'playing') {
          onStartGame(updatedGame);
        }
      },
      (error) => {
        console.error('Erreur lors de la souscription au jeu:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameId, onStartGame]);

  const handleToggleReady = async () => {
    if (!gameId || !game || !user) return;

    const newReadyState = !isReady;
    setIsReady(newReadyState);

    try {
      // Use Firebase Auth user ID (not local profile ID)
      console.log('🎯 Setting player ready:', { userId: user.id, gameId, isReady: newReadyState });
      await MultiplayerService.setPlayerReady(gameId, user.id, newReadyState);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut prêt:', error);
      setIsReady(!newReadyState); // Revert on error
    }
  };

  const handleStartGame = async () => {
    if (!gameId || !game || !isHost) return;

    // Vérifier que tous les joueurs sont prêts
    const allReady = game.players.every(p => p.isReady);
    if (!allReady) {
      showAlert({
        title: 'Attention',
        message: 'Tous les joueurs doivent être prêts !',
        type: 'warning',
      });
      return;
    }

    if (game.players.length < 2) {
      showAlert({
        title: 'Attention',
        message: 'Il faut au moins 2 joueurs pour commencer !',
        type: 'warning',
      });
      return;
    }

    try {
      // Générer la grille de jeu
      const theme = WORD_THEMES.find(t => t.id === game.theme || t.name === game.theme);
      if (!theme) {
        showAlert({
          title: 'Erreur',
          message: 'Thème introuvable',
          type: 'error',
        });
        return;
      }

      const config = DIFFICULTY_CONFIGS[game.difficulty];
      const generator = new WordSearchGenerator(config.gridSize);
      const grid = generator.generateGrid(theme.words, config, []);

      // Démarrer la partie avec la grille générée
      await MultiplayerService.startGame(gameId, grid);
    } catch (error) {
      console.error('Erreur lors du démarrage de la partie:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de démarrer la partie',
        type: 'error',
      });
    }
  };

  const handleLeaveLobby = async () => {
    if (!gameId) {
      onBack();
      return;
    }

    if (!user) {
      onBack();
      return;
    }

    try {
      // Use Firebase Auth user ID (not local profile ID)
      await MultiplayerService.leaveLobby(gameId, user.id);
      onBack();
    } catch (error) {
      console.error('Erreur lors de la sortie du lobby:', error);
      onBack();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={WORD_SEARCH_COLORS.primary} />
        <Text style={styles.loadingText}>Connexion au lobby...</Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lobby introuvable</Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hostPlayer = game.players.find(p => p.id === game.hostId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleLeaveLobby}>
            <Text style={styles.backButtonText}>← Quitter</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Salon d'Attente</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Game Info */}
        <View style={styles.gameInfoCard}>
          {game.roomCode && (
            <View style={styles.roomCodeSection}>
              <Text style={styles.roomCodeLabel}>Code du salon</Text>
              <Text style={styles.roomCodeText}>{game.roomCode}</Text>
              <Text style={styles.roomCodeHint}>Partage ce code avec ton amour !</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hôte:</Text>
            <Text style={styles.infoValue}>{hostPlayer?.profile.name || 'Inconnu'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Difficulté:</Text>
            <Text style={styles.infoValue}>{difficultyLabels[game.difficulty]}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thème:</Text>
            <Text style={styles.infoValue}>{game.theme}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Joueurs:</Text>
            <Text style={styles.infoValue}>
              {game.players.length} / {game.maxPlayers}
            </Text>
          </View>
        </View>

        {/* Players List */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>Joueurs</Text>
          <ScrollView style={styles.playersList} contentContainerStyle={styles.playersListContent}>
            {game.players.map((player) => (
              <View key={player.id} style={styles.playerCard}>
                <View style={styles.playerAvatar}>
                  <AvatarDisplay
                    avatar={player.profile.avatar}
                    photoURL={player.profile.photoURL}
                    imageStyle={styles.playerAvatarImage}
                    textStyle={styles.playerAvatarText}
                  />
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.profile.name}</Text>
                  <Text style={styles.playerLevel}>Niveau {player.profile.level}</Text>
                </View>
                <View style={styles.playerStatus}>
                  {player.id === game.hostId && (
                    <Text style={styles.hostBadge}>👑 Hôte</Text>
                  )}
                  {player.isReady ? (
                    <Text style={styles.readyBadge}>✓ Prêt</Text>
                  ) : (
                    <Text style={styles.notReadyBadge}>⏱️ En attente</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Ready/Start Button */}
        <View style={styles.footer}>
          {isHost ? (
            <TouchableOpacity
              style={[
                styles.startButton,
                game.players.every(p => p.isReady) && game.players.length >= 2
                  ? styles.startButtonActive
                  : styles.startButtonDisabled,
              ]}
              onPress={handleStartGame}
              disabled={!game.players.every(p => p.isReady) || game.players.length < 2}
            >
              <Text style={styles.startButtonText}>
                {game.players.every(p => p.isReady) && game.players.length >= 2
                  ? '🎮 Démarrer la Partie'
                  : '⏳ En attente des joueurs...'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.readyButton, isReady && styles.readyButtonActive]}
              onPress={handleToggleReady}
            >
              <Text style={styles.readyButtonText}>
                {isReady ? '✓ Prêt' : 'Appuie pour être prêt'}
              </Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
  },
  gameInfoCard: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomCodeSection: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: WORD_SEARCH_COLORS.primary + '15',
    borderRadius: 12,
    marginBottom: 16,
  },
  roomCodeLabel: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 4,
  },
  roomCodeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.primary,
    letterSpacing: 4,
    marginBottom: 4,
  },
  roomCodeHint: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  playersSection: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 12,
  },
  playersList: {
    flex: 1,
  },
  playersListContent: {
    gap: 10,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: WORD_SEARCH_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  playerAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  playerAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  playerLevel: {
    fontSize: 14,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  playerStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  hostBadge: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.accent,
    fontWeight: '600',
  },
  readyBadge: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  notReadyBadge: {
    fontSize: 14,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  footer: {
    marginTop: 'auto',
  },
  readyButton: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderWidth: 3,
    borderColor: WORD_SEARCH_COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  readyButtonActive: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
  },
  readyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  startButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  startButtonActive: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
  },
  startButtonDisabled: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderWidth: 2,
    borderColor: WORD_SEARCH_COLORS.textSecondary,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
  button: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textWhite,
  },
});

export default MultiplayerLobbyScreen;
