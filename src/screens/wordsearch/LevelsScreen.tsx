import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { WORD_SEARCH_COLORS } from '../../data/constants/colors';
import { LEVELS, isLevelUnlocked, LevelDefinition } from '../../data/levels';
import { WORLDS } from '../../data/levels/worlds';
import { useProfile } from '../../hooks/storage/useProfile';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 3; // 3 cards per row with padding

interface LevelsScreenProps {
  onSelectLevel: (level: LevelDefinition) => void;
  onBack: () => void;
}

const difficultyColors = {
  easy: WORD_SEARCH_COLORS.difficultyEasy,
  medium: WORD_SEARCH_COLORS.difficultyMedium,
  hard: WORD_SEARCH_COLORS.difficultyHard,
  expert: WORD_SEARCH_COLORS.difficultyExpert,
};

const difficultyIcons = {
  easy: '🟢',
  medium: '🟡',
  hard: '🟠',
  expert: '🔴',
};

const LevelsScreen: React.FC<LevelsScreenProps> = ({ onSelectLevel, onBack }) => {
  const { profile } = useProfile();
  const [selectedWorld, setSelectedWorld] = useState<number>(1);

  const selectedWorldData = WORLDS.find(w => w.id === selectedWorld);
  const worldLevels = LEVELS.filter(
    level =>
      selectedWorldData &&
      level.id >= selectedWorldData.startLevel &&
      level.id <= selectedWorldData.endLevel
  );

  const completedLevels = profile?.completedLevels || [];
  const currentCoins = profile?.coins || 0;

  const renderLevelCard = (level: LevelDefinition) => {
    const isCompleted = completedLevels.includes(level.id);
    const isUnlocked = isLevelUnlocked(level.id, completedLevels, currentCoins);
    const difficultyColor = difficultyColors[level.difficulty];

    return (
      <TouchableOpacity
        key={level.id}
        style={[
          styles.levelCard,
          { borderColor: difficultyColor },
          !isUnlocked && styles.lockedCard,
        ]}
        onPress={() => isUnlocked && onSelectLevel(level)}
        disabled={!isUnlocked}
      >
        {/* Level number badge */}
        <View style={[styles.levelBadge, { backgroundColor: difficultyColor }]}>
          <Text style={styles.levelNumber}>{level.id}</Text>
        </View>

        {/* Completed checkmark */}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedIcon}>✓</Text>
          </View>
        )}

        {/* Lock icon for locked levels */}
        {!isUnlocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}

        {/* Level name */}
        <Text
          style={[styles.levelName, !isUnlocked && styles.lockedText]}
          numberOfLines={2}
        >
          {level.name}
        </Text>

        {/* Difficulty icon */}
        <Text style={styles.difficultyIcon}>{difficultyIcons[level.difficulty]}</Text>

        {/* Rewards */}
        <View style={styles.rewards}>
          <View style={styles.reward}>
            <Text style={styles.rewardIcon}>🪙</Text>
            <Text style={styles.rewardText}>{level.coinReward}</Text>
          </View>
          <View style={styles.reward}>
            <Text style={styles.rewardIcon}>⭐</Text>
            <Text style={styles.rewardText}>{level.xpReward}</Text>
          </View>
        </View>

        {/* Unlock requirement */}
        {!isUnlocked && level.unlockRequirement && (
          <View style={styles.requirement}>
            {level.unlockRequirement.level && (
              <Text style={styles.requirementText}>
                🔓 Niveau {level.unlockRequirement.level}
              </Text>
            )}
            {level.unlockRequirement.coins && (
              <Text style={styles.requirementText}>
                💰 {level.unlockRequirement.coins}🪙
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Niveaux</Text>
          <View style={styles.coinDisplay}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinCount}>{currentCoins}</Text>
          </View>
        </View>

        {/* World selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.worldSelector}
          contentContainerStyle={styles.worldSelectorContent}
        >
          {WORLDS.map(world => {
            const isSelected = selectedWorld === world.id;
            const worldLevelsList = LEVELS.filter(
              level => level.id >= world.startLevel && level.id <= world.endLevel
            );
            const completedInWorld = worldLevelsList.filter(level =>
              completedLevels.includes(level.id)
            ).length;
            const totalInWorld = worldLevelsList.length;

            return (
              <TouchableOpacity
                key={world.id}
                style={[styles.worldCard, isSelected && styles.worldCardSelected]}
                onPress={() => setSelectedWorld(world.id)}
              >
                <Text style={styles.worldIcon}>{world.icon}</Text>
                <Text
                  style={[styles.worldName, isSelected && styles.worldNameSelected]}
                >
                  {world.name}
                </Text>
                <Text style={styles.worldProgress}>
                  {completedInWorld}/{totalInWorld}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Level grid */}
        <ScrollView
          style={styles.levelGrid}
          contentContainerStyle={styles.levelGridContent}
        >
          <View style={styles.levelsContainer}>{worldLevels.map(renderLevelCard)}</View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: WORD_SEARCH_COLORS.primary,
    fontWeight: '600',
  },
  title: {
    flex: 2,
    fontSize: 28,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    textAlign: 'center',
  },
  coinDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  coinIcon: {
    fontSize: 20,
  },
  coinCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  worldSelector: {
    maxHeight: 110,
    marginBottom: 15,
  },
  worldSelectorContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  worldCard: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 16,
    padding: 15,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  worldCardSelected: {
    borderColor: WORD_SEARCH_COLORS.primary,
    backgroundColor: WORD_SEARCH_COLORS.primary + '15',
  },
  worldIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  worldName: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 3,
  },
  worldNameSelected: {
    color: WORD_SEARCH_COLORS.primary,
  },
  worldProgress: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  levelGrid: {
    flex: 1,
  },
  levelGridContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  levelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  levelCard: {
    width: CARD_WIDTH,
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 3,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedCard: {
    opacity: 0.6,
  },
  levelBadge: {
    position: 'absolute',
    top: -8,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  levelNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  completedIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    zIndex: 10,
  },
  lockIcon: {
    fontSize: 40,
  },
  levelName: {
    fontSize: 14,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginTop: 25,
    marginBottom: 8,
    minHeight: 40,
    textAlign: 'center',
  },
  lockedText: {
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  difficultyIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  rewards: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 4,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rewardIcon: {
    fontSize: 14,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  requirement: {
    marginTop: 6,
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 10,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
});

export default LevelsScreen;
