import { Cell } from '../../types/wordSearch.types';

export interface TouchPosition {
  x: number;
  y: number;
}

export interface GridLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Convert touch coordinates to grid cell
 */
export const getCellFromTouch = (
  touch: TouchPosition,
  gridLayout: GridLayout,
  cellSize: number,
  gridSize: number
): { row: number; col: number } | null => {
  // Calculate relative position within grid
  const relativeX = touch.x - gridLayout.x;
  const relativeY = touch.y - gridLayout.y;

  // Check if touch is within grid bounds
  if (relativeX < 0 || relativeX > gridLayout.width || relativeY < 0 || relativeY > gridLayout.height) {
    return null;
  }

  // Calculate cell position
  const col = Math.floor(relativeX / cellSize);
  const row = Math.floor(relativeY / cellSize);

  // Validate bounds
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
    return null;
  }

  return { row, col };
};

/**
 * Get cell at specific row/col from grid
 */
export const getCellAt = (cells: Cell[][], row: number, col: number): Cell | null => {
  if (row < 0 || row >= cells.length || col < 0 || col >= cells[0].length) {
    return null;
  }
  return cells[row][col];
};

/**
 * Check if two positions are the same
 */
export const isSamePosition = (pos1: { row: number; col: number }, pos2: { row: number; col: number }): boolean => {
  return pos1.row === pos2.row && pos1.col === pos2.col;
};

/**
 * Get all cells between two positions (in a straight line)
 */
export const getCellsBetween = (
  cells: Cell[][],
  start: { row: number; col: number },
  end: { row: number; col: number }
): Cell[] => {
  const result: Cell[] = [];

  const rowDiff = end.row - start.row;
  const colDiff = end.col - start.col;
  const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));

  if (steps === 0) {
    const cell = getCellAt(cells, start.row, start.col);
    return cell ? [cell] : [];
  }

  const rowStep = rowDiff / steps;
  const colStep = colDiff / steps;

  // Check if movement is in a straight line (horizontal, vertical, or diagonal)
  const isHorizontal = rowDiff === 0;
  const isVertical = colDiff === 0;
  const isDiagonal = Math.abs(rowDiff) === Math.abs(colDiff);

  if (!isHorizontal && !isVertical && !isDiagonal) {
    return []; // Not a valid selection
  }

  for (let i = 0; i <= steps; i++) {
    const row = Math.round(start.row + (rowStep * i));
    const col = Math.round(start.col + (colStep * i));
    const cell = getCellAt(cells, row, col);
    if (cell) {
      result.push(cell);
    }
  }

  return result;
};

/**
 * Calculate distance between two cells
 */
export const getCellDistance = (cell1: Cell, cell2: Cell): number => {
  const rowDiff = cell2.row - cell1.row;
  const colDiff = cell2.col - cell1.col;
  return Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);
};
