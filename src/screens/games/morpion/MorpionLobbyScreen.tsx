import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  ImageBackground,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CurrentTheme } from '../../../constants/Themes';
import FeedbackService from '../../../services/FeedbackService';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { MorpionService, MorpionGame } from '../../../services/MorpionService';
import { AvatarDisplay } from '../../../utils/avatarUtils';
import CustomAlert from '../../../components/common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

const { width } = Dimensions.get('window');

const MorpionLobbyScreen: React.FC<any> = ({ route, navigation }) => {
  const { gameId, boardSize, winCondition } = route.params || {};
  const { user } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [game, setGame] = useState<MorpionGame | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // S'abonner aux mises à jour du jeu
  useEffect(() => {
    if (!gameId || !user?.id) {
      navigation.goBack();
      return;
    }

    const unsubscribe = MorpionService.subscribeToGame(
      gameId,
      (updatedGame) => {
        setGame(updatedGame);
        setIsLoading(false);

        // Synchroniser l'état local isReady avec Firestore
        const currentPlayer = updatedGame.players.find(p => p.id === user.id);
        if (currentPlayer) {
          setIsReady(currentPlayer.isReady);
        }

        // Si le jeu commence, naviguer vers l'écran de jeu
        if (updatedGame.status === 'playing') {
          navigation.replace('morpionGame', {
            gameMode: 'online',
            gameId,
            playerId: user.id,
            boardSize: updatedGame.boardSize,
            winCondition: updatedGame.winCondition,
            players: updatedGame.players.map(p => ({
              id: p.id,
              name: p.profile.name,
              avatar: p.profile.avatar,
              symbol: p.symbol,
            })),
          });
        }
      },
      (error) => {
        console.error('Error subscribing to game:', error);
        showAlert({
          title: 'Erreur',
          message: 'Impossible de se connecter à la partie',
          type: 'error',
        });
      }
    );

    return () => unsubscribe();
  }, [gameId, user?.id]);

  const handleToggleReady = async () => {
    if (!game || !user?.id) return;

    try {
      const newReadyState = !isReady;
      setIsReady(newReadyState);
      await MorpionService.setPlayerReady(gameId, user.id, newReadyState);
      FeedbackService.success();
    } catch (error) {
      console.error('Error toggling ready:', error);
      setIsReady(!isReady);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de changer votre statut',
        type: 'error',
      });
    }
  };

  const handleStartGame = async () => {
    if (!game || !user?.id) return;

    try {
      await MorpionService.startGame(gameId, user.id);
      FeedbackService.success();
    } catch (error: any) {
      console.error('Error starting game:', error);
      showAlert({
        title: 'Impossible de démarrer',
        message: error.message || 'Une erreur est survenue',
        type: 'error',
      });
    }
  };

  const handleLeaveGame = () => {
    showAlert({
      title: 'Quitter la partie',
      message: 'Voulez-vous vraiment quitter cette partie ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.id) {
                await MorpionService.leaveGame(gameId, user.id);
              }
              navigation.goBack();
            } catch (error) {
              console.error('Error leaving game:', error);
            }
          },
        },
      ],
    });
  };

  const handleCopyRoomCode = () => {
    if (game?.roomCode) {
      FeedbackService.success();
      showAlert({
        title: 'Code copié',
        message: `Code de partie copié: ${game.roomCode}`,
        type: 'success',
      });
    }
  };

  if (isLoading || !game) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CurrentTheme.romantic.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const isHost = game.hostId === user?.id;
  const canStart = game.players.length === 2 && game.players.every(p => p.isReady);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.blurryOverlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleLeaveGame}>
              <View style={styles.backButtonBlur}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={CurrentTheme.text.primary}
                />
              </View>
            </TouchableOpacity>

            <Text style={styles.title}>Salon de jeu</Text>

            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Room Code Card */}
            <View style={styles.roomCodeCard}>
              <Text style={styles.roomCodeLabel}>Code de la partie</Text>
              <TouchableOpacity
                style={styles.roomCodeContainer}
                onPress={handleCopyRoomCode}
                activeOpacity={0.7}
              >
                <Text style={styles.roomCodeText}>{game.roomCode}</Text>
                <MaterialCommunityIcons
                  name="content-copy"
                  size={24}
                  color={CurrentTheme.romantic.primary}
                />
              </TouchableOpacity>
              <Text style={styles.roomCodeHint}>
                Partagez ce code avec Orlie
              </Text>
            </View>

            {/* Game Info Card */}
            <View style={styles.gameInfoCard}>
              <Text style={styles.sectionTitle}>Configuration</Text>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="grid" size={20} color={CurrentTheme.romantic.primary} />
                <Text style={styles.infoText}>Grille : {game.boardSize}x{game.boardSize}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="trophy" size={20} color={CurrentTheme.romantic.primary} />
                <Text style={styles.infoText}>Victoire : {game.winCondition} alignés</Text>
              </View>
            </View>

            {/* Players */}
            <View style={styles.playersContainer}>
              <Text style={styles.sectionTitle}>Joueurs (2/2)</Text>

              {/* Player 1 (X) */}
              {game.players[0] && (
                <View style={styles.playerCard}>
                  <View style={styles.playerAvatar}>
                    <AvatarDisplay
                      avatar={game.players[0].profile.avatar || { type: 'emoji', value: '👤' }}
                      photoURL={game.players[0].profile.photoURL}
                      imageStyle={styles.avatarImage}
                      textStyle={styles.avatarEmoji}
                    />
                  </View>

                  <View style={styles.playerInfo}>
                    <View style={styles.playerNameRow}>
                      <Text style={styles.playerName}>
                        {game.players[0].profile.name}
                      </Text>
                      {game.hostId === game.players[0].id && (
                        <View style={styles.hostBadge}>
                          <MaterialCommunityIcons name="crown" size={14} color="#FFD700" />
                          <Text style={styles.hostBadgeText}>Hôte</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.playerSymbol}>Symbole : {game.players[0].symbol}</Text>
                  </View>

                  {game.players[0].isReady && (
                    <View style={styles.readyBadge}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </View>
              )}

              {/* Player 2 (O) */}
              {game.players[1] ? (
                <View style={styles.playerCard}>
                  <View style={styles.playerAvatar}>
                    <AvatarDisplay
                      avatar={game.players[1].profile.avatar || { type: 'emoji', value: '👤' }}
                      photoURL={game.players[1].profile.photoURL}
                      imageStyle={styles.avatarImage}
                      textStyle={styles.avatarEmoji}
                    />
                  </View>

                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                      {game.players[1].profile.name}
                    </Text>
                    <Text style={styles.playerSymbol}>Symbole : {game.players[1].symbol}</Text>
                  </View>

                  {game.players[1].isReady && (
                    <View style={styles.readyBadge}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.playerCard, styles.emptyPlayerCard]}>
                  <ActivityIndicator size="small" color={CurrentTheme.romantic.primary} />
                  <Text style={styles.waitingText}>En attente d'un joueur...</Text>
                </View>
              )}
            </View>

            {/* Ready Button */}
            <TouchableOpacity
              style={[
                styles.readyButton,
                isReady && styles.readyButtonActive,
              ]}
              onPress={handleToggleReady}
              disabled={game.players.length < 2}
            >
              <MaterialCommunityIcons
                name={isReady ? 'check-circle' : 'circle-outline'}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.readyButtonText}>
                {isReady ? 'Prêt !' : 'Je suis prêt'}
              </Text>
            </TouchableOpacity>

            {/* Start Button (Host only) */}
            {isHost && (
              <TouchableOpacity
                style={[
                  styles.startButton,
                  !canStart && styles.startButtonDisabled,
                ]}
                onPress={handleStartGame}
                disabled={!canStart}
              >
                <MaterialCommunityIcons name="play" size={24} color="#FFFFFF" />
                <Text style={styles.startButtonText}>
                  {canStart ? 'Démarrer la partie' : 'En attente des joueurs...'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </ImageBackground>

      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
          onClose={hideAlert}
          theme={CurrentTheme}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CurrentTheme.background,
  },
  backgroundImage: {
    flex: 1,
    width: width,
  },
  blurryOverlay: {
    flex: 1,
    backgroundColor: CurrentTheme.glassmorphism.background,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CurrentTheme.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    color: CurrentTheme.text.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: CurrentTheme.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  roomCodeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
    alignItems: 'center',
  },
  roomCodeLabel: {
    fontSize: 14,
    color: CurrentTheme.text.secondary,
    marginBottom: 12,
  },
  roomCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  roomCodeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: CurrentTheme.text.primary,
    letterSpacing: 4,
  },
  roomCodeHint: {
    fontSize: 12,
    color: CurrentTheme.text.tertiary,
    textAlign: 'center',
  },
  gameInfoCard: {
    backgroundColor: 'rgba(255, 105, 180, 0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: CurrentTheme.text.primary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: CurrentTheme.text.primary,
  },
  playersContainer: {
    marginBottom: 24,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyPlayerCard: {
    justifyContent: 'center',
    gap: 12,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: CurrentTheme.text.primary,
  },
  playerSymbol: {
    fontSize: 14,
    color: CurrentTheme.text.secondary,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  hostBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  readyBadge: {
    marginLeft: 8,
  },
  waitingText: {
    fontSize: 16,
    color: CurrentTheme.text.secondary,
    textAlign: 'center',
  },
  readyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 12,
  },
  readyButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderColor: '#4CAF50',
  },
  readyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CurrentTheme.romantic.primary,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  startButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default MorpionLobbyScreen;
