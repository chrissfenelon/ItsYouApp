import { DifficultyConfig, Direction } from '../../types/wordSearch.types';

// Difficulty configurations
export const DIFFICULTY_CONFIGS: Record<string, DifficultyConfig> = {
  easy: {
    gridSize: 8,
    wordCount: 5,
    wordLengthRange: [4, 6],
    timeLimit: 300, // 5 minutes
    coinReward: 10,
    xpReward: 50,
    directions: ['horizontal', 'vertical', 'diagonal', 'diagonalReverse'],
    fillStrategy: 'random',
  },
  medium: {
    gridSize: 10,
    wordCount: 7,
    wordLengthRange: [5, 8],
    timeLimit: 420, // 7 minutes
    coinReward: 25,
    xpReward: 100,
    directions: ['horizontal', 'vertical', 'diagonal', 'diagonalReverse'],
    fillStrategy: 'random',
  },
  hard: {
    gridSize: 12,
    wordCount: 10,
    wordLengthRange: [6, 10],
    timeLimit: 600, // 10 minutes
    coinReward: 50,
    xpReward: 200,
    directions: ['horizontal', 'vertical', 'diagonal', 'diagonalReverse'],
    fillStrategy: 'random',
  },
  expert: {
    gridSize: 15,
    wordCount: 15,
    wordLengthRange: [7, 12],
    timeLimit: 900, // 15 minutes
    coinReward: 100,
    xpReward: 400,
    directions: ['horizontal', 'vertical', 'diagonal', 'diagonalReverse'],
    fillStrategy: 'thematic',
  },
};

// Direction vectors for word placement
export const DIRECTION_VECTORS: Record<Direction, { row: number; col: number }> = {
  horizontal: { row: 0, col: 1 },
  vertical: { row: 1, col: 0 },
  diagonal: { row: 1, col: 1 },
  diagonalReverse: { row: 1, col: -1 },
};

// Scoring rules
export const SCORING = {
  // Base points per word
  basePoints: 100,

  // Points per letter in word
  pointsPerLetter: 10,

  // Time bonus multiplier (faster = more points)
  timeBonusMultiplier: 0.5,

  // Combo bonus (for finding words quickly in succession)
  comboMultiplier: 1.2,
  comboTimeWindow: 5000, // 5 seconds
};

// Game rules
export const GAME_RULES = {
  // Minimum word length
  minWordLength: 3,

  // Maximum word length
  maxWordLength: 15,

  // Allow diagonal selection
  allowDiagonal: true,

  // Allow reverse selection (backwards)
  allowReverse: true,

  // Minimum cells to select before checking for word
  minSelectionLength: 3,

  // Maximum time for a game (in seconds)
  maxGameTime: 1800, // 30 minutes

  // Multiplayer settings
  multiplayer: {
    minPlayers: 2,
    maxPlayers: 4,
    lobbyTimeout: 60000, // 60 seconds
    gameStartDelay: 3000, // 3 seconds countdown
  },

  // Power-up limits
  powerUps: {
    maxPerGame: 3,
    cooldown: 10000, // 10 seconds between uses
  },
};

// Filler letters (weighted for realistic word search)
export const FILLER_LETTERS = {
  // Common letters (higher weight)
  common: ['E', 'A', 'R', 'I', 'O', 'T', 'N', 'S', 'L', 'C'],

  // Medium frequency letters
  medium: ['U', 'D', 'P', 'M', 'H', 'G', 'B', 'F', 'Y', 'W'],

  // Rare letters (lower weight)
  rare: ['K', 'V', 'X', 'Z', 'J', 'Q'],

  // Weight distribution
  weights: {
    common: 0.7,
    medium: 0.25,
    rare: 0.05,
  },
};

// Get random filler letter based on weights
export const getRandomFillerLetter = (): string => {
  const rand = Math.random();
  let letters: string[];

  if (rand < FILLER_LETTERS.weights.common) {
    letters = FILLER_LETTERS.common;
  } else if (rand < FILLER_LETTERS.weights.common + FILLER_LETTERS.weights.medium) {
    letters = FILLER_LETTERS.medium;
  } else {
    letters = FILLER_LETTERS.rare;
  }

  return letters[Math.floor(Math.random() * letters.length)];
};
