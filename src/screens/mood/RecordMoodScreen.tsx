/**
 * RecordMoodScreen
 *
 * Screen to record daily mood with:
 * - Mood selection (10 options)
 * - Intensity slider (1-5)
 * - Optional note
 * - Optional activities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Foundation from 'react-native-vector-icons/Foundation';
import MoodTrackerService from '../../services/MoodTrackerService';
import SoundService from '../../services/SoundService';
import ToastService from '../../services/ToastService';
import {
  MoodType,
  MOOD_OPTIONS,
  MOOD_ACTIVITIES,
  MoodEntry,
} from '../../types/moodTracker.types';

const { width, height } = Dimensions.get('window');

interface RecordMoodScreenProps {
  navigation: any;
}

export const RecordMoodScreen: React.FC<RecordMoodScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  // State
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingMood, setExistingMood] = useState<MoodEntry | null>(null);

  // Animations
  const [scaleAnims] = useState(
    MOOD_OPTIONS.map(() => new Animated.Value(1))
  );
  const [saveButtonAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadTodayMood();
  }, []);

  useEffect(() => {
    // Animate save button when mood is selected
    if (selectedMood) {
      Animated.spring(saveButtonAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [selectedMood]);

  const loadTodayMood = async () => {
    try {
      const mood = await MoodTrackerService.getTodayMood(
        require('@react-native-firebase/auth').default().currentUser?.uid || ''
      );

      if (mood) {
        setExistingMood(mood);
        setSelectedMood(mood.mood);
        setIntensity(mood.intensity);
        setNote(mood.note || '');
        setSelectedActivities(mood.activities || []);
        console.log('📝 Loaded existing mood for today:', mood);
      }
    } catch (error) {
      console.error('Error loading today mood:', error);
    }
  };

  const handleMoodSelect = (mood: MoodType, index: number) => {
    SoundService.haptic('light');
    setSelectedMood(mood);

    // Animate selected mood
    Animated.sequence([
      Animated.spring(scaleAnims[index], {
        toValue: 1.15,
        useNativeDriver: true,
        tension: 100,
        friction: 3,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  };

  const handleActivityToggle = (activityId: string) => {
    SoundService.haptic('light');
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleSave = async () => {
    if (!selectedMood) {
      ToastService.error('Sélectionnez une humeur');
      SoundService.playSoundWithHaptic('wrong', 0.5, 'error');
      return;
    }

    try {
      setLoading(true);
      SoundService.haptic('medium');

      await MoodTrackerService.recordMood(
        selectedMood,
        intensity,
        note.trim() || undefined,
        selectedActivities.length > 0 ? selectedActivities : undefined
      );

      SoundService.playSoundWithHaptic('game_start', 0.8, 'success');
      ToastService.success(
        existingMood ? 'Humeur mise à jour!' : 'Humeur enregistrée!',
        2000
      );

      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error: any) {
      console.error('Error saving mood:', error);
      SoundService.playSoundWithHaptic('wrong', 0.6, 'error');
      ToastService.error(
        error.message === 'NOT_AUTHENTICATED'
          ? 'Vous devez être connecté'
          : 'Erreur lors de l\'enregistrement'
      );
    } finally {
      setLoading(false);
    }
  };

  const getMoodOption = (type: MoodType) => {
    return MOOD_OPTIONS.find(option => option.type === type);
  };

  const getIntensityLabel = (): string => {
    const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    return labels[intensity - 1];
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

        <Text style={styles.headerTitle}>
          {existingMood ? 'Modifier mon humeur' : 'Comment vas-tu?'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisis ton humeur</Text>

          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((option, index) => {
              const isSelected = selectedMood === option.type;

              return (
                <Animated.View
                  key={option.type}
                  style={{
                    transform: [{ scale: scaleAnims[index] }],
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleMoodSelect(option.type, index)}
                    activeOpacity={0.8}
                  >
                    <BlurView
                      style={[
                        styles.moodCard,
                        isSelected && styles.moodCardSelected,
                      ]}
                      blurType="light"
                      blurAmount={10}
                      reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
                    >
                      <Text style={styles.moodEmoji}>{option.emoji}</Text>
                      <Text style={styles.moodLabel}>{option.label}</Text>
                    </BlurView>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Intensity Slider */}
        {selectedMood && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Intensité</Text>
                <Text style={styles.intensityLabel}>{getIntensityLabel()}</Text>
              </View>

              <BlurView
                style={styles.sliderContainer}
                blurType="light"
                blurAmount={10}
                reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
              >
                <View style={styles.intensityButtons}>
                  {[1, 2, 3, 4, 5].map(level => (
                    <TouchableOpacity
                      key={level}
                      onPress={() => {
                        setIntensity(level as 1 | 2 | 3 | 4 | 5);
                        SoundService.haptic('light');
                      }}
                      style={[
                        styles.intensityButton,
                        intensity === level && styles.intensityButtonActive,
                        {
                          backgroundColor:
                            intensity === level
                              ? getMoodOption(selectedMood)?.color || '#667eea'
                              : 'rgba(255, 255, 255, 0.2)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.intensityButtonText,
                          intensity === level && styles.intensityButtonTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </BlurView>
            </View>

            {/* Activities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Tes activités du jour (optionnel)
              </Text>

              <View style={styles.activitiesGrid}>
                {MOOD_ACTIVITIES.map(activity => {
                  const isSelected = selectedActivities.includes(activity.id);

                  return (
                    <TouchableOpacity
                      key={activity.id}
                      onPress={() => handleActivityToggle(activity.id)}
                      activeOpacity={0.8}
                    >
                      <BlurView
                        style={[
                          styles.activityCard,
                          isSelected && styles.activityCardSelected,
                        ]}
                        blurType="light"
                        blurAmount={10}
                        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
                      >
                        <Text style={styles.activityIcon}>{activity.icon}</Text>
                        <Text style={styles.activityLabel}>{activity.label}</Text>
                      </BlurView>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Note personnelle (optionnel)
              </Text>

              <BlurView
                style={styles.noteContainer}
                blurType="light"
                blurAmount={10}
                reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.15)"
              >
                <TextInput
                  style={styles.noteInput}
                  placeholder="Comment s'est passée ta journée?"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  maxLength={200}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{note.length}/200</Text>
              </BlurView>
            </View>

            {/* Save Button */}
            <Animated.View
              style={[
                styles.saveButtonContainer,
                {
                  opacity: saveButtonAnim,
                  transform: [
                    {
                      translateY: saveButtonAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    getMoodOption(selectedMood)?.color || '#667eea',
                    getMoodOption(selectedMood)?.color || '#764ba2',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Foundation name="check" size={24} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>
                        {existingMood ? 'Mettre à jour' : 'Enregistrer'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
    letterSpacing: 0.3,
  },
  intensityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodCard: {
    width: (width - 40 - 48) / 5, // 5 per row with gaps
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  moodCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sliderContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
  },
  intensityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  intensityButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  intensityButtonActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  intensityButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  intensityButtonTextActive: {
    color: '#FFFFFF',
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCard: {
    width: (width - 40 - 36) / 4, // 4 per row
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  activityCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activityIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  noteContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
  },
  noteInput: {
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 100,
    fontWeight: '500',
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
    marginTop: 8,
  },
  saveButtonContainer: {
    marginTop: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 10,
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
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default RecordMoodScreen;
