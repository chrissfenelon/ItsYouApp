import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { WORD_SEARCH_COLORS } from '../../../data/constants/colors';

interface WordFoundAnimationProps {
  word: string;
  isBonus?: boolean;
  onComplete: () => void;
}

const WordFoundAnimation: React.FC<WordFoundAnimationProps> = ({ word, isBonus = false, onComplete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation en 2 étapes
    Animated.sequence([
      // 1. Apparition avec zoom
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // 2. Disparition vers le haut
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -100,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete();
    });
  }, [scaleAnim, opacityAnim, translateYAnim, onComplete]);

  const emoji = isBonus ? '💎' : '✨';
  const label = isBonus ? 'Mot Bonus Caché !' : 'Mot Trouvé !';
  const borderColor = isBonus ? '#FFD700' : WORD_SEARCH_COLORS.primary;
  const wordColor = isBonus ? '#FFD700' : WORD_SEARCH_COLORS.primary;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
      ]}
    >
      <View style={[styles.content, { borderColor }]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.word, { color: wordColor }]}>{word}</Text>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={[styles.label, isBonus && styles.bonusLabel]}>{label}</Text>
      {isBonus && (
        <Text style={styles.bonusSubtext}>+Récompense Spéciale!</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: WORD_SEARCH_COLORS.primary,
  },
  emoji: {
    fontSize: 24,
  },
  word: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.primary,
    marginHorizontal: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginTop: 8,
  },
  bonusLabel: {
    color: '#FFD700',
    fontSize: 16,
  },
  bonusSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 4,
  },
});

export default WordFoundAnimation;
