/**
 * MoodTrackerHomeScreen
 *
 * Main mood tracker screen showing:
 * - Today's mood (user + partner)
 * - Quick stats
 * - Navigation to other mood screens
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import Foundation from 'react-native-vector-icons/Foundation';
import MoodTrackerService from '../../services/MoodTrackerService';
import SoundService from '../../services/SoundService';
import {
  MoodEntry,
  getMoodOption,
  MoodStats,
} from '../../types/moodTracker.types';

const { width } = Dimensions.get('window');

interface MoodTrackerHomeScreenProps {
  navigation: any;
}

export const MoodTrackerHomeScreen: React.FC<MoodTrackerHomeScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  // State
  const [myMood, setMyMood] = useState<MoodEntry | null>(null);
  const [partnerMood, setPartnerMood] = useState<MoodEntry | null>(null);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState(false); // ✅ Commence à false pour affichage immédiat
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load data immediately (from cache if offline)
    loadData();
    subscribeToPartner();

    // Start network listener for auto-sync
    const unsubscribeNetwork = MoodTrackerService.startNetworkListener();

    return () => {
      MoodTrackerService.cleanup();
      unsubscribeNetwork();
    };
  }, []);

  const loadData = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      // Data will be loaded from cache first, then updated from Firestore if online
      // This is now handled by the service methods (offline-first pattern)
      const [myMoodData, partnerMoodData, statsData] = await Promise.all([
        MoodTrackerService.getTodayMood(currentUser.uid),
        MoodTrackerService.getPartnerTodayMood(),
        MoodTrackerService.getMoodStats(currentUser.uid, 'week'),
      ]);

      setMyMood(myMoodData);
      setPartnerMood(partnerMoodData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const subscribeToPartner = () => {
    MoodTrackerService.subscribeToPartnerMood((mood) => {
      setPartnerMood(mood);
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRecordMood = () => {
    SoundService.haptic('light');
    navigation.navigate('recordMood');
  };

  const handleViewHistory = () => {
    SoundService.haptic('light');
    navigation.navigate('moodHistory');
  };

  const handleViewCharts = () => {
    SoundService.haptic('light');
    navigation.navigate('moodCharts');
  };

  const handleSettings = () => {
    SoundService.haptic('light');
    navigation.navigate('moodSettings');
  };

  const renderMoodCard = (
    mood: MoodEntry | null,
    title: string,
    isMe: boolean
  ) => {
    const moodOption = mood ? getMoodOption(mood.mood) : null;

    return (
      <BlurView
        style={styles.moodCard}
        blurType="light"
        blurAmount={10}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
      >
        <Text style={styles.moodCardTitle}>{title}</Text>

        {mood && moodOption ? (
          <>
            <View style={styles.moodDisplay}>
              <Text style={styles.moodEmojiLarge}>{moodOption.emoji}</Text>
              <Text style={styles.moodLabelLarge}>{moodOption.label}</Text>
            </View>

            <View style={styles.intensityBar}>
              {[1, 2, 3, 4, 5].map(level => (
                <View
                  key={level}
                  style={[
                    styles.intensityBarItem,
                    {
                      backgroundColor:
                        level <= mood.intensity
                          ? moodOption.color
                          : 'rgba(255, 255, 255, 0.2)',
                    },
                  ]}
                />
              ))}
            </View>

            {mood.note && (
              <Text style={styles.moodNote} numberOfLines={2}>
                "{mood.note}"
              </Text>
            )}

            {mood.activities && mood.activities.length > 0 && (
              <View style={styles.activitiesRow}>
                <Text style={styles.activitiesLabel}>
                  {mood.activities.length} activité{mood.activities.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noMoodContainer}>
            <Foundation name="calendar" size={40} color="rgba(255,255,255,0.4)" />
            <Text style={styles.noMoodText}>
              {isMe ? 'Enregistre ton humeur' : 'Pas encore d\'humeur'}
            </Text>
            {isMe && (
              <TouchableOpacity
                onPress={handleRecordMood}
                style={styles.recordButton}
              >
                <Text style={styles.recordButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </BlurView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <BlurView
            style={styles.backButtonBlur}
            blurType="light"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.3)"
          >
            <Foundation name="arrow-left" size={24} color="#FFFFFF" />
          </BlurView>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mood Tracker</Text>

        <TouchableOpacity
          onPress={handleSettings}
          style={styles.settingsButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <BlurView
            style={styles.settingsButtonBlur}
            blurType="light"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.3)"
          >
            <Foundation name="widget" size={22} color="#FFFFFF" />
          </BlurView>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* Today's Moods */}
        <Text style={styles.sectionTitle}>Aujourd'hui</Text>

        {renderMoodCard(myMood, 'Moi', true)}
        {renderMoodCard(partnerMood, 'Mon partenaire', false)}

        {/* Quick Stats */}
        {stats && stats.totalEntries > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cette semaine</Text>

            <BlurView
              style={styles.statsCard}
              blurType="light"
              blurAmount={10}
              reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalEntries}</Text>
                  <Text style={styles.statLabel}>Entrées</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {getMoodOption(stats.mostCommonMood)?.emoji || '😐'}
                  </Text>
                  <Text style={styles.statLabel}>Plus fréquent</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {stats.currentStreak > 0 ? `${stats.currentStreak}🔥` : '-'}
                  </Text>
                  <Text style={styles.statLabel}>Série</Text>
                </View>
              </View>

              {stats.insights && stats.insights.length > 0 && (
                <View style={styles.insightsContainer}>
                  {stats.insights.map((insight, index) => (
                    <Text key={index} style={styles.insightText}>
                      {insight}
                    </Text>
                  ))}
                </View>
              )}
            </BlurView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleRecordMood}
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B9D', '#C06C84']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <Foundation name="pencil" size={28} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {myMood ? 'Modifier' : 'Enregistrer'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewHistory}
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              <BlurView
                style={styles.actionButtonBlur}
                blurType="light"
                blurAmount={10}
                reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
              >
                <Foundation name="calendar" size={28} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Historique</Text>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewCharts}
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              <BlurView
                style={styles.actionButtonBlur}
                blurType="light"
                blurAmount={10}
                reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
              >
                <Foundation name="graph-bar" size={28} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Graphiques</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  settingsButton: {
    width: 44,
    height: 44,
  },
  settingsButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
    marginTop: 10,
    letterSpacing: 0.3,
  },
  section: {
    marginTop: 20,
  },
  moodCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    marginBottom: 15,
  },
  moodCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
  },
  moodDisplay: {
    alignItems: 'center',
    marginBottom: 15,
  },
  moodEmojiLarge: {
    fontSize: 60,
    marginBottom: 8,
  },
  moodLabelLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  intensityBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  intensityBarItem: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  moodNote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10,
    lineHeight: 20,
  },
  activitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activitiesLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  noMoodContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noMoodText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 10,
    marginBottom: 15,
  },
  recordButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  recordButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10,
  },
  insightsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 15,
  },
  insightText: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 5,
    fontWeight: '500',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default MoodTrackerHomeScreen;
