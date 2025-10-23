/**
 * Global Text Setup
 *
 * This file MUST be imported FIRST in App.tsx before any other imports
 * It initializes the global text replacement immediately
 */

// Initialize global text replacement IMMEDIATELY
const setupGlobalText = () => {
  try {
    console.log('🔤 Setting up global text replacement...');

    // Get react-native module
    const ReactNative = require('react-native');

    // We'll define CustomText inline here to avoid circular dependencies
    const React = require('react');

    // Import utilities
    const { getGlobalFontStyle } = require('../utils/fontUtils');

    // Store original Text component
    const OriginalText = ReactNative.Text;

    // Global font settings cache
    let globalFontCache: any = null;

    // Update function that will be exported
    const updateCache = (settings: any) => {
      globalFontCache = settings;
      console.log('🔄 Global font cache updated:', settings);
    };

    // Custom Text component
    class CustomText extends React.Component<any> {
      render() {
        const { style, ...otherProps } = this.props;

        // If no global fonts, use original
        if (!globalFontCache) {
          return React.createElement(OriginalText, this.props);
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

        // Merge styles - Put global FIRST, then user styles can override if needed
        // But fontFamily and fontWeight from global will always apply
        let finalStyle;
        if (Array.isArray(style)) {
          // Flatten array and merge with global
          const flatStyle = Object.assign({}, ...style.map(s => s || {}));
          finalStyle = { ...globalStyle, ...flatStyle, fontFamily: globalStyle.fontFamily, fontWeight: globalStyle.fontWeight };
        } else if (style) {
          finalStyle = { ...globalStyle, ...(style as any), fontFamily: globalStyle.fontFamily, fontWeight: globalStyle.fontWeight };
        } else {
          finalStyle = globalStyle;
        }

        return React.createElement(OriginalText, {
          ...otherProps,
          style: finalStyle,
        });
      }
    }

    // Store original Text if not already stored
    if (!ReactNative._originalText) {
      ReactNative._originalText = OriginalText;
      console.log('💾 Stored original Text component');
    }

    // Replace Text with our custom version
    ReactNative.Text = CustomText;
    (ReactNative.Text as any).displayName = 'Text';

    // Also replace in default export
    if (ReactNative.default && ReactNative.default.Text) {
      ReactNative.default.Text = CustomText;
    }

    console.log('✅ Global Text replacement initialized at startup!');
    console.log('📝 All Text components will now use global font settings');

    // Export update function
    (global as any).__updateGlobalFontCache = updateCache;

    return true;
  } catch (error) {
    console.error('❌ Failed to setup global text replacement:', error);
    return false;
  }
};

// Execute immediately
setupGlobalText();

// Export update function helper
export const updateGlobalFontCache = (settings: any) => {
  if ((global as any).__updateGlobalFontCache) {
    (global as any).__updateGlobalFontCache(settings);
  } else {
    console.warn('⚠️ Global font cache update function not available');
  }
};

export default setupGlobalText;
