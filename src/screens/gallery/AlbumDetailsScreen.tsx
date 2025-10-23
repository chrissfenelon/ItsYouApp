import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  RefreshControl,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Foundation from 'react-native-vector-icons/Foundation';
import RNFS from 'react-native-fs';
import storage from '@react-native-firebase/storage';
import { useApp } from '../../context/AppContext';
import { useGallery } from '../../context/GalleryContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import { MediaItem } from '../../types/gallery';
import MediaPickerService from '../../services/MediaPickerService';
import MediaActionsModal from '../../components/gallery/MediaActionsModal';
import MediaViewerScreen from './MediaViewerScreen';
import CustomAlert from '../../components/common/CustomAlert';
import useCustomAlert from '../../hooks/useCustomAlert';
import MediaPickerModal from '../../components/gallery/MediaPickerModal';

const { width } = Dimensions.get('window');
const GRID_SPACING = 4;
const GRID_COLUMNS = 3;
const ITEM_SIZE = (width - (GRID_COLUMNS + 1) * GRID_SPACING) / GRID_COLUMNS;

interface AlbumDetailsScreenProps {
  route: any;
  navigation: any;
}

const AlbumDetailsScreen: React.FC<AlbumDetailsScreenProps> = ({ route, navigation }) => {
  const { albumId, albumTitle } = route.params;
  const { currentTheme, user, refreshAppData, isRefreshing } = useApp();
  const {
    media,
    uploadMedia,
    updateMedia,
    deleteMedia,
    shareMediaWithPartner,
    unshareMedia,
    addMediaToAlbum,
    removeMediaFromAlbum,
  } = useGallery();

  const { alertConfig, isVisible: isAlertVisible, showAlert, hideAlert } = useCustomAlert();

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [isMediaPickerModalVisible, setIsMediaPickerModalVisible] = useState(false);

  const styles = useMemo(() => createStyles(currentTheme), [currentTheme]);

  // Filter media for this album
  const albumMedia = useMemo(() => {
    return media.filter(m => m.albumId === albumId && !m.isArchived);
  }, [media, albumId]);

  const handleAddMedia = () => {
    setIsMediaPickerModalVisible(true);
  };

  const uploadMediaHelper = async (source: 'camera-photo' | 'camera-video' | 'gallery') => {
    try {
      let mediaData: any = null;

      if (source === 'camera-photo') {
        mediaData = await MediaPickerService.openCamera('photo');
      } else if (source === 'camera-video') {
        mediaData = await MediaPickerService.openCamera('video');
      } else if (source === 'gallery') {
        mediaData = await MediaPickerService.openGallery('mixed');
      }

      if (mediaData) {
        // Validate media data
        if (!mediaData.uri) {
          throw new Error('Media URI is missing');
        }
        if (!mediaData.fileName) {
          throw new Error('Media fileName is missing');
        }

        // Upload media
        const mediaId = await uploadMedia({
          uri: mediaData.uri,
          fileName: mediaData.fileName,
          type: mediaData.type || 'image',
          fileSize: mediaData.fileSize,
          width: mediaData.width,
          height: mediaData.height,
          duration: mediaData.duration,
        });

        // Add to album
        await addMediaToAlbum(mediaId, albumId);

        showAlert({
          title: 'Succès',
          message: 'Média ajouté à l\'album',
          type: 'success',
        });
      }
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error?.message || 'Impossible d\'ajouter le média',
        type: 'error',
      });
    }
  };

  const handleSelectCamera = async () => {
    await uploadMediaHelper('camera-photo');
  };

  const handleSelectGallery = async () => {
    await uploadMediaHelper('gallery');
  };

  const handleSelectVideo = async () => {
    await uploadMediaHelper('camera-video');
  };

  const handleSelectDocument = async () => {
    await uploadMediaHelper('gallery');
  };

  const handleMediaPress = (mediaItem: MediaItem, index: number) => {
    setViewerInitialIndex(index);
    setIsViewerVisible(true);
  };

  const handleMediaLongPress = (mediaItem: MediaItem) => {
    setSelectedMedia(mediaItem);
    setIsActionsModalVisible(true);
  };

  const handleShareMedia = async (mediaId: string) => {
    const mediaItem = albumMedia.find(m => m.id === mediaId);
    if (!mediaItem) return;

    if (mediaItem.isSharedWithPartner) {
      showAlert({
        title: 'Déjà partagé',
        message: 'Ce média est déjà partagé avec votre partenaire',
        type: 'info',
      });
      return;
    }

    showAlert({
      title: 'Partager',
      message: 'Ce média sera visible par votre partenaire. Voulez-vous continuer ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Partager',
          style: 'default',
          onPress: async () => {
            try {
              await shareMediaWithPartner(mediaId);
              showAlert({
                title: 'Succès',
                message: 'Média partagé avec succès',
                type: 'success',
              });
              setIsActionsModalVisible(false);
            } catch (error: any) {
              showAlert({
                title: 'Erreur',
                message: error?.message || 'Impossible de partager le média',
                type: 'error',
              });
            }
          },
        },
      ],
    });
  };

  const handleUnshareMedia = async (mediaId: string) => {
    try {
      await unshareMedia(mediaId);
      showAlert({
        title: 'Succès',
        message: 'Partage arrêté',
        type: 'success',
      });
      setIsActionsModalVisible(false);
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error?.message || 'Impossible d\'arrêter le partage',
        type: 'error',
      });
    }
  };

  const handleRemoveFromAlbum = async (mediaId: string) => {
    showAlert({
      title: 'Retirer de l\'album',
      message: 'Retirer ce média de l\'album ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMediaFromAlbum(mediaId);
              showAlert({
                title: 'Succès',
                message: 'Média retiré de l\'album',
                type: 'success',
              });
              setIsActionsModalVisible(false);
            } catch (error: any) {
              showAlert({
                title: 'Erreur',
                message: error?.message || 'Impossible de retirer le média',
                type: 'error',
              });
            }
          },
        },
      ],
    });
  };

  const handleFavoriteMedia = async (mediaId: string) => {
    try {
      await updateMedia(mediaId, { isFavorite: true });
      setIsActionsModalVisible(false);
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error?.message || 'Impossible d\'ajouter aux favoris',
        type: 'error',
      });
    }
  };

  const handleUnfavoriteMedia = async (mediaId: string) => {
    try {
      await updateMedia(mediaId, { isFavorite: false });
      setIsActionsModalVisible(false);
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error?.message || 'Impossible de retirer des favoris',
        type: 'error',
      });
    }
  };

  const handleMoveToTrash = async (mediaId: string) => {
    try {
      await updateMedia(mediaId, { isArchived: true });
      showAlert({
        title: 'Succès',
        message: 'Média déplacé vers la corbeille',
        type: 'success',
      });
      setIsActionsModalVisible(false);
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error?.message || 'Impossible de déplacer le média',
        type: 'error',
      });
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await deleteMedia(mediaId);
      showAlert({
        title: 'Succès',
        message: 'Média supprimé définitivement',
        type: 'success',
      });
      setIsActionsModalVisible(false);
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error?.message || 'Impossible de supprimer le média',
        type: 'error',
      });
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      // For Android 13+ (API level 33+), we don't need WRITE_EXTERNAL_STORAGE
      if (Platform.Version >= 33) {
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Permission de stockage',
          message: 'ItsYou a besoin d\'accéder à votre stockage pour télécharger le média',
          buttonNeutral: 'Demander plus tard',
          buttonNegative: 'Annuler',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Error requesting storage permission:', err);
      return false;
    }
  };

  const handleDownload = async (mediaId: string) => {
    const mediaItem = albumMedia.find(m => m.id === mediaId);
    if (!mediaItem) return;

    if (!mediaItem.isSharedWithPartner) {
      showAlert({
        title: 'Info',
        message: 'Ce média est déjà stocké localement sur votre appareil',
        type: 'info',
      });
      return;
    }

    showAlert({
      title: 'Télécharger',
      message: 'Télécharger ce média sur votre appareil ?',
      type: 'info',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Télécharger',
          style: 'default',
          onPress: async () => {
            try {
              // Request storage permission
              const hasPermission = await requestStoragePermission();
              if (!hasPermission) {
                showAlert({
                  title: 'Permission refusée',
                  message: 'Impossible de télécharger sans permission de stockage',
                  type: 'error',
                });
                return;
              }

              // Get the file extension
              const extension = mediaItem.fileName.split('.').pop() || 'jpg';
              const fileName = `ItsYou_${mediaId}.${extension}`;

              // Determine the destination folder based on media type
              const destFolder = mediaItem.type === 'video'
                ? RNFS.DownloadDirectoryPath
                : RNFS.PicturesDirectoryPath;
              const destPath = `${destFolder}/${fileName}`;

              // Get download URL from Firebase Storage
              const downloadUrl = await storage()
                .ref(mediaItem.storagePath)
                .getDownloadURL();

              // Download the file
              showAlert({
                title: 'Téléchargement',
                message: 'Téléchargement en cours...',
                type: 'info',
              });

              const downloadResult = await RNFS.downloadFile({
                fromUrl: downloadUrl,
                toFile: destPath,
              }).promise;

              if (downloadResult.statusCode === 200) {
                showAlert({
                  title: 'Succès',
                  message: `Média téléchargé dans ${mediaItem.type === 'video' ? 'Téléchargements' : 'Images'}`,
                  type: 'success',
                });
              } else {
                throw new Error('Échec du téléchargement');
              }
            } catch (error: any) {
              console.error('Download error:', error);
              showAlert({
                title: 'Erreur',
                message: error?.message || 'Impossible de télécharger le média',
                type: 'error',
              });
            }
          },
        },
      ],
    });
  };

  const handleViewDetails = (mediaId: string) => {
    const mediaItem = albumMedia.find(m => m.id === mediaId);
    if (!mediaItem) return;

    const formatDate = (timestamp: any) => {
      if (!timestamp) return 'Date inconnue';
      const date = new Date(timestamp);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const details = [
      `Type: ${mediaItem.type === 'video' ? 'Vidéo' : 'Image'}`,
      `Taille: ${((mediaItem.fileSize || 0) / 1024 / 1024).toFixed(2)} MB`,
      `Date: ${formatDate(mediaItem.uploadedAt)}`,
      mediaItem.isSharedWithPartner ? 'Partagé avec le partenaire' : 'Non partagé',
    ].join('\n');

    showAlert({
      title: mediaItem.title || 'Détails du média',
      message: details,
      type: 'info',
    });
  };

  const renderMediaItem = ({ item, index }: { item: MediaItem; index: number }) => {
    return (
      <TouchableOpacity
        style={styles.mediaItem}
        onPress={() => handleMediaPress(item, index)}
        onLongPress={() => handleMediaLongPress(item)}
      >
        <Image
          source={{ uri: item.thumbnailUrl || item.uri }}
          style={styles.mediaThumbnail}
          resizeMode="cover"
        />
        {item.type === 'video' && (
          <View style={styles.videoIndicator}>
            <Foundation name="play-video" size={24} color="#FFFFFF" />
          </View>
        )}
        {item.isSharedWithPartner && (
          <View style={styles.sharedBadge}>
            <Foundation name="share" size={14} color="#FFFFFF" />
          </View>
        )}
        {item.isFavorite && (
          <View style={styles.favoriteBadge}>
            <Foundation name="heart" size={14} color="#FF69B4" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Foundation name="photo" size={80} color={currentTheme.text.tertiary} />
      <Text style={styles.emptyStateTitle}>Aucun média</Text>
      <Text style={styles.emptyStateSubtitle}>
        Appuyez sur + pour ajouter des médias à cet album
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Foundation name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {albumTitle}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddMedia}
            >
              <Foundation name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Media count */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {albumMedia.length} média{albumMedia.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Media Grid */}
          <View style={styles.contentContainer}>
            {albumMedia.length === 0 ? (
              renderEmptyState()
            ) : (
              <FlatList
                data={albumMedia}
                renderItem={renderMediaItem}
                keyExtractor={(item) => item.id}
                numColumns={GRID_COLUMNS}
                contentContainerStyle={styles.mediaList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={refreshAppData}
                    tintColor={currentTheme.text.primary}
                    colors={[currentTheme.text.primary]}
                  />
                }
              />
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Media Actions Modal */}
      <MediaActionsModal
        visible={isActionsModalVisible}
        onClose={() => setIsActionsModalVisible(false)}
        media={selectedMedia}
        theme={currentTheme}
        hasPartner={!!user?.partnerId}
        onEdit={() => {}}
        onShare={handleShareMedia}
        onUnshare={handleUnshareMedia}
        onFavorite={handleFavoriteMedia}
        onUnfavorite={handleUnfavoriteMedia}
        onAddToAlbum={() => {}}
        onRemoveFromAlbum={handleRemoveFromAlbum}
        onMoveToTrash={handleMoveToTrash}
        onRestore={() => {}}
        onDelete={handleDeleteMedia}
        onDownload={handleDownload}
        onViewDetails={handleViewDetails}
      />

      {/* Media Viewer */}
      <MediaViewerScreen
        visible={isViewerVisible}
        mediaList={albumMedia}
        initialIndex={viewerInitialIndex}
        onClose={() => setIsViewerVisible(false)}
        onShare={handleShareMedia}
        onFavorite={(mediaId) => {
          const mediaItem = albumMedia.find(m => m.id === mediaId);
          if (mediaItem?.isFavorite) {
            handleUnfavoriteMedia(mediaId);
          } else {
            handleFavoriteMedia(mediaId);
          }
        }}
        onDelete={handleDeleteMedia}
      />

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={isAlertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          theme={currentTheme}
          onClose={hideAlert}
        />
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        visible={isMediaPickerModalVisible}
        onClose={() => setIsMediaPickerModalVisible(false)}
        onSelectCamera={handleSelectCamera}
        onSelectGallery={handleSelectGallery}
        onSelectVideo={handleSelectVideo}
        onSelectDocument={handleSelectDocument}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 105, 180, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF69B4',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: GRID_SPACING / 2,
  },
  mediaList: {
    paddingBottom: 20,
  },
  mediaItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: GRID_SPACING / 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sharedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default AlbumDetailsScreen;
