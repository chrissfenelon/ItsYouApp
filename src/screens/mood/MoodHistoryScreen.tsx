/**
 * MoodHistoryScreen
 *
 * Shows mood history for user and partner
 * - Timeline view
 * - Filter by person (me/partner/both)
 * - Filter by date range
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
  RefreshControl,
  Platform,
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
  MOOD_ACTIVITIES,
} from '../../types/moodTracker.types';

const { width } = Dimensions.get('window');

interface MoodHistoryScreenProps {
  navigation: any;
}

type FilterType = 'all' | 'me' | 'partner';
type PeriodType = 'week' | 'month' | 'all';

export const MoodHistoryScreen: React.FC<MoodHistoryScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  // State
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [period, setPeriod] = useState<PeriodType>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (userId) {
      setCurrentUserId(userId);
    }
    loadHistory();
  }, [period]);

  const loadHistory = async () => {
    try {
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
      const history = await MoodTrackerService.getCoupleMoodHistory(days);
      setMoods(history);
    } catch (error) {
      console.error('Error loading mood history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleFilterChange = (newFilter: FilterType) => {
    SoundService.haptic('light');
    setFilter(newFilter);
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    SoundService.haptic('light');
    setPeriod(newPeriod);
  };

  const getFilteredMoods = (): MoodEntry[] => {
    if (filter === 'all') return moods;
    if (filter === 'me') return moods.filter(m => m.userId === currentUserId);
    return moods.filter(m => m.userId !== currentUserId);
  };

  const getActivityLabel = (activityId: string): string => {
    return MOOD_ACTIVITIES.find(a => a.id === activityId)?.label || activityId;
  };

  const getActivityIcon = (activityId: string): string => {
    return MOOD_ACTIVITIES.find(a => a.id === activityId)?.icon || '📌';
  };

  const formatDate = (date: string): string => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    return d.toLocaleDateString('fr-FR', options);
  };

  const renderMoodEntry = (mood: MoodEntry) => {
    const moodOption = getMoodOption(mood.mood);
    if (!moodOption) return null;

    const isMe = mood.userId === currentUserId;

    return (
      <BlurView
        key={mood.id}
        style={styles.moodEntry}
        blurType="light"
        blurAmount={10}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
      >
        {/* Header */}
        <View style={styles.entryHeader}>
          <View style={styles.entryInfo}>
            <Text style={styles.entryName}>
              {isMe ? 'Moi' : mood.userName}
            </Text>
            <Text style={styles.entryDate}>{formatDate(mood.date)}</Text>
          </View>

          <View
            style={[
              styles.moodBadge,
              { backgroundColor: moodOption.color + '30' },
            ]}
          >
            <Text style={styles.moodEmoji}>{moodOption.emoji}</Text>
            <Text style={styles.moodLabel}>{moodOption.label}</Text>
          </View>
        </View>

        {/* Intensity */}
        <View style={styles.intensityRow}>
          <Text style={styles.intensityLabel}>Intensité:</Text>
          <View style={styles.intensityDots}>
            {[1, 2, 3, 4, 5].map(level => (
              <View
                key={level}
                style={[
                  styles.intensityDot,
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
        </View>

        {/* Note */}
        {mood.note && (
          <View style={styles.noteContainer}>
            <Foundation
              name="quote"
              size={16}
              color="rgba(255, 255, 255, 0.6)"
            />
            <Text style={styles.noteText}>{mood.note}</Text>
          </View>
        )}

        {/* Activities */}
        {mood.activities && mood.activities.length > 0 && (
          <View style={styles.activitiesContainer}>
            <Text style={styles.activitiesTitle}>Activités:</Text>
            <View style={styles.activitiesList}>
              {mood.activities.map((activityId, index) => (
                <View key={index} style={styles.activityTag}>
                  <Text style={styles.activityTagText}>
                    {getActivityIcon(activityId)} {getActivityLabel(activityId)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </BlurView>
    );
  };

  const filteredMoods = getFilteredMoods();

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

        <Text style={styles.headerTitle}>Historique</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Person Filter */}
        <BlurView
          style={styles.filterGroup}
          blurType="light"
          blurAmount={10}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
        >
          {(['all', 'me', 'partner'] as FilterType[]).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => handleFilterChange(f)}
              style={[
                styles.filterButton,
                filter === f && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === f && styles.filterButtonTextActive,
                ]}
              >
                {f === 'all' ? 'Tous' : f === 'me' ? 'Moi' : 'Partenaire'}
              </Text>
            </TouchableOpacity>
          ))}
        </BlurView>

        {/* Period Filter */}
        <BlurView
          style={styles.filterGroup}
          blurType="light"
          blurAmount={10}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
        >
          {(['week', 'month', 'all'] as PeriodType[]).map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => handlePeriodChange(p)}
              style={[
                styles.filterButton,
                period === p && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  period === p && styles.filterButtonTextActive,
                ]}
              >
                {p === 'week' ? '7j' : p === 'month' ? '30j' : 'Tout'}
              </Text>
            </TouchableOpacity>
          ))}
        </BlurView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : (
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
          {filteredMoods.length > 0 ? (
            filteredMoods.map(renderMoodEntry)
          ) : (
            <BlurView
              style={styles.emptyContainer}
              blurType="light"
              blurAmount={10}
              reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
            >
              <Foundation
                name="calendar"
                size={48}
                color="rgba(255, 255, 255, 0.4)"
              />
              <Text style={styles.emptyText}>Aucune humeur enregistrée</Text>
            </BlurView>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  filterGroup: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodEntry: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    marginBottom: 15,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  intensityLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 10,
    fontWeight: '600',
  },
  intensityDots: {
    flexDirection: 'row',
    gap: 6,
  },
  intensityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  activitiesContainer: {
    marginTop: 5,
  },
  activitiesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  activitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activityTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 15,
  },
});

export default MoodHistoryScreen;
