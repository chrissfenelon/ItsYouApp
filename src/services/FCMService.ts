import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { Platform, PermissionsAndroid } from 'react-native';
import auth from '@react-native-firebase/auth';

export class FCMService {
  /**
   * Request permission to send notifications
   */
  static async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('iOS notification permission granted:', authStatus);
          return true;
        } else {
          console.log('iOS notification permission denied');
          return false;
        }
      } else if (Platform.OS === 'android') {
        // Android 13+ requires explicit permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Android notification permission granted');
            return true;
          } else {
            console.log('Android notification permission denied');
            return false;
          }
        } else {
          // Android < 13 doesn't need explicit permission
          console.log('Android < 13: notification permission granted by default');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token and save to Firestore
   */
  static async saveFCMToken(): Promise<string | null> {
    try {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        console.log('No user logged in, cannot save FCM token');
        return null;
      }

      // Get FCM token
      const token = await messaging().getToken();

      if (!token) {
        console.error('Failed to get FCM token');
        return null;
      }

      console.log('FCM Token obtained:', token);

      // Save to Firestore
      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          fcmToken: token,
          fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('FCM token saved to Firestore successfully');
      return token;
    } catch (error) {
      console.error('Error saving FCM token:', error);

      // If user document doesn't exist, create it
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const token = await messaging().getToken();

          await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .set({
              email: currentUser.email,
              displayName: currentUser.displayName,
              fcmToken: token,
              fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
              createdAt: firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

          console.log('FCM token saved with merged user document');
          return token;
        }
      } catch (mergeError) {
        console.error('Error merging FCM token:', mergeError);
      }

      return null;
    }
  }

  /**
   * Initialize FCM - request permission and save token
   */
  static async initialize(): Promise<void> {
    try {
      console.log('Initializing FCM service...');

      // Request permission
      const hasPermission = await this.requestPermission();

      if (!hasPermission) {
        console.log('FCM initialization cancelled: no permission');
        return;
      }

      // Save FCM token
      await this.saveFCMToken();

      // Listen for token refresh
      messaging().onTokenRefresh(async (newToken) => {
        console.log('FCM Token refreshed:', newToken);
        await this.saveFCMToken();
      });

      console.log('FCM service initialized successfully');
    } catch (error) {
      console.error('Error initializing FCM service:', error);
    }
  }

  /**
   * Handle foreground notifications
   */
  static setupForegroundNotificationHandler(
    onNotificationReceived?: (notification: any) => void
  ): () => void {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      try {
        console.log('Foreground notification received:', remoteMessage);

        // Only process app-specific notifications, not system notifications
        if (remoteMessage.data?.type) {
          if (onNotificationReceived) {
            onNotificationReceived(remoteMessage);
          }
        } else {
          console.log('Ignoring non-app notification in FCM foreground handler');
        }

        // You can show a local notification here if needed
        // or update app state to show an in-app notification
      } catch (error) {
        console.error('Error in FCM foreground handler:', error);
        // Don't crash - just log the error
      }
    });

    return unsubscribe;
  }

  /**
   * Handle background/quit state notifications
   */
  static setupBackgroundNotificationHandler(): void {
    // Handle notification when app is in background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      try {
        console.log('Notification opened app from background:', remoteMessage);
        // Only process app-specific notifications
        if (remoteMessage.data?.type) {
          // Navigate to relevant screen based on notification data
        }
      } catch (error) {
        console.error('Error handling notification opened app:', error);
      }
    });

    // Handle notification when app was completely quit
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        try {
          if (remoteMessage) {
            console.log('Notification opened app from quit state:', remoteMessage);
            // Only process app-specific notifications
            if (remoteMessage.data?.type) {
              // Navigate to relevant screen based on notification data
            }
          }
        } catch (error) {
          console.error('Error handling initial notification:', error);
        }
      })
      .catch((error) => {
        console.error('Error getting initial notification:', error);
      });
  }

  /**
   * Delete FCM token (call when user logs out)
   */
  static async deleteFCMToken(): Promise<void> {
    try {
      const currentUser = auth().currentUser;

      if (currentUser) {
        // Remove token from Firestore
        await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .update({
            fcmToken: firestore.FieldValue.delete(),
            fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
          });
      }

      // Delete token from device
      await messaging().deleteToken();

      console.log('FCM token deleted successfully');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }

  /**
   * Check if user has notification permission
   */
  static async hasPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }
}

export default FCMService;
