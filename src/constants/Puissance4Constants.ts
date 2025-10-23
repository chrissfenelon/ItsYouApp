import { GameMessage } from '../types/puissance4.types';

export const PUISSANCE4_CONFIG = {
  ROWS: 6,
  COLS: 7,
  WIN_LENGTH: 4,

  COLORS: {
    ROUGE: '#FF5252',
    JAUNE: '#FFEB3B',
    ROUGE_GLOW: 'rgba(255, 82, 82, 0.8)',
    JAUNE_GLOW: 'rgba(255, 235, 59, 0.8)',
    ROUGE_LIGHT: 'rgba(255, 82, 82, 0.3)',
    JAUNE_LIGHT: 'rgba(255, 235, 59, 0.3)',
    BOARD_BG: '#5B7BD6',
    BOARD_BORDER: '#4A6AC5',
    CELL_EMPTY: '#3D4A5C',
    CELL_BORDER: '#2C3541',
  },

  ANIMATIONS: {
    DROP_BASE_DURATION: 600,
    DROP_SPEED_FACTOR: 80, // ms per row
    BOUNCE_FRICTION: 8,
    BOUNCE_TENSION: 40,
    WIN_HIGHLIGHT_DURATION: 800,
    WIN_STAGGER_DELAY: 100,
    CELEBRATION_SCALE: 1.2,
    COLUMN_HOVER_DURATION: 200,
  },

  SOUNDS: {
    DROP: 'token_drop',
    WIN: 'victory',
    DRAW: 'draw',
    COLUMN_HOVER: 'hover',
  },

  AI: {
    THINK_DURATION: {
      facile: 600,
      moyen: 1000,
      difficile: 1400,
      expert: 1800,
    },
    MINIMAX_DEPTH: {
      facile: 2,     // +1 - Voit 2 coups à l'avance (minimal viable)
      moyen: 5,      // +2 - Stratégie intermédiaire solide
      difficile: 7,  // +2 - Vraiment difficile
      expert: 10,    // +3 - Quasi-imbattable (10 coups à l'avance)
    },
  },
};

export const PUISSANCE4_MESSAGES = {
  VICTOIRE_ROUGE: [
    {
      emoji: '🔴',
      title: 'Rouge Gagne!',
      message: 'Victoire éclatante!'
    },
    {
      emoji: '🎯',
      title: 'Incroyable!',
      message: 'Le rouge domine le jeu!'
    },
    {
      emoji: '🏆',
      title: 'Champion!',
      message: 'Une victoire parfaite!'
    },
    {
      emoji: '⚡',
      title: 'Foudroyant!',
      message: 'Le rouge frappe fort!'
    },
    {
      emoji: '🔥',
      title: 'En Feu!',
      message: 'Le rouge est inarrêtable!'
    },
  ] as GameMessage[],

  VICTOIRE_JAUNE: [
    {
      emoji: '🟡',
      title: 'Jaune Gagne!',
      message: 'Victoire brillante!'
    },
    {
      emoji: '⭐',
      title: 'Magnifique!',
      message: 'Le jaune triomphe!'
    },
    {
      emoji: '👑',
      title: 'Roi du Jeu!',
      message: 'Une stratégie parfaite!'
    },
    {
      emoji: '💫',
      title: 'Éblouissant!',
      message: 'Le jaune illumine la victoire!'
    },
    {
      emoji: '🌟',
      title: 'Stellar!',
      message: 'Le jaune brille de mille feux!'
    },
  ] as GameMessage[],

  MATCH_NUL: [
    {
      emoji: '🤝',
      title: 'Match Nul!',
      message: 'Égalité parfaite!'
    },
    {
      emoji: '⚖️',
      title: 'Équilibre!',
      message: 'Aucun ne cède!'
    },
    {
      emoji: '🎭',
      title: 'Statu Quo!',
      message: 'Les deux adversaires sont de force égale!'
    },
  ] as GameMessage[],

  IA_VICTOIRE: {
    facile: [
      {
        emoji: '🤖',
        title: 'L\'IA Gagne!',
        message: 'Même en mode facile, elle a gagné!'
      },
      {
        emoji: '😅',
        title: 'Oups!',
        message: 'L\'IA facile vous a battu!'
      },
    ],
    moyen: [
      {
        emoji: '🤖',
        title: 'L\'IA Gagne!',
        message: 'Une victoire méritée!'
      },
      {
        emoji: '💪',
        title: 'Bien Joué IA!',
        message: 'Elle progresse!'
      },
    ],
    difficile: [
      {
        emoji: '🤖',
        title: 'L\'IA Gagne!',
        message: 'Un adversaire coriace!'
      },
      {
        emoji: '🧠',
        title: 'Intelligence!',
        message: 'L\'IA a calculé la victoire!'
      },
    ],
    expert: [
      {
        emoji: '🤖',
        title: 'L\'IA Gagne!',
        message: 'Un maître stratège!'
      },
      {
        emoji: '👾',
        title: 'Invincible!',
        message: 'L\'IA expert ne laisse rien au hasard!'
      },
    ],
  } as Record<string, GameMessage[]>,

  JOUEUR_VICTOIRE_VS_IA: {
    facile: [
      {
        emoji: '🎉',
        title: 'Tu Gagnes!',
        message: 'Bravo, c\'était un bon échauffement!'
      },
    ],
    moyen: [
      {
        emoji: '🎉',
        title: 'Tu Gagnes!',
        message: 'Bien joué contre l\'IA moyenne!'
      },
    ],
    difficile: [
      {
        emoji: '🎉',
        title: 'Tu Gagnes!',
        message: 'Impressionnant! L\'IA difficile battue!'
      },
      {
        emoji: '🏆',
        title: 'Champion!',
        message: 'Tu as surpassé l\'IA difficile!'
      },
    ],
    expert: [
      {
        emoji: '🎉',
        title: 'Tu Gagnes!',
        message: 'INCROYABLE! Tu as battu l\'IA expert!'
      },
      {
        emoji: '👑',
        title: 'Légende!',
        message: 'Tu es un maître du Puissance 4!'
      },
    ],
  } as Record<string, GameMessage[]>,
};

// Messages de raisonnement de l'IA
export const AI_REASONING_MESSAGES = {
  WINNING_MOVE: [
    'Je vais gagner! 🏆',
    'Victoire assurée! 🎯',
    'Échec et mat! ♟️',
    'C\'est terminé! 🔥',
  ],
  BLOCKING_MOVE: [
    'Je bloque ta victoire! 🛡️',
    'Pas si vite! 🚫',
    'Belle tentative! 😏',
    'Je vois ton jeu! 👀',
  ],
  STRATEGIC_MOVE: [
    'Coup stratégique! 🧠',
    'Je prépare ma victoire... 🎲',
    'Bon positionnement! 📍',
    'Je contrôle le jeu! 🎮',
  ],
  DEFENSIVE_MOVE: [
    'Je défends ma position! 🛡️',
    'Prudence avant tout! ⚠️',
    'Je sécurise le terrain! 🏰',
    'Défense solide! 💪',
  ],
  CENTER_CONTROL: [
    'Je contrôle le centre! 🎯',
    'Le centre est la clé! 🔑',
    'Position dominante! 👑',
    'Je m\'installe au centre! 📐',
  ],
  RANDOM_MOVE: [
    'Je joue au hasard... 🎲',
    'Voyons voir... 🤔',
    'Tentons notre chance! 🍀',
    'Un coup exploratoire! 🔍',
  ],
};

// Configuration des niveaux d'IA
export const AI_LEVEL_CONFIG = {
  facile: {
    name: 'Facile',
    description: 'Parfait pour débuter',
    icon: '🟢',
    color: '#4CAF50',
  },
  moyen: {
    name: 'Moyen',
    description: 'Un bon challenge',
    icon: '🟡',
    color: '#FFA502',
  },
  difficile: {
    name: 'Difficile',
    description: 'Pour les joueurs confirmés',
    icon: '🟠',
    color: '#FF6348',
  },
  expert: {
    name: 'Expert',
    description: 'Presque imbattable',
    icon: '🔴',
    color: '#FF4757',
  },
};
