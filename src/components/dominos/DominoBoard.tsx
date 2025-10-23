import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { TilePlacement } from '../../types/dominos.types';
import { DominoTileComponent } from './DominoTile';

const { width } = Dimensions.get('window');

interface DominoBoardProps {
  placements: TilePlacement[];
  currentTheme?: any;
  onTilePress?: (placement: TilePlacement) => void;
}

export const DominoBoard: React.FC<DominoBoardProps> = ({
  placements,
  currentTheme,
  onTilePress,
}) => {
  return (
    <View style={[styles.tableContainer, { borderColor: currentTheme?.romantic?.primary + '40' || 'rgba(255, 255, 255, 0.2)' }]}>
      {placements.length === 0 ? (
        <View style={styles.emptyBoard}>
          <View style={styles.emptyCircle} />
        </View>
      ) : (
        <ScrollView
          horizontal
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsHorizontalScrollIndicator={false}
        >
          {placements.map((placement, index) => (
            <View key={placement.tile.id} style={styles.tileWrapper}>
              <DominoTileComponent
                tile={placement.tile}
                onPress={() => onTilePress?.(placement)}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    backgroundColor: 'rgba(25, 25, 35, 0.5)',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 12,
    height: 120,
    maxHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyBoard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 96,
  },
  emptyCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  tileWrapper: {
    marginHorizontal: 2,
  },
});
