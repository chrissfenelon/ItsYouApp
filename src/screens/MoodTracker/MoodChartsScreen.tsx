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
import { MoodStats, getMoodEmoji, getMoodColor } from '../../types/moodTracker.types';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

type Period = 'week' | 'month' | 'year';

const MoodChartsScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [myStats, setMyStats] = useState<MoodStats | null>(null);
  const [partnerStats, setPartnerStats] = useState<MoodStats | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const myStatsData = await MoodTrackerService.getMoodStats(user.id, period);
      setMyStats(myStatsData);

      // Load partner stats if available
      if (user.partnerId) {
        const partnerStatsData = await MoodTrackerService.getMoodStats(
          user.partnerId,
          period
        );
        setPartnerStats(partnerStatsData);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de charger les statistiques',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return '7 derniers jours';
      case 'month':
        return '30 derniers jours';
      case 'year':
        return 'Cette année';
    }
  };

  const StatsCard = ({ title, stats }: { title: string; stats: MoodStats | null }) => {
    if (!stats || stats.totalEntries === 0) {
      return (
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>{title}</Text>
          <View style={styles.emptyStats}>
            <Text style={styles.emptyStatsText}>Aucune donnée disponible</Text>
          </View>
        </View>
      );
    }

    const sortedMoods = Object.entries(stats.moodDistribution)
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
      .slice(0, 5);

    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>{title}</Text>

        {/* Total Entries */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total d'entrées</Text>
          <Text style={styles.statValue}>{stats.totalEntries}</Text>
        </View>

        {/* Average Intensity */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Intensité moyenne</Text>
          <View style={styles.intensityContainer}>
            {[1, 2, 3, 4, 5].map((level) => (
              <View
                key={level}
                style={[
                  styles.intensityDot,
                  level <= Math.round(stats.averageIntensity) && {
                    backgroundColor: currentTheme.romantic.primary,
                  },
                ]}
              />
            ))}
            <Text style={styles.intensityText}>
              {stats.averageIntensity.toFixed(1)}/5
            </Text>
          </View>
        </View>

        {/* Streaks */}
        {stats.currentStreak > 0 && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakIcon}>🔥</Text>
            <View style={styles.streakTextContainer}>
              <Text style={styles.streakValue}>{stats.currentStreak} jours</Text>
              <Text style={styles.streakLabel}>Série positive en cours !</Text>
            </View>
          </View>
        )}

        {stats.longestStreak > 0 && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Meilleure série</Text>
            <Text style={styles.statValue}>{stats.longestStreak} jours</Text>
          </View>
        )}

        {/* Mood Distribution */}
        <Text style={styles.sectionTitle}>Humeurs fréquentes</Text>
        <View style={styles.moodDistribution}>
          {sortedMoods.map(([mood, percentage]) => (
            <View key={mood} style={styles.moodDistributionRow}>
              <View style={styles.moodDistributionLeft}>
                <Text style={styles.moodDistributionEmoji}>
                  {getMoodEmoji(mood as any)}
                </Text>
                <Text style={styles.moodDistributionLabel}>{mood}</Text>
              </View>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${percentage}%`,
                      backgroundColor: getMoodColor(mood as any),
                    },
                  ]}
                />
              </View>

              <Text style={styles.moodDistributionPercentage}>{percentage}%</Text>
            </View>
          ))}
        </View>

        {/* Insights */}
        {stats.insights.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Insights</Text>
            <View style={styles.insightsContainer}>
              {stats.insights.map((insight, idx) => (
                <View key={idx} style={styles.insightRow}>
                  <Foundation name="lightbulb" size={16} color={currentTheme.romantic.primary} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

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

            <Text style={styles.title}>Statistiques</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
              onPress={() => setPeriod('week')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  period === 'week' && styles.periodButtonTextActive,
                ]}
              >
                7 jours
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
              onPress={() => setPeriod('month')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  period === 'month' && styles.periodButtonTextActive,
                ]}
              >
                30 jours
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.periodButton, period === 'year' && styles.periodButtonActive]}
              onPress={() => setPeriod('year')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  period === 'year' && styles.periodButtonTextActive,
                ]}
              >
                1 an
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.romantic.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.periodLabel}>{getPeriodLabel()}</Text>

              <StatsCard title="Vos statistiques" stats={myStats} />

              {partnerStats && (
                <StatsCard
                  title={`Statistiques de ${user?.partnerName || 'votre partenaire'}`}
                  stats={partnerStats}
                />
              )}
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
  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.romantic.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  // Loading
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
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Stats Card
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  statsCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyStats: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStatsText: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  // Stat Row
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text.primary,
  },
  // Intensity
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  intensityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  intensityText: {
    fontSize: 12,
    color: theme.text.secondary,
    marginLeft: 4,
  },
  // Streak
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  streakIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  streakTextContainer: {
    flex: 1,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginTop: 20,
    marginBottom: 12,
  },
  // Mood Distribution
  moodDistribution: {
    gap: 12,
  },
  moodDistributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moodDistributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    gap: 8,
  },
  moodDistributionEmoji: {
    fontSize: 20,
  },
  moodDistributionLabel: {
    fontSize: 14,
    color: theme.text.primary,
    textTransform: 'capitalize',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  moodDistributionPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text.primary,
    width: 45,
    textAlign: 'right',
  },
  // Insights
  insightsContainer: {
    gap: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: theme.text.secondary,
    lineHeight: 20,
  },
});

export default MoodChartsScreen;
