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
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import { QuizCoupleService } from '../../services/quiz/QuizCoupleService';
import { QuizGame } from '../../types/quizCouple.types';
import { AvatarDisplay } from '../../utils/avatarUtils';
import SoundService from '../../services/SoundService';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

export const QuizCoupleLobbyScreen: React.FC<any> = ({ route }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const { gameId, playerId } = route?.params || {};

  const [game, setGame] = useState<QuizGame | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameId || !playerId) {
      showAlert({ title: 'Erreur', message: 'Informations de partie manquantes', type: 'error' });
      navigateToScreen('quizCouple');
      return;
    }

    // S'abonner aux changements du jeu
    const unsubscribe = QuizCoupleService.subscribeToGame(
      gameId,
      (updatedGame) => {
        setGame(updatedGame);

        // Si le jeu commence, naviguer vers l'écran de jeu approprié
        if (updatedGame.status === 'playing') {
          if (updatedGame.gameMode === 'custom') {
            navigateToScreen('quizCoupleCustom', { gameId, playerId });
          } else {
            navigateToScreen('quizCoupleGame', { gameId, playerId });
          }
        }
      },
      (error) => {
        console.error('Error subscribing to game:', error);
        showAlert({ title: 'Erreur', message: 'Impossible de se connecter à la partie', type: 'error' });
      }
    );

    return () => unsubscribe();
  }, [gameId, playerId]);

  const handleReady = async () => {
    if (!game) return;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return;

    // Play button click sound
    SoundService.playButtonClick();

    setLoading(true);
    try {
      await QuizCoupleService.setPlayerReady(gameId, playerId, !player.isReady);
      // Play success sound when ready
      if (!player.isReady) {
        SoundService.playCorrectAnswer();
      }
    } catch (error) {
      console.error('Error setting ready status:', error);
      SoundService.playWrongAnswer();
      showAlert({ title: 'Erreur', message: 'Impossible de mettre à jour le statut', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!game || game.hostId !== playerId) return;

    // Play button click sound
    SoundService.playButtonClick();

    setLoading(true);
    try {
      await QuizCoupleService.startGame(gameId, playerId);
      // Success sound will be played by the game screen
    } catch (error: any) {
      console.error('Error starting game:', error);
      SoundService.playWrongAnswer();
      showAlert({ title: 'Erreur', message: error.message || 'Impossible de démarrer la partie', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    SoundService.playButtonClick();

    showAlert({
      title: 'Quitter',
      message: 'Voulez-vous vraiment quitter la partie ?',
      type: 'warning',
      buttons: [
        {
          text: 'Annuler',
          onPress: () => {
            SoundService.playButtonClick();
            hideAlert();
          },
        },
        {
          text: 'Quitter',
          onPress: async () => {
            try {
              SoundService.playButtonClick();
              await QuizCoupleService.leaveGame(gameId, playerId);
              navigateToScreen('quizCouple');
            } catch (error) {
              console.error('Error leaving game:', error);
              SoundService.playWrongAnswer();
            }
          },
        },
      ],
    });
  };

  if (!game || !game.players) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const isHost = game.hostId === playerId;
  const currentPlayer = game.players?.find((p) => p.id === playerId);
  const canStart = game.players?.length === 2 && game.players?.every((p) => p.isReady);

  const gameModeInfo = {
    competitive: {
      name: 'Compétitif',
      icon: 'trophy',
      color: '#FFD700',
      description: 'Répondez aux mêmes questions',
    },
    prediction: {
      name: 'Prédiction',
      icon: 'heart',
      color: '#FF69B4',
      description: 'Devinez les réponses du partenaire',
    },
    custom: {
      name: 'Personnalisé',
      icon: 'pencil',
      color: '#9C27B0',
      description: 'Créez vos propres questions',
    },
  };

  const modeInfo = gameModeInfo[game.gameMode];

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
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Salle d'Attente</Text>

            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Room Code */}
            <View style={styles.roomCodeContainer}>
              <Text style={styles.roomCodeLabel}>Code de Salle</Text>
              <View style={styles.roomCodeBox}>
                <Text style={styles.roomCode}>{game.roomCode}</Text>
              </View>
              <Text style={styles.roomCodeHint}>Partagez ce code avec votre partenaire</Text>
            </View>

            {/* Game Mode */}
            <View style={[styles.modeContainer, { borderColor: modeInfo.color }]}>
              <Foundation name={modeInfo.icon as any} size={40} color={modeInfo.color} />
              <View style={styles.modeInfo}>
                <Text style={styles.modeName}>Mode {modeInfo.name}</Text>
                <Text style={styles.modeDescription}>{modeInfo.description}</Text>
              </View>
            </View>

            {/* Players */}
            <View style={styles.playersContainer}>
              <Text style={styles.sectionTitle}>Joueurs ({game.players?.length || 0}/2)</Text>

              {game.players?.map((player) => (
                <View key={player.id} style={styles.playerCard}>
                  <View style={styles.playerAvatar}>
                    <AvatarDisplay
                      avatar={player.profile.avatar}
                      photoURL={player.profile.photoURL}
                      imageStyle={styles.playerAvatarImage}
                      textStyle={styles.playerAvatarEmoji}
                    />
                  </View>

                  <View style={styles.playerInfo}>
                    <View style={styles.playerNameRow}>
                      <Text style={styles.playerName}>{player.profile.name}</Text>
                      {player.id === game.hostId && (
                        <View style={styles.hostBadge}>
                          <Foundation name="crown" size={14} color="#FFD700" />
                          <Text style={styles.hostText}>Hôte</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.readyContainer}>
                      {player.isReady ? (
                        <>
                          <Foundation name="check" size={16} color="#4CAF50" />
                          <Text style={[styles.readyText, { color: '#4CAF50' }]}>Prêt</Text>
                        </>
                      ) : (
                        <>
                          <Foundation name="clock" size={16} color="#FFA726" />
                          <Text style={[styles.readyText, { color: '#FFA726' }]}>En attente</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              ))}

              {/* Empty Slot */}
              {(game.players?.length || 0) < 2 && (
                <View style={[styles.playerCard, styles.emptySlot]}>
                  <View style={styles.emptySlotContent}>
                    <Foundation name="plus" size={32} color={currentTheme.text.secondary} />
                    <Text style={styles.emptySlotText}>En attente d'un joueur...</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {/* Ready Button */}
              <TouchableOpacity
                style={[
                  styles.readyButton,
                  currentPlayer?.isReady && styles.readyButtonActive,
                ]}
                onPress={handleReady}
                disabled={loading}
              >
                <Foundation
                  name={currentPlayer?.isReady ? 'x' : 'check'}
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.readyButtonText}>
                  {currentPlayer?.isReady ? 'Annuler' : 'Je suis prêt'}
                </Text>
              </TouchableOpacity>

              {/* Start Button (Host Only) */}
              {isHost && (
                <TouchableOpacity
                  style={[styles.startButton, !canStart && styles.startButtonDisabled]}
                  onPress={handleStart}
                  disabled={!canStart || loading}
                >
                  <Foundation name="play" size={24} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>
                    {canStart ? 'Démarrer la Partie' : 'En attente...'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background.primary,
    },
    loadingText: {
      fontSize: 18,
      color: theme.text.primary,
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
      fontWeight: '600',
      color: theme.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    placeholder: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    roomCodeContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    roomCodeLabel: {
      fontSize: 16,
      color: theme.text.secondary,
      marginBottom: 12,
    },
    roomCodeBox: {
      backgroundColor: 'transparent',
      borderWidth: 3,
      borderColor: theme.romantic.primary,
      borderRadius: 16,
      paddingHorizontal: 32,
      paddingVertical: 16,
      marginBottom: 8,
    },
    roomCode: {
      fontSize: 36,
      fontWeight: 'bold',
      color: theme.text.primary,
      letterSpacing: 8,
    },
    roomCodeHint: {
      fontSize: 14,
      color: theme.text.secondary,
      textAlign: 'center',
    },
    modeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderRadius: 16,
      padding: 16,
      marginBottom: 30,
      gap: 16,
    },
    modeInfo: {
      flex: 1,
    },
    modeName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 4,
    },
    modeDescription: {
      fontSize: 14,
      color: theme.text.secondary,
    },
    playersContainer: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 16,
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
    playerAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    playerAvatarEmoji: {
      fontSize: 32,
    },
    playerAvatarImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    playerInfo: {
      flex: 1,
    },
    playerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    playerName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
    },
    hostBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 4,
    },
    hostText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFD700',
    },
    readyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    readyText: {
      fontSize: 14,
      fontWeight: '600',
    },
    emptySlot: {
      backgroundColor: 'transparent',
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 92,
    },
    emptySlotContent: {
      alignItems: 'center',
      gap: 8,
    },
    emptySlotText: {
      fontSize: 14,
      color: theme.text.secondary,
    },
    actionsContainer: {
      gap: 12,
    },
    readyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.romantic.secondary,
      borderRadius: 12,
      padding: 16,
      gap: 8,
    },
    readyButtonActive: {
      backgroundColor: '#4CAF50',
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
      backgroundColor: theme.romantic.primary,
      borderRadius: 12,
      padding: 16,
      gap: 8,
    },
    startButtonDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    startButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  });

export default QuizCoupleLobbyScreen;
