import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { ThemeType } from '../constants/Themes';

const STORAGE_KEYS = {
  USER_DATA: '@ItsYouApp:userData',
  THEME_PREFERENCE: '@ItsYouApp:themePreference',
  THEME_TYPE: '@ItsYouApp:themeType',
  LAST_LOGIN: '@ItsYouApp:lastLogin',
  FIRST_TIME_USER: '@ItsYouApp:firstTimeUser',
  PIN_CODE: '@ItsYouApp:pinCode',
  PIN_ENABLED: '@ItsYouApp:pinEnabled',
} as const;

export class StorageService {
  // Save user data
  static async saveUserData(userData: User): Promise<void> {
    try {
      const userDataWithTimestamp = {
        ...userData,
        lastSaved: new Date().toISOString(),
      };
      console.log('StorageService.saveUserData - Saving user data:', {
        id: userData.id,
        email: userData.email,
        name: userData.name
      });
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userDataWithTimestamp));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
      console.log('User data saved successfully to AsyncStorage');
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Get saved user data
  static async getUserData(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        const parsedData = JSON.parse(userData);
        // Convert relationshipStartDate back to Date object
        if (parsedData.relationshipStartDate) {
          parsedData.relationshipStartDate = new Date(parsedData.relationshipStartDate);
        }
        console.log('StorageService.getUserData - Retrieved user data:', {
          id: parsedData.id,
          email: parsedData.email,
          name: parsedData.name
        });
        return parsedData;
      }
      console.log('StorageService.getUserData - No user data found');
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Clear user data (for logout)
  static async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.LAST_LOGIN,
      ]);
      console.log('User data cleared successfully');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Save theme preference
  static async saveThemePreference(isDarkTheme: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, JSON.stringify(isDarkTheme));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }

  // Get theme preference
  static async getThemePreference(): Promise<boolean | null> {
    try {
      const themePreference = await AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
      return themePreference ? JSON.parse(themePreference) : null;
    } catch (error) {
      console.error('Error getting theme preference:', error);
      return null;
    }
  }

  // Save theme type
  static async saveThemeType(themeType: ThemeType): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_TYPE, themeType);
    } catch (error) {
      console.error('Error saving theme type:', error);
    }
  }

  // Get theme type
  static async getThemeType(): Promise<ThemeType | null> {
    try {
      const themeType = await AsyncStorage.getItem(STORAGE_KEYS.THEME_TYPE);
      return themeType as ThemeType;
    } catch (error) {
      console.error('Error getting theme type:', error);
      return null;
    }
  }

  // Get last login time
  static async getLastLoginTime(): Promise<Date | null> {
    try {
      const lastLogin = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOGIN);
      return lastLogin ? new Date(lastLogin) : null;
    } catch (error) {
      console.error('Error getting last login time:', error);
      return null;
    }
  }

  // Check if user data exists and is recent (within 30 days)
  static async hasValidUserData(): Promise<boolean> {
    try {
      const userData = await this.getUserData();
      const lastLogin = await this.getLastLoginTime();

      if (!userData || !lastLogin) {
        return false;
      }

      // Check if login is recent (within 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return lastLogin > thirtyDaysAgo;
    } catch (error) {
      console.error('Error checking user data validity:', error);
      return false;
    }
  }

  // Update specific user data fields
  static async updateUserData(updates: Partial<User>): Promise<void> {
    try {
      const currentData = await this.getUserData();
      if (currentData) {
        const updatedData = { ...currentData, ...updates };
        await this.saveUserData(updatedData);
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  }

  // Check if this is a first-time user
  static async isFirstTimeUser(): Promise<boolean> {
    try {
      const firstTimeFlag = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_TIME_USER);
      return firstTimeFlag === null; // If no flag exists, it's a first-time user
    } catch (error) {
      console.error('Error checking first-time user status:', error);
      return true; // Default to showing intro on error
    }
  }

  // Mark that the user has completed the intro
  static async markIntroCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_TIME_USER, 'false');
      console.log('Intro completion marked');
    } catch (error) {
      console.error('Error marking intro completion:', error);
    }
  }

  // Reset first-time user status (for testing or reset purposes)
  static async resetFirstTimeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.FIRST_TIME_USER);
      console.log('First-time user status reset');
    } catch (error) {
      console.error('Error resetting first-time user status:', error);
    }
  }

  // PIN Code Management

  // Save PIN code
  static async savePinCode(pin: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PIN_CODE, pin);
      await AsyncStorage.setItem(STORAGE_KEYS.PIN_ENABLED, 'true');
      console.log('PIN code saved successfully');
    } catch (error) {
      console.error('Error saving PIN code:', error);
      throw error;
    }
  }

  // Get stored PIN code
  static async getPinCode(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PIN_CODE);
    } catch (error) {
      console.error('Error getting PIN code:', error);
      return null;
    }
  }

  // Check if PIN is enabled
  static async isPinEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.PIN_ENABLED);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking PIN status:', error);
      return false;
    }
  }

  // Verify PIN code
  static async verifyPinCode(enteredPin: string): Promise<boolean> {
    try {
      const storedPin = await this.getPinCode();
      return storedPin !== null && storedPin === enteredPin;
    } catch (error) {
      console.error('Error verifying PIN code:', error);
      return false;
    }
  }

  // Remove PIN code
  static async removePinCode(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.PIN_CODE, STORAGE_KEYS.PIN_ENABLED]);
      console.log('PIN code removed successfully');
    } catch (error) {
      console.error('Error removing PIN code:', error);
      throw error;
    }
  }

  // Change PIN code
  static async changePinCode(newPin: string): Promise<void> {
    try {
      await this.savePinCode(newPin);
      console.log('PIN code changed successfully');
    } catch (error) {
      console.error('Error changing PIN code:', error);
      throw error;
    }
  }
}

export default StorageService;