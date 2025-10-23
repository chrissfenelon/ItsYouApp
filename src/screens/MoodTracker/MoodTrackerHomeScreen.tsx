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
import { MoodEntry, getMoodEmoji, getMoodColor, getMoodOption } from '../../types/moodTracker.types';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

const MoodTrackerHomeScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [myMood, setMyMood] = useState<MoodEntry | null>(null);
  const [partnerMood, setPartnerMood] = useState<MoodEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMoods();

    // Subscribe to partner mood changes
    const unsubscribe = MoodTrackerService.subscribeToPartnerMood((mood) => {
      setPartnerMood(mood);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadMoods = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const [myMoodData, partnerMoodData] = await Promise.all([
        MoodTrackerService.getTodayMood(user.id),
        MoodTrackerService.getPartnerTodayMood(),
      ]);

      setMyMood(myMoodData);
      setPartnerMood(partnerMoodData);
    } catch (error) {
      console.error('Error loading moods:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de charger les humeurs',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordMood = () => {
    navigateToScreen('recordMood');
  };

  const handleViewHistory = () => {
    navigateToScreen('moodHistory');
  };

  const handleViewCharts = () => {
    navigateToScreen('moodCharts');
  };

  const handleSettings = () => {
    navigateToScreen('moodSettings');
  };

  const handleSendMessage = () => {
    // TODO: Navigate to messages or open quick message modal
    showAlert({
      title: 'Message',
      message: 'Fonctionnalité bientôt disponible',
      type: 'info',
    });
  };

  const getTodayDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return today.toLocaleDateString('fr-FR', options);
  };

  const MoodCard = ({
    title,
    mood,
    isCurrentUser
  }: {
    title: string;
    mood: MoodEntry | null;
    isCurrentUser: boolean;
  }) => {
    const moodOption = mood ? getMoodOption(mood.mood) : null;

    return (
      <View style={[styles.moodCard, !mood && styles.emptyMoodCard]}>
        <Text style={styles.moodCardTitle}>{title}</Text>

        {mood && moodOption ? (
          <>
            <Text style={styles.moodEmoji}>{moodOption.emoji}</Text>
            <Text style={[styles.moodLabel, { color: moodOption.color }]}>
              {moodOption.label}
            </Text>

            {/* Intensity */}
            <View style={styles.intensityContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.intensityDot,
                    level <= mood.intensity && { backgroundColor: moodOption.color },
                  ]}
                />
              ))}
            </View>

            {/* Note */}
            {mood.note && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteIcon}>💭</Text>
                <Text style={styles.noteText} numberOfLines={2}>
                  {mood.note}
                </Text>
              </View>
            )}

            {/* Activities */}
            {mood.activities && mood.activities.length > 0 && (
              <View style={styles.activitiesContainer}>
                {mood.activities.slice(0, 3).map((activity, idx) => (
                  <View key={idx} style={styles.activityChip}>
                    <Text style={styles.activityText}>{activity}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Foundation name="plus" size={40} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.emptyMoodText}>
              {isCurrentUser ? 'Pas encore enregistré' : 'Non enregistré'}
            </Text>
          </>
        )}

        {/* Action Button */}
        {isCurrentUser ? (
          <TouchableOpacity
            style={[styles.moodActionButton, styles.recordButton]}
            onPress={handleRecordMood}
          >
            <Text style={styles.moodActionButtonText}>
              {mood ? 'Modifier' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        ) : mood ? (
          <TouchableOpacity
            style={[styles.moodActionButton, styles.messageButton]}
            onPress={handleSendMessage}
          >
            <Foundation name="mail" size={16} color="#FFFFFF" />
            <Text style={styles.moodActionButtonText}>Envoyer message</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={getBackgroundSource(user)}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.blurryOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.romantic.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

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
              onPress={() => navigateToScreen('games')}
            >
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Mood Tracker</Text>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleSettings}
            >
              <Foundation name="widget" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Date Section */}
            <View style={styles.dateSection}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>{getTodayDate()}</Text>
            </View>

            {/* Moods Container */}
            <View style={styles.moodsContainer}>
              <MoodCard
                title="Vous"
                mood={myMood}
                isCurrentUser={true}
              />

              <MoodCard
                title={user?.partnerName || 'Partenaire'}
                mood={partnerMood}
                isCurrentUser={false}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleViewHistory}
              >
                <Foundation name="calendar" size={24} color={currentTheme.romantic.primary} />
                <Text style={styles.actionButtonText}>Historique</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleViewCharts}
              >
                <Foundation name="graph-bar" size={24} color={currentTheme.romantic.primary} />
                <Text style={styles.actionButtonText}>Statistiques</Text>
              </TouchableOpacity>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoTitle}>Suivez votre humeur quotidienne</Text>
              <Text style={styles.infoText}>
                Enregistrez comment vous vous sentez chaque jour et voyez l'humeur de votre partenaire en temps réel.
              </Text>
            </View>
          </ScrollView>
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.interactive.active,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
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
  // Date Section
  dateSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dateIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: theme.text.secondary,
    textAlign: 'center',
  },
  // Moods Container
  moodsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  moodCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  emptyMoodCard: {
    paddingVertical: 40,
  },
  moodCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 16,
  },
  moodEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  moodLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyMoodText: {
    fontSize: 14,
    color: theme.text.secondary,
    marginTop: 12,
  },
  // Intensity
  intensityContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    width: '100%',
  },
  noteIcon: {
    fontSize: 16,
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
    marginBottom: 12,
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
  // Action Buttons on Cards
  moodActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
    gap: 8,
    minWidth: 140,
  },
  recordButton: {
    backgroundColor: theme.romantic.primary,
  },
  messageButton: {
    backgroundColor: theme.romantic.secondary,
  },
  moodActionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Actions Section
  actionsSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
    marginTop: 8,
  },
  // Info Card
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MoodTrackerHomeScreen;
