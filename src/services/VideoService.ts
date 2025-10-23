/**
 * VideoService
 *
 * Service for managing video uploads, storage, and Firestore operations
 */

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import { Video, VideoMetadata, VideoUploadProgress, WatchParty, VideoComment } from '../types/video.types';

const VIDEOS_COLLECTION = 'videos';
const WATCH_PARTIES_COLLECTION = 'watchParties';
const VIDEO_COMMENTS_COLLECTION = 'videoComments';

export class VideoService {
  /**
   * Upload a thumbnail to Firebase Storage
   */
  private static async uploadThumbnail(
    userId: string,
    thumbnailUri: string,
    videoFilename: string
  ): Promise<string> {
    try {
      console.log('📸 Uploading video thumbnail...');

      const thumbnailFilename = `thumb_${videoFilename}.jpg`;
      const thumbnailRef = storage().ref(`videos/${userId}/thumbnails/${thumbnailFilename}`);

      await thumbnailRef.putFile(thumbnailUri);
      const thumbnailUrl = await thumbnailRef.getDownloadURL();

      console.log('✅ Thumbnail uploaded to Storage');
      return thumbnailUrl;
    } catch (error) {
      console.error('❌ Error uploading thumbnail:', error);
      // Don't fail video upload if thumbnail fails
      return '';
    }
  }

  /**
   * Upload a video to Firebase Storage and save metadata to Firestore
   */
  static async uploadVideo(
    videoUri: string,
    metadata: VideoMetadata,
    onProgress?: (progress: VideoUploadProgress) => void
  ): Promise<string> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('NOT_AUTHENTICATED');
      }

      console.log('📹 Uploading video...');

      const filename = `${currentUser.uid}_${Date.now()}.mp4`;
      const reference = storage().ref(`videos/${currentUser.uid}/${filename}`);

      // Get user data for partner info
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const userData = userDoc.data();
      const partnerId = userData?.partnerId || null;
      const partnerName = userData?.partnerName || null;

      // Upload thumbnail first if provided
      let thumbnailUrl = '';
      if (metadata.thumbnailUri) {
        thumbnailUrl = await this.uploadThumbnail(currentUser.uid, metadata.thumbnailUri, filename);
      }

      // Upload video with progress tracking
      const uploadTask = reference.putFile(videoUri);

      uploadTask.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({
          videoId: '',
          progress,
          status: 'uploading',
        });
      });

      await uploadTask;

      // Get download URL
      const downloadUrl = await reference.getDownloadURL();

      console.log('✅ Video uploaded to Storage');

      // Save metadata to Firestore
      const videoData: Omit<Video, 'id' | 'createdAt'> = {
        uri: downloadUrl,
        thumbnailUri: thumbnailUrl || metadata.thumbnailUri,
        title: metadata.title,
        description: metadata.description,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        size: metadata.size,
        uploadedBy: currentUser.uid,
        uploaderName: userData?.name || 'Vous',
        partnerId,
        partnerName,
        isSharedWithPartner: false,
        views: 0,
      };

      const docRef = await firestore()
        .collection(VIDEOS_COLLECTION)
        .add({
          ...videoData,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Video metadata saved to Firestore:', docRef.id);

      onProgress?.({
        videoId: docRef.id,
        progress: 100,
        status: 'completed',
      });

      return docRef.id;
    } catch (error) {
      console.error('❌ Error uploading video:', error);
      onProgress?.({
        videoId: '',
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all videos for the current user
   */
  static async getUserVideos(): Promise<Video[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return [];

      const querySnapshot = await firestore()
        .collection(VIDEOS_COLLECTION)
        .where('uploadedBy', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get();

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastViewedAt: doc.data().lastViewedAt?.toDate(),
      } as Video));
    } catch (error) {
      console.error('❌ Error getting user videos:', error);
      return [];
    }
  }

  /**
   * Get all videos from partner
   */
  static async getPartnerVideos(): Promise<Video[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return [];

      // Get partner ID
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const partnerId = userDoc.data()?.partnerId;
      if (!partnerId) return [];

      const querySnapshot = await firestore()
        .collection(VIDEOS_COLLECTION)
        .where('uploadedBy', '==', partnerId)
        .where('isSharedWithPartner', '==', true)
        .orderBy('createdAt', 'desc')
        .get();

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastViewedAt: doc.data().lastViewedAt?.toDate(),
      } as Video));
    } catch (error) {
      console.error('❌ Error getting partner videos:', error);
      return [];
    }
  }

  /**
   * Get all videos (user + partner)
   */
  static async getAllVideos(): Promise<Video[]> {
    try {
      const [userVideos, partnerVideos] = await Promise.all([
        this.getUserVideos(),
        this.getPartnerVideos(),
      ]);

      return [...userVideos, ...partnerVideos].sort((a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (error) {
      console.error('❌ Error getting all videos:', error);
      return [];
    }
  }

  /**
   * Get a single video by ID
   */
  static async getVideoById(videoId: string): Promise<Video | null> {
    try {
      const doc = await firestore()
        .collection(VIDEOS_COLLECTION)
        .doc(videoId)
        .get();

      if (!doc.exists) return null;

      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate(),
        lastViewedAt: data?.lastViewedAt?.toDate(),
      } as Video;
    } catch (error) {
      console.error('❌ Error getting video:', error);
      return null;
    }
  }

  /**
   * Update video metadata
   */
  static async updateVideo(
    videoId: string,
    updates: Partial<Video>
  ): Promise<void> {
    try {
      await firestore()
        .collection(VIDEOS_COLLECTION)
        .doc(videoId)
        .update({
          ...updates,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Video updated:', videoId);
    } catch (error) {
      console.error('❌ Error updating video:', error);
      throw error;
    }
  }

  /**
   * Delete a video
   */
  static async deleteVideo(videoId: string, videoUri: string): Promise<void> {
    try {
      // Delete from Storage
      const ref = storage().refFromURL(videoUri);
      await ref.delete();

      // Delete from Firestore
      await firestore()
        .collection(VIDEOS_COLLECTION)
        .doc(videoId)
        .delete();

      console.log('✅ Video deleted:', videoId);
    } catch (error) {
      console.error('❌ Error deleting video:', error);
      throw error;
    }
  }

  /**
   * Share video with partner
   */
  static async shareWithPartner(videoId: string): Promise<void> {
    try {
      await firestore()
        .collection(VIDEOS_COLLECTION)
        .doc(videoId)
        .update({
          isSharedWithPartner: true,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Video shared with partner:', videoId);
    } catch (error) {
      console.error('❌ Error sharing video:', error);
      throw error;
    }
  }

  /**
   * Unshare video with partner
   */
  static async unshareWithPartner(videoId: string): Promise<void> {
    try {
      await firestore()
        .collection(VIDEOS_COLLECTION)
        .doc(videoId)
        .update({
          isSharedWithPartner: false,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Video unshared with partner:', videoId);
    } catch (error) {
      console.error('❌ Error unsharing video:', error);
      throw error;
    }
  }

  /**
   * Track video view
   */
  static async trackView(videoId: string): Promise<void> {
    try {
      await firestore()
        .collection(VIDEOS_COLLECTION)
        .doc(videoId)
        .update({
          views: firestore.FieldValue.increment(1),
          lastViewedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('❌ Error tracking view:', error);
    }
  }

  /**
   * Save video playback position
   */
  static async savePosition(videoId: string, position: number): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      await firestore()
        .collection(VIDEOS_COLLECTION)
        .doc(videoId)
        .update({
          [`positions.${currentUser.uid}`]: position,
        });
    } catch (error) {
      console.error('❌ Error saving position:', error);
    }
  }

  /**
   * Get saved video position
   */
  static async getSavedPosition(videoId: string): Promise<number> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return 0;

      const doc = await firestore()
        .collection(VIDEOS_COLLECTION)
        .doc(videoId)
        .get();

      const positions = doc.data()?.positions || {};
      return positions[currentUser.uid] || 0;
    } catch (error) {
      console.error('❌ Error getting saved position:', error);
      return 0;
    }
  }

  /**
   * Create a watch party
   */
  static async createWatchParty(videoId: string): Promise<string> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('NOT_AUTHENTICATED');
      }

      // Get user data
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const userData = userDoc.data();
      const partnerId = userData?.partnerId;
      const partnerName = userData?.partnerName;

      if (!partnerId) {
        throw new Error('NO_PARTNER');
      }

      const watchParty: Omit<WatchParty, 'id' | 'createdAt'> = {
        videoId,
        hostId: currentUser.uid,
        hostName: userData?.name || 'Vous',
        guestId: partnerId,
        guestName: partnerName || 'Partenaire',
        currentTime: 0,
        isPlaying: false,
        playbackRate: 1,
        volume: 1,
      };

      const docRef = await firestore()
        .collection(WATCH_PARTIES_COLLECTION)
        .add({
          ...watchParty,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Watch party created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating watch party:', error);
      throw error;
    }
  }

  /**
   * Subscribe to watch party updates
   */
  static subscribeToWatchParty(
    watchPartyId: string,
    callback: (watchParty: WatchParty) => void
  ): () => void {
    const unsubscribe = firestore()
      .collection(WATCH_PARTIES_COLLECTION)
      .doc(watchPartyId)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.exists) return;

          const data = snapshot.data();
          callback({
            id: snapshot.id,
            ...data,
            createdAt: data?.createdAt?.toDate() || new Date(),
            endedAt: data?.endedAt?.toDate(),
          } as WatchParty);
        },
        (error) => {
          console.error('❌ Error listening to watch party:', error);
        }
      );

    return unsubscribe;
  }

  /**
   * Update watch party state
   */
  static async updateWatchParty(
    watchPartyId: string,
    updates: Partial<WatchParty>
  ): Promise<void> {
    try {
      await firestore()
        .collection(WATCH_PARTIES_COLLECTION)
        .doc(watchPartyId)
        .update(updates);
    } catch (error) {
      console.error('❌ Error updating watch party:', error);
      throw error;
    }
  }

  /**
   * End a watch party
   */
  static async endWatchParty(watchPartyId: string): Promise<void> {
    try {
      await firestore()
        .collection(WATCH_PARTIES_COLLECTION)
        .doc(watchPartyId)
        .update({
          endedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Watch party ended:', watchPartyId);
    } catch (error) {
      console.error('❌ Error ending watch party:', error);
      throw error;
    }
  }

  /**
   * Add a comment to a video
   */
  static async addComment(
    videoId: string,
    text: string,
    timestamp: number
  ): Promise<string> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('NOT_AUTHENTICATED');
      }

      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const comment: Omit<VideoComment, 'id' | 'createdAt'> = {
        videoId,
        userId: currentUser.uid,
        userName: userDoc.data()?.name || 'Vous',
        text,
        timestamp,
      };

      const docRef = await firestore()
        .collection(VIDEO_COMMENTS_COLLECTION)
        .add({
          ...comment,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Comment added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for a video
   */
  static async getComments(videoId: string): Promise<VideoComment[]> {
    try {
      const querySnapshot = await firestore()
        .collection(VIDEO_COMMENTS_COLLECTION)
        .where('videoId', '==', videoId)
        .orderBy('timestamp', 'asc')
        .get();

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as VideoComment));
    } catch (error) {
      console.error('❌ Error getting comments:', error);
      return [];
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string): Promise<void> {
    try {
      await firestore()
        .collection(VIDEO_COMMENTS_COLLECTION)
        .doc(commentId)
        .delete();

      console.log('✅ Comment deleted:', commentId);
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      throw error;
    }
  }
}

export default VideoService;
