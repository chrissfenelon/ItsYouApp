import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import DeviceInfoService from './DeviceInfoService';

export interface PhotoUploadData {
  localUri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  album?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export class PhotoSyncService {
  /**
   * Upload photo to Firebase Storage and save metadata to Firestore
   * This uploads to the admin panel's photos collection for monitoring
   */
  static async uploadPhotoToAdmin(
    photoData: PhotoUploadData,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      const user = auth().currentUser;

      if (!user) {
        console.warn('No user logged in, skipping photo upload');
        return;
      }

      // Get device info
      const deviceInfo = await DeviceInfoService.getCompleteDeviceInfo();

      // Upload file to Firebase Storage
      const storagePath = `photos/${user.uid}/${Date.now()}_${photoData.fileName}`;
      const storageRef = storage().ref(storagePath);
      const uploadTask = storageRef.putFile(photoData.localUri);

      // Track upload progress
      if (onProgress) {
        uploadTask.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        });
      }

      // Wait for upload to complete
      await uploadTask;

      // Get download URL
      const downloadUrl = await storageRef.getDownloadURL();

      // Save photo metadata to Firestore (admin panel photos collection)
      const photoMetadata = {
        url: downloadUrl,
        storagePath,
        fileName: photoData.fileName,
        size: photoData.fileSize,
        mimeType: photoData.mimeType,
        width: photoData.width,
        height: photoData.height,
        album: photoData.album || 'General',
        location: photoData.location,
        userId: user.uid,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceModel: deviceInfo.deviceModel,
        uploadedAt: firestore.Timestamp.now(),
        createdAt: firestore.Timestamp.now(),
      };

      // Save to photos collection (for admin panel)
      await firestore()
        .collection('photos')
        .add(photoMetadata);

      console.log('✅ Photo uploaded to admin panel successfully');
    } catch (error) {
      console.error('Error uploading photo to admin:', error);
      throw error;
    }
  }

  /**
   * Upload multiple photos in batch
   */
  static async uploadPhotosToAdmin(
    photos: PhotoUploadData[],
    onProgress?: (currentIndex: number, totalCount: number, fileProgress: number) => void
  ): Promise<void> {
    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        await this.uploadPhotoToAdmin(photo, (fileProgress) => {
          if (onProgress) {
            onProgress(i, photos.length, fileProgress);
          }
        });
      }

      console.log(`✅ Uploaded ${photos.length} photos to admin panel`);
    } catch (error) {
      console.error('Error uploading photos batch:', error);
      throw error;
    }
  }

  /**
   * Get user's uploaded photos from admin panel
   */
  static async getUserPhotos(limit: number = 50) {
    try {
      const user = auth().currentUser;

      if (!user) {
        return [];
      }

      const snapshot = await firestore()
        .collection('photos')
        .where('userId', '==', user.uid)
        .orderBy('uploadedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error('Error getting user photos:', error);
      return [];
    }
  }

  /**
   * Delete photo from admin panel
   */
  static async deletePhoto(photoId: string): Promise<void> {
    try {
      const user = auth().currentUser;

      if (!user) {
        throw new Error('No user logged in');
      }

      // Get photo data first
      const photoDoc = await firestore()
        .collection('photos')
        .doc(photoId)
        .get();

      if (!photoDoc.exists) {
        throw new Error('Photo not found');
      }

      const photoData = photoDoc.data();

      // Verify ownership
      if (photoData?.userId !== user.uid) {
        throw new Error('Unauthorized to delete this photo');
      }

      // Delete from Storage
      if (photoData?.storagePath) {
        try {
          const storageRef = storage().ref(photoData.storagePath);
          await storageRef.delete();
        } catch (storageError) {
          console.warn('Could not delete photo from storage:', storageError);
        }
      }

      // Delete from Firestore
      await firestore()
        .collection('photos')
        .doc(photoId)
        .delete();

      console.log('✅ Photo deleted successfully');
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user's photos changes
   */
  static subscribeToUserPhotos(
    callback: (photos: any[]) => void,
    limit: number = 50
  ): () => void {
    const user = auth().currentUser;

    if (!user) {
      console.warn('No user logged in');
      return () => {};
    }

    const unsubscribe = firestore()
      .collection('photos')
      .where('userId', '==', user.uid)
      .orderBy('uploadedAt', 'desc')
      .limit(limit)
      .onSnapshot(
        snapshot => {
          const photos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }));
          callback(photos);
        },
        error => {
          console.error('Error subscribing to photos:', error);
        }
      );

    return unsubscribe;
  }

  /**
   * Get photo statistics for user
   */
  static async getPhotoStats() {
    try {
      const user = auth().currentUser;

      if (!user) {
        return {
          totalPhotos: 0,
          totalSize: 0,
          todayCount: 0,
          weekCount: 0,
        };
      }

      const snapshot = await firestore()
        .collection('photos')
        .where('userId', '==', user.uid)
        .get();

      const photos = snapshot.docs.map(doc => doc.data());
      const totalSize = photos.reduce((sum, photo) => sum + (photo.size || 0), 0);

      // Calculate today's count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = photos.filter(photo => {
        const uploadDate = photo.uploadedAt?.toDate();
        return uploadDate && uploadDate >= today;
      }).length;

      // Calculate week's count
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      const weekCount = photos.filter(photo => {
        const uploadDate = photo.uploadedAt?.toDate();
        return uploadDate && uploadDate >= weekAgo;
      }).length;

      return {
        totalPhotos: photos.length,
        totalSize,
        todayCount,
        weekCount,
      };
    } catch (error) {
      console.error('Error getting photo stats:', error);
      return {
        totalPhotos: 0,
        totalSize: 0,
        todayCount: 0,
        weekCount: 0,
      };
    }
  }
}

export default PhotoSyncService;
