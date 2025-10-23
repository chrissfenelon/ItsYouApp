import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import { QuizCoupleService } from '../../services/quiz/QuizCoupleService';
import { QuizCoupleMessagesService } from '../../services/quiz/QuizCoupleMessagesService';
import { QuizGame } from '../../types/quizCouple.types';
import { AvatarDisplay } from '../../utils/avatarUtils';
import { QUIZ_CATEGORIES } from '../../data/quiz/categories';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface QuizCoupleResultsScreenProps {
  route?: {
    params?: {
      gameId: string;
      playerId: string;
    };
  };
}

export const QuizCoupleResultsScreen: React.FC<QuizCoupleResultsScreenProps> = ({ route }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const { gameId, playerId } = route?.params || {};

  const [game, setGame] = useState<QuizGame | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const compatibilityAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadGameResults();
  }, [gameId]);

  const loadGameResults = async () => {
    if (!gameId) {
      showAlert({ title: 'Erreur', message: 'ID de partie manquant', type: 'error' });
      navigateToScreen('quizCouple');
      return;
    }

    const unsubscribe = QuizCoupleService.subscribeToGame(
      gameId,
      (updatedGame) => {
        setGame(updatedGame);
        setLoading(false);

        // Start animations
        if (updatedGame.status === 'finished') {
          startAnimations(updatedGame);
        }
      },
      (error) => {
        console.error('Error loading results:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  };

  const startAnimations = (gameData: QuizGame) => {
    const stats = QuizCoupleService.getGameStatistics(gameData);
    if (!stats) return;

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Compatibility gauge animation
    Animated.timing(compatibilityAnim, {
      toValue: stats.compatibilityScore,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Confetti animation based on compatibility score
    if (stats.compatibilityScore >= 70) {
      // Animation plus intense pour les scores élevés
      const duration = stats.compatibilityScore >= 90 ? 800 : 1200;

      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
        { iterations: stats.compatibilityScore >= 90 ? -1 : 3 } // Infini si 90+, sinon 3 fois
      ).start();
    }
  };

  const handlePlayAgain = () => {
    navigateToScreen('quizCouple');
  };

  const handleViewAnswers = () => {
    navigateToScreen('quizCoupleAnswers', { gameId, playerId });
  };

  if (loading || !game) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement des résultats...</Text>
      </View>
    );
  }

  const stats = QuizCoupleService.getGameStatistics(game);
  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Erreur de chargement</Text>
      </View>
    );
  }

  const player1 = game.players[0];
  const player2 = game.players[1];
  const currentPlayer = game.players.find(p => p.id === playerId);
  const otherPlayer = game.players.find(p => p.id !== playerId);

  // Determine winner
  let winner = null;
  if (player1.score > player2.score) {
    winner = player1;
  } else if (player2.score > player1.score) {
    winner = player2;
  }

  const isWinner = winner && winner.id === playerId;
  const isDraw = !winner;

  // Get victory/defeat message
  let resultMessage;
  if (isDraw) {
    resultMessage = QuizCoupleMessagesService.getDrawMessage(
      player1.profile.name,
      player2.profile.name,
      stats.compatibilityScore,
      user
    );
  } else if (isWinner) {
    resultMessage = QuizCoupleMessagesService.getWinnerMessage(
      currentPlayer!.profile.name,
      otherPlayer!.profile.name,
      stats.compatibilityScore,
      user
    );
  } else {
    resultMessage = QuizCoupleMessagesService.getLoserMessage(
      currentPlayer!.profile.name,
      otherPlayer!.profile.name,
      stats.compatibilityScore,
      user
    );
  }

  // Get compatibility message
  const compatibilityMessage = QuizCoupleMessagesService.getCompatibilityMessage(
    stats.compatibilityScore,
    !!user?.partnerId
  );

  // Get compatibility color
  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 80) return '#8BC34A';
    if (score >= 70) return '#FFC107';
    if (score >= 60) return '#FF9800';
    if (score >= 50) return '#FF5722';
    return '#F44336';
  };

  const compatibilityColor = getCompatibilityColor(stats.compatibilityScore);

  // Interpolate gauge rotation
  const gaugeRotation = compatibilityAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['-90deg', '90deg'],
  });

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
            <TouchableOpacity style={styles.backButton} onPress={() => navigateToScreen('quizCouple')}>
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Résultats</Text>

            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Confetti Animation - Different emojis based on score */}
            {stats.compatibilityScore >= 70 && (
              <Animated.View
                style={[
                  styles.confettiContainer,
                  {
                    opacity: confettiAnim,
                  },
                ]}
              >
                {stats.compatibilityScore >= 90 ? (
                  // Score parfait: Coeurs et feux d'artifice
                  <>
                    <Text style={styles.confetti}>💕</Text>
                    <Text style={styles.confetti}>🎉</Text>
                    <Text style={styles.confetti}>✨</Text>
                    <Text style={styles.confetti}>💖</Text>
                    <Text style={styles.confetti}>🎊</Text>
                    <Text style={styles.confetti}>💝</Text>
                  </>
                ) : stats.compatibilityScore >= 80 ? (
                  // Bon score: Coeurs et étoiles
                  <>
                    <Text style={styles.confetti}>💕</Text>
                    <Text style={styles.confetti}>⭐</Text>
                    <Text style={styles.confetti}>💖</Text>
                    <Text style={styles.confetti}>✨</Text>
                    <Text style={styles.confetti}>💝</Text>
                    <Text style={styles.confetti}>⭐</Text>
                  </>
                ) : (
                  // Score moyen: Coeurs simples
                  <>
                    <Text style={styles.confetti}>💕</Text>
                    <Text style={styles.confetti}>💖</Text>
                    <Text style={styles.confetti}>💝</Text>
                    <Text style={styles.confetti}>💕</Text>
                    <Text style={styles.confetti}>💖</Text>
                    <Text style={styles.confetti}>💝</Text>
                  </>
                )}
              </Animated.View>
            )}

            {/* Result Message */}
            <Animated.View style={[styles.resultMessageCard, { opacity: fadeAnim }]}>
              <Text style={styles.resultEmoji}>{resultMessage.emoji}</Text>
              <Text style={styles.resultTitle}>{resultMessage.title}</Text>
              <Text style={styles.resultMessage}>{resultMessage.message}</Text>
            </Animated.View>

            {/* Compatibility Score */}
            <Animated.View style={[styles.compatibilityCard, { opacity: fadeAnim }]}>
              <Text style={styles.compatibilityTitle}>Score de Compatibilité</Text>

              {/* Circular Gauge */}
              <View style={styles.gaugeContainer}>
                <View style={styles.gaugeBg}>
                  <View style={styles.gaugeHalf} />
                </View>
                <Animated.View
                  style={[
                    styles.gaugeNeedle,
                    {
                      backgroundColor: compatibilityColor,
                      transform: [{ rotate: gaugeRotation }],
                    },
                  ]}
                />
                <View style={styles.gaugeCenter}>
                  <Animated.Text style={[styles.compatibilityPercentage, { color: compatibilityColor }]}>
                    {compatibilityAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0', '100'],
                    })}%
                  </Animated.Text>
                </View>
              </View>

              <View style={styles.compatibilityMessageContainer}>
                <Text style={styles.compatibilityMessageEmoji}>{compatibilityMessage.emoji}</Text>
                <Text style={styles.compatibilityMessageTitle}>{compatibilityMessage.title}</Text>
                <Text style={styles.compatibilityMessageText}>{compatibilityMessage.message}</Text>
              </View>
            </Animated.View>

            {/* Players Scores */}
            <Animated.View style={[styles.playersScoresCard, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Scores</Text>

              <View style={styles.playersScores}>
                {game.players.map((player) => {
                  const isPlayerWinner = winner && winner.id === player.id;
                  const isPlayerDraw = !winner;

                  return (
                    <View
                      key={player.id}
                      style={[
                        styles.playerScoreCard,
                        isPlayerWinner && styles.playerScoreCardWinner,
                      ]}
                    >
                      {isPlayerWinner && (
                        <View style={styles.crownBadge}>
                          <Foundation name="crown" size={20} color="#FFD700" />
                        </View>
                      )}

                      <View style={styles.playerScoreAvatar}>
                        <AvatarDisplay
                          avatar={player.profile.avatar}
                          imageStyle={styles.playerAvatarImage}
                          textStyle={styles.playerAvatarEmoji}
                        />
                      </View>

                      <Text style={styles.playerScoreName}>{player.profile.name}</Text>

                      <View style={styles.scoreRow}>
                        <View style={styles.scoreItem}>
                          <Text style={styles.scoreValue}>{player.score}</Text>
                          <Text style={styles.scoreLabel}>Points</Text>
                        </View>

                        <View style={styles.scoreDivider} />

                        <View style={styles.scoreItem}>
                          <Text style={styles.scoreValue}>{player.correctAnswersCount}</Text>
                          <Text style={styles.scoreLabel}>Identiques</Text>
                        </View>

                        <View style={styles.scoreDivider} />

                        <View style={styles.scoreItem}>
                          <Text style={styles.scoreValue}>{player.averageTime.toFixed(1)}s</Text>
                          <Text style={styles.scoreLabel}>Temps moy.</Text>
                        </View>
                      </View>

                      {isPlayerDraw && (
                        <View style={styles.drawBadge}>
                          <Text style={styles.drawBadgeText}>Égalité</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Category Breakdown */}
            <Animated.View style={[styles.categoryCard, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Compatibilité par Catégorie</Text>

              <View style={styles.categoriesContainer}>
                {Object.entries(stats.categoryCompatibility).map(([categoryId, percentage]) => {
                  const category = QUIZ_CATEGORIES.find(c => c.id === categoryId);
                  if (!category) return null;

                  const isBest = categoryId === stats.bestCategory;
                  const isWorst = categoryId === stats.worstCategory;

                  return (
                    <View key={categoryId} style={styles.categoryItem}>
                      <View style={styles.categoryHeader}>
                        <View style={styles.categoryInfo}>
                          <Foundation name={category.icon as any} size={20} color={category.color} />
                          <Text style={styles.categoryName}>{category.name}</Text>
                        </View>
                        <View style={styles.categoryBadges}>
                          {isBest && (
                            <View style={styles.bestBadge}>
                              <Foundation name="star" size={12} color="#FFD700" />
                              <Text style={styles.bestBadgeText}>Meilleur</Text>
                            </View>
                          )}
                          {isWorst && (
                            <View style={styles.worstBadge}>
                              <Foundation name="target" size={12} color="#FF5722" />
                              <Text style={styles.worstBadgeText}>À améliorer</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.categoryProgressContainer}>
                        <View
                          style={[
                            styles.categoryProgress,
                            {
                              width: `${percentage}%`,
                              backgroundColor: getCompatibilityColor(percentage),
                            },
                          ]}
                        />
                      </View>

                      <Text style={styles.categoryPercentage}>{percentage}%</Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View style={[styles.actionsContainer, { opacity: fadeAnim }]}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handlePlayAgain}
              >
                <Foundation name="refresh" size={24} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Rejouer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleViewAnswers}
              >
                <Foundation name="list" size={24} color={currentTheme.text.primary} />
                <Text style={styles.secondaryButtonText}>Voir les réponses</Text>
              </TouchableOpacity>
            </Animated.View>
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
    headerTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.text.primary,
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
    confettiContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      zIndex: 10,
    },
    confetti: {
      fontSize: 40,
    },
    resultMessageCard: {
      backgroundColor: 'rgba(30, 30, 30, 0.95)',
      borderRadius: 24,
      borderWidth: 2,
      borderColor: theme.romantic.primary,
      padding: 30,
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
      shadowColor: theme.romantic.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 15,
    },
    resultEmoji: {
      fontSize: 80,
    },
    resultTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.romantic.primary,
      textAlign: 'center',
    },
    resultMessage: {
      fontSize: 18,
      color: theme.text.primary,
      textAlign: 'center',
      lineHeight: 26,
    },
    compatibilityCard: {
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      padding: 30,
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: 'rgba(255, 105, 180, 0.3)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
      elevation: 10,
    },
    compatibilityTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 30,
    },
    gaugeContainer: {
      width: 220,
      height: 120,
      position: 'relative',
      marginBottom: 30,
    },
    gaugeBg: {
      width: 220,
      height: 110,
      borderTopLeftRadius: 110,
      borderTopRightRadius: 110,
      borderWidth: 15,
      borderBottomWidth: 0,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      overflow: 'hidden',
    },
    gaugeHalf: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '50%',
      backgroundColor: 'transparent',
    },
    gaugeNeedle: {
      position: 'absolute',
      bottom: 0,
      left: '50%',
      marginLeft: -4,
      width: 8,
      height: 90,
      borderRadius: 4,
      transformOrigin: 'bottom',
    },
    gaugeCenter: {
      position: 'absolute',
      bottom: -15,
      left: '50%',
      marginLeft: -50,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(30, 30, 30, 0.95)',
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    compatibilityPercentage: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    compatibilityMessageContainer: {
      alignItems: 'center',
      gap: 8,
    },
    compatibilityMessageEmoji: {
      fontSize: 48,
    },
    compatibilityMessageTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.romantic.primary,
      textAlign: 'center',
    },
    compatibilityMessageText: {
      fontSize: 16,
      color: theme.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    playersScoresCard: {
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      padding: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 20,
    },
    playersScores: {
      gap: 15,
    },
    playerScoreCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      padding: 20,
      alignItems: 'center',
      position: 'relative',
    },
    playerScoreCardWinner: {
      borderColor: '#FFD700',
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
    },
    crownBadge: {
      position: 'absolute',
      top: -12,
      right: 20,
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      borderRadius: 20,
      padding: 8,
      borderWidth: 2,
      borderColor: '#FFD700',
    },
    playerScoreAvatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    playerAvatarImage: {
      width: 70,
      height: 70,
      borderRadius: 35,
    },
    playerAvatarEmoji: {
      fontSize: 36,
    },
    playerScoreName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 16,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    scoreItem: {
      alignItems: 'center',
    },
    scoreValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.romantic.primary,
      marginBottom: 4,
    },
    scoreLabel: {
      fontSize: 12,
      color: theme.text.secondary,
    },
    scoreDivider: {
      width: 1,
      height: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    drawBadge: {
      marginTop: 12,
      backgroundColor: 'rgba(76, 175, 80, 0.2)',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: '#4CAF50',
    },
    drawBadgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4CAF50',
    },
    categoryCard: {
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      padding: 20,
      marginBottom: 20,
    },
    categoriesContainer: {
      gap: 20,
    },
    categoryItem: {
      gap: 8,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
    },
    categoryBadges: {
      flexDirection: 'row',
      gap: 8,
    },
    bestBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
    },
    bestBadgeText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#FFD700',
    },
    worstBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 87, 34, 0.2)',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
    },
    worstBadgeText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#FF5722',
    },
    categoryProgressContainer: {
      height: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 6,
      overflow: 'hidden',
    },
    categoryProgress: {
      height: '100%',
      borderRadius: 6,
    },
    categoryPercentage: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.text.secondary,
      textAlign: 'right',
    },
    actionsContainer: {
      gap: 12,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.romantic.primary,
      borderRadius: 16,
      padding: 18,
      gap: 10,
      shadowColor: theme.romantic.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    primaryButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      padding: 18,
      gap: 10,
    },
    secondaryButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
    },
  });

export default QuizCoupleResultsScreen;
