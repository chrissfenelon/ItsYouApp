import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useApp } from '../../context/AppContext';

interface MorpionCellProps {
  value: string;
  isWinning?: boolean;
  isHighlighted?: boolean;
  currentPlayer?: 'X' | 'O';
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const MorpionCell: React.FC<MorpionCellProps> = ({
  value,
  isWinning = false,
  isHighlighted = false,
  currentPlayer = 'X',
  size = 'large',
  style,
}) => {
  const { currentTheme } = useApp();
  const styles = createStyles(currentTheme, size);

  // Animation references
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const winningAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate value appearance
    if (value) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          easing: Easing.elastic(1.5),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
      ]).start();

      // Rotation animation for value
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.elastic(1.1),
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animations when cell is cleared
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [value]);

  useEffect(() => {
    // Winning cell animation
    if (isWinning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(winningAnim, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(winningAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      winningAnim.setValue(1);
    }
  }, [isWinning]);

  useEffect(() => {
    // Highlight animation for empty cells
    if (isHighlighted && !value) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(highlightAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(highlightAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      highlightAnim.setValue(0);
    }
  }, [isHighlighted, value]);

  useEffect(() => {
    // Pulse animation for current player preview
    if (isHighlighted && !value) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isHighlighted, value]);

  const getValueColor = () => {
    if (value === 'X') {
      return isWinning ? '#FF4444' : '#FF6B6B';
    } else if (value === 'O') {
      return isWinning ? '#00D4AA' : '#4ECDC4';
    }
    return 'rgba(255, 255, 255, 0.3)';
  };

  const getPreviewColor = () => {
    return currentPlayer === 'X' ? 'rgba(255, 107, 107, 0.4)' : 'rgba(78, 205, 196, 0.4)';
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', value === 'X' ? '15deg' : '-10deg'],
  });

  const highlightOpacity = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.cellContainer,
          {
            transform: [
              { scale: Animated.multiply(pulseAnim, winningAnim) },
            ],
          },
        ]}
      >
        {/* Cell Background */}
        <BlurView style={styles.cellBlur} blurType="dark" blurAmount={10}>
          <View
            style={[
              styles.cellGlass,
              isWinning && {
                borderColor: getValueColor(),
                backgroundColor: `${getValueColor()}20`,
              },
            ]}
          />
        </BlurView>

        {/* Highlight overlay for empty cells */}
        {isHighlighted && !value && (
          <Animated.View
            style={[
              styles.highlightOverlay,
              {
                opacity: highlightOpacity,
                backgroundColor: getPreviewColor(),
              },
            ]}
          />
        )}

        {/* Preview symbol for current player */}
        {isHighlighted && !value && (
          <View style={styles.previewContainer}>
            <Text
              style={[
                styles.previewSymbol,
                { color: getPreviewColor() },
              ]}
            >
              {currentPlayer}
            </Text>
          </View>
        )}

        {/* Actual value */}
        {value && (
          <Animated.View
            style={[
              styles.valueContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotateInterpolate },
                ],
              },
            ]}
          >
            <Text
              style={[
                styles.cellValue,
                {
                  color: getValueColor(),
                  textShadowColor: `${getValueColor()}80`,
                },
                isWinning && styles.winningValue,
              ]}
            >
              {value}
            </Text>

            {/* Winning glow effect */}
            {isWinning && (
              <View
                style={[
                  styles.winningGlow,
                  { backgroundColor: `${getValueColor()}40` },
                ]}
              />
            )}
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const createStyles = (theme: any, size: 'small' | 'medium' | 'large') => {
  const getSizeDimensions = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: 24,
          borderRadius: 12,
          padding: 8,
        };
      case 'medium':
        return {
          fontSize: 32,
          borderRadius: 16,
          padding: 10,
        };
      case 'large':
      default:
        return {
          fontSize: 42,
          borderRadius: 20,
          padding: 12,
        };
    }
  };

  const { fontSize, borderRadius, padding } = getSizeDimensions();

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    cellContainer: {
      flex: 1,
      borderRadius,
      overflow: 'hidden',
    },
    cellBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    cellGlass: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    highlightOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    previewContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewSymbol: {
      fontSize: fontSize * 0.7,
      fontWeight: '300',
      opacity: 0.6,
    },
    valueContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cellValue: {
      fontSize,
      fontWeight: 'bold',
      textAlign: 'center',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
      zIndex: 2,
    },
    winningValue: {
      shadowColor: 'rgba(255, 255, 255, 0.8)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 12,
      elevation: 8,
    },
    winningGlow: {
      position: 'absolute',
      top: -5,
      left: -5,
      right: -5,
      bottom: -5,
      borderRadius: borderRadius + 5,
      opacity: 0.6,
      zIndex: 1,
    },
  });
};

export default MorpionCell;