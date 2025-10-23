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
import LinearGradient from 'react-native-linear-gradient';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import { QuizCoupleService } from '../../services/quiz/QuizCoupleService';
import { QuizCoupleMessagesService } from '../../services/quiz/QuizCoupleMessagesService';
import { QuizGame, QuizQuestion, QuizOption } from '../../types/quizCouple.types';
import { AvatarDisplay } from '../../utils/avatarUtils';
import SoundService from '../../services/SoundService';
import QuizNotificationToast from '../../components/quiz/QuizNotificationToast';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface QuizCoupleGameScreenProps {
  route?: {
    params?: {
      gameId: string;
      playerId: string;
    };
  };
}

export const QuizCoupleGameScreen: React.FC<QuizCoupleGameScreenProps> = ({ route }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const { gameId, playerId } = route?.params || {};

  const [game, setGame] = useState<QuizGame | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [myAnswerId, setMyAnswerId] = useState<string | null>(null);
  const [partnerAnswerId, setPartnerAnswerId] = useState<string | null>(null);
  const [lastNotificationTimestamp, setLastNotificationTimestamp] = useState<number>(0);

  // Toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'correct' | 'incorrect'>('correct');
  const [toastMessage, setToastMessage] = useState('');

  // Animations
  const questionFadeAnim = useRef(new Animated.Value(1)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;
  const answerScaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Start background music when game starts
  useEffect(() => {
    SoundService.startGameMusic('quizcouple');

    return () => {
      SoundService.stopGameMusic();
    };
  }, []);

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId || !playerId) {
      navigateToScreen('quizCouple');
      return;
    }

    const unsubscribe = QuizCoupleService.subscribeToGame(
      gameId,
      (updatedGame) => {
        setGame(updatedGame);

        // Check for new notifications (mode prédiction)
        if (updatedGame.gameMode === 'prediction' && updatedGame.lastNotification) {
          const notification = updatedGame.lastNotification as any;

          // Vérifier si c'est une nouvelle notification et si elle est pour moi
          if (notification.timestamp > lastNotificationTimestamp &&
              notification.type === 'partner_answered') {
            const predictionQ = updatedGame.predictionQuestions?.[updatedGame.currentQuestionIndex];

            // Afficher seulement si je suis celui qui doit deviner
            if (predictionQ?.targetPlayerId === playerId) {
              setLastNotificationTimestamp(notification.timestamp);
              setToastType('correct');
              setToastMessage(notification.message);
              setToastVisible(true);
              SoundService.playCorrectAnswer();

              setTimeout(() => {
                setToastVisible(false);
              }, 3000);
            }
          }
        }

        // Navigate to results when game is finished
        if (updatedGame.status === 'finished') {
          SoundService.stopGameMusic();
          navigateToScreen('quizCoupleResults', { gameId, playerId });
          return;
        }

        // Update current question
        if (updatedGame.status === 'playing') {
          const currentQ = updatedGame.questions[updatedGame.currentQuestionIndex];
          setCurrentQuestion(currentQ);

          // Initialize answer scale animations
          currentQ?.options.forEach((option) => {
            if (!answerScaleAnims[option.id]) {
              answerScaleAnims[option.id] = new Animated.Value(1);
            }
          });

          // Check if we need to reset for new question
          const currentPlayer = updatedGame.players.find(p => p.id === playerId);
          const otherPlayer = updatedGame.players.find(p => p.id !== playerId);

          if (currentPlayer && !currentPlayer.hasAnsweredCurrent) {
            // Reset state for new question
            setHasSubmitted(false);
            setShowResults(false);
            setSelectedAnswer(null);
            setMyAnswerId(null);
            setPartnerAnswerId(null);
            questionFadeAnim.setValue(1);
            resultFadeAnim.setValue(0);
          } else if (currentPlayer && currentPlayer.hasAnsweredCurrent) {
            // I have answered, get my answer
            const myAnswer = currentPlayer.answers[updatedGame.currentQuestionIndex];
            if (myAnswer) {
              setMyAnswerId(myAnswer.answerId);
              setHasSubmitted(true);
            }

            // Check if we should show results (different logic for prediction mode)
            if (updatedGame.gameMode === 'prediction') {
              const predictionQ = updatedGame.predictionQuestions?.[updatedGame.currentQuestionIndex];

              if (predictionQ) {
                // Vérifier si les deux phases sont complètes
                const hasOriginalAnswer = predictionQ.partnerAnswer !== null;
                const hasPrediction = (predictionQ.targetPlayerId === playerId && currentPlayer.hasAnsweredCurrent) ||
                                     (otherPlayer && predictionQ.targetPlayerId !== playerId && otherPlayer.hasAnsweredCurrent);

                if (hasOriginalAnswer && hasPrediction && !showResults) {
                  // Both phases complete - show results
                  setShowResults(true);
                  animateResult();

                  // Get partner's answer based on role
                  if (predictionQ.targetPlayerId === playerId) {
                    // I was predicting, so partner's answer is the original answer
                    setPartnerAnswerId(predictionQ.partnerAnswer || null);
                  } else if (predictionQ.answeringPlayerId === playerId) {
                    // I was answering, so partner's answer is their prediction
                    const partnerAnswer = otherPlayer?.answers[updatedGame.currentQuestionIndex];
                    setPartnerAnswerId(partnerAnswer?.answerId || null);
                  }

                  // Show feedback based on role
                  if (predictionQ.targetPlayerId === playerId) {
                    // I was predicting
                    if (myAnswer && myAnswer.isCorrect !== undefined) {
                      const predictedCorrectly = myAnswer.isCorrect;

                      if (predictedCorrectly) {
                        SoundService.playCorrectAnswer();
                        setToastType('correct');
                        setToastMessage('Bonne prédiction! 💚');
                      } else {
                        SoundService.playWrongAnswer();
                        setToastType('incorrect');
                        setToastMessage('Mauvaise prédiction');
                      }
                      setToastVisible(true);

                      setTimeout(() => {
                        setToastVisible(false);
                      }, 2000);
                    }
                  } else if (predictionQ.answeringPlayerId === playerId) {
                    // I was answering - wait for partner's prediction
                    const partnerPredicted = otherPlayer && otherPlayer.hasAnsweredCurrent;
                    if (partnerPredicted) {
                      const partnerAnswer = otherPlayer.answers[updatedGame.currentQuestionIndex];

                      if (partnerAnswer && partnerAnswer.isCorrect !== undefined) {
                        const predictedCorrectly = partnerAnswer.isCorrect;

                        if (predictedCorrectly) {
                          SoundService.playCorrectAnswer();
                          setToastType('correct');
                          setToastMessage(`${otherPlayer.profile.name} a bien deviné! 💚`);
                        } else {
                          SoundService.playWrongAnswer();
                          setToastType('incorrect');
                          setToastMessage(`${otherPlayer.profile.name} s'est trompé(e)`);
                        }
                        setToastVisible(true);

                        setTimeout(() => {
                          setToastVisible(false);
                        }, 2000);
                      }
                    }
                  }
                }
              }
            } else {
              // Competitive mode logic
              if (otherPlayer && otherPlayer.hasAnsweredCurrent) {
                const partnerAnswer = otherPlayer.answers[updatedGame.currentQuestionIndex];
                if (partnerAnswer) {
                  setPartnerAnswerId(partnerAnswer.answerId);

                  // Both answered - show results
                  if (!showResults) {
                    setShowResults(true);
                    animateResult();

                    // Check if answers match
                    const sameAnswer = myAnswer.answerId === partnerAnswer.answerId;

                    if (sameAnswer) {
                      SoundService.playCorrectAnswer();
                      setToastType('correct');
                      setToastMessage('Même réponse! 💚');
                    } else {
                      SoundService.playWrongAnswer();
                      setToastType('incorrect');
                      setToastMessage('Réponses différentes');
                    }
                    setToastVisible(true);

                    // Hide toast after 2 seconds
                    setTimeout(() => {
                      setToastVisible(false);
                    }, 2000);
                  }
                }
              }
            }
          }
        }
      },
      (error) => {
        console.error('Error subscribing to game:', error);
        showAlert({ title: 'Erreur', message: 'Connexion perdue', type: 'error' });
      }
    );

    return () => unsubscribe();
  }, [gameId, playerId]);

  const animateResult = () => {
    Animated.parallel([
      Animated.timing(questionFadeAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(resultFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSelectAnswer = (answerId: string) => {
    if (hasSubmitted || showResults) return;

    setSelectedAnswer(answerId);
    SoundService.playButtonClick();

    // Animate selected answer
    Animated.sequence([
      Animated.timing(answerScaleAnims[answerId], {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(answerScaleAnims[answerId], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || hasSubmitted || !game || !currentQuestion) return;

    setHasSubmitted(true);

    try {
      SoundService.playButtonClick();

      if (game.gameMode === 'competitive') {
        await QuizCoupleService.submitAnswer(
          gameId,
          playerId,
          game.currentQuestionIndex,
          selectedAnswer,
          0 // No timer, so timeSpent is 0
        );
      } else if (game.gameMode === 'prediction') {
        const predictionQuestion = game.predictionQuestions?.[game.currentQuestionIndex];

        if (predictionQuestion?.answeringPlayerId === playerId) {
          // I'm answering the question
          await QuizCoupleService.submitPredictionAnswer(
            gameId,
            playerId,
            game.currentQuestionIndex,
            selectedAnswer
          );
        } else if (predictionQuestion?.targetPlayerId === playerId) {
          // I'm predicting partner's answer
          await QuizCoupleService.submitPrediction(
            gameId,
            playerId,
            game.currentQuestionIndex,
            selectedAnswer,
            0 // No timer
          );
        }
      }

      setMyAnswerId(selectedAnswer);
    } catch (error) {
      console.error('Error submitting answer:', error);
      SoundService.playWrongAnswer();
      showAlert({ title: 'Tann li', message: 'Tann mennaj ou fin reponn', type: 'error' });
      setHasSubmitted(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!game) return;

    try {
      SoundService.playButtonClick();

      // Check if this is the last question
      const isLastQuestion = game.currentQuestionIndex >= game.totalQuestions - 1;

      if (isLastQuestion) {
        // Manually call finishGame to ensure it completes
        await QuizCoupleService.finishGame(gameId);
      } else {
        await QuizCoupleService.nextQuestion(gameId);
      }
    } catch (error) {
      console.error('Error moving to next question:', error);
      showAlert({ title: 'Erreur', message: 'Impossible de passer à la question suivante', type: 'error' });
    }
  };

  if (!game || !currentQuestion || !game.players) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const currentPlayer = game.players.find(p => p.id === playerId);
  const otherPlayer = game.players.find(p => p.id !== playerId);
  const progressPercentage = ((game.currentQuestionIndex + 1) / game.totalQuestions) * 100;

  // Determine if in prediction mode and player's role
  const isPredictionMode = game.gameMode === 'prediction';
  const predictionQuestion = game.predictionQuestions?.[game.currentQuestionIndex];
  const isAnsweringPlayer = isPredictionMode && predictionQuestion?.answeringPlayerId === playerId;
  const isPredictingPlayer = isPredictionMode && predictionQuestion?.targetPlayerId === playerId;

  // Get the correct answer for display
  const correctAnswer = currentQuestion.options.find(opt => opt.id === currentQuestion.correctAnswerId);

  // Determine colors for each option when results are shown
  const getOptionStyle = (option: QuizOption) => {
    const isSelected = selectedAnswer === option.id;
    const isMyAnswer = myAnswerId === option.id;
    const isPartnerAnswer = partnerAnswerId === option.id;

    if (!showResults) {
      return isSelected ? styles.optionButtonSelected : styles.optionButton;
    }

    // Show results with colors
    if (game.gameMode === 'competitive') {
      // In competitive mode, green if both chose same, red if different
      const bothChoseThis = isMyAnswer && isPartnerAnswer;

      if (bothChoseThis) {
        return [styles.optionButton, styles.optionCorrect];
      } else if (isMyAnswer || isPartnerAnswer) {
        return [styles.optionButton, styles.optionIncorrect];
      }
    } else if (game.gameMode === 'prediction') {
      // In prediction mode:
      // - Green for the correct answer (always shown)
      // - Red for wrong answers that were chosen
      // - Gray for unchosen answers
      const isCorrectAnswer = option.id === currentQuestion.correctAnswerId;
      const isChosenByAnyone = isMyAnswer || isPartnerAnswer;

      if (isCorrectAnswer) {
        // Always show correct answer in green
        return [styles.optionButton, styles.optionCorrect];
      } else if (isChosenByAnyone) {
        // Show chosen wrong answers in red
        return [styles.optionButton, styles.optionIncorrect];
      }
    }

    return styles.optionButton;
  };

  const getOptionTextStyle = (option: QuizOption) => {
    const isSelected = selectedAnswer === option.id;
    const isMyAnswer = myAnswerId === option.id;
    const isPartnerAnswer = partnerAnswerId === option.id;

    if (!showResults) {
      return isSelected ? styles.optionTextSelected : styles.optionText;
    }

    // Always white text when results shown
    return styles.optionTextSelected;
  };

  // Show badges on options when results are displayed
  const getOptionBadge = (option: QuizOption) => {
    if (!showResults) return null;

    const isMyAnswer = myAnswerId === option.id;
    const isPartnerAnswer = partnerAnswerId === option.id;

    const badges = [];

    if (isMyAnswer) {
      badges.push(
        <View key="me" style={styles.answerBadge}>
          <Text style={styles.answerBadgeText}>Vous</Text>
        </View>
      );
    }

    if (isPartnerAnswer) {
      badges.push(
        <View key="partner" style={[styles.answerBadge, styles.partnerBadge]}>
          <Text style={styles.answerBadgeText}>{otherPlayer?.profile.name}</Text>
        </View>
      );
    }

    return badges.length > 0 ? <View style={styles.badgesContainer}>{badges}</View> : null;
  };

  // Determine if both players have answered
  let bothAnswered = false;

  if (game.gameMode === 'prediction' && predictionQuestion) {
    // En mode prédiction: vérifier que la réponse originale ET la prédiction sont faites
    const hasOriginalAnswer = predictionQuestion.partnerAnswer !== null;
    const hasPrediction = (predictionQuestion.targetPlayerId === playerId && currentPlayer?.hasAnsweredCurrent) ||
                         (predictionQuestion.targetPlayerId !== playerId && otherPlayer?.hasAnsweredCurrent);
    bothAnswered = hasOriginalAnswer && hasPrediction;
  } else {
    // Mode compétitif: les deux joueurs doivent avoir répondu
    bothAnswered = currentPlayer?.hasAnsweredCurrent && otherPlayer?.hasAnsweredCurrent;
  }

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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                SoundService.playButtonClick();
                SoundService.stopGameMusic();
                navigateToScreen('quizCouple');
              }}
            >
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.questionNumber}>
                Question {game.currentQuestionIndex + 1}/{game.totalQuestions}
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
              </View>
            </View>

            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Players Score */}
            <View style={styles.playersStatus}>
              {game.players.map((player) => (
                <View key={player.id} style={styles.playerStatusCard}>
                  <View style={styles.playerStatusAvatar}>
                    <AvatarDisplay
                      avatar={player.profile.avatar}
                      photoURL={player.profile.photoURL}
                      imageStyle={styles.playerAvatarImage}
                      textStyle={styles.playerAvatarEmoji}
                    />
                    {player.hasAnsweredCurrent && (
                      <View style={styles.answeredBadge}>
                        <Foundation name="check" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.playerStatusName} numberOfLines={1}>
                    {player.profile.name}
                  </Text>
                  <Text style={styles.playerStatusScore}>{player.score} pts</Text>
                </View>
              ))}
            </View>

            {/* Prediction Mode Role Indicator */}
            {isPredictionMode && !showResults && (
              <View style={styles.roleIndicatorContainer}>
                {isAnsweringPlayer && (
                  <View style={[styles.roleIndicator, styles.answeringIndicator]}>
                    <Foundation name="pencil" size={20} color="#FFFFFF" />
                    <Text style={styles.roleIndicatorText}>Votre tour de répondre</Text>
                  </View>
                )}
                {isPredictingPlayer && (
                  <View style={[styles.roleIndicator, styles.predictingIndicator]}>
                    <Foundation name="lightbulb" size={20} color="#FFFFFF" />
                    <Text style={styles.roleIndicatorText}>Devinez la réponse de {otherPlayer?.profile.name}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Question */}
            <Animated.View style={[styles.questionContainer, { opacity: questionFadeAnim }]}>
              <View style={styles.questionCard}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {currentQuestion.categoryId.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                {isPredictionMode && isPredictingPlayer ? (
                  <Text style={styles.questionText}>
                    Selon vous, comment {otherPlayer?.profile.name} répondrait à cette question?
                    {'\n\n'}
                    <Text style={styles.actualQuestionText}>{currentQuestion.text}</Text>
                  </Text>
                ) : (
                  <Text style={styles.questionText}>{currentQuestion.text}</Text>
                )}
                <View style={styles.difficultyBadge}>
                  <Foundation
                    name="star"
                    size={14}
                    color={
                      currentQuestion.difficulty === 'facile'
                        ? '#4CAF50'
                        : currentQuestion.difficulty === 'moyen'
                        ? '#FF9800'
                        : '#F44336'
                    }
                  />
                  <Text
                    style={[
                      styles.difficultyText,
                      {
                        color:
                          currentQuestion.difficulty === 'facile'
                            ? '#4CAF50'
                            : currentQuestion.difficulty === 'moyen'
                            ? '#FF9800'
                            : '#F44336',
                      },
                    ]}
                  >
                    {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Answer Options */}
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option.id;
                const scale = answerScaleAnims[option.id] || new Animated.Value(1);

                return (
                  <Animated.View
                    key={option.id}
                    style={[{ transform: [{ scale }] }]}
                  >
                    <TouchableOpacity
                      style={getOptionStyle(option)}
                      onPress={() => handleSelectAnswer(option.id)}
                      disabled={hasSubmitted}
                    >
                      <View style={styles.optionNumber}>
                        <Text style={styles.optionNumberText}>{String.fromCharCode(65 + index)}</Text>
                      </View>
                      <Text style={getOptionTextStyle(option)}>
                        {option.text}
                      </Text>
                      {isSelected && !showResults && (
                        <Foundation name="check" size={20} color="#FFFFFF" />
                      )}
                      {getOptionBadge(option)}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {/* Submit Button */}
            {!hasSubmitted && !showResults && (
              <TouchableOpacity
                style={[styles.submitButton, !selectedAnswer && styles.submitButtonDisabled]}
                onPress={handleSubmitAnswer}
                disabled={!selectedAnswer}
              >
                <Foundation name="check" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  Valider ma réponse
                </Text>
              </TouchableOpacity>
            )}

            {/* Waiting for Partner */}
            {hasSubmitted && !bothAnswered && (
              <Animated.View style={[styles.waitingContainer, { opacity: resultFadeAnim }]}>
                <Foundation name="clock" size={40} color={currentTheme.romantic.primary} />
                <Text style={styles.waitingText}>En attente de {otherPlayer?.profile.name}...</Text>
                <Text style={styles.waitingSubtext}>Votre réponse a été enregistrée</Text>
              </Animated.View>
            )}

            {/* Next Question Button */}
            {showResults && bothAnswered && (
              <Animated.View style={{ opacity: resultFadeAnim }}>
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    game.currentQuestionIndex >= game.totalQuestions - 1 && styles.finishButton
                  ]}
                  onPress={handleNextQuestion}
                >
                  {game.currentQuestionIndex >= game.totalQuestions - 1 ? (
                    <>
                      <Foundation name="trophy" size={24} color="#FFFFFF" />
                      <Text style={styles.nextButtonText}>Voir les Résultats</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>Question Suivante</Text>
                      <Foundation name="arrow-right" size={24} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Toast Notification */}
      <QuizNotificationToast
        visible={toastVisible}
        type={toastType}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />

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
      paddingBottom: 15,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.interactive.active,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerCenter: {
      flex: 1,
      marginHorizontal: 15,
    },
    questionNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.secondary,
      textAlign: 'center',
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
    playersStatus: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    playerStatusCard: {
      flex: 1,
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      padding: 12,
      alignItems: 'center',
    },
    playerStatusAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      position: 'relative',
    },
    playerAvatarImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    playerAvatarEmoji: {
      fontSize: 28,
    },
    answeredBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(30, 30, 30, 0.85)',
    },
    playerStatusName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 4,
    },
    playerStatusScore: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.romantic.primary,
    },
    roleIndicatorContainer: {
      marginBottom: 16,
    },
    roleIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 2,
      padding: 16,
      gap: 12,
    },
    answeringIndicator: {
      backgroundColor: 'rgba(76, 175, 80, 0.2)',
      borderColor: '#4CAF50',
    },
    predictingIndicator: {
      backgroundColor: 'rgba(255, 152, 0, 0.2)',
      borderColor: '#FF9800',
    },
    roleIndicatorText: {
      flex: 1,
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text.primary,
    },
    questionContainer: {
      marginBottom: 20,
    },
    questionCard: {
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      padding: 24,
      shadowColor: 'rgba(255, 105, 180, 0.5)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 10,
    },
    actualQuestionText: {
      fontStyle: 'italic',
      color: theme.romantic.primary,
      fontWeight: '700',
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.romantic.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 16,
    },
    categoryText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    questionText: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text.primary,
      lineHeight: 28,
      marginBottom: 12,
    },
    difficultyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    difficultyText: {
      fontSize: 13,
      fontWeight: '600',
    },
    optionsContainer: {
      gap: 12,
      marginBottom: 20,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      padding: 16,
      gap: 12,
      position: 'relative',
      overflow: 'hidden',
    },
    optionButtonSelected: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderColor: theme.romantic.primary,
      borderWidth: 2,
      borderRadius: 16,
    },
    optionCorrect: {
      backgroundColor: '#4CAF50',
      borderColor: '#4CAF50',
    },
    optionIncorrect: {
      backgroundColor: '#F44336',
      borderColor: '#F44336',
    },
    optionChosen: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.5)',
      borderWidth: 2,
    },
    optionNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionNumberText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      color: theme.text.primary,
      fontWeight: '500',
    },
    optionTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    badgesContainer: {
      position: 'absolute',
      top: 8,
      right: 8,
      flexDirection: 'column',
      gap: 4,
      alignItems: 'flex-end',
    },
    answerBadge: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    partnerBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    answerBadgeText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    submitButton: {
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
    submitButtonDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    waitingContainer: {
      alignItems: 'center',
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      padding: 30,
      gap: 12,
    },
    waitingText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text.primary,
      textAlign: 'center',
    },
    waitingSubtext: {
      fontSize: 14,
      color: theme.text.secondary,
      textAlign: 'center',
    },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4CAF50',
      borderRadius: 16,
      padding: 18,
      gap: 10,
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    finishButton: {
      backgroundColor: theme.romantic.primary,
      shadowColor: theme.romantic.primary,
    },
    nextButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  });

export default QuizCoupleGameScreen;
