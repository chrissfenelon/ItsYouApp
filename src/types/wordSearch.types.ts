// Core game types
export type Direction = 'horizontal' | 'vertical' | 'diagonal' | 'diagonalReverse';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type GameMode = 'solo' | 'multiplayer';

export interface Cell {
  letter: string;
  row: number;
  col: number;
  isSelected: boolean;
  isFound: boolean;
  wordId?: string;
}

export interface Position {
  row: number;
  col: number;
}

export interface Word {
  id: string;
  text: string;
  found: boolean;
  startPos: Position;
  endPos: Position;
  direction: Direction;
  color?: string;
  isBonus?: boolean; // Mot bonus caché
}

export interface Grid {
  cells: Cell[][];
  size: number;
  words: Word[];
}

// Game state
export interface GameState {
  grid: Grid;
  selectedCells: Cell[];
  foundWords: Word[];
  score: number;
  timeElapsed: number;
  timeLimit: number;
  isGameOver: boolean;
  isPaused: boolean;
}

// Difficulty configuration
export interface DifficultyConfig {
  gridSize: number;
  wordCount: number;
  wordLengthRange: [number, number];
  timeLimit: number;
  coinReward: number;
  xpReward: number;
  directions: Direction[];
  fillStrategy: 'random' | 'thematic';
}

// Theme/Category
export interface WordTheme {
  id: string;
  name: string;
  icon: string;
  words: string[];
  unlocked: boolean;
  price?: number;
  color: string;
  description: string;
}

// Player profile
export interface PlayerProfile {
  id: string;
  name: string;
  avatar: Avatar;
  photoURL?: string; // Photo Firebase Auth (pour affichage dans les jeux)
  level: number;
  xp: number;
  coins: number;
  stats: PlayerStats;
  unlockedThemes: string[];
  unlockedAvatars: string[];
  completedLevels: number[];
  powerUps: PlayerPowerUps;
  createdAt: number;
}

export interface PlayerPowerUps {
  revealLetter: number;
  revealWord: number;
  timeFreeze: number;
  highlightFirst: number;
}

export interface Avatar {
  type: 'photo' | 'emoji' | 'preset';
  value: string; // URI for photo, emoji character, or preset ID
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalWordsFound: number;
  totalScore: number;
  bestTime: number;
  favortieDifficulty: Difficulty;
  multiplayerWins: number;
  multiplayerGames: number;
}

// Economy
export interface ShopItem {
  id: string;
  type: 'consumable' | 'theme' | 'avatar' | 'powerup';
  name: string;
  description: string;
  price: number;
  icon: string;
  unlocked?: boolean;
}

export interface PowerUp {
  id: string;
  type: 'revealLetter' | 'revealWord' | 'timeFreeze' | 'highlightFirst';
  name: string;
  description: string;
  icon: string;
  quantity: number;
}

// Level progression
export interface Level {
  level: number;
  xpRequired: number;
  coinReward: number;
  unlocksTheme?: string;
  unlocksAvatar?: string;
}

// Multiplayer
export interface MultiplayerGame {
  id: string;
  hostId: string;
  players: MultiplayerPlayer[];
  grid: Grid;
  difficulty: Difficulty;
  theme: string;
  status: 'waiting' | 'playing' | 'finished';
  startedAt?: number;
  finishedAt?: number;
  winnerId?: string;
  maxPlayers: number;
  roomCode?: string;
}

export interface MultiplayerPlayer {
  id: string;
  profile: PlayerProfile;
  wordsFound: string[];
  score: number;
  isReady: boolean;
  isConnected: boolean;
  voiceMuted: boolean;
}

// Game results
export interface GameResult {
  score: number;
  timeElapsed: number;
  wordsFound: number;
  totalWords: number;
  bonusWordsFound: number;
  coinsEarned: number;
  xpEarned: number;
  leveledUp: boolean;
  newLevel?: number;
  difficulty: Difficulty;
  theme: string;
}
