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
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import { QuizCoupleService } from '../../services/quiz/QuizCoupleService';
import { QuizGame } from '../../types/quizCouple.types';
import { AvatarDisplay } from '../../utils/avatarUtils';

const { width, height } = Dimensions.get('window');

interface QuizResultsScreenProps {
  route: {
    params: {
      gameId: string;
      playerId: string;
    };
  };
}

export const QuizResultsScreen: React.FC<QuizResultsScreenProps> = ({ route }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);

  const { gameId, playerId } = route?.params || {};

  const [game, setGame] = useState<QuizGame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) {
      navigateToScreen('quizCouple');
      return;
    }

    const unsubscribe = QuizCoupleService.subscribeToGame(
      gameId,
      (updatedGame) => {
        setGame(updatedGame);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading results:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameId]);

  const handlePlayAgain = () => {
    navigateToScreen('quizCouple');
  };

  const handleBackToMenu = () => {
    navigateToScreen('gamesMenu');
  };

  if (loading || !game) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.romantic.primary} />
        <Text style={styles.loadingText}>Chargement des résultats...</Text>
      </View>
    );
  }

  const currentPlayer = game.players?.find((p) => p.id === playerId);
  const otherPlayer = game.players?.find((p) => p.id !== playerId);

  const winner = game.players?.reduce((prev, current) =>
    (current.score > (prev?.score || 0)) ? current : prev
  , game.players[0]);

  const isWinner = winner?.id === playerId;
  const isDraw = game.players?.[0]?.score === game.players?.[1]?.score;

  const currentPlayerCorrect = currentPlayer?.answers?.filter(a => a.isCorrect).length || 0;
  const otherPlayerCorrect = otherPlayer?.answers?.filter(a => a.isCorrect).length || 0;

  const totalQuestions = game.questions.length;

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
            <Text style={styles.title}>Résultats</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Winner Announcement */}
            <View style={styles.winnerCard}>
              {isDraw ? (
                <>
                  <Text style={styles.winnerIcon}>🤝</Text>
                  <Text style={styles.winnerTitle}>Égalité !</Text>
                  <Text style={styles.winnerSubtitle}>
                    Vous êtes aussi forts l'un que l'autre !
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.winnerIcon}>{isWinner ? '🏆' : '👏'}</Text>
                  <Text style={styles.winnerTitle}>
                    {isWinner ? 'Victoire !' : `${winner?.profile.name} gagne !`}
                  </Text>
                  <Text style={styles.winnerSubtitle}>
                    {isWinner
                      ? 'Félicitations, vous avez gagné !'
                      : 'Bien joué ! Retentez votre chance'}
                  </Text>
                </>
              )}
            </View>

            {/* Players Comparison */}
            <View style={styles.comparisonContainer}>
              {/* Current Player */}
              <View style={[styles.playerResultCard, isWinner && !isDraw && styles.winnerPlayerCard]}>
                <View style={styles.playerResultAvatar}>
                  <AvatarDisplay
                    avatar={currentPlayer?.profile.avatar || { type: 'emoji', value: '👤' }}
                    imageStyle={styles.largeAvatarImage}
                    textStyle={styles.largeAvatarEmoji}
                  />
                  {isWinner && !isDraw && (
                    <View style={styles.winnerBadge}>
                      <Foundation name="trophy" size={16} color="#FFD700" />
                    </View>
                  )}
                </View>
                <Text style={styles.playerResultName}>Vous</Text>
                <Text style={styles.playerResultScore}>{currentPlayer?.score || 0}</Text>
                <Text style={styles.playerResultStats}>
                  {currentPlayerCorrect}/{totalQuestions} bonnes réponses
                </Text>
              </View>

              {/* VS */}
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              {/* Other Player */}
              <View style={[styles.playerResultCard, !isWinner && !isDraw && styles.winnerPlayerCard]}>
                <View style={styles.playerResultAvatar}>
                  <AvatarDisplay
                    avatar={otherPlayer?.profile.avatar || { type: 'emoji', value: '👤' }}
                    imageStyle={styles.largeAvatarImage}
                    textStyle={styles.largeAvatarEmoji}
                  />
                  {!isWinner && !isDraw && (
                    <View style={styles.winnerBadge}>
                      <Foundation name="trophy" size={16} color="#FFD700" />
                    </View>
                  )}
                </View>
                <Text style={styles.playerResultName}>{otherPlayer?.profile.name || 'Adversaire'}</Text>
                <Text style={styles.playerResultScore}>{otherPlayer?.score || 0}</Text>
                <Text style={styles.playerResultStats}>
                  {otherPlayerCorrect}/{totalQuestions} bonnes réponses
                </Text>
              </View>
            </View>

            {/* Game Stats */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>📊 Statistiques de la partie</Text>

              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Foundation name="list" size={24} color={currentTheme.romantic.primary} />
                  <Text style={styles.statLabel}>Mode</Text>
                  <Text style={styles.statValue}>
                    {game.gameMode === 'competitive' ? 'Compétitif' : 'Prédiction'}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Foundation name="comments" size={24} color={currentTheme.romantic.primary} />
                  <Text style={styles.statLabel}>Questions</Text>
                  <Text style={styles.statValue}>{totalQuestions}</Text>
                </View>

                <View style={styles.statItem}>
                  <Foundation name="check" size={24} color={currentTheme.romantic.primary} />
                  <Text style={styles.statLabel}>Précision</Text>
                  <Text style={styles.statValue}>
                    {Math.round((currentPlayerCorrect / totalQuestions) * 100)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.playAgainButton]}
                onPress={handlePlayAgain}
              >
                <Foundation name="refresh" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Rejouer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.menuButton]}
                onPress={handleBackToMenu}
              >
                <Foundation name="home" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Menu</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
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
      gap: 16,
    },
    loadingText: {
      fontSize: 18,
      color: theme.text.primary,
    },
    header: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    winnerCard: {
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 24,
      padding: 32,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: theme.romantic.primary,
    },
    winnerIcon: {
      fontSize: 80,
      marginBottom: 16,
    },
    winnerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    winnerSubtitle: {
      fontSize: 16,
      color: theme.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    comparisonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 32,
    },
    playerResultCard: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 20,
      padding: 20,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    winnerPlayerCard: {
      borderColor: '#FFD700',
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
    },
    playerResultAvatar: {
      position: 'relative',
      marginBottom: 12,
    },
    largeAvatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    largeAvatarEmoji: {
      fontSize: 48,
    },
    winnerBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      backgroundColor: 'rgba(255, 215, 0, 0.9)',
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    playerResultName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 8,
    },
    playerResultScore: {
      fontSize: 36,
      fontWeight: 'bold',
      color: theme.romantic.primary,
      marginBottom: 4,
    },
    playerResultStats: {
      fontSize: 13,
      color: theme.text.secondary,
    },
    vsContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 24,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    vsText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text.primary,
    },
    statsContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 20,
      textAlign: 'center',
    },
    statRow: {
      flexDirection: 'row',
      gap: 12,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      gap: 8,
    },
    statLabel: {
      fontSize: 13,
      color: theme.text.secondary,
      textAlign: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
      textAlign: 'center',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      borderRadius: 16,
      padding: 18,
    },
    playAgainButton: {
      backgroundColor: theme.romantic.primary,
    },
    menuButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  });

export default QuizResultsScreen;
