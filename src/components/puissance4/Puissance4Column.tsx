import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Puissance4Cell from './Puissance4Cell';
import { CellValue } from '../../types/puissance4.types';
import { PUISSANCE4_CONFIG } from '../../constants/Puissance4Constants';
import FeedbackService from '../../services/FeedbackService';

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 60) / PUISSANCE4_CONFIG.COLS;

interface Puissance4ColumnProps {
  columnIndex: number;
  cells: CellValue[];
  onPress: (columnIndex: number) => void;
  disabled?: boolean;
  previewColor?: 'Rouge' | 'Jaune';
  winningCells?: Set<number>; // Set de row indexes gagnants dans cette colonne
}

const Puissance4Column: React.FC<Puissance4ColumnProps> = ({
  columnIndex,
  cells,
  onPress,
  disabled = false,
  previewColor,
  winningCells = new Set(),
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handlePress = () => {
    console.log('Column pressed:', columnIndex, 'disabled:', disabled, 'isFull:', isFull);
    if (disabled) {
      FeedbackService.error();
      console.log('Column disabled');
      return;
    }

    if (isFull) {
      FeedbackService.error();
      console.log('Column is full');
      return;
    }

    FeedbackService.buttonPress();
    console.log('Calling onPress for column:', columnIndex);
    onPress(columnIndex);
  };

  const handlePressIn = () => {
    if (!disabled) {
      setIsHovered(true);
      FeedbackService.selection();
    }
  };

  const handlePressOut = () => {
    setIsHovered(false);
  };

  // Vérifier si la colonne est pleine
  const isFull = cells[0] !== null;

  return (
    <View style={styles.columnWrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isFull}
        style={styles.column}
      >
        {/* Preview du jeton si hover et colonne non pleine */}
        {isHovered && !isFull && previewColor && (
          <View style={[styles.previewContainer, { top: -CELL_SIZE - 10 }]} pointerEvents="none">
            <View
              style={[
                styles.previewToken,
                {
                  width: CELL_SIZE * 0.7,
                  height: CELL_SIZE * 0.7,
                  backgroundColor:
                    previewColor === 'Rouge'
                      ? PUISSANCE4_CONFIG.COLORS.ROUGE_LIGHT
                      : PUISSANCE4_CONFIG.COLORS.JAUNE_LIGHT,
                },
              ]}
            />
          </View>
        )}

        {/* Colonne de cellules (de haut en bas) */}
        {cells.map((cell, rowIndex) => {
          const isWinning = winningCells.has(rowIndex);

          return (
            <Puissance4Cell
              key={`${columnIndex}-${rowIndex}`}
              value={cell}
              size={CELL_SIZE}
              isWinning={isWinning}
              dropAnimation={false}
              dropDelay={0}
            />
          );
        })}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  columnWrapper: {
    flex: 1,
  },
  column: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  previewContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: CELL_SIZE,
    zIndex: 10,
  },
  previewToken: {
    borderRadius: 1000,
    opacity: 0.6,
  },
});

export default Puissance4Column;
