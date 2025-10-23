import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGlobalFontStyle } from '../../utils/fontUtils';
import { GlobalFontSettings } from '../../types/user';

// Cache for font settings to avoid reading from storage on every render
let cachedFontSettings: GlobalFontSettings | null = null;

/**
 * Load font settings from storage and cache them
 */
export const loadFontSettings = async () => {
  try {
    const userDataString = await AsyncStorage.getItem('@user_data');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      cachedFontSettings = userData.globalFontSettings || null;
      console.log('📖 Loaded cached font settings:', cachedFontSettings);
    }
  } catch (error) {
    console.error('Error loading font settings:', error);
  }
};

/**
 * Update cached font settings
 */
export const updateCachedFontSettings = (settings: GlobalFontSettings) => {
  cachedFontSettings = settings;
  console.log('🔄 Updated cached font settings:', settings);
};

/**
 * Custom Text component that automatically applies global font settings
 * This replaces the default Text component throughout the app
 */
const CustomText: React.FC<TextProps> = (props) => {
  const { style, ...otherProps } = props;

  // Extract base font size from style if present
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

  // Apply global font settings if cached
  let finalStyle = style;
  if (cachedFontSettings) {
    const globalStyle = getGlobalFontStyle(cachedFontSettings, baseSize);

    // Merge styles properly
    if (Array.isArray(style)) {
      finalStyle = [globalStyle, ...style];
    } else if (style) {
      finalStyle = [globalStyle, style];
    } else {
      finalStyle = globalStyle;
    }
  }

  return <RNText {...otherProps} style={finalStyle} />;
};

// Preserve display name for debugging
CustomText.displayName = 'Text';

export default CustomText;
