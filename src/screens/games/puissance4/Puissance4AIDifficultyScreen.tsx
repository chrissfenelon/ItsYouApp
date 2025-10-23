import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CurrentTheme } from '../../../constants/Themes';
import { Typography } from '../../../constants/Typography';
import FeedbackService from '../../../services/FeedbackService';
import { AI_LEVEL_CONFIG, PUISSANCE4_CONFIG } from '../../../constants/Puissance4Constants';
import { AIDifficulty } from '../../../types/puissance4.types';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';

const { width } = Dimensions.get('window');

interface DifficultyCardProps {
  difficulty: AIDifficulty;
  isSelected: boolean;
  onPress: () => void;
  animValue: Animated.Value;
}

const DifficultyCard: React.FC<DifficultyCardProps> = ({
  difficulty,
  isSelected,
  onPress,
  animValue,
}) => {
  const config = AI_LEVEL_CONFIG[difficulty];
  const thinkDuration = PUISSANCE4_CONFIG.AI.THINK_DURATION[difficulty];

  return (
    <Animated.View
      style={[
        styles.difficultyCardWrapper,
        {
          opacity: animValue,
          transform: [
            {
              scale: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <View
          style={[
            styles.difficultyCard,
            isSelected && styles.difficultyCardSelected,
          ]}
        >
          {isSelected && (
            <View style={[styles.selectedBorder, { borderColor: config.color }]} />
          )}

          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: config.color + '20' }]}>
              <Text style={styles.iconEmoji}>{config.icon}</Text>
            </View>
            {isSelected && (
              <View style={[styles.checkMark, { backgroundColor: config.color }]}>
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              </View>
            )}
          </View>

          <Text style={styles.difficultyName}>{config.name}</Text>
          <Text style={styles.difficultyDescription}>{config.description}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <MaterialCommunityIcons
                name="brain"
                size={16}
                color={CurrentTheme.text.muted}
              />
              <Text style={styles.statText}>
                Profondeur: {PUISSANCE4_CONFIG.AI.MINIMAX_DEPTH[difficulty]}
              </Text>
            </View>
            <View style={styles.statRow}>
              <MaterialCommunityIcons
                name="timer"
                size={16}
                color={CurrentTheme.text.muted}
              />
              <Text style={styles.statText}>~{thinkDuration}ms de réflexion</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Puissance4AIDifficultyScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useApp();
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('moyen');
  const [selectedColor, setSelectedColor] = useState<'Rouge' | 'Jaune'>('Rouge');

  const fadeAnims = useRef(
    ['facile', 'moyen', 'difficile', 'expert'].map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Animation d'entrée
    const animations = fadeAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      })
    );

    Animated.stagger(80, animations).start();
  }, []);

  const handleStart = () => {
    FeedbackService.success();
    navigation.navigate('puissance4Game', {
      mode: 'ai',
      difficulty: selectedDifficulty,
      playerColor: selectedColor,
      players: [
        { id: 'player1', name: 'Vous', color: selectedColor },
        {
          id: 'ai',
          name: `IA ${AI_LEVEL_CONFIG[selectedDifficulty].name}`,
          color: selectedColor === 'Rouge' ? 'Jaune' : 'Rouge',
        },
      ],
    });
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                FeedbackService.buttonPress();
                navigation.goBack();
              }}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={20}
                color={CurrentTheme.text.primary}
              />
            </TouchableOpacity>

            <Text style={styles.title}>🤖 Difficulté de l'IA</Text>

            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
        {/* Difficulty Cards */}
        <View style={styles.difficultiesContainer}>
          {(['facile', 'moyen', 'difficile', 'expert'] as AIDifficulty[]).map(
            (difficulty, index) => (
              <DifficultyCard
                key={difficulty}
                difficulty={difficulty}
                isSelected={selectedDifficulty === difficulty}
                onPress={() => {
                  FeedbackService.selection();
                  setSelectedDifficulty(difficulty);
                }}
                animValue={fadeAnims[index]}
              />
            )
          )}
        </View>

        {/* Color Selection */}
        <View style={styles.colorSection}>
          <Text style={styles.sectionTitle}>Choisissez votre couleur</Text>
          <View style={styles.colorButtons}>
            <TouchableOpacity
              style={styles.colorButton}
              onPress={() => {
                FeedbackService.selection();
                setSelectedColor('Rouge');
              }}
            >
              <View
                style={[
                  styles.colorButtonBlur,
                  selectedColor === 'Rouge' && styles.colorButtonSelected,
                ]}
              >
                {selectedColor === 'Rouge' && (
                  <View style={[styles.selectedBorder, { borderColor: '#FF4757' }]} />
                )}
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: PUISSANCE4_CONFIG.COLORS.ROUGE },
                  ]}
                />
                <Text style={styles.colorText}>Rouge</Text>
                <Text style={styles.colorSubtext}>Vous commencez</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.colorButton}
              onPress={() => {
                FeedbackService.selection();
                setSelectedColor('Jaune');
              }}
            >
              <View
                style={[
                  styles.colorButtonBlur,
                  selectedColor === 'Jaune' && styles.colorButtonSelected,
                ]}
              >
                {selectedColor === 'Jaune' && (
                  <View style={[styles.selectedBorder, { borderColor: '#FFA502' }]} />
                )}
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: PUISSANCE4_CONFIG.COLORS.JAUNE },
                  ]}
                />
                <Text style={styles.colorText}>Jaune</Text>
                <Text style={styles.colorSubtext}>L'IA commence</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
          </ScrollView>

          {/* Start Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.startButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.startButtonText}>Commencer la Partie</Text>
                <MaterialCommunityIcons name="play" size={24} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CurrentTheme.background,
  },
  backgroundImage: {
    flex: 1,
    width: width,
  },
  blurryOverlay: {
    flex: 1,
    backgroundColor: CurrentTheme.glassmorphism.background,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: CurrentTheme.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  difficultiesContainer: {
    marginBottom: 30,
  },
  difficultyCardWrapper: {
    marginBottom: 16,
  },
  difficultyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  difficultyCardSelected: {
    borderWidth: 0,
  },
  selectedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  checkMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyName: {
    ...Typography.styles.headline,
    color: CurrentTheme.text.primary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  difficultyDescription: {
    ...Typography.styles.body,
    color: CurrentTheme.text.secondary,
    fontSize: 14,
    marginBottom: 12,
  },
  statsContainer: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    ...Typography.styles.footnote,
    color: CurrentTheme.text.muted,
    fontSize: 12,
  },
  colorSection: {
    marginTop: 10,
  },
  sectionTitle: {
    ...Typography.styles.headline,
    color: CurrentTheme.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  colorButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    flex: 1,
  },
  colorButtonBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  colorButtonSelected: {
    borderWidth: 0,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  colorText: {
    ...Typography.styles.headline,
    color: CurrentTheme.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  colorSubtext: {
    ...Typography.styles.footnote,
    color: CurrentTheme.text.muted,
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  startButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  startButtonText: {
    ...Typography.styles.headline,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Puissance4AIDifficultyScreen;
