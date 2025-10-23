/**
 * DareButton
 *
 * Button component to send a dare challenge for a specific game
 * Used in game screens to challenge partner
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import DareToPlayService, { GameType } from '../services/DareToPlayService';
import SoundService from '../services/SoundService';
import { useAlert } from '../context/AlertContext';
import { useApp } from '../context/AppContext';
import CustomInputModal from './common/CustomInputModal';

interface DareButtonProps {
  gameType: GameType;
  gameSettings?: any;
  style?: any;
  iconSize?: number;
  showLabel?: boolean;
  variant?: 'icon' | 'full' | 'compact';
  onDareSent?: () => void;
}

export const DareButton: React.FC<DareButtonProps> = ({
  gameType,
  gameSettings,
  style,
  iconSize = 24,
  showLabel = true,
  variant = 'full',
  onDareSent,
}) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { showAlert } = useAlert();
  const { currentTheme } = useApp();

  const handlePress = () => {
    SoundService.playButtonClick();
    setShowModal(true);
  };

  const handleSendDare = async (message: string) => {
    try {
      setLoading(true);
      setShowModal(false);

      await DareToPlayService.sendDare(gameType, message || undefined, gameSettings);

      SoundService.playSoundWithHaptic('game_start', 0.8, 'success');

      showAlert({
        title: '✅ Défi envoyé!',
        message: 'Ton partenaire a reçu le défi.',
        type: 'success',
        buttons: [{ text: 'OK', style: 'default' }],
      });

      if (onDareSent) {
        onDareSent();
      }
    } catch (error: any) {
      console.error('Error sending dare:', error);
      SoundService.playSoundWithHaptic('wrong', 0.6, 'error');

      showAlert({
        title: 'Erreur',
        message: error.message || 'Erreur lors de l\'envoi du défi',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = async (message: string) => {
    try {
      setLoading(true);
      setShowModal(false);

      await DareToPlayService.shareDareLink(gameType, message || undefined);

      SoundService.playSoundWithHaptic('game_start', 0.8, 'success');

      showAlert({
        title: '✅ Lien partagé!',
        message: 'Le lien du défi a été partagé.',
        type: 'success',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } catch (error: any) {
      console.error('Error sharing dare link:', error);
      SoundService.playSoundWithHaptic('wrong', 0.6, 'error');

      showAlert({
        title: 'Erreur',
        message: error.message || 'Erreur lors du partage du défi',
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
            <Foundation name="trophy" size={iconSize} color="#FFFFFF" />
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
              <Foundation name="trophy" size={20} color="#FFFFFF" />
              {showLabel && <Text style={styles.compactText}>Défier</Text>}
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
            <Foundation name="trophy" size={iconSize} color="#FFFFFF" />
            {showLabel && <Text style={styles.fullText}>Dare to Play!</Text>}
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {renderButton()}

      {/* Dare Message Modal */}
      <CustomInputModal
        visible={showModal}
        title="🎮 Dare to Play!"
        message="Envoie un défi à ton partenaire"
        placeholder="Ajoute un message de défi... (optionnel)"
        initialValue=""
        maxLength={200}
        multiline={true}
        numberOfLines={3}
        onClose={() => setShowModal(false)}
        theme={currentTheme}
        icon="trophy"
        iconColor="#FF69B4"
        buttons={[
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'Envoyer au partenaire',
            style: 'default',
            icon: 'heart',
            onPress: handleSendDare,
          },
          {
            text: 'Partager le lien',
            style: 'default',
            icon: 'share',
            onPress: handleShareLink,
          },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 105, 180, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 105, 180, 0.9)',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 105, 180, 0.9)',
    gap: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  fullText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default DareButton;
