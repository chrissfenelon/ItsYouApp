import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

export type PermissionType =
  | 'camera'
  | 'photo-library'
  | 'microphone'
  | 'notifications'
  | 'storage'
  | 'contacts'
  | 'sms'
  | 'media-audio';

interface PermissionConfig {
  ios: Permission;
  android: Permission;
  title: string;
  message: string;
  settingsMessage: string;
}

const PERMISSION_CONFIGS: Record<PermissionType, PermissionConfig> = {
  camera: {
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
    title: 'Permission Appareil Photo',
    message: 'ItsYou a besoin d\'accéder à votre appareil photo pour prendre des photos.',
    settingsMessage: 'Veuillez autoriser l\'accès à l\'appareil photo dans les paramètres de votre appareil.',
  },
  'photo-library': {
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
    android: Platform.Version >= 33 ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    title: 'Permission Galerie',
    message: 'ItsYou a besoin d\'accéder à votre galerie pour sélectionner des photos.',
    settingsMessage: 'Veuillez autoriser l\'accès à la galerie dans les paramètres de votre appareil.',
  },
  microphone: {
    ios: PERMISSIONS.IOS.MICROPHONE,
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
    title: 'Permission Microphone',
    message: 'ItsYou a besoin d\'accéder au microphone pour enregistrer des notes vocales.',
    settingsMessage: 'Veuillez autoriser l\'accès au microphone dans les paramètres de votre appareil.',
  },
  notifications: {
    ios: PERMISSIONS.IOS.NOTIFICATIONS,
    android: Platform.Version >= 33 ? PERMISSIONS.ANDROID.POST_NOTIFICATIONS : PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
    title: 'Permission Notifications',
    message: 'ItsYou souhaite vous envoyer des notifications pour rester connecté avec votre partenaire.',
    settingsMessage: 'Veuillez autoriser les notifications dans les paramètres de votre appareil.',
  },
  storage: {
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
    android: Platform.Version >= 33 ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    title: 'Permission Stockage',
    message: 'ItsYou a besoin d\'accéder au stockage pour enregistrer vos fichiers.',
    settingsMessage: 'Veuillez autoriser l\'accès au stockage dans les paramètres de votre appareil.',
  },
  contacts: {
    ios: PERMISSIONS.IOS.CONTACTS,
    android: PERMISSIONS.ANDROID.READ_CONTACTS,
    title: 'Permission Contacts',
    message: 'ItsYou a besoin d\'accéder à vos contacts.',
    settingsMessage: 'Veuillez autoriser l\'accès aux contacts dans les paramètres de votre appareil.',
  },
  sms: {
    ios: PERMISSIONS.IOS.CONTACTS, // iOS doesn't have SMS permission
    android: PERMISSIONS.ANDROID.READ_SMS,
    title: 'Permission SMS',
    message: 'ItsYou a besoin d\'accéder à vos SMS pour les fonctionnalités de l\'application.',
    settingsMessage: 'Veuillez autoriser l\'accès aux SMS dans les paramètres de votre appareil.',
  },
  'media-audio': {
    ios: PERMISSIONS.IOS.MEDIA_LIBRARY,
    android: Platform.Version >= 33 ? PERMISSIONS.ANDROID.READ_MEDIA_AUDIO : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    title: 'Permission Bibliothèque Musicale',
    message: 'ItsYou a besoin d\'accéder à votre bibliothèque musicale pour gérer vos playlists.',
    settingsMessage: 'Veuillez autoriser l\'accès à la bibliothèque musicale dans les paramètres de votre appareil.',
  },
};

/**
 * Request a specific permission
 */
export const requestPermission = async (
  type: PermissionType,
  showAlert: boolean = true
): Promise<boolean> => {
  try {
    const config = PERMISSION_CONFIGS[type];
    const permission = Platform.OS === 'ios' ? config.ios : config.android;

    // Check current permission status
    const currentStatus = await check(permission);

    if (currentStatus === RESULTS.GRANTED) {
      return true;
    }

    if (currentStatus === RESULTS.BLOCKED || currentStatus === RESULTS.UNAVAILABLE) {
      if (showAlert) {
        Alert.alert(
          config.title,
          config.settingsMessage,
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Linking.openSettings() },
          ]
        );
      }
      return false;
    }

    // Request permission
    const result = await request(permission);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    if (showAlert && result === RESULTS.BLOCKED) {
      Alert.alert(
        config.title,
        config.settingsMessage,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Paramètres', onPress: () => Linking.openSettings() },
        ]
      );
    }

    return false;
  } catch (error) {
    console.error('Error requesting permission:', error);
    return false;
  }
};

/**
 * Check if a specific permission is granted
 */
export const checkPermission = async (type: PermissionType): Promise<boolean> => {
  try {
    const config = PERMISSION_CONFIGS[type];
    const permission = Platform.OS === 'ios' ? config.ios : config.android;

    const status = await check(permission);
    return status === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Request multiple permissions at once
 */
export const requestMultiplePermissions = async (
  types: PermissionType[],
  showAlert: boolean = true
): Promise<Record<PermissionType, boolean>> => {
  const results: Record<string, boolean> = {};

  for (const type of types) {
    results[type] = await requestPermission(type, showAlert);
  }

  return results as Record<PermissionType, boolean>;
};

/**
 * Request Android-specific permissions for admin features
 */
export const requestAndroidAdminPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    ];

    const granted = await PermissionsAndroid.requestMultiple(permissions);

    return (
      granted['android.permission.READ_SMS'] === PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.RECEIVE_SMS'] === PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.READ_CONTACTS'] === PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.READ_CALL_LOG'] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error('Error requesting admin permissions:', error);
    return false;
  }
};

/**
 * Request permission for image picker (gallery or camera)
 */
export const requestImagePickerPermission = async (
  source: 'camera' | 'gallery'
): Promise<boolean> => {
  if (source === 'camera') {
    return await requestPermission('camera');
  } else {
    return await requestPermission('photo-library');
  }
};

/**
 * Request permission for audio recording
 */
export const requestAudioPermission = async (): Promise<boolean> => {
  return await requestPermission('microphone');
};

/**
 * Request permission for music library access
 */
export const requestMusicLibraryPermission = async (): Promise<boolean> => {
  return await requestPermission('media-audio');
};

/**
 * Request all necessary permissions for the app on first launch
 */
export const requestInitialPermissions = async (): Promise<void> => {
  const permissions: PermissionType[] = [
    'photo-library',
    'notifications',
  ];

  await requestMultiplePermissions(permissions, false);
};

/**
 * Request permissions for profile photo selection
 */
export const requestProfilePhotoPermissions = async (): Promise<boolean> => {
  const cameraGranted = await requestPermission('camera', false);
  const galleryGranted = await requestPermission('photo-library', true);

  return cameraGranted || galleryGranted;
};

/**
 * Request permissions for notes (voice recording)
 */
export const requestNotesPermissions = async (): Promise<boolean> => {
  return await requestPermission('microphone', true);
};

/**
 * Request permissions for quiz game with custom photos
 */
export const requestQuizGamePhotoPermissions = async (): Promise<boolean> => {
  return await requestPermission('photo-library', true);
};

/**
 * Request permissions for music admin features
 */
export const requestMusicAdminPermissions = async (): Promise<boolean> => {
  const audioPermission = await requestPermission('media-audio', true);
  const storagePermission = await requestPermission('storage', false);

  return audioPermission && storagePermission;
};
