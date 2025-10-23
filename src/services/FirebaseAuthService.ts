import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import UserDeviceSyncService from './UserDeviceSyncService';
import FCMService from './FCMService';
import { fetchWithRetry } from '../utils/retryUtils';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isEmailVerified: boolean;
}

export class FirebaseAuthService {
  static async signInWithEmailAndPassword(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await fetchWithRetry(() =>
        auth().signInWithEmailAndPassword(email, password)
      );
      const firebaseUser = userCredential.user;

      // Sync device info on login
      try {
        await UserDeviceSyncService.syncCurrentDevice();
      } catch (syncError) {
        console.warn('Could not sync device on login:', syncError);
        // Continue with login even if device sync fails
      }

      // Save FCM token on login
      try {
        await FCMService.saveFCMToken();
      } catch (fcmError) {
        console.warn('Could not save FCM token on login:', fcmError);
        // Continue with login even if FCM token save fails
      }

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        isEmailVerified: firebaseUser.emailVerified,
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static async createUserWithEmailAndPassword(
    email: string,
    password: string,
    displayName: string
  ): Promise<FirebaseUser> {
    try {
      const userCredential = await fetchWithRetry(() =>
        auth().createUserWithEmailAndPassword(email, password)
      );
      const firebaseUser = userCredential.user;

      // Update user profile with display name
      await firebaseUser.updateProfile({
        displayName: displayName,
      });

      // Try to create user document in Firestore (with retry)
      try {
        await fetchWithRetry(() =>
          firestore().collection('users').doc(firebaseUser.uid).set({
            email: email,
            displayName: displayName,
            createdAt: firestore.FieldValue.serverTimestamp(),
            relationshipStartDate: new Date('2023-01-15'), // You can make this dynamic
          })
        );
      } catch (firestoreError) {
        console.warn('Could not create user document in Firestore:', firestoreError);
        // Continue without creating Firestore document
      }

      // Sync device info on registration
      try {
        await UserDeviceSyncService.syncCurrentDevice();
      } catch (syncError) {
        console.warn('Could not sync device on registration:', syncError);
        // Continue with registration even if device sync fails
      }

      // Save FCM token on registration
      try {
        await FCMService.saveFCMToken();
      } catch (fcmError) {
        console.warn('Could not save FCM token on registration:', fcmError);
        // Continue with registration even if FCM token save fails
      }

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        isEmailVerified: firebaseUser.emailVerified,
      };
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static async signOut(): Promise<void> {
    try {
      // Mark device as inactive before signing out
      try {
        await UserDeviceSyncService.markDeviceInactive();
      } catch (syncError) {
        console.warn('Could not mark device as inactive:', syncError);
        // Continue with logout even if device sync fails
      }

      // Delete FCM token on logout
      try {
        await FCMService.deleteFCMToken();
      } catch (fcmError) {
        console.warn('Could not delete FCM token on logout:', fcmError);
        // Continue with logout even if FCM token deletion fails
      }

      await auth().signOut();
    } catch (error) {
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  static async sendEmailVerification(): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.sendEmailVerification();
      }
    } catch (error) {
      throw new Error('Erreur lors de l\'envoi de l\'email de vérification');
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      console.log('🔐 Attempting to send password reset email to:', email);
      await fetchWithRetry(() =>
        auth().sendPasswordResetEmail(email)
      );
      console.log('✅ Password reset email sent successfully to:', email);
    } catch (error: any) {
      console.error('❌ Password reset error:', {
        code: error.code,
        message: error.message,
        email: email,
      });
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  }

  static onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
    return auth().onAuthStateChanged(callback);
  }

  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Adresse email invalide';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé';
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cette adresse email';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect';
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères';
      case 'auth/operation-not-allowed':
        return 'Cette opération n\'est pas autorisée';
      case 'auth/invalid-credential':
        return 'Identifiants invalides';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Veuillez réessayer plus tard';
      case 'auth/network-request-failed':
        return 'Erreur de connexion réseau';
      default:
        return 'Une erreur inattendue s\'est produite';
    }
  }
}

export default FirebaseAuthService;