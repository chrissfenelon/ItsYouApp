import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  ImageBackground,
  StatusBar,
  Dimensions,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { MorpionSettingsService, MorpionSettings } from '../../../services/morpion/MorpionSettingsService';
import { SoundService } from '../../../services/SoundService';

const { width, height } = Dimensions.get('window');

interface MorpionSettingsScreenProps {
  onBack: () => void;
}

export const MorpionSettingsScreen: React.FC<MorpionSettingsScreenProps> = ({ onBack }) => {
  const { user, currentTheme } = useApp();
  const styles = createStyles(currentTheme);

  const [settings, setSettings] = useState<MorpionSettings | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await MorpionSettingsService.loadSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async <K extends keyof MorpionSettings>(
    key: K,
    value: MorpionSettings[K]
  ) => {
    if (!settings) return;

    try {
      SoundService.playButtonClick();
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await MorpionSettingsService.updateSetting(key, value);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const resetSettings = async () => {
    try {
      SoundService.playButtonClick();
      await MorpionSettingsService.resetSettings();
      const defaultSettings = await MorpionSettingsService.loadSettings();
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  if (loading || !settings) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ImageBackground
          source={getBackgroundSource(user)}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.blurryOverlay}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
              </TouchableOpacity>
              <Text style={styles.title}>Paramètres</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={styles.loadingContainer}>
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
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres Morpion</Text>

            <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
              <Foundation name="refresh" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Audio & Notifications Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Audio et Notifications</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="volume" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Sons</Text>
                    <Text style={styles.settingDescription}>
                      Sons des coups et événements
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(value) => updateSetting('soundEnabled', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.soundEnabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="music" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Musique</Text>
                    <Text style={styles.settingDescription}>
                      Musique de fond pendant le jeu
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.musicEnabled}
                  onValueChange={(value) => updateSetting('musicEnabled', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.musicEnabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="vibrate" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Vibrations</Text>
                    <Text style={styles.settingDescription}>
                      Retour haptique sur les coups
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.vibrationsEnabled}
                  onValueChange={(value) => updateSetting('vibrationsEnabled', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.vibrationsEnabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="alert" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Notifications de tour en multijoueur
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={(value) => updateSetting('notificationsEnabled', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.notificationsEnabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Gameplay Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gameplay</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="burst-new" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Animations</Text>
                    <Text style={styles.settingDescription}>
                      Animations des coups et victoires
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.animationsEnabled}
                  onValueChange={(value) => updateSetting('animationsEnabled', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.animationsEnabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="graph-trend" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Lignes de grille</Text>
                    <Text style={styles.settingDescription}>
                      Afficher les lignes du plateau
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.showGridLines}
                  onValueChange={(value) => updateSetting('showGridLines', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.showGridLines ? '#ffffff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="save" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Sauvegarde auto</Text>
                    <Text style={styles.settingDescription}>
                      Sauvegarder automatiquement les parties
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.autoSaveGame}
                  onValueChange={(value) => updateSetting('autoSaveGame', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.autoSaveGame ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Configuration Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Configuration par défaut</Text>

              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Taille du plateau</Text>
                <View style={styles.optionButtons}>
                  {[3, 4, 5].map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.optionButton,
                        settings.defaultBoardSize === size && styles.optionButtonActive,
                      ]}
                      onPress={() => updateSetting('defaultBoardSize', size as 3 | 4 | 5)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          settings.defaultBoardSize === size && styles.optionButtonTextActive,
                        ]}
                      >
                        {size}x{size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Alignement pour gagner</Text>
                <View style={styles.optionButtons}>
                  {[3, 4, 5].map((condition) => (
                    <TouchableOpacity
                      key={condition}
                      style={[
                        styles.optionButton,
                        settings.defaultWinCondition === condition && styles.optionButtonActive,
                      ]}
                      onPress={() => updateSetting('defaultWinCondition', condition as 3 | 4 | 5)}
                      disabled={condition > settings.defaultBoardSize}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          settings.defaultWinCondition === condition && styles.optionButtonTextActive,
                          condition > settings.defaultBoardSize && styles.optionButtonTextDisabled,
                        ]}
                      >
                        {condition}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.optionNote}>
                  Ne peut pas dépasser la taille du plateau
                </Text>
              </View>
            </View>

            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>À propos</Text>

              <TouchableOpacity
                style={styles.aboutButton}
                onPress={() => {
                  SoundService.playButtonClick();
                  setShowTutorial(true);
                }}
              >
                <Foundation name="info" size={24} color={currentTheme.text.primary} />
                <Text style={styles.aboutButtonText}>Comment jouer</Text>
                <Foundation name="arrow-right" size={20} color={currentTheme.text.secondary} />
              </TouchableOpacity>

              <View style={styles.versionContainer}>
                <Text style={styles.versionText}>Morpion v1.0.0</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Tutorial Modal */}
      <Modal
        visible={showTutorial}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTutorial(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.tutorialModal}>
            <View style={styles.tutorialHeader}>
              <Text style={styles.tutorialTitle}>Comment jouer au Morpion</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  SoundService.playButtonClick();
                  setShowTutorial(false);
                }}
              >
                <Foundation name="x" size={24} color={currentTheme.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.tutorialContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSectionTitle}>🎯 Objectif</Text>
                <Text style={styles.tutorialText}>
                  Alignez 3 symboles (X ou O) horizontalement, verticalement ou en diagonale
                  avant votre adversaire. Sur des grilles plus grandes (4x4, 5x5), vous pouvez
                  configurer le nombre d'alignements nécessaires.
                </Text>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSectionTitle}>🎮 Modes de jeu</Text>
                <Text style={styles.tutorialText}>
                  <Text style={styles.tutorialBold}>• Local :</Text> Jouez à deux sur le même appareil{'\n'}
                  <Text style={styles.tutorialBold}>• IA :</Text> Affrontez l'intelligence artificielle{'\n'}
                  <Text style={styles.tutorialBold}>• En ligne :</Text> Défiez votre partenaire à distance
                </Text>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSectionTitle}>📊 Statistiques</Text>
                <Text style={styles.tutorialText}>
                  Consultez vos victoires, défaites, matchs nuls et votre temps de jeu.
                  Toutes vos statistiques sont sauvegardées automatiquement.
                </Text>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSectionTitle}>⚙️ Personnalisation</Text>
                <Text style={styles.tutorialText}>
                  Configurez la taille du plateau (3x3, 4x4, 5x5), le nombre d'alignements
                  pour gagner, les sons, animations et plus encore dans les paramètres.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  resetButton: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.text.secondary,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 16,
    paddingLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.text.secondary,
    lineHeight: 16,
  },
  optionGroup: {
    marginBottom: 20,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionButtonActive: {
    backgroundColor: theme.romantic.primary,
    borderColor: theme.romantic.primary,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
  },
  optionButtonTextDisabled: {
    opacity: 0.3,
  },
  optionNote: {
    fontSize: 12,
    color: theme.text.secondary,
    marginTop: 8,
    paddingLeft: 4,
    fontStyle: 'italic',
  },
  aboutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  aboutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
    marginLeft: 16,
    flex: 1,
  },
  versionContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  versionText: {
    fontSize: 14,
    color: theme.text.secondary,
    opacity: 0.6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tutorialModal: {
    backgroundColor: theme.background.secondary,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...theme.shadows.card,
  },
  tutorialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tutorialTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialContent: {
    padding: 20,
  },
  tutorialSection: {
    marginBottom: 24,
  },
  tutorialSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 8,
  },
  tutorialText: {
    fontSize: 14,
    color: theme.text.secondary,
    lineHeight: 22,
  },
  tutorialBold: {
    fontWeight: 'bold',
    color: theme.text.primary,
  },
});

export default MorpionSettingsScreen;
