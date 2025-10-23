import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  symbol: string;
  color: string;
  animationDelay: number;
  duration: number;
}

interface FloatingParticlesProps {
  particleCount?: number;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  particleCount = 15
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      const symbols = ['✨', '💖', '💕', '⭐', '💫', '🌟', '💝', '❤️', '💘', '🎀'];
      const colors = [
        Colors.primary.pink,
        Colors.primary.lightPink,
        Colors.primary.coral,
        Colors.system.purple,
        '#FFD700', // Or
        '#FFF8DC', // Beige clair
      ];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 20 + 10,
          opacity: Math.random() * 0.8 + 0.2,
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
          animationDelay: Math.random() * 5000,
          duration: Math.random() * 3000 + 2000,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, [particleCount]);

  const renderParticle = (particle: Particle) => {
    return (
      <Animatable.View
        key={particle.id}
        animation={{
          from: {
            translateY: 0,
            rotate: '0deg',
            opacity: particle.opacity,
          },
          to: {
            translateY: -100,
            rotate: '360deg',
            opacity: 0,
          }
        }}
        duration={particle.duration}
        delay={particle.animationDelay}
        iterationCount="infinite"
        style={[
          styles.particle,
          {
            left: particle.x,
            top: particle.y,
            fontSize: particle.size,
            color: particle.color,
          }
        ]}
      >
        <Animatable.Text
          style={{
            fontSize: particle.size,
            color: particle.color,
          }}
        >
          {particle.symbol}
        </Animatable.Text>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      {particles.map(renderParticle)}

      {/* Particules fixes pour plus d'effet */}
      <View style={styles.staticParticles}>
        <Animatable.Text
          animation="pulse"
          iterationCount="infinite"
          duration={2000}
          style={[styles.staticParticle, styles.heartTop]}
        >
          💖
        </Animatable.Text>

        <Animatable.Text
          animation="bounce"
          iterationCount="infinite"
          duration={3000}
          delay={500}
          style={[styles.staticParticle, styles.starTopRight]}
        >
          ⭐
        </Animatable.Text>

        <Animatable.Text
          animation="rotate"
          iterationCount="infinite"
          duration={4000}
          style={[styles.staticParticle, styles.sparkleLeft]}
        >
          ✨
        </Animatable.Text>

        <Animatable.Text
          animation="swing"
          iterationCount="infinite"
          duration={2500}
          delay={1000}
          style={[styles.staticParticle, styles.loveBottomRight]}
        >
          💕
        </Animatable.Text>
      </View>
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
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    textAlign: 'center',
  },
  staticParticles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  staticParticle: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.6,
  },
  heartTop: {
    top: height * 0.15,
    left: width * 0.8,
  },
  starTopRight: {
    top: height * 0.25,
    right: width * 0.1,
  },
  sparkleLeft: {
    top: height * 0.4,
    left: width * 0.05,
  },
  loveBottomRight: {
    bottom: height * 0.2,
    right: width * 0.15,
  },
});

export default FloatingParticles;