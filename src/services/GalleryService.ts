import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {
  MediaItem,
  Album,
  MediaReaction,
  MediaComment,
  MemoryTimeline,
  GalleryFilter,
  MediaUpload
} from '../types/gallery';
import { fetchWithRetry } from '../utils/retryUtils';

class GalleryService {
  private readonly USERS_COLLECTION = 'users';
  private readonly MEDIA_COLLECTION = 'media';
  private readonly ALBUMS_COLLECTION = 'albums';
  private readonly SHARED_MEDIA_COLLECTION = 'sharedMedia';
  private readonly MEMORIES_COLLECTION = 'memories';

  // Clean data before Firebase upload to avoid undefined values
  private cleanMediaData(data: any): any {
    const cleaned = { ...data };

    // Remove undefined values
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      } else if (typeof cleaned[key] === 'object' && cleaned[key] !== null && !Array.isArray(cleaned[key])) {
        if (cleaned[key] instanceof Date) {
          // Keep Date objects as is
          return;
        }
        cleaned[key] = this.cleanMediaData(cleaned[key]);
      }
    });

    return cleaned;
  }

  // Media CRUD Operations
  async createMedia(userId: string, mediaData: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const cleanData = this.cleanMediaData({
        ...mediaData,
        createdAt: now,
        updatedAt: now,
        reactions: [],
        comments: []
      });

      const docRef = await fetchWithRetry(() =>
        firestore()
          .collection(this.USERS_COLLECTION)
          .doc(userId)
          .collection(this.MEDIA_COLLECTION)
          .add(cleanData)
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating media:', error);
      throw error;
    }
  }

  async updateMedia(userId: string, mediaId: string, updates: Partial<MediaItem>): Promise<void> {
    try {
      const cleanUpdates = this.cleanMediaData({
        ...updates,
        updatedAt: new Date()
      });

      await fetchWithRetry(() =>
        firestore()
          .collection(this.USERS_COLLECTION)
          .doc(userId)
          .collection(this.MEDIA_COLLECTION)
          .doc(mediaId)
          .update(cleanUpdates)
      );
    } catch (error) {
      console.error('Error updating media:', error);
      throw error;
    }
  }

  async deleteMedia(userId: string, mediaId: string): Promise<void> {
    try {
      // Get media data first to delete associated files (with retry)
      const mediaDoc = await fetchWithRetry(() =>
        firestore()
          .collection(this.USERS_COLLECTION)
          .doc(userId)
          .collection(this.MEDIA_COLLECTION)
          .doc(mediaId)
          .get()
      );

      if (mediaDoc.exists) {
        const mediaData = mediaDoc.data() as MediaItem;

        // Delete files from storage
        if (mediaData.cloudStorageUrl) {
          const storageRef = storage().refFromURL(mediaData.cloudStorageUrl);
          await storageRef.delete().catch(console.warn);
        }
        if (mediaData.thumbnailUrl) {
          const thumbnailRef = storage().refFromURL(mediaData.thumbnailUrl);
          await thumbnailRef.delete().catch(console.warn);
        }
      }

      // Delete document (with retry)
      await fetchWithRetry(() =>
        firestore()
          .collection(this.USERS_COLLECTION)
          .doc(userId)
          .collection(this.MEDIA_COLLECTION)
          .doc(mediaId)
          .delete()
      );
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }

  getUserMedia(userId: string, filter?: GalleryFilter) {
    let query = firestore()
      .collection(this.USERS_COLLECTION)
      .doc(userId)
      .collection(this.MEDIA_COLLECTION);

    // Apply filters
    if (filter?.type && filter.type !== 'all') {
      query = query.where('type', '==', filter.type);
    }

    if (filter?.albumId) {
      query = query.where('albumId', '==', filter.albumId);
    }

    if (filter?.isFavorite !== undefined) {
      query = query.where('isFavorite', '==', filter.isFavorite);
    }

    if (filter?.isArchived !== undefined) {
      query = query.where('isArchived', '==', filter.isArchived);
    }

    if (filter?.isSharedWithPartner !== undefined) {
      query = query.where('isSharedWithPartner', '==', filter.isSharedWithPartner);
    }

    return query.orderBy('createdAt', 'desc');
  }

  // File Upload
  async uploadMedia(userId: string, localUri: string, fileName: string, onProgress?: (progress: number) => void): Promise<{ downloadUrl: string; thumbnailUrl?: string }> {
    try {
      const reference = storage().ref(`users/${userId}/media/${fileName}`);

      const task = reference.putFile(localUri);

      if (onProgress) {
        task.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        });
      }

      await task;
      const downloadUrl = await reference.getDownloadURL();

      return { downloadUrl };
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Albums
  async createAlbum(userId: string, albumData: Omit<Album, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const cleanData = this.cleanMediaData({
        ...albumData,
        createdAt: now,
        updatedAt: now,
        mediaCount: 0,
        totalSize: 0
      });

      const docRef = await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection(this.ALBUMS_COLLECTION)
        .add(cleanData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating album:', error);
      throw error;
    }
  }

  async updateAlbum(userId: string, albumId: string, updates: Partial<Album>): Promise<void> {
    try {
      const cleanUpdates = this.cleanMediaData({
        ...updates,
        updatedAt: new Date()
      });

      await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection(this.ALBUMS_COLLECTION)
        .doc(albumId)
        .update(cleanUpdates);
    } catch (error) {
      console.error('Error updating album:', error);
      throw error;
    }
  }

  getUserAlbums(userId: string) {
    return firestore()
      .collection(this.USERS_COLLECTION)
      .doc(userId)
      .collection(this.ALBUMS_COLLECTION)
      .where('isArchived', '==', false)
      .orderBy('createdAt', 'desc');
  }

  // Sharing
  async shareMediaWithPartner(userId: string, mediaId: string, partnerId: string): Promise<void> {
    try {
      const coupleId = this.generateCoupleId(userId, partnerId);

      // Get the media document
      const mediaDoc = await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection(this.MEDIA_COLLECTION)
        .doc(mediaId)
        .get();

      if (!mediaDoc.exists) {
        throw new Error('Media not found');
      }

      const mediaData = mediaDoc.data() as MediaItem;

      // Update original media
      await this.updateMedia(userId, mediaId, {
        isSharedWithPartner: true,
        visibility: 'shared'
      });

      // Add to shared collection
      await firestore()
        .collection(this.SHARED_MEDIA_COLLECTION)
        .doc(coupleId)
        .collection('media')
        .doc(mediaId)
        .set(this.cleanMediaData({
          ...mediaData,
          id: mediaId,
          isSharedWithPartner: true,
          visibility: 'shared',
          updatedAt: new Date()
        }));
    } catch (error) {
      console.error('Error sharing media:', error);
      throw error;
    }
  }

  async unshareMedia(userId: string, mediaId: string, partnerId: string): Promise<void> {
    try {
      const coupleId = this.generateCoupleId(userId, partnerId);

      // Update original media
      await this.updateMedia(userId, mediaId, {
        isSharedWithPartner: false,
        visibility: 'private'
      });

      // Remove from shared collection
      await firestore()
        .collection(this.SHARED_MEDIA_COLLECTION)
        .doc(coupleId)
        .collection('media')
        .doc(mediaId)
        .delete();
    } catch (error) {
      console.error('Error unsharing media:', error);
      throw error;
    }
  }

  getSharedMedia(coupleId: string) {
    return firestore()
      .collection(this.SHARED_MEDIA_COLLECTION)
      .doc(coupleId)
      .collection('media')
      .orderBy('createdAt', 'desc');
  }

  // Reactions
  async addReaction(userId: string, mediaId: string, emoji: MediaReaction['emoji'], isSharedMedia = false, coupleId?: string): Promise<void> {
    try {
      const collection = isSharedMedia && coupleId
        ? firestore().collection(this.SHARED_MEDIA_COLLECTION).doc(coupleId).collection('media')
        : firestore().collection(this.USERS_COLLECTION).doc(userId).collection(this.MEDIA_COLLECTION);

      const mediaDoc = await collection.doc(mediaId).get();

      if (!mediaDoc.exists) {
        throw new Error('Media not found');
      }

      const mediaData = mediaDoc.data() as MediaItem;
      const existingReactionIndex = mediaData.reactions.findIndex(r => r.userId === userId);

      if (existingReactionIndex >= 0) {
        // Update existing reaction
        mediaData.reactions[existingReactionIndex] = {
          ...mediaData.reactions[existingReactionIndex],
          emoji,
          createdAt: new Date()
        };
      } else {
        // Add new reaction
        mediaData.reactions.push({
          id: firestore().collection('temp').doc().id,
          userId,
          userName: 'User', // Get from context
          emoji,
          createdAt: new Date()
        });
      }

      await collection.doc(mediaId).update({
        reactions: mediaData.reactions,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Comments
  async addComment(userId: string, userName: string, mediaId: string, content: string, isSharedMedia = false, coupleId?: string): Promise<void> {
    try {
      const collection = isSharedMedia && coupleId
        ? firestore().collection(this.SHARED_MEDIA_COLLECTION).doc(coupleId).collection('media')
        : firestore().collection(this.USERS_COLLECTION).doc(userId).collection(this.MEDIA_COLLECTION);

      const mediaDoc = await collection.doc(mediaId).get();

      if (!mediaDoc.exists) {
        throw new Error('Media not found');
      }

      const mediaData = mediaDoc.data() as MediaItem;
      const newComment: MediaComment = {
        id: firestore().collection('temp').doc().id,
        userId,
        userName,
        content,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mediaData.comments.push(newComment);

      await collection.doc(mediaId).update({
        comments: mediaData.comments,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Memory Timeline
  async createMemory(userId: string, memoryData: Omit<MemoryTimeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const cleanData = this.cleanMediaData({
        ...memoryData,
        createdAt: now,
        updatedAt: now
      });

      const docRef = await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection(this.MEMORIES_COLLECTION)
        .add(cleanData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating memory:', error);
      throw error;
    }
  }

  getUserMemories(userId: string) {
    return firestore()
      .collection(this.USERS_COLLECTION)
      .doc(userId)
      .collection(this.MEMORIES_COLLECTION)
      .orderBy('date', 'desc');
  }

  // Utility functions
  convertFirebaseMedia(firebaseData: any): MediaItem {
    return {
      ...firebaseData,
      createdAt: firebaseData.createdAt?.toDate() || new Date(),
      updatedAt: firebaseData.updatedAt?.toDate() || new Date(),
      reactions: firebaseData.reactions?.map((r: any) => ({
        ...r,
        createdAt: r.createdAt?.toDate() || new Date()
      })) || [],
      comments: firebaseData.comments?.map((c: any) => ({
        ...c,
        createdAt: c.createdAt?.toDate() || new Date(),
        updatedAt: c.updatedAt?.toDate() || new Date()
      })) || []
    };
  }

  convertFirebaseAlbum(firebaseData: any): Album {
    return {
      ...firebaseData,
      createdAt: firebaseData.createdAt?.toDate() || new Date(),
      updatedAt: firebaseData.updatedAt?.toDate() || new Date()
    };
  }

  convertFirebaseMemory(firebaseData: any): MemoryTimeline {
    return {
      ...firebaseData,
      date: firebaseData.date?.toDate() || new Date(),
      createdAt: firebaseData.createdAt?.toDate() || new Date(),
      updatedAt: firebaseData.updatedAt?.toDate() || new Date()
    };
  }

  private generateCoupleId(user1Id: string, user2Id: string): string {
    return [user1Id, user2Id].sort().join('_');
  }
}

export default new GalleryService();