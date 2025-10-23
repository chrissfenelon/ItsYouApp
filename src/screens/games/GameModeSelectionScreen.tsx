import React, { useState } from 'react';
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
import { AIDifficulty, AIPersonality } from '../../types/games';
import { MorpionAIService } from '../../services/MorpionAIService';
import SoundService from '../../services/SoundService';

const { width, height } = Dimensions.get('window');

interface GameModeSelectionScreenProps {
  navigation?: any;
}

export const GameModeSelectionScreen: React.FC<GameModeSelectionScreenProps> = ({ navigation }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);

  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('medium');
  const [selectedPersonality, setSelectedPersonality] = useState<AIPersonality>('balanced');

  const difficultyLevels: { level: AIDifficulty; icon: string; color: string }[] = [
    { level: 'easy', icon: 'happy-face', color: '#4CAF50' },
    { level: 'medium', icon: 'neutral-face', color: '#FF9800' },
    { level: 'hard', icon: 'sad-face', color: '#F44336' },
    { level: 'expert', icon: 'skull', color: '#9C27B0' },
  ];

  const personalities: { type: AIPersonality; icon: string; color: string }[] = [
    { type: 'aggressive', icon: 'burst', color: '#F44336' },
    { type: 'defensive', icon: 'shield', color: '#2196F3' },
    { type: 'balanced', icon: 'graph-trend', color: '#4CAF50' },
  ];

  const handlePlayMultiplayer = () => {
    SoundService.playButtonClick();
    navigateToScreen('morpion', { gameMode: 'multiplayer' });
  };

  const handlePlayAI = () => {
    SoundService.playButtonClick();
    navigateToScreen('morpion', {
      gameMode: 'ai',
      aiDifficulty: selectedDifficulty,
      aiPersonality: selectedPersonality,
    });
  };

  const handleBackPress = () => {
    SoundService.playButtonClick();
    navigateToScreen('games');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Mode de Jeu</Text>

            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Multiplayer Mode */}
            <View style={styles.modeSection}>
              <Text style={styles.sectionTitle}>🔥 Multijoueur</Text>
              <TouchableOpacity style={styles.multiplayerCard} onPress={handlePlayMultiplayer}>
                <View style={styles.cardHeader}>
                  <Foundation name="heart" size={32} color="#FF69B4" />
                  <Text style={styles.cardTitle}>Jouer avec Orlie</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Défiez Orlie dans une partie en temps réel avec des messages personnalisés !
                </Text>
                <View style={styles.cardFeatures}>
                  <Text style={styles.feature}>• Partie en temps réel</Text>
                  <Text style={styles.feature}>• Messages de victoire drôles</Text>
                  <Text style={styles.feature}>• Statistiques partagées</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* AI Mode */}
            <View style={styles.modeSection}>
              <Text style={styles.sectionTitle}>🤖 Intelligence Artificielle</Text>

              {/* Difficulty Selection */}
              <View style={styles.settingsCard}>
                <Text style={styles.settingsTitle}>Niveau de Difficulté</Text>
                <View style={styles.optionsGrid}>
                  {difficultyLevels.map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty.level}
                      style={[
                        styles.optionButton,
                        selectedDifficulty === difficulty.level && styles.optionButtonSelected,
                        { borderColor: difficulty.color }
                      ]}
                      onPress={() => {
                        SoundService.playButtonClick();
                        setSelectedDifficulty(difficulty.level);
                      }}
                    >
                      <Foundation
                        name={difficulty.icon}
                        size={24}
                        color={selectedDifficulty === difficulty.level ? '#FFFFFF' : difficulty.color}
                      />
                      <Text style={[
                        styles.optionText,
                        selectedDifficulty === difficulty.level && styles.optionTextSelected
                      ]}>
                        {difficulty.level.charAt(0).toUpperCase() + difficulty.level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.descriptionText}>
                  {MorpionAIService.getDifficultyDescription(selectedDifficulty)}
                </Text>
              </View>

              {/* Personality Selection */}
              <View style={styles.settingsCard}>
                <Text style={styles.settingsTitle}>Personnalité de l'IA</Text>
                <View style={styles.optionsGrid}>
                  {personalities.map((personality) => (
                    <TouchableOpacity
                      key={personality.type}
                      style={[
                        styles.optionButton,
                        selectedPersonality === personality.type && styles.optionButtonSelected,
                        { borderColor: personality.color }
                      ]}
                      onPress={() => {
                        SoundService.playButtonClick();
                        setSelectedPersonality(personality.type);
                      }}
                    >
                      <Foundation
                        name={personality.icon}
                        size={24}
                        color={selectedPersonality === personality.type ? '#FFFFFF' : personality.color}
                      />
                      <Text style={[
                        styles.optionText,
                        selectedPersonality === personality.type && styles.optionTextSelected
                      ]}>
                        {personality.type.charAt(0).toUpperCase() + personality.type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.descriptionText}>
                  {MorpionAIService.getPersonalityDescription(selectedPersonality)}
                </Text>
              </View>

              {/* Start AI Game Button */}
              <TouchableOpacity style={styles.aiGameButton} onPress={handlePlayAI}>
                <Foundation name="laptop" size={24} color="#FFFFFF" />
                <Text style={styles.aiGameButtonText}>Jouer contre l'IA</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    ...theme.shadows.button,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text.primary,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modeSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  multiplayerCard: {
    backgroundColor: theme.background.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF69B4',
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 15,
    lineHeight: 20,
  },
  cardFeatures: {
    gap: 5,
  },
  feature: {
    fontSize: 12,
    color: theme.text.secondary,
    opacity: 0.8,
  },
  settingsCard: {
    backgroundColor: theme.background.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    ...theme.shadows.card,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 10,
    marginBottom: 15,
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: theme.background.secondary,
    minWidth: 85,
    gap: 8,
  },
  optionButtonSelected: {
    backgroundColor: theme.romantic.primary,
    borderColor: theme.romantic.primary,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.text.primary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  descriptionText: {
    fontSize: 12,
    color: theme.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  aiGameButton: {
    backgroundColor: theme.romantic.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...theme.shadows.button,
  },
  aiGameButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default GameModeSelectionScreen;