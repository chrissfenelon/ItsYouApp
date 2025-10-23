import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { Song } from '../types/music';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as RNImage } from 'react-native';

const { MusicPlayerModule } = NativeModules;

interface NativeEventMap {
  onPlaybackStateChange: { isPlaying: boolean };
  onTrackChange: { index: number; title: string; artist: string };
  onPositionUpdate: { position: number; duration: number };
  onPlaybackComplete: void;
}

/**
 * Native Music Player Service with MediaSession support
 * Provides lockscreen controls and notification controls
 * Uses event-driven architecture instead of polling
 */
class NativeMusicPlayerService {
  private static instance: NativeMusicPlayerService;
  private queue: Song[] = [];
  private currentIndex: number = 0;
  private repeatMode: 'off' | 'one' | 'all' = 'off';
  private shuffleMode: boolean = false;

  // Callbacks
  private onPlaybackStateChange?: (isPlaying: boolean) => void;
  private onTrackChange?: (song: Song | null) => void;
  private onPositionChange?: (position: number, duration: number) => void;
  private onSongEnd?: () => void;

  // Native event emitter
  private eventEmitter: NativeEventEmitter | null = null;
  private eventSubscriptions: any[] = [];

  // Cached state from native
  private cachedIsPlaying: boolean = false;
  private cachedPosition: number = 0;
  private cachedDuration: number = 0;

  private constructor() {}

  static getInstance(): NativeMusicPlayerService {
    if (!NativeMusicPlayerService.instance) {
      NativeMusicPlayerService.instance = new NativeMusicPlayerService();
    }
    return NativeMusicPlayerService.instance;
  }

  async setup(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.log('⚠️ Native music player only available on Android');
      return;
    }

    // Setup event emitter
    this.eventEmitter = new NativeEventEmitter(MusicPlayerModule);

    // Subscribe to native events
    this.eventSubscriptions.push(
      this.eventEmitter.addListener('onPlaybackStateChange', (event: NativeEventMap['onPlaybackStateChange']) => {
        this.cachedIsPlaying = event.isPlaying;
        this.onPlaybackStateChange?.(event.isPlaying);
      })
    );

    this.eventSubscriptions.push(
      this.eventEmitter.addListener('onTrackChange', (event: NativeEventMap['onTrackChange']) => {
        this.currentIndex = event.index;

        // Update current song from queue or create from event
        const song = this.queue[event.index] || {
          id: `track-${event.index}`,
          title: event.title,
          artist: event.artist,
          uri: '',
        };

        this.onTrackChange?.(song);
      })
    );

    this.eventSubscriptions.push(
      this.eventEmitter.addListener('onPositionUpdate', (event: NativeEventMap['onPositionUpdate']) => {
        this.cachedPosition = event.position / 1000; // Convert to seconds
        this.cachedDuration = event.duration / 1000; // Convert to seconds
        this.onPositionChange?.(this.cachedPosition, this.cachedDuration);
      })
    );

    this.eventSubscriptions.push(
      this.eventEmitter.addListener('onPlaybackComplete', () => {
        this.onSongEnd?.();
      })
    );

    console.log('✅ NativeMusicPlayerService setup complete');
  }

  setOnPlaybackStateChange(callback: (isPlaying: boolean) => void) {
    this.onPlaybackStateChange = callback;
  }

  setOnTrackChange(callback: (song: Song | null) => void) {
    this.onTrackChange = callback;
  }

  setOnPositionChange(callback: (position: number, duration: number) => void) {
    this.onPositionChange = callback;
  }

  setOnSongEnd(callback: () => void) {
    this.onSongEnd = callback;
  }

  /**
   * Get saved artwork from AsyncStorage
   */
  private async getSavedArtwork(): Promise<string | null> {
    try {
      const saved = await AsyncStorage.getItem('@music_player_artwork');
      if (saved) {
        const parsed = JSON.parse(saved);

        // If custom artwork
        if (parsed.id === 'custom' && parsed.customUri) {
          return parsed.customUri;
        }

        // If bundled artwork, resolve the resource
        const bundledArtworks: { [key: string]: any } = {
          'app_logo': require('../assets/logo/applogo.png'),
          'intro_logo': require('../assets/logo/intrologo.png'),
          'bg_1': require('../assets/images/predefined-background (1).jpg'),
          'bg_2': require('../assets/images/predefined-background (2).jpg'),
          'bg_3': require('../assets/images/predefined-background (3).jpg'),
          'bg_4': require('../assets/images/predefined-background (4).jpg'),
          'bg_5': require('../assets/images/predefined-background (5).jpg'),
          'bg_7': require('../assets/images/predefined-background (7).jpg'),
          'bg_8': require('../assets/images/predefined-background (8).jpg'),
        };

        const artwork = bundledArtworks[parsed.id];
        if (artwork) {
          // Resolve bundled image to URI
          const resolvedImage = RNImage.resolveAssetSource(artwork);
          return resolvedImage?.uri || null;
        }
      }
    } catch (error) {
      console.error('❌ Error getting saved artwork:', error);
    }

    // Default: return app logo
    const defaultLogo = RNImage.resolveAssetSource(require('../assets/logo/applogo.png'));
    return defaultLogo?.uri || null;
  }

  /**
   * Convert Song to native track format
   */
  private async songToTrack(song: Song): Promise<{uri: string; title: string; artist: string; artwork: string | null}> {
    // Get saved artwork (this will be used for ALL songs)
    const artwork = await this.getSavedArtwork();

    return {
      uri: song.uri,
      title: song.title,
      artist: song.artist || 'Unknown Artist',
      artwork: artwork, // Use saved artwork instead of song.artwork
    };
  }

  async loadSong(song: Song): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('Native music player only available on Android');
    }

    try {
      const track = await this.songToTrack(song);
      await MusicPlayerModule.loadTrack(
        track.uri,
        track.title,
        track.artist,
        track.artwork
      );

      this.queue = [song];
      this.currentIndex = 0;

      console.log('✅ Song loaded:', song.title, 'with artwork:', track.artwork);
    } catch (error) {
      console.error('❌ Error loading song:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await MusicPlayerModule.play();
      console.log('▶️ Play command sent');
    } catch (error) {
      console.error('❌ Error playing:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await MusicPlayerModule.pause();
      console.log('⏸️ Pause command sent');
    } catch (error) {
      console.error('❌ Error pausing:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await MusicPlayerModule.stop();
      console.log('⏹️ Stop command sent');
    } catch (error) {
      console.error('❌ Error stopping:', error);
      throw error;
    }
  }

  async seekTo(position: number): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      // Position is in seconds, convert to milliseconds
      await MusicPlayerModule.seekTo(position * 1000);
      console.log('⏩ Seeked to:', position);
    } catch (error) {
      console.error('❌ Error seeking:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (volume < 0 || volume > 1) {
      console.warn('⚠️ Volume must be between 0 and 1');
      return;
    }
    // Volume control would need to be added to native module
    console.log('🔊 Volume (not yet implemented):', volume);
  }

  async setRepeatMode(mode: 'off' | 'one' | 'all'): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await MusicPlayerModule.setRepeatMode(mode);
      this.repeatMode = mode;
      console.log('🔁 Repeat mode set to:', mode);
    } catch (error) {
      console.error('❌ Error setting repeat mode:', error);
      throw error;
    }
  }

  async setShuffleMode(enabled: boolean): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await MusicPlayerModule.setShuffleMode(enabled);
      this.shuffleMode = enabled;
      console.log('🔀 Shuffle mode set to:', enabled);
    } catch (error) {
      console.error('❌ Error setting shuffle mode:', error);
      throw error;
    }
  }

  async setQueue(songs: Song[], startIndex: number = 0): Promise<void> {
    if (Platform.OS !== 'android') return;

    if (startIndex < 0 || startIndex >= songs.length) {
      console.warn('⚠️ Invalid start index:', startIndex);
      startIndex = 0;
    }

    try {
      this.queue = songs;
      this.currentIndex = startIndex;

      // Convert songs to tracks (async now)
      const tracks = await Promise.all(songs.map(song => this.songToTrack(song)));

      await MusicPlayerModule.loadPlaylist(tracks, startIndex);

      console.log('📝 Queue set:', songs.length, 'songs, starting at index:', startIndex);
    } catch (error) {
      console.error('❌ Error setting queue:', error);
      throw error;
    }
  }

  async skipToNext(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await MusicPlayerModule.playNext();
      console.log('⏭️ Skip to next');
    } catch (error) {
      console.error('❌ Error skipping to next:', error);
      throw error;
    }
  }

  async skipToPrevious(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await MusicPlayerModule.playPrevious();
      console.log('⏮️ Skip to previous');
    } catch (error) {
      console.error('❌ Error skipping to previous:', error);
      throw error;
    }
  }

  async skipToIndex(index: number): Promise<void> {
    if (Platform.OS !== 'android') return;

    if (index < 0 || index >= this.queue.length) {
      console.warn('⚠️ Invalid index:', index);
      return;
    }

    try {
      await MusicPlayerModule.skipToIndex(index);
      console.log('🎯 Jumped to index:', index);
    } catch (error) {
      console.error('❌ Error jumping to index:', error);
      throw error;
    }
  }

  async getPositionAsync(): Promise<number> {
    if (Platform.OS !== 'android') return 0;

    try {
      const position = await MusicPlayerModule.getCurrentPosition();
      return position; // Returns milliseconds
    } catch (error) {
      console.error('❌ Error getting position:', error);
      return 0;
    }
  }

  async getDuration(): Promise<number> {
    if (Platform.OS !== 'android') return 0;

    try {
      const duration = await MusicPlayerModule.getDuration();
      return duration; // Returns milliseconds
    } catch (error) {
      console.error('❌ Error getting duration:', error);
      return 0;
    }
  }

  async getIsPlaying(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    try {
      return await MusicPlayerModule.isPlaying();
    } catch (error) {
      console.error('❌ Error checking playing status:', error);
      return false;
    }
  }

  // Synchronous getters using cached values from events
  getPosition(): number {
    return this.cachedPosition * 1000; // Return in milliseconds
  }

  getDurationSync(): number {
    return this.cachedDuration * 1000; // Return in milliseconds
  }

  getIsPlayingSync(): boolean {
    return this.cachedIsPlaying;
  }

  getCurrentSong(): Song | null {
    return this.queue[this.currentIndex] || null;
  }

  getQueue(): Song[] {
    return this.queue;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getCurrentTrackIndex(): number {
    return this.currentIndex;
  }

  getRepeatMode(): 'off' | 'one' | 'all' {
    return this.repeatMode;
  }

  getShuffleMode(): boolean {
    return this.shuffleMode;
  }

  async reset(): Promise<void> {
    await this.stop();
    this.queue = [];
    this.currentIndex = 0;
    this.repeatMode = 'off';
    this.shuffleMode = false;
    this.cachedIsPlaying = false;
    this.cachedPosition = 0;
    this.cachedDuration = 0;
    console.log('🔄 Player reset');
  }

  /**
   * Update artwork for currently playing track and all future tracks
   * Call this after user changes artwork in settings
   */
  async updateCurrentArtwork(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const artwork = await this.getSavedArtwork();
      console.log('🖼️ Updating default artwork to:', artwork);

      // Update default artwork in the native module
      // This will update the currently playing track AND all future tracks
      await MusicPlayerModule.updateDefaultArtwork(artwork);

      console.log('✅ Artwork updated successfully');
    } catch (error) {
      console.error('❌ Error updating artwork:', error);
      throw error;
    }
  }

  async release(): Promise<void> {
    // Unsubscribe from events
    this.eventSubscriptions.forEach(subscription => subscription.remove());
    this.eventSubscriptions = [];

    await this.stop();
    console.log('🔓 Player released');
  }
}

export default NativeMusicPlayerService.getInstance();
