import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CooperativePlayer } from '../../../types/cooperativeGame.types';
import { CooperativeGameService } from '../../../services/multiplayer/CooperativeGameService';

interface PlayerCursorsProps {
  players: CooperativePlayer[];
  currentPlayerId: string;
  cellSize: number;
  gridSize: number;
}

const PlayerCursors: React.FC<PlayerCursorsProps> = ({
  players,
  currentPlayerId,
  cellSize,
  gridSize,
}) => {
  return (
    <>
      {players
        .filter(p => p.id !== currentPlayerId && p.cursorPosition)
        .map(player => {
          if (!player.cursorPosition) return null;

          const { row, col } = player.cursorPosition;
          const color = CooperativeGameService.getPlayerColor(player.id, players);

          return (
            <View
              key={player.id}
              style={[
                styles.cursor,
                {
                  left: col * cellSize,
                  top: row * cellSize,
                  borderColor: color,
                },
              ]}
            >
              <View style={[styles.cursorDot, { backgroundColor: color }]} />
              <View style={[styles.cursorLabel, { backgroundColor: color }]}>
                <Text style={styles.cursorName} numberOfLines={1}>
                  {player.profile.avatar.value} {player.profile.name}
                </Text>
              </View>
            </View>
          );
        })}
    </>
  );
};

const styles = StyleSheet.create({
  cursor: {
    position: 'absolute',
    width: 40,
    height: 40,
    pointerEvents: 'none',
  },
  cursorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: -6,
    left: -6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  cursorLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    maxWidth: 120,
  },
  cursorName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default PlayerCursors;
