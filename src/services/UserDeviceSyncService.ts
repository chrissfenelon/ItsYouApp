import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import DeviceInfoService from './DeviceInfoService';
import { Platform } from 'react-native';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  deviceOS: string;
  deviceOSVersion: string;
  lastSyncedAt: Date;
  isActive: boolean;
}

export interface UserDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  deviceOS: string;
  deviceOSVersion: string;
  registeredAt: Date;
  lastSyncedAt: Date;
  isActive: boolean;
}

export class UserDeviceSyncService {
  /**
   * Register or update device for current user
   * This should be called on app launch and login
   */
  static async syncCurrentDevice(): Promise<void> {
    try {
      const user = auth().currentUser;

      if (!user) {
        console.warn('No user logged in, skipping device sync');
        return;
      }

      const deviceInfo = await DeviceInfoService.getCompleteDeviceInfo();

      // Check if device is already registered
      const deviceSnapshot = await firestore()
        .collection('devices')
        .where('userId', '==', user.uid)
        .where('deviceId', '==', deviceInfo.deviceId)
        .get();

      const now = firestore.Timestamp.now();

      if (deviceSnapshot.empty) {
        // Register new device
        await firestore().collection('devices').add({
          userId: user.uid,
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          deviceModel: deviceInfo.deviceModel,
          deviceOS: deviceInfo.deviceOS,
          deviceOSVersion: deviceInfo.deviceOSVersion,
          registeredAt: now,
          lastSyncedAt: now,
          isActive: true,
        });

        console.log('✅ Device registered successfully');
      } else {
        // Update existing device
        const deviceDoc = deviceSnapshot.docs[0];
        await deviceDoc.ref.update({
          deviceName: deviceInfo.deviceName,
          deviceModel: deviceInfo.deviceModel,
          deviceOSVersion: deviceInfo.deviceOSVersion,
          lastSyncedAt: now,
          isActive: true,
        });

        console.log('✅ Device info updated successfully');
      }

      // Update user's lastActiveAt
      await firestore()
        .collection('users')
        .doc(user.uid)
        .set({
          lastActiveAt: now,
          lastActiveDevice: deviceInfo.deviceId,
        }, { merge: true });

    } catch (error) {
      console.error('Error syncing device:', error);
      throw error;
    }
  }

  /**
   * Get all devices for current user
   */
  static async getUserDevices(): Promise<UserDevice[]> {
    try {
      const user = auth().currentUser;

      if (!user) {
        console.warn('No user logged in');
        return [];
      }

      const snapshot = await firestore()
        .collection('devices')
        .where('userId', '==', user.uid)
        .orderBy('lastSyncedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registeredAt: doc.data().registeredAt?.toDate() || new Date(),
        lastSyncedAt: doc.data().lastSyncedAt?.toDate() || new Date(),
      } as UserDevice));
    } catch (error) {
      console.error('Error getting user devices:', error);
      return [];
    }
  }

  /**
   * Mark device as inactive (on logout)
   */
  static async markDeviceInactive(): Promise<void> {
    try {
      const user = auth().currentUser;

      if (!user) {
        return;
      }

      const deviceInfo = await DeviceInfoService.getCompleteDeviceInfo();

      const deviceSnapshot = await firestore()
        .collection('devices')
        .where('userId', '==', user.uid)
        .where('deviceId', '==', deviceInfo.deviceId)
        .get();

      if (!deviceSnapshot.empty) {
        const deviceDoc = deviceSnapshot.docs[0];
        await deviceDoc.ref.update({
          isActive: false,
          lastSyncedAt: firestore.Timestamp.now(),
        });

        console.log('✅ Device marked as inactive');
      }
    } catch (error) {
      console.error('Error marking device as inactive:', error);
    }
  }

  /**
   * Remove device from user's device list
   */
  static async removeDevice(deviceId: string): Promise<void> {
    try {
      const user = auth().currentUser;

      if (!user) {
        throw new Error('No user logged in');
      }

      const deviceSnapshot = await firestore()
        .collection('devices')
        .where('userId', '==', user.uid)
        .where('deviceId', '==', deviceId)
        .get();

      if (!deviceSnapshot.empty) {
        const deviceDoc = deviceSnapshot.docs[0];
        await deviceDoc.ref.delete();
        console.log('✅ Device removed successfully');
      }
    } catch (error) {
      console.error('Error removing device:', error);
      throw error;
    }
  }

  /**
   * Get current device info
   */
  static async getCurrentDeviceInfo(): Promise<UserDevice | null> {
    try {
      const user = auth().currentUser;

      if (!user) {
        return null;
      }

      const deviceInfo = await DeviceInfoService.getCompleteDeviceInfo();

      const deviceSnapshot = await firestore()
        .collection('devices')
        .where('userId', '==', user.uid)
        .where('deviceId', '==', deviceInfo.deviceId)
        .get();

      if (deviceSnapshot.empty) {
        return null;
      }

      const doc = deviceSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        registeredAt: doc.data().registeredAt?.toDate() || new Date(),
        lastSyncedAt: doc.data().lastSyncedAt?.toDate() || new Date(),
      } as UserDevice;
    } catch (error) {
      console.error('Error getting current device info:', error);
      return null;
    }
  }

  /**
   * Subscribe to device changes for current user
   */
  static subscribeToUserDevices(
    callback: (devices: UserDevice[]) => void
  ): () => void {
    const user = auth().currentUser;

    if (!user) {
      console.warn('No user logged in');
      return () => {};
    }

    const unsubscribe = firestore()
      .collection('devices')
      .where('userId', '==', user.uid)
      .orderBy('lastSyncedAt', 'desc')
      .onSnapshot(
        snapshot => {
          const devices = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            registeredAt: doc.data().registeredAt?.toDate() || new Date(),
            lastSyncedAt: doc.data().lastSyncedAt?.toDate() || new Date(),
          } as UserDevice));
          callback(devices);
        },
        error => {
          console.error('Error subscribing to user devices:', error);
        }
      );

    return unsubscribe;
  }

  /**
   * Initialize device sync on app launch
   * This should be called in App.tsx when user is authenticated
   */
  static async initializeDeviceSync(): Promise<void> {
    try {
      // Wait for auth state to be ready
      const user = auth().currentUser;

      if (user) {
        await this.syncCurrentDevice();
      }
    } catch (error) {
      console.error('Error initializing device sync:', error);
    }
  }

  /**
   * Clean up old inactive devices (older than 30 days)
   */
  static async cleanupOldDevices(): Promise<number> {
    try {
      const user = auth().currentUser;

      if (!user) {
        return 0;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const snapshot = await firestore()
        .collection('devices')
        .where('userId', '==', user.uid)
        .where('isActive', '==', false)
        .where('lastSyncedAt', '<', firestore.Timestamp.fromDate(thirtyDaysAgo))
        .get();

      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ Cleaned up ${snapshot.size} old devices`);
      return snapshot.size;
    } catch (error) {
      console.error('Error cleaning up old devices:', error);
      return 0;
    }
  }
}

export default UserDeviceSyncService;
