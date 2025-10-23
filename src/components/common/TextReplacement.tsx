/**
 * Global Text Replacement
 * This file monkey-patches the Text component from react-native
 * to automatically apply global font settings
 *
 * Import this file ONCE at the very beginning of your app (in App.tsx)
 */

import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { getGlobalFontStyle } from '../../utils/fontUtils';
import { GlobalFontSettings } from '../../types/user';

// Store original Text component
const OriginalText = RNText;

// Global font settings cache
let globalFontCache: GlobalFontSettings | null = null;

/**
 * Update the global font cache
 * Call this whenever font settings change
 */
export const updateGlobalFontCache = (settings: GlobalFontSettings | null) => {
  globalFontCache = settings;
  console.log('🔄 Global font cache updated:', settings);
};

/**
 * Custom Text component with automatic font application
 */
class CustomText extends React.Component<TextProps> {
  render() {
    const { style, ...otherProps } = this.props;

    // If no global fonts, use original
    if (!globalFontCache) {
      return React.createElement(OriginalText, this.props as any);
    }

    // Extract base font size
    let baseSize = 16;
    if (style) {
      const styleArray = Array.isArray(style) ? style : [style];
      for (const s of styleArray) {
        if (s && typeof s === 'object' && 'fontSize' in s) {
          baseSize = (s as any).fontSize;
          break;
        }
      }
    }

    // Get global font style
    const globalStyle = getGlobalFontStyle(globalFontCache, baseSize);

    // Merge styles
    let finalStyle;
    if (Array.isArray(style)) {
      finalStyle = [globalStyle, ...style];
    } else if (style) {
      finalStyle = [globalStyle, style];
    } else {
      finalStyle = globalStyle;
    }

    return React.createElement(OriginalText, {
      ...otherProps,
      style: finalStyle,
    } as any);
  }
}

/**
 * Initialize global text replacement
 * This replaces Text in react-native module
 */
export const initializeGlobalTextReplacement = () => {
  try {
    // Get react-native module
    const ReactNative = require('react-native');

    // Store original Text
    if (!ReactNative._originalText) {
      ReactNative._originalText = ReactNative.Text;
      console.log('💾 Stored original Text component');
    }

    // Replace Text with our custom version
    ReactNative.Text = CustomText;
    (ReactNative.Text as any).displayName = 'Text';

    // Also try to replace in default export
    if (ReactNative.default && ReactNative.default.Text) {
      ReactNative.default.Text = CustomText;
    }

    console.log('✅ Global Text replacement initialized!');
    console.log('📝 All Text components will now use global font settings');

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize global text replacement:', error);
    return false;
  }
};

/**
 * Restore original Text component (for debugging)
 */
export const restoreOriginalText = () => {
  try {
    const ReactNative = require('react-native');
    if (ReactNative._originalText) {
      ReactNative.Text = ReactNative._originalText;
      console.log('🔙 Restored original Text component');
    }
  } catch (error) {
    console.error('Error restoring original Text:', error);
  }
};

export default initializeGlobalTextReplacement;
