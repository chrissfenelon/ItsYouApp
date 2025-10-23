export interface QuizTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    cardBg: string;
    text: string;
    textSecondary: string;
    correct: string;
    wrong: string;
    accent: string;
  };
}

export const QUIZ_THEMES: QuizTheme[] = [
  {
    id: 'glass',
    name: 'Glassmorphism',
    colors: {
      primary: '#FF6B9D',
      secondary: '#C44569',
      background: 'rgba(255, 255, 255, 0.1)',
      cardBg: 'rgba(255, 255, 255, 0.15)',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      correct: '#2ECC71',
      wrong: '#E74C3C',
      accent: '#F8B739',
    },
  },
  {
    id: 'romantic',
    name: 'Romantique',
    colors: {
      primary: '#FF6B9D',
      secondary: '#C44569',
      background: '#FFF5F7',
      cardBg: '#FFFFFF',
      text: '#2C3E50',
      textSecondary: '#7F8C8D',
      correct: '#2ECC71',
      wrong: '#E74C3C',
      accent: '#F8B739',
    },
  },
  {
    id: 'playful',
    name: 'Enjoué',
    colors: {
      primary: '#F39C12',
      secondary: '#E67E22',
      background: '#FEF5E7',
      cardBg: '#FFFFFF',
      text: '#2C3E50',
      textSecondary: '#7F8C8D',
      correct: '#27AE60',
      wrong: '#C0392B',
      accent: '#9B59B6',
    },
  },
  {
    id: 'classic',
    name: 'Classique',
    colors: {
      primary: '#3498DB',
      secondary: '#2980B9',
      background: '#ECF0F1',
      cardBg: '#FFFFFF',
      text: '#2C3E50',
      textSecondary: '#95A5A6',
      correct: '#16A085',
      wrong: '#E74C3C',
      accent: '#8E44AD',
    },
  },
];

export const DEFAULT_QUIZ_THEME = QUIZ_THEMES[0]; // Romantique par défaut
