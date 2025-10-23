import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';

interface GlassMorphismCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const GlassMorphismCard: React.FC<GlassMorphismCardProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <BlurView
        style={styles.blurView}
        blurType="light"
        blurAmount={5}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.22)"
      >
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: 'rgba(31, 38, 135, 0.28)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 48,
    elevation: 12,
    overflow: 'hidden',
  },
  blurView: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default GlassMorphismCard;