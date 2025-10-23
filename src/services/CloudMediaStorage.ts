import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { MediaItem } from '../types/gallery';

class CloudMediaStorage {
  /**
   * Upload media file to Firebase Storage
   * Only called when sharing with partner
   */
  async uploadMediaFile(
    localUri: string,
    userId: string,
    mediaId: string,
    fileName: string
  ): Promise<string> {
    try {
      console.log('CloudMediaStorage: Starting upload...', {
        localUri: localUri?.substring(0, 50) + '...',
        userId,
        mediaId,
        fileName,
      });

      // Normalize the local URI for React Native Firebase
      // React Native Firebase expects the full URI including file:// on Android
      let normalizedUri = localUri;

      // Ensure the URI is properly formatted
      if (!localUri.startsWith('file://') && !localUri.startsWith('content://')) {
        // If it's just a path, add file:// prefix
        normalizedUri = 'file://' + localUri;
      }

      console.log('CloudMediaStorage: Normalized URI:', normalizedUri.substring(0, 80) + '...');

      // Create storage path: users/{userId}/shared_media/{mediaId}/{fileName}
      const storagePath = `users/${userId}/shared_media/${mediaId}/${fileName}`;
      console.log('CloudMediaStorage: Storage path:', storagePath);

      const reference = storage().ref(storagePath);

      // Upload file with progress monitoring
      console.log('CloudMediaStorage: Uploading file...');
      const task = reference.putFile(normalizedUri);

      // Monitor upload progress
      task.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('CloudMediaStorage: Upload progress:', progress.toFixed(2) + '%');
      });

      await task;
      console.log('CloudMediaStorage: Upload complete, getting download URL...');

      // Get download URL
      const downloadUrl = await reference.getDownloadURL();
      console.log('CloudMediaStorage: Download URL obtained:', downloadUrl.substring(0, 50) + '...');

      return downloadUrl;
    } catch (error) {
      console.error('CloudMediaStorage: Error uploading media to Firebase Storage:', error);
      if (error instanceof Error) {
        console.error('CloudMediaStorage: Error message:', error.message);
        console.error('CloudMediaStorage: Error stack:', error.stack);
      }
      throw new Error(`Failed to upload media to cloud storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload media metadata to Firestore
   * Only called when sharing with partner
   */
  async uploadMediaMetadata(
    media: MediaItem,
    downloadUrl: string,
    userId: string,
    partnerId: string
  ): Promise<void> {
    try {
      console.log('CloudMediaStorage: Uploading metadata...', {
        mediaId: media.id,
        userId,
        partnerId,
      });

      // Generate couple ID (sorted to ensure consistency)
      const coupleId = [userId, partnerId].sort().join('_');
      console.log('CloudMediaStorage: Couple ID:', coupleId);

      // First, ensure the couple document exists
      const coupleDocRef = firestore().collection('sharedMedia').doc(coupleId);
      const coupleDoc = await coupleDocRef.get();

      if (!coupleDoc.exists) {
        console.log('CloudMediaStorage: Creating couple document...');
        await coupleDocRef.set({
          user1Id: [userId, partnerId].sort()[0],
          user2Id: [userId, partnerId].sort()[1],
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastActivity: firestore.FieldValue.serverTimestamp(),
        });
        console.log('CloudMediaStorage: Couple document created');
      }

      // Save to sharedMedia/{coupleId}/media/{mediaId} collection
      console.log('CloudMediaStorage: Saving media metadata...');
      await coupleDocRef
        .collection('media')
        .doc(media.id)
        .set({
          id: media.id,
          uploadedBy: userId,
          partnerId: partnerId,
          url: downloadUrl,
          thumbnailUrl: downloadUrl, // Can generate thumbnail later
          type: media.type,
          title: media.title || '',
          description: media.description || '',
          tags: media.tags || [],
          isFavorite: media.isFavorite || false,
          metadata: media.metadata || {},
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
          isArchived: false,
        });

      console.log('CloudMediaStorage: Metadata saved successfully');
    } catch (error) {
      console.error('CloudMediaStorage: Error uploading media metadata to Firestore:', error);
      if (error instanceof Error) {
        console.error('CloudMediaStorage: Error message:', error.message);
      }
      throw new Error('Failed to save media metadata');
    }
  }

  /**
   * Download media file from Firebase Storage
   */
  async downloadMediaFile(downloadUrl: string, localPath: string): Promise<string> {
    try {
      const reference = storage().refFromURL(downloadUrl);
      await reference.writeToFile(localPath);
      return localPath;
    } catch (error) {
      console.error('Error downloading media from Firebase Storage:', error);
      throw new Error('Failed to download media from cloud storage');
    }
  }

  /**
   * Get all shared media for user (as owner or recipient)
   */
  async getSharedMedia(userId: string, partnerId: string): Promise<MediaItem[]> {
    try {
      if (!partnerId) {
        console.warn('No partnerId provided for getSharedMedia');
        return [];
      }

      // Generate couple ID
      const coupleId = [userId, partnerId].sort().join('_');

      // Get media from sharedMedia/{coupleId}/media collection
      const snapshot = await firestore()
        .collection('sharedMedia')
        .doc(coupleId)
        .collection('media')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          uri: data.url,
          thumbnailUrl: data.thumbnailUrl,
          type: data.type as 'photo' | 'video',
          title: data.title,
          description: data.description,
          tags: data.tags,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          authorId: data.uploadedBy,
          authorName: '',
          fileName: data.metadata?.fileName || '',
          fileSize: data.metadata?.size || 0,
          mimeType: data.type === 'photo' ? 'image/jpeg' : 'video/mp4',
          isFavorite: data.isFavorite,
          isSharedWithPartner: true,
          isArchived: data.isArchived,
          visibility: 'shared',
          metadata: data.metadata,
          reactions: [],
          comments: [],
        } as MediaItem;
      });
    } catch (error) {
      console.error('Error getting shared media from Firestore:', error);
      return [];
    }
  }

  /**
   * Delete media from Firebase Storage and Firestore
   */
  async deleteSharedMedia(mediaId: string, userId: string, partnerId: string): Promise<void> {
    try {
      if (!partnerId) {
        throw new Error('Partner ID required to delete shared media');
      }

      // Generate couple ID
      const coupleId = [userId, partnerId].sort().join('_');

      // Delete from Firestore
      await firestore()
        .collection('sharedMedia')
        .doc(coupleId)
        .collection('media')
        .doc(mediaId)
        .delete();

      // Delete from Storage
      // Get all files in the media folder
      const storagePath = `users/${userId}/shared_media/${mediaId}`;
      const reference = storage().ref(storagePath);

      try {
        const items = await reference.listAll();
        await Promise.all(items.items.map(item => item.delete()));
      } catch (error) {
        // Folder might not exist or already deleted
        console.warn('Storage delete error:', error);
      }
    } catch (error) {
      console.error('Error deleting shared media:', error);
      throw new Error('Failed to delete shared media');
    }
  }

  /**
   * Update shared media metadata in Firestore
   */
  async updateSharedMediaMetadata(mediaId: string, userId: string, partnerId: string, updates: Partial<MediaItem>): Promise<void> {
    try {
      if (!partnerId) {
        throw new Error('Partner ID required to update shared media');
      }

      // Generate couple ID
      const coupleId = [userId, partnerId].sort().join('_');

      const updateData: any = {
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.isFavorite !== undefined) updateData.isFavorite = updates.isFavorite;
      if (updates.isArchived !== undefined) updateData.isArchived = updates.isArchived;

      await firestore()
        .collection('sharedMedia')
        .doc(coupleId)
        .collection('media')
        .doc(mediaId)
        .update(updateData);
    } catch (error) {
      console.error('Error updating shared media metadata:', error);
      throw new Error('Failed to update shared media');
    }
  }

  /**
   * Unshare media (remove from Firestore and Storage)
   */
  async unshareMedia(mediaId: string, userId: string, partnerId: string): Promise<void> {
    try {
      await this.deleteSharedMedia(mediaId, userId, partnerId);
    } catch (error) {
      console.error('Error unsharing media:', error);
      throw new Error('Failed to unshare media');
    }
  }

  /**
   * Listen to real-time updates for shared media
   */
  subscribeToSharedMedia(
    userId: string,
    partnerId: string,
    onUpdate: (media: MediaItem[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (!partnerId) {
      console.warn('No partnerId provided for subscribeToSharedMedia');
      return () => {};
    }

    // Generate couple ID
    const coupleId = [userId, partnerId].sort().join('_');

    const unsubscribe = firestore()
      .collection('sharedMedia')
      .doc(coupleId)
      .collection('media')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          const media = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: data.id,
              uri: data.url,
              thumbnailUrl: data.thumbnailUrl,
              type: data.type as 'photo' | 'video',
              title: data.title,
              description: data.description,
              tags: data.tags,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              authorId: data.uploadedBy,
              authorName: '',
              fileName: data.metadata?.fileName || '',
              fileSize: data.metadata?.size || 0,
              mimeType: data.type === 'photo' ? 'image/jpeg' : 'video/mp4',
              isFavorite: data.isFavorite,
              isSharedWithPartner: true,
              isArchived: data.isArchived,
              visibility: 'shared',
              metadata: data.metadata,
              reactions: [],
              comments: [],
            } as MediaItem;
          });

          onUpdate(media);
        },
        error => {
          if (onError) {
            onError(error);
          }
        }
      );

    return unsubscribe;
  }

  /**
   * Get storage usage for user's shared media
   */
  async getStorageUsage(userId: string): Promise<number> {
    try {
      const storagePath = `users/${userId}/shared_media`;
      const reference = storage().ref(storagePath);

      const items = await reference.listAll();
      let totalSize = 0;

      for (const item of items.items) {
        const metadata = await item.getMetadata();
        totalSize += metadata.size || 0;
      }

      return totalSize;
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return 0;
    }
  }
}

export default new CloudMediaStorage();