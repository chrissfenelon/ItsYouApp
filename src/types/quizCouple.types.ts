import { PlayerProfile } from './wordSearch.types';

export type QuizGameMode = 'competitive' | 'prediction' | 'custom';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  categoryId: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  options: QuizOption[];
  correctAnswerId: string;
  points: number;
  explanation?: string;
}

// Question pour le mode prédiction
export interface PredictionQuestion {
  originalQuestion: QuizQuestion; // La question posée au partenaire
  predictionText: string; // "Qu'a répondu [nom du partenaire] ?"
  targetPlayerId: string; // L'ID du joueur qui doit deviner
  answeringPlayerId: string; // L'ID du joueur qui répond à la question originale
  partnerAnswer: string | null; // La réponse du partenaire (null tant qu'il n'a pas répondu)
}

// Question personnalisée pour le mode custom
export interface CustomQuestion {
  id: string;
  text: string; // La question posée par le joueur
  askedBy: string; // ID du joueur qui pose la question
  answeredBy: string; // ID du joueur qui doit répondre
  textAnswer: string | null; // La réponse textuelle du joueur
  judgment: 'correct' | 'incorrect' | 'almost' | null; // Le jugement du poseur de question
  points: number; // Points attribués selon le jugement
  timestamp: number;
}

export interface QuizAnswer {
  questionId: string;
  questionIndex: number;
  answerId: string;
  isCorrect: boolean;
  timeSpent: number;
  points: number;
  timestamp: number;
}

export interface QuizPlayer {
  id: string;
  profile: PlayerProfile;
  isReady: boolean;
  score: number;
  answers: QuizAnswer[];
  hasAnsweredCurrent: boolean;
  correctAnswersCount: number;
  averageTime: number;
}

export interface QuizGame {
  id: string;
  roomCode: string;
  hostId: string;
  gameMode: QuizGameMode; // 'competitive', 'prediction', ou 'custom'
  players: QuizPlayer[];
  maxPlayers: 2; // Toujours 2 joueurs
  status: 'waiting' | 'playing' | 'finished';
  currentQuestionIndex: number;
  questions: QuizQuestion[];
  predictionQuestions?: PredictionQuestion[]; // Pour le mode prédiction uniquement
  customQuestions?: CustomQuestion[]; // Pour le mode custom uniquement
  totalQuestions: 10;
  timePerQuestion: 15; // secondes (non utilisé en mode custom)
  winnerId: string | null;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  updatedAt: number;
  lastNotification?: {
    type: string;
    message: string;
    timestamp: number;
    questionIndex: number;
  };
}

export interface QuizPlayerStats {
  id: string;
  name: string;
  avatar: { type: 'emoji' | 'photo'; value: string };
  score: number;
  correctAnswers: number;
  averageTime: number;
  bestCategory: string;
  answers: QuizAnswer[];
}

export interface QuizResult {
  winnerId: string;
  players: QuizPlayerStats[];
  totalQuestions: number;
  gameTime: number;
  questions: QuizQuestion[];
}

export interface QuizProfile {
  id: string;
  name: string;
  avatar: {
    type: 'emoji' | 'photo';
    value: string;
  };
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  averageScore: number;
  bestCategory: string;
  createdAt: number;
  updatedAt: number;
}
