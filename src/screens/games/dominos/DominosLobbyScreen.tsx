import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { DominosService } from '../../../services/dominos/DominosService';
import { DominosGame } from '../../../types/dominos.types';
import { AvatarDisplay } from '../../../utils/avatarUtils';
import CustomAlert from '../../../components/common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface DominosLobbyScreenProps {
  route: {
    params: {
      gameId: string;
      playerId: string;
    };
  };
}

export const DominosLobbyScreen: React.FC<DominosLobbyScreenProps> = ({
  route,
}) => {
  const { gameId, playerId } = route.params;
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [game, setGame] = useState<DominosGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = DominosService.subscribeToGame(
      gameId,
      (updatedGame) => {
        setGame(updatedGame);
        setLoading(false);

        // Check if player is ready
        if (updatedGame.players) {
          const currentPlayer = updatedGame.players.find((p) => p.id === playerId);
          setIsReady(currentPlayer?.isReady || false);
        }

        // Navigate to game screen when game starts
        if (updatedGame.status === 'playing') {
          navigateToScreen('dominosGameLandscape' as any, { gameId, playerId });
        }
      },
      (error) => {
        console.error('Error loading dominos game:', error);
        setLoading(false);
        showAlert({
          title: 'Erreur',
          message: 'Impossible de charger la partie',
          type: 'error',
          buttons: [
            {
              text: 'Retour',
              style: 'cancel',
              onPress: () => navigateToScreen('dominosMenu' as any),
            },
          ],
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [gameId, playerId]);

  const handleShareCode = async () => {
    if (!game) return;

    try {
      await Share.share({
        message: `Rejoins-moi pour une partie de Dominos ! Code: ${game.roomCode}`,
      });
    } catch (error) {
      console.error('Error sharing room code:', error);
    }
  };

  const handleToggleReady = async () => {
    if (!game) return;

    try {
      await DominosService.setPlayerReady(gameId, playerId, !isReady);
    } catch (error: any) {
      console.error('Error toggling ready:', error);
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de changer le statut',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
    }
  };

  const handleStartGame = async () => {
    if (!game) return;

    try {
      await DominosService.startGame(gameId, playerId);
    } catch (error: any) {
      console.error('Error starting game:', error);
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de démarrer la partie',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
    }
  };

  const handleLeave = async () => {
    showAlert({
      title: 'Quitter la partie',
      message: 'Êtes-vous sûr de vouloir quitter ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await DominosService.leaveGame(gameId, playerId);
              navigateToScreen('dominosMenu' as any);
            } catch (error) {
              console.error('Error leaving game:', error);
            }
          },
        },
      ],
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ImageBackground
          source={getBackgroundSource(user)}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.blurryOverlay}>
            <ActivityIndicator size="large" color={currentTheme.romantic.primary} />
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ImageBackground
          source={getBackgroundSource(user)}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.blurryOverlay}>
            <Text style={styles.errorText}>Partie non trouvée</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigateToScreen('dominosMenu' as any)}
            >
              <Text style={styles.buttonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    );
  }

  const isHost = game.hostId === playerId;
  const currentPlayer = game.players?.find((p) => p.id === playerId);
  const otherPlayer = game.players?.find((p) => p.id !== playerId);
  const allReady = game.players?.length === 2 && game.players?.every((p) => p.isReady);
  const canStart = isHost && allReady;

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
            <TouchableOpacity style={styles.backButton} onPress={handleLeave}>
              <Foundation name="arrow-left" size={24} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Salle d'attente</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Room Code */}
            <View style={styles.roomCodeContainer}>
              <Text style={styles.roomCodeLabel}>Code de la salle</Text>
              <View style={styles.roomCodeBox}>
                <Text style={styles.roomCode}>{game.roomCode}</Text>
                <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
                  <Foundation name="share" size={24} color={currentTheme.romantic.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Players */}
            <View style={styles.playersContainer}>
              <Text style={styles.sectionTitle}>Joueurs ({game.players?.length || 0}/2)</Text>

              {/* Current Player */}
              {currentPlayer && (
                <View style={styles.playerCard}>
                  <View style={styles.playerInfo}>
                    <View style={styles.playerAvatar}>
                      <AvatarDisplay
                        avatar={currentPlayer.profile.avatar}
                        imageStyle={styles.playerAvatarImage}
                        textStyle={styles.playerAvatarEmoji}
                      />
                    </View>
                    <View style={styles.playerDetails}>
                      <Text style={styles.playerName}>
                        {currentPlayer.profile.name} (Vous)
                      </Text>
                      {isHost && (
                        <Text style={styles.hostBadge}>👑 Hôte</Text>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.readyBadge,
                      currentPlayer.isReady && styles.readyBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.readyText,
                        currentPlayer.isReady && styles.readyTextActive,
                      ]}
                    >
                      {currentPlayer.isReady ? '✓ Prêt' : 'En attente'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Other Player or Waiting */}
              {otherPlayer ? (
                <View style={styles.playerCard}>
                  <View style={styles.playerInfo}>
                    <View style={styles.playerAvatar}>
                      <AvatarDisplay
                        avatar={otherPlayer.profile.avatar}
                        imageStyle={styles.playerAvatarImage}
                        textStyle={styles.playerAvatarEmoji}
                      />
                    </View>
                    <View style={styles.playerDetails}>
                      <Text style={styles.playerName}>{otherPlayer.profile.name}</Text>
                      {game.hostId === otherPlayer.id && (
                        <Text style={styles.hostBadge}>👑 Hôte</Text>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.readyBadge,
                      otherPlayer.isReady && styles.readyBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.readyText,
                        otherPlayer.isReady && styles.readyTextActive,
                      ]}
                    >
                      {otherPlayer.isReady ? '✓ Prêt' : 'En attente'}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.waitingCard}>
                  <ActivityIndicator
                    size="small"
                    color={currentTheme.text.secondary}
                  />
                  <Text style={styles.waitingText}>
                    En attente d'un adversaire...
                  </Text>
                </View>
              )}
            </View>

            {/* Game Rules */}
            <View style={styles.rulesContainer}>
              <Text style={styles.rulesTitle}>📖 Règles du jeu</Text>
              <Text style={styles.rulesText}>
                • 7 tuiles par joueur au début{'\n'}
                • Placer les tuiles bout à bout{'\n'}
                • Les numéros doivent correspondre{'\n'}
                • Premier à poser toutes ses tuiles gagne{'\n'}
                • Si blocage : moins de points gagne
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomContainer}>
            {/* Ready Button */}
            <TouchableOpacity
              style={[
                styles.readyButton,
                isReady && styles.readyButtonActive,
              ]}
              onPress={handleToggleReady}
            >
              <Text style={styles.readyButtonText}>
                {isReady ? '✓ Prêt' : 'Je suis prêt'}
              </Text>
            </TouchableOpacity>

            {/* Start Button (Host Only) */}
            {isHost && (
              <TouchableOpacity
                style={[
                  styles.startButton,
                  !canStart && styles.startButtonDisabled,
                ]}
                onPress={handleStartGame}
                disabled={!canStart}
              >
                <Text style={styles.startButtonText}>Démarrer la partie</Text>
              </TouchableOpacity>
            )}

            {!isHost && game.players.length === 2 && (
              <Text style={styles.waitingForHostText}>
                En attente de l'hôte...
              </Text>
            )}
          </View>
        </View>
      </ImageBackground>

      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
          theme={currentTheme}
        />
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
    },
    backgroundImage: {
      flex: 1,
      width: width,
      height: height,
    },
    blurryOverlay: {
      flex: 1,
      backgroundColor: theme.background.overlay,
      paddingTop: 60,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.interactive.active,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    roomCodeContainer: {
      marginBottom: 30,
    },
    roomCodeLabel: {
      fontSize: 14,
      color: theme.text.secondary,
      marginBottom: 8,
      textAlign: 'center',
    },
    roomCodeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: theme.romantic.primary,
    },
    roomCode: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text.primary,
      letterSpacing: 8,
    },
    shareButton: {
      marginLeft: 16,
      padding: 8,
    },
    playersContainer: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 16,
    },
    playerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    playerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    playerAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playerAvatarEmoji: {
      fontSize: 28,
    },
    playerAvatarImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    playerDetails: {
      marginLeft: 12,
      flex: 1,
    },
    playerName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
    },
    hostBadge: {
      fontSize: 12,
      color: theme.romantic.primary,
      marginTop: 4,
    },
    readyBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    readyBadgeActive: {
      backgroundColor: 'rgba(76, 217, 100, 0.2)',
      borderColor: '#4CD964',
    },
    readyText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.secondary,
    },
    readyTextActive: {
      color: '#4CD964',
    },
    waitingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
      padding: 20,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    waitingText: {
      fontSize: 14,
      color: theme.text.secondary,
      marginLeft: 12,
    },
    rulesContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      marginBottom: 20,
    },
    rulesTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 12,
    },
    rulesText: {
      fontSize: 14,
      color: theme.text.secondary,
      lineHeight: 22,
    },
    bottomContainer: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 12,
    },
    readyButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 18,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    readyButtonActive: {
      backgroundColor: 'rgba(76, 217, 100, 0.2)',
      borderColor: '#4CD964',
    },
    readyButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
    },
    startButton: {
      backgroundColor: theme.romantic.primary,
      borderRadius: 16,
      padding: 18,
      alignItems: 'center',
    },
    startButtonDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    startButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    waitingForHostText: {
      fontSize: 14,
      color: theme.text.secondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    errorText: {
      fontSize: 16,
      color: theme.text.primary,
      textAlign: 'center',
      marginBottom: 20,
    },
    button: {
      backgroundColor: theme.romantic.primary,
      borderRadius: 16,
      padding: 18,
      alignItems: 'center',
      marginHorizontal: 20,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  });

export default DominosLobbyScreen;
