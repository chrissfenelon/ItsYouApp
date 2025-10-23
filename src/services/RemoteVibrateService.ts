/**
 * RemoteVibrateService
 *
 * Service pour faire vibrer le téléphone du partenaire à distance
 * avec un message personnalisé romantique
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Vibration } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import FCMService from './FCMService';

export type VibratePattern =
  | 'gentle' // Doux
  | 'normal' // Normal
  | 'strong' // Fort
  | 'heartbeat' // Battement de cœur
  | 'kiss' // Bisou
  | 'hug' // Câlin
  | 'love' // Amour
  | 'miss_you'; // Tu me manques

export interface VibrateMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  message: string;
  pattern: VibratePattern;
  createdAt: Date;
  seen: boolean;
}

const VIBRATE_COLLECTION = 'vibrateMessages';

// Vibration patterns en millisecondes
// Format: [wait, vibrate, wait, vibrate, ...]
const VIBRATION_PATTERNS: Record<VibratePattern, number[]> = {
  gentle: [0, 700, 400, 700, 600, 500, 400, 900], // Une vibration courte et douce
  normal: [0, 800, 800, 800], // Vibration normale
  strong: [0, 900], // Vibration forte et longue
  heartbeat: [0, 900, 900, 900, 900, 900, 900, 900], // Ba-boum, ba-boum
  kiss: [0, 500, 200, 700, 400, 800], // Petits bisous rapides
  hug: [0, 500, 200, 500, 500, 600, 800, 900], // Long câlin
  love: [0, 200, 900, 700, 800, 400, 100, 800], // Pattern romantique
  miss_you: [0, 700, 900, 300, 700, 300, 900, 600], // Tu me manques
};

// Messages prédéfinis romantiques
export const PRESET_MESSAGES = [
  { emoji: '😒', text: 'Ou manke m' },
  { emoji: '😘', text: 'Je t\'aime' },
  { emoji: '🤗', text: 'Gros câlin' },
  { emoji: '💋', text: 'Gros bisou' },
  { emoji: '❤️', text: 'Je pense à toi' },
  { emoji: '🥰', text: 'T\'es dans mes pensées' },
  { emoji: '😂', text: 'Vin jwe quiz' },
  { emoji: '😫', text: 'Vin jwe mokwaze' },
  { emoji: '🌚', text: 'Vin jwe TicTacToe' },
  { emoji: '😂', text: 'Vin jwe mopyon' },
];

// Noms des patterns pour l'UI
export const PATTERN_NAMES: Record<VibratePattern, string> = {
  gentle: 'Dous🌚',
  normal: 'Nomal🌝',
  strong: 'Fò😂😫',
  heartbeat: 'Batman kè🤍',
  kiss: 'Bizou💋',
  hug: 'Kalen🤗',
  love: 'Ayouyou😫❤️',
  miss_you: 'Ou manke m😒',
};

export class RemoteVibrateService {
  private static listeners: (() => void)[] = [];

  /**
   * Envoyer une vibration au partenaire
   */
  static async sendVibrate(
    message: string,
    pattern: VibratePattern = 'normal'
  ): Promise<string> {
    try {
      // Vérifier la connexion internet
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        throw new Error('NO_INTERNET');
      }

      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('NOT_AUTHENTICATED');
      }

      console.log('📳 Sending vibrate message to partner...');

      // Get partner info
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const userData = userDoc.data();
      const partnerId = userData?.partnerId;
      const partnerName = userData?.partnerName || 'Ton partenaire';

      if (!partnerId) {
        throw new Error('NO_PARTNER');
      }

      // Vérifier si le partenaire existe et est actif
      const partnerDoc = await firestore()
        .collection('users')
        .doc(partnerId)
        .get();

      if (!partnerDoc.exists) {
        throw new Error('PARTNER_NOT_FOUND');
      }

      // Create vibrate message document
      const vibrateRef = firestore().collection(VIBRATE_COLLECTION).doc();

      const vibrateMessage: Omit<VibrateMessage, 'id'> = {
        fromUserId: currentUser.uid,
        fromUserName: userData?.name || 'Ton partenaire',
        toUserId: partnerId,
        toUserName: partnerName,
        message,
        pattern,
        createdAt: new Date(),
        seen: false,
      };

      await vibrateRef.set({
        ...vibrateMessage,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      console.log('✅ Vibrate message created:', vibrateRef.id);

      // Note: Push notification would require Firebase Cloud Functions
      // For now, the real-time listener will handle the notification
      // TODO: Implement Cloud Function for push notifications
      console.log('📱 Vibrate message will be received via real-time listener');

      return vibrateRef.id;
    } catch (error) {
      console.error('❌ Error sending vibrate:', error);
      throw error;
    }
  }

  /**
   * Envoyer une vibration instantanée au partenaire (sans message)
   * Utilisé pour le mode interactif
   */
  static async sendInstantVibrate(pattern: VibratePattern = 'normal'): Promise<string> {
    try {
      // Vérifier la connexion internet
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        throw new Error('NO_INTERNET');
      }

      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('NOT_AUTHENTICATED');
      }

      // Get partner info
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const userData = userDoc.data();
      const partnerId = userData?.partnerId;

      if (!partnerId) {
        throw new Error('NO_PARTNER');
      }

      // Message automatique basé sur le pattern
      const instantMessage = PATTERN_NAMES[pattern];

      // Create vibrate message document
      const vibrateRef = firestore().collection(VIBRATE_COLLECTION).doc();

      const vibrateMessage: Omit<VibrateMessage, 'id'> = {
        fromUserId: currentUser.uid,
        fromUserName: userData?.name || 'Ton partenaire',
        toUserId: partnerId,
        toUserName: userData?.partnerName || 'Ton partenaire',
        message: instantMessage,
        pattern,
        createdAt: new Date(),
        seen: false,
      };

      await vibrateRef.set({
        ...vibrateMessage,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      console.log('⚡ Instant vibrate sent:', pattern);

      return vibrateRef.id;
    } catch (error) {
      console.error('❌ Error sending instant vibrate:', error);
      throw error;
    }
  }

  /**
   * Envoyer notification push pour la vibration
   * NOTE: Cette méthode nécessite Firebase Cloud Functions pour fonctionner
   * Pour l'instant, les vibrations sont reçues via le listener en temps réel
   */
  private static async sendVibrateNotification(
    messageId: string,
    message: Omit<VibrateMessage, 'id'>
  ): Promise<void> {
    try {
      // TODO: Implement this via Firebase Cloud Functions
      // Cloud Function should:
      // 1. Get partner's FCM token from Firestore
      // 2. Send notification via Firebase Admin SDK
      console.log('📱 Push notification will be implemented via Cloud Functions');
      console.log('For now, vibrations are received via real-time listener');
    } catch (error) {
      console.error('❌ Error sending vibrate notification:', error);
    }
  }

  /**
   * Marquer un message de vibration comme vu
   */
  static async markAsSeen(messageId: string): Promise<void> {
    try {
      await firestore()
        .collection(VIBRATE_COLLECTION)
        .doc(messageId)
        .update({ seen: true });

      console.log('✅ Vibrate message marked as seen:', messageId);
    } catch (error) {
      console.error('❌ Error marking vibrate as seen:', error);
    }
  }

  /**
   * Obtenir les messages de vibration non vus
   */
  static async getUnseenMessages(): Promise<VibrateMessage[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return [];

      const snapshot = await firestore()
        .collection(VIBRATE_COLLECTION)
        .where('toUserId', '==', currentUser.uid)
        .where('seen', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const messages: VibrateMessage[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as VibrateMessage));

      return messages;
    } catch (error) {
      console.error('❌ Error getting unseen vibrate messages:', error);
      return [];
    }
  }

  /**
   * Écouter les nouveaux messages de vibration en temps réel
   */
  static subscribeToVibrateMessages(
    callback: (message: VibrateMessage) => void
  ): () => void {
    const currentUser = auth().currentUser;
    if (!currentUser) return () => {};

    const unsubscribe = firestore()
      .collection(VIBRATE_COLLECTION)
      .where('toUserId', '==', currentUser.uid)
      .where('seen', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const message: VibrateMessage = {
                id: change.doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
              } as VibrateMessage;

              console.log('📳 New vibrate message received:', message);
              callback(message);
            }
          });
        },
        (error) => {
          console.error('❌ Error listening to vibrate messages:', error);
        }
      );

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Faire vibrer l'appareil avec le pattern spécifié
   */
  static vibrate(pattern: VibratePattern = 'normal'): void {
    try {
      const vibrationPattern = VIBRATION_PATTERNS[pattern];

      console.log(`📳 Vibrating with pattern: ${pattern}`, vibrationPattern);

      // Vibrer avec le pattern
      Vibration.vibrate(vibrationPattern);
    } catch (error) {
      console.error('❌ Error vibrating:', error);
    }
  }

  /**
   * Annuler toutes les vibrations
   */
  static cancelVibration(): void {
    try {
      Vibration.cancel();
    } catch (error) {
      console.error('❌ Error canceling vibration:', error);
    }
  }

  /**
   * Tester un pattern de vibration (preview)
   */
  static testPattern(pattern: VibratePattern): void {
    console.log(`🧪 Testing vibration pattern: ${pattern}`);
    this.vibrate(pattern);
  }

  /**
   * Obtenir l'historique des vibrations envoyées
   */
  static async getSentHistory(limit: number = 20): Promise<VibrateMessage[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return [];

      const snapshot = await firestore()
        .collection(VIBRATE_COLLECTION)
        .where('fromUserId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as VibrateMessage));
    } catch (error) {
      console.error('❌ Error getting sent history:', error);
      return [];
    }
  }

  /**
   * Obtenir l'historique des vibrations reçues
   */
  static async getReceivedHistory(limit: number = 20): Promise<VibrateMessage[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return [];

      const snapshot = await firestore()
        .collection(VIBRATE_COLLECTION)
        .where('toUserId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as VibrateMessage));
    } catch (error) {
      console.error('❌ Error getting received history:', error);
      return [];
    }
  }

  /**
   * Nettoyer les anciens messages (plus de 7 jours)
   */
  static async cleanOldMessages(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const snapshot = await firestore()
        .collection(VIBRATE_COLLECTION)
        .where('createdAt', '<', firestore.Timestamp.fromDate(sevenDaysAgo))
        .get();

      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`✅ Cleaned ${snapshot.size} old vibrate messages`);
    } catch (error) {
      console.error('❌ Error cleaning old messages:', error);
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

export default RemoteVibrateService;
