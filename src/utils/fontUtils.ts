import { TextStyle } from 'react-native';
import { GlobalFontSettings } from '../types/user';

// Font size multipliers
const FONT_SIZE_MULTIPLIERS = {
  tiny: 0.8,
  small: 0.9,
  medium: 1.0,
  large: 1.1,
  xlarge: 1.2,
  xxlarge: 1.35,
};

/**
 * Get the font style based on user's global font settings
 * @param userFontSettings - User's global font settings
 * @param baseSize - Base font size (default: 16)
 * @returns TextStyle object with font family, size, and weight
 */
export const getGlobalFontStyle = (
  userFontSettings?: GlobalFontSettings,
  baseSize: number = 16
): TextStyle => {
  if (!userFontSettings) {
    // Return default if no settings
    return {
      fontSize: baseSize,
      fontWeight: '400',
    };
  }

  const multiplier = FONT_SIZE_MULTIPLIERS[userFontSettings.size] || 1.0;
  const fontSize = baseSize * multiplier;

  return {
    fontFamily: userFontSettings.family !== 'System' ? userFontSettings.family : undefined,
    fontSize,
    fontWeight: userFontSettings.weight as any,
  };
};

/**
 * Merge global font style with custom styles
 * @param userFontSettings - User's global font settings
 * @param customStyle - Custom style to merge
 * @param baseSize - Base font size (default: 16)
 * @returns Merged TextStyle
 */
export const mergeWithGlobalFont = (
  userFontSettings?: GlobalFontSettings,
  customStyle?: TextStyle | TextStyle[],
  baseSize?: number
): TextStyle | TextStyle[] => {
  const globalFont = getGlobalFontStyle(userFontSettings, baseSize);

  if (Array.isArray(customStyle)) {
    return [globalFont, ...customStyle];
  }

  return {
    ...globalFont,
    ...customStyle,
  };
};
