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
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import LinearGradient from 'react-native-linear-gradient';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import { QuizCoupleService } from '../../services/quiz/QuizCoupleService';
import { QuizGame, CustomQuestion } from '../../types/quizCouple.types';
import { AvatarDisplay } from '../../utils/avatarUtils';
import SoundService from '../../services/SoundService';
import QuizNotificationToast from '../../components/quiz/QuizNotificationToast';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface QuizCoupleCustomScreenProps {
  route?: {
    params?: {
      gameId: string;
      playerId: string;
    };
  };
}

type ScreenMode = 'asking' | 'answering' | 'judging' | 'waiting';

export const QuizCoupleCustomScreen: React.FC<QuizCoupleCustomScreenProps> = ({ route }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const { gameId, playerId } = route?.params || {};

  const [game, setGame] = useState<QuizGame | null>(null);
  const [mode, setMode] = useState<ScreenMode>('waiting');
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<CustomQuestion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'judged-correct' | 'judged-incorrect' | 'judged-almost'>('judged-correct');
  const [toastMessage, setToastMessage] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId || !playerId) {
      navigateToScreen('quizCouple');
      return;
    }

    // Start game music
    SoundService.startGameMusic('quizcouple');

    const unsubscribe = QuizCoupleService.subscribeToGame(
      gameId,
      (updatedGame) => {
        // Check for new judgments on questions I answered
        if (game && updatedGame.customQuestions && game.customQuestions) {
          const newJudgments = updatedGame.customQuestions.filter((newQ) => {
            const oldQ = game.customQuestions?.find(q => q.id === newQ.id);
            // Check if this is a question I answered and it just got judged
            return newQ.answeredBy === playerId &&
                   newQ.judgment !== null &&
                   oldQ?.judgment === null;
          });

          // Show toast for the first new judgment
          if (newJudgments.length > 0) {
            const judgedQ = newJudgments[0];
            const judgmentType = judgedQ.judgment === 'correct' ? 'judged-correct'
                               : judgedQ.judgment === 'almost' ? 'judged-almost'
                               : 'judged-incorrect';

            const points = judgedQ.judgment === 'correct' ? '+10 pts'
                         : judgedQ.judgment === 'almost' ? '+5 pts'
                         : '0 pts';

            setToastType(judgmentType);
            setToastMessage(`Jugement: ${judgedQ.judgment === 'correct' ? 'Correct!' : judgedQ.judgment === 'almost' ? 'Presque!' : 'Incorrect'} (${points})`);
            setToastVisible(true);
          }
        }

        setGame(updatedGame);

        // Navigate to results when game is finished
        if (updatedGame.status === 'finished') {
          SoundService.stopGameMusic();
          navigateToScreen('quizCoupleResults', { gameId, playerId });
          return;
        }

        // Determine current mode based on game state
        if (updatedGame.status === 'playing' && updatedGame.customQuestions) {
          updateScreenMode(updatedGame);
        }
      },
      (error) => {
        console.error('Error subscribing to game:', error);
        showAlert({ title: 'Erreur', message: 'Connexion perdue', type: 'error' });
      }
    );

    return () => {
      unsubscribe();
      SoundService.stopGameMusic();
    };
  }, [gameId, playerId, game]);

  const updateScreenMode = (gameData: QuizGame) => {
    if (!gameData.customQuestions || gameData.customQuestions.length === 0) {
      setMode('asking');
      return;
    }

    // Priorité 1: Répondre aux questions posées par l'autre joueur
    const unansweredQuestion = gameData.customQuestions.find(
      q => q.answeredBy === playerId && q.textAnswer === null
    );

    if (unansweredQuestion) {
      setMode('answering');
      setCurrentQuestion(unansweredQuestion);
      return;
    }

    // Priorité 2: Juger les réponses à mes questions
    const unjudgedQuestion = gameData.customQuestions.find(
      q => q.askedBy === playerId && q.textAnswer !== null && q.judgment === null
    );

    if (unjudgedQuestion) {
      setMode('judging');
      setCurrentQuestion(unjudgedQuestion);
      return;
    }

    // Priorité 3: Vérifier si le jeu est terminé (20 questions totales, toutes jugées)
    const totalQuestions = gameData.customQuestions.length;
    const allQuestionsJudged = gameData.customQuestions.every(q => q.judgment !== null);

    if (totalQuestions >= 20 && allQuestionsJudged) {
      // Terminer automatiquement le jeu
      handleFinishGame();
      setMode('waiting');
      return;
    }

    // Priorité 4: Vérifier si j'ai atteint ma limite de questions (10)
    const myQuestions = gameData.customQuestions.filter(q => q.askedBy === playerId);
    const otherPlayerQuestions = gameData.customQuestions.filter(q => q.askedBy !== playerId);

    // Vérifier si j'ai des questions en attente de réponse (non répondues OU non jugées)
    const myQuestionsWaitingResponse = myQuestions.filter(
      q => q.textAnswer === null || q.judgment === null
    );

    if (myQuestions.length >= 10) {
      // J'ai posé toutes mes questions, attendre l'autre joueur
      setMode('waiting');
    } else if (myQuestionsWaitingResponse.length > 0) {
      // J'ai des questions en attente, attendre que le cycle se termine
      setMode('waiting');
    } else if (otherPlayerQuestions.length < myQuestions.length) {
      // L'autre joueur est en retard, attendre qu'il pose ses questions
      setMode('waiting');
    } else {
      // Je peux poser une nouvelle question
      setMode('asking');
    }
  };

  const handleAskQuestion = async () => {
    if (!questionText.trim()) {
      showAlert({ title: 'Attention', message: 'Veuillez entrer une question', type: 'warning' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Play button click sound
      SoundService.playButtonClick();

      await QuizCoupleService.askCustomQuestion(gameId, playerId, questionText.trim());
      setQuestionText('');

      // Play success sound
      SoundService.playCorrectAnswer();

      // Animate transition
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error asking question:', error);
      SoundService.playWrongAnswer();
      showAlert({ title: 'Erreur', message: 'Impossible de poser la question', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerQuestion = async () => {
    if (!answerText.trim()) {
      showAlert({ title: 'Attention', message: 'Veuillez entrer une réponse', type: 'warning' });
      return;
    }

    if (!currentQuestion) return;

    setIsSubmitting(true);

    try {
      // Play button click sound
      SoundService.playButtonClick();

      await QuizCoupleService.answerCustomQuestion(
        gameId,
        playerId,
        currentQuestion.id,
        answerText.trim()
      );
      setAnswerText('');
      setCurrentQuestion(null);

      // Play success sound
      SoundService.playCorrectAnswer();

      // Animate transition
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error answering question:', error);
      SoundService.playWrongAnswer();
      showAlert({ title: 'Erreur', message: 'Impossible de soumettre la réponse', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJudgeAnswer = async (judgment: 'correct' | 'incorrect' | 'almost') => {
    if (!currentQuestion) return;

    setIsSubmitting(true);

    try {
      // Play sound based on judgment
      if (judgment === 'correct') {
        SoundService.playCorrectAnswer();
      } else if (judgment === 'almost') {
        SoundService.playButtonClick(); // Son neutre pour "presque"
      } else {
        SoundService.playWrongAnswer();
      }

      await QuizCoupleService.judgeCustomAnswer(
        gameId,
        playerId,
        currentQuestion.id,
        judgment
      );
      setCurrentQuestion(null);

      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error judging answer:', error);
      SoundService.playWrongAnswer();
      showAlert({ title: 'Erreur', message: 'Impossible de juger la réponse', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishGame = async () => {
    try {
      // Play victory sound
      SoundService.playCorrectAnswer();
      SoundService.stopGameMusic();

      await QuizCoupleService.finishGame(gameId);
    } catch (error) {
      console.error('Error finishing game:', error);
      SoundService.playWrongAnswer();
      showAlert({ title: 'Erreur', message: 'Impossible de terminer la partie', type: 'error' });
    }
  };

  if (!game || !game.players) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const currentPlayer = game.players.find(p => p.id === playerId);
  const otherPlayer = game.players.find(p => p.id !== playerId);

  const totalQuestions = game.customQuestions?.length || 0;
  const myQuestionsCount = game.customQuestions?.filter(q => q.askedBy === playerId).length || 0;
  const otherQuestionsCount = game.customQuestions?.filter(q => q.askedBy !== playerId).length || 0;
  const questionsAnswered = game.customQuestions?.filter(q => q.textAnswer !== null).length || 0;
  const questionsJudged = game.customQuestions?.filter(q => q.judgment !== null).length || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                <Text style={styles.headerTitle}>Mode Personnalisé</Text>
                <Text style={styles.questionCount}>
                  Questions: {totalQuestions} / 20 • Vous: {myQuestionsCount}/10
                </Text>
                <Text style={[styles.questionCount, { fontSize: 10, marginTop: 2 }]}>
                  Répondues: {questionsAnswered} • Jugées: {questionsJudged}
                </Text>
              </View>

              <View style={styles.placeholder} />
            </View>

            {/* Players Score */}
            <View style={styles.playersStatus}>
              {game.players.map((player) => (
                <View key={player.id} style={styles.playerCard}>
                  <View style={styles.playerAvatar}>
                    <AvatarDisplay
                      avatar={player.profile.avatar}
                      imageStyle={styles.avatarImage}
                      textStyle={styles.avatarEmoji}
                    />
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.profile.name}
                  </Text>
                  <Text style={styles.playerScore}>{player.score} pts</Text>
                </View>
              ))}
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                {/* ASKING MODE */}
                {mode === 'asking' && (
                  <View style={styles.modeContainer}>
                    <View style={styles.modeHeader}>
                      <Foundation name="pencil" size={40} color={currentTheme.romantic.primary} />
                      <Text style={styles.modeTitle}>Posez une question</Text>
                      <Text style={styles.modeSubtitle}>
                        {otherPlayer?.profile.name} va devoir y répondre
                      </Text>
                    </View>

                    <View style={styles.inputCard}>
                      <TextInput
                        style={styles.questionInput}
                        placeholder="Tapez votre question ici..."
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={questionText}
                        onChangeText={setQuestionText}
                        multiline
                        maxLength={200}
                        editable={!isSubmitting}
                      />
                      <Text style={styles.charCount}>
                        {questionText.length} / 200
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.primaryButton, !questionText.trim() && styles.buttonDisabled]}
                      onPress={handleAskQuestion}
                      disabled={!questionText.trim() || isSubmitting}
                    >
                      <Foundation name="check" size={24} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>
                        {isSubmitting ? 'Envoi...' : 'Envoyer la question'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ANSWERING MODE */}
                {mode === 'answering' && currentQuestion && (
                  <View style={styles.modeContainer}>
                    <View style={styles.modeHeader}>
                      <Foundation name="comment" size={40} color="#FF9800" />
                      <Text style={styles.modeTitle}>Répondez à la question</Text>
                      <Text style={styles.modeSubtitle}>
                        {otherPlayer?.profile.name} attend votre réponse
                      </Text>
                    </View>

                    <View style={styles.questionCard}>
                      <Text style={styles.questionLabel}>Question de {otherPlayer?.profile.name}:</Text>
                      <Text style={styles.questionDisplay}>{currentQuestion.text}</Text>
                    </View>

                    <View style={styles.inputCard}>
                      <TextInput
                        style={styles.answerInput}
                        placeholder="Tapez votre réponse ici..."
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={answerText}
                        onChangeText={setAnswerText}
                        multiline
                        maxLength={150}
                        editable={!isSubmitting}
                      />
                      <Text style={styles.charCount}>
                        {answerText.length} / 150
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.primaryButton, !answerText.trim() && styles.buttonDisabled]}
                      onPress={handleAnswerQuestion}
                      disabled={!answerText.trim() || isSubmitting}
                    >
                      <Foundation name="check" size={24} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>
                        {isSubmitting ? 'Envoi...' : 'Envoyer la réponse'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* JUDGING MODE */}
                {mode === 'judging' && currentQuestion && (
                  <View style={styles.modeContainer}>
                    <View style={styles.modeHeader}>
                      <Foundation name="clipboard-notes" size={40} color="#4CAF50" />
                      <Text style={styles.modeTitle}>Jugez la réponse</Text>
                      <Text style={styles.modeSubtitle}>
                        {otherPlayer?.profile.name} a répondu à votre question
                      </Text>
                    </View>

                    <View style={styles.questionCard}>
                      <Text style={styles.questionLabel}>Votre question:</Text>
                      <Text style={styles.questionDisplay}>{currentQuestion.text}</Text>
                    </View>

                    <View style={styles.answerCard}>
                      <Text style={styles.answerLabel}>Réponse de {otherPlayer?.profile.name}:</Text>
                      <Text style={styles.answerDisplay}>{currentQuestion.textAnswer}</Text>
                    </View>

                    <View style={styles.judgmentButtons}>
                      <TouchableOpacity
                        style={[styles.judgmentButton, styles.correctButton]}
                        onPress={() => handleJudgeAnswer('correct')}
                        disabled={isSubmitting}
                      >
                        <Foundation name="check" size={32} color="#FFFFFF" />
                        <Text style={styles.judgmentButtonText}>Correct</Text>
                        <Text style={styles.judgmentPoints}>+10 pts</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.judgmentButton, styles.almostButton]}
                        onPress={() => handleJudgeAnswer('almost')}
                        disabled={isSubmitting}
                      >
                        <Foundation name="burst" size={32} color="#FFFFFF" />
                        <Text style={styles.judgmentButtonText}>Presque</Text>
                        <Text style={styles.judgmentPoints}>+5 pts</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.judgmentButton, styles.incorrectButton]}
                        onPress={() => handleJudgeAnswer('incorrect')}
                        disabled={isSubmitting}
                      >
                        <Foundation name="x" size={32} color="#FFFFFF" />
                        <Text style={styles.judgmentButtonText}>Mauvais</Text>
                        <Text style={styles.judgmentPoints}>0 pts</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* WAITING MODE */}
                {mode === 'waiting' && (
                  <View style={styles.modeContainer}>
                    <View style={styles.modeHeader}>
                      <Foundation name="clock" size={40} color={currentTheme.romantic.primary} />
                      <Text style={styles.modeTitle}>En attente...</Text>
                      <Text style={styles.modeSubtitle}>
                        {(() => {
                          // Calculer les questions en attente de cycle complet
                          const myQuestionsWaitingResponse = game.customQuestions?.filter(
                            q => q.askedBy === playerId && (q.textAnswer === null || q.judgment === null)
                          ) || [];

                          if (myQuestionsCount >= 10 && otherQuestionsCount >= 10) {
                            return 'Toutes les questions ont été posées !';
                          } else if (myQuestionsCount >= 10) {
                            return `En attente de ${otherPlayer?.profile.name} (${otherQuestionsCount}/10 questions)`;
                          } else if (myQuestionsWaitingResponse.length > 0) {
                            return `En attente que ${otherPlayer?.profile.name} réponde à votre question`;
                          } else if (otherQuestionsCount < myQuestionsCount) {
                            return `${otherPlayer?.profile.name} doit poser sa question d'abord`;
                          } else {
                            return `${otherPlayer?.profile.name} est en train de répondre ou juger`;
                          }
                        })()}
                      </Text>
                    </View>

                    {/* Afficher les progrès */}
                    <View style={styles.progressCard}>
                      <Text style={styles.progressTitle}>Progrès de la partie</Text>
                      <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>Vous:</Text>
                        <Text style={styles.progressValue}>{myQuestionsCount}/10 questions posées</Text>
                      </View>
                      <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>{otherPlayer?.profile.name}:</Text>
                        <Text style={styles.progressValue}>{otherQuestionsCount}/10 questions posées</Text>
                      </View>
                      <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>Total:</Text>
                        <Text style={styles.progressValue}>{questionsJudged}/{totalQuestions} questions jugées</Text>
                      </View>
                    </View>

                    {/* Bouton terminer si tout est prêt */}
                    {totalQuestions >= 20 && questionsJudged >= 20 && (
                      <TouchableOpacity
                        style={styles.finishButton}
                        onPress={handleFinishGame}
                      >
                        <Foundation name="trophy" size={24} color="#FFFFFF" />
                        <Text style={styles.finishButtonText}>Voir les résultats</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Animated.View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    keyboardView: {
      flex: 1,
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
      alignItems: 'center',
      marginHorizontal: 15,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text.primary,
    },
    questionCount: {
      fontSize: 12,
      color: theme.text.secondary,
      marginTop: 2,
    },
    placeholder: {
      width: 40,
    },
    playersStatus: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    playerCard: {
      flex: 1,
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      padding: 12,
      alignItems: 'center',
    },
    playerAvatar: {
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
    playerName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 4,
    },
    playerScore: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.romantic.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    contentContainer: {
      flex: 1,
    },
    modeContainer: {
      gap: 20,
    },
    modeHeader: {
      alignItems: 'center',
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      padding: 24,
      gap: 12,
    },
    modeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text.primary,
      textAlign: 'center',
    },
    modeSubtitle: {
      fontSize: 16,
      color: theme.text.secondary,
      textAlign: 'center',
    },
    inputCard: {
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      padding: 16,
    },
    questionInput: {
      fontSize: 16,
      color: theme.text.primary,
      minHeight: 120,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    answerInput: {
      fontSize: 16,
      color: theme.text.primary,
      minHeight: 100,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    charCount: {
      fontSize: 12,
      color: theme.text.secondary,
      textAlign: 'right',
      marginTop: 8,
    },
    questionCard: {
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.romantic.primary,
      padding: 20,
      gap: 12,
    },
    questionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.secondary,
    },
    questionDisplay: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text.primary,
      lineHeight: 26,
    },
    answerCard: {
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#FF9800',
      padding: 20,
      gap: 12,
    },
    answerLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.secondary,
    },
    answerDisplay: {
      fontSize: 16,
      color: theme.text.primary,
      lineHeight: 24,
      fontStyle: 'italic',
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
    buttonDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      opacity: 0.5,
    },
    primaryButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    judgmentButtons: {
      gap: 12,
    },
    judgmentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      padding: 20,
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    correctButton: {
      backgroundColor: '#4CAF50',
    },
    almostButton: {
      backgroundColor: '#FF9800',
    },
    incorrectButton: {
      backgroundColor: '#F44336',
    },
    judgmentButtonText: {
      flex: 1,
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    judgmentPoints: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      opacity: 0.9,
    },
    finishButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFD700',
      borderRadius: 16,
      padding: 20,
      gap: 12,
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
    },
    finishButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#000000',
    },
    progressCard: {
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      padding: 20,
      gap: 12,
    },
    progressTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    progressLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.secondary,
    },
    progressValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.romantic.primary,
    },
  });

export default QuizCoupleCustomScreen;
