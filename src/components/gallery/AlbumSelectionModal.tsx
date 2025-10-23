import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { Album } from '../../types/gallery';
import CustomAlert from '../common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

interface AlbumSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  albums: Album[];
  onSelectAlbum: (albumId: string) => void;
  onCreateNewAlbum: (albumName: string, albumDescription: string) => void;
  theme: any;
}

const AlbumSelectionModal: React.FC<AlbumSelectionModalProps> = ({
  visible,
  onClose,
  albums,
  onSelectAlbum,
  onCreateNewAlbum,
  theme,
}) => {
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');

  const handleCreateAlbum = () => {
    if (!newAlbumName.trim()) {
      showAlert({
        title: 'Erreur',
        message: 'Veuillez entrer un nom pour l\'album',
        type: 'error',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    onCreateNewAlbum(newAlbumName.trim(), newAlbumDescription.trim());
    setNewAlbumName('');
    setNewAlbumDescription('');
    setShowCreateForm(false);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setNewAlbumName('');
    setNewAlbumDescription('');
    onClose();
  };

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <TouchableOpacity
      style={[styles.albumItem, { backgroundColor: theme.background.secondary }]}
      onPress={() => {
        onSelectAlbum(item.id);
        onClose();
      }}
    >
      <View style={[styles.albumIcon, { backgroundColor: theme.background.tertiary }]}>
        <Foundation name="photo" size={24} color={theme.text.secondary} />
      </View>
      <View style={styles.albumInfo}>
        <Text style={[styles.albumTitle, { color: theme.text.primary }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.albumStats, { color: theme.text.secondary }]}>
          {item.mediaCount} {item.mediaCount === 1 ? 'élément' : 'éléments'}
        </Text>
      </View>
      <Foundation name="arrow-right" size={20} color={theme.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.background.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
              {showCreateForm ? 'Nouvel album' : 'Choisir un album'}
            </Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Foundation name="x" size={24} color={theme.text.tertiary} />
            </TouchableOpacity>
          </View>

          {showCreateForm ? (
            /* Create Album Form */
            <View style={styles.createForm}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text.secondary }]}>
                  Nom de l'album *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background.secondary,
                      color: theme.text.primary,
                      borderColor: theme.border.primary,
                    },
                  ]}
                  placeholder="Mon album"
                  placeholderTextColor={theme.text.tertiary}
                  value={newAlbumName}
                  onChangeText={setNewAlbumName}
                  maxLength={50}
                  autoFocus
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text.secondary }]}>
                  Description (optionnel)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: theme.background.secondary,
                      color: theme.text.primary,
                      borderColor: theme.border.primary,
                    },
                  ]}
                  placeholder="Description de l'album..."
                  placeholderTextColor={theme.text.tertiary}
                  value={newAlbumDescription}
                  onChangeText={setNewAlbumDescription}
                  maxLength={200}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[
                    styles.formButton,
                    styles.cancelButton,
                    { backgroundColor: theme.background.secondary },
                  ]}
                  onPress={() => {
                    setShowCreateForm(false);
                    setNewAlbumName('');
                    setNewAlbumDescription('');
                  }}
                >
                  <Text style={[styles.buttonText, { color: theme.text.secondary }]}>
                    Annuler
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formButton,
                    styles.createButton,
                    { backgroundColor: theme.romantic.primary },
                  ]}
                  onPress={handleCreateAlbum}
                >
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    Créer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Album List */
            <>
              {/* Create New Album Button */}
              <TouchableOpacity
                style={[styles.createAlbumButton, { backgroundColor: theme.background.secondary }]}
                onPress={() => setShowCreateForm(true)}
              >
                <View
                  style={[
                    styles.createAlbumIcon,
                    { backgroundColor: theme.romantic.primary + '20' },
                  ]}
                >
                  <Foundation name="plus" size={24} color={theme.romantic.primary} />
                </View>
                <Text style={[styles.createAlbumText, { color: theme.romantic.primary }]}>
                  Créer un nouvel album
                </Text>
              </TouchableOpacity>

              {/* Albums List */}
              {albums.length > 0 ? (
                <FlatList
                  data={albums}
                  renderItem={renderAlbumItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.albumsList}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Foundation name="photo" size={48} color={theme.text.tertiary} />
                  <Text style={[styles.emptyStateText, { color: theme.text.secondary }]}>
                    Aucun album
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: theme.text.tertiary }]}>
                    Créez votre premier album pour organiser vos médias
                  </Text>
                </View>
              )}
            </>
          )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  createAlbumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  createAlbumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createAlbumText: {
    fontSize: 16,
    fontWeight: '600',
  },
  albumsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  albumIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  albumInfo: {
    flex: 1,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  albumStats: {
    fontSize: 13,
  },
  createForm: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {},
  createButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default AlbumSelectionModal;