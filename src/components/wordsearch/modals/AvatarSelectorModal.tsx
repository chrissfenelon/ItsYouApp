import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Avatar } from '../../../types/wordSearch.types';
import { WORD_SEARCH_COLORS } from '../../../data/constants/colors';
import CustomAlert from '../../common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import { useApp } from '../../../context/AppContext';

interface AvatarSelectorModalProps {
  visible: boolean;
  currentAvatar: Avatar;
  onClose: () => void;
  onSelect: (avatar: Avatar) => void;
}

const EMOJI_AVATARS = [
  '😊', '😎', '🤩', '🥳', '🤓', '🧐',
  '😇', '🤠', '🥷', '👑', '🎭', '🎨',
  '🎮', '🎯', '🎲', '🎪', '🌟', '⚡',
  '🔥', '💎', '🏆', '🎖️', '👾', '🤖',
  '👻', '🦄', '🐉', '🦁', '🐯', '🦊',
  '🐼', '🐨', '🐸', '🦉', '🦋', '🌈',
];

const PRESET_AVATARS = [
  { id: 'avatar_1', emoji: '👨‍💻' },
  { id: 'avatar_2', emoji: '👩‍💻' },
  { id: 'avatar_3', emoji: '👨‍🎨' },
  { id: 'avatar_4', emoji: '👩‍🎨' },
  { id: 'avatar_5', emoji: '👨‍🚀' },
  { id: 'avatar_6', emoji: '👩‍🚀' },
  { id: 'avatar_7', emoji: '🧙‍♂️' },
  { id: 'avatar_8', emoji: '🧙‍♀️' },
  { id: 'avatar_9', emoji: '🦸‍♂️' },
  { id: 'avatar_10', emoji: '🦸‍♀️' },
];

const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  visible,
  currentAvatar,
  onClose,
  onSelect,
}) => {
  const { currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [activeTab, setActiveTab] = useState<'emoji' | 'preset'>('emoji');

  const handleSelectEmoji = (emoji: string) => {
    onSelect({ type: 'emoji', value: emoji });
    onClose();
  };

  const handleSelectPreset = (preset: { id: string; emoji: string }) => {
    onSelect({ type: 'preset', value: preset.emoji });
    onClose();
  };

  const handleSelectPhoto = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 400,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showAlert({
          title: 'Erreur',
          message: 'Impossible de sélectionner une photo',
          type: 'error',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      if (result.assets && result.assets[0]?.uri) {
        onSelect({ type: 'photo', value: result.assets[0].uri });
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de photo:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de sélectionner une photo',
        type: 'error',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choisir un avatar</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'emoji' && styles.activeTab]}
              onPress={() => setActiveTab('emoji')}
            >
              <Text style={[styles.tabText, activeTab === 'emoji' && styles.activeTabText]}>
                Emojis
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'preset' && styles.activeTab]}
              onPress={() => setActiveTab('preset')}
            >
              <Text style={[styles.tabText, activeTab === 'preset' && styles.activeTabText]}>
                Presets
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'emoji' ? (
              <View style={styles.grid}>
                {EMOJI_AVATARS.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.emojiButton,
                      currentAvatar.value === emoji && styles.selectedButton,
                    ]}
                    onPress={() => handleSelectEmoji(emoji)}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.grid}>
                {PRESET_AVATARS.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.emojiButton,
                      currentAvatar.value === preset.emoji && styles.selectedButton,
                    ]}
                    onPress={() => handleSelectPreset(preset)}
                  >
                    <Text style={styles.emoji}>{preset.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Bouton Photo */}
            <TouchableOpacity style={styles.photoButton} onPress={handleSelectPhoto}>
              <Text style={styles.photoButtonText}>📷 Choisir une photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
          theme={currentTheme}
          type={alertConfig.type}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  closeButton: {
    fontSize: 24,
    color: WORD_SEARCH_COLORS.textSecondary,
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: WORD_SEARCH_COLORS.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  activeTabText: {
    color: WORD_SEARCH_COLORS.textWhite,
  },
  content: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: '13%',
    aspectRatio: 1,
    backgroundColor: WORD_SEARCH_COLORS.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  selectedButton: {
    borderColor: WORD_SEARCH_COLORS.primary,
    backgroundColor: WORD_SEARCH_COLORS.primary + '20',
  },
  emoji: {
    fontSize: 32,
  },
  photoButton: {
    backgroundColor: WORD_SEARCH_COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textWhite,
  },
});

export default AvatarSelectorModal;
