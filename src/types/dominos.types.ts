import { PlayerProfile } from './wordSearch.types';

// Tuile de domino
export interface DominoTile {
  id: string;
  left: number;  // 0-6
  right: number; // 0-6
  isDouble: boolean;
  orientation: 'horizontal' | 'vertical';
}

// Position sur le plateau
export interface TilePlacement {
  tile: DominoTile;
  position: number;
  side: 'left' | 'right';
  timestamp: number;
  playerId: string;
}

// Joueur
export interface DominosPlayer {
  id: string;
  profile: PlayerProfile;
  hand: DominoTile[];
  tilesCount: number;
  hasDrawn: boolean;
  hasPassed: boolean;
  score: number;
  isReady: boolean;
}

// Partie
export interface DominosGame {
  id: string;
  roomCode: string;
  hostId: string;
  players: DominosPlayer[];
  maxPlayers: 2;
  status: 'waiting' | 'playing' | 'finished';
  currentPlayerId: string;
  board: TilePlacement[];
  drawPile: DominoTile[];
  drawPileCount: number;
  leftEnd: number | null;
  rightEnd: number | null;
  isBlocked: boolean;
  winnerId: string | null;
  winReason: 'emptied_hand' | 'lowest_score' | 'opponent_left' | null;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  updatedAt: number;
}

// Statistiques de fin de partie
export interface DominosStats {
  playerId: string;
  playerName: string;
  tilesPlayed: number;
  tilesDrawn: number;
  finalTilesCount: number;
  finalScore: number;
  playTime: number;
}

// Action possible
export interface PossibleMove {
  tileId: string;
  side: 'left' | 'right';
  needsRotation: boolean;
}
