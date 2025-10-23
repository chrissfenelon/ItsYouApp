import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Modal,
} from 'react-native';
import { PlayerProfile } from '../../types/wordSearch.types';
import { usePreferences } from '../../hooks/storage/usePreferences';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import CustomAlert from '../../components/common/CustomAlert';
import Slider from '@react-native-community/slider';
import Foundation from 'react-native-vector-icons/Foundation';
import { AvatarDisplay } from '../../utils/avatarUtils';

interface SettingsScreenProps {
  profile: PlayerProfile;
  onBack: () => void;
  onEditProfile: () => void;
  onResetProgress: () => Promise<PlayerProfile>;
  onDeleteProfile: () => Promise<void>;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  profile,
  onBack,
  onEditProfile,
  onResetProgress,
  onDeleteProfile,
}) => {
  const { preferences, currentTheme, updatePreference, toggleTheme, resetPreferences } = usePreferences();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  const colors = currentTheme.colors;

  // Theme object pour CustomAlert
  const theme = {
    romantic: {
      primary: colors.primary,
    },
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleResetProgress = () => {
    showAlert({
      title: 'Réinitialiser la progression',
      message: 'Êtes-vous sûr de vouloir réinitialiser toute votre progression ? Cette action est irréversible.',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            showAlert({
              title: 'Confirmation',
              message: 'Êtes-vous VRAIMENT sûr ? Toutes vos données seront perdues.',
              type: 'warning',
              buttons: [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Oui, réinitialiser',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await onResetProgress();
                      showAlert({
                        title: 'Succès',
                        message: 'Progression réinitialisée avec succès',
                        type: 'success',
                      });
                    } catch (error) {
                      showAlert({
                        title: 'Erreur',
                        message: 'Impossible de réinitialiser la progression',
                        type: 'error',
                      });
                    }
                  },
                },
              ],
            });
          },
        },
      ],
    });
  };

  const handleDeleteAccount = () => {
    showAlert({
      title: 'Supprimer le compte',
      message: 'Voulez-vous vraiment supprimer votre compte ? Toutes vos données seront perdues définitivement.',
      type: 'error',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            showAlert({
              title: 'Confirmation finale',
              message: 'Dernière chance ! Supprimer le compte ?',
              type: 'error',
              buttons: [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Oui, supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await onDeleteProfile();
                      showAlert({
                        title: 'Succès',
                        message: 'Compte supprimé avec succès',
                        type: 'success',
                        buttons: [
                          {
                            text: 'OK',
                            onPress: () => {
                              // Return to menu after deletion
                              onBack();
                            },
                          },
                        ],
                      });
                    } catch (error) {
                      showAlert({
                        title: 'Erreur',
                        message: 'Impossible de supprimer le compte',
                        type: 'error',
                      });
                    }
                  },
                },
              ],
            });
          },
        },
      ],
    });
  };

  if (!preferences) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
          Chargement...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={[styles.backButton, { color: colors.primary }]}>← Retour</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Paramètres</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <TouchableOpacity
            style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => toggleSection('profile')}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionIcon, { color: colors.primary }]}>👤</Text>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Profil</Text>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                {expandedSection === 'profile' ? '▼' : '▶'}
              </Text>
            </View>

            {expandedSection === 'profile' && (
              <View style={styles.sectionContent}>
                <View style={styles.profileInfo}>
                  <AvatarDisplay
                    avatar={profile.avatar}
                    imageStyle={styles.profileAvatarImage}
                    textStyle={styles.profileAvatar}
                  />
                  <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                    {profile.name}
                  </Text>
                  <Text style={[styles.profileLevel, { color: colors.textSecondary }]}>
                    Niveau {profile.level} • {profile.xp} XP
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={onEditProfile}
                >
                  <Text style={styles.buttonText}>Modifier le profil</Text>
                </TouchableOpacity>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {profile.stats.gamesPlayed}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Parties
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {profile.stats.totalWordsFound}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Mots trouvés
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {profile.coins}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Pièces
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Audio Section */}
          <TouchableOpacity
            style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => toggleSection('audio')}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionIcon, { color: colors.primary }]}>🔊</Text>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Audio</Text>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                {expandedSection === 'audio' ? '▼' : '▶'}
              </Text>
            </View>

            {expandedSection === 'audio' && (
              <View style={styles.sectionContent}>
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Musique
                  </Text>
                  <Switch
                    value={preferences.musicEnabled}
                    onValueChange={(value) => { updatePreference('musicEnabled', value); }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                {preferences.musicEnabled && (
                  <View style={styles.sliderContainer}>
                    <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
                      Volume: {preferences.musicVolume}%
                    </Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={preferences.musicVolume}
                      onValueChange={(value) => updatePreference('musicVolume', value)}
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor={colors.border}
                    />
                  </View>
                )}

                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Effets sonores
                  </Text>
                  <Switch
                    value={preferences.soundEffectsEnabled}
                    onValueChange={(value) => { updatePreference('soundEffectsEnabled', value); }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                {preferences.soundEffectsEnabled && (
                  <View style={styles.sliderContainer}>
                    <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
                      Volume: {preferences.soundEffectsVolume}%
                    </Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={preferences.soundEffectsVolume}
                      onValueChange={(value) => updatePreference('soundEffectsVolume', value)}
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor={colors.border}
                    />
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Notifications Section */}
          <TouchableOpacity
            style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => toggleSection('notifications')}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionIcon, { color: colors.primary }]}>🔔</Text>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Notifications
              </Text>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                {expandedSection === 'notifications' ? '▼' : '▶'}
              </Text>
            </View>

            {expandedSection === 'notifications' && (
              <View style={styles.sectionContent}>
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Activer les notifications
                  </Text>
                  <Switch
                    value={preferences.notificationsEnabled}
                    onValueChange={(value) => { updatePreference('notificationsEnabled', value); }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Rappel quotidien
                  </Text>
                  <Switch
                    value={preferences.dailyReminderEnabled}
                    onValueChange={(value) => { updatePreference('dailyReminderEnabled', value); }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    disabled={!preferences.notificationsEnabled}
                  />
                </View>

                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Notifications multijoueur
                  </Text>
                  <Switch
                    value={preferences.multiplayerNotificationsEnabled}
                    onValueChange={(value) => { updatePreference('multiplayerNotificationsEnabled', value); }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    disabled={!preferences.notificationsEnabled}
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Game Settings Section */}
          <TouchableOpacity
            style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => toggleSection('game')}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionIcon, { color: colors.primary }]}>🎮</Text>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Jeu</Text>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                {expandedSection === 'game' ? '▼' : '▶'}
              </Text>
            </View>

            {expandedSection === 'game' && (
              <View style={styles.sectionContent}>
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Mode sombre
                  </Text>
                  <Switch
                    value={preferences.theme === 'dark'}
                    onValueChange={toggleTheme}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                <View style={styles.settingColumn}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary, marginBottom: 8 }]}>
                    Difficulté par défaut
                  </Text>
                  <View style={styles.difficultyButtons}>
                    {(['easy', 'medium', 'hard', 'expert'] as const).map((difficulty) => (
                      <TouchableOpacity
                        key={difficulty}
                        style={[
                          styles.difficultyButton,
                          { borderColor: colors.border },
                          preferences.defaultDifficulty === difficulty && {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          },
                        ]}
                        onPress={() => updatePreference('defaultDifficulty', difficulty)}
                      >
                        <Text
                          style={[
                            styles.difficultyButtonText,
                            { color: colors.textSecondary },
                            preferences.defaultDifficulty === difficulty && {
                              color: colors.textWhite,
                            },
                          ]}
                        >
                          {difficulty === 'easy' ? 'Facile' :
                           difficulty === 'medium' ? 'Moyen' :
                           difficulty === 'hard' ? 'Difficile' : 'Expert'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Afficher les conseils
                  </Text>
                  <Switch
                    value={preferences.showHints}
                    onValueChange={(value) => { updatePreference('showHints', value); }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Vibrations
                  </Text>
                  <Switch
                    value={preferences.vibrationsEnabled}
                    onValueChange={(value) => { updatePreference('vibrationsEnabled', value); }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Account Section */}
          <TouchableOpacity
            style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => toggleSection('account')}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionIcon, { color: colors.primary }]}>👥</Text>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Compte</Text>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                {expandedSection === 'account' ? '▼' : '▶'}
              </Text>
            </View>

            {expandedSection === 'account' && (
              <View style={styles.sectionContent}>
                <TouchableOpacity
                  style={[styles.dangerButton, { borderColor: colors.warning }]}
                  onPress={handleResetProgress}
                >
                  <Text style={[styles.dangerButtonText, { color: colors.warning }]}>
                    Réinitialiser la progression
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dangerButton, { borderColor: colors.error }]}
                  onPress={handleDeleteAccount}
                >
                  <Text style={[styles.dangerButtonText, { color: colors.error }]}>
                    Supprimer le compte
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* About Section */}
          <TouchableOpacity
            style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => toggleSection('about')}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionIcon, { color: colors.primary }]}>ℹ️</Text>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>À propos</Text>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                {expandedSection === 'about' ? '▼' : '▶'}
              </Text>
            </View>

            {expandedSection === 'about' && (
              <View style={styles.sectionContent}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary, marginBottom: 12 }]}
                  onPress={() => setShowTutorial(true)}
                >
                  <Text style={styles.buttonText}>📖 Comment jouer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary, marginBottom: 16 }]}
                  onPress={() => setShowStatistics(true)}
                >
                  <Text style={styles.buttonText}>📊 Statistiques détaillées</Text>
                </TouchableOpacity>

                <View style={styles.aboutRow}>
                  <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>
                    Version
                  </Text>
                  <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>
                    1.0.0
                  </Text>
                </View>

                <View style={styles.aboutRow}>
                  <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>
                    Développé par
                  </Text>
                  <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>
                    Chris Fenelon
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tutorial Modal */}
      <Modal
        visible={showTutorial}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTutorial(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
          <ScrollView
            style={styles.tutorialScrollView}
            contentContainerStyle={styles.tutorialContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.tutorialCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.tutorialTitle, { color: colors.textPrimary }]}>
                🔤 Comment Jouer à Mots Mêlés
              </Text>

              <View style={styles.tutorialSection}>
                <Text style={[styles.tutorialSubtitle, { color: colors.textPrimary }]}>
                  🎯 Objectif du Jeu
                </Text>
                <Text style={[styles.tutorialText, { color: colors.textSecondary }]}>
                  Trouvez tous les mots cachés dans la grille. Les mots peuvent être placés
                  horizontalement, verticalement ou en diagonale, dans n'importe quelle direction.
                </Text>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={[styles.tutorialSubtitle, { color: colors.textPrimary }]}>
                  🎮 Comment Jouer
                </Text>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>Touchez</Text> une lettre pour commencer
                  </Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>Glissez</Text> vers les autres lettres pour former un mot
                  </Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>Relâchez</Text> pour valider le mot
                  </Text>
                </View>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={[styles.tutorialSubtitle, { color: colors.textPrimary }]}>
                  ⭐ Système de Points
                </Text>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • Mot trouvé: <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>+10 points × longueur du mot</Text>
                  </Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • Bonus de rapidité: <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>points supplémentaires</Text>
                  </Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • Grille complétée: <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>bonus de fin</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={[styles.tutorialSubtitle, { color: colors.textPrimary }]}>
                  🏆 Niveaux de Difficulté
                </Text>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: 'bold', color: '#4CAF50' }}>Facile:</Text> Petite grille, mots simples
                  </Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: 'bold', color: '#FFA726' }}>Moyen:</Text> Grille moyenne, mots variés
                  </Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: 'bold', color: '#EF5350' }}>Difficile:</Text> Grande grille, mots complexes
                  </Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: 'bold', color: '#9C27B0' }}>Expert:</Text> Très grande grille, mots difficiles
                  </Text>
                </View>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={[styles.tutorialSubtitle, { color: colors.textPrimary }]}>
                  💡 Conseils
                </Text>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • Cherchez d'abord les mots courts
                  </Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • Regardez dans toutes les directions
                  </Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={[styles.tutorialBullet, { color: colors.textSecondary }]}>
                    • Utilisez les indices si vous êtes bloqué
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.tutorialCloseButton, { backgroundColor: colors.primary }]}
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
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
          <View style={[styles.statsModalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.statsHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.statsModalTitle, { color: colors.textPrimary }]}>
                📊 Statistiques Détaillées
              </Text>
              <TouchableOpacity
                onPress={() => setShowStatistics(false)}
                style={[styles.statsCloseButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
              >
                <Foundation name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.statsScrollView}
              contentContainerStyle={styles.statsScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Overall Stats */}
              <View style={styles.statsSection}>
                <Text style={[styles.statsSectionTitle, { color: colors.textPrimary }]}>
                  🎮 Vue d'Ensemble
                </Text>

                <View style={[styles.statCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: colors.border }]}>
                  <Foundation name="trophy" size={32} color={colors.primary} />
                  <View style={styles.statInfo}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Parties jouées
                    </Text>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {profile.stats.gamesPlayed}
                    </Text>
                  </View>
                </View>

                <View style={[styles.statCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: colors.border }]}>
                  <Foundation name="star" size={32} color="#FFD700" />
                  <View style={styles.statInfo}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Niveau actuel
                    </Text>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {profile.level}
                    </Text>
                  </View>
                </View>

                <View style={[styles.statCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: colors.border }]}>
                  <Foundation name="burst-new" size={32} color="#FF6B6B" />
                  <View style={styles.statInfo}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Points d'expérience
                    </Text>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {profile.xp} XP
                    </Text>
                  </View>
                </View>

                <View style={[styles.statCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: colors.border }]}>
                  <Foundation name="dollar" size={32} color="#FFD700" />
                  <View style={styles.statInfo}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Pièces
                    </Text>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {profile.coins}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Performance Stats */}
              <View style={styles.statsSection}>
                <Text style={[styles.statsSectionTitle, { color: colors.textPrimary }]}>
                  ⚡ Performances
                </Text>

                <View style={[styles.statCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: colors.border }]}>
                  <Foundation name="check" size={32} color="#4CAF50" />
                  <View style={styles.statInfo}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Total mots trouvés
                    </Text>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {profile.stats.totalWordsFound}
                    </Text>
                  </View>
                </View>

                <View style={[styles.statCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: colors.border }]}>
                  <Foundation name="burst" size={32} color="#FFA726" />
                  <View style={styles.statInfo}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Meilleur score
                    </Text>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {profile.stats.highestScore || 0}
                    </Text>
                  </View>
                </View>

                <View style={[styles.statCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: colors.border }]}>
                  <Foundation name="clock" size={32} color="#2196F3" />
                  <View style={styles.statInfo}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Temps de jeu total
                    </Text>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {Math.floor((profile.stats.totalPlayTime || 0) / 60)} min
                    </Text>
                  </View>
                </View>
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
          onClose={hideAlert}
          theme={theme}
          type={alertConfig.type}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 14,
  },
  sectionContent: {
    marginTop: 16,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    fontSize: 60,
    marginBottom: 12,
  },
  profileAvatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileLevel: {
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingColumn: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  difficultyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  dangerButton: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aboutLabel: {
    fontSize: 16,
  },
  aboutValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Tutorial Modal Styles
  tutorialScrollView: {
    width: '100%',
    maxHeight: '90%',
  },
  tutorialContent: {
    padding: 0,
  },
  tutorialCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  tutorialTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  tutorialSection: {
    marginBottom: 20,
  },
  tutorialSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tutorialText: {
    fontSize: 15,
    lineHeight: 22,
  },
  tutorialItem: {
    marginBottom: 8,
  },
  tutorialBullet: {
    fontSize: 15,
    lineHeight: 22,
  },
  tutorialCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    borderWidth: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  statsModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    gap: 16,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
