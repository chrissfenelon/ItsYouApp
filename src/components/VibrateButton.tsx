/**
 * VibrateButton
 *
 * Bouton pour envoyer une vibration à distance au partenaire
 * avec message personnalisé
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import RemoteVibrateService, {
  VibratePattern,
  PRESET_MESSAGES,
  PATTERN_NAMES,
} from '../services/RemoteVibrateService';
import SoundService from '../services/SoundService';
import { useAlert } from '../context/AlertContext';
import { useApp } from '../context/AppContext';
import CustomInputModal from './common/CustomInputModal';

interface VibrateButtonProps {
  variant?: 'icon' | 'full' | 'compact';
  style?: any;
  iconSize?: number;
  showLabel?: boolean;
  onVibrateSent?: () => void;
}

export const VibrateButton: React.FC<VibrateButtonProps> = ({
  variant = 'full',
  style,
  iconSize = 24,
  showLabel = true,
  onVibrateSent,
}) => {
  const [loading, setLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState('');
  const [selectedPattern, setSelectedPattern] = useState<VibratePattern>('normal');

  const { showAlert } = useAlert();
  const { currentTheme } = useApp();

  const handlePress = () => {
    SoundService.playButtonClick();
    setShowMessageModal(true);
  };

  const handleSelectPreset = (message: string) => {
    setSelectedMessage(message);
    setShowMessageModal(false);
    setShowPatternModal(true);
  };

  const handleCustomMessage = (customMessage: string) => {
    setSelectedMessage(customMessage);
    setShowMessageModal(false);
    setShowPatternModal(true);
  };

  const handleSelectPattern = async (pattern: VibratePattern) => {
    setSelectedPattern(pattern);
    setShowPatternModal(false);
    await sendVibrate(selectedMessage, pattern);
  };

  const handleTestPattern = (pattern: VibratePattern) => {
    RemoteVibrateService.testPattern(pattern);
    SoundService.haptic('light');
  };

  const sendVibrate = async (message: string, pattern: VibratePattern) => {
    try {
      setLoading(true);

      await RemoteVibrateService.sendVibrate(message, pattern);

      SoundService.playSoundWithHaptic('game_start', 0.8, 'success');

      showAlert({
        title: 'Vibration envoyée! 😂❤️',
        message: `Ton partenaire va vibrer avec le message:\n"${message}"`,
        type: 'success',
        buttons: [{ text: 'OK', style: 'default' }],
      });

      if (onVibrateSent) {
        onVibrateSent();
      }
    } catch (error: any) {
      console.error('Error sending vibrate:', error);
      SoundService.playSoundWithHaptic('wrong', 0.6, 'error');

      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible d\'envoyer la vibration',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
    } finally {
      setLoading(false);
    }
  };

  const renderButton = () => {
    if (variant === 'icon') {
      return (
        <TouchableOpacity
          style={[styles.iconButton, style]}
          onPress={handlePress}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Foundation name="heart" size={iconSize} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      );
    }

    if (variant === 'compact') {
      return (
        <TouchableOpacity
          style={[styles.compactButton, style]}
          onPress={handlePress}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Foundation name="heart" size={20} color="#FFFFFF" />
              {showLabel && <Text style={styles.compactText}>Vibrer</Text>}
            </>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.fullButton, style]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Foundation name="heart" size={iconSize} color="#FFFFFF" />
            {showLabel && <Text style={styles.fullText}>Faire vibrer🌚</Text>}
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {renderButton()}

      {/* Message Selection Modal */}
      <CustomInputModal
        visible={showMessageModal}
        title="Kontinye ak mesaj pèsonalize"
        message="Choisis un message prédéfini ou écris le tien"
        placeholder="Écris ton message personnalisé..."
        initialValue=""
        maxLength={100}
        multiline={false}
        onClose={() => setShowMessageModal(false)}
        theme={currentTheme}
        icon="heart"
        iconColor="#FF69B4"
        buttons={[
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'Continuer avec message perso',
            style: 'default',
            icon: 'pencil',
            onPress: handleCustomMessage,
          },
        ]}
      />

      {/* Pattern Selection Modal - Will be implemented with ScrollView of patterns */}
      {showPatternModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.patternModal}>
            <Text style={styles.patternTitle}>Choisis le type de vibration</Text>
            <Text style={styles.patternSubtitle}>Appuie pour tester 📳</Text>

            <ScrollView style={styles.patternList}>
              {Object.entries(PATTERN_NAMES).map(([key, name]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.patternItem,
                    selectedPattern === key && styles.patternItemSelected,
                  ]}
                  onPress={() => handleSelectPattern(key as VibratePattern)}
                  onLongPress={() => handleTestPattern(key as VibratePattern)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.patternName}>{name}</Text>
                  <Foundation
                    name="play"
                    size={20}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPatternModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Preset Messages as Quick Actions */}
      {showMessageModal && (
        <View style={styles.presetsContainer}>
          <Text style={styles.presetsTitle}>Messages rapides:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.presetsList}
          >
            {PRESET_MESSAGES.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetButton}
                onPress={() => handleSelectPreset(preset.text)}
                activeOpacity={0.8}
              >
                <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                <Text style={styles.presetText}>{preset.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#FF69B4',
    gap: 8,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  compactText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    backgroundColor: '#FF69B4',
    gap: 12,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  fullText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  patternModal: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: 'rgba(25, 25, 35, 0.98)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  patternTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  patternSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  patternList: {
    maxHeight: 300,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  patternItemSelected: {
    backgroundColor: 'rgba(255, 105, 180, 0.2)',
    borderColor: '#FF69B4',
  },
  patternName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  presetsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(25, 25, 35, 0.95)',
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  presetsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  presetsList: {
    flexDirection: 'row',
  },
  presetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 105, 180, 0.15)',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    minWidth: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  presetEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default VibrateButton;
