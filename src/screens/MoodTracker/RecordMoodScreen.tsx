import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  ScrollView,
  TextInput,
  Animated,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import MoodTrackerService from '../../services/MoodTrackerService';
import {
  MoodType,
  MOOD_OPTIONS,
  MOOD_ACTIVITIES,
} from '../../types/moodTracker.types';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

const RecordMoodScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);

    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleActivityToggle = (activityId: string) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleSave = async () => {
    if (!selectedMood) {
      showAlert({
        title: 'Humeur requise',
        message: 'Veuillez sélectionner votre humeur',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      await MoodTrackerService.recordMood(
        selectedMood,
        intensity,
        note.trim() || undefined,
        selectedActivities.length > 0 ? selectedActivities : undefined
      );

      showAlert({
        title: 'Enregistré !',
        message: 'Votre humeur a été enregistrée avec succès',
        type: 'success',
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              hideAlert();
              navigateToScreen('moodTrackerHome');
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error saving mood:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible d\'enregistrer votre humeur',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedMoodOption = selectedMood
    ? MOOD_OPTIONS.find(m => m.type === selectedMood)
    : null;

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
              disabled={loading}
            >
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Comment te sens-tu ?</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Main Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Mood Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choisis ton humeur</Text>

              <View style={styles.moodsGrid}>
                {MOOD_OPTIONS.map((mood) => (
                  <TouchableOpacity
                    key={mood.type}
                    style={[
                      styles.moodOption,
                      selectedMood === mood.type && {
                        backgroundColor: `${mood.color}33`,
                      },
                    ]}
                    onPress={() => handleMoodSelect(mood.type)}
                    disabled={loading}
                  >
                    {selectedMood === mood.type ? (
                      <Animated.Text
                        style={[
                          styles.moodEmoji,
                          { transform: [{ scale: scaleAnim }] },
                        ]}
                      >
                        {mood.emoji}
                      </Animated.Text>
                    ) : (
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    )}
                    <Text style={styles.moodLabel}>{mood.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedMoodOption && (
                <View style={styles.selectedMoodInfo}>
                  <Text style={styles.selectedMoodEmoji}>{selectedMoodOption.emoji}</Text>
                  <View style={styles.selectedMoodTextContainer}>
                    <Text style={[styles.selectedMoodLabel, { color: selectedMoodOption.color }]}>
                      {selectedMoodOption.label}
                    </Text>
                    <Text style={styles.selectedMoodDescription}>
                      {selectedMoodOption.description}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Intensity */}
            {selectedMood && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Intensité ({intensity}/5)</Text>

                <View style={styles.intensityContainer}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.intensityButton,
                        level <= intensity && selectedMoodOption && {
                          backgroundColor: selectedMoodOption.color,
                        },
                      ]}
                      onPress={() => setIntensity(level as 1 | 2 | 3 | 4 | 5)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.intensityButtonText,
                          level <= intensity && styles.intensityButtonTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Note */}
            {selectedMood && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ajouter une note (optionnel)</Text>

                <TextInput
                  style={styles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ex: Belle journée avec mon partenaire..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  maxLength={200}
                  editable={!loading}
                  textAlignVertical="top"
                />

                <Text style={styles.characterCount}>{note.length}/200</Text>
              </View>
            )}

            {/* Activities */}
            {selectedMood && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activités du jour</Text>

                <View style={styles.activitiesGrid}>
                  {MOOD_ACTIVITIES.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      style={[
                        styles.activityButton,
                        selectedActivities.includes(activity.id) && styles.activityButtonActive,
                      ]}
                      onPress={() => handleActivityToggle(activity.id)}
                      disabled={loading}
                    >
                      <Text style={styles.activityIcon}>{activity.icon}</Text>
                      <Text
                        style={[
                          styles.activityLabel,
                          selectedActivities.includes(activity.id) && styles.activityLabelActive,
                        ]}
                      >
                        {activity.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Save Button */}
            {selectedMood && (
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  selectedMoodOption && { backgroundColor: selectedMoodOption.color },
                  loading && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Enregistrement...' : 'Enregistrer mon humeur'}
                </Text>
              </TouchableOpacity>
            )}
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 16,
  },
  // Moods Grid
  moodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  moodOption: {
    width: (width - 64) / 3,
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    color: theme.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Selected Mood Info
  selectedMoodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  selectedMoodEmoji: {
    fontSize: 50,
    marginRight: 16,
  },
  selectedMoodTextContainer: {
    flex: 1,
  },
  selectedMoodLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedMoodDescription: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  // Intensity
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text.secondary,
  },
  intensityButtonTextActive: {
    color: '#FFFFFF',
  },
  // Note Input
  noteInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: theme.text.primary,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: theme.text.secondary,
    textAlign: 'right',
    marginTop: 8,
  },
  // Activities
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  activityButtonActive: {
    backgroundColor: theme.romantic.primary,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
  },
  activityLabelActive: {
    color: '#FFFFFF',
  },
  // Save Button
  saveButton: {
    backgroundColor: theme.romantic.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    ...theme.shadows.button,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default RecordMoodScreen;
