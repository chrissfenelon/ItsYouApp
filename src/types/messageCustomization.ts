export interface MessageContainerStyle {
  // Blur effects
  blurAmount: number; // 0-50
  blurType: 'light' | 'dark' | 'regular';

  // Opacity settings
  backgroundOpacity: number; // 0-1
  borderOpacity: number; // 0-1
  contentOpacity: number; // 0-1

  // Colors
  backgroundColor: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  borderColor: {
    primary: string;
    secondary: string;
  };
  textColor: {
    title: string;
    message: string;
    glow: string;
  };

  // Border settings
  borderWidth: number; // 0-5
  borderRadius: number; // 0-50
  borderStyle: 'solid' | 'dashed' | 'dotted';

  // Particles and effects
  particles: {
    enabled: boolean;
    count: number; // 0-100
    size: number; // 1-10
    speed: number; // 0.1-5
    color: string;
    opacity: number; // 0-1
  };

  // Animation settings
  animation: {
    fadeInDuration: number; // 500-5000ms
    fadeInDelay: number; // 0-3000ms
    pulseEnabled: boolean;
    pulseDuration: number; // 1000-5000ms
  };

  // Shadow and glow
  shadow: {
    enabled: boolean;
    color: string;
    opacity: number; // 0-1
    radius: number; // 0-50
    offset: { x: number; y: number };
  };

  // Container dimensions
  dimensions: {
    width: number; // 0.5-1 (percentage of screen width)
    padding: number; // 10-40
    margin: number; // 5-30
  };

  // Font settings
  font: {
    titleFamily: string;
    messageFamily: string;
    titleSize: number; // 14-24
    messageSize: number; // 12-20
    titleWeight: '300' | '400' | '500' | '600' | '700';
    messageWeight: '300' | '400' | '500' | '600' | '700';
  };
}

export interface MessageCustomizationPreset {
  id: string;
  name: string;
  description: string;
  style: MessageContainerStyle;
  thumbnail?: string;
}

export const DEFAULT_MESSAGE_STYLE: MessageContainerStyle = {
  blurAmount: 5,
  blurType: 'light',

  backgroundOpacity: 0.8,
  borderOpacity: 0.4,
  contentOpacity: 1,

  backgroundColor: {
    primary: 'rgba(255, 255, 255, 0.22)',
    secondary: 'rgba(255, 255, 255, 0.1)',
    tertiary: 'rgba(255, 255, 255, 0.05)',
  },
  borderColor: {
    primary: 'rgba(255, 255, 255, 0.45)',
    secondary: 'rgba(255, 255, 255, 0.25)',
  },
  textColor: {
    title: '#FFFFFF',
    message: 'rgba(255, 255, 255, 0.95)',
    glow: 'rgba(255, 105, 180, 0.6)',
  },

  borderWidth: 1,
  borderRadius: 16,
  borderStyle: 'solid',

  particles: {
    enabled: false,
    count: 20,
    size: 2,
    speed: 0.8,
    color: 'rgba(255, 105, 180, 0.4)',
    opacity: 0.4,
  },

  animation: {
    fadeInDuration: 1000,
    fadeInDelay: 0,
    pulseEnabled: false,
    pulseDuration: 2000,
  },

  shadow: {
    enabled: true,
    color: 'rgba(31, 38, 135, 0.28)',
    opacity: 1,
    radius: 48,
    offset: { x: 0, y: 12 },
  },

  dimensions: {
    width: 0.85,
    padding: 20,
    margin: 15,
  },

  font: {
    titleFamily: 'System',
    messageFamily: 'System',
    titleSize: 17,
    messageSize: 15,
    titleWeight: '600',
    messageWeight: '400',
  },
};

export const MESSAGE_CUSTOMIZATION_PRESETS: MessageCustomizationPreset[] = [
  {
    id: 'default',
    name: 'Classique',
    description: 'Le style par défaut élégant et romantique',
    style: DEFAULT_MESSAGE_STYLE,
  },
  {
    id: 'romantic_glow',
    name: 'Éclat Romantique',
    description: 'Une lueur rose intense avec des particules scintillantes',
    style: {
      ...DEFAULT_MESSAGE_STYLE,
      backgroundColor: {
        primary: 'rgba(255, 105, 180, 0.4)',
        secondary: 'rgba(255, 182, 193, 0.2)',
        tertiary: 'rgba(255, 20, 147, 0.1)',
      },
      textColor: {
        title: '#FFE4E1',
        message: '#FFFFFF',
        glow: 'rgba(255, 20, 147, 0.8)',
      },
      particles: {
        enabled: true,
        count: 50,
        size: 4,
        speed: 1.5,
        color: 'rgba(255, 20, 147, 0.8)',
        opacity: 0.8,
      },
      font: {
        ...DEFAULT_MESSAGE_STYLE.font,
        titleWeight: '700',
        messageWeight: '500',
      },
    },
  },
  {
    id: 'ethereal_blue',
    name: 'Bleu Éthéré',
    description: 'Tons bleus doux avec une atmosphère mystique',
    style: {
      ...DEFAULT_MESSAGE_STYLE,
      blurType: 'dark',
      backgroundColor: {
        primary: 'rgba(135, 206, 235, 0.3)',
        secondary: 'rgba(173, 216, 230, 0.15)',
        tertiary: 'rgba(176, 224, 230, 0.05)',
      },
      borderColor: {
        primary: 'rgba(135, 206, 235, 0.4)',
        secondary: 'rgba(65, 105, 225, 0.2)',
      },
      textColor: {
        title: '#E0F6FF',
        message: 'rgba(224, 246, 255, 0.95)',
        glow: 'rgba(65, 105, 225, 0.6)',
      },
      particles: {
        enabled: true,
        count: 25,
        size: 2,
        speed: 0.8,
        color: 'rgba(65, 105, 225, 0.5)',
        opacity: 0.5,
      },
      font: {
        ...DEFAULT_MESSAGE_STYLE.font,
        titleWeight: '500',
        messageWeight: '300',
      },
    },
  },
  {
    id: 'golden_sunset',
    name: 'Coucher Doré',
    description: 'Couleurs dorées chaudes comme un coucher de soleil',
    style: {
      ...DEFAULT_MESSAGE_STYLE,
      backgroundColor: {
        primary: 'rgba(255, 215, 0, 0.3)',
        secondary: 'rgba(255, 165, 0, 0.15)',
        tertiary: 'rgba(255, 140, 0, 0.05)',
      },
      borderColor: {
        primary: 'rgba(255, 215, 0, 0.4)',
        secondary: 'rgba(255, 69, 0, 0.2)',
      },
      textColor: {
        title: '#FFF8DC',
        message: 'rgba(255, 248, 220, 0.95)',
        glow: 'rgba(255, 140, 0, 0.6)',
      },
      particles: {
        enabled: true,
        count: 35,
        size: 3,
        speed: 1.2,
        color: 'rgba(255, 140, 0, 0.7)',
        opacity: 0.7,
      },
      font: {
        ...DEFAULT_MESSAGE_STYLE.font,
        titleWeight: '600',
        messageWeight: '400',
      },
    },
  },
  {
    id: 'minimal_glass',
    name: 'Verre Minimal',
    description: 'Design épuré avec un effet de verre subtil',
    style: {
      ...DEFAULT_MESSAGE_STYLE,
      blurAmount: 10,
      backgroundOpacity: 0.1,
      borderOpacity: 0.15,
      backgroundColor: {
        primary: 'rgba(255, 255, 255, 0.1)',
        secondary: 'rgba(255, 255, 255, 0.05)',
        tertiary: 'rgba(255, 255, 255, 0.02)',
      },
      borderWidth: 1,
      particles: {
        enabled: false,
        count: 0,
        size: 1,
        speed: 0.5,
        color: 'rgba(255, 255, 255, 0.3)',
        opacity: 0.3,
      },
      shadow: {
        enabled: true,
        color: '#000000',
        opacity: 0.1,
        radius: 20,
        offset: { x: 0, y: 10 },
      },
      font: {
        ...DEFAULT_MESSAGE_STYLE.font,
        titleWeight: '300',
        messageWeight: '300',
      },
    },
  },
  {
    id: 'vibrant_neon',
    name: 'Néon Vibrant',
    description: 'Style néon coloré avec des effets dynamiques',
    style: {
      ...DEFAULT_MESSAGE_STYLE,
      blurAmount: 25,
      backgroundColor: {
        primary: 'rgba(255, 0, 255, 0.2)',
        secondary: 'rgba(0, 255, 255, 0.1)',
        tertiary: 'rgba(255, 255, 0, 0.05)',
      },
      borderColor: {
        primary: 'rgba(255, 0, 255, 0.6)',
        secondary: 'rgba(0, 255, 255, 0.4)',
      },
      textColor: {
        title: '#FFFFFF',
        message: '#F0F8FF',
        glow: 'rgba(255, 0, 255, 0.8)',
      },
      borderWidth: 2,
      particles: {
        enabled: true,
        count: 60,
        size: 2,
        speed: 2,
        color: 'rgba(255, 0, 255, 0.8)',
        opacity: 0.8,
      },
      shadow: {
        enabled: true,
        color: '#FF00FF',
        opacity: 0.3,
        radius: 25,
        offset: { x: 0, y: 12 },
      },
      font: {
        ...DEFAULT_MESSAGE_STYLE.font,
        titleWeight: '700',
        messageWeight: '600',
      },
    },
  },
];