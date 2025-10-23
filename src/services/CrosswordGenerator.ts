// Crossword grid generation algorithm

import { WordData } from '../data/crosswordWords';

export interface CrosswordWord {
  word: string;
  clue: string;
  direction: 'across' | 'down';
  startRow: number;
  startCol: number;
  number: number;
  category: string;
}

export interface CrosswordGrid {
  size: number;
  cells: (string | null)[][];
  words: CrosswordWord[];
}

export class CrosswordGenerator {
  private grid: (string | null)[][];
  private size: number;
  private placedWords: CrosswordWord[];
  private wordNumber: number;

  constructor(size: number) {
    this.size = size;
    this.grid = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null));
    this.placedWords = [];
    this.wordNumber = 1;
  }

  /**
   * Generate a crossword puzzle from a list of words
   */
  generate(words: WordData[]): CrosswordGrid {
    // Sort words: mix of long and short for better packing
    const sortedWords = [...words].sort((a, b) => {
      // Prioritize medium-length words (4-6 letters) for better intersections
      const aScore = Math.abs(a.word.length - 5);
      const bScore = Math.abs(b.word.length - 5);
      return aScore - bScore;
    });

    // Place first word horizontally near top-left for traditional look
    if (sortedWords.length > 0) {
      const firstWord = sortedWords[0];
      const startRow = 1;
      const startCol = 1;
      this.placeWord(firstWord, 'across', startRow, startCol);
    }

    // Aggressively try to place remaining words
    for (let i = 1; i < sortedWords.length; i++) {
      const word = sortedWords[i];
      let placed = false;

      // Try MANY times with intersections
      for (let attempt = 0; attempt < 500 && !placed; attempt++) {
        placed = this.tryPlaceWord(word);
      }

      if (!placed) {
        console.log(`Could not place word: ${word.word}`);
      }
    }

    return {
      size: this.size,
      cells: this.grid,
      words: this.placedWords,
    };
  }

  /**
   * Try to place a word independently (not intersecting)
   */
  private tryPlaceWordIndependently(wordData: WordData): boolean {
    const word = wordData.word;

    // Try random positions
    for (let attempt = 0; attempt < 50; attempt++) {
      const direction: 'across' | 'down' = Math.random() > 0.5 ? 'across' : 'down';

      let startRow: number, startCol: number;

      if (direction === 'across') {
        startRow = Math.floor(Math.random() * this.size);
        startCol = Math.floor(Math.random() * (this.size - word.length + 1));
      } else {
        startRow = Math.floor(Math.random() * (this.size - word.length + 1));
        startCol = Math.floor(Math.random() * this.size);
      }

      if (this.canPlaceWord(word, direction, startRow, startCol)) {
        this.placeWord(wordData, direction, startRow, startCol);
        return true;
      }
    }

    return false;
  }

  /**
   * Try to place a word by finding intersections with existing words
   */
  private tryPlaceWord(wordData: WordData): boolean {
    const word = wordData.word;

    // Get all possible intersection points
    const intersections: Array<{
      existingWord: CrosswordWord;
      existingCharIndex: number;
      newCharIndex: number;
    }> = [];

    for (const existingWord of this.placedWords) {
      for (let i = 0; i < word.length; i++) {
        for (let j = 0; j < existingWord.word.length; j++) {
          if (word[i] === existingWord.word[j]) {
            intersections.push({
              existingWord,
              existingCharIndex: j,
              newCharIndex: i,
            });
          }
        }
      }
    }

    // Shuffle intersections for randomness
    intersections.sort(() => Math.random() - 0.5);

    // Try each intersection
    for (const intersection of intersections) {
      const { existingWord, existingCharIndex, newCharIndex } = intersection;

      // Calculate new word position (perpendicular to existing word)
      const newDirection: 'across' | 'down' =
        existingWord.direction === 'across' ? 'down' : 'across';

      let startRow: number, startCol: number;

      if (existingWord.direction === 'across') {
        // Existing word is horizontal, new word is vertical
        startRow = existingWord.startRow - newCharIndex;
        startCol = existingWord.startCol + existingCharIndex;
      } else {
        // Existing word is vertical, new word is horizontal
        startRow = existingWord.startRow + existingCharIndex;
        startCol = existingWord.startCol - newCharIndex;
      }

      // Check if word can be placed
      if (this.canPlaceWord(word, newDirection, startRow, startCol)) {
        this.placeWord(wordData, newDirection, startRow, startCol);
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a word can be placed at the given position
   */
  private canPlaceWord(
    word: string,
    direction: 'across' | 'down',
    startRow: number,
    startCol: number
  ): boolean {
    // Check bounds
    if (direction === 'across') {
      if (startCol < 0 || startCol + word.length > this.size || startRow < 0 || startRow >= this.size) {
        return false;
      }
    } else {
      if (startRow < 0 || startRow + word.length > this.size || startCol < 0 || startCol >= this.size) {
        return false;
      }
    }

    // Check each cell
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'across' ? startRow : startRow + i;
      const col = direction === 'across' ? startCol + i : startCol;

      const currentCell = this.grid[row][col];

      // Cell must be empty or match the letter
      if (currentCell !== null && currentCell !== word[i]) {
        return false;
      }

      // Simplified adjacent cell checking - allow more flexibility
      if (currentCell === null) {
        // Only check adjacent cells aren't forming unintended words
        // This is a simplified version to allow more placements
        if (direction === 'across') {
          // Check above and below aren't occupied (unless it's a crossing point)
          if (row > 0 && this.grid[row - 1][col] !== null && currentCell === null) {
            // Check if this could be an intersection
            let isCrossing = word.split('').some((char, idx) => {
              const checkCol = col + idx - i;
              return this.grid[row][checkCol] === char;
            });
            if (!isCrossing && i > 0 && i < word.length - 1) {
              // Allow if it's near start or end
              continue;
            }
          }
        }
      }
    }

    // Check cells before and after word (must be empty)
    if (direction === 'across') {
      if (startCol > 0 && this.grid[startRow][startCol - 1] !== null) {
        return false;
      }
      if (startCol + word.length < this.size && this.grid[startRow][startCol + word.length] !== null) {
        return false;
      }
    } else {
      if (startRow > 0 && this.grid[startRow - 1][startCol] !== null) {
        return false;
      }
      if (startRow + word.length < this.size && this.grid[startRow + word.length][startCol] !== null) {
        return false;
      }
    }

    return true;
  }

  /**
   * Place a word on the grid
   */
  private placeWord(
    wordData: WordData,
    direction: 'across' | 'down',
    startRow: number,
    startCol: number
  ): void {
    const word = wordData.word;

    // Place letters
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'across' ? startRow : startRow + i;
      const col = direction === 'across' ? startCol + i : startCol;
      this.grid[row][col] = word[i];
    }

    // Add to placed words
    this.placedWords.push({
      word: word,
      clue: wordData.clue,
      direction,
      startRow,
      startCol,
      number: this.wordNumber++,
      category: wordData.category,
    });
  }

  /**
   * Get the generated grid
   */
  getGrid(): CrosswordGrid {
    return {
      size: this.size,
      cells: this.grid,
      words: this.placedWords,
    };
  }
}

/**
 * Generate a crossword puzzle with the specified difficulty
 */
export const generateCrosswordPuzzle = (
  difficulty: 'facile' | 'moyen' | 'difficile',
  words: WordData[]
): CrosswordGrid => {
  const gridSizes = {
    facile: 7,
    moyen: 9,
    difficile: 12,
  };

  const wordCounts = {
    facile: 10,
    moyen: 15,
    difficile: 20,
  };

  const size = gridSizes[difficulty];
  const wordCount = wordCounts[difficulty];

  // Shuffle and select words
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const selectedWords = shuffled.slice(0, Math.min(wordCount, words.length));

  const generator = new CrosswordGenerator(size);
  const puzzle = generator.generate(selectedWords);

  // Retry if too few words were placed
  if (puzzle.words.length < Math.min(5, wordCount / 2)) {
    console.log('Regenerating puzzle due to low word count...');
    return generateCrosswordPuzzle(difficulty, words);
  }

  return puzzle;
};
