import TrackPlayer, {
  Event,
  Capability,
  RepeatMode,
  State,
  Track,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';
import { Song } from '../types/music';

class TrackPlayerService {
  private static instance: TrackPlayerService;
  private isSetup: boolean = false;
  private onPlaybackStateChange?: (isPlaying: boolean) => void;
  private onTrackChange?: (song: Song | null) => void;
  private onPositionChange?: (position: number, duration: number) => void;
  private onSongEnd?: () => void;
  private positionUpdateInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): TrackPlayerService {
    if (!TrackPlayerService.instance) {
      TrackPlayerService.instance = new TrackPlayerService();
    }
    return TrackPlayerService.instance;
  }

  async setup(): Promise<void> {
    if (this.isSetup) return;

    try {
      await TrackPlayer.setupPlayer({
        waitForBuffer: true,
      });

      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
          Capability.Stop,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        progressUpdateEventInterval: 1,
      });

      this.setupEventListeners();
      this.isSetup = true;
      console.log('✅ TrackPlayer setup complete');
    } catch (error) {
      console.error('❌ Failed to setup TrackPlayer:', error);
      throw error;
    }
  }

  private setupEventListeners() {
    // Playback state changes
    TrackPlayer.addEventListener(Event.PlaybackState, async (data) => {
      const isPlaying = data.state === State.Playing;
      console.log('🎵 Playback state:', data.state, '- isPlaying:', isPlaying);
      this.onPlaybackStateChange?.(isPlaying);

      if (isPlaying) {
        this.startPositionUpdates();
      } else {
        this.stopPositionUpdates();
      }
    });

    // Track changes
    TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (data) => {
      console.log('🎵 Track changed:', data);

      if (data.nextTrack !== undefined) {
        const track = await TrackPlayer.getTrack(data.nextTrack);
        if (track) {
          const song = this.trackToSong(track);
          console.log('🎵 Now playing:', song.title);
          this.onTrackChange?.(song);
        }
      } else {
        this.onTrackChange?.(null);
      }
    });

    // Queue ended
    TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async (data) => {
      console.log('🎵 Queue ended:', data);
      this.onSongEnd?.();
    });

    // Error handling
    TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
      console.error('🎵 Playback error:', error);
    });
  }

  private startPositionUpdates() {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
    }

    this.positionUpdateInterval = setInterval(async () => {
      try {
        const position = await TrackPlayer.getPosition();
        const duration = await TrackPlayer.getDuration();
        this.onPositionChange?.(position, duration);
      } catch (error) {
        // Ignore errors during position updates
      }
    }, 1000);
  }

  private stopPositionUpdates() {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = null;
    }
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

  private songToTrack(song: Song): Track {
    return {
      id: song.id,
      url: song.uri,
      title: song.title,
      artist: song.artist,
      album: song.album,
      artwork: song.thumbnailUrl || song.albumArt,
      duration: song.duration,
    };
  }

  private trackToSong(track: Track): Song {
    return {
      id: track.id as string,
      title: track.title || 'Unknown',
      artist: track.artist || 'Unknown Artist',
      album: track.album,
      uri: track.url as string,
      thumbnailUrl: track.artwork as string | undefined,
      albumArt: track.artwork as string | undefined,
      duration: track.duration || 0,
      isEmbedded: false,
      isSharedWithPartner: false,
      userId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async setQueue(songs: Song[], startIndex: number = 0): Promise<void> {
    await this.setup();

    try {
      // Reset queue
      await TrackPlayer.reset();

      // Add tracks
      const tracks = songs.map(song => this.songToTrack(song));
      await TrackPlayer.add(tracks);

      // Skip to start index
      if (startIndex > 0) {
        await TrackPlayer.skip(startIndex);
      }

      console.log('✅ Queue set:', tracks.length, 'songs, starting at index:', startIndex);
    } catch (error) {
      console.error('❌ Failed to set queue:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    await this.setup();

    try {
      await TrackPlayer.play();
      console.log('▶️  Playing');
    } catch (error) {
      console.error('❌ Failed to play:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    try {
      await TrackPlayer.pause();
      console.log('⏸️  Paused');
    } catch (error) {
      console.error('❌ Failed to pause:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await TrackPlayer.stop();
      this.stopPositionUpdates();
      console.log('⏹️  Stopped');
    } catch (error) {
      console.error('❌ Failed to stop:', error);
      throw error;
    }
  }

  async seekTo(position: number): Promise<void> {
    try {
      await TrackPlayer.seekTo(position);
      console.log('⏩ Seeked to:', position);
    } catch (error) {
      console.error('❌ Failed to seek:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      await TrackPlayer.setVolume(clampedVolume);
      console.log('🔊 Volume set to:', clampedVolume);
    } catch (error) {
      console.error('❌ Failed to set volume:', error);
      throw error;
    }
  }

  async skipToNext(): Promise<void> {
    try {
      await TrackPlayer.skipToNext();
      console.log('⏭️  Skipped to next');
    } catch (error) {
      console.error('❌ Failed to skip to next:', error);
      throw error;
    }
  }

  async skipToPrevious(): Promise<void> {
    try {
      await TrackPlayer.skipToPrevious();
      console.log('⏮️  Skipped to previous');
    } catch (error) {
      console.error('❌ Failed to skip to previous:', error);
      throw error;
    }
  }

  async skipToIndex(index: number): Promise<void> {
    try {
      await TrackPlayer.skip(index);
      console.log('⏭️  Skipped to index:', index);
    } catch (error) {
      console.error('❌ Failed to skip to index:', error);
      throw error;
    }
  }

  async setRepeatMode(mode: 'off' | 'one' | 'all'): Promise<void> {
    try {
      let trackPlayerMode: RepeatMode;
      switch (mode) {
        case 'one':
          trackPlayerMode = RepeatMode.Track;
          break;
        case 'all':
          trackPlayerMode = RepeatMode.Queue;
          break;
        default:
          trackPlayerMode = RepeatMode.Off;
      }

      await TrackPlayer.setRepeatMode(trackPlayerMode);
      console.log('🔁 Repeat mode set to:', mode);
    } catch (error) {
      console.error('❌ Failed to set repeat mode:', error);
      throw error;
    }
  }

  async getPosition(): Promise<number> {
    try {
      return await TrackPlayer.getPosition();
    } catch (error) {
      return 0;
    }
  }

  async getDuration(): Promise<number> {
    try {
      return await TrackPlayer.getDuration();
    } catch (error) {
      return 0;
    }
  }

  async getIsPlaying(): Promise<boolean> {
    try {
      const state = await TrackPlayer.getState();
      return state === State.Playing;
    } catch (error) {
      return false;
    }
  }

  async getCurrentTrackIndex(): Promise<number> {
    try {
      return (await TrackPlayer.getCurrentTrack()) || 0;
    } catch (error) {
      return 0;
    }
  }

  async getQueue(): Promise<Track[]> {
    try {
      return await TrackPlayer.getQueue();
    } catch (error) {
      return [];
    }
  }

  async reset(): Promise<void> {
    try {
      await TrackPlayer.reset();
      this.stopPositionUpdates();
      console.log('🔄 Player reset');
    } catch (error) {
      console.error('❌ Failed to reset:', error);
    }
  }

  async release(): Promise<void> {
    try {
      this.stopPositionUpdates();
      await TrackPlayer.destroy();
      this.isSetup = false;
      console.log('🗑️  Player released');
    } catch (error) {
      console.error('❌ Failed to release player:', error);
    }
  }
}

export default TrackPlayerService.getInstance();
