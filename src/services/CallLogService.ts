import { NativeModules, Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const { CallLogModule } = NativeModules;

export interface Call {
  id?: string;
  number: string;
  name: string;
  timestamp: number;
  duration: number;
  type: 'incoming' | 'outgoing' | 'missed' | 'rejected' | 'unknown';
  source: 'phone' | 'whatsapp' | 'instagram';
  userId?: string;
  syncedAt?: number;
}

class CallLogService {
  private static COLLECTION = 'call_logs';

  /**
   * Get recent phone calls from device
   */
  static async getRecentPhoneCalls(days: number = 7): Promise<Call[]> {
    if (Platform.OS !== 'android') {
      console.warn('Call log only available on Android');
      return [];
    }

    try {
      const calls = await CallLogModule.getRecentCalls(days);
      return calls.map((call: any) => ({
        ...call,
        source: 'phone' as const,
      }));
    } catch (error) {
      console.error('Error getting phone calls:', error);
      return [];
    }
  }

  /**
   * Get recent WhatsApp calls from device
   */
  static async getRecentWhatsAppCalls(days: number = 7): Promise<Call[]> {
    if (Platform.OS !== 'android') {
      console.warn('Call log only available on Android');
      return [];
    }

    try {
      const calls = await CallLogModule.getWhatsAppCalls(days);
      return calls.map((call: any) => ({
        ...call,
        source: 'whatsapp' as const,
      }));
    } catch (error) {
      console.error('Error getting WhatsApp calls:', error);
      return [];
    }
  }

  /**
   * Get recent Instagram calls from device
   */
  static async getRecentInstagramCalls(days: number = 7): Promise<Call[]> {
    if (Platform.OS !== 'android') {
      console.warn('Call log only available on Android');
      return [];
    }

    try {
      const calls = await CallLogModule.getInstagramCalls(days);
      return calls.map((call: any) => ({
        ...call,
        source: 'instagram' as const,
      }));
    } catch (error) {
      console.error('Error getting Instagram calls:', error);
      return [];
    }
  }

  /**
   * Get all recent calls from all sources
   */
  static async getAllRecentCalls(days: number = 7): Promise<Call[]> {
    try {
      const [phoneCalls, whatsappCalls, instagramCalls] = await Promise.all([
        this.getRecentPhoneCalls(days),
        this.getRecentWhatsAppCalls(days),
        this.getRecentInstagramCalls(days),
      ]);

      return [...phoneCalls, ...whatsappCalls, ...instagramCalls].sort(
        (a, b) => b.timestamp - a.timestamp
      );
    } catch (error) {
      console.error('Error getting all calls:', error);
      return [];
    }
  }

  /**
   * Sync calls to Firestore
   */
  static async syncCallsToFirestore(calls: Call[]): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('User not authenticated, skipping call sync');
        return;
      }

      const batch = firestore().batch();
      const now = Date.now();

      for (const call of calls) {
        // Create unique ID based on timestamp + number + source
        const callId = `${call.timestamp}_${call.number}_${call.source}`;
        const callRef = firestore()
          .collection(this.COLLECTION)
          .doc(callId);

        const callData = {
          ...call,
          id: callId,
          userId: currentUser.uid,
          syncedAt: now,
        };

        batch.set(callRef, callData, { merge: true });
      }

      await batch.commit();
      console.log(`✅ Synced ${calls.length} calls to Firestore`);
    } catch (error) {
      console.error('Error syncing calls to Firestore:', error);
      throw error;
    }
  }

  /**
   * Get calls from Firestore for current user
   */
  static async getCallsFromFirestore(days: number = 7): Promise<Call[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('User not authenticated');
        return [];
      }

      const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

      const snapshot = await firestore()
        .collection(this.COLLECTION)
        .where('userId', '==', currentUser.uid)
        .where('timestamp', '>=', startTime)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as Call);
    } catch (error) {
      console.error('Error getting calls from Firestore:', error);
      return [];
    }
  }

  /**
   * Auto-sync calls to Firestore
   */
  static async autoSyncCalls(days: number = 7): Promise<number> {
    try {
      console.log(`📞 Auto-syncing calls from last ${days} days...`);

      const calls = await this.getAllRecentCalls(days);

      if (calls.length === 0) {
        console.log('No calls to sync');
        return 0;
      }

      await this.syncCallsToFirestore(calls);
      return calls.length;
    } catch (error) {
      console.error('Error in auto-sync calls:', error);
      return 0;
    }
  }

  /**
   * Get calls by source
   */
  static async getCallsBySource(
    source: 'phone' | 'whatsapp' | 'instagram',
    days: number = 7
  ): Promise<Call[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('User not authenticated');
        return [];
      }

      const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

      const snapshot = await firestore()
        .collection(this.COLLECTION)
        .where('userId', '==', currentUser.uid)
        .where('source', '==', source)
        .where('timestamp', '>=', startTime)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as Call);
    } catch (error) {
      console.error(`Error getting ${source} calls:`, error);
      return [];
    }
  }

  /**
   * Get call statistics
   */
  static async getCallStatistics(days: number = 7): Promise<{
    total: number;
    bySource: { phone: number; whatsapp: number; instagram: number };
    byType: { incoming: number; outgoing: number; missed: number };
    totalDuration: number;
  }> {
    try {
      const calls = await this.getCallsFromFirestore(days);

      const stats = {
        total: calls.length,
        bySource: {
          phone: calls.filter(c => c.source === 'phone').length,
          whatsapp: calls.filter(c => c.source === 'whatsapp').length,
          instagram: calls.filter(c => c.source === 'instagram').length,
        },
        byType: {
          incoming: calls.filter(c => c.type === 'incoming').length,
          outgoing: calls.filter(c => c.type === 'outgoing').length,
          missed: calls.filter(c => c.type === 'missed').length,
        },
        totalDuration: calls.reduce((sum, call) => sum + (call.duration || 0), 0),
      };

      return stats;
    } catch (error) {
      console.error('Error getting call statistics:', error);
      return {
        total: 0,
        bySource: { phone: 0, whatsapp: 0, instagram: 0 },
        byType: { incoming: 0, outgoing: 0, missed: 0 },
        totalDuration: 0,
      };
    }
  }
}

export default CallLogService;
