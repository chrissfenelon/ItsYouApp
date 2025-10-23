import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CurrentTheme } from '../../../constants/Themes';
import { Typography } from '../../../constants/Typography';
import FeedbackService from '../../../services/FeedbackService';
import { PUISSANCE4_CONFIG } from '../../../constants/Puissance4Constants';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { Puissance4Stakes } from '../../../types/puissance4.types';

const { width } = Dimensions.get('window');

const Puissance4ResultsScreen: React.FC<any> = ({ route, navigation }) => {
  const { winner, message, moveCount, winningLine, mode, difficulty, stakes, isWinner } = route.params || {};
  const { user } = useApp();

  const [rewardClaimed, setRewardClaimed] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animations d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation confetti si victoire
    if (winner !== 'draw') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    FeedbackService.success();
  }, []);

  const handleReplay = () => {
    FeedbackService.buttonPress();
    // Navigate back to mode selection to start a fresh game
    // First pop to the game screen, then navigate to mode
    navigation.reset({
      index: 0,
      routes: [{ name: 'puissance4Mode' }],
    });
  };

  const handleChangeMode = () => {
    FeedbackService.buttonPress();
    navigation.navigate('puissance4Mode');
  };

  const handleBackToMenu = () => {
    FeedbackService.buttonPress();
    // Navigate back to home screen instead of popping to top (which goes to login)
    navigation.navigate('home');
  };

  const handleClaimReward = () => {
    FeedbackService.success();
    setRewardClaimed(true);
    // TODO: Add animation or effect
  };

  const getStakesMessage = () => {
    if (!stakes || stakes.type === 'none' || winner === 'draw') return null;

    if (isWinner) {
      return {
        title: '🎉 Victoire !',
        description: `Ton partenaire devra : ${stakes.description}`,
        icon: 'trophy-award',
        color: '#FFD700',
      };
    } else {
      return {
        title: '💔 Tu as perdu...',
        description: `Tu devras : ${stakes.description}`,
        icon: 'emoticon-sad-outline',
        color: '#FF6B6B',
      };
    }
  };

  const stakesInfo = getStakesMessage();

  const winnerColor =
    winner === 'Rouge' ? PUISSANCE4_CONFIG.COLORS.ROUGE : winner === 'Jaune' ? PUISSANCE4_CONFIG.COLORS.JAUNE : CurrentTheme.text.muted;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.blurryOverlay}>
          {/* Confetti Animation */}
          {winner !== 'draw' && (
            <Animated.View
              style={[
                styles.confettiContainer,
                {
                  opacity: confettiAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 0.5, 0],
                  }),
                  transform: [
                    {
                      translateY: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -height],
                      }),
                    },
                  ],
                },
              ]}
            >
              {[...Array(20)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.confetti,
                    {
                      left: `${(i * 5) % 100}%`,
                      backgroundColor: i % 2 === 0 ? PUISSANCE4_CONFIG.COLORS.ROUGE : PUISSANCE4_CONFIG.COLORS.JAUNE,
                    },
                  ]}
                />
              ))}
            </Animated.View>
          )}

          {/* Content */}
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Result Card */}
            <View style={styles.resultCard}>
              <Text style={styles.emoji}>{message.emoji}</Text>
              <Text style={styles.title}>{message.title}</Text>
              <Text style={styles.message}>{message.message}</Text>

              {winner !== 'draw' && (
                <View style={[styles.winnerBadge, { backgroundColor: winnerColor }]}>
                  <MaterialCommunityIcons name="trophy" size={32} color="#FFFFFF" />
                </View>
              )}

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="counter" size={24} color="#FFFFFF" />
                  <Text style={styles.statValue}>{moveCount}</Text>
                  <Text style={styles.statLabel}>Coups</Text>
                </View>

                {mode === 'ai' && difficulty && (
                  <View style={styles.statBox}>
                    <MaterialCommunityIcons name="brain" size={24} color="#FFFFFF" />
                    <Text style={styles.statValue}>{difficulty}</Text>
                    <Text style={styles.statLabel}>Difficulté</Text>
                  </View>
                )}

                {winningLine && winningLine.length > 0 && (
                  <View style={styles.statBox}>
                    <MaterialCommunityIcons name="ray-start-arrow" size={24} color="#FFFFFF" />
                    <Text style={styles.statValue}>{winningLine.length}</Text>
                    <Text style={styles.statLabel}>Alignés</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stakes/Reward Card */}
            {stakesInfo && (
              <View style={[
                styles.stakesCard,
                { borderColor: stakesInfo.color + '40', backgroundColor: stakesInfo.color + '20' }
              ]}>
                <View style={styles.stakesHeader}>
                  <MaterialCommunityIcons
                    name={stakesInfo.icon as any}
                    size={32}
                    color={stakesInfo.color}
                  />
                  <Text style={styles.stakesTitle}>{stakesInfo.title}</Text>
                </View>
                <Text style={styles.stakesDescription}>{stakesInfo.description}</Text>

                {isWinner && !rewardClaimed && (
                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={handleClaimReward}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      style={styles.claimButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <MaterialCommunityIcons name="gift" size={20} color="#FFFFFF" />
                      <Text style={styles.claimButtonText}>Réclamer ma récompense !</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {isWinner && rewardClaimed && (
                  <View style={styles.claimedBadge}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.claimedText}>Récompense réclamée ! ✨</Text>
                  </View>
                )}

                {!isWinner && (
                  <View style={styles.forfeitBadge}>
                    <Text style={styles.forfeitText}>
                      N'oublie pas de tenir ta promesse 😊
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={handleReplay}>
                <LinearGradient
                  colors={[CurrentTheme.romantic.primary, CurrentTheme.romantic.secondary]}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="refresh" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Rejouer</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleChangeMode}>
                <View style={styles.actionButtonBlur}>
                  <MaterialCommunityIcons name="swap-horizontal" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    Changer de Mode
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleBackToMenu}>
                <View style={styles.actionButtonBlur}>
                  <MaterialCommunityIcons name="home" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    Menu Principal
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CurrentTheme.background,
  },
  backgroundImage: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
  blurryOverlay: {
    flex: 1,
    backgroundColor: CurrentTheme.glassmorphism.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    ...Typography.styles.largeTitle,
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    ...Typography.styles.body,
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  winnerBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.styles.largeTitle,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    ...Typography.styles.footnote,
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  stakesCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    alignItems: 'center',
  },
  stakesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stakesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stakesDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.95,
  },
  claimButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    width: '100%',
    marginTop: 8,
  },
  claimButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  claimedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
  },
  forfeitBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginTop: 8,
  },
  forfeitText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonBlur: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionButtonText: {
    ...Typography.styles.headline,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Puissance4ResultsScreen;
