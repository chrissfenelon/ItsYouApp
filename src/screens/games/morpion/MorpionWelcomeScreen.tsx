import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { BlurView } from '@react-native-community/blur';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import SoundService from '../../../services/SoundService';
import MorpionPlayerSetupScreen from './MorpionPlayerSetupScreen';
import { DareButton } from '../../../components/DareButton';
import { MorpionSettingsScreen } from './MorpionSettingsScreen';

const { width, height } = Dimensions.get('window');

const MorpionWelcomeScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);

  // State
  const [showSettings, setShowSettings] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [titleSlideAnim] = useState(new Animated.Value(-100));
  const [subtitleSlideAnim] = useState(new Animated.Value(100));
  const [buttonSlideAnim] = useState(new Animated.Value(200));

  useEffect(() => {
    // Start welcome animation sequence
    startWelcomeAnimation();
    // Play welcome sound
    SoundService.playGameStart();
  }, []);

  const startWelcomeAnimation = () => {
    // Fade in background
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Logo animation sequence
    Animated.sequence([
      // Scale in logo
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      // Rotate logo slightly
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Title slides
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleSlideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleSlideAnim, {
          toValue: 0,
          duration: 700,
          delay: 200,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // Button slide in
    setTimeout(() => {
      Animated.timing(buttonSlideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();
    }, 1000);

    // Start pulse animation for logo
    startPulseAnimation();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleStart = () => {
    SoundService.playButtonClick();
    navigateToScreen('morpionBoardSize', { MorpionPlayerSetupScreen });
  };

  const handleBack = () => {
    SoundService.playButtonClick();
    navigateToScreen('games');
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  // Animated morpion grid component
  const AnimatedMorpionLogo = () => (
    <Animated.View
      style={[
        styles.logoContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <BlurView style={styles.logoBlur} blurType="dark" blurAmount={10}>
        <View style={styles.logoGlass} />
      </BlurView>

      <View style={styles.morpionGrid}>
        {/* Grid bars - horizontal */}
        <View style={[styles.gridBar, styles.horizontalBar, styles.topBar]} />
        <View style={[styles.gridBar, styles.horizontalBar, styles.bottomBar]} />

        {/* Grid bars - vertical */}
        <View style={[styles.gridBar, styles.verticalBar, styles.leftBar]} />
        <View style={[styles.gridBar, styles.verticalBar, styles.rightBar]} />

        {/* Sample X and O pieces */}
        <View style={[styles.logoCell, styles.topLeft]}>
          <Text style={styles.logoX}>×</Text>
        </View>
        <View style={[styles.logoCell, styles.center]}>
          <Text style={styles.logoO}>○</Text>
        </View>
        <View style={[styles.logoCell, styles.bottomRight]}>
          <Text style={styles.logoX}>×</Text>
        </View>
      </View>
    </Animated.View>
  );

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
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Foundation name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => {
                  SoundService.playButtonClick();
                  setShowSettings(true);
                }}
              >
                <Foundation name="widget" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <DareButton
                gameType="morpion"
                variant="icon"
                iconSize={24}
                showLabel={false}
              />
            </View>
          </View>

          {/* Main content */}
          <View style={styles.content}>
            {/* Animated Logo */}
            <AnimatedMorpionLogo />

            {/* Title */}
            <Animated.View
              style={[
                styles.titleContainer,
                { transform: [{ translateY: titleSlideAnim }] },
              ]}
            >
              <Text style={styles.gameTitle}>MORPION</Text>
              <Text style={styles.gameTitleShadow}>MORPION</Text>
            </Animated.View>

            {/* Subtitle */}
            <Animated.View
              style={[
                styles.subtitleContainer,
                { transform: [{ translateY: subtitleSlideAnim }] },
              ]}
            >
              <Text style={styles.subtitle}>Jeu de stratégie classique</Text>
              <Text style={styles.subsubtitle}>Défiez votre intelligence tactique</Text>
            </Animated.View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Start Button */}
            <Animated.View
              style={[
                styles.buttonContainer,
                { transform: [{ translateY: buttonSlideAnim }] },
              ]}
            >
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStart}
                activeOpacity={0.8}
              >
                <BlurView style={styles.buttonBlur} blurType="light" blurAmount={20}>
                  <View style={styles.buttonGlass} />
                </BlurView>

                <View style={styles.buttonContent}>
                  <Foundation name="play" size={24} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>Commencer</Text>
                  <Foundation name="arrow-right" size={20} color="rgba(255, 255, 255, 0.8)" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Version info */}
            <Animated.View
              style={[
                styles.versionContainer,
                { opacity: fadeAnim },
              ]}
            >
              <Text style={styles.versionText}>Version Pro • ItsYouApp</Text>
            </Animated.View>
          </View>
        </View>
      </ImageBackground>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSettings(false)}
      >
        <MorpionSettingsScreen onBack={() => setShowSettings(false)} />
      </Modal>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  settingsButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    width: 180,
    height: 180,
    borderRadius: 30,
    marginBottom: 40,
    shadowColor: 'rgba(255, 105, 180, 0.8)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  logoBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
  logoGlass: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 105, 180, 0.4)',
  },
  morpionGrid: {
    position: 'absolute',
    top: 30,
    left: 30,
    right: 30,
    bottom: 30,
  },
  gridBar: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 2,
    shadowColor: 'rgba(255, 105, 180, 0.8)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  horizontalBar: {
    height: 4,
    left: 0,
    right: 0,
  },
  verticalBar: {
    width: 4,
    top: 0,
    bottom: 0,
  },
  topBar: {
    top: '33%',
  },
  bottomBar: {
    bottom: '33%',
  },
  leftBar: {
    left: '33%',
  },
  rightBar: {
    right: '33%',
  },
  logoCell: {
    position: 'absolute',
    width: '33%',
    height: '33%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  center: {
    top: '33%',
    left: '33%',
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  logoX: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textShadowColor: 'rgba(255, 107, 107, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  logoO: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4ECDC4',
    textShadowColor: 'rgba(78, 205, 196, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gameTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 8,
    textShadowColor: 'rgba(255, 105, 180, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    zIndex: 2,
  },
  gameTitleShadow: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: 'bold',
    color: 'rgba(255, 105, 180, 0.3)',
    textAlign: 'center',
    letterSpacing: 8,
    transform: [{ translateY: 3 }, { translateX: 2 }],
    zIndex: 1,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subsubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
  startButton: {
    height: 70,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(255, 105, 180, 0.6)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buttonGlass: {
    flex: 1,
    backgroundColor: 'rgba(255, 105, 180, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.6)',
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 15,
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  versionContainer: {
    marginBottom: 30,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default MorpionWelcomeScreen;