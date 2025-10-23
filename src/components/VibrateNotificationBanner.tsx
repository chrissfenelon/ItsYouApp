/**
 * VibrateNotificationBanner
 *
 * Banner qui s'affiche quand on reçoit une vibration du partenaire
 * Affiche le message et fait vibrer le téléphone
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Foundation from 'react-native-vector-icons/Foundation';
import RemoteVibrateService, {
  VibrateMessage,
  PATTERN_NAMES,
} from '../services/RemoteVibrateService';
import SoundService from '../services/SoundService';
import { BlurView } from '@react-native-community/blur';

const { width } = Dimensions.get('window');

interface VibrateNotificationBannerProps {
  autoVibrate?: boolean; // Vibrer automatiquement quand le message arrive
}

export const VibrateNotificationBanner: React.FC<VibrateNotificationBannerProps> = ({
  autoVibrate = true,
}) => {
  const [currentMessage, setCurrentMessage] = useState<VibrateMessage | null>(null);
  const [slideAnim] = useState(new Animated.Value(-300));
  const [scaleAnim] = useState(new Animated.Value(1));
  const insets = useSafeAreaInsets();
  const hasVibrated = useRef(false);

  useEffect(() => {
    const processedMessages = new Set<string>();

    // Subscribe to vibrate messages
    const unsubscribe = RemoteVibrateService.subscribeToVibrateMessages((message) => {
      // Prevent duplicate processing
      if (processedMessages.has(message.id)) {
        console.log('💕 Skipping duplicate message:', message.id);
        return;
      }

      processedMessages.add(message.id);
      console.log('💕 New vibrate message:', message);
      setCurrentMessage(message);
      showBanner();

      // Auto-vibrate if enabled
      if (autoVibrate) {
        RemoteVibrateService.vibrate(message.pattern);
        SoundService.playSound('game_start', 0.8);
      }

      // Mark as seen immediately
      RemoteVibrateService.markAsSeen(message.id);
    });

    return () => {
      unsubscribe();
    };
  }, [autoVibrate]);

  const showBanner = () => {
    // Slide in from top
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Pulse animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after 10 seconds
    setTimeout(() => {
      hideBanner();
    }, 10000);
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentMessage(null);
    });
  };

  const handleDismiss = async () => {
    if (currentMessage) {
      await RemoteVibrateService.markAsSeen(currentMessage.id);
      RemoteVibrateService.cancelVibration();
    }
    hideBanner();
  };

  const handleVibrateAgain = () => {
    if (currentMessage) {
      RemoteVibrateService.vibrate(currentMessage.pattern);
      SoundService.haptic('medium');

      // Pulse animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  if (!currentMessage) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <View style={styles.notificationCard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Foundation name="heart" size={20} color="#FF69B4" />
            <Text style={styles.headerText}>Vibration reçue</Text>
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Foundation name="x" size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.fromLabel}>De: {currentMessage.fromUserName}</Text>
          <Text style={styles.messageText}>{currentMessage.message}</Text>
          <Text style={styles.patternText}>
            {PATTERN_NAMES[currentMessage.pattern]}
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleVibrateAgain}
          activeOpacity={0.7}
        >
          <Foundation name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Vibrer encore</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#FF69B4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  notificationCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.97)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.4)',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  contentContainer: {
    marginBottom: 14,
  },
  fromLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 105, 180, 0.9)',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  messageText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  patternText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 105, 180, 0.22)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 105, 180, 0.65)',
    minHeight: 46,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});

export default VibrateNotificationBanner;
