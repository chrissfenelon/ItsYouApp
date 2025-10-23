import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  BIOMETRIC_ENABLED: '@ItsYouApp:biometricEnabled',
  BIOMETRIC_EMAIL: '@ItsYouApp:biometricEmail',
  BIOMETRIC_PASSWORD: '@ItsYouApp:biometricPassword',
} as const;

export class BiometricService {
  private static rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

  /**
   * Check if biometric authentication is available on the device
   */
  static async isBiometricAvailable(): Promise<{
    available: boolean;
    biometryType: BiometryTypes | null;
    error?: string;
  }> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      return { available, biometryType };
    } catch (error: any) {
      console.error('Error checking biometric availability:', error);
      return {
        available: false,
        biometryType: null,
        error: error.message || 'Erreur lors de la vérification de la biométrie',
      };
    }
  }

  /**
   * Get the name of the biometric type available (Face ID, Touch ID, Fingerprint, etc.)
   */
  static async getBiometricTypeName(): Promise<string> {
    const { available, biometryType } = await this.isBiometricAvailable();

    if (!available || !biometryType) {
      return 'Biométrie';
    }

    switch (biometryType) {
      case BiometryTypes.FaceID:
        return 'Face ID';
      case BiometryTypes.TouchID:
        return 'Touch ID';
      case BiometryTypes.Biometrics:
        return 'Empreinte digitale';
      default:
        return 'Biométrie';
    }
  }

  /**
   * Prompt the user for biometric authentication
   */
  static async authenticate(promptMessage?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { available } = await this.isBiometricAvailable();

      if (!available) {
        return {
          success: false,
          error: 'La biométrie n\'est pas disponible sur cet appareil',
        };
      }

      const biometricTypeName = await this.getBiometricTypeName();
      const message = promptMessage || `Authentifiez-vous avec ${biometricTypeName}`;

      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage: message,
        cancelButtonText: 'Annuler',
      });

      if (success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Authentification annulée',
        };
      }
    } catch (error: any) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'authentification biométrique',
      };
    }
  }

  /**
   * Check if biometric authentication is enabled for the app
   */
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication and save credentials
   */
  static async enableBiometric(email: string, password: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { available } = await this.isBiometricAvailable();

      if (!available) {
        return {
          success: false,
          error: 'La biométrie n\'est pas disponible sur cet appareil',
        };
      }

      // First authenticate to confirm
      const biometricTypeName = await this.getBiometricTypeName();
      const authResult = await this.authenticate(
        `Authentifiez-vous pour activer ${biometricTypeName}`
      );

      if (!authResult.success) {
        return authResult;
      }

      // Save credentials securely
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_EMAIL, email);
      // Note: In production, you should encrypt the password or use a more secure method
      // For now, we're storing it in AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_PASSWORD, password);

      console.log('Biometric authentication enabled successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error enabling biometric authentication:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'activation de la biométrie',
      };
    }
  }

  /**
   * Disable biometric authentication and clear saved credentials
   */
  static async disableBiometric(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.BIOMETRIC_ENABLED,
        STORAGE_KEYS.BIOMETRIC_EMAIL,
        STORAGE_KEYS.BIOMETRIC_PASSWORD,
      ]);
      console.log('Biometric authentication disabled successfully');
    } catch (error) {
      console.error('Error disabling biometric authentication:', error);
      throw error;
    }
  }

  /**
   * Get saved credentials after successful biometric authentication
   */
  static async getSavedCredentials(): Promise<{
    email: string;
    password: string;
  } | null> {
    try {
      const enabled = await this.isBiometricEnabled();

      if (!enabled) {
        return null;
      }

      const email = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_EMAIL);
      const password = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_PASSWORD);

      if (!email || !password) {
        console.warn('Biometric enabled but credentials not found');
        return null;
      }

      return { email, password };
    } catch (error) {
      console.error('Error getting saved credentials:', error);
      return null;
    }
  }

  /**
   * Authenticate and retrieve saved credentials
   */
  static async authenticateAndGetCredentials(): Promise<{
    success: boolean;
    credentials?: { email: string; password: string };
    error?: string;
  }> {
    try {
      const enabled = await this.isBiometricEnabled();

      if (!enabled) {
        return {
          success: false,
          error: 'La biométrie n\'est pas activée',
        };
      }

      const biometricTypeName = await this.getBiometricTypeName();
      const authResult = await this.authenticate(
        `Connectez-vous avec ${biometricTypeName}`
      );

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error,
        };
      }

      const credentials = await this.getSavedCredentials();

      if (!credentials) {
        return {
          success: false,
          error: 'Identifiants non trouvés',
        };
      }

      return {
        success: true,
        credentials,
      };
    } catch (error: any) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'authentification biométrique',
      };
    }
  }

  /**
   * Update saved credentials (when user changes password)
   */
  static async updateCredentials(email: string, password: string): Promise<void> {
    try {
      const enabled = await this.isBiometricEnabled();

      if (enabled) {
        await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_EMAIL, email);
        await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_PASSWORD, password);
        console.log('Biometric credentials updated successfully');
      }
    } catch (error) {
      console.error('Error updating biometric credentials:', error);
      throw error;
    }
  }
}

export default BiometricService;
