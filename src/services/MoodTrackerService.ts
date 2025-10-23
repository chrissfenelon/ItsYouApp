/**
 * MoodTrackerService
 *
 * Service pour gérer le suivi d'humeur entre partenaires
 * - Enregistrer son humeur quotidienne
 * - Voir l'humeur du partenaire
 * - Historique et statistiques
 * - Notifications si partenaire va mal
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  MoodEntry,
  MoodType,
  MoodSettings,
  MoodStats,
  formatMoodDate,
  getTodayMoodDate,
  MOOD_OPTIONS,
} from '../types/moodTracker.types';

const MOOD_ENTRIES_COLLECTION = 'moodEntries';
const MOOD_SETTINGS_COLLECTION = 'moodSettings';
const OFFLINE_MOOD_KEY = '@mood_tracker_offline_data';
const PENDING_SYNC_KEY = '@mood_tracker_pending_sync';

export class MoodTrackerService {
  private static listeners: (() => void)[] = [];
  private static syncInProgress = false;

  /**
   * Save mood data to local cache
   */
  private static async saveToLocalCache(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log('💾 Saved to local cache:', key);
    } catch (error) {
      console.error('❌ Error saving to cache:', error);
    }
  }

  /**
   * Load mood data from local cache
   */
  private static async loadFromLocalCache<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Error loading from cache:', error);
      return null;
    }
  }

  /**
   * Add to pending sync queue
   */
  private static async queueForSync(entry: any): Promise<void> {
    try {
      const pending = await this.loadFromLocalCache<any[]>(PENDING_SYNC_KEY) || [];
      pending.push({
        ...entry,
        queuedAt: Date.now(),
      });
      await this.saveToLocalCache(PENDING_SYNC_KEY, pending);
      console.log('📋 Queued for sync:', entry);

      // Try to sync immediately
      this.attemptSync();
    } catch (error) {
      console.error('❌ Error queuing for sync:', error);
    }
  }

  /**
   * Check network status
   */
  private static async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected === true && state.isInternetReachable !== false;
    } catch (error) {
      console.error('❌ Error checking network:', error);
      return false;
    }
  }

  /**
   * Attempt to sync pending changes
   */
  private static async attemptSync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    const online = await this.isOnline();
    if (!online) {
      console.log('📴 Offline - sync will happen when back online');
      return;
    }

    this.syncInProgress = true;
    await this.syncPendingChanges();
    this.syncInProgress = false;
  }

  /**
   * Sync pending changes to Firestore
   */
  private static async syncPendingChanges(): Promise<void> {
    try {
      const pending = await this.loadFromLocalCache<any[]>(PENDING_SYNC_KEY) || [];

      if (pending.length === 0) {
        console.log('✅ No pending changes to sync');
        return;
      }

      console.log(`🔄 Syncing ${pending.length} pending mood entries...`);

      const synced: any[] = [];
      const failed: any[] = [];

      for (const entry of pending) {
        try {
          if (entry.action === 'recordMood') {
            await this.syncMoodEntry(entry.data);
            synced.push(entry);
          } else if (entry.action === 'updateSettings') {
            await this.syncSettings(entry.data);
            synced.push(entry);
          }
        } catch (error) {
          console.error('❌ Failed to sync entry:', error);
          failed.push(entry);
        }
      }

      // Keep only failed entries in the queue
      await this.saveToLocalCache(PENDING_SYNC_KEY, failed);

      console.log(`✅ Synced ${synced.length} entries, ${failed.length} failed`);
    } catch (error) {
      console.error('❌ Error syncing pending changes:', error);
    }
  }

  /**
   * Sync a mood entry to Firestore
   */
  private static async syncMoodEntry(moodData: any): Promise<void> {
    const { mood, intensity, note, activities, userId, date } = moodData;

    // Check if entry already exists for this date
    const existingMoodQuery = await firestore()
      .collection(MOOD_ENTRIES_COLLECTION)
      .where('userId', '==', userId)
      .where('date', '==', date)
      .limit(1)
      .get();

    if (!existingMoodQuery.empty) {
      // Update existing entry
      const existingDoc = existingMoodQuery.docs[0];
      await existingDoc.ref.update({
        mood,
        intensity,
        note: note || firestore.FieldValue.delete(),
        activities: activities || firestore.FieldValue.delete(),
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new entry
      const entry: any = {
        userId: moodData.userId,
        userName: moodData.userName,
        partnerId: moodData.partnerId,
        partnerName: moodData.partnerName,
        mood: moodData.mood,
        intensity: moodData.intensity,
        date: moodData.date,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      if (note) entry.note = note;
      if (activities && activities.length > 0) entry.activities = activities;

      await firestore()
        .collection(MOOD_ENTRIES_COLLECTION)
        .add(entry);
    }

    console.log('✅ Mood entry synced to Firestore');
  }

  /**
   * Sync settings to Firestore
   */
  private static async syncSettings(settingsData: any): Promise<void> {
    await firestore()
      .collection(MOOD_SETTINGS_COLLECTION)
      .doc(settingsData.userId)
      .set(settingsData.updates, { merge: true });

    console.log('✅ Settings synced to Firestore');
  }

  /**
   * Start listening for network changes to auto-sync
   */
  static startNetworkListener(): () => void {
    console.log('🌐 Starting network listener for auto-sync');

    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;

      if (isConnected) {
        console.log('📶 Network connected - attempting sync');
        this.attemptSync();
      } else {
        console.log('📴 Network disconnected');
      }
    });

    return unsubscribe;
  }

  /**
   * Enregistrer une nouvelle humeur
   */
  static async recordMood(
    mood: MoodType,
    intensity: 1 | 2 | 3 | 4 | 5,
    note?: string,
    activities?: string[]
  ): Promise<string> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('NOT_AUTHENTICATED');
      }

      console.log('📝 Recording mood...');

      const today = getTodayMoodDate();
      const tempId = `temp_${Date.now()}`;

      // Try to get user data from cache first, then from Firestore
      let userData: any = null;
      let partnerId: string | null = null;
      let partnerName: string | null = null;

      try {
        const userDoc = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .get();

        userData = userDoc.data();
        partnerId = userData?.partnerId || null;
        partnerName = userData?.partnerName || null;
      } catch (error) {
        console.log('⚠️ Could not fetch user data from Firestore, using cached data');
        // Try to get from cache
        const cachedMoods = await this.loadFromLocalCache<any[]>(`${OFFLINE_MOOD_KEY}_${currentUser.uid}`) || [];
        if (cachedMoods.length > 0) {
          const lastMood = cachedMoods[0];
          partnerId = lastMood.partnerId;
          partnerName = lastMood.partnerName;
        }
      }

      // Create mood entry data
      const moodData: any = {
        userId: currentUser.uid,
        userName: userData?.name || 'Vous',
        partnerId,
        partnerName,
        mood,
        intensity,
        date: today,
      };

      if (note) moodData.note = note;
      if (activities && activities.length > 0) moodData.activities = activities;

      // Save to local cache immediately (offline-first)
      const cacheKey = `${OFFLINE_MOOD_KEY}_${currentUser.uid}`;
      const cachedMoods = await this.loadFromLocalCache<any[]>(cacheKey) || [];

      // Remove existing entry for today if any
      const filteredMoods = cachedMoods.filter(m => m.date !== today);

      // Add new mood entry with temp ID
      const moodWithId = { ...moodData, id: tempId, createdAt: new Date() };
      filteredMoods.unshift(moodWithId);

      await this.saveToLocalCache(cacheKey, filteredMoods);
      console.log('💾 Mood saved to local cache');

      // Check if online and try to sync to Firestore
      const online = await this.isOnline();

      if (online) {
        try {
          // Check if user already recorded mood today
          const existingMoodQuery = await firestore()
            .collection(MOOD_ENTRIES_COLLECTION)
            .where('userId', '==', currentUser.uid)
            .where('date', '==', today)
            .limit(1)
            .get();

          let docId: string;

          // If mood exists for today, update it
          if (!existingMoodQuery.empty) {
            const existingDoc = existingMoodQuery.docs[0];
            await existingDoc.ref.update({
              mood,
              intensity,
              note: note || firestore.FieldValue.delete(),
              activities: activities || firestore.FieldValue.delete(),
              createdAt: firestore.FieldValue.serverTimestamp(),
            });

            docId = existingDoc.id;
            console.log('✅ Mood updated in Firestore');
          } else {
            // Create new mood entry
            const firestoreData: any = {
              ...moodData,
              createdAt: firestore.FieldValue.serverTimestamp(),
            };

            const docRef = await firestore()
              .collection(MOOD_ENTRIES_COLLECTION)
              .add(firestoreData);

            docId = docRef.id;
            console.log('✅ Mood created in Firestore:', docId);
          }

          // Update cache with real Firestore ID
          const updatedCachedMoods = cachedMoods.map(m =>
            m.id === tempId ? { ...m, id: docId } : m
          );
          await this.saveToLocalCache(cacheKey, updatedCachedMoods);

          // Check if we should notify partner
          if (partnerId) {
            await this.checkAndNotifyPartner(mood, partnerId, userData?.name || 'Votre partenaire');
          }

          return docId;
        } catch (error) {
          console.error('⚠️ Failed to save to Firestore, will sync later:', error);

          // Queue for sync later
          await this.queueForSync({
            action: 'recordMood',
            data: moodData,
          });

          return tempId;
        }
      } else {
        console.log('📴 Offline - mood will be synced when back online');

        // Queue for sync when back online
        await this.queueForSync({
          action: 'recordMood',
          data: moodData,
        });

        return tempId;
      }
    } catch (error) {
      console.error('❌ Error recording mood:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'humeur d'aujourd'hui pour un utilisateur
   */
  static async getTodayMood(userId: string): Promise<MoodEntry | null> {
    try {
      const today = getTodayMoodDate();

      // Try local cache first (offline-first)
      const cacheKey = `${OFFLINE_MOOD_KEY}_${userId}`;
      const cachedMoods = await this.loadFromLocalCache<any[]>(cacheKey) || [];
      const cachedTodayMood = cachedMoods.find(m => m.date === today);

      // Check if online
      const online = await this.isOnline();

      if (!online) {
        // Offline - return cached data
        console.log('📴 Offline - returning cached mood');
        return cachedTodayMood || null;
      }

      // Online - try to fetch from Firestore
      try {
        const querySnapshot = await firestore()
          .collection(MOOD_ENTRIES_COLLECTION)
          .where('userId', '==', userId)
          .where('date', '==', today)
          .limit(1)
          .get();

        if (querySnapshot.empty) {
          // No mood in Firestore, return cached if available
          return cachedTodayMood || null;
        }

        const doc = querySnapshot.docs[0];
        const data = doc.data();

        const moodEntry: MoodEntry = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as MoodEntry;

        // Update cache with Firestore data
        const updatedCache = cachedMoods.filter(m => m.date !== today);
        updatedCache.unshift(moodEntry);
        await this.saveToLocalCache(cacheKey, updatedCache);

        return moodEntry;
      } catch (error) {
        console.error('⚠️ Error fetching from Firestore, returning cached data:', error);
        return cachedTodayMood || null;
      }
    } catch (error) {
      console.error('❌ Error getting today mood:', error);
      return null;
    }
  }

  /**
   * Obtenir l'humeur d'aujourd'hui du partenaire
   */
  static async getPartnerTodayMood(): Promise<MoodEntry | null> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return null;

      // Try to get partner ID from cache first
      let partnerId: string | null = null;

      // Check cache
      const cacheKey = `${OFFLINE_MOOD_KEY}_${currentUser.uid}`;
      const cachedMoods = await this.loadFromLocalCache<any[]>(cacheKey) || [];
      if (cachedMoods.length > 0 && cachedMoods[0].partnerId) {
        partnerId = cachedMoods[0].partnerId;
      }

      // If not in cache, try to get from Firestore
      if (!partnerId) {
        const online = await this.isOnline();
        if (online) {
          try {
            const userDoc = await firestore()
              .collection('users')
              .doc(currentUser.uid)
              .get();

            partnerId = userDoc.data()?.partnerId;
          } catch (error) {
            console.log('⚠️ Could not fetch partnerId from Firestore');
          }
        }
      }

      if (!partnerId) {
        console.log('📴 No partner ID found');
        return null;
      }

      // Get partner's mood using the same offline-first method
      return await this.getTodayMood(partnerId);
    } catch (error) {
      console.error('❌ Error getting partner mood:', error);
      return null;
    }
  }

  /**
   * Obtenir l'historique des humeurs
   */
  static async getMoodHistory(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MoodEntry[]> {
    try {
      const startDateStr = formatMoodDate(startDate);
      const endDateStr = formatMoodDate(endDate);

      // Try local cache first
      const cacheKey = `${OFFLINE_MOOD_KEY}_${userId}`;
      const cachedMoods = await this.loadFromLocalCache<any[]>(cacheKey) || [];

      // Filter cached moods by date range
      const filteredCachedMoods = cachedMoods.filter(m =>
        m.date >= startDateStr && m.date <= endDateStr
      );

      // Check if online
      const online = await this.isOnline();

      if (!online) {
        // Offline - return cached data
        console.log('📴 Offline - returning cached mood history');
        return filteredCachedMoods.sort((a, b) => b.date.localeCompare(a.date));
      }

      // Online - try to fetch from Firestore
      try {
        const querySnapshot = await firestore()
          .collection(MOOD_ENTRIES_COLLECTION)
          .where('userId', '==', userId)
          .where('date', '>=', startDateStr)
          .where('date', '<=', endDateStr)
          .orderBy('date', 'desc')
          .get();

        const moodEntries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as MoodEntry));

        // Update cache with Firestore data
        // Merge with existing cache, removing duplicates
        const existingDates = new Set(moodEntries.map(m => m.date));
        const nonOverlappingCache = cachedMoods.filter(m =>
          !existingDates.has(m.date)
        );

        const mergedMoods = [...moodEntries, ...nonOverlappingCache];
        await this.saveToLocalCache(cacheKey, mergedMoods);

        return moodEntries;
      } catch (error) {
        console.error('⚠️ Error fetching from Firestore, returning cached data:', error);
        return filteredCachedMoods.sort((a, b) => b.date.localeCompare(a.date));
      }
    } catch (error) {
      console.error('❌ Error getting mood history:', error);
      return [];
    }
  }

  /**
   * Obtenir l'historique des humeurs du couple
   */
  static async getCoupleMoodHistory(days: number = 30): Promise<MoodEntry[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return [];

      // Get partner ID
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const partnerId = userDoc.data()?.partnerId;
      if (!partnerId) {
        // No partner, return only user's moods
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        return await this.getMoodHistory(currentUser.uid, startDate, endDate);
      }

      // Get both user's and partner's moods
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [userMoods, partnerMoods] = await Promise.all([
        this.getMoodHistory(currentUser.uid, startDate, endDate),
        this.getMoodHistory(partnerId, startDate, endDate),
      ]);

      // Combine and sort by date
      return [...userMoods, ...partnerMoods].sort((a, b) =>
        b.date.localeCompare(a.date)
      );
    } catch (error) {
      console.error('❌ Error getting couple mood history:', error);
      return [];
    }
  }

  /**
   * Calculer les statistiques d'humeur
   */
  static async getMoodStats(
    userId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<MoodStats> {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const moods = await this.getMoodHistory(userId, startDate, endDate);

      if (moods.length === 0) {
        return {
          userId,
          period,
          totalEntries: 0,
          moodDistribution: {},
          averageIntensity: 0,
          currentStreak: 0,
          longestStreak: 0,
          mostCommonMood: 'okay',
          insights: [],
        };
      }

      // Calculate mood distribution
      const moodCounts: { [key in MoodType]?: number } = {};
      let totalIntensity = 0;

      moods.forEach(mood => {
        moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
        totalIntensity += mood.intensity;
      });

      const moodDistribution: { [key in MoodType]?: number } = {};
      Object.keys(moodCounts).forEach(mood => {
        moodDistribution[mood as MoodType] =
          Math.round((moodCounts[mood as MoodType]! / moods.length) * 100);
      });

      // Find most common mood
      const mostCommonMood = (Object.keys(moodCounts) as MoodType[]).reduce((a, b) =>
        (moodCounts[a] || 0) > (moodCounts[b] || 0) ? a : b
      );

      // Calculate streaks
      const positiveMoods: MoodType[] = ['amazing', 'happy', 'good'];
      let currentStreak = 0;
      let longestStreak = 0;
      let streak = 0;

      for (const mood of moods) {
        if (positiveMoods.includes(mood.mood)) {
          streak++;
          if (streak > longestStreak) {
            longestStreak = streak;
          }
        } else {
          streak = 0;
        }
      }

      // Current streak (from most recent)
      for (const mood of moods) {
        if (positiveMoods.includes(mood.mood)) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Generate insights
      const insights: string[] = [];

      const happyPercentage = (moodDistribution.amazing || 0) +
                              (moodDistribution.happy || 0) +
                              (moodDistribution.good || 0);

      if (happyPercentage > 70) {
        insights.push('Vous êtes globalement très heureux! 🌟');
      } else if (happyPercentage < 30) {
        insights.push('Prenez soin de vous 💙');
      }

      if (currentStreak >= 3) {
        insights.push(`${currentStreak} jours consécutifs positifs! 🔥`);
      }

      return {
        userId,
        period,
        totalEntries: moods.length,
        moodDistribution,
        averageIntensity: totalIntensity / moods.length,
        currentStreak,
        longestStreak,
        mostCommonMood,
        insights,
      };
    } catch (error) {
      console.error('❌ Error getting mood stats:', error);
      throw error;
    }
  }

  /**
   * Vérifier si le partenaire doit être notifié
   */
  private static async checkAndNotifyPartner(
    mood: MoodType,
    partnerId: string,
    userName: string
  ): Promise<void> {
    try {
      // Get partner's settings
      const settingsDoc = await firestore()
        .collection(MOOD_SETTINGS_COLLECTION)
        .doc(partnerId)
        .get();

      // If settings don't exist yet, return silently
      if (!settingsDoc.exists) {
        console.log('⏭️ Partner settings not found, skipping notification check');
        return;
      }

      const settings = settingsDoc.data();

      // Check if notifications are enabled
      if (!settings?.notifications?.enableAlerts) {
        console.log('⏭️ Partner notifications disabled, skipping');
        return;
      }

      // Check if this mood should trigger a notification
      const shouldNotify =
        (mood === 'sad' && settings.notifications.alertOnSad) ||
        (mood === 'anxious' && settings.notifications.alertOnAnxious) ||
        (mood === 'angry' && settings.notifications.alertOnAngry);

      if (shouldNotify) {
        console.log('📬 Partner should be notified about mood:', mood);
        // TODO: Send push notification via FCM
        // This would require Firebase Cloud Functions
      } else {
        console.log('⏭️ Mood does not trigger notification');
      }
    } catch (error: any) {
      // Silently log permission errors (partner settings might not be accessible)
      if (error?.code === 'permission-denied') {
        console.log('⏭️ Cannot access partner settings (permission denied), skipping notification');
      } else {
        console.error('❌ Error checking partner notification:', error);
      }
    }
  }

  /**
   * S'abonner aux changements d'humeur du partenaire en temps réel
   */
  static subscribeToPartnerMood(
    callback: (mood: MoodEntry | null) => void
  ): () => void {
    const currentUser = auth().currentUser;
    if (!currentUser) return () => {};

    let unsubscribeUser: (() => void) | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    // First, get the partner ID and try to subscribe
    const getUserPartner = async () => {
      try {
        // Check if online first
        const online = await this.isOnline();

        if (!online) {
          console.log('📴 Offline - using polling for partner mood');
          // Start polling every 30 seconds when offline
          startPolling();
          return;
        }

        const userDoc = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .get();

        const partnerId = userDoc.data()?.partnerId;
        if (!partnerId) {
          callback(null);
          return;
        }

        const today = getTodayMoodDate();

        // Try to subscribe to partner's mood for today
        try {
          unsubscribeUser = firestore()
            .collection(MOOD_ENTRIES_COLLECTION)
            .where('userId', '==', partnerId)
            .where('date', '==', today)
            .limit(1)
            .onSnapshot(
              (snapshot) => {
                if (snapshot.empty) {
                  callback(null);
                  return;
                }

                const doc = snapshot.docs[0];
                const data = doc.data();

                const moodEntry = {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate() || new Date(),
                } as MoodEntry;

                callback(moodEntry);

                // Update cache for partner's mood
                const cacheKey = `${OFFLINE_MOOD_KEY}_${partnerId}`;
                this.loadFromLocalCache<any[]>(cacheKey).then(cachedMoods => {
                  const moods = cachedMoods || [];
                  const filteredMoods = moods.filter(m => m.date !== today);
                  filteredMoods.unshift(moodEntry);
                  this.saveToLocalCache(cacheKey, filteredMoods);
                });
              },
              (error) => {
                // Permission denied or other Firestore error
                console.log('⚠️ Cannot subscribe to partner mood (permission denied or offline)');
                console.log('📴 Falling back to polling mode');

                // Fall back to polling
                startPolling();
              }
            );
        } catch (subscribeError) {
          console.log('⚠️ Subscribe failed, using polling instead');
          startPolling();
        }
      } catch (error) {
        console.log('⚠️ Error getting partner, using polling');
        startPolling();
      }
    };

    // Polling function - checks for partner mood every 30 seconds
    const startPolling = () => {
      // Clear any existing polling
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      // Poll immediately
      pollPartnerMood();

      // Then poll every 30 seconds
      pollInterval = setInterval(() => {
        pollPartnerMood();
      }, 30000);
    };

    const pollPartnerMood = async () => {
      try {
        const partnerMood = await this.getPartnerTodayMood();
        callback(partnerMood);
      } catch (error) {
        console.log('⚠️ Error polling partner mood');
      }
    };

    getUserPartner();

    const cleanup = () => {
      if (unsubscribeUser) {
        unsubscribeUser();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };

    this.listeners.push(cleanup);
    return cleanup;
  }

  /**
   * Obtenir les paramètres de l'utilisateur
   */
  static async getSettings(): Promise<MoodSettings> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('NOT_AUTHENTICATED');
      }

      // Try local cache first
      const cacheKey = `${MOOD_SETTINGS_COLLECTION}_${currentUser.uid}`;
      const cachedSettings = await this.loadFromLocalCache<MoodSettings>(cacheKey);

      // Check if online
      const online = await this.isOnline();

      if (!online) {
        // Offline - return cached settings or defaults
        console.log('📴 Offline - returning cached settings');
        return cachedSettings || this.getDefaultSettings(currentUser.uid);
      }

      // Online - try to fetch from Firestore
      try {
        const doc = await firestore()
          .collection(MOOD_SETTINGS_COLLECTION)
          .doc(currentUser.uid)
          .get();

        if (!doc.exists) {
          // Try to get partnerId from Firestore
          let partnerId: string | null = null;
          try {
            const userDoc = await firestore()
              .collection('users')
              .doc(currentUser.uid)
              .get();
            partnerId = userDoc.data()?.partnerId || null;
          } catch (error) {
            console.log('⚠️ Could not fetch partnerId from Firestore');
          }

          const defaultSettings = this.getDefaultSettings(currentUser.uid, partnerId);

          // Save to cache
          await this.saveToLocalCache(cacheKey, defaultSettings);

          return defaultSettings;
        }

        const settings = doc.data() as MoodSettings;

        // Update cache
        await this.saveToLocalCache(cacheKey, settings);

        return settings;
      } catch (error) {
        console.error('⚠️ Error fetching settings from Firestore, returning cached data:', error);
        return cachedSettings || this.getDefaultSettings(currentUser.uid);
      }
    } catch (error) {
      console.error('❌ Error getting settings:', error);
      throw error;
    }
  }

  /**
   * Get default settings
   */
  private static getDefaultSettings(userId: string, partnerId: string | null = null): MoodSettings {
    return {
      userId,
      partnerId,
      notifications: {
        enableAlerts: true,
        alertOnSad: true,
        alertOnAnxious: true,
        alertOnAngry: true,
        dailyReminder: false,
        reminderTime: '20:00',
      },
      visibility: {
        showNotes: true,
        showActivities: true,
      },
    };
  }

  /**
   * Mettre à jour les paramètres
   */
  static async updateSettings(updates: Partial<MoodSettings>): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('NOT_AUTHENTICATED');
      }

      // Save to local cache first
      const cacheKey = `${MOOD_SETTINGS_COLLECTION}_${currentUser.uid}`;
      const currentSettings = await this.loadFromLocalCache<MoodSettings>(cacheKey) || {};
      const mergedSettings = { ...currentSettings, ...updates };
      await this.saveToLocalCache(cacheKey, mergedSettings);
      console.log('💾 Settings saved to local cache');

      // Check if online
      const online = await this.isOnline();

      if (online) {
        try {
          await firestore()
            .collection(MOOD_SETTINGS_COLLECTION)
            .doc(currentUser.uid)
            .set(updates, { merge: true });

          console.log('✅ Settings updated in Firestore');
        } catch (error) {
          console.error('⚠️ Failed to update settings in Firestore, will sync later:', error);

          // Queue for sync later
          await this.queueForSync({
            action: 'updateSettings',
            data: {
              userId: currentUser.uid,
              updates,
            },
          });
        }
      } else {
        console.log('📴 Offline - settings will be synced when back online');

        // Queue for sync when back online
        await this.queueForSync({
          action: 'updateSettings',
          data: {
            userId: currentUser.uid,
            updates,
          },
        });
      }
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      throw error;
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

export default MoodTrackerService;
