import { Player } from './games';

export type CellValue = 'Rouge' | 'Jaune' | null;
export type GameStatus = 'en_attente' | 'en_cours' | 'termine';
export type AIDifficulty = 'facile' | 'moyen' | 'difficile' | 'expert';

export interface Puissance4Board {
  rows: number; // 6
  cols: number; // 7
  cells: CellValue[][];
}

export interface Puissance4Move {
  playerId: string;
  column: number;
  row: number;
  color: 'Rouge' | 'Jaune';
  timestamp: Date;
}

export interface Puissance4Game {
  id: string;
  type: 'puissance4';
  status: GameStatus;
  players: Player[];
  currentPlayer: string;
  board: CellValue[][];
  moves: Puissance4Move[];
  winner?: string;
  winningLine?: { row: number; col: number }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Puissance4Stats {
  rougeWins: number;
  jauneWins: number;
  draws: number;
  totalGames: number;
  longestWinStreak: number;
  averageMovesPerGame: number;
  totalPlayTime: number;
}

export interface AIMove {
  column: number;
  score: number;
  reasoning: string;
}

export interface WinResult {
  winner: boolean;
  line: { row: number; col: number }[] | null;
}

// Stakes/Rewards System
export interface Puissance4Stakes {
  type: 'preset' | 'custom' | 'none';
  presetId?: string;
  description: string;
  createdAt: number;
}

// Messages personnalisés
export interface GameMessage {
  emoji: string;
  title: string;
  message: string;
}
