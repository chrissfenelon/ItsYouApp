import React, { useRef, useEffect } from 'react';
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
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { DareButton } from '../../../components/DareButton';

const { width } = Dimensions.get('window');

interface ModeOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string[];
  emoji: string;
}

const MODES: ModeOption[] = [
  {
    id: 'ai',
    title: 'Jouer contre l\'IA',
    subtitle: 'Affrontez une intelligence artificielle',
    icon: 'robot',
    gradient: ['#667eea', '#764ba2'],
    emoji: '🤖',
  },
  {
    id: 'local',
    title: 'Multijoueur Local',
    subtitle: 'Jouez à deux sur le même appareil',
    icon: 'account-multiple',
    gradient: ['#f093fb', '#f5576c'],
    emoji: '👥',
  },
  {
    id: 'online',
    title: 'Multijoueur En Ligne',
    subtitle: 'Affrontez un adversaire en ligne',
    icon: 'web',
    gradient: ['#4facfe', '#00f2fe'],
    emoji: '🌐',
  },
  {
    id: 'stats',
    title: 'Statistiques',
    subtitle: 'Consultez vos statistiques',
    icon: 'chart-line',
    gradient: ['#fa709a', '#fee140'],
    emoji: '📊',
  },
];

const Puissance4ModeScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useApp();
  const fadeAnims = useRef(MODES.map(() => new Animated.Value(0))).current;
  const scaleAnims = useRef(MODES.map(() => new Animated.Value(0.8))).current;

  useEffect(() => {
    // Animation d'entrée en cascade
    const animations = MODES.map((_, index) =>
      Animated.parallel([
        Animated.timing(fadeAnims[index], {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnims[index], {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: index * 150,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(100, animations).start();
  }, []);

  const handleModePress = (modeId: string) => {
    FeedbackService.selection();

    switch (modeId) {
      case 'ai':
        navigation.navigate('puissance4AIDifficulty');
        break;
      case 'local':
        navigation.navigate('puissance4Game', {
          mode: 'local',
          players: [
            { id: 'player1', name: 'Joueur 1', color: 'Rouge' },
            { id: 'player2', name: 'Joueur 2', color: 'Jaune' },
          ],
        });
        break;
      case 'online':
        navigation.navigate('puissance4Online');
        break;
      case 'stats':
        // TODO: Implement stats screen
        FeedbackService.error();
        break;
    }
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

            <Text style={styles.title}>🔴🟡 Puissance 4</Text>

            <DareButton
              gameType="puissance4"
              variant="icon"
              iconSize={22}
              showLabel={false}
            />
          </View>

          {/* Mode Cards */}
          <ScrollView
            style={styles.modesContainer}
            contentContainerStyle={styles.modesContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroSection}>
              <Text style={styles.subtitle}>Choisissez un mode de jeu</Text>
            </View>

            {MODES.map((mode, index) => (
              <Animated.View
                key={mode.id}
                style={[
                  styles.modeCardWrapper,
                  {
                    opacity: fadeAnims[index],
                    transform: [{ scale: scaleAnims[index] }],
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleModePress(mode.id)}
                >
                  <View style={styles.modeCard}>
                    <View style={styles.modeContent}>
                      <Text style={styles.modeEmoji}>{mode.emoji}</Text>

                      <View style={styles.modeTextContainer}>
                        <Text style={styles.modeTitle}>{mode.title}</Text>
                        <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
                      </View>

                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={CurrentTheme.text.primary}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
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
    ...CurrentTheme.shadows.small,
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
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    ...Typography.styles.body,
    color: CurrentTheme.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  modesContainer: {
    flex: 1,
  },
  modesContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modeCardWrapper: {
    marginBottom: 16,
  },
  modeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  modeEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    ...Typography.styles.headline,
    color: CurrentTheme.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modeSubtitle: {
    ...Typography.styles.footnote,
    color: CurrentTheme.text.secondary,
    fontSize: 14,
  },
});

export default Puissance4ModeScreen;
