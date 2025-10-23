import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import RNFS from 'react-native-fs';
import { Song } from '../types/music';
import { fetchWithRetry } from '../utils/retryUtils';

export interface OfflineDownload {
  songId: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  localPath?: string;
  error?: string;
}

export class MusicService {
  private static MUSIC_CACHE_DIR = `${RNFS.DocumentDirectoryPath}/music_cache`;

  /**
   * Initialize music cache directory
   */
  static async initializeCacheDirectory(): Promise<void> {
    try {
      const exists = await RNFS.exists(this.MUSIC_CACHE_DIR);
      if (!exists) {
        await RNFS.mkdir(this.MUSIC_CACHE_DIR);
        console.log('Music cache directory created');
      }
    } catch (error) {
      console.error('Error creating cache directory:', error);
    }
  }

  /**
   * Upload song to Firebase Storage
   */
  static async uploadSongToFirebase(
    userId: string,
    localUri: string,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      await this.initializeCacheDirectory();

      const storagePath = `music/${userId}/${Date.now()}_${fileName}`;
      const storageRef = storage().ref(storagePath);

      const uploadTask = storageRef.putFile(localUri);

      if (onProgress) {
        uploadTask.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        });
      }

      await uploadTask;
      const downloadUrl = await storageRef.getDownloadURL();

      console.log('✅ Song uploaded to Firebase Storage');
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading song:', error);
      throw error;
    }
  }

  /**
   * Save song metadata to Firestore
   */
  static async saveSongToFirestore(userId: string, song: Omit<Song, 'id'>): Promise<string> {
    try {
      const songData = {
        ...song,
        userId,
        uploadedAt: firestore.Timestamp.now(),
        createdAt: firestore.Timestamp.now(),
      };

      const docRef = await fetchWithRetry(() =>
        firestore()
          .collection('users')
          .doc(userId)
          .collection('musicLibrary')
          .add(songData)
      );

      console.log('✅ Song metadata saved to Firestore');
      return docRef.id;
    } catch (error) {
      console.error('Error saving song to Firestore:', error);
      throw error;
    }
  }

  /**
   * Get user's songs from Firestore
   */
  static async getUserSongs(userId: string): Promise<Song[]> {
    try {
      const snapshot = await fetchWithRetry(() =>
        firestore()
          .collection('users')
          .doc(userId)
          .collection('musicLibrary')
          .orderBy('createdAt', 'desc')
          .get()
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Song));
    } catch (error) {
      console.error('Error getting user songs:', error);
      return [];
    }
  }

  /**
   * Download song for offline playback
   * Handles both Firebase URLs and bundled assets
   */
  static async downloadSongForOffline(
    song: Song,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      await this.initializeCacheDirectory();

      // Generate local file path
      const fileName = `${song.id}.mp3`;
      const localPath = `${this.MUSIC_CACHE_DIR}/${fileName}`;

      // Check if already downloaded
      const exists = await RNFS.exists(localPath);
      if (exists) {
        console.log('✅ Song already downloaded:', localPath);
        return localPath;
      }

      // For embedded songs (bundled assets)
      if (song.isEmbedded) {
        console.log('📦 Copying bundled song to cache:', song.uri);

        // Bundled songs use the "asset://" protocol or are loaded from require()
        // We need to copy them to local storage
        try {
          // The song.uri for bundled songs is a resource path
          // We'll need to copy the asset using RNFS
          const assetPath = song.uri.replace('asset://', '');

          // For Android, bundled assets are in the assets folder
          // Use RNFS.copyFileAssets for Android
          await RNFS.copyFileAssets(assetPath, localPath);

          console.log('✅ Bundled song copied to cache:', localPath);
          if (onProgress) onProgress(100);
          return localPath;
        } catch (assetError) {
          console.error('❌ Error copying bundled asset:', assetError);
          throw new Error('Failed to copy bundled song to cache');
        }
      }

      // For Firebase/uploaded songs
      if (!song.uri && !song.url) {
        throw new Error('Song URI/URL is required for download');
      }

      const downloadUrl = song.url || song.uri;

      // Download from Firebase Storage URL
      const downloadResult = await RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: localPath,
        progress: (res) => {
          if (onProgress) {
            const progress = (res.bytesWritten / res.contentLength) * 100;
            onProgress(progress);
          }
        },
      }).promise;

      if (downloadResult.statusCode === 200) {
        console.log('✅ Song downloaded successfully:', localPath);
        return localPath;
      } else {
        throw new Error(`Download failed with status ${downloadResult.statusCode}`);
      }
    } catch (error) {
      console.error('❌ Error downloading song:', error);
      throw error;
    }
  }

  /**
   * Check if song is available offline
   */
  static async isAvailableOffline(songId: string): Promise<boolean> {
    try {
      const fileName = `${songId}.mp3`;
      const localPath = `${this.MUSIC_CACHE_DIR}/${fileName}`;
      return await RNFS.exists(localPath);
    } catch (error) {
      console.error('Error checking offline availability:', error);
      return false;
    }
  }

  /**
   * Get offline song path
   */
  static async getOfflineSongPath(songId: string): Promise<string | null> {
    try {
      const fileName = `${songId}.mp3`;
      const localPath = `${this.MUSIC_CACHE_DIR}/${fileName}`;
      const exists = await RNFS.exists(localPath);
      return exists ? localPath : null;
    } catch (error) {
      console.error('Error getting offline song path:', error);
      return null;
    }
  }

  /**
   * Delete offline song
   */
  static async deleteOfflineSong(songId: string): Promise<void> {
    try {
      const fileName = `${songId}.mp3`;
      const localPath = `${this.MUSIC_CACHE_DIR}/${fileName}`;
      const exists = await RNFS.exists(localPath);

      if (exists) {
        await RNFS.unlink(localPath);
        console.log('✅ Offline song deleted');
      }
    } catch (error) {
      console.error('Error deleting offline song:', error);
      throw error;
    }
  }

  /**
   * Get cache size
   */
  static async getCacheSize(): Promise<number> {
    try {
      const exists = await RNFS.exists(this.MUSIC_CACHE_DIR);
      if (!exists) return 0;

      const files = await RNFS.readDir(this.MUSIC_CACHE_DIR);
      let totalSize = 0;

      for (const file of files) {
        totalSize += file.size;
      }

      return totalSize;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  /**
   * Clear all offline cache
   */
  static async clearCache(): Promise<void> {
    try {
      const exists = await RNFS.exists(this.MUSIC_CACHE_DIR);
      if (exists) {
        await RNFS.unlink(this.MUSIC_CACHE_DIR);
        await RNFS.mkdir(this.MUSIC_CACHE_DIR);
        console.log('✅ Music cache cleared');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Update song in Firestore
   */
  static async updateSong(userId: string, songId: string, updates: Partial<Song>): Promise<void> {
    try {
      await fetchWithRetry(() =>
        firestore()
          .collection('users')
          .doc(userId)
          .collection('musicLibrary')
          .doc(songId)
          .update({
            ...updates,
            updatedAt: firestore.Timestamp.now(),
          })
      );

      console.log('✅ Song updated in Firestore');
    } catch (error) {
      console.error('Error updating song:', error);
      throw error;
    }
  }

  /**
   * Delete song from Firestore
   */
  static async deleteSong(userId: string, songId: string): Promise<void> {
    try {
      // Delete from Firestore (with retry)
      await fetchWithRetry(() =>
        firestore()
          .collection('users')
          .doc(userId)
          .collection('musicLibrary')
          .doc(songId)
          .delete()
      );

      // Delete offline cache if exists
      await this.deleteOfflineSong(songId);

      console.log('✅ Song deleted');
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user's music library changes
   */
  static subscribeToUserSongs(
    userId: string,
    callback: (songs: Song[]) => void
  ): () => void {
    const unsubscribe = firestore()
      .collection('users')
      .doc(userId)
      .collection('musicLibrary')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          const songs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Song));
          callback(songs);
        },
        error => {
          console.error('Error subscribing to songs:', error);
        }
      );

    return unsubscribe;
  }

  /**
   * Share song with partner
   */
  static async shareSongWithPartner(
    userId: string,
    songId: string,
    partnerId: string
  ): Promise<void> {
    try {
      // Update song to mark as shared
      await this.updateSong(userId, songId, {
        isSharedWithPartner: true,
        partnerId,
      });

      console.log('✅ Song shared with partner');
    } catch (error) {
      console.error('Error sharing song:', error);
      throw error;
    }
  }

  /**
   * Unshare song
   */
  static async unshareSong(userId: string, songId: string): Promise<void> {
    try {
      await this.updateSong(userId, songId, {
        isSharedWithPartner: false,
        partnerId: undefined,
      });

      console.log('✅ Song unshared');
    } catch (error) {
      console.error('Error unsharing song:', error);
      throw error;
    }
  }
}

export default MusicService;
