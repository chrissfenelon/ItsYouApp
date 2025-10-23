import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Cell } from '../../../types/wordSearch.types';
import { WORD_SEARCH_COLORS } from '../../../data/constants/colors';

interface SelectionOverlayProps {
  selectedCells: Cell[];
  cellSize: number;
  gridSize: number;
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  selectedCells,
  cellSize,
  gridSize,
}) => {
  if (selectedCells.length < 2) return null;

  // Calculate line points
  const points = selectedCells.map(cell => ({
    x: (cell.col * cellSize) + (cellSize / 2),
    y: (cell.row * cellSize) + (cellSize / 2),
  }));

  return (
    <View style={[styles.overlay, { width: gridSize * cellSize, height: gridSize * cellSize }]} pointerEvents="none">
      <Svg width={gridSize * cellSize} height={gridSize * cellSize}>
        {points.map((point, index) => {
          if (index === 0) return null;
          const prevPoint = points[index - 1];

          return (
            <Line
              key={`line-${index}`}
              x1={prevPoint.x}
              y1={prevPoint.y}
              x2={point.x}
              y2={point.y}
              stroke={WORD_SEARCH_COLORS.selectionLine}
              strokeWidth={cellSize * 0.3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default memo(SelectionOverlay);
