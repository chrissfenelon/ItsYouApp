import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  Dimensions,
  Switch,
  PanResponder,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
// import Slider from '@react-native-community/slider';
import { useApp } from '../context/AppContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import CustomizableDailyMessage from '../components/CustomizableDailyMessage';
import {
  MessageContainerStyle,
  DEFAULT_MESSAGE_STYLE,
  MESSAGE_CUSTOMIZATION_PRESETS,
  MessageCustomizationPreset
} from '../types/messageCustomization';
import StorageService from '../services/StorageService';

const { width, height } = Dimensions.get('window');

// Simple custom slider component
interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange: (value: number) => void;
  step?: number;
  theme: any;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  step = 1,
  theme
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackWidth = useRef(250); // Default track width
  const trackRef = useRef<View>(null);

  const handleDecrease = () => {
    const newValue = Math.max(minimumValue, value - step);
    onValueChange(newValue);
  };

  const handleIncrease = () => {
    const newValue = Math.min(maximumValue, value + step);
    onValueChange(newValue);
  };

  const progressPercentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  const calculateValueFromPosition = (x: number) => {
    const percentage = Math.max(0, Math.min(1, x / trackWidth.current));
    const rawValue = minimumValue + percentage * (maximumValue - minimumValue);

    // Apply step rounding
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(minimumValue, Math.min(maximumValue, steppedValue));
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Capture any movement, but prefer horizontal
      return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) < 10;
    },
    onPanResponderTerminationRequest: () => false,

    onPanResponderGrant: (evt) => {
      setIsDragging(true);
      if (trackRef.current) {
        trackRef.current.measure((x, y, width, height, pageX, pageY) => {
          trackWidth.current = width;
          const touchX = evt.nativeEvent.pageX - pageX;
          const newValue = calculateValueFromPosition(touchX);
          onValueChange(newValue);
        });
      }
    },

    onPanResponderMove: (evt) => {
      if (isDragging && trackRef.current) {
        trackRef.current.measure((x, y, width, height, pageX, pageY) => {
          trackWidth.current = width;
          const touchX = evt.nativeEvent.pageX - pageX;
          const newValue = calculateValueFromPosition(touchX);
          onValueChange(newValue);
        });
      }
    },

    onPanResponderRelease: () => {
      setIsDragging(false);
    },
  });

  return (
    <View style={customSliderStyles.container}>
      <TouchableOpacity
        style={[customSliderStyles.button, { backgroundColor: theme.background.secondary }]}
        onPress={handleDecrease}
      >
        <Foundation name="minus" size={16} color={theme.text.primary} />
      </TouchableOpacity>

      <View
        ref={trackRef}
        style={[customSliderStyles.track, isDragging && customSliderStyles.trackActive]}
        {...panResponder.panHandlers}
        onTouchStart={(evt) => {
          // Immediate response on touch
          if (trackRef.current) {
            trackRef.current.measure((x, y, width, height, pageX, pageY) => {
              trackWidth.current = width;
              const touchX = evt.nativeEvent.pageX - pageX;
              const newValue = calculateValueFromPosition(touchX);
              onValueChange(newValue);
              setIsDragging(true);
            });
          }
        }}
      >
        <View style={[customSliderStyles.trackFill, {
          width: `${progressPercentage}%`,
          backgroundColor: theme.romantic.primary
        }]} />
        <View style={[customSliderStyles.thumb, {
          left: `${progressPercentage}%`,
          backgroundColor: theme.romantic.primary,
          transform: [{ scale: isDragging ? 1.3 : 1 }]
        }]} />
      </View>

      <TouchableOpacity
        style={[customSliderStyles.button, { backgroundColor: theme.background.secondary }]}
        onPress={handleIncrease}
      >
        <Foundation name="plus" size={16} color={theme.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const customSliderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  track: {
    flex: 1,
    height: 8, // Increased height for better touch target
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    position: 'relative',
    paddingVertical: 8, // Additional touch area
  },
  trackActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  trackFill: {
    height: 8, // Match track height
    borderRadius: 4,
    position: 'absolute',
    top: 8, // Center within padded area
  },
  thumb: {
    position: 'absolute',
    top: 4, // Center within track
    width: 16, // Larger thumb for easier grabbing
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
});

interface ColorPickerProps {
  label: string;
  color: string;
  onColorChange: (color: string) => void;
  theme: any;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onColorChange, theme }) => {
  const predefinedColors = [
    '#FFFFFF', '#FF69B4', '#FFB6C1', '#DDA0DD', '#87CEEB',
    '#98FB98', '#FFD700', '#FFA500', '#FF6347', '#DA70D6',
    '#00CED1', '#32CD32', '#FF1493', '#4169E1', '#FF00FF',
  ];

  const colorPickerStyles = createStyles(theme);

  return (
    <View style={colorPickerStyles.colorPickerContainer}>
      <Text style={[colorPickerStyles.colorPickerLabel, { color: theme.text.primary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={colorPickerStyles.colorOptions}>
        {predefinedColors.map((presetColor) => (
          <TouchableOpacity
            key={presetColor}
            style={[
              colorPickerStyles.colorOption,
              { backgroundColor: presetColor },
              color === presetColor && colorPickerStyles.selectedColorOption,
            ]}
            onPress={() => onColorChange(presetColor)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const MessageCustomizationScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen, updateUserProfile } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [customStyle, setCustomStyle] = useState<MessageContainerStyle>(() => {
    // Load saved customization or use default, ensuring all properties exist
    const savedStyle = user?.messageCustomization;
    return savedStyle ? {
      ...DEFAULT_MESSAGE_STYLE,
      ...savedStyle,
      dimensions: {
        ...DEFAULT_MESSAGE_STYLE.dimensions,
        ...savedStyle.dimensions,
      }
    } : DEFAULT_MESSAGE_STYLE;
  });
  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'effects' | 'layout' | 'fonts'>('presets');

  const styles = createStyles(currentTheme);

  // Preview updates instantly without auto-saving
  // User must click save button to persist changes

  const handlePresetSelect = (preset: MessageCustomizationPreset) => {
    setCustomStyle(preset.style);
  };

  const updateStyle = (updates: Partial<MessageContainerStyle>) => {
    setCustomStyle(prev => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
    showAlert({
      title: 'Réinitialiser',
      message: 'Voulez-vous vraiment réinitialiser tous les paramètres ?',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => setCustomStyle(DEFAULT_MESSAGE_STYLE),
        },
      ],
      type: 'warning',
    });
  };

  const handleSave = async () => {
    try {
      await updateUserProfile({ messageCustomization: customStyle });
      showAlert({
        title: 'Sauvegardé',
        message: 'Vos modifications ont été sauvegardées avec succès.',
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              // Small delay to prevent glitching
              setTimeout(() => {
                navigateToScreen('settings');
              }, 100);
            }
          }
        ],
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving message customization:', error);
      showAlert({
        title: 'Erreur',
        message: 'Une erreur s\'est produite lors de la sauvegarde.',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    }
  };

  const renderPresetsTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
        Styles prédéfinis
      </Text>

      {MESSAGE_CUSTOMIZATION_PRESETS.map((preset) => (
        <TouchableOpacity
          key={preset.id}
          style={[styles.presetCard, { backgroundColor: currentTheme.background.secondary }]}
          onPress={() => handlePresetSelect(preset)}
        >
          <View style={styles.presetInfo}>
            <Text style={[styles.presetName, { color: currentTheme.text.primary }]}>
              {preset.name}
            </Text>
            <Text style={[styles.presetDescription, { color: currentTheme.text.secondary }]}>
              {preset.description}
            </Text>
          </View>

          <View style={styles.presetPreview}>
            <View style={[
              styles.miniPreview,
              {
                backgroundColor: preset.style.backgroundColor.primary,
                borderColor: preset.style.borderColor.primary,
                borderRadius: preset.style.borderRadius / 3,
              }
            ]} />
            <Foundation name="arrow-right" size={16} color={currentTheme.text.tertiary} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderColorsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
        Couleurs d'arrière-plan
      </Text>

      <ColorPicker
        label="Couleur principale"
        color={(() => {
          if (customStyle.backgroundColor.primary.includes('rgba')) {
            const match = customStyle.backgroundColor.primary.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
              const r = parseInt(match[1]).toString(16).padStart(2, '0');
              const g = parseInt(match[2]).toString(16).padStart(2, '0');
              const b = parseInt(match[3]).toString(16).padStart(2, '0');
              return `#${r}${g}${b}`;
            }
          }
          return customStyle.backgroundColor.primary.startsWith('#') ? customStyle.backgroundColor.primary : '#FFFFFF';
        })()}
        onColorChange={(color) => {
          const rgb = color.replace('#', '').match(/.{2}/g);
          if (rgb && rgb.length === 3) {
            const r = parseInt(rgb[0], 16);
            const g = parseInt(rgb[1], 16);
            const b = parseInt(rgb[2], 16);
            updateStyle({
              backgroundColor: {
                ...customStyle.backgroundColor,
                primary: `rgba(${r}, ${g}, ${b}, 0.25)`,
                secondary: `rgba(${r}, ${g}, ${b}, 0.1)`,
                tertiary: `rgba(${r}, ${g}, ${b}, 0.05)`,
              }
            });
          }
        }}
        theme={currentTheme}
      />

      <Text style={[styles.sectionTitle, { color: currentTheme.text.primary, marginTop: 20 }]}>
        Couleurs de texte
      </Text>

      <ColorPicker
        label="Couleur du titre"
        color={(() => {
          if (customStyle.textColor.title.includes('rgba')) {
            const match = customStyle.textColor.title.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
              const r = parseInt(match[1]).toString(16).padStart(2, '0');
              const g = parseInt(match[2]).toString(16).padStart(2, '0');
              const b = parseInt(match[3]).toString(16).padStart(2, '0');
              return `#${r}${g}${b}`;
            }
          }
          return customStyle.textColor.title.startsWith('#') ? customStyle.textColor.title : '#FFFFFF';
        })()}
        onColorChange={(color) => updateStyle({
          textColor: { ...customStyle.textColor, title: color }
        })}
        theme={currentTheme}
      />

      <ColorPicker
        label="Couleur du message"
        color={(() => {
          if (customStyle.textColor.message.includes('rgba')) {
            const match = customStyle.textColor.message.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
              const r = parseInt(match[1]).toString(16).padStart(2, '0');
              const g = parseInt(match[2]).toString(16).padStart(2, '0');
              const b = parseInt(match[3]).toString(16).padStart(2, '0');
              return `#${r}${g}${b}`;
            }
          }
          return customStyle.textColor.message.startsWith('#') ? customStyle.textColor.message : '#FFFFFF';
        })()}
        onColorChange={(color) => updateStyle({
          textColor: { ...customStyle.textColor, message: color }
        })}
        theme={currentTheme}
      />

      <ColorPicker
        label="Couleur de l'éclat"
        color={(() => {
          if (customStyle.textColor.glow.includes('rgba')) {
            const match = customStyle.textColor.glow.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
              const r = parseInt(match[1]).toString(16).padStart(2, '0');
              const g = parseInt(match[2]).toString(16).padStart(2, '0');
              const b = parseInt(match[3]).toString(16).padStart(2, '0');
              return `#${r}${g}${b}`;
            }
          }
          return customStyle.textColor.glow.startsWith('#') ? customStyle.textColor.glow : '#FF69B4';
        })()}
        onColorChange={(color) => updateStyle({
          textColor: { ...customStyle.textColor, glow: color }
        })}
        theme={currentTheme}
      />

      <Text style={[styles.sectionTitle, { color: currentTheme.text.primary, marginTop: 20 }]}>
        Couleurs des particules
      </Text>

      <ColorPicker
        label="Couleur des particules"
        color={(() => {
          if (customStyle.particles.color.includes('rgba')) {
            const match = customStyle.particles.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
              const r = parseInt(match[1]).toString(16).padStart(2, '0');
              const g = parseInt(match[2]).toString(16).padStart(2, '0');
              const b = parseInt(match[3]).toString(16).padStart(2, '0');
              return `#${r}${g}${b}`;
            }
          }
          return customStyle.particles.color.startsWith('#') ? customStyle.particles.color : '#FF69B4';
        })()}
        onColorChange={(color) => {
          const rgb = color.replace('#', '').match(/.{2}/g);
          if (rgb && rgb.length === 3) {
            const r = parseInt(rgb[0], 16);
            const g = parseInt(rgb[1], 16);
            const b = parseInt(rgb[2], 16);
            updateStyle({
              particles: {
                ...customStyle.particles,
                color: `rgba(${r}, ${g}, ${b}, 0.6)`,
              }
            });
          }
        }}
        theme={currentTheme}
      />
    </ScrollView>
  );

  const renderEffectsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingGroup}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
          Effets de flou
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
            Intensité du flou: {customStyle.blurAmount}
          </Text>
          <CustomSlider
            value={customStyle.blurAmount}
            minimumValue={0}
            maximumValue={50}
            onValueChange={(value) => updateStyle({ blurAmount: Math.round(value) })}
            theme={currentTheme}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
            Opacité d'arrière-plan: {Math.round(customStyle.backgroundOpacity * 100)}%
          </Text>
          <CustomSlider
            value={customStyle.backgroundOpacity}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            onValueChange={(value) => updateStyle({ backgroundOpacity: value })}
            theme={currentTheme}
          />
        </View>
      </View>

      <View style={styles.settingGroup}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
          Particules
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
            Activer les particules
          </Text>
          <Switch
            value={customStyle.particles.enabled}
            onValueChange={(value) => updateStyle({
              particles: { ...customStyle.particles, enabled: value }
            })}
            trackColor={{ false: currentTheme.background.tertiary, true: currentTheme.romantic.secondary }}
            thumbColor={customStyle.particles.enabled ? currentTheme.romantic.primary : currentTheme.text.muted}
          />
        </View>

        {customStyle.particles.enabled && (
          <>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
                Nombre de particules: {customStyle.particles.count}
              </Text>
              <CustomSlider
                value={customStyle.particles.count}
                minimumValue={0}
                maximumValue={100}
                onValueChange={(value) => updateStyle({
                  particles: { ...customStyle.particles, count: Math.round(value) }
                })}
                theme={currentTheme}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
                Taille des particules: {customStyle.particles.size}
              </Text>
              <CustomSlider
                value={customStyle.particles.size}
                minimumValue={1}
                maximumValue={10}
                onValueChange={(value) => updateStyle({
                  particles: { ...customStyle.particles, size: Math.round(value) }
                })}
                theme={currentTheme}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
                Vitesse: {customStyle.particles.speed.toFixed(1)}
              </Text>
              <CustomSlider
                value={customStyle.particles.speed}
                minimumValue={0.1}
                maximumValue={5}
                step={0.1}
                onValueChange={(value) => updateStyle({
                  particles: { ...customStyle.particles, speed: value }
                })}
                theme={currentTheme}
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.settingGroup}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
          Animations
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
            Activer l'animation de pulsation
          </Text>
          <Switch
            value={customStyle.animation.pulseEnabled}
            onValueChange={(value) => updateStyle({
              animation: { ...customStyle.animation, pulseEnabled: value }
            })}
            trackColor={{ false: currentTheme.background.tertiary, true: currentTheme.romantic.secondary }}
            thumbColor={customStyle.animation.pulseEnabled ? currentTheme.romantic.primary : currentTheme.text.muted}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderLayoutTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingGroup}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
          Bordures
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
            Épaisseur des bordures: {customStyle.borderWidth}px
          </Text>
          <CustomSlider
            value={customStyle.borderWidth}
            minimumValue={0}
            maximumValue={5}
            step={0.1}
            onValueChange={(value) => updateStyle({ borderWidth: value })}
            theme={currentTheme}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
            Rayon des bordures: {customStyle.borderRadius}px
          </Text>
          <CustomSlider
            value={customStyle.borderRadius}
            minimumValue={0}
            maximumValue={50}
            onValueChange={(value) => updateStyle({ borderRadius: Math.round(value) })}
            theme={currentTheme}
          />
        </View>
      </View>

      <View style={styles.settingGroup}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
          Dimensions
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
            Largeur: {Math.round((customStyle.dimensions?.width || DEFAULT_MESSAGE_STYLE.dimensions.width) * 100)}%
          </Text>
          <CustomSlider
            value={customStyle.dimensions?.width || DEFAULT_MESSAGE_STYLE.dimensions.width}
            minimumValue={0.5}
            maximumValue={1}
            step={0.05}
            onValueChange={(value) => updateStyle({
              dimensions: {
                ...DEFAULT_MESSAGE_STYLE.dimensions,
                ...customStyle.dimensions,
                width: value
              }
            })}
            theme={currentTheme}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
            Espacement interne: {customStyle.dimensions?.padding || DEFAULT_MESSAGE_STYLE.dimensions.padding}px
          </Text>
          <CustomSlider
            value={customStyle.dimensions?.padding || DEFAULT_MESSAGE_STYLE.dimensions.padding}
            minimumValue={10}
            maximumValue={40}
            onValueChange={(value) => updateStyle({
              dimensions: {
                ...DEFAULT_MESSAGE_STYLE.dimensions,
                ...customStyle.dimensions,
                padding: Math.round(value)
              }
            })}
            theme={currentTheme}
          />
        </View>
      </View>

      <View style={styles.settingGroup}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
          Ombre
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
            Activer l'ombre
          </Text>
          <Switch
            value={customStyle.shadow.enabled}
            onValueChange={(value) => updateStyle({
              shadow: { ...customStyle.shadow, enabled: value }
            })}
            trackColor={{ false: currentTheme.background.tertiary, true: currentTheme.romantic.secondary }}
            thumbColor={customStyle.shadow.enabled ? currentTheme.romantic.primary : currentTheme.text.muted}
          />
        </View>

        {customStyle.shadow.enabled && (
          <>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
                Opacité de l'ombre: {Math.round(customStyle.shadow.opacity * 100)}%
              </Text>
              <CustomSlider
                value={customStyle.shadow.opacity}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                onValueChange={(value) => updateStyle({
                  shadow: { ...customStyle.shadow, opacity: value }
                })}
                theme={currentTheme}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
                Rayon de l'ombre: {customStyle.shadow.radius}px
              </Text>
              <CustomSlider
                value={customStyle.shadow.radius}
                minimumValue={0}
                maximumValue={50}
                onValueChange={(value) => updateStyle({
                  shadow: { ...customStyle.shadow, radius: Math.round(value) }
                })}
                theme={currentTheme}
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );

  const renderFontsTab = () => {
    const availableFonts = [
      { name: 'System', label: 'Système' },
      { name: 'serif', label: 'Serif' },
      { name: 'monospace', label: 'Monospace' },
      { name: 'Helvetica', label: 'Helvetica' },
      { name: 'Arial', label: 'Arial' },
      { name: 'Times New Roman', label: 'Times' },
      { name: 'Courier New', label: 'Courier' },
    ];

    const fontWeights = [
      { value: '300', label: 'Léger' },
      { value: '400', label: 'Normal' },
      { value: '500', label: 'Moyen' },
      { value: '600', label: 'Gras' },
      { value: '700', label: 'Très gras' },
    ];

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.settingGroup}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
            Police du titre
          </Text>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
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
                      borderColor: customStyle.font.titleFamily === font.name ? currentTheme.romantic.primary : 'transparent'
                    }
                  ]}
                  onPress={() => updateStyle({
                    font: { ...customStyle.font, titleFamily: font.name }
                  })}
                >
                  <Text style={[
                    styles.fontOptionText,
                    {
                      color: currentTheme.text.primary,
                      fontFamily: font.name !== 'System' ? font.name : undefined
                    }
                  ]}>
                    {font.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
              Poids de la police
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontOptions}>
              {fontWeights.map((weight) => (
                <TouchableOpacity
                  key={weight.value}
                  style={[
                    styles.fontOption,
                    {
                      backgroundColor: currentTheme.background.secondary,
                      borderColor: customStyle.font.titleWeight === weight.value ? currentTheme.romantic.primary : 'transparent'
                    }
                  ]}
                  onPress={() => updateStyle({
                    font: { ...customStyle.font, titleWeight: weight.value as any }
                  })}
                >
                  <Text style={[
                    styles.fontOptionText,
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

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
              Taille du titre: {customStyle.font.titleSize}px
            </Text>
            <CustomSlider
              value={customStyle.font.titleSize}
              minimumValue={14}
              maximumValue={24}
              onValueChange={(value) => updateStyle({
                font: { ...customStyle.font, titleSize: Math.round(value) }
              })}
              theme={currentTheme}
            />
          </View>
        </View>

        <View style={styles.settingGroup}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text.primary }]}>
            Police du message
          </Text>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
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
                      borderColor: customStyle.font.messageFamily === font.name ? currentTheme.romantic.primary : 'transparent'
                    }
                  ]}
                  onPress={() => updateStyle({
                    font: { ...customStyle.font, messageFamily: font.name }
                  })}
                >
                  <Text style={[
                    styles.fontOptionText,
                    {
                      color: currentTheme.text.primary,
                      fontFamily: font.name !== 'System' ? font.name : undefined
                    }
                  ]}>
                    {font.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
              Poids de la police
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontOptions}>
              {fontWeights.map((weight) => (
                <TouchableOpacity
                  key={weight.value}
                  style={[
                    styles.fontOption,
                    {
                      backgroundColor: currentTheme.background.secondary,
                      borderColor: customStyle.font.messageWeight === weight.value ? currentTheme.romantic.primary : 'transparent'
                    }
                  ]}
                  onPress={() => updateStyle({
                    font: { ...customStyle.font, messageWeight: weight.value as any }
                  })}
                >
                  <Text style={[
                    styles.fontOptionText,
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

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: currentTheme.text.secondary }]}>
              Taille du message: {customStyle.font.messageSize}px
            </Text>
            <CustomSlider
              value={customStyle.font.messageSize}
              minimumValue={12}
              maximumValue={20}
              onValueChange={(value) => updateStyle({
                font: { ...customStyle.font, messageSize: Math.round(value) }
              })}
              theme={currentTheme}
            />
          </View>
        </View>
      </ScrollView>
    );
  };

  const tabs = [
    { id: 'presets', name: 'Styles', icon: 'paint-bucket' },
    { id: 'colors', name: 'Couleurs', icon: 'color-wheel' },
    { id: 'effects', name: 'Effets', icon: 'star' },
    { id: 'layout', name: 'Mise en page', icon: 'layout' },
    { id: 'fonts', name: 'Police', icon: 'text-color' },
  ] as const;

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

            <Text style={styles.title}>Personnaliser le message</Text>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Foundation name="refresh" size={20} color={currentTheme.text.primary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Foundation name="check" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewContainer}>
            <Text style={[styles.previewLabel, { color: currentTheme.text.secondary }]}>
              Aperçu en temps réel
            </Text>
            <CustomizableDailyMessage
              customStyle={customStyle}
              previewMode={true}
              style={styles.preview}
            />
          </View>

          {/* Tabs */}
          <View style={[styles.tabBar, { backgroundColor: currentTheme.background.secondary }]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && { backgroundColor: currentTheme.background.card }
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Foundation
                  name={tab.icon}
                  size={16}
                  color={activeTab === tab.id ? currentTheme.text.primary : currentTheme.text.tertiary}
                />
                <Text style={[
                  styles.tabText,
                  { color: activeTab === tab.id ? currentTheme.text.primary : currentTheme.text.tertiary }
                ]}>
                  {tab.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'presets' && renderPresetsTab()}
            {activeTab === 'colors' && renderColorsTab()}
            {activeTab === 'effects' && renderEffectsTab()}
            {activeTab === 'layout' && renderLayoutTab()}
            {activeTab === 'fonts' && renderFontsTab()}
          </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.romantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  previewContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  preview: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    margin: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  presetPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniPreview: {
    width: 30,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
  },
  settingGroup: {
    marginBottom: 25,
  },
  settingRow: {
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  colorPickerContainer: {
    marginBottom: 20,
  },
  colorPickerLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  colorOptions: {
    flexDirection: 'row',
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  fontOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  fontOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  fontOptionText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MessageCustomizationScreen;