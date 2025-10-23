import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ParticleEffectType } from '../../types/music';

const { width, height } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
}

interface BackgroundEffectsProps {
  activeEffects: ParticleEffectType[];
}

const PARTICLE_COUNT = 20; // More particles for better effect

const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ activeEffects }) => {
  const particlesMap = useRef<Map<ParticleEffectType, Particle[]>>(new Map());
  const animationsMap = useRef<Map<ParticleEffectType, Animated.CompositeAnimation[]>>(new Map());

  useEffect(() => {
    const timeoutIds: NodeJS.Timeout[] = [];

    // Clean up effects that are no longer active
    particlesMap.current.forEach((_, effectType) => {
      if (!activeEffects.includes(effectType)) {
        animationsMap.current.get(effectType)?.forEach(anim => anim.stop());
        animationsMap.current.delete(effectType);
        particlesMap.current.delete(effectType);
      }
    });

    // Initialize new effects
    activeEffects.forEach((effectType) => {
      if (!particlesMap.current.has(effectType)) {
        const count = effectType === 'fireflies' ? 15 : PARTICLE_COUNT;
        const particles = Array.from({ length: count }, (_, i) => {
          const startX = Math.random() * width;
          const startY = effectType === 'snow' ? -50 - Math.random() * 200 :
                        effectType === 'bubbles' || effectType === 'hearts' || effectType === 'petals'
                        ? height + 50 + Math.random() * 200
                        : Math.random() * height;

          return {
            x: new Animated.Value(startX),
            y: new Animated.Value(startY),
            opacity: new Animated.Value(0),
            scale: new Animated.Value(Math.random() * 0.5 + 0.5),
            rotation: new Animated.Value(Math.random() * 360),
          };
        });
        particlesMap.current.set(effectType, particles);

        const animations = particles.map((particle, i) =>
          createAnimationForEffect(effectType, particle, i)
        );
        animationsMap.current.set(effectType, animations);

        // Stagger the start - track all timeout IDs for cleanup
        animations.forEach((anim, i) => {
          const timeoutId = setTimeout(() => anim.start(), i * 300);
          timeoutIds.push(timeoutId);
        });
      }
    });

    return () => {
      // Clear all staggered timeouts
      timeoutIds.forEach(id => clearTimeout(id));

      // Stop all animations
      animationsMap.current.forEach((anims) => {
        anims.forEach(anim => anim.stop());
      });
    };
  }, [activeEffects]);

  const createAnimationForEffect = (
    effectType: ParticleEffectType,
    particle: Particle,
    index: number
  ): Animated.CompositeAnimation => {
    const duration = Math.random() * 4000 + 6000;
    const delay = index * 200;

    switch (effectType) {
      case 'hearts':
        // Floating hearts with pulse
        return Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(particle.opacity, {
                toValue: 0.8,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: Math.random() * 0.3 + 0.8,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.y, {
                toValue: -100,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(particle.x, {
                  toValue: particle.x._value + (Math.random() * 60 - 30),
                  duration: duration / 3,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.x, {
                  toValue: particle.x._value + (Math.random() * 60 - 30),
                  duration: duration / 3,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.x, {
                  toValue: particle.x._value + (Math.random() * 60 - 30),
                  duration: duration / 3,
                  useNativeDriver: true,
                }),
              ]),
              Animated.sequence([
                Animated.timing(particle.scale, {
                  toValue: Math.random() * 0.3 + 1.0,
                  duration: duration / 2,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.scale, {
                  toValue: Math.random() * 0.2 + 0.6,
                  duration: duration / 2,
                  useNativeDriver: true,
                }),
              ]),
              Animated.timing(particle.rotation, {
                toValue: 360,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: duration * 0.3,
                delay: duration * 0.7,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.y, {
                toValue: height + 50 + Math.random() * 200,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(particle.x, {
                toValue: Math.random() * width,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(particle.rotation, {
                toValue: Math.random() * 360,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ])
        );

      case 'stars':
        // Twinkling stars
        return Animated.loop(
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: Math.random() * 0.5 + 0.5,
              duration: Math.random() * 1000 + 500,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: Math.random() * 0.3 + 0.1,
              duration: Math.random() * 1000 + 500,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(particle.scale, {
                toValue: Math.random() * 0.5 + 1.2,
                duration: Math.random() * 800 + 400,
                useNativeDriver: true,
              }),
              Animated.timing(particle.rotation, {
                toValue: particle.rotation._value + 180,
                duration: Math.random() * 2000 + 1000,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(particle.scale, {
              toValue: Math.random() * 0.3 + 0.7,
              duration: Math.random() * 800 + 400,
              useNativeDriver: true,
            }),
          ])
        );

      case 'sparkles':
        // Quick sparkle bursts
        return Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(particle.opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 1.5,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0.2,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(particle.rotation, {
                toValue: particle.rotation._value + 360,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
            Animated.delay(Math.random() * 2000 + 1000),
            Animated.parallel([
              Animated.timing(particle.x, {
                toValue: Math.random() * width,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(particle.y, {
                toValue: Math.random() * height,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ])
        );

      case 'bubbles':
        // Floating bubbles with wobble
        return Animated.loop(
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.6,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(particle.y, {
                toValue: -150,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(particle.x, {
                  toValue: particle.x._value + 50,
                  duration: duration / 4,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.x, {
                  toValue: particle.x._value - 50,
                  duration: duration / 4,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.x, {
                  toValue: particle.x._value + 50,
                  duration: duration / 4,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.x, {
                  toValue: particle.x._value - 50,
                  duration: duration / 4,
                  useNativeDriver: true,
                }),
              ]),
              Animated.loop(
                Animated.sequence([
                  Animated.timing(particle.scale, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                  }),
                  Animated.timing(particle.scale, {
                    toValue: 0.8,
                    duration: 1000,
                    useNativeDriver: true,
                  }),
                ])
              ),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: duration * 0.2,
                delay: duration * 0.8,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.y, {
                toValue: height + 50 + Math.random() * 200,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(particle.x, {
                toValue: Math.random() * width,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ])
        );

      case 'snow':
        // Falling snowflakes
        return Animated.loop(
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.8,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(particle.y, {
                toValue: height + 100,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.loop(
                Animated.sequence([
                  Animated.timing(particle.x, {
                    toValue: particle.x._value + 30,
                    duration: 2000,
                    useNativeDriver: true,
                  }),
                  Animated.timing(particle.x, {
                    toValue: particle.x._value - 30,
                    duration: 2000,
                    useNativeDriver: true,
                  }),
                ])
              ),
              Animated.loop(
                Animated.sequence([
                  Animated.timing(particle.rotation, {
                    toValue: particle.rotation._value + 180,
                    duration: 2000,
                    useNativeDriver: true,
                  }),
                ])
              ),
            ]),
            Animated.parallel([
              Animated.timing(particle.y, {
                toValue: -50 - Math.random() * 200,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(particle.x, {
                toValue: Math.random() * width,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ])
        );

      case 'confetti':
        // Falling confetti with spin
        return Animated.loop(
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.9,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(particle.y, {
                toValue: height + 100,
                duration: duration * 0.8,
                useNativeDriver: true,
              }),
              Animated.timing(particle.x, {
                toValue: particle.x._value + (Math.random() * 100 - 50),
                duration: duration * 0.8,
                useNativeDriver: true,
              }),
              Animated.loop(
                Animated.timing(particle.rotation, {
                  toValue: particle.rotation._value + 1080,
                  duration: 2000,
                  useNativeDriver: true,
                })
              ),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: duration * 0.2,
                delay: duration * 0.6,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.y, {
                toValue: -100,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(particle.x, {
                toValue: Math.random() * width,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ])
        );

      case 'petals':
        // Gently falling petals
        return Animated.loop(
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.7,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(particle.y, {
                toValue: -120,
                duration: duration * 1.2,
                useNativeDriver: true,
              }),
              Animated.loop(
                Animated.sequence([
                  Animated.timing(particle.x, {
                    toValue: particle.x._value + 40,
                    duration: 1500,
                    useNativeDriver: true,
                  }),
                  Animated.timing(particle.x, {
                    toValue: particle.x._value - 40,
                    duration: 1500,
                    useNativeDriver: true,
                  }),
                ])
              ),
              Animated.loop(
                Animated.sequence([
                  Animated.timing(particle.rotation, {
                    toValue: particle.rotation._value + 90,
                    duration: 2000,
                    useNativeDriver: true,
                  }),
                  Animated.timing(particle.rotation, {
                    toValue: particle.rotation._value - 90,
                    duration: 2000,
                    useNativeDriver: true,
                  }),
                ])
              ),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: duration * 0.2,
                delay: duration,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.y, {
                toValue: height + 50 + Math.random() * 200,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(particle.x, {
                toValue: Math.random() * width,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ])
        );

      case 'fireflies':
        // Glowing fireflies with random movement
        return Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(particle.x, {
                toValue: Math.random() * width,
                duration: Math.random() * 3000 + 2000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.y, {
                toValue: Math.random() * height,
                duration: Math.random() * 3000 + 2000,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(particle.opacity, {
                  toValue: 0.9,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.opacity, {
                  toValue: 0.2,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.opacity, {
                  toValue: 0.9,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.opacity, {
                  toValue: 0.2,
                  duration: 500,
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ])
        );

      default:
        return Animated.loop(Animated.delay(1000));
    }
  };

  const renderParticle = (effectType: ParticleEffectType, particle: Particle, index: number) => {
    const baseSize = effectType === 'fireflies' ? 6 : effectType === 'sparkles' ? 20 : 24;

    switch (effectType) {
      case 'hearts':
        return (
          <Animated.View
            key={`${effectType}-${index}`}
            style={[
              styles.particle,
              {
                width: baseSize,
                height: baseSize,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                  { rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })},
                ],
                opacity: particle.opacity,
              },
            ]}
          >
            <View style={[styles.heart, { width: baseSize, height: baseSize }]} />
          </Animated.View>
        );

      case 'stars':
        return (
          <Animated.View
            key={`${effectType}-${index}`}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                  { rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })},
                ],
                opacity: particle.opacity,
              },
            ]}
          >
            <View style={styles.star}>
              <View style={[styles.starPoint, { backgroundColor: '#FFD700' }]} />
              <View style={[styles.starPoint, { backgroundColor: '#FFD700', transform: [{ rotate: '90deg' }] }]} />
            </View>
          </Animated.View>
        );

      case 'sparkles':
        return (
          <Animated.View
            key={`${effectType}-${index}`}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                  { rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })},
                ],
                opacity: particle.opacity,
              },
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#FFD700', '#FFFFFF']}
              style={styles.sparkle}
            />
          </Animated.View>
        );

      case 'bubbles':
        return (
          <Animated.View
            key={`${effectType}-${index}`}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              },
            ]}
          >
            <View style={[styles.bubble, { width: baseSize, height: baseSize }]}>
              <View style={styles.bubbleShine} />
            </View>
          </Animated.View>
        );

      case 'snow':
        return (
          <Animated.View
            key={`${effectType}-${index}`}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                  { rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })},
                ],
                opacity: particle.opacity,
              },
            ]}
          >
            <View style={styles.snowflake}>
              <View style={styles.snowLine} />
              <View style={[styles.snowLine, { transform: [{ rotate: '60deg' }] }]} />
              <View style={[styles.snowLine, { transform: [{ rotate: '120deg' }] }]} />
            </View>
          </Animated.View>
        );

      case 'confetti':
        const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
        const color = confettiColors[index % confettiColors.length];
        return (
          <Animated.View
            key={`${effectType}-${index}`}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                  { rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })},
                ],
                opacity: particle.opacity,
              },
            ]}
          >
            <View style={[styles.confetti, { backgroundColor: color }]} />
          </Animated.View>
        );

      case 'petals':
        return (
          <Animated.View
            key={`${effectType}-${index}`}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                  { rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })},
                ],
                opacity: particle.opacity,
              },
            ]}
          >
            <View style={styles.petal} />
          </Animated.View>
        );

      case 'fireflies':
        return (
          <Animated.View
            key={`${effectType}-${index}`}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              },
            ]}
          >
            <View style={styles.firefly}>
              <View style={styles.fireflyGlow} />
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  if (activeEffects.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {activeEffects.map((effectType) => {
        const particles = particlesMap.current.get(effectType) || [];
        return particles.map((particle, index) =>
          renderParticle(effectType, particle, index)
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
  },
  // Heart shape
  heart: {
    backgroundColor: '#FF69B4',
    transform: [{ rotate: '45deg' }],
    borderRadius: 12,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  // Star shape
  star: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starPoint: {
    position: 'absolute',
    width: 4,
    height: 24,
    borderRadius: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  // Sparkle
  sparkle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  // Bubble
  bubble: {
    borderRadius: 100,
    backgroundColor: 'rgba(135, 206, 235, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 4,
  },
  bubbleShine: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  // Snowflake
  snowflake: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snowLine: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  // Confetti
  confetti: {
    width: 8,
    height: 12,
    borderRadius: 2,
  },
  // Petal
  petal: {
    width: 16,
    height: 20,
    backgroundColor: '#FFB6C1',
    borderRadius: 10,
    borderTopLeftRadius: 0,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  // Firefly
  firefly: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFF00',
  },
  fireflyGlow: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFF00',
    opacity: 0.3,
    top: -3,
    left: -3,
  },
});

export default BackgroundEffects;
