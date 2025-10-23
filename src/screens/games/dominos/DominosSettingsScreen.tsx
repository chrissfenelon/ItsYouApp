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
  Switch,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import CustomAlert from '../../../components/common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const DOMINOS_SETTINGS_KEY = '@dominos_settings';

interface DominosSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showHints: boolean;
  autoPlaceTile: boolean;
  confirmBeforePass: boolean;
  showOpponentTilesCount: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  boardOrientation: 'horizontal' | 'vertical';
}

const DEFAULT_SETTINGS: DominosSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  showHints: true,
  autoPlaceTile: false,
  confirmBeforePass: true,
  showOpponentTilesCount: true,
  animationSpeed: 'normal',
  boardOrientation: 'horizontal',
};

export const DominosSettingsScreen: React.FC<any> = ({ navigation }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [settings, setSettings] = useState<DominosSettings>(DEFAULT_SETTINGS);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(DOMINOS_SETTINGS_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading dominos settings:', error);
    }
  };

  const saveSettings = async (newSettings: DominosSettings) => {
    try {
      await AsyncStorage.setItem(DOMINOS_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving dominos settings:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de sauvegarder les paramètres',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
    }
  };

  const handleToggle = (key: keyof DominosSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleAnimationSpeedChange = () => {
    const speeds: Array<'slow' | 'normal' | 'fast'> = ['slow', 'normal', 'fast'];
    const currentIndex = speeds.indexOf(settings.animationSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSettings = { ...settings, animationSpeed: speeds[nextIndex] };
    saveSettings(newSettings);
  };

  const handleBoardOrientationChange = () => {
    const orientations: Array<'horizontal' | 'vertical'> = ['horizontal', 'vertical'];
    const currentIndex = orientations.indexOf(settings.boardOrientation);
    const nextIndex = (currentIndex + 1) % orientations.length;
    const newSettings = { ...settings, boardOrientation: orientations[nextIndex] };
    saveSettings(newSettings);
  };

  const handleResetSettings = () => {
    showAlert({
      title: 'Réinitialiser les paramètres',
      message: 'Voulez-vous restaurer les paramètres par défaut ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            saveSettings(DEFAULT_SETTINGS);
            showAlert({
              title: 'Paramètres réinitialisés',
              message: 'Les paramètres ont été restaurés par défaut',
              type: 'success',
              buttons: [{ text: 'OK', style: 'cancel' }],
            });
          },
        },
      ],
    });
  };

  const handleShowRules = () => {
    showAlert({
      title: '📖 Règles du jeu',
      message:
        '• 7 tuiles par joueur au début\n' +
        '• Placer les tuiles bout à bout\n' +
        '• Les numéros doivent correspondre\n' +
        '• Premier à poser toutes ses tuiles gagne\n' +
        '• Si blocage : joueur avec le moins de points gagne\n' +
        '• Piocher si aucun coup possible\n' +
        '• Passer si pioche vide et aucun coup',
      type: 'info',
      buttons: [{ text: 'Compris', style: 'cancel' }],
    });
  };

  const getAnimationSpeedLabel = () => {
    switch (settings.animationSpeed) {
      case 'slow':
        return 'Lente';
      case 'normal':
        return 'Normale';
      case 'fast':
        return 'Rapide';
    }
  };

  const getBoardOrientationLabel = () => {
    switch (settings.boardOrientation) {
      case 'horizontal':
        return 'Horizontale';
      case 'vertical':
        return 'Verticale';
    }
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
              onPress={() => navigateToScreen('dominosMenu')}
            >
              <Foundation name="arrow-left" size={24} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres Dominos</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Audio & Vibration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Audio & Vibration</Text>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Foundation name="volume" size={24} color={currentTheme.romantic.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Sons</Text>
                    <Text style={styles.settingSubtitle}>
                      Sons de placement et notifications
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={() => handleToggle('soundEnabled')}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: currentTheme.romantic.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Foundation name="vibrate" size={24} color={currentTheme.romantic.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Vibrations</Text>
                    <Text style={styles.settingSubtitle}>Retour haptique</Text>
                  </View>
                </View>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={() => handleToggle('vibrationEnabled')}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: currentTheme.romantic.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Gameplay */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gameplay</Text>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Foundation name="lightbulb" size={24} color={currentTheme.romantic.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Afficher les indices</Text>
                    <Text style={styles.settingSubtitle}>
                      Mettre en surbrillance les coups possibles
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.showHints}
                  onValueChange={() => handleToggle('showHints')}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: currentTheme.romantic.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Foundation name="magnifying-glass" size={24} color={currentTheme.romantic.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Afficher nombre de tuiles adversaire</Text>
                    <Text style={styles.settingSubtitle}>
                      Voir combien de tuiles reste à l'adversaire
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.showOpponentTilesCount}
                  onValueChange={() => handleToggle('showOpponentTilesCount')}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: currentTheme.romantic.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Foundation name="check" size={24} color={currentTheme.romantic.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Placement automatique</Text>
                    <Text style={styles.settingSubtitle}>
                      Placer automatiquement si un seul côté possible
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.autoPlaceTile}
                  onValueChange={() => handleToggle('autoPlaceTile')}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: currentTheme.romantic.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Foundation name="alert" size={24} color={currentTheme.romantic.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Confirmer avant de passer</Text>
                    <Text style={styles.settingSubtitle}>
                      Demander confirmation avant de passer le tour
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.confirmBeforePass}
                  onValueChange={() => handleToggle('confirmBeforePass')}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: currentTheme.romantic.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Display */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Affichage</Text>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleAnimationSpeedChange}
              >
                <View style={styles.settingLeft}>
                  <Foundation name="play-video" size={24} color={currentTheme.romantic.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Vitesse d'animation</Text>
                    <Text style={styles.settingSubtitle}>
                      Vitesse des animations de placement
                    </Text>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>{getAnimationSpeedLabel()}</Text>
                  <Foundation name="arrow-right" size={20} color="rgba(255,255,255,0.6)" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleBoardOrientationChange}
              >
                <View style={styles.settingLeft}>
                  <Foundation name="refresh" size={24} color={currentTheme.romantic.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Orientation du plateau</Text>
                    <Text style={styles.settingSubtitle}>
                      Disposition des tuiles sur le plateau
                    </Text>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>{getBoardOrientationLabel()}</Text>
                  <Foundation name="arrow-right" size={20} color="rgba(255,255,255,0.6)" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Info & Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Info & Actions</Text>

              <TouchableOpacity style={styles.settingItem} onPress={handleShowRules}>
                <View style={styles.settingLeft}>
                  <Foundation name="book" size={24} color={currentTheme.romantic.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Règles du jeu</Text>
                    <Text style={styles.settingSubtitle}>
                      Comment jouer aux dominos
                    </Text>
                  </View>
                </View>
                <Foundation name="arrow-right" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleResetSettings}
              >
                <View style={styles.settingLeft}>
                  <Foundation name="refresh" size={24} color="#FF453A" />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: '#FF453A' }]}>
                      Réinitialiser les paramètres
                    </Text>
                    <Text style={styles.settingSubtitle}>
                      Restaurer les paramètres par défaut
                    </Text>
                  </View>
                </View>
                <Foundation name="arrow-right" size={20} color="rgba(255,255,255,0.6)" />
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
          type={alertConfig.type}
          buttons={alertConfig.buttons}
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
      fontWeight: 'bold',
      color: theme.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text.primary,
      marginBottom: 16,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      opacity: 0.9,
    },
    settingItem: {
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
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    settingText: {
      marginLeft: 12,
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 4,
    },
    settingSubtitle: {
      fontSize: 12,
      color: theme.text.secondary,
      lineHeight: 16,
    },
    settingRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    settingValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.romantic.primary,
    },
    bottomSpacer: {
      height: 40,
    },
  });

export default DominosSettingsScreen;
