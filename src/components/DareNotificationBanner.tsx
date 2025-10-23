/**
 * DareNotificationBanner
 *
 * Floating banner that shows pending game dares
 * Appears at the top of the screen when partner sends a dare
 */

import React, { useEffect, useState } from 'react';
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
import DareToPlayService, { DareData } from '../services/DareToPlayService';
import SoundService from '../services/SoundService';

const { width } = Dimensions.get('window');

interface DareNotificationBannerProps {
  onDarePress?: (dare: DareData) => void;
}

export const DareNotificationBanner: React.FC<DareNotificationBannerProps> = ({
  onDarePress,
}) => {
  const [currentDare, setCurrentDare] = useState<DareData | null>(null);
  const [slideAnim] = useState(new Animated.Value(-200));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('🎮 DareNotificationBanner mounted, subscribing to dares...');

    // Subscribe to pending dares
    const unsubscribe = DareToPlayService.subscribeToPendingDares((dares) => {
      console.log('📬 Received dares update:', {
        count: dares.length,
        dares: dares.map(d => ({ id: d.id, from: d.fromUserName, game: d.gameType }))
      });

      if (dares.length > 0) {
        // Show the most recent dare
        const newestDare = dares[0];
        if (currentDare?.id !== newestDare.id) {
          console.log('🆕 Showing new dare:', newestDare);
          setCurrentDare(newestDare);
          showBanner();
          SoundService.playButtonClick();
        }
      } else {
        hideBanner();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentDare]);

  const showBanner = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentDare(null);
    });
  };

  const handleAccept = async () => {
    if (!currentDare) return;

    try {
      await DareToPlayService.acceptDare(currentDare.id);
      SoundService.playSoundWithHaptic('game_start', 0.8, 'success');
      hideBanner();
    } catch (error) {
      console.error('Error accepting dare:', error);
      SoundService.playSoundWithHaptic('wrong', 0.6, 'error');
    }
  };

  const handleDecline = async () => {
    if (!currentDare) return;

    try {
      await DareToPlayService.declineDare(currentDare.id);
      SoundService.haptic('light');
      hideBanner();
    } catch (error) {
      console.error('Error declining dare:', error);
    }
  };

  const handlePress = () => {
    if (currentDare && onDarePress) {
      onDarePress(currentDare);
    }
  };

  if (!currentDare) return null;

  const getGameIcon = (gameType: string): string => {
    const icons: Record<string, string> = {
      morpion: 'target-two',
      puissance4: 'die-six',
      wordsearch: 'magnifying-glass',
      crosswords: 'page-multiple',
      quizcouple: 'lightbulb',
      dominos: 'puzzle',
    };
    return icons[gameType] || 'trophy';
  };

  const getTimeRemaining = (): string => {
    const now = new Date();
    const expires = new Date(currentDare.expiresAt);
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    }
    return `${minutes}m restantes`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.banner}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Foundation
            name={getGameIcon(currentDare.gameType)}
            size={32}
            color="#FFFFFF"
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>🎮 Dare to Play!</Text>
            <Text style={styles.timer}>{getTimeRemaining()}</Text>
          </View>
          <Text style={styles.message}>
            {currentDare.message || `${currentDare.fromUserName} te défie!`}
          </Text>
          <Text style={styles.gameType}>{currentDare.gameType.toUpperCase()}</Text>
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideBanner}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Foundation name="x" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={handleDecline}
          activeOpacity={0.8}
        >
          <Foundation name="x-circle" size={20} color="#FF6B9D" />
          <Text style={styles.actionText}>Refuser</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={handleAccept}
          activeOpacity={0.8}
        >
          <Foundation name="check" size={20} color="#FFFFFF" />
          <Text style={[styles.actionText, styles.acceptText]}>Accepter</Text>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 78, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timer: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    lineHeight: 18,
  },
  gameType: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  declineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.5)',
  },
  acceptButton: {
    backgroundColor: 'rgba(255, 107, 157, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  acceptText: {
    color: '#FFFFFF',
  },
});

export default DareNotificationBanner;
