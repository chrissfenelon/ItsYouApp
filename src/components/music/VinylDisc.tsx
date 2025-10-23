import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Foundation from 'react-native-vector-icons/Foundation';
import { VinylDisc as VinylDiscType } from '../../types/music';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VinylDiscProps {
  size?: number;
  isPlaying: boolean;
  vinylDisc: VinylDiscType | null;
  albumArt?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

const VinylDisc: React.FC<VinylDiscProps> = ({
  size = SCREEN_WIDTH * 0.75,
  isPlaying,
  vinylDisc,
  albumArt,
  onPress,
  onLongPress,
}) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const tonearmAngle = useRef(new Animated.Value(0)).current;
  const shinePosition = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const shineAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isPlaying) {
      // Start spinning
      rotation.setValue(0);
      animationRef.current = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
          isInteraction: false,
        })
      );
      animationRef.current.start();

      // Start shine animation
      shineAnimationRef.current = Animated.loop(
        Animated.timing(shinePosition, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      shineAnimationRef.current.start();

      // Move tonearm to playing position
      Animated.spring(tonearmAngle, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      // Stop spinning
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (shineAnimationRef.current) {
        shineAnimationRef.current.stop();
      }

      // Move tonearm back to rest position
      Animated.spring(tonearmAngle, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (shineAnimationRef.current) {
        shineAnimationRef.current.stop();
      }
    };
  }, [isPlaying]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const tonearmRotateInterpolate = tonearmAngle.interpolate({
    inputRange: [0, 1],
    outputRange: ['-25deg', '0deg'],
  });

  const shinePositionInterpolate = shinePosition.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const vinylColors = {
    black: ['#0a0a0a', '#1a1a1a', '#2a2a2a'],
    red: ['#5a0000', '#8B0000', '#aa0000'],
    pink: ['#FF1493', '#FF69B4', '#FFB6C1'],
    gold: ['#B8860B', '#FFD700', '#FFF8DC'],
    translucent: ['rgba(60, 60, 60, 0.4)', 'rgba(100, 100, 100, 0.6)', 'rgba(140, 140, 140, 0.4)'],
  };

  const vinylColor = vinylDisc?.vinylColor || 'black';
  const centerPhoto = vinylDisc?.centerPhotoUri || albumArt;
  // Use larger size for center photo from vinyl customization
  const labelSize = vinylDisc?.centerPhotoUri ? size * 0.85 : size * 0.35;

  return (
    <View style={[styles.mainContainer, { width: size + 120, height: size + 120 }]}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.9}
        style={[styles.container, { width: size + 40, height: size + 40 }]}
      >
        {/* Outer glow with pulse effect */}
        <View
          style={[
            styles.glow,
            {
              width: size + 30,
              height: size + 30,
              borderRadius: (size + 30) / 2,
            },
          ]}
        />

        {/* Vinyl disc container */}
        <Animated.View
          style={[
            styles.vinyl,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ rotate: rotateInterpolate }],
            },
          ]}
        >
          {/* Radial gradient background for vinyl */}
          <LinearGradient
            colors={vinylColors[vinylColor]}
            style={[
              styles.vinylGradient,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Grooves - create realistic vinyl texture */}
            {[...Array(20)].map((_, i) => (
              <View
                key={`groove-${i}`}
                style={[
                  styles.groove,
                  {
                    width: size - i * (size * 0.025),
                    height: size - i * (size * 0.025),
                    borderRadius: (size - i * (size * 0.025)) / 2,
                    opacity: 0.03 + (i % 3) * 0.02,
                  },
                ]}
              />
            ))}

            {/* Rotating shine effect */}
            <Animated.View
              style={[
                styles.shineContainer,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  transform: [{ rotate: shinePositionInterpolate }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.shine,
                  {
                    width: size * 0.3,
                    height: size,
                  },
                ]}
              />
            </Animated.View>

            {/* Center label */}
            <View
              style={[
                styles.label,
                {
                  width: labelSize,
                  height: labelSize,
                  borderRadius: labelSize / 2,
                },
              ]}
            >
              {/* Label gradient */}
              <LinearGradient
                colors={['#f5f5f5', '#e0e0e0', '#d0d0d0']}
                style={[
                  styles.labelGradient,
                  {
                    width: labelSize,
                    height: labelSize,
                    borderRadius: labelSize / 2,
                  },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Album art or center photo */}
                {centerPhoto ? (
                  <View
                    style={[
                      styles.albumArtContainer,
                      {
                        width: labelSize * 0.85,
                        height: labelSize * 0.85,
                        borderRadius: (labelSize * 0.85) / 2,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: centerPhoto }}
                      style={[
                        styles.albumArt,
                        {
                          width: labelSize * 0.85,
                          height: labelSize * 0.85,
                          borderRadius: (labelSize * 0.85) / 2,
                        },
                      ]}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View style={styles.defaultIconContainer}>
                    <Foundation name="music" size={labelSize * 0.4} color="#666" />
                  </View>
                )}

                {/* Decorative circles on label */}
                <View
                  style={[
                    styles.labelRing,
                    {
                      width: labelSize * 0.95,
                      height: labelSize * 0.95,
                      borderRadius: (labelSize * 0.95) / 2,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.labelRing,
                    {
                      width: labelSize * 0.75,
                      height: labelSize * 0.75,
                      borderRadius: (labelSize * 0.75) / 2,
                    },
                  ]}
                />
              </LinearGradient>
            </View>

            {/* Center hole */}
            <View
              style={[
                styles.hole,
                {
                  width: size * 0.045,
                  height: size * 0.045,
                  borderRadius: size * 0.0225,
                },
              ]}
            >
              <View
                style={[
                  styles.holeInner,
                  {
                    width: size * 0.04,
                    height: size * 0.04,
                    borderRadius: size * 0.02,
                  },
                ]}
              />
            </View>
          </LinearGradient>

          {/* Edge highlight */}
          <View
            style={[
              styles.edgeHighlight,
              {
                width: size - 4,
                height: size - 4,
                borderRadius: (size - 4) / 2,
              },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Tonearm (bras de lecture) */}
      <Animated.View
        style={[
          styles.tonearmContainer,
          {
            transform: [{ rotate: tonearmRotateInterpolate }],
            right: size * 0.15,
            top: size * 0.1,
          },
        ]}
      >
        {/* Tonearm base */}
        <View style={styles.tonearmBase}>
          <View style={styles.tonearmBaseInner} />
        </View>

        {/* Tonearm arm */}
        <View style={styles.tonearmArm}>
          <LinearGradient
            colors={['#c0c0c0', '#e8e8e8', '#a0a0a0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tonearmArmGradient}
          >
            {/* Tonearm head */}
            <View style={styles.tonearmHead}>
              <View style={styles.tonearmNeedle} />
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: 'rgba(255, 105, 180, 0.5)',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 20,
  },
  vinyl: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  vinylGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  groove: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shineContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  shine: {
    opacity: 0.7,
  },
  label: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    overflow: 'hidden',
  },
  labelGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  albumArtContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    backgroundColor: '#fff',
  },
  albumArt: {
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  labelRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  defaultIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hole: {
    backgroundColor: '#000000',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 15,
  },
  holeInner: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  edgeHighlight: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
  },
  tonearmContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    transformOrigin: 'top left',
  },
  tonearmBase: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  tonearmBaseInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  tonearmArm: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 90,
    height: 6,
    transformOrigin: 'left center',
  },
  tonearmArmGradient: {
    flex: 1,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
  },
  tonearmHead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  tonearmNeedle: {
    width: 2,
    height: 8,
    backgroundColor: '#888',
    borderRadius: 1,
  },
});

export default VinylDisc;
