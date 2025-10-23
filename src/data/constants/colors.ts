// Color palette based on the design image
export const WORD_SEARCH_COLORS = {
  // Background
  background: '#E8F5E9',
  backgroundGradientStart: '#E8F5E9',
  backgroundGradientEnd: '#C8E6C9',

  // Primary gradient (Pink)
  primary: '#FF6B9D',
  primaryDark: '#E91E63',
  primaryLight: '#FFB3C6',
  primaryGradient: ['#FF6B9D', '#C2185B'],

  // Secondary gradient (Teal/Cyan)
  secondary: '#4DD0E1',
  secondaryDark: '#00ACC1',
  secondaryLight: '#80DEEA',
  secondaryGradient: ['#4DD0E1', '#0097A7'],

  // Accent (Yellow/Gold)
  accent: '#FFD54F',
  accentDark: '#FFC107',
  accentLight: '#FFE082',

  // Grid and cells
  cellDefault: '#FFFFFF',
  cellBorder: '#E0E0E0',
  cellSelected: 'rgba(255, 107, 157, 0.3)',
  cellHighlight: 'rgba(77, 208, 225, 0.3)',
  cellFoundPrimary: '#4DD0E1',
  cellFoundSecondary: '#FF6B9D',
  cellFoundTertiary: '#FFD54F',
  cellFoundQuaternary: '#9C27B0',

  // Text
  textPrimary: '#2E7D32',
  textSecondary: '#558B2F',
  textLight: '#81C784',
  textDark: '#1B5E20',
  textWhite: '#FFFFFF',
  letterText: '#1B5E20',

  // UI elements
  headerBg: 'rgba(255, 255, 255, 0.9)',
  cardBg: 'rgba(255, 255, 255, 0.95)',
  modalBg: 'rgba(255, 255, 255, 0.98)',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',

  // Buttons
  buttonPrimary: '#FF6B9D',
  buttonPrimaryHover: '#E91E63',
  buttonSecondary: '#4DD0E1',
  buttonSecondaryHover: '#00ACC1',
  buttonDisabled: '#BDBDBD',
  buttonText: '#FFFFFF',

  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Difficulty badges
  difficultyEasy: '#81C784',
  difficultyMedium: '#FFB74D',
  difficultyHard: '#FF8A65',
  difficultyExpert: '#E57373',

  // Word colors (for different words found)
  wordColors: [
    '#FF6B9D', // Pink
    '#4DD0E1', // Teal
    '#FFD54F', // Yellow
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#E91E63', // Deep pink
  ],

  // Selection overlay
  selectionLine: '#FF6B9D',
  selectionLineShadow: 'rgba(0, 0, 0, 0.1)',

  // Progress and XP
  xpBarBg: '#E0E0E0',
  xpBarFill: '#4DD0E1',
  xpBarBorder: '#00ACC1',

  // Coin display
  coinGold: '#FFD54F',
  coinBorder: '#FFC107',

  // Multiplayer
  playerColors: [
    '#FF6B9D', // Pink
    '#4DD0E1', // Teal
    '#FFD54F', // Yellow
    '#9C27B0', // Purple
  ],

  // Grass footer (from design)
  grassGreen: '#4CAF50',
  grassDark: '#388E3C',
};

export const getWordColor = (index: number): string => {
  return WORD_SEARCH_COLORS.wordColors[index % WORD_SEARCH_COLORS.wordColors.length];
};

export const getPlayerColor = (index: number): string => {
  return WORD_SEARCH_COLORS.playerColors[index % WORD_SEARCH_COLORS.playerColors.length];
};
