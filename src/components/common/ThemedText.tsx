import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useApp } from '../../context/AppContext';

interface ThemedTextProps extends TextProps {
  /**
   * Base font size for this text
   * If not specified, uses the default from the style or 16
   */
  baseSize?: number;
  /**
   * If true, bypasses global font settings and uses only the provided style
   */
  ignoreGlobalFont?: boolean;
}

/**
 * ThemedText component that automatically applies global font settings
 * Use this instead of React Native's Text component to ensure consistent font styling
 *
 * Example usage:
 * <ThemedText style={{ fontSize: 18, color: 'red' }}>Hello</ThemedText>
 * <ThemedText baseSize={20}>Custom base size</ThemedText>
 * <ThemedText ignoreGlobalFont>Uses only local style</ThemedText>
 */
const ThemedText: React.FC<ThemedTextProps> = ({
  style,
  baseSize,
  ignoreGlobalFont = false,
  ...props
}) => {
  const { getGlobalFont, mergeGlobalFont } = useApp();

  // If ignoring global font, just use the provided style
  if (ignoreGlobalFont) {
    return <Text style={style} {...props} />;
  }

  // Extract base size from style if not provided
  let effectiveBaseSize = baseSize;
  if (!effectiveBaseSize && style) {
    const styleArray = Array.isArray(style) ? style : [style];
    for (const s of styleArray) {
      if (s && typeof s === 'object' && 'fontSize' in s) {
        effectiveBaseSize = s.fontSize as number;
        break;
      }
    }
  }

  // Merge global font with custom style
  const finalStyle = mergeGlobalFont(style, effectiveBaseSize);

  return <Text style={finalStyle} {...props} />;
};

export default ThemedText;
