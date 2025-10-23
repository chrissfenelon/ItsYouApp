/**
 * MediaPickerModal
 *
 * Modal interactif pour ajouter des médias à la galerie
 * Style identique au InteractiveVibrateModal
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
import SoundService from '../../services/SoundService';

const { width } = Dimensions.get('window');

interface MediaPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onSelectVideo: () => void;
  onSelectDocument: () => void;
}

interface MediaButton {
  action: 'camera' | 'gallery' | 'video' | 'document';
  label: string;
  emoji: string;
  color: string;
  description: string;
}

const MEDIA_BUTTONS: MediaButton[] = [
  {
    action: 'camera',
    label: 'Caméra',
    emoji: '📷',
    color: 'rgba(52, 152, 219, 0.8)', // Blue
    description: 'Prendre une photo',
  },
  {
    action: 'gallery',
    label: 'Galerie',
    emoji: '🖼️',
    color: 'rgba(155, 89, 182, 0.8)', // Purple
    description: 'Choisir des photos',
  },
  {
    action: 'video',
    label: 'Vidéo',
    emoji: '🎥',
    color: 'rgba(231, 76, 60, 0.8)', // Red
    description: 'Ajouter une vidéo',
  },
  {
    action: 'document',
    label: 'Fichier',
    emoji: '📎',
    color: 'rgba(46, 204, 113, 0.8)', // Green
    description: 'Importer un fichier',
  },
];

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
  onSelectVideo,
  onSelectDocument,
}) => {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>(
    MEDIA_BUTTONS.reduce((acc, btn) => {
      acc[btn.action] = new Animated.Value(1);
      return acc;
    }, {} as { [key: string]: Animated.Value })
  ).current;

  const handleButtonPress = (button: MediaButton) => {
    setActiveButton(button.action);

    // Animation du bouton
    Animated.sequence([
      Animated.timing(scaleAnims[button.action], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[button.action], {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[button.action], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Appeler l'action correspondante
      switch (button.action) {
        case 'camera':
          onSelectCamera();
          break;
        case 'gallery':
          onSelectGallery();
          break;
        case 'video':
          onSelectVideo();
          break;
        case 'document':
          onSelectDocument();
          break;
      }

      setActiveButton(null);
      onClose();
    });

    // Vibration locale pour feedback
    SoundService.haptic('light');
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
                <Foundation name="photo" size={24} color="#52B4FF" />
                <Text style={styles.title}>Ajouter des médias</Text>
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
              Choisis une source pour{'\n'}ajouter tes médias
            </Text>

            {/* Media Buttons Grid */}
            <View style={styles.buttonsContainer}>
              {MEDIA_BUTTONS.map((button) => (
                <Animated.View
                  key={button.action}
                  style={[
                    styles.buttonWrapper,
                    {
                      transform: [{ scale: scaleAnims[button.action] }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.mediaButton,
                      {
                        backgroundColor: button.color,
                        opacity: activeButton === button.action ? 0.7 : 1,
                      },
                    ]}
                    onPress={() => handleButtonPress(button)}
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
                Les médias seront ajoutés à ta galerie
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Annuler</Text>
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
    borderColor: 'rgba(82, 180, 255, 0.4)',
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
  mediaButton: {
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

export default MediaPickerModal;
