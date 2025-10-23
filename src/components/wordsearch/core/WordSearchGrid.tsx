import React, { useRef, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, PanResponder, Dimensions } from 'react-native';
import { Cell, Grid } from '../../../types/wordSearch.types';
import GridCell from './GridCell';
import SelectionOverlay from './SelectionOverlay';
import { getCellFromTouch, getCellsBetween, isSamePosition } from '../../../utils/wordsearch/coordinateHelpers';
import { AppTheme } from '../../../data/constants/themes';

interface WordSearchGridProps {
  grid: Grid;
  onSelectionComplete: (cells: Cell[]) => void;
  disabled?: boolean;
  highlightedCells?: { row: number; col: number }[];
  theme?: AppTheme;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 20;
const MAX_GRID_WIDTH = SCREEN_WIDTH - (GRID_PADDING * 2);

const WordSearchGrid: React.FC<WordSearchGridProps> = ({
  grid,
  onSelectionComplete,
  disabled = false,
  highlightedCells = [],
  theme,
}) => {
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const gridLayoutRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const gridViewRef = useRef<View>(null);
  const startCellRef = useRef<{ row: number; col: number } | null>(null);

  const cellSize = Math.floor(MAX_GRID_WIDTH / grid.size);

  // Measure grid position
  const measureGrid = useCallback(() => {
    if (gridViewRef.current) {
      gridViewRef.current.measure((x, y, width, height, pageX, pageY) => {
        gridLayoutRef.current = { x: pageX, y: pageY, width, height };
        console.log('Grid measured:', { x: pageX, y: pageY, width, height });
      });
    }
  }, []);

  // Measure on layout
  const onGridLayout = useCallback(() => {
    // Use setTimeout to ensure the view is fully laid out
    setTimeout(() => {
      measureGrid();
    }, 100);
  }, [measureGrid]);

  // Pan responder for touch handling
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (event) => {
          // Re-measure grid to ensure we have accurate coordinates
          measureGrid();

          const touch = {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          };

          console.log('Touch:', touch, 'Grid layout:', gridLayoutRef.current);

          const cellPos = getCellFromTouch(touch, gridLayoutRef.current, cellSize, grid.size);

          if (cellPos) {
            console.log('Cell position:', cellPos);
            startCellRef.current = cellPos;
            const cell = grid.cells[cellPos.row][cellPos.col];
            setSelectedCells([cell]);
            setIsSelecting(true);
          } else {
            console.log('No cell found at touch position');
          }
        },

        onPanResponderMove: (event) => {
          if (!startCellRef.current) return;

          const touch = {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          };

          const cellPos = getCellFromTouch(touch, gridLayoutRef.current, cellSize, grid.size);
          if (cellPos) {
            if (!isSamePosition(cellPos, startCellRef.current)) {
              // Get all cells between start and current
              const cells = getCellsBetween(grid.cells, startCellRef.current, cellPos);
              if (cells.length > 0) {
                setSelectedCells(cells);
              }
            } else {
              // Keep at least the start cell selected
              const cell = grid.cells[cellPos.row][cellPos.col];
              setSelectedCells([cell]);
            }
          }
        },

        onPanResponderRelease: () => {
          if (startCellRef.current && selectedCells.length > 0) {
            onSelectionComplete(selectedCells);
          }
          setSelectedCells([]);
          setIsSelecting(false);
          startCellRef.current = null;
        },

        onPanResponderTerminate: () => {
          setSelectedCells([]);
          setIsSelecting(false);
          startCellRef.current = null;
        },
      }),
    [disabled, grid.cells, cellSize, isSelecting, selectedCells, onSelectionComplete]
  );

  return (
    <View style={styles.container}>
      <View
        ref={gridViewRef}
        style={[styles.grid, { width: cellSize * grid.size, height: cellSize * grid.size }]}
        onLayout={onGridLayout}
        {...panResponder.panHandlers}
      >
        {grid.cells.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell, colIndex) => {
              const isSelected = selectedCells.some(
                selectedCell => selectedCell.row === cell.row && selectedCell.col === cell.col
              );
              const isHighlighted = highlightedCells.some(
                hCell => hCell.row === cell.row && hCell.col === cell.col
              );
              return (
                <GridCell
                  key={`cell-${rowIndex}-${colIndex}`}
                  cell={cell}
                  size={cellSize}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  theme={theme}
                />
              );
            })}
          </View>
        ))}

        <SelectionOverlay selectedCells={selectedCells} cellSize={cellSize} gridSize={grid.size} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
  },
});

export default WordSearchGrid;
