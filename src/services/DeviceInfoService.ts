import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class DeviceInfoService {
  private static deviceId: string | null = null;
  private static DEVICE_ID_KEY = '@device_id';

  /**
   * Get or generate unique device ID
   */
  static async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }

    try {
      // Try to get stored device ID
      const storedId = await AsyncStorage.getItem(this.DEVICE_ID_KEY);

      if (storedId) {
        this.deviceId = storedId;
        return storedId;
      }

      // Generate new device ID
      const newId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(this.DEVICE_ID_KEY, newId);
      this.deviceId = newId;
      return newId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      this.deviceId = `${Platform.OS}_${Date.now()}`;
      return this.deviceId;
    }
  }

  /**
   * Get device name (simplified)
   */
  static getDeviceName(): string {
    return Platform.OS === 'android' ? 'Android Device' : 'iOS Device';
  }

  /**
   * Get device model
   */
  static getDeviceModel(): string {
    return Platform.OS === 'android' ? 'Android' : 'iPhone';
  }

  /**
   * Get OS version
   */
  static getOSVersion(): string {
    return Platform.Version.toString();
  }

  /**
   * Get complete device info
   */
  static async getCompleteDeviceInfo() {
    const deviceId = await this.getDeviceId();
    const deviceName = this.getDeviceName();
    const deviceModel = this.getDeviceModel();
    const deviceOS = Platform.OS;
    const deviceOSVersion = this.getOSVersion();

    return {
      deviceId,
      deviceName,
      deviceModel,
      deviceOS,
      deviceOSVersion,
    };
  }
}

export default DeviceInfoService;
