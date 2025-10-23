import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { CrosswordGrid as GridData } from '../../services/CrosswordGenerator';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

interface CrosswordGridProps {
  gridData: GridData;
  userInput: string[][];
  selectedCell: { row: number; col: number } | null;
  completedWords: number[];
  onCellPress: (row: number, col: number) => void;
  disabled?: boolean;
}

export const CrosswordGrid: React.FC<CrosswordGridProps> = ({
  gridData,
  userInput,
  selectedCell,
  completedWords,
  onCellPress,
  disabled = false,
}) => {
  const { currentTheme } = useApp();
  const styles = createStyles(currentTheme, gridData.size);

  // Animation for completed words
  const completionAnims = useRef<{ [key: number]: Animated.Value }>(
    {}
  ).current;

  useEffect(() => {
    // Initialize animations for all words
    gridData.words.forEach((word) => {
      if (!completionAnims[word.number]) {
        completionAnims[word.number] = new Animated.Value(0);
      }
    });
  }, [gridData.words]);

  useEffect(() => {
    // Animate completed words
    completedWords.forEach((wordNum) => {
      if (completionAnims[wordNum]) {
        Animated.sequence([
          Animated.timing(completionAnims[wordNum], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(completionAnims[wordNum], {
            toValue: 0.8,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }, [completedWords]);

  const isWordCell = (row: number, col: number): boolean => {
    return gridData.cells[row][col] !== null;
  };

  const getCellNumber = (row: number, col: number): number | null => {
    const word = gridData.words.find(
      (w) => w.startRow === row && w.startCol === col
    );
    return word ? word.number : null;
  };

  const isCompletedCell = (row: number, col: number): boolean => {
    return gridData.words.some(
      (word) =>
        completedWords.includes(word.number) &&
        ((word.direction === 'across' &&
          row === word.startRow &&
          col >= word.startCol &&
          col < word.startCol + word.word.length) ||
          (word.direction === 'down' &&
            col === word.startCol &&
            row >= word.startRow &&
            row < word.startRow + word.word.length))
    );
  };

  const isSelectedCell = (row: number, col: number): boolean => {
    return selectedCell?.row === row && selectedCell?.col === col;
  };

  const renderCell = (row: number, col: number) => {
    const isWord = isWordCell(row, col);
    const cellNumber = getCellNumber(row, col);
    const isSelected = isSelectedCell(row, col);
    const isCompleted = isCompletedCell(row, col);
    const userLetter = userInput[row]?.[col] || '';
    const correctLetter = gridData.cells[row][col];

    if (!isWord) {
      // Black cell
      return (
        <View key={`${row}-${col}`} style={[styles.cell, styles.blackCell]} />
      );
    }

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.cell,
          styles.whiteCell,
          isSelected && styles.selectedCell,
          isCompleted && styles.completedCell,
        ]}
        onPress={() => !disabled && onCellPress(row, col)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <BlurView style={styles.cellBlur} blurType="dark" blurAmount={8}>
          <View
            style={[
              styles.cellGlass,
              isSelected && styles.selectedCellGlass,
              isCompleted && styles.completedCellGlass,
            ]}
          />
        </BlurView>

        {/* Cell number */}
        {cellNumber && (
          <Text style={styles.cellNumber}>{cellNumber}</Text>
        )}

        {/* User input letter */}
        {userLetter && (
          <Text
            style={[
              styles.cellLetter,
              isCompleted && styles.completedCellLetter,
            ]}
          >
            {userLetter}
          </Text>
        )}

        {/* Glowing effect for completed cells */}
        {isCompleted && (
          <View style={styles.completedGlow} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        {Array.from({ length: gridData.size }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: gridData.size }).map((_, col) =>
              renderCell(row, col)
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const createStyles = (theme: any, gridSize: number) => {
  const maxGridWidth = Math.min(width - 40, 400);
  const cellSize = Math.floor(maxGridWidth / gridSize);
  const gridWidth = cellSize * gridSize;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    gridContainer: {
      width: gridWidth,
      height: gridWidth,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    row: {
      flexDirection: 'row',
    },
    cell: {
      width: cellSize,
      height: cellSize,
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    blackCell: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    whiteCell: {
      backgroundColor: 'transparent',
    },
    selectedCell: {
      borderWidth: 2,
      borderColor: theme.romantic?.primary || '#FF69B4',
      shadowColor: theme.romantic?.primary || '#FF69B4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 8,
      elevation: 8,
    },
    completedCell: {
      backgroundColor: 'rgba(255, 215, 0, 0.15)',
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
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    selectedCellGlass: {
      backgroundColor: 'rgba(255, 105, 180, 0.2)',
    },
    completedCellGlass: {
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
    },
    cellNumber: {
      position: 'absolute',
      top: 2,
      left: 2,
      fontSize: Math.max(8, cellSize * 0.2),
      fontWeight: '600',
      color: theme.text?.secondary || 'rgba(255, 255, 255, 0.6)',
    },
    cellLetter: {
      fontSize: Math.max(16, cellSize * 0.5),
      fontWeight: '700',
      color: theme.text?.primary || '#FFFFFF',
      textTransform: 'uppercase',
    },
    completedCellLetter: {
      color: '#FFD700',
      textShadowColor: 'rgba(255, 215, 0, 0.5)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 4,
    },
    completedGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      borderRadius: 4,
    },
  });
};

export default CrosswordGrid;
