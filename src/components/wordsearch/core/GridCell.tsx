import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Cell } from '../../../types/wordSearch.types';
import { WORD_SEARCH_COLORS } from '../../../data/constants/colors';
import { AppTheme } from '../../../data/constants/themes';

interface GridCellProps {
  cell: Cell;
  size: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
  theme?: AppTheme;
}

const GridCell: React.FC<GridCellProps> = ({ cell, size, isSelected = false, isHighlighted = false, theme }) => {
  const isDarkMode = theme?.name === 'dark';

  // Couleurs pour mode dark (glassmorphism)
  const getGlassColor = () => {
    if (cell.isFound) {
      return cell.wordId
        ? WORD_SEARCH_COLORS.wordColors[parseInt(cell.wordId.split('-')[1]) % WORD_SEARCH_COLORS.wordColors.length] + '40'
        : WORD_SEARCH_COLORS.cellFoundPrimary + '40';
    }
    if (isHighlighted) return '#FFD70040';
    if (isSelected) return theme?.colors.glass || 'rgba(255, 255, 255, 0.15)';
    return theme?.colors.glass || 'rgba(255, 255, 255, 0.1)';
  };

  // Couleurs pour mode light (classique)
  const getLightColor = () => {
    if (cell.isFound) {
      return cell.wordId
        ? WORD_SEARCH_COLORS.wordColors[parseInt(cell.wordId.split('-')[1]) % WORD_SEARCH_COLORS.wordColors.length]
        : WORD_SEARCH_COLORS.cellFoundPrimary;
    }
    if (isHighlighted) return '#FFD700';
    if (isSelected) return WORD_SEARCH_COLORS.cellSelected;
    return WORD_SEARCH_COLORS.cellDefault;
  };

  const backgroundColor = isDarkMode ? getGlassColor() : getLightColor();
  const borderColor = isDarkMode
    ? (theme?.colors.glassBorder || 'rgba(255, 255, 255, 0.2)')
    : WORD_SEARCH_COLORS.cellBorder;

  if (isDarkMode && theme?.blur.enabled) {
    return (
      <View
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            backgroundColor: 'transparent',
            borderColor,
            overflow: 'hidden',
          },
        ]}
      >
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={theme.blur.intensity}
          reducedTransparencyFallbackColor={backgroundColor}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
        <Text
          style={[
            styles.letter,
            {
              fontSize: size * 0.5,
              color: cell.isFound ? '#FFFFFF' : '#FFFFFF',
              textShadowColor: 'rgba(0, 0, 0, 0.75)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            },
          ]}
        >
          {cell.letter}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <Text
        style={[
          styles.letter,
          {
            fontSize: size * 0.5,
            color: cell.isFound ? WORD_SEARCH_COLORS.textWhite : WORD_SEARCH_COLORS.letterText,
          },
        ]}
      >
        {cell.letter}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WORD_SEARCH_COLORS.cellBorder,
    borderRadius: 4,
  },
  letter: {
    fontWeight: 'bold',
  },
});

export default memo(GridCell);
