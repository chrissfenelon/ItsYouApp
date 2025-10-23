import React from 'react';
import { View, StyleSheet } from 'react-native';
import Puissance4Token from './Puissance4Token';
import { CellValue } from '../../types/puissance4.types';
import { PUISSANCE4_CONFIG } from '../../constants/Puissance4Constants';

interface Puissance4CellProps {
  value: CellValue;
  size: number;
  isWinning?: boolean;
  dropAnimation?: boolean;
  dropDelay?: number;
  photoUrl?: string | null;
}

const Puissance4Cell: React.FC<Puissance4CellProps> = ({
  value,
  size,
  isWinning = false,
  dropAnimation = false,
  dropDelay = 0,
  photoUrl = null,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.cell}>
        {value && (
          <Puissance4Token
            color={value}
            isWinning={isWinning}
            dropAnimation={dropAnimation}
            dropDelay={dropDelay}
            photoUrl={photoUrl}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  cell: {
    flex: 1,
    borderRadius: 1000,
    backgroundColor: PUISSANCE4_CONFIG.COLORS.CELL_EMPTY,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
});

export default Puissance4Cell;
