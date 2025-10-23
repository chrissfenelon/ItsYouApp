import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import { GlobalFontSettings } from '../types/user';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const GlobalFontSettingsScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen, updateUserProfile } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [fontSettings, setFontSettings] = useState<GlobalFontSettings>(() => {
    return user?.globalFontSettings || {
      family: 'System',
      size: 'medium',
      weight: '400',
    };
  });
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const styles = createStyles(currentTheme);

  // Check if settings have changed from saved settings
  useEffect(() => {
    const savedSettings = user?.globalFontSettings || {
      family: 'System',
      size: 'medium',
      weight: '400',
    };

    const hasChanged =
      fontSettings.family !== savedSettings.family ||
      fontSettings.size !== savedSettings.size ||
      fontSettings.weight !== savedSettings.weight;

    setIsChanged(hasChanged);
  }, [fontSettings, user?.globalFontSettings]);

  const availableFonts = [
    // Polices système
    { name: 'System', label: 'Système', preview: 'Aa', category: 'system' },
    { name: 'serif', label: 'Serif', preview: 'Aa', category: 'system' },
    { name: 'monospace', label: 'Monospace', preview: 'Aa', category: 'system' },
    { name: 'Helvetica', label: 'Helvetica', preview: 'Aa', category: 'system' },
    { name: 'Arial', label: 'Arial', preview: 'Aa', category: 'system' },
    { name: 'Times New Roman', label: 'Times', preview: 'Aa', category: 'system' },
    { name: 'Courier New', label: 'Courier', preview: 'Aa', category: 'system' },

    // Polices personnalisées (nécessitent téléchargement - voir CUSTOM_FONTS_GUIDE.md)
    { name: 'GreatVibes-Regular', label: 'Great Vibes', preview: 'Aa', category: 'custom' },
    { name: 'DancingScript-Regular', label: 'Dancing Script', preview: 'Aa', category: 'custom' },
    { name: 'Pacifico-Regular', label: 'Pacifico', preview: 'Aa', category: 'custom' },
    { name: 'PlayfairDisplay-Regular', label: 'Playfair', preview: 'Aa', category: 'custom' },
    { name: 'Montserrat-Regular', label: 'Montserrat', preview: 'Aa', category: 'custom' },
    { name: 'Lato-Regular', label: 'Lato', preview: 'Aa', category: 'custom' },
  ];

  const fontSizes = [
    { value: 'tiny', label: 'Très petite', multiplier: 0.8 },
    { value: 'small', label: 'Petite', multiplier: 0.9 },
    { value: 'medium', label: 'Moyenne', multiplier: 1.0 },
    { value: 'large', label: 'Grande', multiplier: 1.1 },
    { value: 'xlarge', label: 'Très grande', multiplier: 1.2 },
    { value: 'xxlarge', label: 'Extra grande', multiplier: 1.35 },
  ];

  const fontWeights = [
    { value: '300', label: 'Léger' },
    { value: '400', label: 'Normal' },
    { value: '500', label: 'Moyen' },
    { value: '600', label: 'Gras' },
    { value: '700', label: 'Très gras' },
  ];

  const updateFontSettings = (updates: Partial<GlobalFontSettings>) => {
    setFontSettings(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!isChanged || isSaving) return;

    setIsSaving(true);
    try {
      await updateUserProfile({ globalFontSettings: fontSettings });
      showAlert({
        title: 'Succès',
        message: 'Les paramètres de police ont été sauvegardés avec succès.',
        buttons: [{ text: 'OK' }],
        type: 'success',
      });
      setIsChanged(false);
    } catch (error) {
      console.error('Error saving font settings:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de sauvegarder les paramètres de police.',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    showAlert({
      title: 'Réinitialiser',
      message: 'Voulez-vous vraiment réinitialiser tous les paramètres de police ?',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => setFontSettings({
            family: 'System',
            size: 'medium',
            weight: '400',
          }),
        },
      ],
      type: 'warning',
    });
  };

  const getPreviewStyle = () => {
    const baseSize = 16;
    const sizeMultiplier = fontSizes.find(s => s.value === fontSettings.size)?.multiplier || 1;

    return {
      fontFamily: fontSettings.family !== 'System' ? fontSettings.family : undefined,
      fontSize: baseSize * sizeMultiplier,
      fontWeight: fontSettings.weight as any,
      color: currentTheme.text.primary,
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigateToScreen('settings')}
            >
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Police globale</Text>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Foundation name="refresh" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          {isChanged && (
            <View style={styles.saveContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: currentTheme.romantic.primary,
                    opacity: isSaving ? 0.7 : 1,
                  }
                ]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <Foundation
                  name={isSaving ? "check" : "save"}
                  size={16}
                  color="white"
                />
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Preview */}
          <View style={styles.previewContainer}>
            <Text style={[styles.previewLabel, { color: currentTheme.text.secondary }]}>
              Aperçu {isChanged && '(non sauvegardé)'}
            </Text>
            <View style={styles.previewCard}>
              <Text style={getPreviewStyle()}>
                Cette police sera appliquée à toute l'application
              </Text>
              <Text style={[getPreviewStyle(), { fontSize: (getPreviewStyle().fontSize || 16) * 0.8, marginTop: 8 }]}>
                Exemple de texte secondaire
              </Text>
            </View>
          </View>

          {/* Settings */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.settingGroup}>
              <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
                Famille de police
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontOptions}>
                {availableFonts.map((font) => (
                  <TouchableOpacity
                    key={font.name}
                    style={[
                      styles.fontOption,
                      {
                        backgroundColor: currentTheme.background.secondary,
                        borderColor: fontSettings.family === font.name ? currentTheme.romantic.primary : 'transparent'
                      }
                    ]}
                    onPress={() => updateFontSettings({ family: font.name })}
                  >
                    <Text style={[
                      styles.fontPreview,
                      {
                        color: currentTheme.text.primary,
                        fontFamily: font.name !== 'System' ? font.name : undefined
                      }
                    ]}>
                      {font.preview}
                    </Text>
                    <Text style={[
                      styles.fontLabel,
                      { color: currentTheme.text.secondary }
                    ]}>
                      {font.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
                Taille de police
              </Text>

              <View style={styles.sizeOptions}>
                {fontSizes.map((size) => (
                  <TouchableOpacity
                    key={size.value}
                    style={[
                      styles.sizeOption,
                      {
                        backgroundColor: currentTheme.background.secondary,
                        borderColor: fontSettings.size === size.value ? currentTheme.romantic.primary : 'transparent'
                      }
                    ]}
                    onPress={() => updateFontSettings({ size: size.value as any })}
                  >
                    <Text style={[
                      styles.sizeLabel,
                      { color: currentTheme.text.primary }
                    ]}>
                      {size.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
                Poids de la police
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontOptions}>
                {fontWeights.map((weight) => (
                  <TouchableOpacity
                    key={weight.value}
                    style={[
                      styles.weightOption,
                      {
                        backgroundColor: currentTheme.background.secondary,
                        borderColor: fontSettings.weight === weight.value ? currentTheme.romantic.primary : 'transparent'
                      }
                    ]}
                    onPress={() => updateFontSettings({ weight: weight.value as any })}
                  >
                    <Text style={[
                      styles.weightLabel,
                      {
                        color: currentTheme.text.primary,
                        fontWeight: weight.value as any
                      }
                    ]}>
                      {weight.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.infoCard}>
              <Foundation name="alert" size={20} color={currentTheme.romantic.primary} />
              <Text style={[styles.infoText, { color: currentTheme.text.secondary }]}>
                Ces paramètres affectent toute l'application sauf le conteneur de message qui a ses propres réglages de police.
              </Text>
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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.background.overlay,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
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
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
    flex: 1,
    textAlign: 'center',
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
  saveContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  previewContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  previewCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingGroup: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  fontOptions: {
    flexDirection: 'row',
  },
  fontOption: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    minWidth: 70,
  },
  fontPreview: {
    fontSize: 24,
    marginBottom: 4,
  },
  fontLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  sizeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sizeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 2,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  weightOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  weightLabel: {
    fontSize: 14,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: theme.border.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 12,
  },
  bottomSpacer: {
    height: 50,
  },
});

export default GlobalFontSettingsScreen;