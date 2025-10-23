import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  badge: 'verified' | 'premium' | 'couple' | 'heart';
  relationshipStartDate: Date;
  lastUpdated: Date;
}

export class FirebaseProfileService {
  private static readonly COLLECTION_NAME = 'userProfiles';

  /**
   * Upload a profile photo to Firebase Storage
   */
  static async uploadProfilePhoto(userId: string, imageUri: string): Promise<string> {
    try {
      // Use path that matches Storage rules: users/{userId}/profile/{fileName}
      const filename = `users/${userId}/profile/profile_${Date.now()}.jpg`;
      const reference = storage().ref(filename);

      // Upload the image
      const task = reference.putFile(imageUri);

      await task;

      // Get the download URL
      const downloadURL = await reference.getDownloadURL();

      console.log('Profile photo uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw new Error('Échec du téléchargement de la photo');
    }
  }

  /**
   * Save user profile to Firestore
   */
  static async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(profile.id)
        .set({
          ...profile,
          lastUpdated: firestore.FieldValue.serverTimestamp(),
          relationshipStartDate: firestore.Timestamp.fromDate(profile.relationshipStartDate),
        }, { merge: true });

      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw new Error('Échec de la sauvegarde du profil');
    }
  }

  /**
   * Get user profile from Firestore
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const doc = await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(userId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }

      return {
        ...data,
        relationshipStartDate: data.relationshipStartDate?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      } as UserProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Update profile photo URL in Firestore
   */
  static async updateProfilePhoto(userId: string, photoURL: string): Promise<void> {
    try {
      await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(userId)
        .update({
          photoURL,
          lastUpdated: firestore.FieldValue.serverTimestamp(),
        });

      console.log('Profile photo updated successfully');
    } catch (error) {
      console.error('Error updating profile photo:', error);
      throw new Error('Échec de la mise à jour de la photo');
    }
  }

  /**
   * Update user badge
   */
  static async updateUserBadge(userId: string, badge: UserProfile['badge']): Promise<void> {
    try {
      await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(userId)
        .update({
          badge,
          lastUpdated: firestore.FieldValue.serverTimestamp(),
        });

      console.log('User badge updated successfully');
    } catch (error) {
      console.error('Error updating user badge:', error);
      throw new Error('Échec de la mise à jour du badge');
    }
  }

  /**
   * Delete profile photo from Storage
   */
  static async deleteProfilePhoto(photoURL: string): Promise<void> {
    try {
      const reference = storage().refFromURL(photoURL);
      await reference.delete();
      console.log('Profile photo deleted successfully');
    } catch (error) {
      console.error('Error deleting profile photo:', error);
      // Don't throw error for photo deletion as it's not critical
    }
  }

  /**
   * Listen to profile changes in real-time
   */
  static subscribeToProfileChanges(userId: string, callback: (profile: UserProfile | null) => void): () => void {
    return firestore()
      .collection(this.COLLECTION_NAME)
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            if (data) {
              const profile: UserProfile = {
                ...data,
                relationshipStartDate: data.relationshipStartDate?.toDate() || new Date(),
                lastUpdated: data.lastUpdated?.toDate() || new Date(),
              } as UserProfile;
              callback(profile);
            } else {
              callback(null);
            }
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Error listening to profile changes:', error);
          callback(null);
        }
      );
  }

  /**
   * Get partner's profile (for couples)
   */
  static async getPartnerProfile(currentUserId: string, partnerEmail: string): Promise<UserProfile | null> {
    try {
      const querySnapshot = await firestore()
        .collection(this.COLLECTION_NAME)
        .where('email', '==', partnerEmail)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        ...data,
        relationshipStartDate: data.relationshipStartDate?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      } as UserProfile;
    } catch (error) {
      console.error('Error getting partner profile:', error);
      return null;
    }
  }
}

export default FirebaseProfileService;