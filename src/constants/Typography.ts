import { Platform } from 'react-native';

export const Typography = {
  // Apple SF Pro font weights
  weights: {
    ultraLight: Platform.select({ ios: '100', android: '100' }),
    thin: Platform.select({ ios: '200', android: '200' }),
    light: Platform.select({ ios: '300', android: '300' }),
    regular: Platform.select({ ios: '400', android: '400' }),
    medium: Platform.select({ ios: '500', android: '500' }),
    semiBold: Platform.select({ ios: '600', android: '600' }),
    bold: Platform.select({ ios: '700', android: '700' }),
    heavy: Platform.select({ ios: '800', android: '800' }),
    black: Platform.select({ ios: '900', android: '900' }),
  },

  // Apple Text Styles
  sizes: {
    // Headlines
    largeTitle: 34,      // Large Title
    title1: 28,          // Title 1
    title2: 22,          // Title 2
    title3: 20,          // Title 3

    // Body
    headline: 17,        // Headline
    body: 17,           // Body
    callout: 16,        // Callout
    subhead: 15,        // Subhead
    footnote: 13,       // Footnote
    caption1: 12,       // Caption 1
    caption2: 11,       // Caption 2
  },

  // Font families
  families: {
    ios: 'SF Pro Text',
    android: 'Roboto',
    system: Platform.select({
      ios: 'SF Pro Text',
      android: 'Roboto',
    }),
  },

  // Predefined text styles - Apple HIG compliant
  styles: {
    largeTitle: {
      fontSize: 34,
      fontWeight: '700' as const,
      lineHeight: 41,
      letterSpacing: 0.37,
    },
    title1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
      letterSpacing: 0.36,
    },
    title2: {
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 28,
      letterSpacing: 0.35,
    },
    title3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 25,
      letterSpacing: 0.38,
    },
    headline: {
      fontSize: 17,
      fontWeight: '600' as const,
      lineHeight: 22,
      letterSpacing: -0.41,
    },
    body: {
      fontSize: 17,
      fontWeight: '400' as const,
      lineHeight: 22,
      letterSpacing: -0.41,
    },
    callout: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 21,
      letterSpacing: -0.32,
    },
    subhead: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: -0.24,
    },
    footnote: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
      letterSpacing: -0.08,
    },
    caption1: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0,
    },
    caption2: {
      fontSize: 11,
      fontWeight: '400' as const,
      lineHeight: 13,
      letterSpacing: 0.07,
    }
  }
};

export default Typography;