import Sound from 'react-native-sound';
import { Song } from '../types/music';

// Enable playback in silence mode for iOS with highest quality
Sound.setCategory('Playback', true); // true = mixWithOthers (high quality audio)

class MusicPlayerService {
  private static instance: MusicPlayerService;
  private currentSound: Sound | null = null;
  private currentSong: Song | null = null;
  private queue: Song[] = [];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private volume: number = 1;
  private repeatMode: 'off' | 'one' | 'all' = 'off';
  private shuffleMode: boolean = false;
  private onPlaybackStateChange?: (isPlaying: boolean) => void;
  private onTrackChange?: (song: Song | null) => void;
  private onPositionChange?: (position: number, duration: number) => void;
  private onSongEnd?: () => void;
  private positionUpdateInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): MusicPlayerService {
    if (!MusicPlayerService.instance) {
      MusicPlayerService.instance = new MusicPlayerService();
    }
    return MusicPlayerService.instance;
  }

  async setup(): Promise<void> {
    console.log('✅ MusicPlayerService setup complete');
    return Promise.resolve();
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

  private startPositionUpdates() {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
    }

    this.positionUpdateInterval = setInterval(() => {
      if (this.currentSound && this.isPlaying) {
        this.currentSound.getCurrentTime((seconds) => {
          const duration = this.currentSound?.getDuration() || 0;
          this.onPositionChange?.(seconds, duration);
        });
      }
    }, 1000);
  }

  private stopPositionUpdates() {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = null;
    }
  }

  async loadSong(song: Song): Promise<void> {
    return new Promise((resolve, reject) => {
      // Release previous sound
      if (this.currentSound) {
        this.currentSound.release();
        this.currentSound = null;
      }

      this.currentSong = song;
      this.onTrackChange?.(song);

      // Determine the base path based on whether it's a bundled or external file
      const isEmbedded = song.isEmbedded;

      // For embedded files, remove the file extension (react-native-sound requirement)
      let fileName = song.uri;
      if (isEmbedded) {
        fileName = fileName.replace(/\.(mp3|m4a|wav|aac)$/i, '');
      }

      const basePath = isEmbedded ? Sound.MAIN_BUNDLE : '';

      console.log('🎵 Loading sound:', { fileName, basePath, isEmbedded, originalUri: song.uri });

      // Create new sound
      const sound = new Sound(fileName, basePath, (error) => {
        if (error) {
          console.error('❌ Failed to load sound:', error);
          reject(error);
          return;
        }

        this.currentSound = sound;
        this.currentSound.setVolume(this.volume);

        // Set number of loops based on repeat mode
        if (this.repeatMode === 'one') {
          this.currentSound.setNumberOfLoops(-1); // Infinite loop
        } else {
          this.currentSound.setNumberOfLoops(0); // Play once
        }

        console.log('✅ Sound loaded successfully');
        resolve();
      });
    });
  }

  async play(): Promise<void> {
    if (!this.currentSound) {
      console.error('❌ No sound loaded');
      throw new Error('No sound loaded');
    }

    this.isPlaying = true;
    this.onPlaybackStateChange?.(true);
    this.startPositionUpdates();

    return new Promise((resolve) => {
      this.currentSound!.play((success) => {
        if (success) {
          // Song finished playing successfully
          console.log('🎵 Song ended');
          this.isPlaying = false;
          this.onPlaybackStateChange?.(false);
          this.stopPositionUpdates();

          // Don't call onSongEnd if we're in repeat-one mode
          if (this.repeatMode !== 'one') {
            this.handleSongEnd();
          }
        } else {
          console.error('❌ Playback finished with error');
          this.isPlaying = false;
          this.onPlaybackStateChange?.(false);
          this.stopPositionUpdates();
        }
        resolve();
      });
    });
  }

  private async handleSongEnd() {
    console.log('🎵 Handle song end - repeat:', this.repeatMode, 'queue size:', this.queue.length);

    // Notify context that song ended
    this.onSongEnd?.();

    // Auto-advance logic
    if (this.repeatMode === 'all' && this.currentIndex >= this.queue.length - 1) {
      // Loop back to start
      console.log('🔁 Repeat all - looping back to first song');
      await this.skipToIndex(0);
      await this.play();
    } else if (this.currentIndex < this.queue.length - 1) {
      // Play next song
      console.log('⏭️ Auto-advancing to next song');
      await this.skipToNext();
      await this.play();
    } else {
      console.log('⏸️ End of queue - stopping');
    }
  }

  async pause(): Promise<void> {
    if (this.currentSound && this.isPlaying) {
      this.currentSound.pause();
      this.isPlaying = false;
      this.onPlaybackStateChange?.(false);
      this.stopPositionUpdates();
      console.log('⏸️ Paused');
    }
  }

  async stop(): Promise<void> {
    if (this.currentSound) {
      this.currentSound.stop();
      this.isPlaying = false;
      this.onPlaybackStateChange?.(false);
      this.stopPositionUpdates();
      console.log('⏹️ Stopped');
    }
  }

  async seekTo(position: number): Promise<void> {
    if (this.currentSound) {
      this.currentSound.setCurrentTime(position);
      console.log('⏩ Seeked to:', position);
    }
  }

  async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentSound) {
      this.currentSound.setVolume(this.volume);
    }
    console.log('🔊 Volume set to:', this.volume);
  }

  async setRepeatMode(mode: 'off' | 'one' | 'all'): Promise<void> {
    this.repeatMode = mode;
    console.log('🔁 Repeat mode set to:', mode);

    // Update current sound loop setting
    if (this.currentSound) {
      if (mode === 'one') {
        this.currentSound.setNumberOfLoops(-1); // Infinite loop
      } else {
        this.currentSound.setNumberOfLoops(0); // Play once
      }
    }
  }

  async setQueue(songs: Song[], startIndex: number = 0): Promise<void> {
    this.queue = songs;
    this.currentIndex = startIndex;
    console.log('📝 Queue set:', songs.length, 'songs, starting at index:', startIndex);

    if (songs.length > 0 && startIndex < songs.length) {
      await this.loadSong(songs[startIndex]);
    }
  }

  async skipToNext(): Promise<void> {
    console.log('⏭️ Skip to next - current index:', this.currentIndex, 'queue size:', this.queue.length);

    if (this.queue.length === 0) {
      console.log('❌ Queue is empty');
      return;
    }

    let nextIndex = this.currentIndex + 1;

    // Handle queue boundaries
    if (nextIndex >= this.queue.length) {
      if (this.repeatMode === 'all') {
        // Loop back to start
        nextIndex = 0;
        console.log('🔁 Looping back to start');
      } else {
        console.log('❌ End of queue reached');
        return;
      }
    }

    this.currentIndex = nextIndex;
    const wasPlaying = this.isPlaying;

    await this.loadSong(this.queue[this.currentIndex]);

    if (wasPlaying) {
      await this.play();
    }

    console.log('✅ Skipped to:', this.queue[this.currentIndex].title);
  }

  async skipToPrevious(): Promise<void> {
    console.log('⏮️ Skip to previous - current index:', this.currentIndex);

    if (this.queue.length === 0) {
      console.log('❌ Queue is empty');
      return;
    }

    // If we're more than 3 seconds into the song, restart it
    const position = await this.getPosition();
    if (position > 3) {
      await this.seekTo(0);
      console.log('🔄 Restarting current song');
      return;
    }

    let prevIndex = this.currentIndex - 1;

    // Handle queue boundaries
    if (prevIndex < 0) {
      if (this.repeatMode === 'all') {
        // Loop to end
        prevIndex = this.queue.length - 1;
        console.log('🔁 Looping to end');
      } else {
        console.log('❌ Start of queue reached');
        return;
      }
    }

    this.currentIndex = prevIndex;
    const wasPlaying = this.isPlaying;

    await this.loadSong(this.queue[this.currentIndex]);

    if (wasPlaying) {
      await this.play();
    }

    console.log('✅ Skipped to:', this.queue[this.currentIndex].title);
  }

  async skipToIndex(index: number): Promise<void> {
    console.log('🎯 Skip to index:', index);

    if (index < 0 || index >= this.queue.length) {
      console.log('❌ Invalid index:', index);
      return;
    }

    this.currentIndex = index;
    const wasPlaying = this.isPlaying;

    await this.loadSong(this.queue[index]);

    if (wasPlaying) {
      await this.play();
    }

    console.log('✅ Jumped to:', this.queue[index].title);
  }

  getPosition(): Promise<number> {
    return new Promise((resolve) => {
      if (this.currentSound) {
        this.currentSound.getCurrentTime((seconds) => resolve(seconds));
      } else {
        resolve(0);
      }
    });
  }

  getDuration(): number {
    return this.currentSound?.getDuration() || 0;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentSong(): Song | null {
    return this.currentSong;
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
    if (this.currentSound) {
      this.currentSound.release();
      this.currentSound = null;
    }
    this.currentSong = null;
    this.queue = [];
    this.currentIndex = 0;
    this.repeatMode = 'off';
    this.shuffleMode = false;
    this.stopPositionUpdates();
    console.log('🔄 Player reset');
  }

  async release(): Promise<void> {
    this.stopPositionUpdates();
    if (this.currentSound) {
      this.currentSound.release();
      this.currentSound = null;
    }
    console.log('🔓 Player released');
  }
}

export default MusicPlayerService.getInstance();
