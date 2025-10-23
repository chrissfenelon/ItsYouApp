import Sound from 'react-native-sound';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable playback in silence mode
Sound.setCategory('Playback');

const SETTINGS_KEY = '@sound_haptic_settings';

interface SoundSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  hapticEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

export class SoundService {
  private static sounds: { [key: string]: Sound } = {};
  private static backgroundMusic: Sound | null = null;
  private static currentGame: string | null = null;
  private static settings: SoundSettings = {
    musicEnabled: true,
    sfxEnabled: true,
    hapticEnabled: true,
    musicVolume: 0.7,
    sfxVolume: 0.8,
  };
  private static isInitialized: boolean = false;
  private static initializationPromise: Promise<void> | null = null;

  // Initialize all sounds and settings
  static async initialize() {
    // If already initializing or initialized, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      // Load settings from storage BEFORE using defaults
      try {
        console.log('🔊 Loading sound settings from storage...');
        const saved = await AsyncStorage.getItem(SETTINGS_KEY);
        if (saved) {
          this.settings = JSON.parse(saved);
          console.log('✅ Sound settings loaded:', this.settings);
        } else {
          console.log('ℹ️ No saved settings found, using defaults:', this.settings);
        }
      } catch (error) {
        console.error('❌ Error loading sound settings:', error);
      }

      this.initializeSounds();
      this.isInitialized = true;
      console.log('✅ SoundService fully initialized');
    })();

    return this.initializationPromise;
  }

  // Wait for initialization to complete
  private static async ensureInitialized() {
    if (!this.isInitialized) {
      console.log('⏳ Waiting for SoundService initialization...');
      await this.initialize();
    }
  }

  // Initialize sounds
  static initializeSounds() {
    // Morpion game sounds - Android requires filename without extension
    this.loadSound('move_x', 'move_x');
    this.loadSound('move_o', 'move_o');
    this.loadSound('applause', 'applause');
    this.loadSound('win_fanfare', 'win_fanfare');
    this.loadSound('draw', 'draw');
    this.loadSound('button_click', 'button_click');
    this.loadSound('game_start', 'game_start');

    // Additional SFX for all games
    this.loadSound('tile_place', 'tile_place');
    this.loadSound('tile_select', 'tile_select');
    this.loadSound('win', 'win');
    this.loadSound('lose', 'lose');
    this.loadSound('invalid_move', 'invalid_move');
    this.loadSound('correct', 'correct');
    this.loadSound('wrong', 'wrong');
    this.loadSound('word_found', 'word_found');
    this.loadSound('timer_tick', 'timer_tick');
    this.loadSound('timer_warning', 'timer_warning');

    // Background music for each game
    this.loadBackgroundMusic('morpion', 'music_morpion');
    this.loadBackgroundMusic('dominos', 'music_dominos');
    this.loadBackgroundMusic('puissance4', 'music_puissance4');
    this.loadBackgroundMusic('wordsearch', 'music_wordsearch');
    this.loadBackgroundMusic('quizcouple', 'music_quizcouple');
  }

  // Load a sound file
  private static loadSound(key: string, filename: string) {
    try {
      const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error(`❌ Failed to load sound '${key}' (${filename}):`, error);
          // Remove from sounds if failed to load
          delete this.sounds[key];
          return;
        }
        console.log(`✅ Loaded sound '${key}' (${filename})`);
      });
      // Store immediately so it's available for playback
      this.sounds[key] = sound;
    } catch (error) {
      console.error(`❌ Error loading sound '${key}':`, error);
    }
  }

  // Load background music (looping)
  private static loadBackgroundMusic(key: string, filename: string) {
    try {
      const music = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error(`❌ Failed to load music '${key}' (${filename}):`, error);
          // Remove from sounds if failed to load
          delete this.sounds[`music_${key}`];
          return;
        }
        console.log(`✅ Loaded music '${key}' (${filename})`);
      });
      // Set loop and store immediately
      music.setNumberOfLoops(-1); // Loop indefinitely
      this.sounds[`music_${key}`] = music;
    } catch (error) {
      console.error(`❌ Error loading music '${key}':`, error);
    }
  }

  // Play a sound
  static async playSound(key: string, volume: number = 1.0, callback?: () => void) {
    // Ensure initialization is complete before checking settings
    await this.ensureInitialized();

    if (!this.settings.sfxEnabled) {
      console.log(`🔇 SFX disabled, skipping sound '${key}'`);
      if (callback) callback();
      return;
    }

    try {
      const sound = this.sounds[key];
      if (sound) {
        console.log(`🔊 Playing sound '${key}' at volume ${volume * this.settings.sfxVolume}`);
        sound.setVolume(volume * this.settings.sfxVolume);
        sound.play((success) => {
          if (success) {
            console.log(`✅ Sound '${key}' played successfully`);
          } else {
            console.error(`❌ Sound '${key}' failed to play`);
          }
          if (callback) callback();
        });
      } else {
        console.error(`❌ Sound '${key}' not found in loaded sounds`);
        if (callback) callback();
      }
    } catch (error) {
      console.error(`❌ Error playing sound '${key}':`, error);
      if (callback) callback();
    }
  }

  // Start background music for a game
  static async startGameMusic(game: 'morpion' | 'dominos' | 'puissance4' | 'wordsearch' | 'quizcouple') {
    // Ensure initialization is complete before checking settings
    await this.ensureInitialized();

    if (!this.settings.musicEnabled) {
      console.log(`🔇 Music disabled, skipping game music for '${game}'`);
      return;
    }

    // Stop current music if different game
    if (this.currentGame && this.currentGame !== game) {
      this.stopGameMusic();
    }

    const musicKey = `music_${game}`;
    const music = this.sounds[musicKey];

    if (music) {
      console.log(`🎵 Starting game music '${game}' at volume ${this.settings.musicVolume}`);
      this.backgroundMusic = music;
      this.currentGame = game;
      music.setVolume(this.settings.musicVolume);
      music.play();
    } else {
      console.error(`❌ Game music '${game}' not found in loaded sounds`);
    }
  }

  // Stop background music
  static stopGameMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic = null;
      this.currentGame = null;
    }
  }

  // Pause/Resume music
  static pauseGameMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  static async resumeGameMusic() {
    // Ensure initialization is complete before checking settings
    await this.ensureInitialized();

    if (this.backgroundMusic && this.settings.musicEnabled) {
      this.backgroundMusic.play();
    }
  }

  // Stop a sound
  static stopSound(key: string) {
    try {
      const sound = this.sounds[key];
      if (sound) {
        sound.stop();
      }
    } catch (error) {
      console.error('Error stopping sound:', key, error);
    }
  }

  // Stop all sounds
  static stopAllSounds() {
    try {
      Object.keys(this.sounds).forEach(key => {
        this.stopSound(key);
      });
    } catch (error) {
      console.error('Error stopping all sounds:', error);
    }
  }

  // Release resources
  static release() {
    try {
      Object.values(this.sounds).forEach(sound => {
        sound.release();
      });
      this.sounds = {};
    } catch (error) {
      console.error('Error releasing sounds:', error);
    }
  }

  // Play move sound based on symbol
  static playMoveSound(symbol: 'X' | 'O') {
    const soundKey = symbol === 'X' ? 'move_x' : 'move_o';
    this.playSound(soundKey, 0.7);
  }

  // Play win celebration sounds
  static playWinCelebration(callback?: () => void) {
    // Play applause first
    this.playSound('applause', 0.8, () => {
      // Then play fanfare
      setTimeout(() => {
        this.playSound('win_fanfare', 0.9, callback);
      }, 500);
    });
  }

  // Play draw sound
  static playDrawSound() {
    this.playSound('draw', 0.6);
  }

  // Play button click
  static playButtonClick() {
    this.playSound('button_click', 0.5);
  }

  // Play game start sound
  static playGameStart() {
    this.playSound('game_start', 0.7);
  }

  // Play game win sound
  static playGameWin() {
    this.playSound('win', 0.8);
  }

  // Play game end sound (draw/loss)
  static playGameEnd() {
    this.playSound('draw', 0.6);
  }

  // ========== HAPTIC FEEDBACK ==========

  // Trigger haptic feedback using React Native Vibration API
  static async haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
    // Ensure initialization is complete before checking settings
    await this.ensureInitialized();

    if (!this.settings.hapticEnabled) return;

    try {
      switch (type) {
        case 'light':
          Vibration.vibrate(10); // 10ms short vibration
          break;
        case 'medium':
          Vibration.vibrate(20); // 20ms medium vibration
          break;
        case 'heavy':
          Vibration.vibrate(40); // 40ms strong vibration
          break;
        case 'success':
          Vibration.vibrate([0, 10, 50, 10]); // Double tap pattern
          break;
        case 'warning':
          Vibration.vibrate([0, 20, 100, 20]); // Warning pattern
          break;
        case 'error':
          Vibration.vibrate([0, 30, 50, 30, 50, 30]); // Triple tap pattern
          break;
      }
    } catch (error) {
      console.error('Error triggering haptic:', error);
    }
  }

  // Combined sound + haptic
  static async playSoundWithHaptic(
    soundKey: string,
    volume: number = 1.0,
    hapticType: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
  ) {
    await this.playSound(soundKey, volume);
    await this.haptic(hapticType);
  }

  // ========== SETTINGS ==========

  // Update settings
  static async updateSettings(newSettings: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...newSettings };

    // Save to storage
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving sound settings:', error);
    }

    // Apply immediately
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolume(this.settings.musicVolume);

      if (!this.settings.musicEnabled) {
        this.pauseGameMusic();
      } else {
        this.resumeGameMusic();
      }
    }

  }

  // Get current settings
  static getSettings(): SoundSettings {
    return { ...this.settings };
  }

  // ========== QUICK HELPERS FOR GAMES ==========

  // Dominos
  static playTilePlace() {
    this.playSoundWithHaptic('tile_place', 0.7, 'medium');
  }

  static playTileSelect() {
    this.playSoundWithHaptic('tile_select', 0.5, 'light');
  }

  static playInvalidMove() {
    this.playSoundWithHaptic('invalid_move', 0.6, 'error');
  }

  // Quiz
  static playCorrectAnswer() {
    this.playSoundWithHaptic('correct', 0.8, 'success');
  }

  static playWrongAnswer() {
    this.playSoundWithHaptic('wrong', 0.7, 'error');
  }

  // Word Search
  static playWordFound() {
    this.playSoundWithHaptic('word_found', 0.8, 'success');
  }

  // Timer
  static playTimerTick() {
    this.playSound('timer_tick', 0.3);
  }

  static playTimerWarning() {
    this.playSoundWithHaptic('timer_warning', 0.8, 'warning');
  }
}

export default SoundService;