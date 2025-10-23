import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Particle {
  id: number;
  animatedValue: Animated.Value;
  x: number;
  y: number;
  size: number;
  speed: number;
  direction: number;
  opacity: Animated.Value;
}

interface ParticleSystemProps {
  count: number;
  size: number;
  speed: number;
  color: string;
  opacity: number;
  containerWidth: number;
  containerHeight: number;
  enabled: boolean;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({
  count,
  size,
  speed,
  color,
  opacity,
  containerWidth,
  containerHeight,
  enabled,
}) => {
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<NodeJS.Timeout>();

  // Limit particle count for performance
  const optimizedCount = useMemo(() => Math.min(count, 30), [count]);

  useEffect(() => {
    if (!enabled || optimizedCount === 0) {
      // Clear existing particles
      particlesRef.current = [];
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      return;
    }

    // Initialize particles with better performance
    const particles: Particle[] = [];
    for (let i = 0; i < optimizedCount; i++) {
      particles.push({
        id: i,
        animatedValue: new Animated.Value(0),
        x: Math.random() * containerWidth,
        y: Math.random() * containerHeight,
        size: size + Math.random() * (size / 2),
        speed: speed + Math.random() * speed * 0.5, // Reduced speed variation
        direction: Math.random() * Math.PI * 2,
        opacity: new Animated.Value(Math.random() * opacity * 0.7), // Reduced opacity
      });
    }

    particlesRef.current = particles;

    // Start optimized animation with reduced frequency
    const animateParticles = () => {
      particles.forEach((particle) => {
        // Simple loop animation with native driver
        Animated.loop(
          Animated.timing(particle.animatedValue, {
            toValue: 1,
            duration: 3000 + Math.random() * 2000, // Longer, smoother animations
            useNativeDriver: true,
          }),
          { resetBeforeIteration: true }
        ).start();

        // Simple opacity pulse with native driver
        Animated.loop(
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: opacity * 0.8,
              duration: 2000 + Math.random() * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: opacity * 0.3,
              duration: 2000 + Math.random() * 1000,
              useNativeDriver: true,
            }),
          ]),
          { resetBeforeIteration: true }
        ).start();
      });
    };

    // Run animation once instead of interval
    animateParticles();

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      // Stop all animations
      particles.forEach(particle => {
        particle.animatedValue.stopAnimation();
        particle.opacity.stopAnimation();
      });
    };
  }, [optimizedCount, size, speed, opacity, containerWidth, containerHeight, enabled]);

  if (!enabled || count === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      {particlesRef.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: color,
              opacity: particle.opacity,
              transform: [
                {
                  translateX: particle.animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.cos(particle.direction) * particle.speed * 10], // Reduced movement
                  }),
                },
                {
                  translateY: particle.animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin(particle.direction) * particle.speed * 10], // Reduced movement
                  }),
                },
                {
                  scale: particle.animatedValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.1, 0.8], // Reduced scale variation
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    // Removed shadows for better performance
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
});

export default ParticleSystem;