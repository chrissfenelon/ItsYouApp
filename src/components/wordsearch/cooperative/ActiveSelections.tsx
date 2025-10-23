import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { CooperativeGame, CooperativePlayer } from '../../../types/cooperativeGame.types';
import { Cell } from '../../../types/wordSearch.types';
import { CooperativeGameService } from '../../../services/multiplayer/CooperativeGameService';

interface ActiveSelectionsProps {
  game: CooperativeGame;
  currentPlayerId: string;
  cellSize: number;
  gridSize: number;
}

const ActiveSelections: React.FC<ActiveSelectionsProps> = ({
  game,
  currentPlayerId,
  cellSize,
  gridSize,
}) => {
  const renderPlayerSelection = (playerId: string, cells: Cell[], color: string) => {
    if (!cells || cells.length === 0) return null;

    const points = cells.map(cell => ({
      x: (cell.col + 0.5) * cellSize,
      y: (cell.row + 0.5) * cellSize,
    }));

    return (
      <View key={playerId} style={styles.selectionContainer}>
        {/* Highlight cells */}
        {cells.map((cell, index) => (
          <View
            key={`${playerId}-${index}`}
            style={[
              styles.cell,
              {
                left: cell.col * cellSize,
                top: cell.row * cellSize,
                width: cellSize,
                height: cellSize,
                backgroundColor: `${color}30`,
                borderColor: color,
              },
            ]}
          />
        ))}

        {/* Draw line connecting cells */}
        {points.length > 1 && (
          <Svg
            style={styles.svg}
            width={gridSize * cellSize}
            height={gridSize * cellSize}
          >
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
                  stroke={color}
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={0.7}
                />
              );
            })}
          </Svg>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {game.activeSelections && Object.entries(game.activeSelections).map(([playerId, selection]) => {
        if (playerId === currentPlayerId) return null;
        if (!selection || !selection.cells || selection.cells.length === 0) return null;

        const color = CooperativeGameService.getPlayerColor(playerId, game.players);
        return renderPlayerSelection(playerId, selection.cells, color);
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  selectionContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  cell: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default ActiveSelections;
