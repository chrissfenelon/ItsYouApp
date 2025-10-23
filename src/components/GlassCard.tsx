import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurAmount?: number;
  blurType?: 'light' | 'dark' | 'regular';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  shadowOffset?: { width: number; height: number };
  elevation?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  blurAmount = 5,
  blurType = 'light',
  backgroundColor = 'rgba(255, 255, 255, 0.22)',
  borderColor = 'rgba(255, 255, 255, 0.45)',
  borderWidth = 1,
  borderRadius = 16,
  shadowColor = 'rgba(31, 38, 135, 0.28)',
  shadowOpacity = 1,
  shadowRadius = 48,
  shadowOffset = { width: 0, height: 12 },
  elevation = 12,
}) => {
  const containerStyle = {
    borderRadius,
    backgroundColor,
    borderWidth,
    borderColor,
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default GlassCard;