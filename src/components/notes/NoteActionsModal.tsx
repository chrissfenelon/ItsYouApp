import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { Note } from '../../types/notes';
import CustomAlert from '../common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { height } = Dimensions.get('window');

interface NoteActionsModalProps {
  visible: boolean;
  onClose: () => void;
  note: Note | null;
  theme: any;
  hasPartner: boolean;
  onEdit: (noteId: string) => void;
  onShare: (noteId: string, visibility: 'shared' | 'view-only') => void;
  onUnshare: (noteId: string) => void;
  onPin: (noteId: string) => void;
  onUnpin: (noteId: string) => void;
  onFavorite: (noteId: string) => void;
  onUnfavorite: (noteId: string) => void;
  onArchive: (noteId: string) => void;
  onMoveToTrash: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

const NoteActionsModal: React.FC<NoteActionsModalProps> = ({
  visible,
  onClose,
  note,
  theme,
  hasPartner,
  onEdit,
  onShare,
  onUnshare,
  onPin,
  onUnpin,
  onFavorite,
  onUnfavorite,
  onArchive,
  onMoveToTrash,
  onDelete,
}) => {
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  if (!note) return null;

  const handleShare = () => {
    if (!hasPartner) {
      showAlert({
        title: 'Partenaire requis',
        message: 'Vous devez être connecté à votre partenaire pour partager des notes.',
        type: 'warning',
      });
      return;
    }

    showAlert({
      title: 'Partager la note',
      message: 'Comment voulez-vous partager cette note ?',
      type: 'info',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Lecture seule',
          onPress: () => {
            onShare(note.id, 'view-only');
            onClose();
          }
        },
        {
          text: 'Modification',
          onPress: () => {
            onShare(note.id, 'shared');
            onClose();
          }
        },
      ]
    });
  };

  const handleMoveToTrash = () => {
    showAlert({
      title: 'Déplacer vers la corbeille',
      message: `Voulez-vous vraiment déplacer "${note.title}" vers la corbeille ?`,
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déplacer',
          style: 'destructive',
          onPress: () => {
            onMoveToTrash(note.id);
            onClose();
          }
        },
      ]
    });
  };

  const handleDelete = () => {
    showAlert({
      title: 'Supprimer définitivement',
      message: `Voulez-vous vraiment supprimer définitivement "${note.title}" ? Cette action est irréversible.`,
      type: 'error',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            onDelete(note.id);
            onClose();
          }
        },
      ]
    });
  };

  const actions = [
    {
      id: 'edit',
      title: 'Modifier',
      icon: 'pencil',
      color: theme.text.primary,
      onPress: () => {
        onEdit(note.id);
        onClose();
      },
    },
    {
      id: 'pin',
      title: note.isPinned ? 'Détacher' : 'Épingler',
      icon: 'star',
      color: note.isPinned ? theme.romantic.primary : theme.text.secondary,
      onPress: () => {
        if (note.isPinned) {
          onUnpin(note.id);
        } else {
          onPin(note.id);
        }
        onClose();
      },
    },
    {
      id: 'favorite',
      title: note.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris',
      icon: 'heart',
      color: note.isFavorite ? theme.romantic.primary : theme.text.secondary,
      onPress: () => {
        if (note.isFavorite) {
          onUnfavorite(note.id);
        } else {
          onFavorite(note.id);
        }
        onClose();
      },
    },
    {
      id: 'share',
      title: note.isSharedWithPartner ? 'Arrêter le partage' : 'Partager avec partenaire',
      icon: note.isSharedWithPartner ? 'lock' : 'heart',
      color: note.isSharedWithPartner ? theme.romantic.primary : theme.text.secondary,
      onPress: () => {
        if (note.isSharedWithPartner) {
          onUnshare(note.id);
          onClose();
        } else {
          handleShare();
        }
      },
      available: hasPartner || note.isSharedWithPartner,
    },
    {
      id: 'archive',
      title: note.isArchived ? 'Désarchiver' : 'Archiver',
      icon: 'archive',
      color: theme.text.secondary,
      onPress: () => {
        onArchive(note.id);
        onClose();
      },
    },
    {
      id: 'trash',
      title: 'Déplacer vers la corbeille',
      icon: 'trash',
      color: theme.status.warning,
      onPress: handleMoveToTrash,
    },
    {
      id: 'delete',
      title: 'Supprimer définitivement',
      icon: 'x',
      color: theme.status.error,
      onPress: handleDelete,
    },
  ];

  const availableActions = actions.filter(action => action.available !== false);

  return (
    <>
      <Modal
        visible={visible && !isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
          <View style={[styles.modal, { backgroundColor: theme.background.card }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.noteTitle, { color: theme.text.primary }]} numberOfLines={1}>
                {note.title || 'Note sans titre'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Foundation name="x" size={20} color={theme.text.tertiary} />
              </TouchableOpacity>
            </View>

            {/* Note Info */}
            <View style={[styles.noteInfo, { backgroundColor: theme.background.secondary }]}>
              <View style={styles.infoRow}>
                <Foundation name="calendar" size={14} color={theme.text.tertiary} />
                <Text style={[styles.infoText, { color: theme.text.secondary }]}>
                  Modifiée le {note.updatedAt.toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Foundation name="page-doc" size={14} color={theme.text.tertiary} />
                <Text style={[styles.infoText, { color: theme.text.secondary }]}>
                  {note.wordCount} mots • {note.characterCount} caractères
                </Text>
              </View>
              {note.isSharedWithPartner && (
                <View style={styles.infoRow}>
                  <Foundation name="heart" size={14} color={theme.romantic.primary} />
                  <Text style={[styles.infoText, { color: theme.romantic.primary }]}>
                    Partagée avec votre partenaire
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {availableActions.map((action, index) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.background.secondary },
                    index < availableActions.length - 1 && styles.actionBorderBottom,
                  ]}
                  onPress={action.onPress}
                >
                  <Foundation name={action.icon} size={18} color={action.color} />
                  <Text style={[styles.actionText, { color: theme.text.primary }]}>
                    {action.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modal: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 15,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 4,
  },
  noteInfo: {
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  actions: {
    paddingBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 15,
  },
  actionBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  actionText: {
    fontSize: 16,
    flex: 1,
  },
});

export default NoteActionsModal;