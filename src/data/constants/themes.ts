export interface AppTheme {
  name: 'light' | 'dark';
  colors: {
    // Backgrounds
    background: string;
    backgroundSecondary: string;
    cardBg: string;
    cardBgHover: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textWhite: string;
    textMuted: string;

    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;

    // Accent colors
    accent: string;
    success: string;
    warning: string;
    error: string;

    // Word search specific
    cellDefault: string;
    cellSelected: string;
    cellFoundPrimary: string;
    cellFoundSecondary: string;
    cellFoundTertiary: string;

    // UI Elements
    border: string;
    shadow: string;
    overlay: string;

    // Glassmorphism (Dark theme only)
    glass?: string;
    glassBorder?: string;
  };
  blur: {
    enabled: boolean;
    intensity: number;
  };
}

// Light Theme (Current theme)
export const LIGHT_THEME: AppTheme = {
  name: 'light',
  colors: {
    // Backgrounds
    background: '#F0F4F8',
    backgroundSecondary: '#FFFFFF',
    cardBg: '#FFFFFF',
    cardBgHover: '#F8FAFC',

    // Text
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textWhite: '#FFFFFF',
    textMuted: '#94A3B8',

    // Primary colors
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',

    // Accent colors
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',

    // Word search specific
    cellDefault: '#FFFFFF',
    cellSelected: '#DBEAFE',
    cellFoundPrimary: '#BBF7D0',
    cellFoundSecondary: '#FDE68A',
    cellFoundTertiary: '#FBCFE8',

    // UI Elements
    border: '#E2E8F0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  blur: {
    enabled: false,
    intensity: 0,
  },
};

// Dark Theme (Glassmorphism)
export const DARK_THEME: AppTheme = {
  name: 'dark',
  colors: {
    // Backgrounds - Dark gradient
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    backgroundSecondary: '#1E293B',
    cardBg: 'rgba(30, 41, 59, 0.4)',
    cardBgHover: 'rgba(30, 41, 59, 0.6)',

    // Text
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textWhite: '#FFFFFF',
    textMuted: '#94A3B8',

    // Primary colors - Glassmorphism accent
    primary: '#60A5FA',
    primaryLight: '#93C5FD',
    primaryDark: '#3B82F6',

    // Accent colors
    accent: '#FBBF24',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',

    // Word search specific - Glass effect
    cellDefault: 'rgba(51, 65, 85, 0.6)',
    cellSelected: 'rgba(59, 130, 246, 0.3)',
    cellFoundPrimary: 'rgba(52, 211, 153, 0.4)',
    cellFoundSecondary: 'rgba(251, 191, 36, 0.4)',
    cellFoundTertiary: 'rgba(244, 114, 182, 0.4)',

    // UI Elements
    border: 'rgba(148, 163, 184, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Glassmorphism specific
    glass: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
  },
  blur: {
    enabled: true,
    intensity: 20,
  },
};

// Helper to get theme by name
export const getTheme = (themeName: 'light' | 'dark'): AppTheme => {
  return themeName === 'dark' ? DARK_THEME : LIGHT_THEME;
};

// Backward compatibility - export current colors for word search
export const WORD_SEARCH_COLORS = LIGHT_THEME.colors;
