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
  Switch,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { launchImageLibrary } from 'react-native-image-picker';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import { QuizSettingsService, QuizSettings } from '../../services/quiz/QuizSettingsService';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface QuizSettingsScreenProps {
  onBack: () => void;
}

export const QuizSettingsScreen: React.FC<QuizSettingsScreenProps> = ({ onBack }) => {
  const { user, currentTheme, updateUserProfile } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  // Settings state
  const [settings, setSettings] = useState<QuizSettings>({
    soundEnabled: true,
    musicEnabled: true,
    vibrationsEnabled: true,
    notificationsEnabled: true,
    autoNextQuestion: false,
    showHints: true,
    difficultyLevel: 'moyen',
    questionsPerGame: 10,
    timePerQuestion: 15,
  });

  // Profile state
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || 'Joueur');
  const [profileAvatar, setProfileAvatar] = useState(user?.profilePicture || '👤');
  const [avatarType, setAvatarType] = useState<'emoji' | 'photo'>(
    user?.profilePicture?.startsWith('http') ? 'photo' : 'emoji'
  );

  // Additional modals state
  const [showTutorial, setShowTutorial] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  // Statistics state
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    winRate: 0,
    bestScore: 0,
    avgResponseTime: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // TODO: Load real statistics from Firebase/AsyncStorage
      // For now, showing placeholder data
      // In the future, fetch from QuizCoupleService or a new StatsService
      setStats({
        gamesPlayed: 0,
        wins: 0,
        winRate: 0,
        bestScore: 0,
        avgResponseTime: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Update profile states when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || 'Joueur');
      setProfileAvatar(user.profilePicture || '👤');
      setAvatarType(
        user.profilePicture?.startsWith('http') || user.profilePicture?.startsWith('file://')
          ? 'photo'
          : 'emoji'
      );
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const loadedSettings = await QuizSettingsService.loadSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = async <K extends keyof QuizSettings>(
    key: K,
    value: QuizSettings[K]
  ) => {
    try {
      setSettings((prev) => ({ ...prev, [key]: value }));
      await QuizSettingsService.updateSetting(key, value);
    } catch (error) {
      console.error('Error updating setting:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de sauvegarder le paramètre',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
    }
  };

  const handlePickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      },
      (response) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          showAlert({
            title: 'Erreur',
            message: 'Impossible de charger la photo',
            type: 'error',
            buttons: [{ text: 'OK', style: 'cancel' }],
          });
          return;
        }
        if (response.assets && response.assets[0].uri) {
          setProfileAvatar(response.assets[0].uri);
          setAvatarType('photo');
        }
      }
    );
  };

  const difficultyOptions = [
    { value: 'facile', label: 'Facile', color: '#4CAF50' },
    { value: 'moyen', label: 'Moyen', color: '#FFA726' },
    { value: 'difficile', label: 'Difficile', color: '#EF5350' },
  ];

  const questionCountOptions = [5, 10, 15, 20];
  const timeOptions = [10, 15, 20, 30];

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

            <Text style={styles.title}>Paramètres Quiz</Text>

            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Profil</Text>
              <TouchableOpacity
                style={styles.profileCard}
                onPress={() => setShowProfileEdit(true)}
                activeOpacity={0.7}
              >
                <View style={styles.profileAvatar}>
                  {avatarType === 'photo' && profileAvatar.startsWith('file://') ? (
                    <Image source={{ uri: profileAvatar }} style={styles.avatarImage} />
                  ) : avatarType === 'photo' && profileAvatar.startsWith('http') ? (
                    <Image source={{ uri: profileAvatar }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarEmoji}>{profileAvatar}</Text>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profileName}</Text>
                  <Text style={styles.profileHint}>Toucher pour modifier</Text>
                </View>
                <Foundation name="pencil" size={20} color={currentTheme.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Audio & Notifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔊 Audio & Notifications</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="volume" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Effets sonores</Text>
                    <Text style={styles.settingDescription}>Sons pour les réponses et actions</Text>
                  </View>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(value) => updateSetting('soundEnabled', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.soundEnabled ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="music" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Musique de fond</Text>
                    <Text style={styles.settingDescription}>Ambiance musicale pendant le jeu</Text>
                  </View>
                </View>
                <Switch
                  value={settings.musicEnabled}
                  onValueChange={(value) => updateSetting('musicEnabled', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.musicEnabled ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="burst" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Vibrations</Text>
                    <Text style={styles.settingDescription}>Retour haptique</Text>
                  </View>
                </View>
                <Switch
                  value={settings.vibrationsEnabled}
                  onValueChange={(value) => updateSetting('vibrationsEnabled', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.vibrationsEnabled ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="mail" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Notifications</Text>
                    <Text style={styles.settingDescription}>Invitations et résultats</Text>
                  </View>
                </View>
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={(value) => updateSetting('notificationsEnabled', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.notificationsEnabled ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Gameplay */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎮 Gameplay</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="arrow-right" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Passer automatiquement</Text>
                    <Text style={styles.settingDescription}>
                      Question suivante après réponse
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.autoNextQuestion}
                  onValueChange={(value) => updateSetting('autoNextQuestion', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.autoNextQuestion ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Foundation name="lightbulb" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Afficher les indices</Text>
                    <Text style={styles.settingDescription}>Conseils pendant le jeu</Text>
                  </View>
                </View>
                <Switch
                  value={settings.showHints}
                  onValueChange={(value) => updateSetting('showHints', value)}
                  trackColor={{ false: '#767577', true: currentTheme.romantic.primary }}
                  thumbColor={settings.showHints ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Game Configuration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚙️ Configuration par Défaut</Text>

              {/* Difficulty */}
              <View style={styles.configContainer}>
                <View style={styles.configHeader}>
                  <Foundation name="target" size={20} color={currentTheme.text.primary} />
                  <Text style={styles.configLabel}>Difficulté</Text>
                </View>
                <View style={styles.optionsRow}>
                  {difficultyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        settings.difficultyLevel === option.value && {
                          backgroundColor: option.color,
                          borderColor: option.color,
                        },
                      ]}
                      onPress={() => updateSetting('difficultyLevel', option.value as any)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          settings.difficultyLevel === option.value && styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Questions per game */}
              <View style={styles.configContainer}>
                <View style={styles.configHeader}>
                  <Foundation name="list" size={20} color={currentTheme.text.primary} />
                  <Text style={styles.configLabel}>Questions par partie</Text>
                </View>
                <View style={styles.optionsRow}>
                  {questionCountOptions.map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.optionButton,
                        settings.questionsPerGame === count && styles.optionButtonActive,
                      ]}
                      onPress={() => updateSetting('questionsPerGame', count)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          settings.questionsPerGame === count && styles.optionTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time per question */}
              <View style={styles.configContainer}>
                <View style={styles.configHeader}>
                  <Foundation name="clock" size={20} color={currentTheme.text.primary} />
                  <Text style={styles.configLabel}>Temps par question (sec)</Text>
                </View>
                <View style={styles.optionsRow}>
                  {timeOptions.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.optionButton,
                        settings.timePerQuestion === time && styles.optionButtonActive,
                      ]}
                      onPress={() => updateSetting('timePerQuestion', time)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          settings.timePerQuestion === time && styles.optionTextActive,
                        ]}
                      >
                        {time}s
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* About */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ℹ️ À propos</Text>

              <TouchableOpacity
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={() => setShowTutorial(true)}
              >
                <View style={styles.settingInfo}>
                  <Foundation name="info" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Comment jouer</Text>
                    <Text style={styles.settingDescription}>Tutoriel et règles</Text>
                  </View>
                </View>
                <Foundation name="arrow-right" size={20} color={currentTheme.text.secondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={() => setShowStatistics(true)}
              >
                <View style={styles.settingInfo}>
                  <Foundation name="graph-bar" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Statistiques</Text>
                    <Text style={styles.settingDescription}>Voir vos performances</Text>
                  </View>
                </View>
                <Foundation name="arrow-right" size={20} color={currentTheme.text.secondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                <View style={styles.settingInfo}>
                  <Foundation name="star" size={24} color={currentTheme.text.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Version</Text>
                    <Text style={styles.settingDescription}>Quiz Couple v1.0.0</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={onBack}>
              <Foundation name="check" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileEdit}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileEdit(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le Profil</Text>

            {/* Avatar Selection */}
            <View style={styles.avatarSelector}>
              <View style={styles.currentAvatar}>
                {avatarType === 'photo' ? (
                  <Image source={{ uri: profileAvatar }} style={styles.largeAvatarImage} />
                ) : (
                  <Text style={styles.largeAvatarEmoji}>{profileAvatar}</Text>
                )}
              </View>

              {/* Avatar Type Selection */}
              <View style={styles.avatarTypeSelector}>
                <TouchableOpacity
                  style={[
                    styles.avatarTypeButton,
                    avatarType === 'emoji' && styles.avatarTypeButtonActive,
                  ]}
                  onPress={() => setAvatarType('emoji')}
                >
                  <Foundation name="heart" size={20} color={currentTheme.text.primary} />
                  <Text
                    style={[
                      styles.avatarTypeText,
                      avatarType === 'emoji' && styles.avatarTypeTextActive,
                    ]}
                  >
                    Emoji
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.avatarTypeButton,
                    avatarType === 'photo' && styles.avatarTypeButtonActive,
                  ]}
                  onPress={() => setAvatarType('photo')}
                >
                  <Foundation name="photo" size={20} color={currentTheme.text.primary} />
                  <Text
                    style={[
                      styles.avatarTypeText,
                      avatarType === 'photo' && styles.avatarTypeTextActive,
                    ]}
                  >
                    Photo
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Emoji Grid */}
              {avatarType === 'emoji' ? (
                <>
                  <Text style={styles.avatarHint}>Choisissez un emoji</Text>
                  <View style={styles.emojiGrid}>
                    {['😊', '😎', '🥰', '😍', '🤗', '😇', '🥳', '😘', '💕', '❤️', '💖', '💗'].map(
                      (emoji) => (
                        <TouchableOpacity
                          key={emoji}
                          style={[
                            styles.emojiButton,
                            profileAvatar === emoji && styles.emojiButtonSelected,
                          ]}
                          onPress={() => setProfileAvatar(emoji)}
                        >
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.avatarHint}>Choisissez une photo</Text>
                  <TouchableOpacity
                    style={styles.photoPickerButton}
                    onPress={handlePickImage}
                  >
                    <Foundation name="photo" size={24} color="#FFFFFF" />
                    <Text style={styles.photoPickerText}>Sélectionner une photo</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.textInput}
                value={profileName}
                onChangeText={setProfileName}
                placeholder="Votre nom"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                maxLength={20}
              />
            </View>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowProfileEdit(false);
                  setProfileName(user?.name || 'Joueur');
                  setProfileAvatar(user?.profilePicture || '👤');
                }}
              >
                <Text style={styles.cancelModalButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={async () => {
                  try {
                    // Update user profile in context and storage
                    await updateUserProfile({
                      name: profileName,
                      profilePicture: profileAvatar,
                    });

                    showAlert({
                      title: 'Succès',
                      message: 'Profil mis à jour !',
                      type: 'success',
                      buttons: [{ text: 'OK', style: 'default' }],
                    });
                    setShowProfileEdit(false);
                  } catch (error) {
                    console.error('Error saving profile:', error);
                    showAlert({
                      title: 'Erreur',
                      message: 'Impossible de sauvegarder le profil',
                      type: 'error',
                      buttons: [{ text: 'OK', style: 'cancel' }],
                    });
                  }
                }}
              >
                <Text style={styles.saveModalButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tutorial Modal */}
      <Modal
        visible={showTutorial}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTutorial(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.tutorialScrollView}
            contentContainerStyle={styles.tutorialContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.tutorialCard}>
              <Text style={styles.tutorialTitle}>💕 Comment Jouer au Quiz Couple</Text>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSubtitle}>🎯 Objectif du Jeu</Text>
                <Text style={styles.tutorialText}>
                  Testez votre compatibilité en répondant à des questions sur votre couple.
                  Gagnez des points en répondant correctement et rapidement !
                </Text>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSubtitle}>🎮 Modes de Jeu</Text>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• <Text style={styles.tutorialBold}>Mode Classique:</Text> Questions générales sur les relations</Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• <Text style={styles.tutorialBold}>Mode Personnalisé:</Text> Questions basées sur vos préférences</Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• <Text style={styles.tutorialBold}>Mode Rapide:</Text> Moins de questions, plus d'intensité</Text>
                </View>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSubtitle}>📊 Système de Points</Text>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Réponse correcte: <Text style={styles.tutorialBold}>+100 points</Text></Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Bonus de rapidité: <Text style={styles.tutorialBold}>jusqu'à +50 points</Text></Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Réponse incorrecte: <Text style={styles.tutorialBold}>0 point</Text></Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Temps écoulé: <Text style={styles.tutorialBold}>0 point</Text></Text>
                </View>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSubtitle}>⏱️ Gestion du Temps</Text>
                <Text style={styles.tutorialText}>
                  Chaque question a un temps limité (10-30 secondes selon vos paramètres).
                  Plus vous répondez vite, plus vous gagnez de points bonus !
                </Text>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSubtitle}>💡 Conseils</Text>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Lisez attentivement chaque question</Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Ne vous précipitez pas trop, la précision compte</Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Activez les indices si vous êtes bloqué</Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Communiquez avec votre partenaire après chaque partie</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.tutorialCloseButton}
                onPress={() => setShowTutorial(false)}
              >
                <Foundation name="check" size={24} color="#FFFFFF" />
                <Text style={styles.tutorialCloseText}>J'ai compris !</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        visible={showStatistics}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatistics(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statsModalContent}>
            <View style={styles.statsHeader}>
              <Text style={styles.modalTitle}>📊 Vos Statistiques</Text>
              <TouchableOpacity
                onPress={() => setShowStatistics(false)}
                style={styles.statsCloseButton}
              >
                <Foundation name="x" size={24} color={currentTheme.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.statsScrollView}
              contentContainerStyle={styles.statsScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Overall Stats */}
              <View style={styles.statsSection}>
                <Text style={styles.statsSectionTitle}>🎮 Statistiques Générales</Text>

                <View style={styles.statCard}>
                  <Foundation name="trophy" size={32} color={currentTheme.romantic.primary} />
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>Parties jouées</Text>
                    <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <Foundation name="star" size={32} color="#FFD700" />
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>Victoires</Text>
                    <Text style={styles.statValue}>{stats.wins}</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <Foundation name="graph-bar" size={32} color="#4CAF50" />
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>Taux de réussite</Text>
                    <Text style={styles.statValue}>{stats.winRate}%</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <Foundation name="burst-new" size={32} color="#FF6B6B" />
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>Meilleur score</Text>
                    <Text style={styles.statValue}>{stats.bestScore}</Text>
                  </View>
                </View>
              </View>

              {/* Performance Stats */}
              <View style={styles.statsSection}>
                <Text style={styles.statsSectionTitle}>⚡ Performances</Text>

                <View style={styles.statCard}>
                  <Foundation name="clock" size={32} color="#FFA726" />
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>Temps moyen de réponse</Text>
                    <Text style={styles.statValue}>{stats.avgResponseTime.toFixed(1)}s</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <Foundation name="check" size={32} color="#4CAF50" />
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>Bonnes réponses</Text>
                    <Text style={styles.statValue}>{stats.correctAnswers}</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <Foundation name="x" size={32} color="#EF5350" />
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>Mauvaises réponses</Text>
                    <Text style={styles.statValue}>{stats.wrongAnswers}</Text>
                  </View>
                </View>
              </View>

              {/* Coming Soon Note */}
              <View style={styles.comingSoonCard}>
                <Foundation name="info" size={24} color={currentTheme.text.secondary} />
                <Text style={styles.comingSoonText}>
                  Les statistiques détaillées seront disponibles après votre première partie !
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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

const createStyles = (theme: any) =>
  StyleSheet.create({
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
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 16,
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
      gap: 12,
    },
    settingText: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      color: theme.text.secondary,
    },
    configContainer: {
      marginBottom: 20,
    },
    configHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    configLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
    },
    optionsRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    optionButton: {
      flex: 1,
      minWidth: 70,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    optionButtonActive: {
      backgroundColor: theme.romantic.primary,
      borderColor: theme.romantic.primary,
    },
    optionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.secondary,
    },
    optionTextActive: {
      color: '#FFFFFF',
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.romantic.primary,
      borderRadius: 12,
      padding: 16,
      gap: 8,
      marginTop: 10,
    },
    saveButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    // Profile Styles
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    profileAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    avatarImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    avatarEmoji: {
      fontSize: 32,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 4,
    },
    profileHint: {
      fontSize: 13,
      color: theme.text.secondary,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.background.secondary,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 24,
      textAlign: 'center',
    },
    avatarSelector: {
      alignItems: 'center',
      marginBottom: 24,
    },
    currentAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    largeAvatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    largeAvatarEmoji: {
      fontSize: 50,
    },
    avatarTypeSelector: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
      width: '100%',
    },
    avatarTypeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    avatarTypeButtonActive: {
      backgroundColor: 'rgba(255, 105, 180, 0.2)',
      borderColor: theme.romantic.primary,
    },
    avatarTypeText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.secondary,
    },
    avatarTypeTextActive: {
      color: theme.text.primary,
    },
    avatarHint: {
      fontSize: 14,
      color: theme.text.secondary,
      marginBottom: 16,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    emojiButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiButtonSelected: {
      borderColor: theme.romantic.primary,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    emojiText: {
      fontSize: 28,
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.text.primary,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelModalButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    cancelModalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.secondary,
    },
    saveModalButton: {
      backgroundColor: theme.romantic.primary,
    },
    saveModalButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    photoPickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: theme.romantic.primary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 24,
      width: '100%',
    },
    photoPickerText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // Tutorial Modal Styles
    tutorialScrollView: {
      width: '100%',
      maxHeight: '90%',
    },
    tutorialContent: {
      padding: 20,
    },
    tutorialCard: {
      backgroundColor: theme.background.secondary,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    tutorialTitle: {
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.text.primary,
      textAlign: 'center',
      marginBottom: 24,
    },
    tutorialSection: {
      marginBottom: 20,
    },
    tutorialSubtitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 12,
    },
    tutorialText: {
      fontSize: 15,
      color: theme.text.secondary,
      lineHeight: 22,
    },
    tutorialItem: {
      marginBottom: 8,
    },
    tutorialBullet: {
      fontSize: 15,
      color: theme.text.secondary,
      lineHeight: 22,
    },
    tutorialBold: {
      fontWeight: 'bold',
      color: theme.text.primary,
    },
    tutorialCloseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.romantic.primary,
      borderRadius: 12,
      padding: 16,
      gap: 8,
      marginTop: 24,
    },
    tutorialCloseText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    // Statistics Modal Styles
    statsModalContent: {
      backgroundColor: theme.background.secondary,
      borderRadius: 20,
      width: '90%',
      maxWidth: 500,
      maxHeight: '90%',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    statsCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    statsScrollView: {
      flex: 1,
    },
    statsScrollContent: {
      padding: 24,
    },
    statsSection: {
      marginBottom: 24,
    },
    statsSectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 16,
    },
    statCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      gap: 16,
    },
    statInfo: {
      flex: 1,
    },
    statLabel: {
      fontSize: 14,
      color: theme.text.secondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text.primary,
    },
    comingSoonCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      marginTop: 8,
    },
    comingSoonText: {
      flex: 1,
      fontSize: 13,
      color: theme.text.secondary,
      lineHeight: 18,
      fontStyle: 'italic',
    },
  });

export default QuizSettingsScreen;
