import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  TextInput,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import Voice from '@react-native-voice/voice';
import DatePicker from 'react-native-date-picker';
import CustomAlert from '../common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface AdvancedNoteFeaturesProps {
  visible: boolean;
  onClose: () => void;
  onVoiceToText: (text: string) => void;
  onAddImage: (imageUri: string) => void;
  onSetReminder: (date: Date, message: string) => void;
  onAddLocation: (location: { name: string; coordinates: { latitude: number; longitude: number } }) => void;
  theme: any;
  attachments: string[];
  currentReminder?: Date;
  currentLocation?: { name: string; coordinates: { latitude: number; longitude: number } };
}

const AdvancedNoteFeatures: React.FC<AdvancedNoteFeaturesProps> = ({
  visible,
  onClose,
  onVoiceToText,
  onAddImage,
  onSetReminder,
  onAddLocation,
  theme,
  attachments = [],
  currentReminder,
  currentLocation,
}) => {
  const [activeFeature, setActiveFeature] = useState<'voice' | 'images' | 'reminder' | 'location' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState('');
  const [reminderDate, setReminderDate] = useState(currentReminder || new Date());
  const [reminderMessage, setReminderMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locationName, setLocationName] = useState(currentLocation?.name || '');
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const features = [
    {
      id: 'voice',
      title: 'Dictée vocale',
      description: 'Convertir votre voix en texte',
      icon: 'microphone',
      color: '#FF6347',
    },
    {
      id: 'images',
      title: 'Images',
      description: 'Ajouter des photos à votre note',
      icon: 'photo',
      color: '#32CD32',
    },
    {
      id: 'reminder',
      title: 'Rappel',
      description: 'Programmer un rappel pour cette note',
      icon: 'clock',
      color: '#FF69B4',
    },
    {
      id: 'location',
      title: 'Localisation',
      description: 'Associer un lieu à votre note',
      icon: 'marker',
      color: '#4169E1',
    },
  ];

  // Voice-to-text functionality
  const startVoiceRecording = async () => {
    try {
      await Voice.start('fr-FR');
      setIsRecording(true);
      setVoiceResult('');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de démarrer la reconnaissance vocale',
        type: 'error',
      });
    }
  };

  const stopVoiceRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const onSpeechResults = (e: any) => {
    if (e.value && e.value.length > 0) {
      setVoiceResult(e.value[0]);
    }
  };

  const onSpeechError = (e: any) => {
    console.error('Speech error:', e);
    setIsRecording(false);
    showAlert({
      title: 'Erreur',
      message: 'Erreur lors de la reconnaissance vocale',
      type: 'error',
    });
  };

  React.useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const handleUseVoiceText = () => {
    if (voiceResult) {
      onVoiceToText(voiceResult);
      setVoiceResult('');
      setActiveFeature(null);
    }
  };

  // Image functionality
  const selectImage = () => {
    showAlert({
      title: 'Ajouter une image',
      message: 'Choisissez une source',
      type: 'info',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Galerie', onPress: openImageLibrary },
        { text: 'Appareil photo', onPress: openCamera },
      ]
    });
  };

  const openImageLibrary = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
      },
      handleImageResponse
    );
  };

  const openCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
      },
      handleImageResponse
    );
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.assets && response.assets[0]) {
      const imageUri = response.assets[0].uri;
      if (imageUri) {
        onAddImage(imageUri);
        setActiveFeature(null);
      }
    }
  };

  // Reminder functionality
  const handleSetReminder = () => {
    if (reminderMessage.trim()) {
      onSetReminder(reminderDate, reminderMessage.trim());
      setActiveFeature(null);
      setReminderMessage('');
    } else {
      showAlert({
        title: 'Message requis',
        message: 'Veuillez saisir un message pour le rappel',
        type: 'warning',
      });
    }
  };

  // Location functionality
  const handleSetLocation = () => {
    if (locationName.trim()) {
      // In a real app, you would use geolocation to get coordinates
      // For now, we'll use dummy coordinates
      onAddLocation({
        name: locationName.trim(),
        coordinates: { latitude: 48.8566, longitude: 2.3522 }, // Paris coordinates as example
      });
      setActiveFeature(null);
      setLocationName('');
    } else {
      showAlert({
        title: 'Nom du lieu requis',
        message: 'Veuillez saisir un nom pour le lieu',
        type: 'warning',
      });
    }
  };

  const renderFeatureDetail = () => {
    switch (activeFeature) {
      case 'voice':
        return (
          <View style={styles.featureDetail}>
            <Text style={[styles.featureTitle, { color: theme.text.primary }]}>
              Dictée vocale
            </Text>

            <View style={styles.voiceContainer}>
              {!isRecording ? (
                <TouchableOpacity
                  style={[styles.recordButton, { backgroundColor: '#FF6347' }]}
                  onPress={startVoiceRecording}
                >
                  <Foundation name="microphone" size={32} color="#FFFFFF" />
                  <Text style={styles.recordButtonText}>Appuyez pour parler</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.recordButton, { backgroundColor: '#DC143C' }]}
                  onPress={stopVoiceRecording}
                >
                  <Foundation name="stop" size={32} color="#FFFFFF" />
                  <Text style={styles.recordButtonText}>Arrêter l'enregistrement</Text>
                </TouchableOpacity>
              )}

              {voiceResult && (
                <View style={[styles.voiceResult, { backgroundColor: theme.background.secondary }]}>
                  <Text style={[styles.voiceResultText, { color: theme.text.primary }]}>
                    "{voiceResult}"
                  </Text>
                  <TouchableOpacity
                    style={[styles.useVoiceButton, { backgroundColor: theme.romantic.primary }]}
                    onPress={handleUseVoiceText}
                  >
                    <Text style={styles.useVoiceButtonText}>Utiliser ce texte</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        );

      case 'images':
        return (
          <View style={styles.featureDetail}>
            <Text style={[styles.featureTitle, { color: theme.text.primary }]}>
              Images ({attachments.length})
            </Text>

            <TouchableOpacity
              style={[styles.addImageButton, { backgroundColor: theme.romantic.primary }]}
              onPress={selectImage}
            >
              <Foundation name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.addImageButtonText}>Ajouter une image</Text>
            </TouchableOpacity>

            {attachments.length > 0 && (
              <ScrollView horizontal style={styles.imagesList} showsHorizontalScrollIndicator={false}>
                {attachments.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.attachedImage} />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        );

      case 'reminder':
        return (
          <View style={styles.featureDetail}>
            <Text style={[styles.featureTitle, { color: theme.text.primary }]}>
              Programmer un rappel
            </Text>

            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.background.secondary }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Foundation name="calendar" size={20} color={theme.text.primary} />
              <Text style={[styles.dateButtonText, { color: theme.text.primary }]}>
                {reminderDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.reminderInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
              placeholder="Message du rappel..."
              placeholderTextColor={theme.text.tertiary}
              value={reminderMessage}
              onChangeText={setReminderMessage}
              multiline
            />

            <TouchableOpacity
              style={[styles.setReminderButton, { backgroundColor: theme.romantic.primary }]}
              onPress={handleSetReminder}
            >
              <Text style={styles.setReminderButtonText}>Programmer le rappel</Text>
            </TouchableOpacity>

            <DatePicker
              modal
              open={showDatePicker}
              date={reminderDate}
              onConfirm={(date) => {
                setShowDatePicker(false);
                setReminderDate(date);
              }}
              onCancel={() => setShowDatePicker(false)}
              locale="fr"
              title="Choisir la date et l'heure"
            />
          </View>
        );

      case 'location':
        return (
          <View style={styles.featureDetail}>
            <Text style={[styles.featureTitle, { color: theme.text.primary }]}>
              Associer un lieu
            </Text>

            <TextInput
              style={[styles.locationInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
              placeholder="Nom du lieu (ex: Restaurant La Belle Époque)"
              placeholderTextColor={theme.text.tertiary}
              value={locationName}
              onChangeText={setLocationName}
            />

            {currentLocation && (
              <View style={[styles.currentLocation, { backgroundColor: theme.background.secondary }]}>
                <Foundation name="marker" size={16} color={theme.text.primary} />
                <Text style={[styles.currentLocationText, { color: theme.text.primary }]}>
                  Lieu actuel : {currentLocation.name}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.setLocationButton, { backgroundColor: theme.romantic.primary }]}
              onPress={handleSetLocation}
            >
              <Text style={styles.setLocationButtonText}>Associer ce lieu</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        visible={visible && !isVisible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modal, { backgroundColor: theme.background.card }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text.primary }]}>
                Fonctionnalités avancées
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Foundation name="x" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

          {!activeFeature ? (
            /* Features Grid */
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.featuresGrid}>
                {features.map((feature) => (
                  <TouchableOpacity
                    key={feature.id}
                    style={[styles.featureCard, { backgroundColor: theme.background.secondary }]}
                    onPress={() => setActiveFeature(feature.id as any)}
                  >
                    <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                      <Foundation name={feature.icon} size={24} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.featureCardTitle, { color: theme.text.primary }]}>
                      {feature.title}
                    </Text>
                    <Text style={[styles.featureCardDescription, { color: theme.text.secondary }]}>
                      {feature.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            /* Feature Detail */
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setActiveFeature(null)}
              >
                <Foundation name="arrow-left" size={16} color={theme.text.primary} />
                <Text style={[styles.backButtonText, { color: theme.text.primary }]}>
                  Retour aux fonctionnalités
                </Text>
              </TouchableOpacity>

              {renderFeatureDetail()}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>

    {alertConfig && (
      <CustomAlert
        visible={isVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
        onClose={hideAlert}
        theme={theme}
      />
    )}
  </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    paddingVertical: 20,
  },
  featureCard: {
    width: (width - 70) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureCardDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Feature Detail
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
  },
  featureDetail: {
    paddingBottom: 20,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },

  // Voice
  voiceContainer: {
    alignItems: 'center',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  voiceResult: {
    padding: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  voiceResultText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  useVoiceButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  useVoiceButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Images
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  addImageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imagesList: {
    marginTop: 10,
  },
  imageContainer: {
    marginRight: 10,
  },
  attachedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },

  // Reminder
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    flex: 1,
    textTransform: 'capitalize',
  },
  reminderInput: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  setReminderButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  setReminderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Location
  locationInput: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  currentLocationText: {
    fontSize: 14,
    flex: 1,
  },
  setLocationButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  setLocationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdvancedNoteFeatures;