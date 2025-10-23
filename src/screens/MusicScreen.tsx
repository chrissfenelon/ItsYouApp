import React, { useState, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import { useMusic } from '../context/MusicCon';
import { getBackgroundSource } from '../utils/backgroundUtils';
import { Song } from '../types/music';
import VinylDisc from '../components/music/VinylDisc';
import SongItem from '../components/music/SongItem';
import NowPlayingScreen from '../components/music/NowPlayingScreen';
import MusicActionsModal from '../components/music/MusicActionsModal';
import VinylCustomizationModal from '../components/music/VinylCustomizationModal';
import BackgroundEffects from '../components/music/BackgroundEffects';
import CustomAlert from '../components/common/CustomAlert';
import useCustomAlert from '../hooks/useCustomAlert';
import TextInputModal from '../components/common/TextInputModal';
import { useRefresh } from '../hooks/useRefresh';
import MusicService from '../services/MusicService';

const { width } = Dimensions.get('window');

const MusicScreen: React.FC = () => {
  const { currentTheme, user } = useApp();
  const {
    songs,
    vinylDisc,
    playerState,
    filter,
    stats,
    playSong,
    playQueue,
    importSongFromDevice,
    importMultipleSongsFromDevice,
    shareSongWithPartner,
    unshareSong,
    deleteSong,
    updateSong,
    addSongToPlaylist,
    createPlaylist,
    updateVinylPhoto,
    updateVinylColor,
    updateVinylEffects,
    resetVinylToDefault,
    setFilter,
    searchSongs,
    clearSearch,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    toggleShuffle,
    setRepeatMode,
    refreshMusic,
  } = useMusic();

  const { alertConfig, isVisible: isAlertVisible, showAlert, hideAlert } = useCustomAlert();

  // Pull-to-Refresh
  const { refreshing, onRefresh } = useRefresh({
    onRefresh: async () => {
      await refreshMusic();
    },
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'embedded' | 'uploaded' | 'shared'>('all');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);
  const [isSongsListVisible, setIsSongsListVisible] = useState(false);
  const [isCustomizationVisible, setIsCustomizationVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; currentName: string } | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<Record<string, boolean>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const styles = createStyles(currentTheme);

  // Check offline availability for all songs on mount
  useEffect(() => {
    const checkAllOfflineStatus = async () => {
      const statusMap: Record<string, boolean> = {};
      for (const song of songs) {
        const isAvailable = await MusicService.isAvailableOffline(song.id);
        statusMap[song.id] = isAvailable;
      }
      setOfflineStatus(statusMap);
    };
    checkAllOfflineStatus();
  }, [songs]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchSongs(query);
    } else {
      clearSearch();
    }
  };

  const handleSongPress = (song: Song) => {
    const filteredSongs = getFilteredSongs();
    const songIndex = filteredSongs.findIndex(s => s.id === song.id);
    playQueue(filteredSongs, songIndex);
  };

  const handleSongLongPress = (song: Song) => {
    setSelectedSong(song);
    setIsActionsModalVisible(true);
  };

  const handleVinylPress = () => {
    // Vinyl just for visual, controls are on main screen
  };

  const handleVinylLongPress = () => {
    setIsCustomizationVisible(true);
  };

  const handleAddToPlaylist = async (songId: string) => {
    // TODO: Show playlist selection modal
    showAlert({
      title: 'Fonctionnalité à venir',
      message: 'La gestion des playlists sera disponible bientôt !',
      type: 'info',
    });
  };

  const handleShare = async (songId: string) => {
    try {
      await shareSongWithPartner(songId);
      showAlert({
        title: 'Succès',
        message: 'Chanson partagée avec votre partenaire',
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de partager la chanson',
        type: 'error',
      });
    }
  };

  const handleUnshare = async (songId: string) => {
    try {
      await unshareSong(songId);
      showAlert({
        title: 'Succès',
        message: 'Partage arrêté',
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible d\'arrêter le partage',
        type: 'error',
      });
    }
  };

  const handleRename = (songId: string) => {
    const song = songs.find(s => s.id === songId);
    if (song) {
      setRenameTarget({ id: songId, currentName: song.title });
      setIsRenameModalVisible(true);
    }
  };

  const handleImportSong = async () => {
    try {
      await importSongFromDevice();
      showAlert({
        title: 'Succès',
        message: 'Chanson importée avec succès',
        type: 'success',
      });
    } catch (error) {
      if (error instanceof Error && error.message !== 'User not authenticated') {
        showAlert({
          title: 'Erreur',
          message: 'Impossible d\'importer la chanson',
          type: 'error',
        });
      }
    }
  };

  const handleImportMultipleSongs = async () => {
    try {
      await importMultipleSongsFromDevice();
      showAlert({
        title: 'Succès',
        message: 'Chansons importées avec succès',
        type: 'success',
      });
    } catch (error) {
      if (error instanceof Error && error.message !== 'User not authenticated') {
        showAlert({
          title: 'Erreur',
          message: 'Impossible d\'importer les chansons',
          type: 'error',
        });
      }
    }
  };

  const handleConfirmRename = async (newName: string) => {
    if (!renameTarget) return;
    try {
      await updateSong(renameTarget.id, { title: newName });
      showAlert({
        title: 'Succès',
        message: 'Chanson renommée avec succès',
        type: 'success',
      });
      setIsRenameModalVisible(false);
      setRenameTarget(null);
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de renommer la chanson',
        type: 'error',
      });
    }
  };

  const handleDelete = async (songId: string) => {
    try {
      await deleteSong(songId);
      showAlert({
        title: 'Succès',
        message: 'Chanson supprimée',
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de supprimer la chanson',
        type: 'error',
      });
    }
  };

  const handleViewDetails = (songId: string) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    showAlert({
      title: song.title,
      message: `Artiste: ${song.artist}\n${song.album ? `Album: ${song.album}\n` : ''}Durée: ${formatDuration(song.duration)}\n${song.isEmbedded ? 'Chanson intégrée\n' : ''}${song.isSharedWithPartner ? 'Partagé avec votre partenaire' : ''}`,
      type: 'info',
    });
  };

  const handleMakeOffline = async (songId: string) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    // Add to downloading set
    setDownloadingIds(prev => new Set(prev).add(songId));
    setDownloadProgress(prev => ({ ...prev, [songId]: 0 }));

    // Close modal to allow user to continue using app
    setIsActionsModalVisible(false);
    setSelectedSong(null);

    try {
      await MusicService.downloadSongForOffline(song, (progress) => {
        setDownloadProgress(prev => ({ ...prev, [songId]: progress }));
        console.log(`📥 Download progress for ${song.title}: ${Math.round(progress)}%`);
      });

      // Download complete
      setOfflineStatus(prev => ({ ...prev, [songId]: true }));
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(songId);
        return newSet;
      });
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[songId];
        return newProgress;
      });

      showAlert({
        title: 'Succès',
        message: `"${song.title}" disponible hors ligne`,
        type: 'success',
      });
    } catch (error) {
      console.error('❌ Error making song offline:', error);

      // Remove from downloading set on error
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(songId);
        return newSet;
      });
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[songId];
        return newProgress;
      });

      showAlert({
        title: 'Erreur',
        message: `Impossible de télécharger "${song.title}"`,
        type: 'error',
      });
    }
  };

  const handleRemoveOffline = async (songId: string) => {
    try {
      await MusicService.deleteOfflineSong(songId);
      setOfflineStatus(prev => ({ ...prev, [songId]: false }));

      showAlert({
        title: 'Succès',
        message: 'Chanson supprimée du mode hors ligne',
        type: 'success',
      });
    } catch (error) {
      console.error('❌ Error removing offline song:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de supprimer la chanson hors ligne',
        type: 'error',
      });
    }
  };

  const getFilteredSongs = (): Song[] => {
    let filtered = songs;

    // Filter by tab
    if (selectedTab === 'shared') {
      filtered = filtered.filter(s => s.isSharedWithPartner);
    } else if (selectedTab === 'embedded') {
      filtered = filtered.filter(s => s.isEmbedded);
    } else if (selectedTab === 'uploaded') {
      filtered = filtered.filter(s => !s.isEmbedded);
    } else if (selectedTab === 'all') {
      // Show all songs
    }

    // Filter by search
    if (filter.searchQuery) {
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(filter.searchQuery!.toLowerCase()) ||
        s.artist.toLowerCase().includes(filter.searchQuery!.toLowerCase()) ||
        (s.album && s.album.toLowerCase().includes(filter.searchQuery!.toLowerCase()))
      );
    }

    return filtered;
  };

  const displaySongs = getFilteredSongs();
  const embeddedSongs = songs.filter(s => s.isEmbedded);
  const uploadedSongs = songs.filter(s => !s.isEmbedded);

  const renderSongItem = ({ item }: { item: Song }) => (
    <SongItem
      song={item}
      isPlaying={playerState.currentSong?.id === item.id}
      onPress={() => handleSongPress(item)}
      onLongPress={() => handleSongLongPress(item)}
      theme={currentTheme}
      isOfflineAvailable={offlineStatus[item.id] || false}
      downloadProgress={downloadProgress[item.id] || 0}
      isDownloading={downloadingIds.has(item.id)}
    />
  );

  const handleRepeatToggle = () => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(playerState.repeat);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const getRepeatIcon = () => {
    if (playerState.repeat === 'one') return 'loop';
    return 'refresh';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Background Effects - Full screen, non-interactive */}
        <BackgroundEffects
          activeEffects={vinylDisc?.activeEffects || []}
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Musique</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsCustomizationVisible(true)}
            >
              <Foundation name="burst" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsSongsListVisible(!isSongsListVisible)}
            >
              <Foundation name="list" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vinyl Disc Section */}
        <View
          style={styles.vinylSection}
          pointerEvents={isSongsListVisible ? 'none' : 'auto'}
        >
          <VinylDisc
            size={width * 0.75}
            isPlaying={playerState.isPlaying}
            vinylDisc={vinylDisc}
            albumArt={playerState.currentSong?.thumbnailUrl}
            onPress={handleVinylPress}
            onLongPress={handleVinylLongPress}
          />

          {playerState.currentSong && (
            <View style={styles.nowPlayingInfo}>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                {playerState.currentSong.title}
              </Text>
              <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                {playerState.currentSong.artist}
              </Text>
            </View>
          )}
          {!playerState.currentSong && (
            <View style={styles.nowPlayingInfo}>
              <Text style={styles.nowPlayingPlaceholder}>
                Aucune chanson sélectionnée
              </Text>
            </View>
          )}
        </View>

        {/* Player Controls */}
        <View
          style={styles.controlsSection}
          pointerEvents={isSongsListVisible ? 'none' : 'auto'}
        >
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Text style={styles.progressTimeText}>
              {formatTime(playerState.position)}
            </Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={playerState.duration || 1}
                value={playerState.position}
                onSlidingComplete={seekTo}
                minimumTrackTintColor={currentTheme.romantic?.primary || '#FF69B4'}
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor={currentTheme.romantic?.primary || '#FF69B4'}
              />
              <View style={[styles.sliderGlow, {
                shadowColor: currentTheme.romantic?.primary || '#FF69B4',
                width: `${(playerState.position / (playerState.duration || 1)) * 100}%`,
              }]} />
            </View>
            <Text style={styles.progressTimeText}>
              {formatTime(playerState.duration)}
            </Text>
          </View>

          {/* Main Controls */}
          <View style={styles.mainControls}>
            <TouchableOpacity
              onPress={skipToPrevious}
              style={styles.controlButton}
            >
              <Foundation
                name="previous"
                size={36}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPause}
              style={styles.playButton}
              disabled={!playerState.currentSong}
            >
              <Foundation
                name={playerState.isPlaying ? 'pause' : 'play'}
                size={48}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={skipToNext}
              style={styles.controlButton}
            >
              <Foundation
                name="next"
                size={36}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Secondary Controls - Positioned closer to play button */}
          <View style={styles.secondaryControls}>
            <TouchableOpacity
              onPress={toggleShuffle}
              style={styles.secondaryButton}
            >
              <Foundation
                name="shuffle"
                size={24}
                color={playerState.shuffle ? currentTheme.romantic?.primary || '#FF69B4' : 'rgba(255, 255, 255, 0.5)'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRepeatToggle}
              style={styles.secondaryButton}
            >
              <Foundation
                name={getRepeatIcon()}
                size={24}
                color={playerState.repeat !== 'off' ? currentTheme.romantic?.primary || '#FF69B4' : 'rgba(255, 255, 255, 0.5)'}
              />
              {playerState.repeat === 'one' && (
                <View style={styles.repeatOneBadge}>
                  <Text style={styles.repeatOneText}>1</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Songs List Modal */}
        {isSongsListVisible && (
          <View style={styles.songsListOverlay}>
            <View style={styles.songsListContainer}>
              {/* Header with Back Button */}
              <View style={styles.songsListHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setIsSongsListVisible(false)}
                >
                  <Foundation name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.songsListTitle}>Bibliothèque</Text>
                <View style={styles.headerSpacer} />
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Foundation name="magnifying-glass" size={20} color="rgba(255, 255, 255, 0.6)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher des chansons..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => handleSearch('')}>
                    <Foundation name="x" size={18} color="rgba(255, 255, 255, 0.6)" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
                  onPress={() => setSelectedTab('all')}
                >
                  <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
                    Toutes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, selectedTab === 'embedded' && styles.activeTab]}
                  onPress={() => setSelectedTab('embedded')}
                >
                  <Text style={[styles.tabText, selectedTab === 'embedded' && styles.activeTabText]}>
                    Intégrées
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, selectedTab === 'uploaded' && styles.activeTab]}
                  onPress={() => setSelectedTab('uploaded')}
                >
                  <Text style={[styles.tabText, selectedTab === 'uploaded' && styles.activeTabText]}>
                    Téléversées
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, selectedTab === 'shared' && styles.activeTab]}
                  onPress={() => setSelectedTab('shared')}
                >
                  <Text style={[styles.tabText, selectedTab === 'shared' && styles.activeTabText]}>
                    Partagées
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.songsListContent}>
                {selectedTab === 'all' && (
                  <FlatList
                    data={displaySongs}
                    renderItem={renderSongItem}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                      <View style={styles.emptyState}>
                        <Foundation name="music" size={64} color="rgba(255, 255, 255, 0.3)" />
                        <Text style={styles.emptyText}>Aucune chanson disponible</Text>
                        <Text style={styles.emptySubtext}>
                          Importez vos chansons depuis votre appareil
                        </Text>
                        <View style={styles.importButtonsContainer}>
                          <TouchableOpacity
                            style={styles.importButton}
                            onPress={handleImportSong}
                          >
                            <Foundation name="upload" size={20} color="#FFFFFF" />
                            <Text style={styles.importButtonText}>Importer une chanson</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.importButton, styles.importMultipleButton]}
                            onPress={handleImportMultipleSongs}
                          >
                            <Foundation name="upload" size={20} color="#FFFFFF" />
                            <Text style={styles.importButtonText}>Importer plusieurs</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    }
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={currentTheme.romantic.primary}
                        colors={[currentTheme.romantic.primary]}
                      />
                    }
                    showsVerticalScrollIndicator={true}
                  />
                )}

                {selectedTab === 'embedded' && (
                  <FlatList
                    data={displaySongs}
                    renderItem={renderSongItem}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                      <View style={styles.emptyState}>
                        <Foundation name="music" size={64} color="rgba(255, 255, 255, 0.3)" />
                        <Text style={styles.emptyText}>Aucune chanson intégrée</Text>
                      </View>
                    }
                    ListHeaderComponent={
                      embeddedSongs.length > 0 ? (
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>
                            {embeddedSongs.length} chanson{embeddedSongs.length > 1 ? 's' : ''} intégrée{embeddedSongs.length > 1 ? 's' : ''}
                          </Text>
                        </View>
                      ) : null
                    }
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={currentTheme.romantic.primary}
                        colors={[currentTheme.romantic.primary]}
                      />
                    }
                    showsVerticalScrollIndicator={true}
                  />
                )}

                {selectedTab === 'uploaded' && (
                  <FlatList
                    data={displaySongs}
                    renderItem={renderSongItem}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                      <View style={styles.emptyState}>
                        <Foundation name="upload-cloud" size={64} color="rgba(255, 255, 255, 0.3)" />
                        <Text style={styles.emptyText}>Aucune chanson téléversée</Text>
                        <Text style={styles.emptySubtext}>
                          Importez vos propres chansons depuis votre appareil
                        </Text>
                        <View style={styles.importButtonsContainer}>
                          <TouchableOpacity
                            style={styles.importButton}
                            onPress={handleImportSong}
                          >
                            <Foundation name="upload" size={20} color="#FFFFFF" />
                            <Text style={styles.importButtonText}>Importer une chanson</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.importButton, styles.importMultipleButton]}
                            onPress={handleImportMultipleSongs}
                          >
                            <Foundation name="upload" size={20} color="#FFFFFF" />
                            <Text style={styles.importButtonText}>Importer plusieurs</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    }
                    ListHeaderComponent={
                      uploadedSongs.length > 0 ? (
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>
                            {uploadedSongs.length} chanson{uploadedSongs.length > 1 ? 's' : ''} téléversée{uploadedSongs.length > 1 ? 's' : ''}
                          </Text>
                          <Text style={styles.sectionSubtitle}>
                            Stockées dans Firebase Storage
                          </Text>
                        </View>
                      ) : null
                    }
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={currentTheme.romantic.primary}
                        colors={[currentTheme.romantic.primary]}
                      />
                    }
                    showsVerticalScrollIndicator={true}
                  />
                )}

                {selectedTab === 'shared' && (
                  <FlatList
                    data={displaySongs}
                    renderItem={renderSongItem}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                      <View style={styles.emptyState}>
                        <Foundation name="heart" size={64} color="rgba(255, 255, 255, 0.3)" />
                        <Text style={styles.emptyText}>Aucune chanson partagée</Text>
                        <Text style={styles.emptySubtext}>
                          Partagez vos chansons préférées avec votre partenaire
                        </Text>
                      </View>
                    }
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={currentTheme.romantic.primary}
                        colors={[currentTheme.romantic.primary]}
                      />
                    }
                    showsVerticalScrollIndicator={true}
                  />
                )}
              </View>
            </View>
          </View>
        )}
      </ImageBackground>

      {/* Modals */}
      {selectedSong && (
        <MusicActionsModal
          visible={isActionsModalVisible}
          onClose={() => {
            setIsActionsModalVisible(false);
            setSelectedSong(null);
          }}
          song={selectedSong}
          theme={currentTheme}
          onPlay={(id) => {
            const song = songs.find(s => s.id === id);
            if (song) playSong(song);
          }}
          onAddToPlaylist={handleAddToPlaylist}
          onShare={handleShare}
          onUnshare={handleUnshare}
          onRename={handleRename}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
          onMakeOffline={handleMakeOffline}
          onRemoveOffline={handleRemoveOffline}
          isOfflineAvailable={offlineStatus[selectedSong.id] || false}
        />
      )}

      <VinylCustomizationModal
        visible={isCustomizationVisible}
        onClose={() => setIsCustomizationVisible(false)}
        vinylDisc={vinylDisc}
        onUpdatePhoto={updateVinylPhoto}
        onUpdateColor={updateVinylColor}
        onUpdateEffects={updateVinylEffects}
        onResetToDefault={resetVinylToDefault}
        theme={currentTheme}
      />

      <TextInputModal
        visible={isRenameModalVisible}
        title="Renommer la chanson"
        message="Entrez un nouveau nom pour cette chanson"
        placeholder="Nouveau nom..."
        initialValue={renameTarget?.currentName || ''}
        onConfirm={handleConfirmRename}
        onCancel={() => {
          setIsRenameModalVisible(false);
          setRenameTarget(null);
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
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    padding: 8,
  },
  vinylSection: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 0,
  },
  nowPlayingInfo: {
    marginTop: 8,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  nowPlayingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  nowPlayingArtist: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  nowPlayingPlaceholder: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlsSection: {
    paddingHorizontal: 24,
    paddingVertical: 4,
    marginTop: -16,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  progressTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    width: 40,
    textAlign: 'center',
  },
  sliderContainer: {
    flex: 1,
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderGlow: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
    bottom: 18,
    left: 0,
    pointerEvents: 'none',
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 12,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 80,
    marginTop: -32,
  },
  secondaryButton: {
    padding: 3,
    position: 'relative',
  },
  repeatOneBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.romantic?.primary || '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatOneText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  songsListOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  songsListContainer: {
    flex: 1,
    marginTop: 100,
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    overflow: 'hidden',
  },
  songsListContent: {
    flex: 1,
  },
  songsListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  songsListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: theme.romantic.primary + '40',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  importButtonsContainer: {
    flexDirection: 'column',
    gap: 16,
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 20,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
  },
  importMultipleButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default MusicScreen;
