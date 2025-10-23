import { Cell, Direction, DifficultyConfig, Grid, Position, Word } from '../../types/wordSearch.types';
import { DIRECTION_VECTORS, getRandomFillerLetter } from '../../data/constants/gameRules';
import { getWordColor } from '../../data/constants/colors';

export class WordSearchGenerator {
  private grid: string[][];
  private gridSize: number;
  private placedWords: Word[] = [];

  constructor(gridSize: number) {
    this.gridSize = gridSize;
    this.grid = this.createEmptyGrid();
  }

  /**
   * Generate a complete word search grid
   */
  generateGrid(words: string[], config: DifficultyConfig, bonusWords: string[] = []): Grid {
    this.grid = this.createEmptyGrid();
    this.placedWords = [];

    // Select random words based on config
    const selectedWords = this.selectWords(words, config);

    // Place each word in the grid
    // Les premiers mots sont placés normalement, les suivants essaient de se chevaucher
    selectedWords.forEach((word, index) => {
      const placed = this.placeWord(word, config.directions, index, false);
      if (placed) {
        this.placedWords.push(placed);
      }
    });

    // Place bonus words (hidden words not shown in the list)
    bonusWords.forEach((word, index) => {
      const placed = this.placeWord(word, config.directions, selectedWords.length + index, true);
      if (placed) {
        this.placedWords.push(placed);
      }
    });

    // Fill empty cells with random letters
    this.fillEmptyCells();

    // Convert to Cell[][] format
    return this.convertToGrid();
  }

  /**
   * Create an empty grid
   */
  private createEmptyGrid(): string[][] {
    return Array(this.gridSize).fill(null).map(() =>
      Array(this.gridSize).fill('')
    );
  }

  /**
   * Select words that fit the configuration
   */
  private selectWords(words: string[], config: DifficultyConfig): string[] {
    const [minLength, maxLength] = config.wordLengthRange;

    // Filter words by length
    const validWords = words.filter(
      word => word.length >= minLength && word.length <= maxLength && word.length <= this.gridSize
    );

    // Shuffle and take the required count
    const shuffled = [...validWords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, config.wordCount);
  }

  /**
   * Place a word in the grid
   * Essaie d'abord de chevaucher avec des mots existants
   */
  private placeWord(word: string, allowedDirections: Direction[], wordIndex: number, isBonus: boolean = false): Word | null {
    const maxAttempts = 100;
    word = word.toUpperCase();

    // Si c'est pas le premier mot, essayer de chevaucher
    if (wordIndex > 0) {
      const overlappingAttempts = Math.floor(maxAttempts * 0.7); // 70% des tentatives pour chevaucher

      for (let attempt = 0; attempt < overlappingAttempts; attempt++) {
        const position = this.findOverlappingPosition(word, allowedDirections);
        if (position) {
          return this.placeWordInGrid(word, position.startPos, position.direction, wordIndex, isBonus);
        }
      }
    }

    // Sinon, placement aléatoire classique
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const direction = allowedDirections[Math.floor(Math.random() * allowedDirections.length)];
      const startPos = this.getRandomStartPosition(word.length, direction);

      if (this.canPlaceWord(word, startPos, direction)) {
        return this.placeWordInGrid(word, startPos, direction, wordIndex, isBonus);
      }
    }

    return null;
  }

  /**
   * Trouve une position où le mot peut chevaucher avec un mot existant
   */
  private findOverlappingPosition(word: string, allowedDirections: Direction[]): { startPos: Position; direction: Direction } | null {
    // Parcourir toutes les cellules occupées
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const existingLetter = this.grid[row][col];

        if (existingLetter === '') continue;

        // Trouver les lettres du nouveau mot qui correspondent
        for (let letterIndex = 0; letterIndex < word.length; letterIndex++) {
          if (word[letterIndex] === existingLetter) {
            // Essayer chaque direction à partir de ce point de chevauchement
            for (const direction of allowedDirections) {
              const vector = DIRECTION_VECTORS[direction];

              // Calculer la position de départ en fonction du point de chevauchement
              const startPos: Position = {
                row: row - (vector.row * letterIndex),
                col: col - (vector.col * letterIndex),
              };

              if (this.canPlaceWord(word, startPos, direction)) {
                // Vérifier qu'il y a vraiment un chevauchement (pas juste adjacent)
                if (this.hasOverlap(word, startPos, direction)) {
                  return { startPos, direction };
                }
              }
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Vérifie qu'un mot chevauche vraiment avec des lettres existantes
   */
  private hasOverlap(word: string, startPos: Position, direction: Direction): boolean {
    const vector = DIRECTION_VECTORS[direction];
    let overlapCount = 0;

    for (let i = 0; i < word.length; i++) {
      const row = startPos.row + (vector.row * i);
      const col = startPos.col + (vector.col * i);

      if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
        if (this.grid[row][col] !== '' && this.grid[row][col] === word[i]) {
          overlapCount++;
        }
      }
    }

    return overlapCount > 0;
  }

  /**
   * Get a random valid starting position for a word
   */
  private getRandomStartPosition(wordLength: number, direction: Direction): Position {
    const vector = DIRECTION_VECTORS[direction];

    let maxRow = this.gridSize - 1;
    let maxCol = this.gridSize - 1;

    // Adjust max position based on direction
    if (vector.row > 0) maxRow = this.gridSize - wordLength;
    if (vector.row < 0) maxRow = wordLength - 1;
    if (vector.col > 0) maxCol = this.gridSize - wordLength;
    if (vector.col < 0) maxCol = wordLength - 1;

    return {
      row: Math.floor(Math.random() * (maxRow + 1)),
      col: Math.floor(Math.random() * (maxCol + 1)),
    };
  }

  /**
   * Check if a word can be placed at a position
   * Permet le chevauchement des lettres identiques
   */
  private canPlaceWord(word: string, startPos: Position, direction: Direction): boolean {
    const vector = DIRECTION_VECTORS[direction];

    for (let i = 0; i < word.length; i++) {
      const row = startPos.row + (vector.row * i);
      const col = startPos.col + (vector.col * i);

      // Check bounds
      if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
        return false;
      }

      // IMPORTANT: Permet le chevauchement si la lettre est la même
      // Cela permet aux mots de partager des lettres
      const cell = this.grid[row][col];
      if (cell !== '' && cell !== word[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Place word in the grid
   */
  private placeWordInGrid(word: string, startPos: Position, direction: Direction, wordIndex: number, isBonus: boolean = false): Word {
    const vector = DIRECTION_VECTORS[direction];
    const endPos: Position = {
      row: startPos.row + (vector.row * (word.length - 1)),
      col: startPos.col + (vector.col * (word.length - 1)),
    };

    // Place each letter
    for (let i = 0; i < word.length; i++) {
      const row = startPos.row + (vector.row * i);
      const col = startPos.col + (vector.col * i);
      this.grid[row][col] = word[i];
    }

    return {
      id: isBonus ? `bonus-${wordIndex}` : `word-${wordIndex}`,
      text: word,
      found: false,
      startPos,
      endPos,
      direction,
      color: isBonus ? '#FFD700' : getWordColor(wordIndex),
      isBonus,
    };
  }

  /**
   * Fill empty cells with random letters
   */
  private fillEmptyCells(): void {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col] === '') {
          this.grid[row][col] = getRandomFillerLetter();
        }
      }
    }
  }

  /**
   * Convert string[][] to Grid format
   */
  private convertToGrid(): Grid {
    const cells: Cell[][] = [];

    for (let row = 0; row < this.gridSize; row++) {
      const rowCells: Cell[] = [];
      for (let col = 0; col < this.gridSize; col++) {
        rowCells.push({
          letter: this.grid[row][col],
          row,
          col,
          isSelected: false,
          isFound: false,
        });
      }
      cells.push(rowCells);
    }

    return {
      cells,
      size: this.gridSize,
      words: this.placedWords,
    };
  }

  /**
   * Validate if selected cells form a word
   */
  static validateSelection(cells: Cell[], words: Word[]): Word | null {
    if (cells.length < 2) return null;

    // Get the selected word
    const selectedWord = cells.map(cell => cell.letter).join('');

    // Check forward and backward
    for (const word of words) {
      if (word.found) continue;

      if (word.text === selectedWord || word.text === selectedWord.split('').reverse().join('')) {
        // Verify the selection path matches the word placement
        if (this.isValidPath(cells, word)) {
          return word;
        }
      }
    }

    return null;
  }

  /**
   * Check if selection path matches word placement
   */
  private static isValidPath(cells: Cell[], word: Word): boolean {
    if (cells.length !== word.text.length) return false;

    // Check if first cell matches start or end of word
    const firstCell = cells[0];
    const lastCell = cells[cells.length - 1];

    const matchesForward =
      (firstCell.row === word.startPos.row && firstCell.col === word.startPos.col) ||
      (lastCell.row === word.endPos.row && lastCell.col === word.endPos.col);

    const matchesBackward =
      (firstCell.row === word.endPos.row && firstCell.col === word.endPos.col) ||
      (lastCell.row === word.startPos.row && lastCell.col === word.startPos.col);

    return matchesForward || matchesBackward;
  }

  /**
   * Check if two cells are adjacent (including diagonally)
   */
  static areAdjacent(cell1: Cell, cell2: Cell): boolean {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff) > 0;
  }

  /**
   * Get direction between two cells
   */
  static getDirection(from: Cell, to: Cell): Direction | null {
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;

    if (rowDiff === 0 && colDiff > 0) return 'horizontal';
    if (rowDiff > 0 && colDiff === 0) return 'vertical';
    if (rowDiff > 0 && colDiff > 0) return 'diagonal';
    if (rowDiff > 0 && colDiff < 0) return 'diagonalReverse';

    return null;
  }
}
