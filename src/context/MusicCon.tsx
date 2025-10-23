import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Song, Playlist, VinylDisc, PlayerState, MusicFilter, MusicStats, ParticleEffectType } from '../types/music';
import MusicPlayerService from '../services/NativeMusicPlayerService'; // ← CHANGÉ: Utilise le module natif avec contrôles lockscreen!
import { useApp } from './AppContext';

interface MusicContextType {
  songs: Song[];
  playlists: Playlist[];
  vinylDisc: VinylDisc | null;
  playerState: PlayerState;
  filter: MusicFilter;
  stats: MusicStats;
  isLoading: boolean;

  // Data refresh
  refreshMusic: () => Promise<void>;

  // Song operations
  getSongById: (id: string) => Song | undefined;
  importSongFromDevice: () => Promise<void>;
  importMultipleSongsFromDevice: () => Promise<void>;
  shareSongWithPartner: (songId: string) => Promise<void>;
  unshareSong: (songId: string) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
  updateSong: (songId: string, updates: Partial<Song>) => Promise<void>;

  // Playlist operations
  createPlaylist: (title: string, description?: string) => Promise<string>;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addSongToPlaylist: (songId: string, playlistId: string) => Promise<void>;
  removeSongFromPlaylist: (songId: string, playlistId: string) => Promise<void>;

  // Vinyl customization
  updateVinylPhoto: (photoUri: string) => Promise<void>;
  updateVinylColor: (color: VinylDisc['vinylColor']) => Promise<void>;
  updateVinylLabel: (labelText: string) => Promise<void>;
  updateVinylEffects: (effects: ParticleEffectType[]) => Promise<void>;
  resetVinylToDefault: () => Promise<void>;

  // Player controls
  playSong: (song: Song) => Promise<void>;
  playQueue: (songs: Song[], startIndex?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => Promise<void>;
  toggleShuffle: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;

  // Filters
  setFilter: (filter: MusicFilter) => void;
  searchSongs: (query: string) => void;
  clearSearch: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useApp();
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [vinylDisc, setVinylDisc] = useState<VinylDisc | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    queue: [],
    currentIndex: 0,
    shuffle: false,
    repeat: 'off',
    volume: 1,
  });
  const [filter, setFilter] = useState<MusicFilter>({ type: 'all' });
  const [isLoading, setIsLoading] = useState(true);

  // Save player state to AsyncStorage
  const savePlayerState = async (state: PlayerState) => {
    try {
      if (!user?.id) return;

      const stateToSave = {
        currentSongId: state.currentSong?.id,
        position: state.position,
        queueIds: state.queue.map(s => s.id),
        currentIndex: state.currentIndex,
        shuffle: state.shuffle,
        repeat: state.repeat,
        volume: state.volume,
      };

      await AsyncStorage.setItem(
        `@player_state_${user.id}`,
        JSON.stringify(stateToSave)
      );
      console.log('💾 Player state saved');
    } catch (error) {
      console.error('Failed to save player state:', error);
    }
  };

  // Load player state from AsyncStorage
  const loadPlayerState = async () => {
    try {
      if (!user?.id) return null;

      const saved = await AsyncStorage.getItem(`@player_state_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📂 Player state loaded:', parsed);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Failed to load player state:', error);
      return null;
    }
  };

  // Initialize TrackPlayer
  useEffect(() => {
    const initPlayer = async () => {
      try {
        await MusicPlayerService.setup();
        console.log('✅ TrackPlayer initialized');
      } catch (error) {
        console.error('❌ Failed to initialize TrackPlayer:', error);
      }
    };

    initPlayer();
  }, []);

  // Initialize player callbacks
  useEffect(() => {
    MusicPlayerService.setOnPlaybackStateChange((isPlaying) => {
      console.log('🎵 Playback state changed:', isPlaying);
      setPlayerState(prev => ({ ...prev, isPlaying }));
    });

    MusicPlayerService.setOnTrackChange((song) => {
      const newIndex = MusicPlayerService.getCurrentTrackIndex();
      setPlayerState(prev => ({
        ...prev,
        currentSong: song,
        currentIndex: typeof newIndex === 'number' ? newIndex : prev.currentIndex,
        position: 0, // Reset position when track changes
      }));
    });

    MusicPlayerService.setOnPositionChange((position, duration) => {
      setPlayerState(prev => ({ ...prev, position, duration }));
    });

    MusicPlayerService.setOnSongEnd(() => {
      console.log('🎵 Song ended - handling auto-advance');
      handleSongEnd();
    });

    return () => {
      MusicPlayerService.release();
    };
  }, []);

  // Handle song end logic
  const handleSongEnd = async () => {
    setPlayerState(prev => {
      const { shuffle, repeat, queue, currentIndex } = prev;

      // Repeat one is handled by TrackPlayer itself
      if (repeat === 'one') {
        return prev;
      }

      // Check if there's a next song
      let nextIndex = currentIndex + 1;

      // If shuffle is on, pick a random song
      if (shuffle && queue.length > 1) {
        const availableIndices = queue.map((_, idx) => idx).filter(idx => idx !== currentIndex);
        nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        console.log('🎵 Shuffle on - random next:', nextIndex);
      }

      // If we're at the end of queue
      if (nextIndex >= queue.length) {
        // Repeat all is handled by TrackPlayer itself
        if (repeat === 'all') {
          return prev;
        } else {
          // No repeat - reset to beginning position
          console.log('🎵 Queue ended - resetting to start');
          MusicPlayerService.seekTo(0);
          return { ...prev, position: 0 };
        }
      }

      // Play next song
      if (nextIndex < queue.length && shuffle) {
        console.log('🎵 Auto-advancing to next song:', queue[nextIndex]?.title);
        MusicPlayerService.skipToIndex(nextIndex);
      }

      return prev;
    });
  };

  // Load embedded songs
  const loadEmbeddedSongs = async () => {
    const { loadEmbeddedSongs: loadSongs } = await import('../data/embeddedSongs');
    return loadSongs();
  };

  // Load user songs from Firestore
  const loadUserSongs = async () => {
    if (!user?.id) return [];

    try {
      const snapshot = await firestore()
        .collection('songs')
        .where('userId', '==', user.id)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Song[];
    } catch (error) {
      console.error('Failed to load user songs:', error);
      return [];
    }
  };

  // Load music from admin panel (musicLibrary collection)
  const loadAdminMusic = async () => {
    try {
      const snapshot = await firestore()
        .collection('musicLibrary')
        .orderBy('uploadedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          artist: data.artist,
          uri: data.url,
          duration: data.duration || 0,
          albumArt: undefined,
          category: data.category,
          isEmbedded: false,
          isSharedWithPartner: true,
          userId: 'admin',
          createdAt: data.uploadedAt?.toDate() || new Date(),
          updatedAt: data.uploadedAt?.toDate() || new Date(),
        } as Song;
      });
    } catch (error) {
      console.error('Failed to load admin music:', error);
      return [];
    }
  };

  // Load playlists
  const loadPlaylists = async () => {
    if (!user?.id) return [];

    try {
      const snapshot = await firestore()
        .collection('playlists')
        .where('userId', '==', user.id)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Playlist[];
    } catch (error) {
      console.error('Failed to load playlists:', error);
      return [];
    }
  };

  // Load vinyl disc customization
  const loadVinylDisc = async (): Promise<VinylDisc | null> => {
    if (!user) return null;

    try {
      const stored = await AsyncStorage.getItem(`@vinyl_disc_${user.id}`);

      if (stored) {
        const data = JSON.parse(stored);
        return {
          ...data,
          activeEffects: data.activeEffects || [],
          updatedAt: new Date(data.updatedAt),
        } as VinylDisc;
      }

      const defaultDisc: VinylDisc = {
        vinylColor: 'black' as const,
        activeEffects: [],
        userId: user.id,
        updatedAt: new Date(),
      };

      await AsyncStorage.setItem(`@vinyl_disc_${user.id}`, JSON.stringify(defaultDisc));
      return defaultDisc;
    } catch (error) {
      console.error('Failed to load vinyl disc:', error);
      return {
        vinylColor: 'black' as const,
        activeEffects: [],
        userId: user.id,
        updatedAt: new Date(),
      };
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [embeddedSongs, userSongs, adminMusic, userPlaylists, userVinylDisc] = await Promise.all([
        loadEmbeddedSongs(),
        loadUserSongs(),
        loadAdminMusic(),
        loadPlaylists(),
        loadVinylDisc(),
      ]);

      const allSongs = [...embeddedSongs, ...userSongs, ...adminMusic];
      setSongs(allSongs);
      setPlaylists(userPlaylists);
      setVinylDisc(userVinylDisc);

      // Restore player state after songs are loaded
      const savedState = await loadPlayerState();
      if (savedState && allSongs.length > 0) {
        console.log('🔄 Restoring player state...');

        // Rebuild queue from saved IDs
        const restoredQueue = savedState.queueIds
          .map((id: string) => allSongs.find(s => s.id === id))
          .filter((s: Song | undefined): s is Song => s !== undefined);

        if (restoredQueue.length > 0 && savedState.currentSongId) {
          const currentSong = allSongs.find(s => s.id === savedState.currentSongId);

          if (currentSong) {
            // Restore the queue and current song
            await MusicPlayerService.setQueue(restoredQueue, savedState.currentIndex);

            // Restore position
            if (savedState.position > 0) {
              await MusicPlayerService.seekTo(savedState.position);
            }

            // Restore repeat and volume
            await MusicPlayerService.setRepeatMode(savedState.repeat);
            await MusicPlayerService.setVolume(savedState.volume);

            // Update state
            setPlayerState(prev => ({
              ...prev,
              currentSong,
              queue: restoredQueue,
              currentIndex: savedState.currentIndex,
              position: savedState.position,
              shuffle: savedState.shuffle,
              repeat: savedState.repeat,
              volume: savedState.volume,
              duration: currentSong.duration,
            }));

            console.log('✅ Player state restored');
          }
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [user]);

  // Save player state whenever it changes
  useEffect(() => {
    if (!isLoading && playerState.currentSong) {
      savePlayerState(playerState);
    }
  }, [playerState.currentSong, playerState.position, playerState.queue, playerState.currentIndex, playerState.shuffle, playerState.repeat, isLoading]);

  // Calculate stats
  const stats: MusicStats = {
    totalSongs: songs.length,
    embeddedSongs: songs.filter(s => s.isEmbedded).length,
    uploadedSongs: songs.filter(s => !s.isEmbedded).length,
    totalPlaylists: playlists.length,
    sharedSongs: songs.filter(s => s.isSharedWithPartner).length,
  };

  // Song operations
  const getSongById = (id: string) => songs.find(s => s.id === id);

  const importSongFromDevice = async () => {
    throw new Error('File picker temporarily disabled - feature coming soon');
  };

  const importMultipleSongsFromDevice = async () => {
    throw new Error('File picker temporarily disabled - feature coming soon');
  };

  const shareSongWithPartner = async (songId: string) => {
    if (!user || !user.partnerId) {
      console.error('❌ Cannot share: user or partnerId missing');
      return;
    }

    const song = songs.find(s => s.id === songId);
    if (!song) {
      console.error('❌ Song not found:', songId);
      return;
    }

    try {
      // For embedded songs, store share info in user's collection
      if (song.isEmbedded) {
        await firestore()
          .collection('users')
          .doc(user.id)
          .collection('sharedEmbeddedSongs')
          .doc(songId)
          .set({
            songId,
            isSharedWithPartner: true,
            partnerId: user.partnerId,
            sharedAt: firestore.FieldValue.serverTimestamp(),
          });

        console.log('✅ Embedded song shared:', songId);
      }
      // For admin panel songs (musicLibrary)
      else if (song.userId === 'admin') {
        await firestore()
          .collection('users')
          .doc(user.id)
          .collection('sharedAdminSongs')
          .doc(songId)
          .set({
            songId,
            isSharedWithPartner: true,
            partnerId: user.partnerId,
            sharedAt: firestore.FieldValue.serverTimestamp(),
          });

        console.log('✅ Admin song shared:', songId);
      }
      // For user uploaded songs
      else {
        await firestore().collection('songs').doc(songId).update({
          isSharedWithPartner: true,
          partnerId: user.partnerId,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        console.log('✅ User song shared:', songId);
      }

      setSongs(prev => prev.map(s => s.id === songId ? { ...s, isSharedWithPartner: true } : s));
    } catch (error) {
      console.error('❌ Failed to share song:', error);
      throw error;
    }
  };

  const unshareSong = async (songId: string) => {
    if (!user) return;

    const song = songs.find(s => s.id === songId);
    if (!song) {
      console.error('❌ Song not found:', songId);
      return;
    }

    try {
      // For embedded songs
      if (song.isEmbedded) {
        await firestore()
          .collection('users')
          .doc(user.id)
          .collection('sharedEmbeddedSongs')
          .doc(songId)
          .delete();

        console.log('✅ Embedded song unshared:', songId);
      }
      // For admin panel songs
      else if (song.userId === 'admin') {
        await firestore()
          .collection('users')
          .doc(user.id)
          .collection('sharedAdminSongs')
          .doc(songId)
          .delete();

        console.log('✅ Admin song unshared:', songId);
      }
      // For user uploaded songs
      else {
        await firestore().collection('songs').doc(songId).update({
          isSharedWithPartner: false,
          partnerId: firestore.FieldValue.delete(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        console.log('✅ User song unshared:', songId);
      }

      setSongs(prev => prev.map(s => s.id === songId ? { ...s, isSharedWithPartner: false } : s));
    } catch (error) {
      console.error('❌ Failed to unshare song:', error);
      throw error;
    }
  };

  const deleteSong = async (songId: string) => {
    if (!user) return;
    const song = songs.find(s => s.id === songId);
    if (!song || song.isEmbedded) return;

    try {
      if (song.uri.startsWith('https://')) {
        const storageRef = storage().refFromURL(song.uri);
        await storageRef.delete();
      }

      await firestore().collection('songs').doc(songId).delete();
      setSongs(prev => prev.filter(s => s.id !== songId));
    } catch (error) {
      console.error('Failed to delete song:', error);
      throw error;
    }
  };

  const updateSong = async (songId: string, updates: Partial<Song>) => {
    if (!user) return;
    try {
      await firestore().collection('songs').doc(songId).update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, ...updates } : s));
    } catch (error) {
      console.error('Failed to update song:', error);
      throw error;
    }
  };

  // Playlist operations (unchanged)
  const createPlaylist = async (title: string, description?: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const docRef = await firestore().collection('playlists').add({
        title,
        description,
        songIds: [],
        userId: user.id,
        isSharedWithPartner: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      const newPlaylist: Playlist = {
        id: docRef.id,
        title,
        description,
        songIds: [],
        userId: user.id,
        isSharedWithPartner: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setPlaylists(prev => [...prev, newPlaylist]);
      return docRef.id;
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw error;
    }
  };

  const updatePlaylist = async (playlistId: string, updates: Partial<Playlist>) => {
    if (!user) return;
    try {
      await firestore().collection('playlists').doc(playlistId).update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, ...updates } : p));
    } catch (error) {
      console.error('Failed to update playlist:', error);
      throw error;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!user) return;
    try {
      await firestore().collection('playlists').doc(playlistId).delete();
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      throw error;
    }
  };

  const addSongToPlaylist = async (songId: string, playlistId: string) => {
    if (!user) return;
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      const updatedSongIds = [...playlist.songIds, songId];
      await firestore().collection('playlists').doc(playlistId).update({
        songIds: updatedSongIds,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      setPlaylists(prev => prev.map(p =>
        p.id === playlistId ? { ...p, songIds: updatedSongIds } : p
      ));
    } catch (error) {
      console.error('Failed to add song to playlist:', error);
      throw error;
    }
  };

  const removeSongFromPlaylist = async (songId: string, playlistId: string) => {
    if (!user) return;
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      const updatedSongIds = playlist.songIds.filter(id => id !== songId);
      await firestore().collection('playlists').doc(playlistId).update({
        songIds: updatedSongIds,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      setPlaylists(prev => prev.map(p =>
        p.id === playlistId ? { ...p, songIds: updatedSongIds } : p
      ));
    } catch (error) {
      console.error('Failed to remove song from playlist:', error);
      throw error;
    }
  };

  // Vinyl customization
  const updateVinylPhoto = async (photoUri: string) => {
    if (!user) return;
    try {
      const updatedDisc: VinylDisc = {
        centerPhotoUri: photoUri,
        vinylColor: vinylDisc?.vinylColor || 'black',
        labelText: vinylDisc?.labelText,
        activeEffects: vinylDisc?.activeEffects || [],
        userId: user.id,
        updatedAt: new Date(),
      };

      await AsyncStorage.setItem(`@vinyl_disc_${user.id}`, JSON.stringify(updatedDisc));
      setVinylDisc(updatedDisc);
    } catch (error) {
      console.error('Failed to update vinyl photo:', error);
      throw error;
    }
  };

  const updateVinylColor = async (color: VinylDisc['vinylColor']) => {
    if (!user) return;
    try {
      const updatedDisc: VinylDisc = {
        centerPhotoUri: vinylDisc?.centerPhotoUri,
        vinylColor: color,
        labelText: vinylDisc?.labelText,
        activeEffects: vinylDisc?.activeEffects || [],
        userId: user.id,
        updatedAt: new Date(),
      };

      await AsyncStorage.setItem(`@vinyl_disc_${user.id}`, JSON.stringify(updatedDisc));
      setVinylDisc(updatedDisc);
    } catch (error) {
      console.error('Failed to update vinyl color:', error);
      throw error;
    }
  };

  const updateVinylLabel = async (labelText: string) => {
    if (!user) return;
    try {
      const updatedDisc: VinylDisc = {
        centerPhotoUri: vinylDisc?.centerPhotoUri,
        vinylColor: vinylDisc?.vinylColor || 'black',
        labelText,
        activeEffects: vinylDisc?.activeEffects || [],
        userId: user.id,
        updatedAt: new Date(),
      };

      await AsyncStorage.setItem(`@vinyl_disc_${user.id}`, JSON.stringify(updatedDisc));
      setVinylDisc(updatedDisc);
    } catch (error) {
      console.error('Failed to update vinyl label:', error);
      throw error;
    }
  };

  const updateVinylEffects = async (effects: ParticleEffectType[]) => {
    if (!user) return;
    try {
      const updatedDisc: VinylDisc = {
        centerPhotoUri: vinylDisc?.centerPhotoUri,
        vinylColor: vinylDisc?.vinylColor || 'black',
        labelText: vinylDisc?.labelText,
        activeEffects: effects,
        userId: user.id,
        updatedAt: new Date(),
      };

      await AsyncStorage.setItem(`@vinyl_disc_${user.id}`, JSON.stringify(updatedDisc));
      setVinylDisc(updatedDisc);
    } catch (error) {
      console.error('Failed to update vinyl effects:', error);
      throw error;
    }
  };

  const resetVinylToDefault = async () => {
    if (!user) return;
    try {
      const defaultDisc: VinylDisc = {
        vinylColor: 'black',
        activeEffects: [],
        userId: user.id,
        updatedAt: new Date(),
      };

      await AsyncStorage.setItem(`@vinyl_disc_${user.id}`, JSON.stringify(defaultDisc));
      setVinylDisc(defaultDisc);
    } catch (error) {
      console.error('Failed to reset vinyl:', error);
      throw error;
    }
  };

  // Player controls
  const playSong = async (song: Song) => {
    try {
      console.log('🎵 Playing song:', song.title);
      await MusicPlayerService.setQueue([song], 0);
      await MusicPlayerService.play();
      setPlayerState(prev => ({
        ...prev,
        queue: [song],
        currentIndex: 0,
      }));
    } catch (error) {
      console.error('Failed to play song:', error);
      throw error;
    }
  };

  const playQueue = async (songs: Song[], startIndex: number = 0) => {
    try {
      console.log('🎵 Playing queue:', songs.length, 'songs, starting at', startIndex);
      await MusicPlayerService.setQueue(songs, startIndex);
      await MusicPlayerService.play();
      setPlayerState(prev => ({
        ...prev,
        queue: songs,
        currentIndex: startIndex,
      }));
    } catch (error) {
      console.error('Failed to play queue:', error);
      throw error;
    }
  };

  const togglePlayPause = async () => {
    try {
      const isPlaying = await MusicPlayerService.getIsPlaying();
      if (isPlaying) {
        await MusicPlayerService.pause();
      } else {
        await MusicPlayerService.play();
      }
    } catch (error) {
      console.error('Failed to toggle play/pause:', error);
      throw error;
    }
  };

  const skipToNext = async () => {
    try {
      await MusicPlayerService.skipToNext();
      const newIndex = MusicPlayerService.getCurrentTrackIndex();

      if (typeof newIndex === 'number') {
        setPlayerState(prev => ({
          ...prev,
          currentIndex: newIndex,
        }));
      }
    } catch (error) {
      console.error('Failed to skip to next:', error);
      throw error;
    }
  };

  const skipToPrevious = async () => {
    try {
      await MusicPlayerService.skipToPrevious();
      const newIndex = MusicPlayerService.getCurrentTrackIndex();

      if (typeof newIndex === 'number') {
        setPlayerState(prev => ({
          ...prev,
          currentIndex: newIndex,
        }));
      }
    } catch (error) {
      console.error('Failed to skip to previous:', error);
      throw error;
    }
  };

  const seekTo = async (position: number) => {
    try {
      await MusicPlayerService.seekTo(position);
    } catch (error) {
      console.error('Failed to seek:', error);
      throw error;
    }
  };

  const setRepeatMode = async (mode: 'off' | 'one' | 'all') => {
    try {
      await MusicPlayerService.setRepeatMode(mode);
      setPlayerState(prev => ({ ...prev, repeat: mode }));
    } catch (error) {
      console.error('Failed to set repeat mode:', error);
      throw error;
    }
  };

  const toggleShuffle = async () => {
    try {
      const newShuffle = !playerState.shuffle;
      setPlayerState(prev => ({ ...prev, shuffle: newShuffle }));
    } catch (error) {
      console.error('Failed to toggle shuffle:', error);
      throw error;
    }
  };

  const setVolume = async (volume: number) => {
    try {
      await MusicPlayerService.setVolume(volume);
      setPlayerState(prev => ({ ...prev, volume }));
    } catch (error) {
      console.error('Failed to set volume:', error);
      throw error;
    }
  };

  // Refresh music data
  const refreshMusic = async (): Promise<void> => {
    console.log('🔄 Refreshing music data...');
    try {
      const [embeddedSongs, userSongs, adminMusic, userPlaylists] = await Promise.all([
        loadEmbeddedSongs(),
        loadUserSongs(),
        loadAdminMusic(),
        loadPlaylists(),
      ]);

      setSongs([...embeddedSongs, ...userSongs, ...adminMusic]);
      setPlaylists(userPlaylists);
      console.log('✅ Music data refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh music:', error);
      throw error;
    }
  };

  // Search
  const searchSongs = (query: string) => {
    setFilter(prev => ({ ...prev, searchQuery: query }));
  };

  const clearSearch = () => {
    setFilter(prev => ({ ...prev, searchQuery: undefined }));
  };

  const value: MusicContextType = {
    songs,
    playlists,
    vinylDisc,
    playerState,
    filter,
    stats,
    isLoading,
    refreshMusic,
    getSongById,
    shareSongWithPartner,
    unshareSong,
    deleteSong,
    updateSong,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    importSongFromDevice,
    importMultipleSongsFromDevice,
    updateVinylPhoto,
    updateVinylColor,
    updateVinylLabel,
    updateVinylEffects,
    resetVinylToDefault,
    playSong,
    playQueue,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    setRepeatMode,
    toggleShuffle,
    setVolume,
    setFilter,
    searchSongs,
    clearSearch,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
