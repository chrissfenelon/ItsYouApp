import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Foundation from 'react-native-vector-icons/Foundation';

const { width } = Dimensions.get('window');

type NotificationType = 'correct' | 'incorrect' | 'almost' | 'judged-correct' | 'judged-incorrect' | 'judged-almost';

interface QuizNotificationToastProps {
  visible: boolean;
  type: NotificationType;
  message?: string;
  correctAnswer?: string;
  onHide?: () => void;
  duration?: number;
}

export const QuizNotificationToast: React.FC<QuizNotificationToastProps> = ({
  visible,
  type,
  message,
  correctAnswer,
  onHide,
  duration = 2000,
}) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 20,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const getConfig = () => {
    switch (type) {
      case 'correct':
      case 'judged-correct':
        return {
          colors: ['rgba(76, 175, 80, 0.95)', 'rgba(56, 142, 60, 0.95)'],
          icon: 'check',
          title: type === 'judged-correct' ? 'Jugé Correct!' : 'Correct!',
          defaultMessage: 'Bonne réponse!',
        };
      case 'incorrect':
      case 'judged-incorrect':
        return {
          colors: ['rgba(244, 67, 54, 0.95)', 'rgba(211, 47, 47, 0.95)'],
          icon: 'x',
          title: type === 'judged-incorrect' ? 'Jugé Incorrect' : 'Incorrect',
          defaultMessage: 'Mauvaise réponse',
        };
      case 'almost':
      case 'judged-almost':
        return {
          colors: ['rgba(255, 152, 0, 0.95)', 'rgba(245, 124, 0, 0.95)'],
          icon: 'burst',
          title: type === 'judged-almost' ? 'Jugé Presque!' : 'Presque!',
          defaultMessage: 'Pas mal!',
        };
      default:
        return {
          colors: ['rgba(33, 150, 243, 0.95)', 'rgba(25, 118, 210, 0.95)'],
          icon: 'info',
          title: 'Info',
          defaultMessage: '',
        };
    }
  };

  const config = getConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <LinearGradient
        colors={config.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Glassmorphism effect */}
        <View style={styles.glassOverlay}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Foundation name={config.icon} size={32} color="#FFF" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.message}>
                {message || config.defaultMessage}
              </Text>

              {/* Show correct answer if incorrect */}
              {(type === 'incorrect' || type === 'judged-incorrect') && correctAnswer && (
                <View style={styles.correctAnswerContainer}>
                  <Text style={styles.correctAnswerLabel}>Réponse correcte:</Text>
                  <Text style={styles.correctAnswerText}>{correctAnswer}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 999,
  },
  gradient: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  glassOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  correctAnswerContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  correctAnswerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  correctAnswerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default QuizNotificationToast;
