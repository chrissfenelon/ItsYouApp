import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  onComplete?: () => void;
  progress: number;
  message: string;
}
  

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const progressBarWidth = useRef(new Animated.Value(0)).current;

  const loadingMessages = [
    'Chargement des photos...',
    'Chargement de la musique...',
    'Chargement des notes...',
    'Chargement des messages...',
    'Presque prêt...',
  ];

  useEffect(() => {
    // Initial logo animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Start message rotation and progress
    let messageIndex = 0;
    let currentProgress = 0;

    const messageInterval = setInterval(() => {
      // Fade out current message
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Update message
        messageIndex++;
        if (messageIndex >= loadingMessages.length) {
          clearInterval(messageInterval);

          // Complete loading
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(logoOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(messageOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ]).start(() => {
              onComplete?.();
            });
          }, 400);
          return;
        }

        setCurrentMessageIndex(messageIndex);

        // Fade in new message
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 1400); // Change message every 1.4 seconds

    // Smooth progress bar animation
    const progressInterval = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);

      Animated.timing(progressBarWidth, {
        toValue: currentProgress,
        duration: 100,
        useNativeDriver: false,
      }).start();

      if (currentProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 70); // 100 steps * 70ms = 7 seconds total

    // Show first message
    setTimeout(() => {
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 800);
    
    

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const progressWidth = progressBarWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Background Image covering the entire screen */}
      <ImageBackground
        source={require('../assets/logo/intrologo.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark overlay for better text visibility */}
        <View style={styles.overlay} />

        {/* Logo - Centered */}
        <View style={styles.centerContent}>
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }}
          >
            <Image
              source={require('../assets/logo/applogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Loading Text and Progress - Bottom */}
        <View style={styles.bottomContent}>
          <Animated.Text
            style={[
              styles.loadingText,
              {
                opacity: messageOpacity,
              },
            ]}
          >
            {loadingMessages[currentMessageIndex]}
          </Animated.Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>

          {/* Progress Percentage */}
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // Light overlay for better text visibility
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0,
    height: width * 0,
    aspectRatio: 0,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    minHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  progressBarContainer: {
    width: width * 0.75,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF69B4',
    borderRadius: 3,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  progressText: {
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default LoadingScreen;
