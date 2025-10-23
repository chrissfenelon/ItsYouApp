import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import FeedbackService from '../../services/FeedbackService';

const { width } = Dimensions.get('window');

interface DisconnectionModalProps {
  visible: boolean;
  playerName: string;
  onWait: () => void;
  onForfeit: () => void;
  reconnectionTimeLimit?: number; // seconds, default 120 (2 minutes)
  gameType?: 'morpion' | 'puissance4' | 'quiz' | 'wordsearch';
}

const DisconnectionModal: React.FC<DisconnectionModalProps> = ({
  visible,
  playerName,
  onWait,
  onForfeit,
  reconnectionTimeLimit = 120,
  gameType = 'morpion',
}) => {
  const [timeRemaining, setTimeRemaining] = useState(reconnectionTimeLimit);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      // Reset timer
      setTimeRemaining(reconnectionTimeLimit);

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic feedback
      FeedbackService.warning();

      // Start countdown timer
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto forfeit
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            handleForfeit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [visible, reconnectionTimeLimit]);

  const handleWait = () => {
    FeedbackService.light();
    onWait();
  };

  const handleForfeit = () => {
    FeedbackService.medium();
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    onForfeit();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (timeRemaining > 60) return '#4CAF50'; // Green
    if (timeRemaining > 30) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getGameIcon = (): string => {
    switch (gameType) {
      case 'morpion':
        return 'grid';
      case 'puissance4':
        return 'grid-large';
      case 'quiz':
        return 'help-circle';
      case 'wordsearch':
        return 'text-search';
      default:
        return 'gamepad-variant';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleForfeit}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Backdrop Blur */}
        {Platform.OS === 'ios' ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.8)"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBackdrop]} />
        )}

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glass Background */}
          {Platform.OS === 'ios' ? (
            <BlurView
              style={styles.modalBlur}
              blurType="dark"
              blurAmount={20}
              reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.9)"
            />
          ) : (
            <View style={[styles.modalBlur, styles.androidModalBlur]} />
          )}

          {/* Glass Overlay */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassOverlay}
          />

          {/* Content */}
          <View style={styles.content}>
            {/* Warning Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="wifi-off" size={40} color="#FF9800" />
              </View>
              <View style={styles.gameIconBadge}>
                <MaterialCommunityIcons
                  name={getGameIcon()}
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Joueur déconnecté</Text>

            {/* Player Name */}
            <Text style={styles.playerName}>{playerName}</Text>

            {/* Message */}
            <Text style={styles.message}>
              Le joueur a perdu la connexion. La partie est en pause en attendant sa
              reconnexion.
            </Text>

            {/* Timer */}
            <View style={styles.timerContainer}>
              <View
                style={[
                  styles.timerCircle,
                  {
                    borderColor: getTimerColor(),
                    backgroundColor: `${getTimerColor()}20`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="timer-sand"
                  size={24}
                  color={getTimerColor()}
                />
                <Text
                  style={[
                    styles.timerText,
                    {
                      color: getTimerColor(),
                    },
                  ]}
                >
                  {formatTime(timeRemaining)}
                </Text>
              </View>
              <Text style={styles.timerLabel}>Temps restant</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${(timeRemaining / reconnectionTimeLimit) * 100}%`,
                    backgroundColor: getTimerColor(),
                  },
                ]}
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {/* Wait Button */}
              <TouchableOpacity
                style={[styles.button, styles.waitButton]}
                onPress={handleWait}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#388E3C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <MaterialCommunityIcons
                    name="clock-check-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>Attendre</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Forfeit Button */}
              <TouchableOpacity
                style={[styles.button, styles.forfeitButton]}
                onPress={handleForfeit}
                activeOpacity={0.8}
              >
                <View style={styles.forfeitButtonContent}>
                  <MaterialCommunityIcons name="flag" size={20} color="#F44336" />
                  <Text style={styles.forfeitButtonText}>Abandonner</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
              Si le joueur ne revient pas avant la fin du temps, vous gagnerez par
              forfait.
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  androidBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  modalBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  androidModalBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderWidth: 2,
    borderColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
  },
  waitButton: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  forfeitButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1.5,
    borderColor: '#F44336',
  },
  forfeitButtonContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  forfeitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F44336',
  },
  infoText: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default DisconnectionModal;
