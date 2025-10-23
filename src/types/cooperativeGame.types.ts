import { PlayerProfile, Cell, Grid } from './wordSearch.types';

export interface CooperativePlayer {
  id: string;
  profile: PlayerProfile;
  isReady: boolean;
  currentSelection: Cell[];
  cursorPosition: { row: number; col: number } | null;
  wordsFound: string[];
  score: number;
}

export interface CooperativeGame {
  id: string;
  roomCode: string;
  hostId: string;
  players: CooperativePlayer[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'completed';

  // Game data
  grid: Grid;
  words: string[];
  wordsFound: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  themeId: string;
  levelId?: number;

  // Time
  timeLimit: number;
  timeRemaining: number;
  startedAt: number | null;
  completedAt: number | null;

  // Real-time tracking
  activeSelections: {
    [playerId: string]: {
      cells: Cell[];
      timestamp: number;
    };
  };

  createdAt: number;
  updatedAt: number;
}

export interface PlayerCursor {
  playerId: string;
  playerName: string;
  position: { row: number; col: number };
  color: string;
  avatar: string;
  timestamp: number;
}

export interface SelectionUpdate {
  playerId: string;
  cells: Cell[];
  timestamp: number;
}

export interface WordFoundEvent {
  playerId: string;
  playerName: string;
  word: string;
  cells: Cell[];
  score: number;
  timestamp: number;
}
