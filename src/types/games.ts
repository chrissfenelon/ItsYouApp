export type GameType = 'morpion' | 'fourInARow' | 'puzzle' | 'crosswords' | 'quizCouple';

export type GameMode = 'multiplayer' | 'ai' | 'local';
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type AIPersonality = 'aggressive' | 'defensive' | 'balanced';

export type GameStatus = 'waiting' | 'playing' | 'finished';

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
};

export interface BaseGame {
  id: string;
  type: GameType;
  status: GameStatus;
  players: Player[];
  currentPlayer?: string;
  winner?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Morpion (Tic-Tac-Toe) Game
export interface MorpionGame extends BaseGame {
  type: 'morpion';
  board: (string | null)[][]; // 3x3 grid
  moves: MorpionMove[];
  gameMode: GameMode;
  aiDifficulty?: AIDifficulty;
  aiPersonality?: AIPersonality;
  isAITurn?: boolean;
}

export interface MorpionMove {
  playerId: string;
  row: number;
  col: number;
  symbol: 'X' | 'O';
  timestamp: Date;
}

// Four in a Row (Connect 4) Game
export interface FourInARowGame extends BaseGame {
  type: 'fourInARow';
  board: (string | null)[][]; // 6x7 grid
  moves: FourInARowMove[];
}

export interface FourInARowMove {
  playerId: string;
  col: number;
  row: number;
  color: 'red' | 'yellow';
  timestamp: Date;
}

// Puzzle Game
export interface PuzzleGame extends BaseGame {
  type: 'puzzle';
  imageUrl: string;
  pieces: PuzzlePiece[];
  targetGrid: number[][]; // Correct order
  playerProgress: { [playerId: string]: PuzzleProgress };
}

export interface PuzzlePiece {
  id: number;
  imageSection: string; // Base64 or URL
  correctPosition: { row: number; col: number };
}

export interface PuzzleProgress {
  currentGrid: number[][];
  completedPieces: number;
  timeSpent: number;
  isCompleted: boolean;
}

// Crosswords Game
export interface CrosswordsGame extends BaseGame {
  type: 'crosswords';
  grid: CrosswordCell[][];
  clues: CrosswordClue[];
  playerProgress: { [playerId: string]: CrosswordProgress };
}

export interface CrosswordCell {
  letter?: string;
  isBlocked: boolean;
  number?: number;
  belongsToWords: string[]; // Word IDs this cell belongs to
}

export interface CrosswordClue {
  id: string;
  number: number;
  direction: 'across' | 'down';
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
  length: number;
}

export interface CrosswordProgress {
  filledCells: { [position: string]: string }; // "row,col": "letter"
  completedWords: string[];
  timeSpent: number;
  isCompleted: boolean;
}

// Game Room for multiplayer
export interface GameRoom {
  id: string;
  name: string;
  gameType: GameType;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  isPrivate: boolean;
  password?: string;
  currentGame?: BaseGame;
  createdAt: Date;
}

// Game Events for real-time communication
export type GameEvent =
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'GAME_STARTED'; game: BaseGame }
  | { type: 'MOVE_MADE'; move: any }
  | { type: 'GAME_ENDED'; winner?: string }
  | { type: 'CHAT_MESSAGE'; playerId: string; message: string };

// Quiz Couple Game
export interface QuizCoupleGame extends BaseGame {
  type: 'quizCouple';
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  playerAnswers: { [playerId: string]: QuizAnswer[] };
  scores: { [playerId: string]: number };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: 'relationship' | 'preferences' | 'memories' | 'future' | 'personality';
  points: number;
}

export interface QuizAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  timeSpent: number;
  timestamp: Date;
}

export interface GameState {
  currentRoom?: GameRoom;
  currentGame?: BaseGame;
  isHost: boolean;
  connectedPlayers: Player[];
}