import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { Album } from '../../types/gallery';
import CustomAlert from '../common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { height } = Dimensions.get('window');

interface AlbumModalProps {
  visible: boolean;
  onClose: () => void;
  theme: any;
  mode: 'create' | 'edit' | 'select';
  album?: Album | null;
  albums?: Album[];
  onCreateAlbum: (albumData: Omit<Album, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName' | 'mediaCount' | 'totalSize'>) => Promise<void>;
  onUpdateAlbum?: (albumId: string, updates: Partial<Album>) => Promise<void>;
  onSelectAlbum?: (albumId: string) => void;
}

const AlbumModal: React.FC<AlbumModalProps> = ({
  visible,
  onClose,
  theme,
  mode,
  album,
  albums = [],
  onCreateAlbum,
  onUpdateAlbum,
  onSelectAlbum,
}) => {
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [title, setTitle] = useState(album?.title || '');
  const [description, setDescription] = useState(album?.description || '');
  const [isSharedWithPartner, setIsSharedWithPartner] = useState(album?.isSharedWithPartner || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert({
        title: 'Erreur',
        message: 'Veuillez saisir un titre pour l\'album',
        type: 'error',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    setIsSaving(true);
    try {
      const albumData = {
        title: title.trim(),
        description: description.trim(),
        isSharedWithPartner,
        visibility: isSharedWithPartner ? 'shared' as const : 'private' as const,
        tags: [],
        isFavorite: false,
        isArchived: false,
      };

      if (mode === 'create') {
        await onCreateAlbum(albumData);
        showAlert({
          title: 'Succès',
          message: 'Album créé avec succès',
          type: 'success',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else if (mode === 'edit' && album && onUpdateAlbum) {
        await onUpdateAlbum(album.id, albumData);
        showAlert({
          title: 'Succès',
          message: 'Album mis à jour avec succès',
          type: 'success',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }

      // Reset form
      setTitle('');
      setDescription('');
      setIsSharedWithPartner(false);
      onClose();
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de sauvegarder l\'album',
        type: 'error',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAlbum = (albumId: string) => {
    if (onSelectAlbum) {
      onSelectAlbum(albumId);
    }
    onClose();
  };

  const renderCreateEditForm = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Title Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text.primary }]}>
          Titre de l'album *
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
          placeholder="Saisissez le titre..."
          placeholderTextColor={theme.text.tertiary}
          value={title}
          onChangeText={setTitle}
          maxLength={50}
        />
      </View>

      {/* Description Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text.primary }]}>
          Description (optionnelle)
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: theme.background.secondary, color: theme.text.primary }
          ]}
          placeholder="Décrivez votre album..."
          placeholderTextColor={theme.text.tertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={200}
        />
      </View>

      {/* Sharing Toggle */}
      <View style={styles.inputGroup}>
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setIsSharedWithPartner(!isSharedWithPartner)}
        >
          <View style={styles.toggleInfo}>
            <Text style={[styles.label, { color: theme.text.primary }]}>
              Partager avec votre partenaire
            </Text>
            <Text style={[styles.toggleDescription, { color: theme.text.secondary }]}>
              L'album sera visible par votre partenaire
            </Text>
          </View>
          <View style={[
            styles.toggle,
            {
              backgroundColor: isSharedWithPartner ? theme.romantic.primary : theme.background.secondary,
              borderColor: theme.border.secondary,
            }
          ]}>
            <View style={[
              styles.toggleIndicator,
              {
                backgroundColor: '#FFFFFF',
                transform: [{ translateX: isSharedWithPartner ? 20 : 2 }],
              }
            ]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { backgroundColor: theme.background.secondary }]}
          onPress={onClose}
        >
          <Text style={[styles.buttonText, { color: theme.text.secondary }]}>
            Annuler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            { backgroundColor: theme.romantic.primary },
            isSaving && styles.disabledButton
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            {isSaving ? 'Sauvegarde...' : mode === 'create' ? 'Créer' : 'Sauvegarder'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderAlbumSelection = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
        Sélectionner un album
      </Text>

      {albums.length === 0 ? (
        <View style={styles.emptyState}>
          <Foundation name="photo" size={40} color={theme.text.tertiary} />
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
            Aucun album disponible
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.text.tertiary }]}>
            Créez d'abord un album pour organiser vos médias
          </Text>
        </View>
      ) : (
        albums.map((albumItem) => (
          <TouchableOpacity
            key={albumItem.id}
            style={[styles.albumItem, { backgroundColor: theme.background.secondary }]}
            onPress={() => handleSelectAlbum(albumItem.id)}
          >
            <View style={styles.albumInfo}>
              <View style={[styles.albumIcon, { backgroundColor: theme.background.card }]}>
                <Foundation name="photo" size={20} color={theme.text.tertiary} />
              </View>
              <View style={styles.albumDetails}>
                <Text style={[styles.albumTitle, { color: theme.text.primary }]}>
                  {albumItem.title}
                </Text>
                <Text style={[styles.albumMeta, { color: theme.text.secondary }]}>
                  {albumItem.mediaCount} médias
                  {albumItem.isSharedWithPartner && ' • Partagé'}
                </Text>
                {albumItem.description && (
                  <Text style={[styles.albumDescription, { color: theme.text.tertiary }]} numberOfLines={2}>
                    {albumItem.description}
                  </Text>
                )}
              </View>
            </View>
            <Foundation name="arrow-right" size={16} color={theme.text.tertiary} />
          </TouchableOpacity>
        ))
      )}

      {/* Cancel Button */}
      <TouchableOpacity
        style={[styles.button, styles.cancelButton, { backgroundColor: theme.background.secondary }]}
        onPress={onClose}
      >
        <Text style={[styles.buttonText, { color: theme.text.secondary }]}>
          Annuler
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const getModalTitle = () => {
    switch (mode) {
      case 'create':
        return 'Créer un album';
      case 'edit':
        return 'Modifier l\'album';
      case 'select':
        return 'Ajouter à un album';
      default:
        return 'Album';
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
        <View style={[styles.modal, { backgroundColor: theme.background.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
              {getModalTitle()}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Foundation name="x" size={20} color={theme.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {mode === 'select' ? renderAlbumSelection() : renderCreateEditForm()}
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
          theme={theme}
          type={alertConfig.type}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    minHeight: height * 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  saveButton: {
    // Style handled by backgroundColor prop
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  albumInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  albumDetails: {
    flex: 1,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  albumMeta: {
    fontSize: 12,
    marginBottom: 2,
  },
  albumDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AlbumModal;