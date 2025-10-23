import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import MoodTrackerService from '../../services/MoodTrackerService';
import {
  MoodEntry,
  getMoodEmoji,
  getMoodColor,
  getMoodOption,
} from '../../types/moodTracker.types';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

type FilterType = 'me' | 'partner' | 'both';

const MoodHistoryScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('both');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadHistory();
  }, [filter, selectedMonth]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const days = 30; // Load last 30 days
      const history = await MoodTrackerService.getCoupleMoodHistory(days);

      // Filter based on selected filter
      let filteredHistory = history;
      if (filter === 'me') {
        filteredHistory = history.filter(m => m.userId === user.id);
      } else if (filter === 'partner') {
        filteredHistory = history.filter(m => m.userId !== user.id);
      }

      setMoods(filteredHistory);
    } catch (error) {
      console.error('Error loading history:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de charger l\'historique',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const groupMoodsByDate = () => {
    const grouped: { [key: string]: MoodEntry[] } = {};

    moods.forEach(mood => {
      if (!grouped[mood.date]) {
        grouped[mood.date] = [];
      }
      grouped[mood.date].push(mood);
    });

    return grouped;
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0].split('-').join('-')) {
      return "Aujourd'hui";
    } else if (dateStr === yesterday.toISOString().split('T')[0].split('-').join('-')) {
      return "Hier";
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  const MoodCard = ({ mood }: { mood: MoodEntry }) => {
    const moodOption = getMoodOption(mood.mood);
    const isCurrentUser = mood.userId === user?.id;

    return (
      <View style={styles.moodCard}>
        <View style={styles.moodCardHeader}>
          <View style={styles.moodCardUser}>
            <Text style={styles.moodCardUserName}>
              {isCurrentUser ? 'Vous' : mood.userName}
            </Text>
            <Text style={styles.moodCardTime}>
              {new Date(mood.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.moodCardMood}>
            <Text style={styles.moodCardEmoji}>{moodOption?.emoji}</Text>
            <Text style={[styles.moodCardLabel, { color: moodOption?.color }]}>
              {moodOption?.label}
            </Text>
          </View>
        </View>

        {/* Intensity */}
        <View style={styles.intensityContainer}>
          <Text style={styles.intensityLabel}>Intensité:</Text>
          {[1, 2, 3, 4, 5].map((level) => (
            <View
              key={level}
              style={[
                styles.intensityDot,
                level <= mood.intensity && moodOption && {
                  backgroundColor: moodOption.color,
                },
              ]}
            />
          ))}
        </View>

        {/* Note */}
        {mood.note && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteIcon}>💭</Text>
            <Text style={styles.noteText}>{mood.note}</Text>
          </View>
        )}

        {/* Activities */}
        {mood.activities && mood.activities.length > 0 && (
          <View style={styles.activitiesContainer}>
            {mood.activities.map((activity, idx) => (
              <View key={idx} style={styles.activityChip}>
                <Text style={styles.activityText}>{activity}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const groupedMoods = groupMoodsByDate();
  const dates = Object.keys(groupedMoods).sort((a, b) => b.localeCompare(a));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.blurryOverlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigateToScreen('moodTrackerHome')}
            >
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Historique</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'me' && styles.filterButtonActive]}
              onPress={() => setFilter('me')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === 'me' && styles.filterButtonTextActive,
                ]}
              >
                Moi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, filter === 'partner' && styles.filterButtonActive]}
              onPress={() => setFilter('partner')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === 'partner' && styles.filterButtonTextActive,
                ]}
              >
                {user?.partnerName || 'Partenaire'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, filter === 'both' && styles.filterButtonActive]}
              onPress={() => setFilter('both')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === 'both' && styles.filterButtonTextActive,
                ]}
              >
                Les Deux
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.romantic.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : moods.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>Aucune humeur enregistrée</Text>
              <Text style={styles.emptyText}>
                Commencez à enregistrer vos humeurs quotidiennes !
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {dates.map((date) => (
                <View key={date} style={styles.dateSection}>
                  <View style={styles.dateSectionHeader}>
                    <Foundation name="calendar" size={20} color={currentTheme.romantic.primary} />
                    <Text style={styles.dateSectionTitle}>{formatDate(date)}</Text>
                  </View>

                  <View style={styles.dateSectionContent}>
                    {groupedMoods[date].map((mood) => (
                      <MoodCard key={mood.id} mood={mood} />
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ImageBackground>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
          onClose={hideAlert}
          theme={currentTheme}
        />
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  blurryOverlay: {
    flex: 1,
    backgroundColor: theme.background.overlay,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.interactive.active,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  // Filters
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.romantic.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.text.secondary,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // Date Section
  dateSection: {
    marginBottom: 24,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dateSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text.primary,
    textTransform: 'capitalize',
  },
  dateSectionContent: {
    gap: 12,
  },
  // Mood Card
  moodCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  moodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodCardUser: {
    flex: 1,
  },
  moodCardUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 4,
  },
  moodCardTime: {
    fontSize: 12,
    color: theme.text.secondary,
  },
  moodCardMood: {
    alignItems: 'center',
  },
  moodCardEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  moodCardLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Intensity
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  intensityLabel: {
    fontSize: 12,
    color: theme.text.secondary,
  },
  intensityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Note
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noteIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: theme.text.secondary,
    lineHeight: 20,
  },
  // Activities
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activityText: {
    fontSize: 12,
    color: theme.text.primary,
  },
});

export default MoodHistoryScreen;
