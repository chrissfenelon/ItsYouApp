import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Image,
  RefreshControl,
  Platform,
  PermissionsAndroid,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Foundation from 'react-native-vector-icons/Foundation';
import RNFS from 'react-native-fs';
import storage from '@react-native-firebase/storage';
import { useApp } from '../context/AppContext';
import { useGallery } from '../context/GalleryContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import { MediaItem } from '../types/gallery';
import MediaActionsModal from '../components/gallery/MediaActionsModal';
import MediaPickerService from '../services/MediaPickerService';
import MediaViewerScreen from './gallery/MediaViewerScreen';
import MediaEditorScreen from './gallery/MediaEditorScreen';
import AlbumSelectionModal from '../components/gallery/AlbumSelectionModal';
import CustomAlert from '../components/common/CustomAlert';
import MediaThumbnail from '../components/gallery/MediaThumbnail';
import useCustomAlert from '../hooks/useCustomAlert';
import TextInputModal from '../components/common/TextInputModal';
import UploadProgressBar from '../components/gallery/UploadProgressBar';
import MediaCommentsService from '../services/MediaCommentsService';
import MediaPickerModal from '../components/gallery/MediaPickerModal';

const { width } = Dimensions.get('window');

const GalleryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { currentTheme, user, refreshAppData, isRefreshing: isAppRefreshing } = useApp();
  const {
    media,
    sharedMedia,
    albums,
    isLoading,
    viewMode,
    filter,
    stats,
    uploadMedia,
    updateMedia,
    shareMediaWithPartner,
    unshareMedia,
    deleteMedia,
    addMediaToAlbum,
    removeMediaFromAlbum,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    setViewMode,
    setFilter,
    searchMedia,
    clearSearch,
    getFilteredMedia,
  } = useGallery();

  const { alertConfig, isVisible: isAlertVisible, showAlert, hideAlert } = useCustomAlert();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'media' | 'albums' | 'memories'>('media');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [isAlbumSelectionVisible, setIsAlbumSelectionVisible] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [mediaToAddToAlbum, setMediaToAddToAlbum] = useState<string | null>(null);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: 'media' | 'album'; id: string; currentName: string } | null>(null);
  const [isMediaPickerModalVisible, setIsMediaPickerModalVisible] = useState(false);

  // Upload/Download progress state
  const [uploadProgress, setUploadProgress] = useState({
    visible: false,
    progress: 0,
    currentFile: 0,
    totalFiles: 0,
    isUploading: true,
  });

  // Comment counts for media items
  const [commentCounts, setCommentCounts] = useState<{[key: string]: number}>({});

  // Scroll animation for hiding header
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  // Toggle for showing/hiding gallery options (search, tabs, filters, stats)
  const [showOptions, setShowOptions] = useState(true);
  const optionsHeight = useRef(new Animated.Value(1)).current;

  const styles = createStyles(currentTheme);

  // Animate options visibility
  useEffect(() => {
    Animated.timing(optionsHeight, {
      toValue: showOptions ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showOptions]);

  // Load comment counts for shared media
  useEffect(() => {
    const loadCommentCounts = async () => {
      try {
        const sharedMediaList = showSharedMedia ? sharedMedia : media.filter(m => m.isSharedWithPartner);
        const counts: {[key: string]: number} = {};

        // Parallelize requests for better performance
        const promises = sharedMediaList
          .filter(item => item.isSharedWithPartner)
          .map(async (item) => {
            try {
              const count = await MediaCommentsService.getCommentCount(
                item.id,
                item.type === 'video' ? 'video' : 'photo'
              );
              if (count > 0) {
                counts[item.id] = count;
              }
            } catch (error) {
              console.error(`Error loading comment count for ${item.id}:`, error);
              // Continue loading other counts even if one fails
            }
          });

        await Promise.all(promises);
        setCommentCounts(counts);
      } catch (error) {
        console.error('Error loading comment counts:', error);
      }
    };

    loadCommentCounts();
  }, [media, sharedMedia, showSharedMedia]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchMedia(query);
    } else {
      clearSearch();
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;

        // Hide header when scrolling down, show when scrolling up
        if (diff > 10 && headerVisible && currentScrollY > 50) {
          setHeaderVisible(false);
          Animated.timing(headerTranslateY, {
            toValue: -400, // Hide header (negative value pushes it up)
            duration: 250,
            useNativeDriver: true,
          }).start();
        } else if (diff < -10 && !headerVisible) {
          setHeaderVisible(true);
          Animated.timing(headerTranslateY, {
            toValue: 0, // Show header
            duration: 250,
            useNativeDriver: true,
          }).start();
        }

        lastScrollY.current = currentScrollY;
      },
    }
  );

  const handleUploadMedia = () => {
    setIsMediaPickerModalVisible(true);
  };

  const uploadMediaHelper = async (source: 'camera-photo' | 'camera-video' | 'gallery') => {
    try {
      let media: any = null;

      if (source === 'camera-photo') {
        media = await MediaPickerService.openCamera('photo');
      } else if (source === 'camera-video') {
        media = await MediaPickerService.openCamera('video');
      } else if (source === 'gallery') {
        media = await MediaPickerService.openGallery('mixed');
      }

      console.log('Media selected:', media);

      if (media) {
        // Validate media data
        if (!media.uri) {
          throw new Error('Media URI is missing');
        }
        if (!media.fileName) {
          throw new Error('Media fileName is missing');
        }

        console.log('Uploading media:', {
          uri: media.uri,
          type: media.type,
          fileName: media.fileName,
          fileSize: media.fileSize,
        });

        // Upload to local storage
        const mediaItem = await uploadMedia({
          uri: media.uri,
          type: media.type,
          fileName: media.fileName,
          fileSize: media.fileSize || 0,
          width: media.width,
          height: media.height,
          duration: media.duration,
        });

        console.log('Media uploaded successfully:', mediaItem);
        showAlert({
          title: 'Succès',
          message: 'Média ajouté à votre galerie',
          type: 'success',
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error stack:', error?.stack);
      showAlert({
        title: 'Erreur',
        message: `Impossible d'ajouter le média: ${error?.message || 'Erreur inconnue'}`,
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
    // Note: MediaPickerService doesn't have document picker yet
    // For now, we'll use gallery picker which supports various file types
    await uploadMediaHelper('gallery');
  };

  const toggleViewMode = () => {
    const newLayout = viewMode.layout === 'grid' ? 'list' : 'grid';
    setViewMode({ ...viewMode, layout: newLayout });
  };

  const filteredMedia = getFilteredMedia();
  const favoritesOnly = filter.type === 'favorites' ? filteredMedia.filter(m => m.isFavorite) : filteredMedia;
  const displayMedia = showSharedMedia ? sharedMedia : favoritesOnly;

  const renderMediaItem = ({ item: mediaItem, index }: { item: MediaItem; index: number }) => {
    const isGrid = viewMode.layout === 'grid';
    const itemSize = isGrid ? (width - 60) / 3 : width - 40;

    return (
      <TouchableOpacity
        style={[
          styles.mediaItem,
          { width: itemSize, height: itemSize },
          isGrid && { marginRight: index % 3 === 2 ? 0 : 10 },
          mediaItem.isFavorite && styles.favoriteMediaItem,
        ]}
        onPress={() => handleMediaPress(mediaItem)}
        onLongPress={() => handleMediaLongPress(mediaItem)}
        activeOpacity={0.8}
      >
        <MediaThumbnail
          uri={mediaItem.uri}
          thumbnailUrl={mediaItem.thumbnailUrl}
          isVideo={mediaItem.type === 'video'}
          style={styles.mediaImage}
        />

        {/* Media type indicator */}
        {mediaItem.type === 'video' && (
          <View style={styles.videoIndicator}>
            <Foundation name="play" size={16} color="#FFFFFF" />
          </View>
        )}

        {/* Favorite indicator */}
        {mediaItem.isFavorite && (
          <View style={styles.favoriteIndicator}>
            <Foundation name="heart" size={12} color={currentTheme.romantic.primary} />
          </View>
        )}

        {/* Storage location indicator */}
        <View style={[
          styles.storageIndicator,
          mediaItem.isSharedWithPartner ? styles.cloudIndicator : styles.localIndicator
        ]}>
          <Foundation
            name={mediaItem.isSharedWithPartner ? "cloud" : "mobile"}
            size={12}
            color="#FFFFFF"
          />
        </View>

        {/* Shared indicator */}
        {mediaItem.isSharedWithPartner && (
          <View style={styles.sharedIndicator}>
            <Foundation name="heart" size={12} color={currentTheme.romantic.primary} />
          </View>
        )}

        {/* Comment count badge */}
        {mediaItem.isSharedWithPartner && commentCounts[mediaItem.id] > 0 && (
          <View style={styles.commentCountBadge}>
            <Foundation name="comments" size={10} color="#FFFFFF" />
            <Text style={styles.commentCountText}>{commentCounts[mediaItem.id]}</Text>
          </View>
        )}

        {/* Details overlay for list view */}
        {!isGrid && (
          <View style={styles.mediaDetails}>
            <Text style={styles.mediaTitle} numberOfLines={1}>
              {mediaItem.title || 'Sans titre'}
            </Text>
            <Text style={styles.mediaDate}>
              {mediaItem.createdAt instanceof Date
                ? mediaItem.createdAt.toLocaleDateString('fr-FR')
                : new Date(mediaItem.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleMediaPress = (mediaItem: MediaItem) => {
    const index = displayMedia.findIndex(m => m.id === mediaItem.id);
    setViewerInitialIndex(index);
    setIsViewerVisible(true);
  };

  const handleMediaLongPress = (mediaItem: MediaItem) => {
    setSelectedMedia(mediaItem);
    setIsActionsModalVisible(true);
  };

  const handleCloseActionsModal = () => {
    setIsActionsModalVisible(false);
    setSelectedMedia(null);
  };

  const handleEditMedia = (mediaId: string) => {
    const media = displayMedia.find(m => m.id === mediaId);
    if (media) {
      setSelectedMedia(media);
      setIsEditorVisible(true);
    }
  };

  const handleShareMedia = async (mediaId: string) => {
    const media = displayMedia.find(m => m.id === mediaId);
    if (!media) return;

    if (media.isSharedWithPartner) {
      showAlert({
        title: 'Déjà partagé',
        message: 'Ce média est déjà partagé avec votre partenaire',
        type: 'info',
      });
      return;
    }

    showAlert({
      title: 'Partager avec Papi',
      message: 'Ce média sera uploadé sur le cloud et visible par Bae. Voulez-vous continuer ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Partager',
          style: 'default',
          onPress: async () => {
            try {
              showAlert({
                title: 'Upload en cours',
                message: 'Votre média est en cours d\'upload...',
                type: 'info',
              });
              await shareMediaWithPartner(mediaId);
              showAlert({
                title: 'Succès',
                message: 'Média partagé avec Bae',
                type: 'success',
              });
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
        message: 'Partage du média annulé',
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible d\'annuler le partage',
        type: 'error',
      });
    }
  };

  const handleFavoriteMedia = async (mediaId: string) => {
    try {
      await updateMedia(mediaId, { isFavorite: true });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible d\'ajouter aux favoris',
        type: 'error',
      });
    }
  };

  const handleUnfavoriteMedia = async (mediaId: string) => {
    try {
      await updateMedia(mediaId, { isFavorite: false });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de retirer des favoris',
        type: 'error',
      });
    }
  };

  const handleAddToAlbum = (mediaId: string) => {
    setMediaToAddToAlbum(mediaId);
    setIsAlbumSelectionVisible(true);
  };

  const handleRemoveFromAlbum = async (mediaId: string) => {
    try {
      await removeMediaFromAlbum(mediaId);
      showAlert({
        title: 'Succès',
        message: 'Média retiré de l\'album',
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de retirer de l\'album',
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
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de déplacer vers la corbeille',
        type: 'error',
      });
    }
  };

  const handleRestoreMedia = async (mediaId: string) => {
    try {
      await updateMedia(mediaId, { isArchived: false });
      showAlert({
        title: 'Succès',
        message: 'Média restauré',
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de restaurer le média',
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
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de supprimer le média',
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
    const mediaItem = displayMedia.find(m => m.id === mediaId);
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
              // For shared media, uri already contains the HTTPS download URL
              let downloadUrl: string;
              if (mediaItem.uri && mediaItem.uri.startsWith('https://firebasestorage.googleapis.com')) {
                // Use the existing download URL directly
                downloadUrl = mediaItem.uri;
                console.log('Using existing Firebase Storage URL for download');
              } else if (mediaItem.storagePath) {
                // Get download URL from storage path
                downloadUrl = await storage()
                  .ref(mediaItem.storagePath)
                  .getDownloadURL();
                console.log('Retrieved download URL from storage path');
              } else {
                throw new Error('Aucun chemin de stockage disponible pour ce média');
              }

              // Show progress bar
              setUploadProgress({
                visible: true,
                progress: 0,
                currentFile: 0,
                totalFiles: 1,
                isUploading: false,
              });

              // Download the file with progress
              const downloadResult = await RNFS.downloadFile({
                fromUrl: downloadUrl,
                toFile: destPath,
                begin: () => {
                  setUploadProgress(prev => ({
                    ...prev,
                    currentFile: 1,
                    progress: 0,
                  }));
                },
                progress: (res) => {
                  const progressPercent = (res.bytesWritten / res.contentLength) * 100;
                  setUploadProgress(prev => ({
                    ...prev,
                    progress: progressPercent,
                  }));
                },
              }).promise;

              // Hide progress bar
              setUploadProgress({
                visible: false,
                progress: 0,
                currentFile: 0,
                totalFiles: 0,
                isUploading: true,
              });

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

              // Hide progress bar on error
              setUploadProgress({
                visible: false,
                progress: 0,
                currentFile: 0,
                totalFiles: 0,
                isUploading: true,
              });

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
    const mediaItem = displayMedia.find(m => m.id === mediaId);
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

    showAlert({
      title: mediaItem.title || 'Média sans titre',
      message: `Type: ${mediaItem.type === 'video' ? 'Vidéo' : 'Photo'}\n` +
               `Date: ${formatDate(mediaItem.createdAt)}\n` +
               `${mediaItem.dimensions ? `Dimensions: ${mediaItem.dimensions.width}x${mediaItem.dimensions.height}\n` : ''}` +
               `${mediaItem.metadata?.size ? `Taille: ${Math.round(mediaItem.metadata.size / 1024)}KB\n` : ''}` +
               `${mediaItem.isSharedWithPartner ? 'Partagé avec votre partenaire\n' : ''}` +
               `${mediaItem.albumId ? 'Dans un album\n' : ''}` +
               `${mediaItem.isFavorite ? '⭐ Favori' : ''}`,
      type: 'info',
      buttons: [
        {
          text: '✏️ Renommer',
          style: 'default',
          onPress: () => {
            setRenameTarget({
              type: 'media',
              id: mediaId,
              currentName: mediaItem.title || ''
            });
            setIsRenameModalVisible(true);
          }
        },
        { text: 'OK', style: 'cancel' }
      ]
    });
  };

  const handleConfirmRename = async (newName: string) => {
    if (!renameTarget) return;

    try {
      if (renameTarget.type === 'media') {
        await updateMedia(renameTarget.id, { title: newName });
        showAlert({
          title: 'Succès',
          message: 'Média renommé avec succès',
          type: 'success',
        });
      } else if (renameTarget.type === 'album') {
        await updateAlbum(renameTarget.id, { title: newName });
        showAlert({
          title: 'Succès',
          message: 'Album renommé avec succès',
          type: 'success',
        });
      }
      setIsRenameModalVisible(false);
      setRenameTarget(null);
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error?.message || 'Impossible de renommer',
        type: 'error',
      });
    }
  };

  const renderAlbumItem = ({ item: album }: { item: any }) => {
    // Calculate actual media count
    const albumMediaItems = media.filter(m => m.albumId === album.id && !m.isArchived);
    const mediaCount = albumMediaItems.length;
    const thumbnail = albumMediaItems[0]; // Use first media as thumbnail

    return (
      <TouchableOpacity
        style={styles.albumItem}
        onPress={() => handleAlbumPress(album)}
        onLongPress={() => handleAlbumLongPress(album)}
      >
        <View style={styles.albumCover}>
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail.thumbnailUrl || thumbnail.uri }}
              style={styles.albumThumbnail}
              resizeMode="cover"
            />
          ) : (
            <Foundation name="photo" size={40} color={currentTheme.text.tertiary} />
          )}
          <View style={styles.albumOverlay}>
            <Text style={styles.albumCountBadge}>{mediaCount}</Text>
          </View>
        </View>
        <Text style={styles.albumTitle}>{album.title}</Text>
        <Text style={styles.albumCount}>{mediaCount} élément{mediaCount !== 1 ? 's' : ''}</Text>
      </TouchableOpacity>
    );
  };

  const handleAlbumPress = (album: any) => {
    navigation.navigate('albumDetails', {
      albumId: album.id,
      albumTitle: album.title,
    });
  };

  const handleAlbumLongPress = (album: any) => {
    // Show album actions modal (using CustomAlert as options menu)
    const albumMedia = media.filter(m => m.albumId === album.id && !m.isArchived);
    const allShared = albumMedia.every(m => m.isSharedWithPartner);

    // Create action options
    const shareAction = async () => {
      if (albumMedia.length === 0) {
        showAlert({
          title: 'Album vide',
          message: 'Cet album ne contient aucun média à partager.',
          type: 'info',
        });
        return;
      }

      showAlert({
        title: allShared ? 'Arrêter le partage' : 'Partager l\'album',
        message: allShared
          ? `Arrêter de partager ${albumMedia.length} média(s) ?`
          : `Partager ${albumMedia.length} média(s) avec votre partenaire ?`,
        type: 'info',
        buttons: [
          { text: 'Annuler', style: 'cancel' },
          {
            text: allShared ? 'Arrêter' : 'Partager',
            style: 'default',
            onPress: async () => {
              try {
                // Show progress bar
                setUploadProgress({
                  visible: true,
                  progress: 0,
                  currentFile: 0,
                  totalFiles: albumMedia.length,
                  isUploading: !allShared,
                });

                for (let i = 0; i < albumMedia.length; i++) {
                  const mediaItem = albumMedia[i];

                  // Update current file
                  setUploadProgress(prev => ({
                    ...prev,
                    currentFile: i + 1,
                    progress: ((i + 1) / albumMedia.length) * 100,
                  }));

                  if (allShared) {
                    await unshareMedia(mediaItem.id);
                  } else {
                    await shareMediaWithPartner(mediaItem.id);
                  }
                }

                // Hide progress bar
                setUploadProgress({
                  visible: false,
                  progress: 0,
                  currentFile: 0,
                  totalFiles: 0,
                  isUploading: true,
                });

                showAlert({
                  title: 'Succès',
                  message: allShared
                    ? `Partage arrêté pour ${albumMedia.length} média(s)`
                    : `${albumMedia.length} média(s) partagé(s)`,
                  type: 'success',
                });
              } catch (error: any) {
                // Hide progress bar on error
                setUploadProgress({
                  visible: false,
                  progress: 0,
                  currentFile: 0,
                  totalFiles: 0,
                  isUploading: true,
                });

                showAlert({
                  title: 'Erreur',
                  message: error?.message || 'Impossible de modifier le partage',
                  type: 'error',
                });
              }
            }
          },
        ],
      });
    };

    const moveToTrashAction = async () => {
      if (albumMedia.length === 0) {
        showAlert({
          title: 'Album vide',
          message: 'Cet album ne contient aucun média.',
          type: 'info',
        });
        return;
      }

      showAlert({
        title: 'Déplacer vers la corbeille',
        message: `Déplacer ${albumMedia.length} média(s) de l'album "${album.title}" vers la corbeille ?`,
        type: 'warning',
        buttons: [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Déplacer',
            style: 'destructive',
            onPress: async () => {
              try {
                for (const mediaItem of albumMedia) {
                  await updateMedia(mediaItem.id, { isArchived: true });
                }
                showAlert({
                  title: 'Succès',
                  message: `${albumMedia.length} média(s) déplacé(s) vers la corbeille`,
                  type: 'success',
                });
              } catch (error: any) {
                showAlert({
                  title: 'Erreur',
                  message: error?.message || 'Impossible de déplacer les médias',
                  type: 'error',
                });
              }
            }
          },
        ],
      });
    };

    const deleteAlbumAction = async () => {
      showAlert({
        title: 'Supprimer l\'album',
        message: `Voulez-vous supprimer l'album "${album.title}" ? Les médias seront conservés mais ne seront plus dans cet album.`,
        type: 'warning',
        buttons: [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                // Remove album from all media first
                for (const mediaItem of albumMedia) {
                  await updateMedia(mediaItem.id, { albumId: undefined });
                }
                // Then delete the album
                await updateAlbum(album.id, { isArchived: true });
                showAlert({
                  title: 'Succès',
                  message: 'Album supprimé',
                  type: 'success',
                });
              } catch (error: any) {
                showAlert({
                  title: 'Erreur',
                  message: error?.message || 'Impossible de supprimer l\'album',
                  type: 'error',
                });
              }
            }
          },
        ],
      });
    };

    const renameAlbumAction = () => {
      setRenameTarget({
        type: 'album',
        id: album.id,
        currentName: album.title
      });
      setIsRenameModalVisible(true);
    };

    // Show main options
    showAlert({
      title: `Album: ${album.title}`,
      message: 'Choisissez une action',
      type: 'info',
      buttons: [
        {
          text: '✏️ Changer le nom',
          style: 'default',
          onPress: renameAlbumAction
        },
        {
          text: allShared ? 'Arrêter le partage 🤷‍♂️' : 'Partager avec Bae🤍',
          style: 'default',
          onPress: shareAction
        },
        {
          text: 'Lage l nan poubèl 🗑️',
          style: 'default',
          onPress: moveToTrashAction
        },
        {
          text: 'Supprimer l\'album ❌',
          style: 'destructive',
          onPress: deleteAlbumAction
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Foundation name="photo" size={60} color={currentTheme.text.tertiary} />
      <Text style={styles.emptyTitle}>
        {selectedTab === 'media'
          ? showSharedMedia
            ? 'Aucun média partagé'
            : 'Aucun média'
          : selectedTab === 'albums'
          ? 'Aucun album'
          : 'Aucun souvenir'
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedTab === 'media'
          ? showSharedMedia
            ? 'Les médias partagés avec votre partenaire apparaîtront ici'
            : 'Commencez à ajouter vos photos et vidéos'
          : selectedTab === 'albums'
          ? 'Créez des albums pour organiser vos médias'
          : 'Créez des souvenirs pour marquer vos moments spéciaux'
        }
      </Text>
      {selectedTab === 'media' && !showSharedMedia && (
        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadMedia}>
          <Text style={styles.uploadButtonText}>Ajouter des médias</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStatsBar = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalMedia}</Text>
          <Text style={styles.statLabel}>Médias</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.albumsCount}</Text>
          <Text style={styles.statLabel}>Albums</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.sharedMedia}</Text>
          <Text style={styles.statLabel}>Partagés</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{Math.round(stats.storageUsed / (1024 * 1024))}MB</Text>
          <Text style={styles.statLabel}>Stockage</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Animated Header Container */}
          <Animated.View
            style={[
              styles.headerContainer,
              { transform: [{ translateY: headerTranslateY }] },
            ]}
          >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Galerie</Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionButton, showOptions && styles.actionButtonActive]}
                onPress={() => setShowOptions(!showOptions)}
              >
                <Foundation
                  name={showOptions ? 'arrow-up' : 'arrow-down'}
                  size={20}
                  color={showOptions ? currentTheme.romantic.primary : currentTheme.text.primary}
                />
              </TouchableOpacity>

              {selectedTab === 'media' && (
                <TouchableOpacity style={styles.actionButton} onPress={toggleViewMode}>
                  <Foundation
                    name={viewMode.layout === 'grid' ? 'list' : 'thumbnails'}
                    size={20}
                    color={currentTheme.text.primary}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.actionButton} onPress={handleUploadMedia}>
                <Foundation name="plus" size={20} color={currentTheme.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Upload/Download Progress Bar */}
          <UploadProgressBar
            visible={uploadProgress.visible}
            progress={uploadProgress.progress}
            currentFile={uploadProgress.currentFile}
            totalFiles={uploadProgress.totalFiles}
            isUploading={uploadProgress.isUploading}
            theme={currentTheme}
          />

          {/* Collapsible Options Section */}
          <Animated.View
            style={{
              maxHeight: optionsHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500], // Adjust based on content
              }),
              opacity: optionsHeight,
              overflow: 'hidden',
            }}
          >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Foundation name="magnifying-glass" size={18} color={currentTheme.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher dans votre galerie..."
                placeholderTextColor={currentTheme.text.tertiary}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Foundation name="x" size={18} color={currentTheme.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'media' && styles.activeTab]}
              onPress={() => setSelectedTab('media')}
            >
              <Text style={[styles.tabText, selectedTab === 'media' && styles.activeTabText]}>
                Médias
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === 'albums' && styles.activeTab]}
              onPress={() => setSelectedTab('albums')}
            >
              <Text style={[styles.tabText, selectedTab === 'albums' && styles.activeTabText]}>
                Albums
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === 'memories' && styles.activeTab]}
              onPress={() => setSelectedTab('memories')}
            >
              <Text style={[styles.tabText, selectedTab === 'memories' && styles.activeTabText]}>
                Souvenirs
              </Text>
            </TouchableOpacity>
          </View>

          {/* Media Tab - Sub Tabs */}
          {selectedTab === 'media' && (
            <View style={styles.subTabSwitcher}>
              <TouchableOpacity
                style={[styles.subTab, filter.type === 'all' && !showSharedMedia && !filter.isArchived && styles.activeSubTab]}
                onPress={() => {
                  setShowSharedMedia(false);
                  setFilter({ ...filter, type: 'all', isArchived: false });
                }}
              >
                <Text style={[styles.subTabText, filter.type === 'all' && !showSharedMedia && !filter.isArchived && styles.activeSubTabText]}>
                  Tous ({filteredMedia.filter(m => !m.isArchived).length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTab, filter.type === 'favorites' && styles.activeSubTab]}
                onPress={() => {
                  setShowSharedMedia(false);
                  setFilter({ ...filter, type: 'favorites', isArchived: false });
                }}
              >
                <Text style={[styles.subTabText, filter.type === 'favorites' && styles.activeSubTabText]}>
                  ⭐ Favoris ({filteredMedia.filter(m => m.isFavorite && !m.isArchived).length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTab, showSharedMedia && styles.activeSubTab]}
                onPress={() => {
                  setShowSharedMedia(true);
                  setFilter({ ...filter, isArchived: false });
                }}
              >
                <Text style={[styles.subTabText, showSharedMedia && styles.activeSubTabText]}>
                  ☁️ Partagés ({sharedMedia.filter(m => !m.isArchived).length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTab, filter.isArchived && styles.activeSubTab]}
                onPress={() => {
                  setShowSharedMedia(false);
                  setFilter({ ...filter, type: 'all', isArchived: true });
                }}
              >
                <Text style={[styles.subTabText, filter.isArchived && styles.activeSubTabText]}>
                  🗑️ Corbeille ({filteredMedia.filter(m => m.isArchived).length})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Stats Bar */}
          {renderStatsBar()}
          </Animated.View>
          {/* End of Collapsible Options */}

          </Animated.View>
          {/* End of Header Container */}

          {/* Content */}
          {selectedTab === 'media' ? (
            displayMedia.length === 0 ? (
              renderEmptyState()
            ) : (
              <FlatList
                data={displayMedia}
                renderItem={renderMediaItem}
                keyExtractor={(item) => item.id}
                numColumns={viewMode.layout === 'grid' ? 3 : 1}
                key={viewMode.layout}
                contentContainerStyle={styles.mediaList}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                  <RefreshControl
                    refreshing={isAppRefreshing}
                    onRefresh={refreshAppData}
                    tintColor={currentTheme.text.primary}
                    colors={[currentTheme.text.primary]}
                  />
                }
              />
            )
          ) : selectedTab === 'albums' ? (
            albums.length === 0 ? (
              renderEmptyState()
            ) : (
              <FlatList
                data={albums}
                renderItem={renderAlbumItem}
                keyExtractor={(item) => item.id}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                  <RefreshControl
                    refreshing={isAppRefreshing}
                    onRefresh={refreshAppData}
                    tintColor={currentTheme.text.primary}
                    colors={[currentTheme.text.primary]}
                  />
                }
                numColumns={2}
                contentContainerStyle={styles.albumsList}
                showsVerticalScrollIndicator={false}
              />
            )
          ) : (
            renderEmptyState()
          )}
        </View>
      </ImageBackground>

      <MediaActionsModal
        visible={isActionsModalVisible}
        onClose={handleCloseActionsModal}
        media={selectedMedia}
        theme={currentTheme}
        hasPartner={!!user?.partnerId}
        onEdit={handleEditMedia}
        onShare={handleShareMedia}
        onUnshare={handleUnshareMedia}
        onFavorite={handleFavoriteMedia}
        onUnfavorite={handleUnfavoriteMedia}
        onAddToAlbum={handleAddToAlbum}
        onRemoveFromAlbum={handleRemoveFromAlbum}
        onMoveToTrash={handleMoveToTrash}
        onRestore={handleRestoreMedia}
        onDelete={handleDeleteMedia}
        onDownload={handleDownload}
        onViewDetails={handleViewDetails}
      />

      <MediaViewerScreen
        visible={isViewerVisible}
        mediaList={displayMedia}
        initialIndex={viewerInitialIndex}
        onClose={() => setIsViewerVisible(false)}
        onShare={handleShareMedia}
        onFavorite={(mediaId) => {
          const media = displayMedia.find(m => m.id === mediaId);
          if (media?.isFavorite) {
            handleUnfavoriteMedia(mediaId);
          } else {
            handleFavoriteMedia(mediaId);
          }
        }}
        onDelete={(mediaId) => {
          setIsViewerVisible(false);
          handleDeleteMedia(mediaId);
        }}
      />

      <MediaEditorScreen
        visible={isEditorVisible}
        media={selectedMedia}
        onClose={() => {
          setIsEditorVisible(false);
          setSelectedMedia(null);
        }}
        onSave={async (editedMedia) => {
          try {
            await updateMedia(editedMedia.id, editedMedia);
            setIsEditorVisible(false);
            setSelectedMedia(null);
          } catch (error) {
            showAlert({
              title: 'Erreur',
              message: 'Impossible de sauvegarder les modifications',
              type: 'error',
            });
          }
        }}
      />

      <AlbumSelectionModal
        visible={isAlbumSelectionVisible}
        onClose={() => {
          setIsAlbumSelectionVisible(false);
          setMediaToAddToAlbum(null);
        }}
        albums={albums.filter(a => !a.isArchived)}
        onSelectAlbum={async (albumId) => {
          if (mediaToAddToAlbum) {
            try {
              await addMediaToAlbum(mediaToAddToAlbum, albumId);
              showAlert({
                title: 'Succès',
                message: 'Média ajouté à l\'album',
                type: 'success',
              });
              setIsAlbumSelectionVisible(false);
              setMediaToAddToAlbum(null);
            } catch (error) {
              showAlert({
                title: 'Erreur',
                message: 'Impossible d\'ajouter le média à l\'album',
                type: 'error',
              });
            }
          }
        }}
        onCreateNewAlbum={async (albumName, albumDescription) => {
          try {
            const albumId = await createAlbum({
              title: albumName,
              description: albumDescription,
              isSharedWithPartner: false,
              visibility: 'private',
              tags: [],
              isFavorite: false,
              isArchived: false,
            });

            // Add the media to the newly created album
            if (mediaToAddToAlbum) {
              await addMediaToAlbum(mediaToAddToAlbum, albumId);
            }

            showAlert({
              title: 'Succès',
              message: 'Album créé et média ajouté',
              type: 'success',
            });
            setIsAlbumSelectionVisible(false);
            setMediaToAddToAlbum(null);
          } catch (error) {
            showAlert({
              title: 'Erreur',
              message: 'Impossible de créer l\'album',
              type: 'error',
            });
          }
        }}
        theme={currentTheme}
      />

      {alertConfig && (
        <CustomAlert
          visible={isAlertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
          theme={currentTheme}
          type={alertConfig.type}
        />
      )}

      <TextInputModal
        visible={isRenameModalVisible}
        title={renameTarget?.type === 'album' ? 'Renommer l\'album' : 'Renommer le média'}
        message={`Entrez un nouveau nom pour ${renameTarget?.type === 'album' ? 'cet album' : 'ce média'}`}
        placeholder="Nouveau nom..."
        initialValue={renameTarget?.currentName || ''}
        onConfirm={handleConfirmRename}
        onCancel={() => {
          setIsRenameModalVisible(false);
          setRenameTarget(null);
        }}
        theme={currentTheme}
      />

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
    backgroundColor: theme.background.primary,
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.background.overlay,
  },
  headerContainer: {
    backgroundColor: theme.background.overlay,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: theme.text.primary,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.interactive.active,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  actionButtonActive: {
    backgroundColor: theme.romantic.primary + '33', // 20% opacity
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background.card,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.border.secondary,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.text.primary,
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.background.card,
    ...theme.shadows.card,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text.tertiary,
  },
  activeTabText: {
    color: theme.text.primary,
  },
  subTabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: theme.background.secondary,
    borderRadius: 8,
    padding: 2,
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeSubTab: {
    backgroundColor: theme.background.card,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.text.tertiary,
  },
  activeSubTabText: {
    color: theme.text.primary,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.background.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 15,
    ...theme.shadows.card,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.text.secondary,
    marginTop: 2,
  },
  mediaList: {
    padding: 20,
    paddingBottom: 100,
  },
  mediaItem: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: theme.background.card,
    ...theme.shadows.card,
  },
  favoriteMediaItem: {
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storageIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  localIndicator: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)', // Green for local
  },
  cloudIndicator: {
    backgroundColor: 'rgba(33, 150, 243, 0.8)', // Blue for cloud
  },
  sharedIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.romantic.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  commentCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mediaDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  mediaDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  albumsList: {
    padding: 20,
    paddingBottom: 100,
  },
  albumItem: {
    flex: 1,
    backgroundColor: theme.background.card,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    marginBottom: 15,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  albumCover: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: theme.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  albumThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  albumOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  albumCountBadge: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  albumCount: {
    fontSize: 12,
    color: theme.text.secondary,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text.primary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  uploadButton: {
    backgroundColor: theme.romantic.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    ...theme.shadows.button,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default GalleryScreen;