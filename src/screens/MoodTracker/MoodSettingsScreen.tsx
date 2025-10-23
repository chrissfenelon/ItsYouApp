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
  ActivityIndicator,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import MoodTrackerService from '../../services/MoodTrackerService';
import { MoodSettings } from '../../types/moodTracker.types';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

const MoodSettingsScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [settings, setSettings] = useState<MoodSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsData = await MoodTrackerService.getSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading settings:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de charger les paramètres',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<MoodSettings>) => {
    if (!settings) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    try {
      setSaving(true);
      await MoodTrackerService.updateSettings(updates);
    } catch (error) {
      console.error('Error updating settings:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de sauvegarder les paramètres',
        type: 'error',
      });
      // Revert changes
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const SettingRow = ({
    label,
    value,
    onValueChange,
    description,
  }: {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    description?: string;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: 'rgba(255, 255, 255, 0.2)',
          true: currentTheme.romantic.primary,
        }}
        thumbColor="#FFFFFF"
        disabled={saving}
      />
    </View>
  );

  if (loading || !settings) {
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
              onPress={() => navigateToScreen('moodTrackerHome')}
            >
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Notifications Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Foundation name="bell" size={24} color={currentTheme.romantic.primary} />
                <Text style={styles.sectionTitle}>Notifications</Text>
              </View>

              <View style={styles.card}>
                <SettingRow
                  label="Activer les alertes"
                  value={settings.notifications.enableAlerts}
                  onValueChange={(value) =>
                    handleUpdateSettings({
                      notifications: { ...settings.notifications, enableAlerts: value },
                    })
                  }
                  description="Recevoir des notifications sur l'humeur de votre partenaire"
                />

                {settings.notifications.enableAlerts && (
                  <>
                    <SettingRow
                      label="Alerter si triste"
                      value={settings.notifications.alertOnSad}
                      onValueChange={(value) =>
                        handleUpdateSettings({
                          notifications: { ...settings.notifications, alertOnSad: value },
                        })
                      }
                      description="Notification si votre partenaire se sent triste"
                    />

                    <SettingRow
                      label="Alerter si anxieux"
                      value={settings.notifications.alertOnAnxious}
                      onValueChange={(value) =>
                        handleUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            alertOnAnxious: value,
                          },
                        })
                      }
                      description="Notification si votre partenaire se sent anxieux"
                    />

                    <SettingRow
                      label="Alerter si en colère"
                      value={settings.notifications.alertOnAngry}
                      onValueChange={(value) =>
                        handleUpdateSettings({
                          notifications: { ...settings.notifications, alertOnAngry: value },
                        })
                      }
                      description="Notification si votre partenaire est en colère"
                    />
                  </>
                )}

                <View style={styles.divider} />

                <SettingRow
                  label="Rappel quotidien"
                  value={settings.notifications.dailyReminder}
                  onValueChange={(value) =>
                    handleUpdateSettings({
                      notifications: { ...settings.notifications, dailyReminder: value },
                    })
                  }
                  description="Recevoir un rappel pour enregistrer votre humeur"
                />

                {settings.notifications.dailyReminder && (
                  <View style={styles.reminderTimeContainer}>
                    <Text style={styles.reminderTimeLabel}>Heure du rappel:</Text>
                    <Text style={styles.reminderTimeValue}>
                      {settings.notifications.reminderTime}
                    </Text>
                    <TouchableOpacity
                      style={styles.reminderTimeButton}
                      onPress={() =>
                        showAlert({
                          title: 'Bientôt disponible',
                          message: 'La configuration de l\'heure sera disponible prochainement',
                          type: 'info',
                        })
                      }
                    >
                      <Foundation name="clock" size={20} color={currentTheme.text.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Privacy Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Foundation name="eye" size={24} color={currentTheme.romantic.primary} />
                <Text style={styles.sectionTitle}>Confidentialité</Text>
              </View>

              <View style={styles.card}>
                <SettingRow
                  label="Partager mes notes"
                  value={settings.visibility.showNotes}
                  onValueChange={(value) =>
                    handleUpdateSettings({
                      visibility: { ...settings.visibility, showNotes: value },
                    })
                  }
                  description="Permettre à votre partenaire de voir vos notes"
                />

                <SettingRow
                  label="Partager mes activités"
                  value={settings.visibility.showActivities}
                  onValueChange={(value) =>
                    handleUpdateSettings({
                      visibility: { ...settings.visibility, showActivities: value },
                    })
                  }
                  description="Permettre à votre partenaire de voir vos activités"
                />
              </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoTitle}>À propos du Mood Tracker</Text>
              <Text style={styles.infoText}>
                Le Mood Tracker vous aide à suivre vos émotions quotidiennes et à rester
                connecté avec votre partenaire. Les données sont synchronisées en temps réel
                et stockées de manière sécurisée.
              </Text>
            </View>

            {/* Save Indicator */}
            {saving && (
              <View style={styles.savingIndicator}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.savingText}>Sauvegarde...</Text>
              </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text.primary,
  },
  // Card
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Setting Row
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  // Reminder Time
  reminderTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  reminderTimeLabel: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  reminderTimeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  reminderTimeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Info Card
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  // Saving Indicator
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.romantic.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 20,
  },
  savingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MoodSettingsScreen;
