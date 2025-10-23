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
  Animated,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { BlurView } from '@react-native-community/blur';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { AIDifficulty, AIPersonality } from '../../../types/games';
import { MorpionAIService } from '../../../services/MorpionAIService';
import SoundService from '../../../services/SoundService';

const { width, height } = Dimensions.get('window');

interface DifficultyLevel {
  level: AIDifficulty;
  name: string;
  description: string;
  icon: string;
  color: string;
  winRate: string;
  features: string[];
}

interface PersonalityType {
  type: AIPersonality;
  name: string;
  description: string;
  icon: string;
  color: string;
  traits: string[];
}

interface MorpionAISettingsScreenProps {
  route?: {
    params?: {
      playerName?: string;
      boardSize?: number;
      winCondition?: number;
    };
  };
}

const MorpionAISettingsScreen: React.FC<MorpionAISettingsScreenProps> = ({ route }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const boardSize = route?.params?.boardSize || 3;
  const winCondition = route?.params?.winCondition || 3;
  const playerName = route?.params?.playerName || user?.name || 'Joueur 1';

  // State
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('medium');
  const [selectedPersonality, setSelectedPersonality] = useState<AIPersonality>('balanced');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const difficulties: DifficultyLevel[] = [
    {
      level: 'easy',
      name: 'Facile',
      description: 'L\'IA fait parfois des erreurs stratégiques pour vous laisser gagner',
      icon: 'happy-face',
      color: '#4CAF50',
      winRate: '30%',
      features: ['Erreurs intentionnelles', 'Coups sous-optimaux', 'Idéal pour débuter'],
    },
    {
      level: 'medium',
      name: 'Moyen',
      description: 'Un équilibre parfait entre défi et amusement',
      icon: 'neutral-face',
      color: '#FF9800',
      winRate: '60%',
      features: ['Stratégie équilibrée', 'Quelques erreurs', 'Recommandé'],
    },
    {
      level: 'hard',
      name: 'Difficile',
      description: 'L\'IA joue de manière très stratégique avec de rares erreurs',
      icon: 'sad-face',
      color: '#F44336',
      winRate: '85%',
      features: ['Très peu d\'erreurs', 'Stratégie avancée', 'Défi élevé'],
    },
    {
      level: 'expert',
      name: 'Expert',
      description: 'L\'IA joue parfaitement - presque impossible à battre',
      icon: 'skull',
      color: '#9C27B0',
      winRate: '98%',
      features: ['Jeu parfait', 'Algorithme Minimax', 'Défi ultime'],
    },
  ];

  const personalities: PersonalityType[] = [
    {
      type: 'aggressive',
      name: 'Agressif',
      description: 'Privilégie l\'attaque et cherche constamment à gagner',
      icon: 'burst',
      color: '#F44336',
      traits: ['Attaque active', 'Prise de risques', 'Coups offensifs'],
    },
    {
      type: 'defensive',
      name: 'Défensif',
      description: 'Se concentre sur le blocage de vos tentatives de victoire',
      icon: 'shield',
      color: '#2196F3',
      traits: ['Blocage prioritaire', 'Jeu sécurisé', 'Coups défensifs'],
    },
    {
      type: 'balanced',
      name: 'Équilibré',
      description: 'Alterne intelligemment entre attaque et défense',
      icon: 'graph-trend',
      color: '#4CAF50',
      traits: ['Stratégie mixte', 'Adaptation', 'Jeu polyvalent'],
    },
  ];

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    SoundService.playButtonClick();
  }, []);

  const handleDifficultySelect = (difficulty: AIDifficulty) => {
    SoundService.playButtonClick();
    setSelectedDifficulty(difficulty);
  };

  const handlePersonalitySelect = (personality: AIPersonality) => {
    SoundService.playButtonClick();
    setSelectedPersonality(personality);
  };

  const handleStartGame = () => {
    SoundService.playGameStart();
    navigateToScreen('morpionGame', {
      gameMode: 'ai',
      aiDifficulty: selectedDifficulty,
      aiPersonality: selectedPersonality,
      playerName,
      boardSize,
      winCondition,
    });
  };

  const handleBack = () => {
    SoundService.playButtonClick();
    navigateToScreen('morpionGameMode', {
      playerName,
      boardSize,
      winCondition,
    });
  };

  const renderDifficultyCard = (difficulty: DifficultyLevel) => (
    <TouchableOpacity
      key={difficulty.level}
      style={[
        styles.optionCard,
        selectedDifficulty === difficulty.level && styles.selectedCard,
      ]}
      onPress={() => handleDifficultySelect(difficulty.level)}
      activeOpacity={0.8}
    >
      <BlurView style={styles.cardBlur} blurType="dark" blurAmount={15}>
        <View
          style={[
            styles.cardGlass,
            selectedDifficulty === difficulty.level && {
              borderColor: difficulty.color,
              backgroundColor: `${difficulty.color}15`,
            },
          ]}
        />
      </BlurView>

      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.optionIcon, { backgroundColor: `${difficulty.color}20` }]}>
            <Foundation name={difficulty.icon} size={28} color={difficulty.color} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.optionTitle}>{difficulty.name}</Text>
            <Text style={[styles.winRateText, { color: difficulty.color }]}>
              Taux de victoire IA: {difficulty.winRate}
            </Text>
          </View>
          {selectedDifficulty === difficulty.level && (
            <View style={[styles.selectedBadge, { backgroundColor: difficulty.color }]}>
              <Foundation name="check" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.optionDescription}>{difficulty.description}</Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {difficulty.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Foundation name="check" size={12} color={difficulty.color} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPersonalityCard = (personality: PersonalityType) => (
    <TouchableOpacity
      key={personality.type}
      style={[
        styles.optionCard,
        selectedPersonality === personality.type && styles.selectedCard,
      ]}
      onPress={() => handlePersonalitySelect(personality.type)}
      activeOpacity={0.8}
    >
      <BlurView style={styles.cardBlur} blurType="dark" blurAmount={15}>
        <View
          style={[
            styles.cardGlass,
            selectedPersonality === personality.type && {
              borderColor: personality.color,
              backgroundColor: `${personality.color}15`,
            },
          ]}
        />
      </BlurView>

      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.optionIcon, { backgroundColor: `${personality.color}20` }]}>
            <Foundation name={personality.icon} size={28} color={personality.color} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.optionTitle}>{personality.name}</Text>
          </View>
          {selectedPersonality === personality.type && (
            <View style={[styles.selectedBadge, { backgroundColor: personality.color }]}>
              <Foundation name="check" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.optionDescription}>{personality.description}</Text>

        {/* Traits */}
        <View style={styles.featuresContainer}>
          {personality.traits.map((trait, index) => (
            <View key={index} style={styles.featureItem}>
              <Foundation name="check" size={12} color={personality.color} />
              <Text style={styles.featureText}>{trait}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const selectedDifficultyData = difficulties.find(d => d.level === selectedDifficulty);
  const selectedPersonalityData = personalities.find(p => p.type === selectedPersonality);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Foundation name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Configuration IA</Text>

              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* AI Preview */}
              <View style={styles.aiPreviewSection}>
                <Text style={styles.sectionTitle}>🤖 Aperçu de votre adversaire IA</Text>

                <View style={styles.aiPreviewCard}>
                  <BlurView style={styles.previewBlur} blurType="light" blurAmount={20}>
                    <View style={styles.previewGlass} />
                  </BlurView>

                  <View style={styles.previewContent}>
                    <View style={styles.aiAvatar}>
                      <Foundation name="laptop" size={32} color="#2196F3" />
                    </View>
                    <View style={styles.aiInfo}>
                      <Text style={styles.aiName}>Intelligence Artificielle</Text>
                      <Text style={styles.aiConfig}>
                        {selectedDifficultyData?.name} • {selectedPersonalityData?.name}
                      </Text>
                      <Text style={styles.aiDescription}>
                        {MorpionAIService.getAIDescription(selectedDifficulty, selectedPersonality)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Difficulty Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚡ Niveau de Difficulté</Text>
                <Text style={styles.sectionDescription}>
                  Choisissez le niveau de challenge souhaité
                </Text>

                <View style={styles.optionsContainer}>
                  {difficulties.map(difficulty => renderDifficultyCard(difficulty))}
                </View>
              </View>

              {/* Personality Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎭 Style de Jeu</Text>
                <Text style={styles.sectionDescription}>
                  Définissez la stratégie de l'IA
                </Text>

                <View style={styles.optionsContainer}>
                  {personalities.map(personality => renderPersonalityCard(personality))}
                </View>
              </View>

              <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Start Game Button */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartGame}
                activeOpacity={0.8}
              >
                <BlurView style={styles.startButtonBlur} blurType="light" blurAmount={20}>
                  <View style={styles.startButtonGlass} />
                </BlurView>

                <View style={styles.startButtonContent}>
                  <Foundation name="play" size={24} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>Commencer la Partie</Text>
                  <Foundation name="arrow-right" size={20} color="rgba(255, 255, 255, 0.8)" />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  contentContainer: {
    flex: 1,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  aiPreviewSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  aiPreviewCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  previewGlass: {
    flex: 1,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  aiAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  aiInfo: {
    flex: 1,
  },
  aiName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiConfig: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 8,
    fontWeight: '500',
  },
  aiDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 30,
  },
  optionsContainer: {
    gap: 15,
  },
  optionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 140,
  },
  selectedCard: {
    shadowColor: 'rgba(255, 105, 180, 0.6)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cardBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardGlass: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 15,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardHeaderText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  winRateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: 15,
  },
  featuresContainer: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  bottomPadding: {
    height: 100,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  startButton: {
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(76, 175, 80, 0.6)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  startButtonGlass: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.6)',
  },
  startButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MorpionAISettingsScreen;