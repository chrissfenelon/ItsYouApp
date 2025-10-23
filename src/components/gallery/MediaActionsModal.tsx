import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Foundation from 'react-native-vector-icons/Foundation';
import { MediaItem } from '../../types/gallery';
import CustomAlert from '../common/CustomAlert';
import useCustomAlert from '../../hooks/useCustomAlert';

const { height } = Dimensions.get('window');

interface MediaActionsModalProps {
  visible: boolean;
  onClose: () => void;
  media: MediaItem | null;
  theme: any;
  hasPartner: boolean;
  onEdit: (mediaId: string) => void;
  onShare: (mediaId: string) => void;
  onUnshare: (mediaId: string) => void;
  onFavorite: (mediaId: string) => void;
  onUnfavorite: (mediaId: string) => void;
  onAddToAlbum: (mediaId: string) => void;
  onRemoveFromAlbum: (mediaId: string) => void;
  onMoveToTrash: (mediaId: string) => void;
  onRestore: (mediaId: string) => void;
  onDelete: (mediaId: string) => void;
  onDownload: (mediaId: string) => void;
  onViewDetails: (mediaId: string) => void;
}

const MediaActionsModal: React.FC<MediaActionsModalProps> = ({
  visible,
  onClose,
  media,
  theme,
  hasPartner,
  onEdit,
  onShare,
  onUnshare,
  onFavorite,
  onUnfavorite,
  onAddToAlbum,
  onRemoveFromAlbum,
  onMoveToTrash,
  onRestore,
  onDelete,
  onDownload,
  onViewDetails,
}) => {
  const { alertConfig, isVisible: isAlertVisible, showAlert, hideAlert } = useCustomAlert();

  if (!media) return null;

  const handleMoveToTrash = () => {
    showAlert({
      title: 'Déplacer vers la corbeille',
      message: `Voulez-vous vraiment déplacer "${media.title || 'ce média'}" vers la corbeille ?`,
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déplacer',
          style: 'destructive',
          onPress: () => {
            onMoveToTrash(media.id);
            onClose();
          }
        },
      ]
    });
  };

  const handleDelete = () => {
    showAlert({
      title: 'Supprimer définitivement',
      message: `Voulez-vous vraiment supprimer définitivement "${media.title || 'ce média'}" ? Cette action est irréversible.`,
      type: 'error',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            onDelete(media.id);
            onClose();
          }
        },
      ]
    });
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Show different actions based on whether media is in trash
  const actions = media.isArchived ? [
    // Actions for trash items
    {
      id: 'view',
      title: 'Voir les détails',
      icon: 'info',
      color: theme.text.primary,
      onPress: () => {
        onViewDetails(media.id);
        onClose();
      },
    },
    {
      id: 'restore',
      title: 'Restaurer',
      icon: 'refresh',
      color: theme.romantic.primary,
      onPress: () => {
        onRestore(media.id);
        onClose();
      },
    },
    {
      id: 'delete',
      title: 'Supprimer définitivement',
      icon: 'x',
      color: theme.status.error,
      onPress: handleDelete,
    },
  ] : [
    // Actions for normal items
    {
      id: 'view',
      title: 'Voir les détails',
      icon: 'info',
      color: theme.text.primary,
      onPress: () => {
        onViewDetails(media.id);
        onClose();
      },
    },
    {
      id: 'edit',
      title: 'Modifier',
      icon: 'pencil',
      color: theme.text.primary,
      onPress: () => {
        onEdit(media.id);
        onClose();
      },
    },
    {
      id: 'favorite',
      title: media.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris',
      icon: 'heart',
      color: media.isFavorite ? theme.romantic.primary : theme.text.secondary,
      onPress: () => {
        if (media.isFavorite) {
          onUnfavorite(media.id);
        } else {
          onFavorite(media.id);
        }
        onClose();
      },
    },
    {
      id: 'album',
      title: media.albumId ? 'Retirer de l\'album' : 'Ajouter à un album',
      icon: 'photo',
      color: media.albumId ? theme.text.secondary : theme.text.secondary,
      onPress: () => {
        if (media.albumId) {
          onRemoveFromAlbum(media.id);
        } else {
          onAddToAlbum(media.id);
        }
        onClose();
      },
    },
    {
      id: 'share',
      title: media.isSharedWithPartner ? 'Arrêter le partage' : 'Partager avec partenaire',
      icon: media.isSharedWithPartner ? 'lock' : 'heart',
      color: media.isSharedWithPartner ? theme.romantic.primary : theme.text.secondary,
      onPress: () => {
        if (media.isSharedWithPartner) {
          onUnshare(media.id);
          onClose();
        } else {
          onShare(media.id);
          onClose();
        }
      },
      available: hasPartner || media.isSharedWithPartner,
    },
    {
      id: 'download',
      title: 'Télécharger',
      icon: 'download',
      color: theme.text.secondary,
      onPress: () => {
        onDownload(media.id);
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
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
          {/* Background Blur */}
          <BlurView
            style={styles.blurOverlay}
            blurType="dark"
            blurAmount={15}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.8)"
          />

          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modal}>
              <View style={styles.modalContent}>
                {/* Header with Thumbnail */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    {/* Media Thumbnail */}
                    <View style={styles.thumbnailContainer}>
                      <View style={styles.thumbnailGlow} />
                      <Image
                        source={{ uri: media.thumbnailUrl || media.uri }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />
                      {media.type === 'video' && (
                        <View style={styles.videoPlayIcon}>
                          <Foundation name="play" size={20} color="#FFFFFF" />
                        </View>
                      )}
                    </View>

                    {/* Title */}
                    <Text style={styles.mediaTitle} numberOfLines={2}>
                      {media.title || 'Média sans titre'}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Foundation name="x" size={24} color="rgba(255, 255, 255, 0.9)" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Media Info */}
                  <View style={styles.mediaInfo}>
                    <View style={styles.infoRow}>
                      <Foundation name="calendar" size={16} color="rgba(255, 255, 255, 0.7)" />
                      <Text style={styles.infoText}>
                        Créé le {media.createdAt ? new Date(media.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Foundation
                        name={media.type === 'video' ? 'play' : 'photo'}
                        size={16}
                        color="rgba(255, 255, 255, 0.7)"
                      />
                      <Text style={styles.infoText}>
                        {media.type === 'video' ? 'Vidéo' : 'Photo'} • {formatFileSize(media.metadata?.size || 0)}
                      </Text>
                    </View>
                    {media.dimensions && (
                      <View style={styles.infoRow}>
                        <Foundation name="page-doc" size={16} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.infoText}>
                          {media.dimensions.width} x {media.dimensions.height}
                        </Text>
                      </View>
                    )}
                    {media.isSharedWithPartner && (
                      <View style={styles.infoRow}>
                        <Foundation name="heart" size={16} color={theme.romantic.primary} />
                        <Text style={[styles.infoText, { color: theme.romantic.primary }]}>
                          Partagé avec votre partenaire
                        </Text>
                      </View>
                    )}
                    {media.albumId && (
                      <View style={styles.infoRow}>
                        <Foundation name="photo" size={16} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.infoText}>
                          Dans un album
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
                          index < availableActions.length - 1 && styles.actionBorderBottom,
                        ]}
                        onPress={action.onPress}
                        activeOpacity={0.7}
                      >
                        <Foundation name={action.icon} size={22} color={action.color} />
                        <Text style={styles.actionText}>
                          {action.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {alertConfig && (
        <CustomAlert
          visible={isAlertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
          theme={theme}
          type={alertConfig.type}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: height * 0.75,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 18,
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    backgroundColor: 'rgba(40, 40, 50, 0.98)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumbnailGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: 'rgba(255, 105, 180, 0.6)',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  videoPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.3,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    maxHeight: height * 0.6,
  },
  mediaInfo: {
    padding: 20,
    marginHorizontal: 80,
    marginVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(60, 60, 70, 0.8)',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    width: '100%',
  },
  actions: {
    paddingBottom: 18,
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 22,
    gap: 16,
    backgroundColor: 'transparent',
  },
  actionBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  actionText: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.3,
    color: '#FFFFFF',
  },
});

export default MediaActionsModal;