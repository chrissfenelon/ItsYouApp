import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Share,
} from 'react-native';
import { CooperativeGame, CooperativePlayer } from '../../types/cooperativeGame.types';
import { PlayerProfile } from '../../types/wordSearch.types';
import { CooperativeGameService } from '../../services/multiplayer/CooperativeGameService';
import { WORD_SEARCH_COLORS } from '../../data/constants/colors';
import { AvatarDisplay } from '../../utils/avatarUtils';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useApp } from '../../context/AppContext';

interface CooperativeLobbyScreenProps {
  gameId: string | null;
  playerProfile: PlayerProfile;
  isHost: boolean;
  onStartGame: (game: CooperativeGame) => void;
  onBack: () => void;
}

const CooperativeLobbyScreen: React.FC<CooperativeLobbyScreenProps> = ({
  gameId,
  playerProfile,
  isHost,
  onStartGame,
  onBack,
}) => {
  const { user } = useApp(); // Get Firebase Auth user ID
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [game, setGame] = useState<CooperativeGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!gameId) {
      showAlert({
        title: 'Erreur',
        message: 'ID de partie invalide',
        type: 'error',
      });
      onBack();
      return;
    }

    // S'abonner aux changements de la partie
    const unsubscribe = CooperativeGameService.subscribeToGame(
      gameId,
      (updatedGame) => {
        setGame(updatedGame);
        setLoading(false);

        // Auto-start si le jeu commence
        if (updatedGame.status === 'playing') {
          onStartGame(updatedGame);
        }
      },
      (error) => {
        console.error('Erreur lors du chargement de la partie:', error);
        showAlert({
          title: 'Erreur',
          message: 'Impossible de charger la partie',
          type: 'error',
        });
        onBack();
      }
    );

    return () => unsubscribe();
  }, [gameId]);

  const handleToggleReady = async () => {
    if (!game || !gameId || !user) return;

    try {
      const newReadyState = !isReady;
      // Use Firebase Auth user ID (not local profile ID)
      console.log('🎯 Setting player ready (coop):', { userId: user.id, gameId, isReady: newReadyState });
      await CooperativeGameService.setPlayerReady(gameId, user.id, newReadyState);
      setIsReady(newReadyState);
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de changer le statut',
        type: 'error',
      });
    }
  };

  const handleStartGame = async () => {
    if (!game || !gameId || !user) return;

    try {
      // Use Firebase Auth user ID (not local profile ID)
      await CooperativeGameService.startGame(gameId, user.id);
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de démarrer la partie',
        type: 'error',
      });
    }
  };

  const handleShareCode = async () => {
    if (!game) return;

    try {
      await Share.share({
        message: `Rejoins ma partie de Mots Mêlés coopératif !\nCode: ${game.roomCode}\n\nUtilise ce code dans l'app ItsYouApp pour me rejoindre !`,
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const handleLeave = async () => {
    if (!gameId) return;

    if (!user) {
      onBack();
      return;
    }

    try {
      // Use Firebase Auth user ID (not local profile ID)
      await CooperativeGameService.leaveGame(gameId, user.id);
      onBack();
    } catch (error) {
      console.error('Erreur lors de la sortie:', error);
      onBack();
    }
  };

  if (loading || !game) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={WORD_SEARCH_COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const allReady = game.players.every(p => p.isReady);
  const canStart = isHost && game.players.length >= 2 && allReady;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLeave} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Quitter</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Lobby Coopératif</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Room Code */}
        <View style={styles.roomCodeContainer}>
          <Text style={styles.roomCodeLabel}>Code de la room:</Text>
          <Text style={styles.roomCode}>{game.roomCode}</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
            <Text style={styles.shareButtonText}>📤 Partager</Text>
          </TouchableOpacity>
        </View>

        {/* Game Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Thème:</Text>
            <Text style={styles.infoValue}>{game.themeId}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Difficulté:</Text>
            <Text style={styles.infoValue}>{game.difficulty}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Mots:</Text>
            <Text style={styles.infoValue}>{game.words.length}</Text>
          </View>
        </View>

        {/* Players List */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>
            Joueurs ({game.players.length}/{game.maxPlayers})
          </Text>
          <FlatList
            data={game.players}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const color = CooperativeGameService.getPlayerColor(item.id, game.players);
              return (
                <View style={[styles.playerCard, { borderLeftColor: color }]}>
                  <View style={styles.playerInfo}>
                    <AvatarDisplay
                      avatar={item.profile.avatar}
                      photoURL={item.profile.photoURL}
                      imageStyle={styles.playerAvatarImage}
                      textStyle={styles.playerAvatar}
                    />
                    <View style={styles.playerDetails}>
                      <Text style={styles.playerName}>
                        {item.profile.name}
                        {item.id === game.hostId && ' 👑'}
                      </Text>
                      <Text style={styles.playerLevel}>Niveau {item.profile.level}</Text>
                    </View>
                  </View>
                  <View style={[styles.readyBadge, item.isReady && styles.readyBadgeActive]}>
                    <Text style={[styles.readyText, item.isReady && styles.readyTextActive]}>
                      {item.isReady ? '✓ Prêt' : 'En attente...'}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!isHost && (
            <TouchableOpacity
              style={[styles.readyButton, isReady && styles.readyButtonActive]}
              onPress={handleToggleReady}
            >
              <Text style={[styles.readyButtonText, isReady && styles.readyButtonTextActive]}>
                {isReady ? '✓ Prêt' : 'Je suis prêt !'}
              </Text>
            </TouchableOpacity>
          )}

          {isHost && (
            <TouchableOpacity
              style={[styles.startButton, !canStart && styles.startButtonDisabled]}
              onPress={handleStartGame}
              disabled={!canStart}
            >
              <Text style={styles.startButtonText}>
                {canStart ? 'Démarrer la partie' : 'En attente des joueurs...'}
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
    marginTop: 10,
    fontSize: 16,
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: WORD_SEARCH_COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  placeholder: {
    width: 60,
  },
  roomCodeContainer: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  roomCodeLabel: {
    fontSize: 14,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 8,
  },
  roomCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.primary,
    letterSpacing: 4,
    marginBottom: 12,
  },
  shareButton: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 4,
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
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  playerAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: WORD_SEARCH_COLORS.background,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 4,
  },
  playerLevel: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  readyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: WORD_SEARCH_COLORS.background,
  },
  readyBadgeActive: {
    backgroundColor: WORD_SEARCH_COLORS.success + '20',
  },
  readyText: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    fontWeight: '600',
  },
  readyTextActive: {
    color: WORD_SEARCH_COLORS.success,
  },
  actions: {
    gap: 12,
  },
  readyButton: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: WORD_SEARCH_COLORS.primary,
  },
  readyButtonActive: {
    backgroundColor: WORD_SEARCH_COLORS.success,
    borderColor: WORD_SEARCH_COLORS.success,
  },
  readyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.primary,
  },
  readyButtonTextActive: {
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: WORD_SEARCH_COLORS.textSecondary,
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default CooperativeLobbyScreen;
