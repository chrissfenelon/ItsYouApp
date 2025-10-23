import { Platform, PermissionsAndroid, Alert } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  MediaType,
  CameraOptions,
  ImageLibraryOptions,
  Asset,
} from 'react-native-image-picker';

export interface PickedMedia {
  uri: string;
  type: 'image' | 'video';
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number; // for videos
}

class MediaPickerService {
  /**
   * Request camera permission on Android
   */
  private async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permission d\'accès à la caméra',
            message: 'ItsYou a besoin d\'accéder à votre caméra pour prendre des photos',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  /**
   * Request gallery permission on Android
   */
  private async requestGalleryPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const permissions = Platform.Version >= 33
          ? [
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            ]
          : [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];

        const results = await PermissionsAndroid.requestMultiple(permissions);

        if (Platform.Version >= 33) {
          return (
            results['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED ||
            results['android.permission.READ_MEDIA_VIDEO'] === PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          return results['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  /**
   * Convert Asset to PickedMedia
   */
  private convertAsset(asset: Asset): PickedMedia | null {
    if (!asset.uri || !asset.fileName) return null;

    const isVideo = asset.type?.startsWith('video/') || asset.fileName.match(/\.(mp4|mov|avi|mkv)$/i);

    return {
      uri: asset.uri,
      type: isVideo ? 'video' : 'image',
      fileName: asset.fileName,
      fileSize: asset.fileSize || 0,
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
    };
  }

  /**
   * Show action sheet to choose between camera and gallery
   */
  async showMediaPicker(mediaType: MediaType = 'mixed'): Promise<PickedMedia | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Ajouter un média',
        'Choisissez une source',
        [
          {
            text: 'Prendre une photo',
            onPress: async () => {
              const media = await this.openCamera('photo');
              resolve(media);
            },
          },
          {
            text: 'Enregistrer une vidéo',
            onPress: async () => {
              const media = await this.openCamera('video');
              resolve(media);
            },
          },
          {
            text: 'Choisir depuis la galerie',
            onPress: async () => {
              const media = await this.openGallery(mediaType);
              resolve(media);
            },
          },
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true }
      );
    });
  }

  /**
   * Open camera to take photo or video
   */
  async openCamera(mediaType: 'photo' | 'video' = 'photo'): Promise<PickedMedia | null> {
    console.log('MediaPickerService: Opening camera for', mediaType);

    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      console.log('MediaPickerService: Camera permission denied');
      Alert.alert(
        'Permission refusée',
        'Vous devez autoriser l\'accès à la caméra pour prendre des photos'
      );
      return null;
    }

    console.log('MediaPickerService: Camera permission granted');

    const options: CameraOptions = {
      mediaType: mediaType,
      quality: 0.8,
      videoQuality: 'high',
      maxWidth: 1920,
      maxHeight: 1920,
      saveToPhotos: true,
      includeBase64: false,
    };

    try {
      console.log('MediaPickerService: Launching camera...');
      const result = await launchCamera(options);

      console.log('MediaPickerService: Camera result received:', {
        didCancel: result.didCancel,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        assetsCount: result.assets?.length || 0,
      });

      if (result.didCancel) {
        console.log('MediaPickerService: User cancelled camera');
        return null;
      }

      if (result.errorCode) {
        console.error('MediaPickerService: Camera error code:', result.errorCode);
        Alert.alert('Erreur', result.errorMessage || 'Impossible d\'accéder à la caméra');
        return null;
      }

      if (result.assets && result.assets.length > 0) {
        console.log('MediaPickerService: Converting asset...');
        const asset = result.assets[0];
        console.log('MediaPickerService: Asset details:', {
          uri: asset.uri?.substring(0, 50) + '...',
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          type: asset.type,
          width: asset.width,
          height: asset.height,
        });

        const pickedMedia = this.convertAsset(asset);
        console.log('MediaPickerService: Conversion result:', pickedMedia ? 'success' : 'failed');
        return pickedMedia;
      }

      console.log('MediaPickerService: No assets in result');
      return null;
    } catch (error) {
      console.error('MediaPickerService: Camera exception:', error);
      if (error instanceof Error) {
        console.error('MediaPickerService: Error details:', error.message, error.stack);
      }
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'accès à la caméra');
      return null;
    }
  }

  /**
   * Open gallery to select media
   */
  async openGallery(
    mediaType: MediaType = 'mixed',
    selectionLimit: number = 1
  ): Promise<PickedMedia | PickedMedia[] | null> {
    const hasPermission = await this.requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission refusée',
        'Vous devez autoriser l\'accès à la galerie pour sélectionner des photos'
      );
      return null;
    }

    const options: ImageLibraryOptions = {
      mediaType,
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      selectionLimit,
      includeBase64: false,
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        return null;
      }

      if (result.errorCode) {
        Alert.alert('Erreur', result.errorMessage || 'Impossible d\'accéder à la galerie');
        return null;
      }

      if (result.assets && result.assets.length > 0) {
        const pickedMedia = result.assets
          .map(asset => this.convertAsset(asset))
          .filter((media): media is PickedMedia => media !== null);

        if (pickedMedia.length === 0) return null;

        return selectionLimit === 1 ? pickedMedia[0] : pickedMedia;
      }

      return null;
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'accès à la galerie');
      return null;
    }
  }

  /**
   * Open gallery to select multiple media
   */
  async openGalleryMultiple(
    mediaType: MediaType = 'mixed',
    limit: number = 10
  ): Promise<PickedMedia[] | null> {
    const result = await this.openGallery(mediaType, limit);
    if (!result) return null;
    return Array.isArray(result) ? result : [result];
  }
}

export default new MediaPickerService();