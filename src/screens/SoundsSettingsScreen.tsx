import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import LinearGradient from 'react-native-linear-gradient';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

export const SoundsSettingsScreen: React.FC = () => {
  const { navigateToScreen, currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [notificationSounds, setNotificationSounds] = useState(true);
  const [vibrations, setVibrations] = useState(true);
  const [gameSounds, setGameSounds] = useState(true);
  const [musicPlayerSounds, setMusicPlayerSounds] = useState(true);
  const [uiSounds, setUiSounds] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [vibrationIntensity, setVibrationIntensity] = useState(0.6);
  const [selectedRingtone, setSelectedRingtone] = useState('Romantique');
  const [selectedNotificationSound, setSelectedNotificationSound] = useState('Doux');

  const ringtones = [
    'Romantique',
    'Classique',
    'Moderne',
    'Mélodique',
    'Zen',
    'Discret'
  ];

  const notificationSoundOptions = [
    'Doux',
    'Subtil',
    'Chime',
    'Bell',
    'Pop',
    'Whisper'
  ];

  const handleTestSound = (soundType: string) => {
    showAlert({
      title: 'Test du son',
      message: `Lecture du son: ${soundType}`,
      buttons: [{ text: 'OK' }],
      type: 'info',
    });
  };

  const handleSelectRingtone = () => {
    showAlert({
      title: 'Choisir la sonnerie',
      message: 'Sélectionnez votre sonnerie préférée',
      buttons: [
        ...ringtones.map(tone => ({
          text: tone,
          onPress: () => {
            setSelectedRingtone(tone);
            handleTestSound(tone);
          }
        })),
        { text: 'Annuler', style: 'cancel' }
      ],
      type: 'info',
    });
  };

  const handleSelectNotificationSound = () => {
    showAlert({
      title: 'Son de notification',
      message: 'Sélectionnez votre son de notification',
      buttons: [
        ...notificationSoundOptions.map(sound => ({
          text: sound,
          onPress: () => {
            setSelectedNotificationSound(sound);
            handleTestSound(sound);
          }
        })),
        { text: 'Annuler', style: 'cancel' }
      ],
      type: 'info',
    });
  };

  const soundSettings = [
    {
      section: 'Sons généraux',
      items: [
        {
          icon: 'sound',
          title: 'Sons de notification',
          subtitle: 'Sons pour les messages et alertes',
          type: 'switch',
          value: notificationSounds,
          onPress: () => setNotificationSounds(!notificationSounds),
        },
        {
          icon: 'mobile-signal',
          title: 'Vibrations',
          subtitle: 'Vibrations pour les notifications',
          type: 'switch',
          value: vibrations,
          onPress: () => setVibrations(!vibrations),
        },
        {
          icon: 'sound',
          title: 'Sons de l\'interface',
          subtitle: 'Sons des boutons et interactions',
          type: 'switch',
          value: uiSounds,
          onPress: () => setUiSounds(!uiSounds),
        },
      ]
    },
    {
      section: 'Sons des applications',
      items: [
        {
          icon: 'puzzle',
          title: 'Sons de jeux',
          subtitle: 'Sons dans Puissance 4, Morpion, etc.',
          type: 'switch',
          value: gameSounds,
          onPress: () => setGameSounds(!gameSounds),
        },
        {
          icon: 'music',
          title: 'Lecteur de musique',
          subtitle: 'Sons du lecteur de musique',
          type: 'switch',
          value: musicPlayerSounds,
          onPress: () => setMusicPlayerSounds(!musicPlayerSounds),
        },
      ]
    },
    {
      section: 'Personnalisation',
      items: [
        {
          icon: 'telephone',
          title: 'Sonnerie d\'appel',
          subtitle: selectedRingtone,
          type: 'navigate',
          onPress: handleSelectRingtone,
        },
        {
          icon: 'mail',
          title: 'Son de notification',
          subtitle: selectedNotificationSound,
          type: 'navigate',
          onPress: handleSelectNotificationSound,
        },
      ]
    },
  ];

  const renderSettingItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.settingItem}
      onPress={item.onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(40, 40, 55, 0.9)', 'rgba(25, 25, 40, 0.9)']}
        style={styles.settingContainer}
      >
        <View style={styles.settingContent}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Foundation name={item.icon} size={24} color="#FF69B4" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            {item.type === 'switch' ? (
              <Switch
                value={item.value}
                onValueChange={item.onPress}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#FF69B4' }}
                thumbColor="#FFFFFF"
              />
            ) : (
              <Foundation name="arrow-right" size={20} color="rgba(255,255,255,0.6)" />
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={require('../assets/images/default-background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigateToScreen('settings')}
                activeOpacity={0.8}
              >
                <Foundation name="arrow-left" size={24} color="#FF69B4" />
              </TouchableOpacity>
              <Text style={styles.title}>Sons et Vibrations</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Volume Control */}
            <View style={styles.volumeSection}>
              <LinearGradient
                colors={['rgba(50, 50, 65, 0.9)', 'rgba(25, 25, 40, 0.9)']}
                style={styles.volumeCard}
              >
                <Text style={styles.volumeTitle}>Volume général</Text>
                <View style={styles.volumeContainer}>
                  <Foundation name="volume" size={20} color="rgba(255,255,255,0.6)" />
                  <Slider
                    style={styles.volumeSlider}
                    minimumValue={0}
                    maximumValue={1}
                    value={volume}
                    onValueChange={setVolume}
                    minimumTrackTintColor="#FF69B4"
                    maximumTrackTintColor="rgba(255,255,255,0.3)"
                    thumbStyle={styles.sliderThumb}
                  />
                  <Text style={styles.volumePercent}>{Math.round(volume * 100)}%</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Vibration Intensity */}
            {vibrations && (
              <View style={styles.volumeSection}>
                <LinearGradient
                  colors={['rgba(50, 50, 65, 0.9)', 'rgba(25, 25, 40, 0.9)']}
                  style={styles.volumeCard}
                >
                  <Text style={styles.volumeTitle}>Intensité des vibrations</Text>
                  <View style={styles.volumeContainer}>
                    <Foundation name="mobile-signal" size={20} color="rgba(255,255,255,0.6)" />
                    <Slider
                      style={styles.volumeSlider}
                      minimumValue={0}
                      maximumValue={1}
                      value={vibrationIntensity}
                      onValueChange={setVibrationIntensity}
                      minimumTrackTintColor="#FF69B4"
                      maximumTrackTintColor="rgba(255,255,255,0.3)"
                      thumbStyle={styles.sliderThumb}
                    />
                    <Text style={styles.volumePercent}>{Math.round(vibrationIntensity * 100)}%</Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Settings Sections */}
            <View style={styles.settingsContainer}>
              {soundSettings.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>{section.section}</Text>
                  {section.items.map((item, itemIndex) =>
                    renderSettingItem(item, itemIndex)
                  )}
                </View>
              ))}
            </View>

            {/* Test Sounds */}
            <View style={styles.testSection}>
              <Text style={styles.sectionTitle}>Tester les sons</Text>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleTestSound('Notification')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255, 105, 180, 0.8)', 'rgba(255, 105, 180, 0.6)']}
                  style={styles.testButtonGradient}
                >
                  <Foundation name="play" size={20} color="#FFFFFF" />
                  <Text style={styles.testButtonText}>Tester le son de notification</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleTestSound('Sonnerie')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255, 105, 180, 0.8)', 'rgba(255, 105, 180, 0.6)']}
                  style={styles.testButtonGradient}
                >
                  <Foundation name="telephone" size={20} color="#FFFFFF" />
                  <Text style={styles.testButtonText}>Tester la sonnerie</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </ImageBackground>

      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
          theme={currentTheme}
          type={alertConfig.type}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 105, 180, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 44,
  },
  volumeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  volumeCard: {
    borderRadius: 18,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  volumeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#FF69B4',
    width: 20,
    height: 20,
  },
  volumePercent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF69B4',
    minWidth: 40,
    textAlign: 'right',
  },
  settingsContainer: {
    paddingHorizontal: 20,
  },
  settingsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 105, 180, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  settingItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingContainer: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 105, 180, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  settingSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
  },
  settingRight: {
    marginLeft: 10,
  },
  testSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  testButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  testButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 100,
  },
});

export default SoundsSettingsScreen;