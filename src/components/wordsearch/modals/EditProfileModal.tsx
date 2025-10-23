import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PlayerProfile, Avatar } from '../../../types/wordSearch.types';
import { WORD_SEARCH_COLORS } from '../../../data/constants/colors';
import { AvatarDisplay } from '../../../utils/avatarUtils';

interface EditProfileModalProps {
  visible: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onSave: (name: string, avatar: Avatar) => void;
  onSelectAvatar: () => void;
  selectedAvatar?: Avatar;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  profile,
  onClose,
  onSave,
  onSelectAvatar,
  selectedAvatar,
}) => {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);

  // Mettre à jour l'avatar local quand un nouvel avatar est sélectionné
  React.useEffect(() => {
    if (selectedAvatar) {
      setAvatar(selectedAvatar);
    }
  }, [selectedAvatar]);

  // Réinitialiser quand le modal s'ouvre/ferme
  React.useEffect(() => {
    if (visible) {
      setName(profile.name);
      setAvatar(selectedAvatar || profile.avatar);
    }
  }, [visible, profile.name, profile.avatar, selectedAvatar]);

  const handleSave = () => {
    if (name.trim().length === 0) {
      return;
    }
    onSave(name.trim(), avatar);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* Header */}
            <Text style={styles.title}>Modifier le profil</Text>

            {/* Avatar */}
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={onSelectAvatar}
            >
              <AvatarDisplay
                avatar={avatar}
                imageStyle={styles.photoAvatar}
                textStyle={styles.avatar}
              />
              <Text style={styles.changeAvatarText}>Changer l'avatar</Text>
            </TouchableOpacity>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Entrez votre nom"
                placeholderTextColor={WORD_SEARCH_COLORS.textSecondary}
                maxLength={20}
              />
              <Text style={styles.charCount}>{name.length}/20</Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={name.trim().length === 0}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    fontSize: 80,
    marginBottom: 8,
  },
  photoAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: WORD_SEARCH_COLORS.background,
  },
  changeAvatarText: {
    fontSize: 14,
    color: WORD_SEARCH_COLORS.primary,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: WORD_SEARCH_COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: WORD_SEARCH_COLORS.textPrimary,
    borderWidth: 2,
    borderColor: WORD_SEARCH_COLORS.border,
  },
  charCount: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: WORD_SEARCH_COLORS.background,
    borderWidth: 2,
    borderColor: WORD_SEARCH_COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  saveButton: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textWhite,
  },
});

export default EditProfileModal;
