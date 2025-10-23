import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { NoteVisibility } from '../../types/notes';
import CustomAlert from '../common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface NoteSharingModalProps {
  visible: boolean;
  onClose: () => void;
  currentVisibility: NoteVisibility;
  onVisibilityChange: (visibility: NoteVisibility) => void;
  hasPartner: boolean;
  partnerName?: string;
  theme: any;
  noteTitle: string;
  isSharedNote?: boolean;
  onAddToFavorites?: () => void;
  onRemoveFromFavorites?: () => void;
  isFavorite?: boolean;
  onPin?: () => void;
  onUnpin?: () => void;
  isPinned?: boolean;
  onArchive?: () => void;
  onUnarchive?: () => void;
  isArchived?: boolean;
  onDelete?: () => void;
}

const NoteSharingModal: React.FC<NoteSharingModalProps> = ({
  visible,
  onClose,
  currentVisibility,
  onVisibilityChange,
  hasPartner,
  partnerName,
  theme,
  noteTitle,
  isSharedNote = false,
  onAddToFavorites,
  onRemoveFromFavorites,
  isFavorite = false,
  onPin,
  onUnpin,
  isPinned = false,
  onArchive,
  onUnarchive,
  isArchived = false,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const visibilityOptions = [
    {
      value: 'private' as NoteVisibility,
      title: 'Privée',
      subtitle: 'Visible seulement par vous',
      icon: 'lock',
      color: theme.text.secondary,
      available: true,
    },
    {
      value: 'shared' as NoteVisibility,
      title: 'Partagée',
      subtitle: hasPartner
        ? `Vous et ${partnerName || 'votre partenaire'} pouvez modifier`
        : 'Vous devez être connecté à votre partenaire',
      icon: 'heart',
      color: theme.romantic.primary,
      available: hasPartner,
    },
    {
      value: 'view-only' as NoteVisibility,
      title: 'Lecture seule',
      subtitle: hasPartner
        ? `${partnerName || 'Votre partenaire'} peut seulement lire`
        : 'Vous devez être connecté à votre partenaire',
      icon: 'eye',
      color: theme.text.tertiary,
      available: hasPartner,
    },
  ];

  const handleVisibilityChange = (visibility: NoteVisibility) => {
    if (visibility !== 'private' && !hasPartner) {
      showAlert({
        title: 'Partenaire requis',
        message: 'Vous devez être connecté à votre partenaire pour partager des notes.',
        type: 'warning',
      });
      return;
    }

    onVisibilityChange(visibility);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
    onClose();
  };

  const actionButtons = [
    {
      id: 'favorite',
      title: isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris',
      icon: 'heart',
      color: isFavorite ? theme.romantic.primary : theme.text.secondary,
      onPress: isFavorite ? onRemoveFromFavorites : onAddToFavorites,
      available: true,
    },
    {
      id: 'pin',
      title: isPinned ? 'Détacher' : 'Épingler',
      icon: 'star',
      color: isPinned ? theme.romantic.primary : theme.text.secondary,
      onPress: isPinned ? onUnpin : onPin,
      available: true,
    },
    {
      id: 'archive',
      title: isArchived ? 'Désarchiver' : 'Archiver',
      icon: 'archive',
      color: theme.text.secondary,
      onPress: isArchived ? onUnarchive : onArchive,
      available: true,
    },
    {
      id: 'delete',
      title: 'Supprimer',
      icon: 'trash',
      color: theme.status.error,
      onPress: handleDelete,
      available: !isSharedNote, // Can't delete shared notes from this view
    },
  ];

  return (
    <>
      <Modal
        visible={visible && !isVisible && !showDeleteConfirm}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modal, { backgroundColor: theme.background.card }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={[styles.title, { color: theme.text.primary }]}>
                  Options de la note
                </Text>
                <Text style={[styles.noteTitle, { color: theme.text.secondary }]} numberOfLines={1}>
                  {noteTitle || 'Note sans titre'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Foundation name="x" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Visibility Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
                  Visibilité et partage
                </Text>

                {visibilityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background.secondary },
                      currentVisibility === option.value && {
                        backgroundColor: `${theme.romantic.primary}20`,
                        borderColor: theme.romantic.primary,
                      },
                      !option.available && styles.disabledOption,
                    ]}
                    onPress={() => option.available && handleVisibilityChange(option.value)}
                    disabled={!option.available}
                  >
                    <Foundation
                      name={option.icon}
                      size={20}
                      color={option.available ? option.color : theme.text.muted}
                    />
                    <View style={styles.optionContent}>
                      <Text style={[
                        styles.optionTitle,
                        { color: option.available ? theme.text.primary : theme.text.muted }
                      ]}>
                        {option.title}
                      </Text>
                      <Text style={[
                        styles.optionSubtitle,
                        { color: option.available ? theme.text.secondary : theme.text.muted }
                      ]}>
                        {option.subtitle}
                      </Text>
                    </View>
                    {currentVisibility === option.value && option.available && (
                      <Foundation name="check" size={20} color={theme.romantic.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
                  Actions
                </Text>

                {actionButtons.filter(btn => btn.available).map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={[styles.actionButton, { backgroundColor: theme.background.secondary }]}
                    onPress={action.onPress}
                  >
                    <Foundation name={action.icon} size={20} color={action.color} />
                    <Text style={[styles.actionTitle, { color: theme.text.primary }]}>
                      {action.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sharing Info */}
              {currentVisibility !== 'private' && hasPartner && (
                <View style={[styles.infoBox, { backgroundColor: `${theme.romantic.primary}10` }]}>
                  <Foundation name="info" size={16} color={theme.romantic.primary} />
                  <Text style={[styles.infoText, { color: theme.text.secondary }]}>
                    {currentVisibility === 'shared'
                      ? `Cette note est partagée avec ${partnerName || 'votre partenaire'}. Vous pouvez tous les deux la modifier.`
                      : `Cette note est visible par ${partnerName || 'votre partenaire'} en lecture seule.`
                    }
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.confirmModalContainer}>
          <View style={[styles.confirmModal, { backgroundColor: theme.background.card }]}>
            <Foundation name="alert" size={48} color={theme.status.error} style={styles.alertIcon} />

            <Text style={[styles.confirmTitle, { color: theme.text.primary }]}>
              Supprimer la note
            </Text>

            <Text style={[styles.confirmMessage, { color: theme.text.secondary }]}>
              Êtes-vous sûr de vouloir supprimer "{noteTitle || 'cette note'}" ?
              Cette action est irréversible.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.background.secondary }]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.confirmButtonText, { color: theme.text.primary }]}>
                  Annuler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.status.error }]}
                onPress={confirmDelete}
              >
                <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>
                  Supprimer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
          onClose={hideAlert}
          theme={theme}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionContent: {
    flex: 1,
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    marginLeft: 15,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 15,
    margin: 20,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 10,
  },

  // Confirmation modal
  confirmModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  confirmModal: {
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  alertIcon: {
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NoteSharingModal;