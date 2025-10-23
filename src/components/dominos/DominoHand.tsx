import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { DominoTile } from '../../types/dominos.types';
import { DominoTileComponent } from './DominoTile';

interface DominoHandProps {
  tiles: DominoTile[];
  onSelectTile?: (tile: DominoTile) => void;
  selectedTileId?: string | null;
  disabledTiles?: string[];
  showBack?: boolean;
  currentTheme?: any;
  label?: string;
  isSelectable?: boolean;
  playableTileIds?: string[];
  showHints?: boolean;
  enableDrag?: boolean;
  onTileDragEnd?: (tile: DominoTile, dropZone: 'left' | 'right' | 'pass' | null) => void;
}

export const DominoHand: React.FC<DominoHandProps> = ({
  tiles,
  onSelectTile,
  selectedTileId,
  disabledTiles = [],
  showBack = false,
  currentTheme,
  label,
  isSelectable = true,
  playableTileIds = [],
  showHints = false,
  enableDrag = false,
  onTileDragEnd,
}) => {
  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <ScrollView
        horizontal
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsHorizontalScrollIndicator={false}
      >
        {tiles.map((tile) => (
          <View key={tile.id} style={styles.tileWrapper}>
            <DominoTileComponent
              tile={tile}
              onPress={isSelectable ? () => onSelectTile?.(tile) : undefined}
              selected={selectedTileId === tile.id}
              disabled={disabledTiles.includes(tile.id) || !isSelectable}
              showBack={showBack}
              isPlayable={showHints && playableTileIds.includes(tile.id)}
              enableDrag={enableDrag}
              onDragEnd={(dropZone) => onTileDragEnd?.(tile, dropZone)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 120,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tileWrapper: {
    marginHorizontal: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
});
