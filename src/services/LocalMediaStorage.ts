import AsyncStorage from '@react-native-async-storage/async-storage';
import { MediaItem } from '../types/gallery';

const MEDIA_STORAGE_KEY = '@itsyou_local_media';
const MEDIA_INDEX_KEY = '@itsyou_media_index';

interface LocalMediaIndex {
  [mediaId: string]: {
    localUri: string;
    isShared: boolean;
    cloudUrl?: string;
  };
}

class LocalMediaStorage {
  /**
   * Save media metadata to AsyncStorage
   */
  async saveMediaMetadata(media: MediaItem): Promise<void> {
    try {
      console.log('LocalMediaStorage: Saving media metadata for:', media.id);
      const existingData = await this.getAllMediaMetadata();

      // Serialize Date objects to ISO strings before saving
      const serializedMedia = {
        ...media,
        createdAt: media.createdAt instanceof Date ? media.createdAt.toISOString() : media.createdAt,
        updatedAt: media.updatedAt instanceof Date ? media.updatedAt.toISOString() : media.updatedAt,
      };

      existingData[media.id] = serializedMedia as any;

      console.log('LocalMediaStorage: Saving to AsyncStorage...');
      await AsyncStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(existingData));
      console.log('LocalMediaStorage: Save complete');
    } catch (error) {
      console.error('Error saving media metadata:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get all media metadata from AsyncStorage
   */
  async getAllMediaMetadata(): Promise<{ [id: string]: MediaItem }> {
    try {
      const data = await AsyncStorage.getItem(MEDIA_STORAGE_KEY);
      if (!data) return {};

      const parsed = JSON.parse(data);

      // Convert date strings back to Date objects
      Object.keys(parsed).forEach(key => {
        if (parsed[key].createdAt && typeof parsed[key].createdAt === 'string') {
          parsed[key].createdAt = new Date(parsed[key].createdAt);
        }
        if (parsed[key].updatedAt && typeof parsed[key].updatedAt === 'string') {
          parsed[key].updatedAt = new Date(parsed[key].updatedAt);
        }
      });

      return parsed;
    } catch (error) {
      console.error('Error getting media metadata:', error);
      return {};
    }
  }

  /**
   * Get single media metadata
   */
  async getMediaMetadata(mediaId: string): Promise<MediaItem | null> {
    try {
      const allMedia = await this.getAllMediaMetadata();
      const media = allMedia[mediaId] || null;

      // Ensure dates are Date objects
      if (media) {
        if (media.createdAt && typeof media.createdAt === 'string') {
          media.createdAt = new Date(media.createdAt);
        }
        if (media.updatedAt && typeof media.updatedAt === 'string') {
          media.updatedAt = new Date(media.updatedAt);
        }
      }

      return media;
    } catch (error) {
      console.error('Error getting media metadata:', error);
      return null;
    }
  }

  /**
   * Update media metadata
   */
  async updateMediaMetadata(mediaId: string, updates: Partial<MediaItem>): Promise<void> {
    try {
      const allMedia = await this.getAllMediaMetadata();
      if (allMedia[mediaId]) {
        // Serialize Date objects in updates
        const serializedUpdates = { ...updates };
        if (updates.createdAt instanceof Date) {
          (serializedUpdates as any).createdAt = updates.createdAt.toISOString();
        }
        if (updates.updatedAt instanceof Date) {
          (serializedUpdates as any).updatedAt = updates.updatedAt.toISOString();
        }

        allMedia[mediaId] = { ...allMedia[mediaId], ...serializedUpdates };
        await AsyncStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(allMedia));
      }
    } catch (error) {
      console.error('Error updating media metadata:', error);
      throw error;
    }
  }

  /**
   * Delete media metadata
   */
  async deleteMediaMetadata(mediaId: string): Promise<void> {
    try {
      const allMedia = await this.getAllMediaMetadata();
      delete allMedia[mediaId];
      await AsyncStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(allMedia));
    } catch (error) {
      console.error('Error deleting media metadata:', error);
      throw error;
    }
  }

  /**
   * Save media index (mapping between media ID and local/cloud URIs)
   */
  async saveMediaIndex(mediaId: string, localUri: string, isShared: boolean = false, cloudUrl?: string): Promise<void> {
    try {
      const index = await this.getMediaIndex();
      index[mediaId] = {
        localUri,
        isShared,
        cloudUrl,
      };
      await AsyncStorage.setItem(MEDIA_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Error saving media index:', error);
      throw error;
    }
  }

  /**
   * Get media index
   */
  async getMediaIndex(): Promise<LocalMediaIndex> {
    try {
      const data = await AsyncStorage.getItem(MEDIA_INDEX_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting media index:', error);
      return {};
    }
  }

  /**
   * Get local URI for a media item
   */
  async getLocalUri(mediaId: string): Promise<string | null> {
    try {
      const index = await this.getMediaIndex();
      return index[mediaId]?.localUri || null;
    } catch (error) {
      console.error('Error getting local URI:', error);
      return null;
    }
  }

  /**
   * Update media index when sharing with partner
   */
  async markAsShared(mediaId: string, cloudUrl: string): Promise<void> {
    try {
      const index = await this.getMediaIndex();
      if (index[mediaId]) {
        index[mediaId].isShared = true;
        index[mediaId].cloudUrl = cloudUrl;
        await AsyncStorage.setItem(MEDIA_INDEX_KEY, JSON.stringify(index));
      }
    } catch (error) {
      console.error('Error marking as shared:', error);
      throw error;
    }
  }

  /**
   * Update media index when unsharing
   */
  async markAsUnshared(mediaId: string): Promise<void> {
    try {
      const index = await this.getMediaIndex();
      if (index[mediaId]) {
        index[mediaId].isShared = false;
        index[mediaId].cloudUrl = undefined;
        await AsyncStorage.setItem(MEDIA_INDEX_KEY, JSON.stringify(index));
      }
    } catch (error) {
      console.error('Error marking as unshared:', error);
      throw error;
    }
  }

  /**
   * Get all local media (not shared)
   */
  async getLocalMediaList(): Promise<MediaItem[]> {
    try {
      const allMedia = await this.getAllMediaMetadata();
      const index = await this.getMediaIndex();

      return Object.values(allMedia).filter(
        media => !index[media.id]?.isShared
      );
    } catch (error) {
      console.error('Error getting local media list:', error);
      return [];
    }
  }

  /**
   * Get all shared media
   */
  async getSharedMediaList(): Promise<MediaItem[]> {
    try {
      const allMedia = await this.getAllMediaMetadata();
      const index = await this.getMediaIndex();

      return Object.values(allMedia).filter(
        media => index[media.id]?.isShared
      );
    } catch (error) {
      console.error('Error getting shared media list:', error);
      return [];
    }
  }

  /**
   * Check if media is stored locally
   */
  async isStoredLocally(mediaId: string): Promise<boolean> {
    try {
      const index = await this.getMediaIndex();
      return !!index[mediaId]?.localUri && !index[mediaId]?.isShared;
    } catch (error) {
      console.error('Error checking local storage:', error);
      return false;
    }
  }

  /**
   * Check if media is shared
   */
  async isShared(mediaId: string): Promise<boolean> {
    try {
      const index = await this.getMediaIndex();
      return index[mediaId]?.isShared || false;
    } catch (error) {
      console.error('Error checking shared status:', error);
      return false;
    }
  }

  /**
   * Clear all local media storage (for logout/reset)
   */
  async clearAllLocalMedia(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([MEDIA_STORAGE_KEY, MEDIA_INDEX_KEY]);
    } catch (error) {
      console.error('Error clearing local media:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalMedia: number;
    localMedia: number;
    sharedMedia: number;
    totalSize: number;
  }> {
    try {
      const allMedia = await this.getAllMediaMetadata();
      const index = await this.getMediaIndex();

      const mediaList = Object.values(allMedia);
      const localMedia = mediaList.filter(m => !index[m.id]?.isShared);
      const sharedMedia = mediaList.filter(m => index[m.id]?.isShared);
      const totalSize = mediaList.reduce((sum, m) => sum + (m.metadata?.size || 0), 0);

      return {
        totalMedia: mediaList.length,
        localMedia: localMedia.length,
        sharedMedia: sharedMedia.length,
        totalSize,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalMedia: 0,
        localMedia: 0,
        sharedMedia: 0,
        totalSize: 0,
      };
    }
  }
}

export default new LocalMediaStorage();