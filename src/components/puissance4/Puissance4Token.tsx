import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { PUISSANCE4_CONFIG } from '../../constants/Puissance4Constants';
import { CellValue } from '../../types/puissance4.types';

interface Puissance4TokenProps {
  color: CellValue;
  isWinning?: boolean;
  dropAnimation?: boolean;
  dropDelay?: number;
  photoUrl?: string | null;
}

const Puissance4Token: React.FC<Puissance4TokenProps> = ({
  color,
  isWinning = false,
  dropAnimation = false,
  dropDelay = 0,
  photoUrl = null,
}) => {
  const scaleAnim = useRef(new Animated.Value(dropAnimation ? 0 : 1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (dropAnimation) {
      // Animation de chute avec rebond
      Animated.sequence([
        Animated.delay(dropDelay),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: PUISSANCE4_CONFIG.ANIMATIONS.BOUNCE_TENSION,
          friction: PUISSANCE4_CONFIG.ANIMATIONS.BOUNCE_FRICTION,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(rotateAnim, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [dropAnimation, dropDelay]);

  useEffect(() => {
    if (isWinning) {
      // Animation de pulsation pour les jetons gagnants
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: PUISSANCE4_CONFIG.ANIMATIONS.WIN_HIGHLIGHT_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: PUISSANCE4_CONFIG.ANIMATIONS.WIN_HIGHLIGHT_DURATION,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isWinning]);

  if (!color) {
    return null;
  }

  const tokenColor =
    color === 'Rouge'
      ? PUISSANCE4_CONFIG.COLORS.ROUGE
      : PUISSANCE4_CONFIG.COLORS.JAUNE;

  const glowColor =
    color === 'Rouge'
      ? PUISSANCE4_CONFIG.COLORS.ROUGE_GLOW
      : PUISSANCE4_CONFIG.COLORS.JAUNE_GLOW;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }, { rotate: rotation }],
        },
      ]}
    >
      {isWinning && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: glowColor,
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.token,
          {
            backgroundColor: photoUrl ? '#FFFFFF' : tokenColor,
          },
        ]}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.photoImage}
            resizeMode="cover"
          />
        ) : (
          <>
            <View style={styles.highlight} />
            <View style={styles.shadow} />
          </>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  token: {
    width: '85%',
    height: '85%',
    borderRadius: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: '35%',
    height: '35%',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  shadow: {
    position: 'absolute',
    bottom: '10%',
    left: '10%',
    right: '10%',
    height: '20%',
    borderRadius: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
  },
});

export default Puissance4Token;
