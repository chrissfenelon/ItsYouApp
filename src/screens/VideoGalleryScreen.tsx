import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { launchImageLibrary } from 'react-native-image-picker';
import { useApp } from '../context/AppContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import VideoService from '../services/VideoService';
import { Video, VideoUploadProgress } from '../types/video.types';
import VideoThumbnail from '../components/video/VideoThumbnail';
import YouTubeStylePlayer from '../components/video/YouTubeStylePlayer';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

type FilterType = 'all' | 'mine' | 'partner';

const VideoGalleryScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const styles = createStyles(currentTheme);

  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [uploadProgress, setUploadProgress] = useState<VideoUploadProgress | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, videos]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const allVideos = await VideoService.getAllVideos();
      setVideos(allVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de charger les vidéos',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredVideos(videos);
    } else if (filter === 'mine') {
      setFilteredVideos(videos.filter(v => v.uploadedBy === user?.id));
    } else if (filter === 'partner') {
      setFilteredVideos(videos.filter(v => v.uploadedBy !== user?.id));
    }
  };

  const handleUploadVideo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        videoQuality: 'high',
        selectionLimit: 1,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        showAlert({
          title: 'Erreur',
          message: 'Impossible de charger la vidéo',
          type: 'error',
        });
        return;
      }

      // Show upload progress
      setUploadProgress({
        videoId: '',
        progress: 0,
        status: 'uploading',
      });

      // TODO: Generate thumbnail using native module or cloud function
      // For now, upload without thumbnail (will show placeholder)
      await VideoService.uploadVideo(
        asset.uri,
        {
          duration: asset.duration || 0,
          width: asset.width,
          height: asset.height,
          size: asset.fileSize,
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Upload complete
      setUploadProgress(null);

      showAlert({
        title: 'Succès',
        message: 'Vidéo téléchargée avec succès !',
        type: 'success',
      });

      // Reload videos
      await loadVideos();
    } catch (error) {
      console.error('Error uploading video:', error);
      setUploadProgress(null);

      showAlert({
        title: 'Erreur',
        message: 'Impossible de télécharger la vidéo',
        type: 'error',
      });
    }
  };

  const handleVideoPress = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleVideoLongPress = (video: Video) => {
    if (video.uploadedBy !== user?.id) return;

    Alert.alert(
      'Options',
      video.title || 'Vidéo sans titre',
      [
        {
          text: video.isSharedWithPartner ? 'Ne plus partager' : 'Partager avec partenaire',
          onPress: async () => {
            try {
              if (video.isSharedWithPartner) {
                await VideoService.unshareWithPartner(video.id);
              } else {
                await VideoService.shareWithPartner(video.id);
              }
              await loadVideos();
            } catch (error) {
              showAlert({
                title: 'Erreur',
                message: 'Impossible de modifier le partage',
                type: 'error',
              });
            }
          },
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => handleDeleteVideo(video),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDeleteVideo = async (video: Video) => {
    Alert.alert(
      'Supprimer la vidéo',
      'Êtes-vous sûr de vouloir supprimer cette vidéo ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await VideoService.deleteVideo(video.id, video.uri);
              await loadVideos();

              showAlert({
                title: 'Succès',
                message: 'Vidéo supprimée',
                type: 'success',
              });
            } catch (error) {
              showAlert({
                title: 'Erreur',
                message: 'Impossible de supprimer la vidéo',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            Toutes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'mine' && styles.filterButtonActive]}
          onPress={() => setFilter('mine')}
        >
          <Text style={[styles.filterButtonText, filter === 'mine' && styles.filterButtonTextActive]}>
            Mes vidéos
          </Text>
        </TouchableOpacity>

        {user?.partnerId && (
          <TouchableOpacity
            style={[styles.filterButton, filter === 'partner' && styles.filterButtonActive]}
            onPress={() => setFilter('partner')}
          >
            <Text style={[styles.filterButtonText, filter === 'partner' && styles.filterButtonTextActive]}>
              {user.partnerName || 'Partenaire'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Upload Progress */}
      {uploadProgress && (
        <View style={styles.uploadProgressContainer}>
          <View style={styles.uploadProgressInfo}>
            <Foundation name="upload-cloud" size={24} color={currentTheme.romantic.primary} />
            <Text style={styles.uploadProgressText}>
              {uploadProgress.status === 'uploading' && `Upload en cours... ${Math.round(uploadProgress.progress)}%`}
              {uploadProgress.status === 'processing' && 'Traitement...'}
              {uploadProgress.status === 'completed' && 'Upload terminé !'}
              {uploadProgress.status === 'error' && 'Erreur d\'upload'}
            </Text>
          </View>
          {uploadProgress.status === 'uploading' && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${uploadProgress.progress}%`,
                    backgroundColor: currentTheme.romantic.primary,
                  },
                ]}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Foundation name="play-video" size={80} color="rgba(255, 255, 255, 0.3)" />
      <Text style={styles.emptyTitle}>Aucune vidéo</Text>
      <Text style={styles.emptyText}>
        {filter === 'all' && 'Commencez par télécharger votre première vidéo !'}
        {filter === 'mine' && 'Vous n\'avez pas encore de vidéos'}
        {filter === 'partner' && 'Votre partenaire n\'a pas partagé de vidéos'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={currentTheme.romantic.primary} />
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigateToScreen('gallery')}
            >
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Vidéos</Text>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadVideo}
              disabled={uploadProgress !== null}
            >
              <Foundation name="upload-cloud" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading && filteredVideos.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.romantic.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredVideos}
              renderItem={({ item }) => (
                <VideoThumbnail
                  video={item}
                  onPress={() => handleVideoPress(item)}
                  onLongPress={() => handleVideoLongPress(item)}
                />
              )}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.columnWrapper}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={renderEmpty}
              ListFooterComponent={renderFooter}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={currentTheme.romantic.primary}
                  colors={[currentTheme.romantic.primary]}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ImageBackground>

      {/* Video Player Modal */}
      <YouTubeStylePlayer
        visible={selectedVideo !== null}
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
          onClose={hideAlert}
          theme={currentTheme}
        />
      )}
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
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.background.overlay,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.interactive.active,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  uploadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.interactive.active,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: theme.romantic.primary,
    borderColor: theme.romantic.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  uploadProgressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  uploadProgressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  uploadProgressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.text.secondary,
    marginTop: 16,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default VideoGalleryScreen;
