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
import { Song } from '../../types/music';
import CustomAlert from '../common/CustomAlert';
import useCustomAlert from '../../hooks/useCustomAlert';

const { height } = Dimensions.get('window');

interface MusicActionsModalProps {
  visible: boolean;
  onClose: () => void;
  song: Song | null;
  theme: any;
  onPlay: (songId: string) => void;
  onAddToPlaylist: (songId: string) => void;
  onShare: (songId: string) => void;
  onUnshare: (songId: string) => void;
  onRename: (songId: string) => void;
  onDelete: (songId: string) => void;
  onViewDetails: (songId: string) => void;
  onMakeOffline?: (songId: string) => void;
  onRemoveOffline?: (songId: string) => void;
  isOfflineAvailable?: boolean;
}

const MusicActionsModal: React.FC<MusicActionsModalProps> = ({
  visible,
  onClose,
  song,
  theme,
  onPlay,
  onAddToPlaylist,
  onShare,
  onUnshare,
  onRename,
  onDelete,
  onViewDetails,
  onMakeOffline,
  onRemoveOffline,
  isOfflineAvailable = false,
}) => {
  const { alertConfig, isVisible: isAlertVisible, showAlert, hideAlert } = useCustomAlert();

  if (!song) return null;

  const handleDelete = () => {
    showAlert({
      title: 'Supprimer la chanson',
      message: `Voulez-vous vraiment supprimer "${song.title}" ? Cette action est irréversible.`,
      type: 'error',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            onDelete(song.id);
            onClose();
          }
        },
      ]
    });
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Inconnu';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Actions based on song type
  const actions = song.isEmbedded ? [
    // Embedded songs (can't be renamed or deleted)
    {
      id: 'play',
      title: 'Jouer maintenant',
      icon: 'play',
      color: theme.romantic.primary,
      onPress: () => {
        onPlay(song.id);
        onClose();
      },
    },
    {
      id: 'playlist',
      title: 'Ajouter à une playlist',
      icon: 'list',
      color: theme.text.primary,
      onPress: () => {
        onAddToPlaylist(song.id);
        onClose();
      },
    },
    {
      id: 'share',
      title: song.isSharedWithPartner ? 'Arrêter le partage' : 'Partager avec partenaire',
      icon: song.isSharedWithPartner ? 'lock' : 'heart',
      color: song.isSharedWithPartner ? theme.romantic.primary : theme.text.secondary,
      onPress: () => {
        if (song.isSharedWithPartner) {
          onUnshare(song.id);
        } else {
          onShare(song.id);
        }
        onClose();
      },
    },
    {
      id: 'offline',
      title: isOfflineAvailable ? 'Supprimer du hors ligne' : 'Rendre disponible hors ligne',
      icon: isOfflineAvailable ? 'trash' : 'download',
      color: isOfflineAvailable ? '#22C55E' : theme.text.primary,
      onPress: () => {
        if (isOfflineAvailable && onRemoveOffline) {
          onRemoveOffline(song.id);
        } else if (!isOfflineAvailable && onMakeOffline) {
          onMakeOffline(song.id);
        }
        onClose();
      },
    },
    {
      id: 'details',
      title: 'Voir les détails',
      icon: 'info',
      color: theme.text.primary,
      onPress: () => {
        onViewDetails(song.id);
        onClose();
      },
    },
  ] : [
    // User uploaded songs (can rename and delete)
    {
      id: 'play',
      title: 'Jouer maintenant',
      icon: 'play',
      color: theme.romantic.primary,
      onPress: () => {
        onPlay(song.id);
        onClose();
      },
    },
    {
      id: 'rename',
      title: 'Renommer',
      icon: 'pencil',
      color: theme.text.primary,
      onPress: () => {
        onRename(song.id);
        onClose();
      },
    },
    {
      id: 'playlist',
      title: 'Ajouter à une playlist',
      icon: 'list',
      color: theme.text.primary,
      onPress: () => {
        onAddToPlaylist(song.id);
        onClose();
      },
    },
    {
      id: 'share',
      title: song.isSharedWithPartner ? 'Arrêter le partage' : 'Partager avec partenaire',
      icon: song.isSharedWithPartner ? 'lock' : 'heart',
      color: song.isSharedWithPartner ? theme.romantic.primary : theme.text.secondary,
      onPress: () => {
        if (song.isSharedWithPartner) {
          onUnshare(song.id);
        } else {
          onShare(song.id);
        }
        onClose();
      },
    },
    {
      id: 'offline',
      title: isOfflineAvailable ? 'Supprimer du hors ligne' : 'Rendre disponible hors ligne',
      icon: isOfflineAvailable ? 'trash' : 'download',
      color: isOfflineAvailable ? '#22C55E' : theme.text.primary,
      onPress: () => {
        if (isOfflineAvailable && onRemoveOffline) {
          onRemoveOffline(song.id);
        } else if (!isOfflineAvailable && onMakeOffline) {
          onMakeOffline(song.id);
        }
        onClose();
      },
    },
    {
      id: 'details',
      title: 'Voir les détails',
      icon: 'info',
      color: theme.text.primary,
      onPress: () => {
        onViewDetails(song.id);
        onClose();
      },
    },
    {
      id: 'delete',
      title: 'Supprimer',
      icon: 'trash',
      color: theme.status.error,
      onPress: handleDelete,
    },
  ];

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
                    {/* Song Thumbnail */}
                    <View style={styles.thumbnailContainer}>
                      <View style={styles.thumbnailGlow} />
                      {song.thumbnailUrl ? (
                        <Image
                          source={{ uri: song.thumbnailUrl }}
                          style={styles.thumbnail}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.romantic.primary + '40' }]}>
                          <Foundation name="music" size={28} color={theme.romantic.primary} />
                        </View>
                      )}
                    </View>

                    {/* Title */}
                    <View style={styles.titleContainer}>
                      <Text style={styles.songTitle} numberOfLines={2}>
                        {song.title}
                      </Text>
                      <Text style={styles.songArtist} numberOfLines={1}>
                        {song.artist}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Foundation name="x" size={24} color="rgba(255, 255, 255, 0.9)" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Song Info */}
                  <View style={styles.songInfo}>
                    <View style={styles.infoRow}>
                      <Foundation name="clock" size={16} color="rgba(255, 255, 255, 0.7)" />
                      <Text style={styles.infoText}>
                        Durée: {formatDuration(song.duration)}
                      </Text>
                    </View>
                    {song.album && (
                      <View style={styles.infoRow}>
                        <Foundation name="music" size={16} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.infoText}>
                          Album: {song.album}
                        </Text>
                      </View>
                    )}
                    {song.metadata?.size && (
                      <View style={styles.infoRow}>
                        <Foundation name="page-doc" size={16} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.infoText}>
                          Taille: {formatFileSize(song.metadata.size)}
                        </Text>
                      </View>
                    )}
                    {song.isSharedWithPartner && (
                      <View style={styles.infoRow}>
                        <Foundation name="heart" size={16} color={theme.romantic.primary} />
                        <Text style={[styles.infoText, { color: theme.romantic.primary }]}>
                          Partagé avec votre partenaire
                        </Text>
                      </View>
                    )}
                    {song.isEmbedded && (
                      <View style={styles.infoRow}>
                        <Foundation name="star" size={16} color={theme.romantic.primary} />
                        <Text style={[styles.infoText, { color: theme.romantic.primary }]}>
                          Chanson intégrée
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    {actions.map((action, index) => (
                      <TouchableOpacity
                        key={action.id}
                        style={[
                          styles.actionButton,
                          index < actions.length - 1 && styles.actionBorderBottom,
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
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 105, 180, 0.4)',
  },
  titleContainer: {
    flex: 1,
  },
  songTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    maxHeight: height * 0.6,
  },
  songInfo: {
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

export default MusicActionsModal;
