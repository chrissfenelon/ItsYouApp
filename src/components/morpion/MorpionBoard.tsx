import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import MorpionCell from './MorpionCell';
import { useApp } from '../../context/AppContext';
import SoundService from '../../services/SoundService';

const { width } = Dimensions.get('window');

interface MorpionBoardProps {
  board: string[];
  onCellPress: (index: number) => void;
  disabled?: boolean;
  winningCombination?: number[] | null;
  currentPlayer?: 'X' | 'O';
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const MorpionBoard: React.FC<MorpionBoardProps> = ({
  board,
  onCellPress,
  disabled = false,
  winningCombination = null,
  currentPlayer = 'X',
  size = 'large',
  style,
}) => {
  const { currentTheme } = useApp();
  const styles = createStyles(currentTheme, size);

  // Animation references
  const boardScaleAnim = useRef(new Animated.Value(0.8)).current;
  const gridBarAnimations = useRef(
    Array.from({ length: 4 }, () => new Animated.Value(0))
  ).current;
  const boardRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial board entrance animation
    Animated.sequence([
      Animated.timing(boardScaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.stagger(100, [
        ...gridBarAnimations.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          })
        ),
      ]),
    ]).start();

    // Subtle continuous rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(boardRotateAnim, {
          toValue: 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(boardRotateAnim, {
          toValue: 0,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Animate winning combination
    if (winningCombination) {
      const pulseAnimation = Animated.sequence([
        Animated.timing(boardScaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(boardScaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);

      Animated.loop(pulseAnimation, { iterations: 3 }).start();
    }
  }, [winningCombination]);

  const handleCellPress = (index: number) => {
    if (disabled || board[index] !== '') return;

    SoundService.playButtonClick();
    onCellPress(index);

    // Cell press feedback animation
    Animated.sequence([
      Animated.timing(boardScaleAnim, {
        toValue: 0.98,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(boardScaleAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.elastic(1.1),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const boardRotation = boardRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '0.5deg'],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.boardContainer,
          {
            transform: [
              { scale: boardScaleAnim },
              { rotate: boardRotation },
            ],
          },
        ]}
      >
        {/* Board Background */}
        <BlurView style={styles.boardBlur} blurType="dark" blurAmount={15}>
          <View style={styles.boardGlass} />
        </BlurView>

        {/* Grid Lines */}
        <View style={styles.gridContainer}>
          {/* Horizontal lines */}
          <Animated.View
            style={[
              styles.gridBar,
              styles.horizontalBar,
              styles.topHorizontalBar,
              { opacity: gridBarAnimations[0] },
            ]}
          >
            <BlurView style={styles.barBlur} blurType="light" blurAmount={10}>
              <View style={styles.barGlow} />
            </BlurView>
          </Animated.View>

          <Animated.View
            style={[
              styles.gridBar,
              styles.horizontalBar,
              styles.bottomHorizontalBar,
              { opacity: gridBarAnimations[1] },
            ]}
          >
            <BlurView style={styles.barBlur} blurType="light" blurAmount={10}>
              <View style={styles.barGlow} />
            </BlurView>
          </Animated.View>

          {/* Vertical lines */}
          <Animated.View
            style={[
              styles.gridBar,
              styles.verticalBar,
              styles.leftVerticalBar,
              { opacity: gridBarAnimations[2] },
            ]}
          >
            <BlurView style={styles.barBlur} blurType="light" blurAmount={10}>
              <View style={styles.barGlow} />
            </BlurView>
          </Animated.View>

          <Animated.View
            style={[
              styles.gridBar,
              styles.verticalBar,
              styles.rightVerticalBar,
              { opacity: gridBarAnimations[3] },
            ]}
          >
            <BlurView style={styles.barBlur} blurType="light" blurAmount={10}>
              <View style={styles.barGlow} />
            </BlurView>
          </Animated.View>
        </View>

        {/* Game Cells */}
        <View style={styles.cellsContainer}>
          {board.map((value, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const isWinningCell = winningCombination?.includes(index);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.cellWrapper,
                  {
                    top: row * (styles.cellWrapper.height + styles.cellWrapper.margin),
                    left: col * (styles.cellWrapper.width + styles.cellWrapper.margin),
                  },
                ]}
                onPress={() => handleCellPress(index)}
                disabled={disabled || value !== ''}
                activeOpacity={0.8}
              >
                <MorpionCell
                  value={value}
                  isWinning={isWinningCell}
                  isHighlighted={!disabled && value === '' && !winningCombination}
                  currentPlayer={currentPlayer}
                  size={size}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Winning Line Overlay */}
        {winningCombination && (
          <View style={styles.winningLineContainer}>
            {/* Add winning line animation here if needed */}
          </View>
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
          boardSize: Math.min(width * 0.6, 240),
          cellSize: Math.min(width * 0.6, 240) / 3.5,
          borderRadius: 16,
          padding: 15,
        };
      case 'medium':
        return {
          boardSize: Math.min(width * 0.75, 300),
          cellSize: Math.min(width * 0.75, 300) / 3.5,
          borderRadius: 20,
          padding: 20,
        };
      case 'large':
      default:
        return {
          boardSize: Math.min(width * 0.85, 340),
          cellSize: Math.min(width * 0.85, 340) / 3.5,
          borderRadius: 24,
          padding: 25,
        };
    }
  };

  const { boardSize, cellSize, borderRadius, padding } = getSizeDimensions();
  const cellMargin = padding / 5;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    boardContainer: {
      width: boardSize,
      height: boardSize,
      borderRadius,
      shadowColor: 'rgba(255, 105, 180, 0.6)',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 12,
    },
    boardBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius,
    },
    boardGlass: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 105, 180, 0.3)',
    },
    gridContainer: {
      position: 'absolute',
      top: padding,
      left: padding,
      right: padding,
      bottom: padding,
    },
    gridBar: {
      position: 'absolute',
      borderRadius: 2,
      overflow: 'hidden',
    },
    horizontalBar: {
      height: 3,
      left: 0,
      right: 0,
    },
    verticalBar: {
      width: 3,
      top: 0,
      bottom: 0,
    },
    topHorizontalBar: {
      top: '33.33%',
    },
    bottomHorizontalBar: {
      bottom: '33.33%',
    },
    leftVerticalBar: {
      left: '33.33%',
    },
    rightVerticalBar: {
      right: '33.33%',
    },
    barBlur: {
      flex: 1,
    },
    barGlow: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      shadowColor: 'rgba(255, 105, 180, 0.8)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
      elevation: 4,
    },
    cellsContainer: {
      position: 'absolute',
      top: padding,
      left: padding,
      right: padding,
      bottom: padding,
    },
    cellWrapper: {
      position: 'absolute',
      width: cellSize,
      height: cellSize,
      margin: cellMargin,
    },
    winningLineContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  });
};

export default MorpionBoard;