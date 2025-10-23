import firestore from '@react-native-firebase/firestore';
import { fetchWithRetry } from '../utils/retryUtils';

export interface PartnerLinkCode {
  code: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
}

export class PartnerLinkService {
  private static readonly CODES_COLLECTION = 'partner_link_codes';
  private static readonly USERS_COLLECTION = 'users';
  private static readonly CODE_EXPIRY_HOURS = 24; // Code expires after 24 hours

  /**
   * Generate a random 6-character alphanumeric code
   */
  private static generateCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  /**
   * Create a new partner link code for the user
   */
  static async createLinkCode(
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<string> {
    try {
      // Validate inputs
      if (!userEmail || userEmail.trim() === '') {
        throw new Error('Email utilisateur manquant. Veuillez vous reconnecter.');
      }

      console.log('Creating link code with:', { userId, userName, userEmail });

      // Delete any existing codes for this user
      await this.deleteUserCodes(userId);

      const code = this.generateCode();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.CODE_EXPIRY_HOURS * 60 * 60 * 1000);

      const linkCode: PartnerLinkCode = {
        code,
        userId,
        userName,
        userEmail: userEmail.trim(),
        createdAt: now,
        expiresAt,
        isUsed: false,
      };

      await fetchWithRetry(() =>
        firestore()
          .collection(this.CODES_COLLECTION)
          .doc(code)
          .set(linkCode)
      );

      return code;
    } catch (error) {
      console.error('Error creating link code:', error);
      throw error;
    }
  }

  /**
   * Validate and use a partner link code
   */
  static async useLinkCode(
    code: string,
    currentUserId: string
  ): Promise<{ partnerId: string; partnerName: string; partnerEmail: string }> {
    try {
      const codeDoc = await fetchWithRetry(() =>
        firestore()
          .collection(this.CODES_COLLECTION)
          .doc(code.toUpperCase())
          .get()
      );

      if (!codeDoc.exists) {
        throw new Error('Code invalide');
      }

      const linkData = codeDoc.data() as any;

      // Check if code is expired
      const expiresAt = linkData.expiresAt?.toDate ? linkData.expiresAt.toDate() : new Date(linkData.expiresAt);
      if (new Date() > expiresAt) {
        throw new Error('Ce code a expiré');
      }

      // Check if code is already used
      if (linkData.isUsed) {
        throw new Error('Ce code a déjà été utilisé');
      }

      // Check if user is trying to link with themselves
      if (linkData.userId === currentUserId) {
        throw new Error('Vous ne pouvez pas vous lier avec vous-même');
      }

      // Check if users are already linked (with retry)
      const currentUserDoc = await fetchWithRetry(() =>
        firestore()
          .collection(this.USERS_COLLECTION)
          .doc(currentUserId)
          .get()
      );

      // If user document doesn't exist, create it
      if (!currentUserDoc.exists) {
        await firestore()
          .collection(this.USERS_COLLECTION)
          .doc(currentUserId)
          .set({
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
      } else if (currentUserDoc.data()?.partnerId) {
        throw new Error('Vous êtes déjà lié avec un partenaire');
      }

      const partnerDoc = await fetchWithRetry(() =>
        firestore()
          .collection(this.USERS_COLLECTION)
          .doc(linkData.userId)
          .get()
      );

      // If partner document doesn't exist, create it
      if (!partnerDoc.exists) {
        await firestore()
          .collection(this.USERS_COLLECTION)
          .doc(linkData.userId)
          .set({
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
      } else if (partnerDoc.data()?.partnerId) {
        throw new Error('Ce partenaire est déjà lié avec quelqu\'un d\'autre');
      }

      // Link the two users - do operations separately to identify which one fails
      console.log('Step 1: Updating current user...');
      const currentUserRef = firestore().collection(this.USERS_COLLECTION).doc(currentUserId);
      await currentUserRef.set(
        {
          partnerId: linkData.userId,
          relationshipStartDate: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log('Step 1: Current user updated successfully');

      console.log('Step 2: Updating partner...');
      const partnerRef = firestore().collection(this.USERS_COLLECTION).doc(linkData.userId);
      await partnerRef.set(
        {
          partnerId: currentUserId,
          relationshipStartDate: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log('Step 2: Partner updated successfully');

      console.log('Step 3: Marking code as used...');
      const codeRef = firestore().collection(this.CODES_COLLECTION).doc(code.toUpperCase());
      await codeRef.update({ isUsed: true });
      console.log('Step 3: Code marked as used');

      console.log('Step 4: Creating couple document...');
      const coupleId = this.generateCoupleId(currentUserId, linkData.userId);
      const coupleRef = firestore().collection('couples').doc(coupleId);

      // Get current user data
      const currentUserData = currentUserDoc.data();

      await coupleRef.set({
        coupleId,
        user1Id: currentUserId,
        user2Id: linkData.userId,
        user1Name: currentUserData?.name || 'User',
        user2Name: linkData.userName,
        sharedNotesCount: 0,
        lastActivity: firestore.FieldValue.serverTimestamp(),
        isActive: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('Step 4: Couple document created');

      return {
        partnerId: linkData.userId,
        partnerName: linkData.userName,
        partnerEmail: linkData.userEmail,
      };
    } catch (error) {
      console.error('Error using link code:', error);
      throw error;
    }
  }

  /**
   * Unlink from current partner
   */
  static async unlinkPartner(userId: string): Promise<void> {
    try {
      const userDoc = await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();

      if (!userDoc.exists || !userDoc.data()?.partnerId) {
        throw new Error('Vous n\'êtes pas lié avec un partenaire');
      }

      const partnerId = userDoc.data()!.partnerId;

      // Check if couple document exists
      const coupleId = this.generateCoupleId(userId, partnerId);
      const coupleRef = firestore().collection('couples').doc(coupleId);
      const coupleDoc = await coupleRef.get();

      const batch = firestore().batch();

      // Remove partnerId from both users (set to null instead of delete for Firestore rules)
      const userRef = firestore().collection(this.USERS_COLLECTION).doc(userId);
      batch.update(userRef, {
        partnerId: null,
        relationshipStartDate: firestore.FieldValue.delete(),
      });

      const partnerRef = firestore().collection(this.USERS_COLLECTION).doc(partnerId);
      batch.update(partnerRef, {
        partnerId: null,
        relationshipStartDate: firestore.FieldValue.delete(),
      });

      // Mark couple as inactive only if it exists
      if (coupleDoc.exists) {
        batch.update(coupleRef, {
          isActive: false,
          unlinkedAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error unlinking partner:', error);
      throw error;
    }
  }

  /**
   * Delete all codes created by a user
   */
  private static async deleteUserCodes(userId: string): Promise<void> {
    try {
      const codesSnapshot = await firestore()
        .collection(this.CODES_COLLECTION)
        .where('userId', '==', userId)
        .get();

      const batch = firestore().batch();
      codesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      if (!codesSnapshot.empty) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error deleting user codes:', error);
      // Don't throw - allow code creation to continue even if cleanup fails
    }
  }

  /**
   * Link partners by email address
   */
  static async linkByEmail(
    currentUserId: string,
    partnerEmail: string
  ): Promise<{ partnerId: string; partnerName: string; partnerEmail: string }> {
    try {
      // Normalize email
      const normalizedEmail = partnerEmail.trim().toLowerCase();

      if (!normalizedEmail) {
        throw new Error('Veuillez entrer une adresse email');
      }

      // Search for user with this email in Firebase Auth users collection
      const usersSnapshot = await firestore()
        .collection(this.USERS_COLLECTION)
        .where('email', '==', normalizedEmail)
        .get();

      if (usersSnapshot.empty) {
        throw new Error('Aucun utilisateur trouvé avec cet email');
      }

      if (usersSnapshot.size > 1) {
        console.warn('Multiple users found with same email, using first one');
      }

      const partnerDoc = usersSnapshot.docs[0];
      const partnerId = partnerDoc.id;
      const partnerData = partnerDoc.data();

      // Check if trying to link with self
      if (partnerId === currentUserId) {
        throw new Error('Vous ne pouvez pas vous lier avec vous-même');
      }

      // Check if current user already has a partner
      const currentUserDoc = await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(currentUserId)
        .get();

      if (!currentUserDoc.exists) {
        await firestore()
          .collection(this.USERS_COLLECTION)
          .doc(currentUserId)
          .set({
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
      } else if (currentUserDoc.data()?.partnerId) {
        throw new Error('Vous êtes déjà lié avec un partenaire');
      }

      // Check if partner already has a partner
      if (partnerData?.partnerId) {
        throw new Error('Ce partenaire est déjà lié avec quelqu\'un d\'autre');
      }

      // Link the two users
      console.log('Step 1: Updating current user...');
      const currentUserRef = firestore().collection(this.USERS_COLLECTION).doc(currentUserId);
      await currentUserRef.set(
        {
          partnerId: partnerId,
          relationshipStartDate: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log('Step 1: Current user updated successfully');

      console.log('Step 2: Updating partner...');
      const partnerRef = firestore().collection(this.USERS_COLLECTION).doc(partnerId);
      await partnerRef.set(
        {
          partnerId: currentUserId,
          relationshipStartDate: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log('Step 2: Partner updated successfully');

      console.log('Step 3: Creating couple document...');
      const coupleId = this.generateCoupleId(currentUserId, partnerId);
      const coupleRef = firestore().collection('couples').doc(coupleId);

      const currentUserData = currentUserDoc.data();

      await coupleRef.set({
        coupleId,
        user1Id: currentUserId,
        user2Id: partnerId,
        user1Name: currentUserData?.name || 'User',
        user2Name: partnerData?.name || 'User',
        sharedNotesCount: 0,
        lastActivity: firestore.FieldValue.serverTimestamp(),
        isActive: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('Step 3: Couple document created');

      return {
        partnerId: partnerId,
        partnerName: partnerData?.name || 'Partenaire',
        partnerEmail: normalizedEmail,
      };
    } catch (error) {
      console.error('Error linking by email:', error);
      throw error;
    }
  }

  /**
   * Get partner information
   */
  static async getPartnerInfo(partnerId: string): Promise<{
    id: string;
    name: string;
    email: string;
    photoURL?: string;
  } | null> {
    try {
      const partnerDoc = await fetchWithRetry(() =>
        firestore()
          .collection(this.USERS_COLLECTION)
          .doc(partnerId)
          .get()
      );

      if (!partnerDoc.exists) {
        return null;
      }

      const data = partnerDoc.data();
      return {
        id: partnerId,
        name: data?.name || 'Partenaire',
        email: data?.email || '',
        photoURL: data?.photoURL,
      };
    } catch (error) {
      console.error('Error getting partner info:', error);
      return null;
    }
  }

  /**
   * Generate consistent couple ID
   */
  private static generateCoupleId(user1Id: string, user2Id: string): string {
    return [user1Id, user2Id].sort().join('_');
  }

  /**
   * Clean up expired codes (should be called periodically or by cloud function)
   */
  static async cleanExpiredCodes(): Promise<void> {
    try {
      const now = new Date();
      const expiredCodes = await firestore()
        .collection(this.CODES_COLLECTION)
        .where('expiresAt', '<', now)
        .get();

      const batch = firestore().batch();
      expiredCodes.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      if (!expiredCodes.empty) {
        await batch.commit();
        console.log(`Deleted ${expiredCodes.size} expired codes`);
      }
    } catch (error) {
      console.error('Error cleaning expired codes:', error);
    }
  }
}

export default PartnerLinkService;
