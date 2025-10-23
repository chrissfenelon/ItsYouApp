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
import { QuizGame, QuizQuestion, QuizOption } from '../../types/quizCouple.types';
import { AvatarDisplay } from '../../utils/avatarUtils';
import { QUIZ_CATEGORIES } from '../../data/quiz/categories';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface QuizCoupleAnswersScreenProps {
  route?: {
    params?: {
      gameId: string;
      playerId: string;
    };
  };
}

export const QuizCoupleAnswersScreen: React.FC<QuizCoupleAnswersScreenProps> = ({ route }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const { gameId, playerId } = route?.params || {};

  const [game, setGame] = useState<QuizGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'same' | 'different'>('all');

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
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
      },
      (error) => {
        console.error('Error loading game:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  };

  if (loading || !game) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const player1 = game.players[0];
  const player2 = game.players[1];

  // Filter questions based on answer match
  const filteredQuestions = game.questions.filter((question, index) => {
    const player1Answer = player1.answers[index];
    const player2Answer = player2.answers[index];

    if (!player1Answer || !player2Answer) return false;

    const sameAnswer = player1Answer.answerId === player2Answer.answerId;

    if (filter === 'same') return sameAnswer;
    if (filter === 'different') return !sameAnswer;
    return true;
  });

  const getAnswerText = (question: QuizQuestion, answerId: string): string => {
    const option = question.options.find(opt => opt.id === answerId);
    return option?.text || 'N/A';
  };

  const getCategoryInfo = (categoryId: string) => {
    return QUIZ_CATEGORIES.find(c => c.id === categoryId);
  };

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
            <TouchableOpacity style={styles.backButton} onPress={() => navigateToScreen('quizCoupleResults', { gameId, playerId })}>
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Réponses Détaillées</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                Toutes ({game.questions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filter === 'same' && styles.filterTabActive]}
              onPress={() => setFilter('same')}
            >
              <Foundation name="check" size={14} color={filter === 'same' ? '#FFFFFF' : currentTheme.text.secondary} />
              <Text style={[styles.filterTabText, filter === 'same' && styles.filterTabTextActive]}>
                Identiques
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filter === 'different' && styles.filterTabActive]}
              onPress={() => setFilter('different')}
            >
              <Foundation name="x" size={14} color={filter === 'different' ? '#FFFFFF' : currentTheme.text.secondary} />
              <Text style={[styles.filterTabText, filter === 'different' && styles.filterTabTextActive]}>
                Différentes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Players Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={styles.playerLegendAvatar}>
                <AvatarDisplay
                  avatar={player1.profile.avatar}
                  imageStyle={styles.legendAvatarImage}
                  textStyle={styles.legendAvatarEmoji}
                />
              </View>
              <Text style={styles.legendName} numberOfLines={1}>{player1.profile.name}</Text>
            </View>

            <View style={styles.legendDivider} />

            <View style={styles.legendItem}>
              <View style={styles.playerLegendAvatar}>
                <AvatarDisplay
                  avatar={player2.profile.avatar}
                  imageStyle={styles.legendAvatarImage}
                  textStyle={styles.legendAvatarEmoji}
                />
              </View>
              <Text style={styles.legendName} numberOfLines={1}>{player2.profile.name}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredQuestions.map((question, index) => {
              const questionIndex = game.questions.indexOf(question);
              const player1Answer = player1.answers[questionIndex];
              const player2Answer = player2.answers[questionIndex];

              const sameAnswer = player1Answer?.answerId === player2Answer?.answerId;
              const category = getCategoryInfo(question.categoryId);

              return (
                <View key={question.id} style={styles.answerCard}>
                  {/* Question Header */}
                  <View style={styles.answerHeader}>
                    <View style={styles.questionNumber}>
                      <Text style={styles.questionNumberText}>Q{questionIndex + 1}</Text>
                    </View>

                    {category && (
                      <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
                        <Foundation name={category.icon as any} size={12} color="#FFFFFF" />
                        <Text style={styles.categoryBadgeText}>{category.name}</Text>
                      </View>
                    )}

                    <View style={[styles.matchBadge, sameAnswer ? styles.matchBadgeSame : styles.matchBadgeDifferent]}>
                      <Foundation
                        name={sameAnswer ? 'check' : 'x'}
                        size={14}
                        color="#FFFFFF"
                      />
                      <Text style={styles.matchBadgeText}>
                        {sameAnswer ? 'Identique' : 'Différent'}
                      </Text>
                    </View>
                  </View>

                  {/* Question Text */}
                  <Text style={styles.questionText}>{question.text}</Text>

                  {/* Answers Comparison */}
                  <View style={styles.answersContainer}>
                    {/* Player 1 Answer */}
                    <View style={[styles.answerItem, sameAnswer && styles.answerItemSame]}>
                      <View style={styles.answerPlayerHeader}>
                        <View style={styles.answerPlayerAvatar}>
                          <AvatarDisplay
                            avatar={player1.profile.avatar}
                            imageStyle={styles.answerAvatarImage}
                            textStyle={styles.answerAvatarEmoji}
                          />
                        </View>
                        <Text style={styles.answerPlayerName} numberOfLines={1}>
                          {player1.profile.name}
                        </Text>
                      </View>
                      <Text style={styles.answerText}>
                        {getAnswerText(question, player1Answer?.answerId || '')}
                      </Text>
                      {player1Answer?.points > 0 && (
                        <View style={styles.pointsBadge}>
                          <Foundation name="star" size={10} color="#FFD700" />
                          <Text style={styles.pointsText}>+{player1Answer.points} pts</Text>
                        </View>
                      )}
                    </View>

                    {/* Player 2 Answer */}
                    <View style={[styles.answerItem, sameAnswer && styles.answerItemSame]}>
                      <View style={styles.answerPlayerHeader}>
                        <View style={styles.answerPlayerAvatar}>
                          <AvatarDisplay
                            avatar={player2.profile.avatar}
                            imageStyle={styles.answerAvatarImage}
                            textStyle={styles.answerAvatarEmoji}
                          />
                        </View>
                        <Text style={styles.answerPlayerName} numberOfLines={1}>
                          {player2.profile.name}
                        </Text>
                      </View>
                      <Text style={styles.answerText}>
                        {getAnswerText(question, player2Answer?.answerId || '')}
                      </Text>
                      {player2Answer?.points > 0 && (
                        <View style={styles.pointsBadge}>
                          <Foundation name="star" size={10} color="#FFD700" />
                          <Text style={styles.pointsText}>+{player2Answer.points} pts</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Time Spent */}
                  <View style={styles.timeContainer}>
                    <View style={styles.timeItem}>
                      <Foundation name="clock" size={12} color={currentTheme.text.secondary} />
                      <Text style={styles.timeText}>
                        {player1Answer?.timeSpent.toFixed(1)}s
                      </Text>
                    </View>
                    <View style={styles.timeDivider} />
                    <View style={styles.timeItem}>
                      <Foundation name="clock" size={12} color={currentTheme.text.secondary} />
                      <Text style={styles.timeText}>
                        {player2Answer?.timeSpent.toFixed(1)}s
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {filteredQuestions.length === 0 && (
              <View style={styles.emptyState}>
                <Foundation name="page-search" size={60} color={currentTheme.text.secondary} />
                <Text style={styles.emptyStateText}>
                  {filter === 'same' && 'Aucune réponse identique trouvée'}
                  {filter === 'different' && 'Aucune réponse différente trouvée'}
                </Text>
              </View>
            )}
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
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text.primary,
    },
    placeholder: {
      width: 40,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 15,
      gap: 8,
    },
    filterTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      paddingVertical: 10,
      paddingHorizontal: 12,
      gap: 6,
    },
    filterTabActive: {
      backgroundColor: theme.romantic.primary,
      borderColor: theme.romantic.primary,
    },
    filterTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text.secondary,
    },
    filterTabTextActive: {
      color: '#FFFFFF',
    },
    legendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 15,
      padding: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    legendItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    playerLegendAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    legendAvatarImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    legendAvatarEmoji: {
      fontSize: 20,
    },
    legendName: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.primary,
    },
    legendDivider: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      marginHorizontal: 12,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 16,
    },
    answerCard: {
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      padding: 16,
      gap: 12,
    },
    answerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    questionNumber: {
      backgroundColor: theme.romantic.primary,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    questionNumberText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    matchBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
      marginLeft: 'auto',
    },
    matchBadgeSame: {
      backgroundColor: 'rgba(76, 175, 80, 0.3)',
    },
    matchBadgeDifferent: {
      backgroundColor: 'rgba(244, 67, 54, 0.3)',
    },
    matchBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    questionText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text.primary,
      lineHeight: 22,
    },
    answersContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    answerItem: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      padding: 12,
      gap: 8,
    },
    answerItemSame: {
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    answerPlayerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    answerPlayerAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    answerAvatarImage: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    answerAvatarEmoji: {
      fontSize: 14,
    },
    answerPlayerName: {
      flex: 1,
      fontSize: 11,
      fontWeight: '600',
      color: theme.text.secondary,
    },
    answerText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text.primary,
      lineHeight: 20,
    },
    pointsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      gap: 4,
      marginTop: 4,
    },
    pointsText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FFD700',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    timeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timeText: {
      fontSize: 12,
      color: theme.text.secondary,
    },
    timeDivider: {
      width: 1,
      height: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      gap: 16,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.text.secondary,
      textAlign: 'center',
    },
  });

export default QuizCoupleAnswersScreen;
