/**
 * DareToPlayService
 *
 * Handles game challenges/dares between partners:
 * - Send dare notifications to partner
 * - Generate shareable invite links
 * - Handle deep link navigation to games
 * - Track dare statistics
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Platform, Share, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FCMService from './FCMService';
import NavigationService from './NavigationService';

export type GameType =
  | 'morpion'
  | 'puissance4'
  | 'wordsearch'
  | 'crosswords'
  | 'quizcouple'
  | 'dominos';

export interface DareData {
  id: string;
  gameType: GameType;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  message?: string;
  gameSettings?: any;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  gameId?: string; // ID of the game session if accepted
}

interface DareStats {
  sent: number;
  received: number;
  accepted: number;
  declined: number;
  won: number;
  lost: number;
}

const DARE_COLLECTION = 'dares';
const DARE_EXPIRY_HOURS = 24; // Dares expire after 24 hours
const DEEP_LINK_SCHEME = 'itsyouapp'; // itsyouapp://dare/[dareId]
const WEB_LINK_BASE = 'https://itsyouapp.page.link'; // Firebase Dynamic Links

export class DareToPlayService {
  private static listeners: (() => void)[] = [];

  /**
   * Initialize the service - setup deep link handlers
   */
  static async initialize() {
    try {
      console.log('🎮 Initializing DareToPlayService...');

      // Handle initial deep link (app opened from link)
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('🔗 Initial URL:', initialUrl);
        await this.handleDeepLink(initialUrl);
      }

      // Handle deep links while app is running
      const subscription = Linking.addEventListener('url', ({ url }) => {
        console.log('🔗 Deep link received:', url);
        this.handleDeepLink(url);
      });

      console.log('✅ DareToPlayService initialized');

      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('❌ Error initializing DareToPlayService:', error);
    }
  }

  /**
   * Send a dare to play a game to partner
   */
  static async sendDare(
    gameType: GameType,
    message?: string,
    gameSettings?: any
  ): Promise<string> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Get partner info
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const userData = userDoc.data();
      const partnerId = userData?.partnerId;
      const partnerName = userData?.partnerName || 'Ton partenaire';

      console.log('📋 Dare Debug - User data:', {
        userId: currentUser.uid,
        partnerId,
        partnerName,
        hasPartner: !!partnerId
      });

      if (!partnerId) {
        throw new Error('Aucun partenaire connecté');
      }

      // Create dare document
      const dareRef = firestore().collection(DARE_COLLECTION).doc();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + DARE_EXPIRY_HOURS * 60 * 60 * 1000);

      const dare: Omit<DareData, 'id'> = {
        gameType,
        fromUserId: currentUser.uid,
        fromUserName: userData?.name || 'Ton partenaire',
        toUserId: partnerId,
        toUserName: partnerName,
        message,
        gameSettings,
        status: 'pending',
        createdAt: now,
        expiresAt,
      };

      // Filter out undefined values (Firestore doesn't accept undefined)
      const dareData: any = {
        gameType: dare.gameType,
        fromUserId: dare.fromUserId,
        fromUserName: dare.fromUserName,
        toUserId: dare.toUserId,
        toUserName: dare.toUserName,
        status: dare.status,
        createdAt: firestore.FieldValue.serverTimestamp(),
        expiresAt: firestore.Timestamp.fromDate(expiresAt),
      };

      // Add optional fields only if they have values
      if (message) dareData.message = message;
      if (gameSettings) dareData.gameSettings = gameSettings;

      await dareRef.set(dareData);

      console.log('✅ Dare created:', {
        dareId: dareRef.id,
        fromUserId: currentUser.uid,
        toUserId: partnerId,
        gameType,
        message
      });

      // Send push notification to partner
      await this.sendDareNotification(dareRef.id, dare);

      // Update stats
      await this.updateStats('sent');

      return dareRef.id;
    } catch (error) {
      console.error('❌ Error sending dare:', error);
      throw error;
    }
  }

  /**
   * Accept a dare
   */
  static async acceptDare(dareId: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const dareRef = firestore().collection(DARE_COLLECTION).doc(dareId);
      const dareDoc = await dareRef.get();

      if (!dareDoc.exists) {
        throw new Error('Dare not found');
      }

      const dare = dareDoc.data() as DareData;

      // Check if dare is still valid
      if (dare.status !== 'pending') {
        throw new Error('Dare already processed');
      }

      const expiresAt = dare.expiresAt instanceof Date
        ? dare.expiresAt
        : (dare.expiresAt as any).toDate();

      if (new Date() > expiresAt) {
        await dareRef.update({ status: 'expired' });
        throw new Error('Dare has expired');
      }

      // Update dare status
      await dareRef.update({ status: 'accepted' });

      // Update stats
      await this.updateStats('accepted');

      // Navigate to game
      this.navigateToGame(dare.gameType, dare.gameSettings);

      console.log('✅ Dare accepted:', dareId);
    } catch (error) {
      console.error('❌ Error accepting dare:', error);
      throw error;
    }
  }

  /**
   * Decline a dare
   */
  static async declineDare(dareId: string): Promise<void> {
    try {
      const dareRef = firestore().collection(DARE_COLLECTION).doc(dareId);
      await dareRef.update({ status: 'declined' });

      // Update stats
      await this.updateStats('declined');

      console.log('✅ Dare declined:', dareId);
    } catch (error) {
      console.error('❌ Error declining dare:', error);
      throw error;
    }
  }

  /**
   * Generate a shareable link for a dare
   */
  static async generateDareLink(dareId: string): Promise<string> {
    try {
      // Deep link format: itsyouapp://dare/[dareId]
      const deepLink = `${DEEP_LINK_SCHEME}://dare/${dareId}`;

      // For production, use Firebase Dynamic Links
      // const dynamicLink = await dynamicLinks().buildShortLink({
      //   link: deepLink,
      //   domainUriPrefix: WEB_LINK_BASE,
      //   android: { packageName: 'com.itsyouapp' },
      //   ios: { bundleId: 'com.itsyouapp' },
      // });
      // return dynamicLink.url;

      return deepLink;
    } catch (error) {
      console.error('❌ Error generating dare link:', error);
      throw error;
    }
  }

  /**
   * Share a dare link
   */
  static async shareDareLink(gameType: GameType, message?: string): Promise<void> {
    try {
      // Create the dare first
      const dareId = await this.sendDare(gameType, message);

      // Generate link
      const link = await this.generateDareLink(dareId);

      // Get game name
      const gameName = this.getGameName(gameType);

      // Share the link
      await Share.share({
        title: `Dare to Play - ${gameName}`,
        message: message
          ? `${message}\n\nRelève mon défi sur ${gameName}!\n${link}`
          : `Je te défie à ${gameName}!\n${link}`,
        url: link,
      });

      console.log('✅ Dare link shared');
    } catch (error) {
      console.error('❌ Error sharing dare link:', error);
      throw error;
    }
  }

  /**
   * Handle incoming deep links
   */
  private static async handleDeepLink(url: string): Promise<void> {
    try {
      console.log('🔗 Processing deep link:', url);

      // Parse URL: itsyouapp://dare/[dareId]
      const matches = url.match(/dare\/([a-zA-Z0-9_-]+)/);
      if (!matches || !matches[1]) {
        console.log('⚠️ Invalid dare link format');
        return;
      }

      const dareId = matches[1];
      console.log('🎮 Dare ID from link:', dareId);

      // Get dare data
      const dareDoc = await firestore()
        .collection(DARE_COLLECTION)
        .doc(dareId)
        .get();

      if (!dareDoc.exists) {
        console.error('❌ Dare not found');
        return;
      }

      const dare = { id: dareDoc.id, ...dareDoc.data() } as DareData;

      // Check if user is authenticated
      const currentUser = auth().currentUser;
      if (!currentUser) {
        // Store dare for later (after login)
        await AsyncStorage.setItem('@pending_dare', dareId);
        console.log('💾 Dare stored for after login');
        return;
      }

      // Show dare notification/dialog
      // This will be handled by a UI component listening to dare changes
      console.log('✅ Dare loaded, showing to user');

    } catch (error) {
      console.error('❌ Error handling deep link:', error);
    }
  }

  /**
   * Get pending dare after login
   */
  static async getPendingDare(): Promise<string | null> {
    try {
      const dareId = await AsyncStorage.getItem('@pending_dare');
      if (dareId) {
        await AsyncStorage.removeItem('@pending_dare');
      }
      return dareId;
    } catch (error) {
      console.error('❌ Error getting pending dare:', error);
      return null;
    }
  }

  /**
   * Get all pending dares for current user
   */
  static async getPendingDares(): Promise<DareData[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return [];

      const snapshot = await firestore()
        .collection(DARE_COLLECTION)
        .where('toUserId', '==', currentUser.uid)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();

      const dares: DareData[] = [];
      const now = new Date();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const expiresAt = data.expiresAt?.toDate() || new Date();

        // Check if expired
        if (now > expiresAt) {
          await doc.ref.update({ status: 'expired' });
          continue;
        }

        dares.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt,
        } as DareData);
      }

      return dares;
    } catch (error) {
      console.error('❌ Error getting pending dares:', error);
      return [];
    }
  }

  /**
   * Listen to pending dares in real-time
   */
  static subscribeToPendingDares(callback: (dares: DareData[]) => void): () => void {
    const currentUser = auth().currentUser;
    if (!currentUser) return () => {};

    const unsubscribe = firestore()
      .collection(DARE_COLLECTION)
      .where('toUserId', '==', currentUser.uid)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const dares: DareData[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            expiresAt: doc.data().expiresAt?.toDate() || new Date(),
          } as DareData));

          callback(dares);
        },
        (error) => {
          console.error('❌ Error listening to dares:', error);
        }
      );

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Send push notification for dare
   * NOTE: Cette méthode nécessite Firebase Cloud Functions pour fonctionner
   * Pour l'instant, les dares sont reçus via le listener en temps réel
   */
  private static async sendDareNotification(dareId: string, dare: Omit<DareData, 'id'>): Promise<void> {
    try {
      // TODO: Implement this via Firebase Cloud Functions
      // Cloud Function should:
      // 1. Get partner's FCM token from Firestore
      // 2. Send notification via Firebase Admin SDK
      // 3. Include dare data in notification payload

      const gameName = this.getGameName(dare.gameType);
      console.log('📱 Push notification will be implemented via Cloud Functions');
      console.log('For now, dares are received via real-time listener');
      console.log(`Dare notification: ${dare.fromUserName} te défie à ${gameName}!`);
    } catch (error) {
      console.error('❌ Error sending dare notification:', error);
    }
  }

  /**
   * Navigate to game based on type
   */
  private static navigateToGame(gameType: GameType, settings?: any): void {
    const routeMap: Record<GameType, string> = {
      morpion: 'morpionWelcome',
      puissance4: 'puissance4Mode',
      wordsearch: 'wordsearch',
      crosswords: 'crosswords',
      quizcouple: 'quizCoupleLobby',
      dominos: 'fourInARow', // Assuming dominos uses this screen
    };

    const route = routeMap[gameType];
    if (route) {
      NavigationService.navigate(route, settings);
    }
  }

  /**
   * Get game display name
   */
  private static getGameName(gameType: GameType): string {
    const names: Record<GameType, string> = {
      morpion: 'Morpion',
      puissance4: 'Puissance 4',
      wordsearch: 'Mots Cachés',
      crosswords: 'Mots Croisés',
      quizcouple: 'Quiz Couple',
      dominos: 'Dominos',
    };
    return names[gameType] || gameType;
  }

  /**
   * Update dare statistics
   */
  private static async updateStats(type: keyof DareStats): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      const statsRef = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('stats')
        .doc('dares');

      await statsRef.set(
        {
          [type]: firestore.FieldValue.increment(1),
          lastUpdated: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('❌ Error updating dare stats:', error);
    }
  }

  /**
   * Get dare statistics
   */
  static async getStats(): Promise<DareStats> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return { sent: 0, received: 0, accepted: 0, declined: 0, won: 0, lost: 0 };
      }

      const statsDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('stats')
        .doc('dares')
        .get();

      if (!statsDoc.exists) {
        return { sent: 0, received: 0, accepted: 0, declined: 0, won: 0, lost: 0 };
      }

      return statsDoc.data() as DareStats;
    } catch (error) {
      console.error('❌ Error getting dare stats:', error);
      return { sent: 0, received: 0, accepted: 0, declined: 0, won: 0, lost: 0 };
    }
  }

  /**
   * Cleanup - unsubscribe all listeners
   */
  static cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }
}

export default DareToPlayService;
