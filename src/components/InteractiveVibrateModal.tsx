/**
 * InteractiveVibrateModal
 *
 * Modal interactif pour faire vibrer le téléphone du partenaire en temps réel
 * avec différents niveaux d'intensité
 */

import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Foundation from 'react-native-vector-icons/Foundation';
import RemoteVibrateService, { VibratePattern } from '../services/RemoteVibrateService';
import SoundService from '../services/SoundService';
import ToastService from '../services/ToastService';

const { width, height } = Dimensions.get('window');

interface InteractiveVibrateModalProps {
  visible: boolean;
  onClose: () => void;
  partnerName?: string;
}

interface VibrateButton {
  pattern: VibratePattern;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

const VIBRATE_BUTTONS: VibrateButton[] = [
  {
    pattern: 'gentle',
    label: 'Doux',
    emoji: '💫',
    color: 'rgba(173, 216, 230, 0.8)', // Light blue
    description: 'Vibration douce et délicate',
  },
  {
    pattern: 'normal',
    label: 'Moyen',
    emoji: '📳',
    color: 'rgba(147, 112, 219, 0.8)', // Medium purple
    description: 'Vibration normale',
  },
  {
    pattern: 'strong',
    label: 'Fort',
    emoji: '⚡',
    color: 'rgba(255, 140, 0, 0.8)', // Dark orange
    description: 'Vibration forte',
  },
  {
    pattern: 'heartbeat',
    label: 'Très Fort',
    emoji: '😂',
    color: 'rgba(255, 69, 0, 0.8)', // Red orange
    description: 'Vibration très intense',
  },
];

export const InteractiveVibrateModal: React.FC<InteractiveVibrateModalProps> = ({
  visible,
  onClose,
  partnerName = 'ton partenaire',
}) => {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>(
    VIBRATE_BUTTONS.reduce((acc, btn) => {
      acc[btn.pattern] = new Animated.Value(1);
      return acc;
    }, {} as { [key: string]: Animated.Value })
  ).current;

  const handleVibratePress = async (button: VibrateButton) => {
    if (isSending) return;

    setActiveButton(button.pattern);
    setIsSending(true);

    // Animation du bouton
    Animated.sequence([
      Animated.timing(scaleAnims[button.pattern], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[button.pattern], {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[button.pattern], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Vibration locale pour feedback
    SoundService.haptic('medium');

    try {
      // Envoyer la vibration instantanée
      await RemoteVibrateService.sendInstantVibrate(button.pattern);

      // Petit toast de confirmation
      ToastService.success(`${button.emoji} ${button.label}!`, 1000);
    } catch (error) {
      console.error('Error sending instant vibrate:', error);

      let errorMessage = 'Erreur d\'envoi';
      if (error instanceof Error) {
        switch (error.message) {
          case 'NO_INTERNET':
            errorMessage = 'Pas de connexion';
            break;
          case 'NO_PARTNER':
            errorMessage = 'Aucun partenaire lié';
            break;
          default:
            errorMessage = 'Erreur d\'envoi';
        }
      }

      ToastService.error(errorMessage, 2000);
    } finally {
      setIsSending(false);
      setActiveButton(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={15} />

        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Foundation name="heart" size={24} color="#FF69B4" />
                <Text style={styles.title}>Faire Vibrer</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Foundation name="x" size={22} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Appuie sur un bouton pour faire vibrer{'\n'}le téléphone de {partnerName}
            </Text>

            {/* Vibrate Buttons Grid */}
            <View style={styles.buttonsContainer}>
              {VIBRATE_BUTTONS.map((button) => (
                <Animated.View
                  key={button.pattern}
                  style={[
                    styles.buttonWrapper,
                    {
                      transform: [{ scale: scaleAnims[button.pattern] }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.vibrateButton,
                      {
                        backgroundColor: button.color,
                        opacity: activeButton === button.pattern ? 0.7 : 1,
                      },
                    ]}
                    onPress={() => handleVibratePress(button)}
                    disabled={isSending}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonEmoji}>{button.emoji}</Text>
                    <Text style={styles.buttonLabel}>{button.label}</Text>
                    <Text style={styles.buttonDescription}>
                      {button.description}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Foundation name="info" size={16} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.infoText}>
                Chaque appui envoie une vibration instantanée
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: 'rgba(30, 30, 40, 0.97)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.4)',
    padding: 20,
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
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonWrapper: {
    width: '48%',
  },
  vibrateButton: {
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  buttonDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});

export default InteractiveVibrateModal;
