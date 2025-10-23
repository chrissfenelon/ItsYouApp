import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { WORD_SEARCH_COLORS } from '../../data/constants/colors';
import { Difficulty } from '../../types/wordSearch.types';
import { DIFFICULTY_CONFIGS } from '../../data/constants/gameRules';

interface DifficultySelectionScreenProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onBack: () => void;
}

const difficultyInfo: Record<Difficulty, { icon: string; color: string; description: string }> = {
  easy: {
    icon: '🟢',
    color: WORD_SEARCH_COLORS.difficultyEasy,
    description: 'Parfait pour débuter',
  },
  medium: {
    icon: '🟡',
    color: WORD_SEARCH_COLORS.difficultyMedium,
    description: 'Un défi modéré',
  },
  hard: {
    icon: '🟠',
    color: WORD_SEARCH_COLORS.difficultyHard,
    description: 'Teste tes compétences',
  },
  expert: {
    icon: '🔴',
    color: WORD_SEARCH_COLORS.difficultyExpert,
    description: 'Pour les vrais maîtres',
  },
};

const DifficultySelectionScreen: React.FC<DifficultySelectionScreenProps> = ({
  onSelectDifficulty,
  onBack,
}) => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Choisis la Difficulté</Text>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {difficulties.map((difficulty) => {
            const config = DIFFICULTY_CONFIGS[difficulty];
            const info = difficultyInfo[difficulty];

            return (
              <TouchableOpacity
                key={difficulty}
                style={[styles.difficultyCard, { borderColor: info.color }]}
                onPress={() => onSelectDifficulty(difficulty)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.difficultyIcon}>{info.icon}</Text>
                  <Text style={[styles.difficultyName, { color: info.color }]}>
                    {difficulty.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.description}>{info.description}</Text>

                <View style={styles.statsContainer}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Grille</Text>
                    <Text style={styles.statValue}>{config.gridSize}×{config.gridSize}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Mots</Text>
                    <Text style={styles.statValue}>{config.wordCount}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Temps</Text>
                    <Text style={styles.statValue}>{Math.floor(config.timeLimit / 60)}m</Text>
                  </View>
                </View>

                <View style={styles.rewardsContainer}>
                  <View style={styles.reward}>
                    <Text style={styles.rewardIcon}>🪙</Text>
                    <Text style={styles.rewardValue}>{config.coinReward}</Text>
                  </View>
                  <View style={styles.reward}>
                    <Text style={styles.rewardIcon}>⭐</Text>
                    <Text style={styles.rewardValue}>{config.xpReward} XP</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
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
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: WORD_SEARCH_COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
  difficultyCard: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  difficultyIcon: {
    fontSize: 32,
  },
  difficultyName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: WORD_SEARCH_COLORS.background,
    borderRadius: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  rewardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardIcon: {
    fontSize: 20,
  },
  rewardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
});

export default DifficultySelectionScreen;
