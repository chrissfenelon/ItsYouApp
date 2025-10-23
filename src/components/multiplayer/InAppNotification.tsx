import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FeedbackService from '../../services/FeedbackService';

const { width } = Dimensions.get('window');

export type NotificationType =
  | 'player_joined'
  | 'player_left'
  | 'player_disconnected'
  | 'player_reconnected'
  | 'game_paused'
  | 'game_resumed'
  | 'player_ready'
  | 'connection_poor'
  | 'your_turn'
  | 'opponent_moved';

interface InAppNotificationProps {
  visible: boolean;
  type: NotificationType;
  playerName: string;
  message?: string;
  duration?: number; // ms, default 3000
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const InAppNotification: React.FC<InAppNotificationProps> = ({
  visible,
  type,
  playerName,
  message,
  duration = 3000,
  onDismiss,
  action,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic feedback
      FeedbackService.notification();

      // Auto dismiss
      if (duration > 0 && onDismiss) {
        timeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, duration);
      }
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  const handleDismiss = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onDismiss?.();
  };

  const getNotificationConfig = () => {
    switch (type) {
      case 'player_joined':
        return {
          icon: 'account-plus',
          iconColor: '#4CAF50',
          title: `${playerName} a rejoint`,
          defaultMessage: 'Le joueur est maintenant dans la partie',
        };
      case 'player_left':
        return {
          icon: 'account-minus',
          iconColor: '#F44336',
          title: `${playerName} a quitté`,
          defaultMessage: 'Le joueur a quitté la partie',
        };
      case 'player_disconnected':
        return {
          icon: 'wifi-off',
          iconColor: '#FF9800',
          title: `${playerName} déconnecté`,
          defaultMessage: 'Problème de connexion détecté',
        };
      case 'player_reconnected':
        return {
          icon: 'wifi-check',
          iconColor: '#4CAF50',
          title: `${playerName} est de retour!`,
          defaultMessage: 'Le joueur s\'est reconnecté',
        };
      case 'game_paused':
        return {
          icon: 'pause-circle',
          iconColor: '#FF9800',
          title: 'Partie en pause',
          defaultMessage: 'En attente de reconnexion',
        };
      case 'game_resumed':
        return {
          icon: 'play-circle',
          iconColor: '#4CAF50',
          title: 'Partie reprise',
          defaultMessage: 'C\'est reparti!',
        };
      case 'player_ready':
        return {
          icon: 'check-circle',
          iconColor: '#4CAF50',
          title: `${playerName} est prêt`,
          defaultMessage: 'En attente des autres joueurs',
        };
      case 'connection_poor':
        return {
          icon: 'wifi-strength-1',
          iconColor: '#FF9800',
          title: 'Connexion faible',
          defaultMessage: `${playerName} a une mauvaise connexion`,
        };
      case 'your_turn':
        return {
          icon: 'account-arrow-right',
          iconColor: '#2196F3',
          title: 'À ton tour!',
          defaultMessage: 'C\'est à toi de jouer',
        };
      case 'opponent_moved':
        return {
          icon: 'account-check',
          iconColor: '#2196F3',
          title: `${playerName} a joué`,
          defaultMessage: 'C\'est maintenant ton tour',
        };
      default:
        return {
          icon: 'information',
          iconColor: '#2196F3',
          title: 'Notification',
          defaultMessage: message || '',
        };
    }
  };

  const config = getNotificationConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleDismiss}
        style={styles.touchable}
      >
        <View style={styles.notificationWrapper}>
          {/* Blur Background */}
          {Platform.OS === 'ios' ? (
            <BlurView
              style={styles.blur}
              blurType="dark"
              blurAmount={20}
              reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.9)"
            />
          ) : (
            <View style={[styles.blur, styles.androidBlur]} />
          )}

          {/* Glass Overlay */}
          <View style={[styles.glassOverlay, { borderColor: config.iconColor }]} />

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${config.iconColor}20` }]}>
              <MaterialCommunityIcons
                name={config.icon}
                size={24}
                color={config.iconColor}
              />
            </View>

            {/* Text */}
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {config.title}
              </Text>
              <Text style={styles.message} numberOfLines={2}>
                {message || config.defaultMessage}
              </Text>
            </View>

            {/* Action Button */}
            {action && (
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: config.iconColor }]}
                onPress={() => {
                  action.onPress();
                  handleDismiss();
                }}
              >
                <Text style={[styles.actionText, { color: config.iconColor }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            )}

            {/* Close Button */}
            {!action && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleDismiss}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color="rgba(255, 255, 255, 0.6)"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9998,
    elevation: 999,
  },
  touchable: {
    width: '100%',
  },
  notificationWrapper: {
    width: '100%',
    minHeight: 70,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default InAppNotification;
