import { Colors } from './Colors';

export const DarkTheme = {
  // Couleurs de base plus sombres et romantiques
  background: {
    primary: '#0A0A0F',        // Noir très profond avec nuance bleue
    secondary: '#151520',      // Gris très foncé avec nuance violette
    tertiary: '#1F1F2E',      // Gris foncé avec nuance violette
    overlay: 'rgba(0,0,0,0.85)', // Overlay plus opaque
    card: 'rgba(15,15,30,0.95)', // Cards semi-transparentes
  },

  // Textes avec plus de contraste
  text: {
    primary: '#FFFFFF',        // Blanc pur pour le contraste maximal
    secondary: '#E8E8F0',      // Blanc légèrement teinté
    tertiary: '#B8B8D0',      // Gris clair avec nuance violette
    accent: Colors.primary.pink, // Rose romantique
    muted: '#7A7A90',         // Gris moyen pour les textes secondaires
  },

  // Couleurs romantiques adaptées au sombre
  romantic: {
    primary: '#FF69B4',       // Rose vif (même que Colors)
    secondary: '#FF1493',     // Rose profond
    tertiary: '#FFB6C1',     // Rose clair
    accent: '#FF7F7F',        // Corail romantique
    heart: '#FF6B9D',         // Rose coeur spécial
  },

  // Gradients sombres romantiques
  gradients: {
    background: ['#0A0A0F', '#151520', '#1F1F2E'],
    romantic: ['rgba(255,105,180,0.9)', 'rgba(255,20,147,0.8)', 'rgba(220,20,60,0.7)'],
    dreamy: ['rgba(255,105,180,0.6)', 'rgba(255,182,193,0.4)', 'rgba(0,0,0,0.9)'],
    night: ['#0F0F23', '#16213E', '#1A1A2E'],
    starry: ['rgba(255,215,0,0.1)', 'rgba(255,105,180,0.2)', 'rgba(0,0,0,0.95)'],
  },

  // Bordures et séparateurs
  border: {
    primary: 'rgba(255,105,180,0.3)',
    secondary: 'rgba(255,255,255,0.1)',
    tertiary: 'rgba(255,255,255,0.05)',
  },

  // Ombres adaptées au thème sombre
  shadows: {
    romantic: {
      shadowColor: Colors.primary.pink,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    },
    button: {
      shadowColor: Colors.primary.pink,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 14,
      elevation: 10,
    },
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 14,
      elevation: 10,
    },
  },

  // Glassmorphism effects
  glassmorphism: {
    background: 'rgba(0,0,0,0.3)',
    border: 'rgba(255,255,255,0.15)',
  },

  // États des boutons et interactions
  interactive: {
    active: 'rgba(255,105,180,0.2)',
    hover: 'rgba(255,105,180,0.1)',
    pressed: 'rgba(255,105,180,0.3)',
    disabled: 'rgba(255,255,255,0.1)',
  },

  // Couleurs de statut adaptées au sombre
  status: {
    success: '#32D74B',
    warning: '#FFD60A',
    error: '#FF453A',
    info: Colors.system.blue,
  },
};

export const LuxuriousTheme = {
  // Apple-inspired dark luxury: Deep blacks with subtle warmth
  background: {
    primary: '#000000',        // Pure black - Apple Pro Display XDR inspired
    secondary: '#1C1C1E',      // iOS system gray 6 dark
    tertiary: '#2C2C2E',       // iOS system gray 5 dark
    overlay: 'rgba(0,0,0,0.92)',     // Deep overlay with slight transparency
    card: 'rgba(28,28,30,0.98)',     // Elevated card surface - subtle lift
  },

  // Premium text hierarchy - Apple SF Pro inspired
  text: {
    primary: '#FFFFFF',        // Pure white for maximum contrast
    secondary: '#EBEBF5',      // iOS label secondary (99% opacity white)
    tertiary: '#EBEBF599',     // iOS label tertiary (60% opacity white)
    accent: '#FF375F',         // Premium rose-red accent - luxury feel
    muted: '#8E8E93',         // iOS system gray - subtle text
  },

  // Luxurious romantic accents - refined and sophisticated
  romantic: {
    primary: '#FF375F',       // Deep rose-red - premium feel
    secondary: '#FF2D55',     // iOS system pink
    tertiary: '#FF6482',      // Lighter rose accent
    accent: '#FF9AA2',        // Soft rose glow
    heart: '#FF2D55',         // iOS pink for hearts
  },

  // Rich gradients with depth
  gradients: {
    background: ['#000000', '#0A0A0A', '#1C1C1E'],  // Subtle depth gradient
    romantic: ['rgba(255,55,95,0.95)', 'rgba(255,45,85,0.85)', 'rgba(255,100,130,0.75)'],
    dreamy: ['rgba(255,55,95,0.5)', 'rgba(255,154,162,0.3)', 'rgba(0,0,0,0.95)'],
    night: ['#000000', '#0A0A0A', '#1C1C1E'],  // Deep blacks
    starry: ['rgba(255,215,0,0.15)', 'rgba(255,55,95,0.25)', 'rgba(0,0,0,0.98)'],
  },

  // Refined borders - minimal but intentional
  border: {
    primary: 'rgba(255,55,95,0.4)',      // Soft romantic glow
    secondary: 'rgba(255,255,255,0.12)',  // Subtle separator - iOS style
    tertiary: 'rgba(255,255,255,0.06)',   // Ultra-subtle divider
  },

  // Premium shadows - Apple elevation system
  shadows: {
    romantic: {
      shadowColor: '#FF375F',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 16,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.7,
      shadowRadius: 16,
      elevation: 12,
    },
    button: {
      shadowColor: '#FF375F',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 18,
      elevation: 14,
    },
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 12,
    },
  },

  // Luxurious glassmorphism - Apple-style frosted glass
  glassmorphism: {
    background: 'rgba(28,28,30,0.7)',     // Frosted dark glass
    border: 'rgba(255,255,255,0.18)',     // Subtle glass edge
  },

  // Premium interactive states
  interactive: {
    active: 'rgba(255,55,95,0.25)',       // Luxurious active state
    hover: 'rgba(255,55,95,0.15)',        // Subtle hover
    pressed: 'rgba(255,55,95,0.35)',      // Strong pressed feedback
    disabled: 'rgba(255,255,255,0.08)',   // Minimal disabled state
  },

  // Apple system status colors
  status: {
    success: '#30D158',      // iOS green
    warning: '#FFD60A',      // iOS yellow
    error: '#FF453A',        // iOS red
    info: '#64D2FF',         // iOS cyan
  },
};

export const RoseTheme = {
  background: {
    primary: '#FFF8F9',        // Rose très clair comme base
    secondary: '#FFE8ED',      // Rose pâle
    tertiary: '#FFD6E1',       // Rose légèrement plus prononcé
    overlay: 'rgba(255,240,245,0.95)', // Overlay rose très clair
    card: 'rgba(255,248,249,0.98)', // Cards roses transparentes
  },

  text: {
    primary: '#2D1B21',        // Brun foncé pour bon contraste
    secondary: '#4A2C35',      // Brun rose
    tertiary: '#6B4048',       // Brun rose moyen
    accent: '#D63384',         // Rose vif pour accents
    muted: '#8B5A66',         // Rose gris pour texte secondaire
  },

  romantic: {
    primary: '#FF69B4',       // Rose vif signature
    secondary: '#E91E63',     // Rose intense
    tertiary: '#F8BBD9',     // Rose pastel
    accent: '#FF8FAB',        // Rose corail
    heart: '#FF6B9D',         // Rose coeur
  },

  gradients: {
    background: ['#FFF8F9', '#FFE8ED', '#FFD6E1'],
    romantic: ['rgba(255,105,180,0.7)', 'rgba(233,30,99,0.5)', 'rgba(248,187,217,0.3)'],
    dreamy: ['rgba(255,143,171,0.4)', 'rgba(248,187,217,0.3)', 'rgba(255,248,249,0.95)'],
    night: ['#FFE8ED', '#FFD6E1', '#FFC1CC'],
    starry: ['rgba(255,215,0,0.2)', 'rgba(255,105,180,0.3)', 'rgba(255,248,249,0.9)'],
  },

  border: {
    primary: 'rgba(255,105,180,0.4)',
    secondary: 'rgba(233,30,99,0.2)',
    tertiary: 'rgba(255,105,180,0.1)',
  },

  shadows: {
    romantic: {
      shadowColor: '#FF69B4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    card: {
      shadowColor: '#E91E63',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    button: {
      shadowColor: '#FF69B4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    small: {
      shadowColor: '#E91E63',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#E91E63',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#FF69B4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 8,
    },
  },

  glassmorphism: {
    background: 'rgba(255,248,249,0.6)',
    border: 'rgba(233,30,99,0.15)',
  },

  interactive: {
    active: 'rgba(255,105,180,0.2)',
    hover: 'rgba(255,105,180,0.1)',
    pressed: 'rgba(255,105,180,0.3)',
    disabled: 'rgba(233,30,99,0.1)',
  },

  status: {
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
  },
};

export const AutoTheme = {
  // Auto theme will dynamically switch between luxurious and dark based on system preference
  // For now, we'll use luxurious as default
  ...LuxuriousTheme,
  name: 'auto',
};

export const SunsetTheme = {
  background: {
    primary: '#FFF4E6',        // Orange très clair
    secondary: '#FFE4B5',      // Pêche clair
    tertiary: '#FFD4A3',       // Orange pastel
    overlay: 'rgba(255,244,230,0.95)',
    card: 'rgba(255,244,230,0.98)',
  },

  text: {
    primary: '#2D1810',        // Brun foncé
    secondary: '#4A2A1A',      // Brun orange
    tertiary: '#663D24',       // Brun orange moyen
    accent: '#FF6B35',         // Orange vif
    muted: '#8B5A3C',         // Orange gris
  },

  romantic: {
    primary: '#FF6B35',       // Orange romantique
    secondary: '#FF4500',     // Orange rouge
    tertiary: '#FFB366',     // Orange pastel
    accent: '#FF8C69',        // Saumon
    heart: '#FF7F50',         // Corail
  },

  gradients: {
    background: ['#FFF4E6', '#FFE4B5', '#FFD4A3'],
    romantic: ['rgba(255,107,53,0.7)', 'rgba(255,69,0,0.5)', 'rgba(255,179,102,0.3)'],
    dreamy: ['rgba(255,140,105,0.4)', 'rgba(255,179,102,0.3)', 'rgba(255,244,230,0.95)'],
    night: ['#FFE4B5', '#FFD4A3', '#FFC491'],
    starry: ['rgba(255,215,0,0.3)', 'rgba(255,107,53,0.3)', 'rgba(255,244,230,0.9)'],
  },

  border: {
    primary: 'rgba(255,107,53,0.4)',
    secondary: 'rgba(255,69,0,0.2)',
    tertiary: 'rgba(255,107,53,0.1)',
  },

  shadows: {
    romantic: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    card: {
      shadowColor: '#FF4500',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    button: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    small: {
      shadowColor: '#FF4500',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#FF4500',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 8,
    },
  },

  glassmorphism: {
    background: 'rgba(255,244,230,0.6)',
    border: 'rgba(255,69,0,0.15)',
  },

  interactive: {
    active: 'rgba(255,107,53,0.2)',
    hover: 'rgba(255,107,53,0.1)',
    pressed: 'rgba(255,107,53,0.3)',
    disabled: 'rgba(255,69,0,0.1)',
  },

  status: {
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
  },
};

// Theme types for TypeScript
export type ThemeType = 'dark' | 'luxurious' | 'rose' | 'auto' | 'sunset';

export const THEMES = {
  dark: DarkTheme,
  luxurious: LuxuriousTheme,
  rose: RoseTheme,
  auto: AutoTheme,
  sunset: SunsetTheme,
};

// Current theme - will be managed by context
export const CurrentTheme = DarkTheme;

export default CurrentTheme;