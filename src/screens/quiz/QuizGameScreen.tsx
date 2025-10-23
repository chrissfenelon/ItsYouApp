import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { QuizGame, QuizQuestion } from '../../types/quizCouple.types';
import { AvatarDisplay } from '../../utils/avatarUtils';

const { width, height } = Dimensions.get('window');

interface QuizGameScreenProps {
  route: {
    params: {
      gameId: string;
      playerId: string;
    };
  };
}

export const QuizGameScreen: React.FC<QuizGameScreenProps> = ({ route }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);

  const { gameId, playerId } = route?.params || {};

  const [game, setGame] = useState<QuizGame | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [partnerAnswered, setPartnerAnswered] = useState(false);
  const [showPartnerNotification, setShowPartnerNotification] = useState(false);

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId || !playerId) {
      navigateToScreen('quizCouple');
      return;
    }

    const timeoutIds: NodeJS.Timeout[] = [];

    const unsubscribe = QuizCoupleService.subscribeToGame(
      gameId,
      (updatedGame) => {
        const previousGame = game;
        setGame(updatedGame);

        // Navigate to results when game is finished
        if (updatedGame.status === 'finished') {
          navigateToScreen('quizCoupleResults', { gameId, playerId });
          return;
        }

        // Check if partner answered
        if (previousGame && updatedGame.players) {
          const currentPlayer = updatedGame.players.find(p => p.id === playerId);
          const otherPlayer = updatedGame.players.find(p => p.id !== playerId);

          if (currentPlayer?.hasAnsweredCurrent && otherPlayer?.hasAnsweredCurrent) {
            // Both players answered - move to next question
            const timeoutId = setTimeout(async () => {
              await QuizCoupleService.nextQuestion(gameId);
              setSelectedAnswer(null);
              setTimeLeft(15);
              setShowResult(false);
              setPartnerAnswered(false);
              setShowPartnerNotification(false);
            }, 2000);
            timeoutIds.push(timeoutId);
          } else if (currentPlayer?.hasAnsweredCurrent && !otherPlayer?.hasAnsweredCurrent) {
            // Show waiting state
            setShowResult(true);
          } else if (!currentPlayer?.hasAnsweredCurrent && otherPlayer?.hasAnsweredCurrent) {
            // Partner answered first - show notification
            setPartnerAnswered(true);
            setShowPartnerNotification(true);
            const timeoutId = setTimeout(() => setShowPartnerNotification(false), 3000);
            timeoutIds.push(timeoutId);
          }
        }
      },
      (error) => {
        console.error('Error subscribing to game:', error);
      }
    );

    return () => {
      // Clear all timeouts
      timeoutIds.forEach(id => clearTimeout(id));
      // Unsubscribe from Firestore
      unsubscribe();
    };
  }, [gameId, playerId, navigateToScreen]); // Removed 'game' from dependencies

  // Timer countdown
  useEffect(() => {
    if (!game || game.status !== 'playing' || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleSubmitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [game, showResult, currentQuestionIndex, handleSubmitAnswer]);

  const handleSelectAnswer = (answerId: string) => {
    if (isAnswering || showResult) return;
    setSelectedAnswer(answerId);
  };

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmitAnswer = useCallback(async () => {
    if (isAnswering || !game || !selectedAnswer) return;

    setIsAnswering(true);

    try {
      const currentQuestion = game.questions[currentQuestionIndex];
      const timeSpent = 15 - timeLeft;

      if (game.gameMode === 'competitive') {
        // Competitive mode: submit answer (no correct answer in couple mode)
        await QuizCoupleService.submitAnswer(
          gameId,
          playerId,
          currentQuestionIndex,
          selectedAnswer,
          timeSpent
        );

        setShowResult(true);
        setIsAnswering(false);
      } else {
        // Prediction mode
        const predictionQuestion = game.predictionQuestions?.[currentQuestionIndex];

        if (predictionQuestion?.answeringPlayerId === playerId) {
          // Player is answering the original question
          await QuizCoupleService.submitPredictionAnswer(
            gameId,
            playerId,
            currentQuestionIndex,
            selectedAnswer
          );
        } else {
          // Player is predicting partner's answer
          const correct = await QuizCoupleService.submitPrediction(
            gameId,
            playerId,
            currentQuestionIndex,
            selectedAnswer,
            timeSpent
          );

          setIsCorrect(correct);
          setShowResult(true);
        }

        // Move to next question after 2 seconds - track timeout
        timeoutRef.current = setTimeout(() => {
          if (currentQuestionIndex < game.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setSelectedAnswer(null);
            setTimeLeft(15);
            setShowResult(false);
          }
          setIsAnswering(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setIsAnswering(false);
    }
  }, [isAnswering, game, selectedAnswer, currentQuestionIndex, timeLeft, gameId, playerId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!game || !game.players || !Array.isArray(game.players)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.romantic.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const currentQuestion = game.questions[currentQuestionIndex];
  const currentPlayer = game.players.find((p) => p.id === playerId);
  const otherPlayer = game.players.find((p) => p.id !== playerId);

  // Prediction mode specific
  const isPredictionMode = game.gameMode === 'prediction';
  const predictionQuestion = isPredictionMode ? game.predictionQuestions?.[currentQuestionIndex] : null;
  const isAnsweringPlayer = predictionQuestion?.answeringPlayerId === playerId;

  // Determine what question to show
  const displayQuestion = isPredictionMode && !isAnsweringPlayer
    ? predictionQuestion?.predictionText || currentQuestion.text
    : currentQuestion.text;

  const progress = ((currentQuestionIndex + 1) / game.questions.length) * 100;

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
            <View style={styles.headerLeft}>
              <Text style={styles.questionNumber}>
                Question {currentQuestionIndex + 1}/{game.questions.length}
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
            </View>

            <View style={styles.timerContainer}>
              <Foundation name="clock" size={20} color={timeLeft <= 5 ? '#FF453A' : '#FFFFFF'} />
              <Text style={[styles.timerText, timeLeft <= 5 && styles.timerWarning]}>
                {timeLeft}s
              </Text>
            </View>
          </View>

          {/* Players Scores */}
          <View style={styles.playersRow}>
            {/* Current Player */}
            <View style={styles.playerScoreCard}>
              <View style={styles.playerScoreAvatar}>
                <AvatarDisplay
                  avatar={currentPlayer?.profile.avatar || { type: 'emoji', value: '👤' }}
                  imageStyle={styles.avatarImage}
                  textStyle={styles.avatarEmoji}
                />
              </View>
              <Text style={styles.playerScoreName} numberOfLines={1}>Vous</Text>
              <Text style={styles.playerScorePoints}>{currentPlayer?.score || 0}</Text>
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            {/* Other Player */}
            <View style={styles.playerScoreCard}>
              <View style={styles.playerScoreAvatar}>
                <AvatarDisplay
                  avatar={otherPlayer?.profile.avatar || { type: 'emoji', value: '👤' }}
                  imageStyle={styles.avatarImage}
                  textStyle={styles.avatarEmoji}
                />
              </View>
              <Text style={styles.playerScoreName} numberOfLines={1}>
                {otherPlayer?.profile.name || 'Adversaire'}
              </Text>
              <Text style={styles.playerScorePoints}>{otherPlayer?.score || 0}</Text>
            </View>
          </View>

          {/* Question and Answers */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Question Card */}
            <View style={styles.questionCard}>
              {isPredictionMode && (
                <View style={styles.modeIndicator}>
                  <Foundation
                    name={isAnsweringPlayer ? 'comment' : 'heart'}
                    size={20}
                    color={currentTheme.romantic.primary}
                  />
                  <Text style={styles.modeText}>
                    {isAnsweringPlayer ? 'Répondez' : 'Devinez la réponse'}
                  </Text>
                </View>
              )}

              <Text style={styles.questionText}>{displayQuestion}</Text>
            </View>

            {/* Answers */}
            <View style={styles.answersContainer}>
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer === option.id;

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.answerButton,
                      isSelected && styles.answerButtonSelected,
                    ]}
                    onPress={() => handleSelectAnswer(option.id)}
                    disabled={showResult || isAnswering}
                    activeOpacity={0.7}
                  >
                    <View style={styles.answerContent}>
                      <Text
                        style={[
                          styles.answerText,
                          isSelected && styles.answerTextSelected,
                        ]}
                      >
                        {option.text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit Button */}
            {!showResult && (
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedAnswer || isAnswering) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitAnswer}
                disabled={!selectedAnswer || isAnswering}
              >
                {isAnswering ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Foundation name="check" size={24} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Valider</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Waiting Message */}
            {showResult && !partnerAnswered && (
              <View style={styles.waitingContainer}>
                <ActivityIndicator size="small" color={currentTheme.romantic.primary} />
                <Text style={styles.waitingText}>
                  En attente de {otherPlayer?.profile.name || 'votre partenaire'}...
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Partner Notification Overlay */}
      {showPartnerNotification && (
        <View style={styles.notificationOverlay}>
          <View style={styles.notificationCard}>
            <View style={styles.notificationAvatar}>
              <AvatarDisplay
                avatar={otherPlayer?.profile.avatar || { type: 'emoji', value: '👤' }}
                imageStyle={styles.notificationAvatarImage}
                textStyle={styles.notificationAvatarEmoji}
              />
            </View>
            <Text style={styles.notificationText}>
              {otherPlayer?.profile.name || 'Votre partenaire'} a répondu !
            </Text>
          </View>
        </View>
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
      gap: 16,
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
      paddingBottom: 16,
    },
    headerLeft: {
      flex: 1,
    },
    questionNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 8,
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.romantic.primary,
      borderRadius: 3,
    },
    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    timerText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    timerWarning: {
      color: '#FF453A',
    },
    playersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 12,
    },
    playerScoreCard: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    playerScoreAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatarImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    avatarEmoji: {
      fontSize: 28,
    },
    playerScoreName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 4,
    },
    playerScorePoints: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.romantic.primary,
    },
    vsContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    vsText: {
      fontSize: 14,
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
    questionCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    modeIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    modeText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.romantic.primary,
    },
    questionText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text.primary,
      lineHeight: 28,
      textAlign: 'center',
    },
    answersContainer: {
      gap: 12,
      marginBottom: 24,
    },
    answerButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 18,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    answerButtonSelected: {
      backgroundColor: 'rgba(255, 105, 180, 0.2)',
      borderColor: theme.romantic.primary,
    },
    answerButtonCorrect: {
      backgroundColor: 'rgba(76, 175, 80, 0.3)',
      borderColor: '#4CAF50',
    },
    answerButtonWrong: {
      backgroundColor: 'rgba(255, 69, 58, 0.3)',
      borderColor: '#FF453A',
    },
    answerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    answerText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.secondary,
      flex: 1,
    },
    answerTextSelected: {
      color: theme.text.primary,
    },
    answerTextResult: {
      color: '#FFFFFF',
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.romantic.primary,
      borderRadius: 16,
      padding: 18,
      gap: 12,
    },
    submitButtonDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    submitButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    resultContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 20,
      borderRadius: 16,
      marginTop: 16,
    },
    resultCorrect: {
      backgroundColor: 'rgba(76, 175, 80, 0.3)',
      borderWidth: 2,
      borderColor: '#4CAF50',
    },
    resultWrong: {
      backgroundColor: 'rgba(255, 69, 58, 0.3)',
      borderWidth: 2,
      borderColor: '#FF453A',
    },
    resultText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    waitingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 20,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      marginTop: 16,
    },
    waitingText: {
      fontSize: 16,
      color: theme.text.primary,
    },
    notificationOverlay: {
      position: 'absolute',
      top: 100,
      left: 20,
      right: 20,
      alignItems: 'center',
      zIndex: 1000,
    },
    notificationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 105, 180, 0.95)',
      borderRadius: 16,
      padding: 16,
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    notificationAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: 'hidden',
    },
    notificationAvatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    notificationAvatarEmoji: {
      fontSize: 24,
    },
    notificationText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      flex: 1,
    },
  });

export default QuizGameScreen;
