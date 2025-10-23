import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { BlurView } from '@react-native-community/blur';
import { VinylDisc as VinylDiscType, ParticleEffectType } from '../../types/music';
import MediaPickerService from '../../services/MediaPickerService';
import VinylDisc from './VinylDisc';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VinylCustomizationModalProps {
  visible: boolean;
  onClose: () => void;
  vinylDisc: VinylDiscType | null;
  onUpdatePhoto: (photoUri: string) => Promise<void>;
  onUpdateColor: (color: VinylDiscType['vinylColor']) => Promise<void>;
  onUpdateEffects: (effects: ParticleEffectType[]) => Promise<void>;
  onResetToDefault: () => Promise<void>;
  theme: any;
}

const VinylCustomizationModal: React.FC<VinylCustomizationModalProps> = ({
  visible,
  onClose,
  vinylDisc,
  onUpdatePhoto,
  onUpdateColor,
  onUpdateEffects,
  onResetToDefault,
  theme,
}) => {
  const [selectedColor, setSelectedColor] = useState<VinylDiscType['vinylColor']>(
    vinylDisc?.vinylColor || 'black'
  );
  const [activeEffects, setActiveEffects] = useState<ParticleEffectType[]>(
    vinylDisc?.activeEffects || []
  );

  const colors: Array<{ value: VinylDiscType['vinylColor']; label: string; display: string }> = [
    { value: 'black', label: 'Noir', display: '#1a1a1a' },
    { value: 'red', label: 'Rouge', display: '#8B0000' },
    { value: 'pink', label: 'Rose', display: '#FF69B4' },
    { value: 'gold', label: 'Or', display: '#FFD700' },
    { value: 'translucent', label: 'Translucide', display: 'rgba(100, 100, 100, 0.6)' },
  ];

  const handlePickPhoto = async () => {
    try {
      const media = await MediaPickerService.openGallery('photo');
      if (media && !Array.isArray(media) && media.uri) {
        await onUpdatePhoto(media.uri);
      }
    } catch (error) {
      console.error('Failed to pick photo:', error);
    }
  };

  const handleColorSelect = async (color: VinylDiscType['vinylColor']) => {
    setSelectedColor(color);
    await onUpdateColor(color);
  };

  const handleReset = async () => {
    await onResetToDefault();
    setSelectedColor('black');
    setActiveEffects([]);
  };

  const handleEffectToggle = async (effect: ParticleEffectType) => {
    const newEffects = activeEffects.includes(effect)
      ? activeEffects.filter(e => e !== effect)
      : [...activeEffects, effect];

    setActiveEffects(newEffects);
    await onUpdateEffects(newEffects);
  };

  const effectOptions: Array<{ type: ParticleEffectType; label: string; icon: string; color: string }> = [
    { type: 'hearts', label: 'Cœurs', icon: 'heart', color: '#FF69B4' },
    { type: 'stars', label: 'Étoiles', icon: 'star', color: '#FFD700' },
    { type: 'sparkles', label: 'Étincelles', icon: 'burst', color: '#FFFFFF' },
    { type: 'bubbles', label: 'Bulles', icon: 'social-buffer', color: '#87CEEB' },
    { type: 'snow', label: 'Neige', icon: 'asterisk', color: '#FFFFFF' },
    { type: 'confetti', label: 'Confettis', icon: 'burst-sale', color: '#FF6B6B' },
    { type: 'petals', label: 'Pétales', icon: 'trees', color: '#FFB6C1' },
    { type: 'fireflies', label: 'Lucioles', icon: 'lightbulb', color: '#FFFF00' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView
          style={styles.blurOverlay}
          blurType="dark"
          blurAmount={20}
          reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.9)"
        />

        <View style={styles.modal}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Personnaliser le vinyle</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Foundation name="x" size={24} color="rgba(255, 255, 255, 0.9)" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Preview */}
              <View style={styles.previewSection}>
                <Text style={styles.sectionTitle}>Aperçu</Text>
                <View style={styles.preview}>
                  <VinylDisc
                    size={SCREEN_WIDTH * 0.5}
                    isPlaying={true}
                    vinylDisc={vinylDisc ? { ...vinylDisc, vinylColor: selectedColor } : null}
                  />
                </View>
              </View>

              {/* Change Photo */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Photo centrale</Text>
                <TouchableOpacity
                  style={[styles.photoButton, { borderColor: theme.romantic.primary }]}
                  onPress={handlePickPhoto}
                  activeOpacity={0.8}
                >
                  <Foundation name="photo" size={24} color={theme.romantic.primary} />
                  <Text style={styles.photoButtonText}>
                    {vinylDisc?.centerPhotoUri ? 'Changer la photo' : 'Ajouter une photo'}
                  </Text>
                </TouchableOpacity>

                {vinylDisc?.centerPhotoUri && (
                  <View style={styles.currentPhoto}>
                    <Image
                      source={{ uri: vinylDisc.centerPhotoUri }}
                      style={styles.currentPhotoImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>

              {/* Color Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Couleur du vinyle</Text>
                <View style={styles.colorGrid}>
                  {colors.map((color) => (
                    <TouchableOpacity
                      key={color.value}
                      style={[
                        styles.colorOption,
                        selectedColor === color.value && {
                          borderColor: theme.romantic.primary,
                          borderWidth: 3,
                        },
                      ]}
                      onPress={() => handleColorSelect(color.value)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: color.display },
                          color.value === 'translucent' && { borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.3)' }
                        ]}
                      />
                      <Text style={styles.colorLabel}>{color.label}</Text>
                      {selectedColor === color.value && (
                        <View style={[styles.checkmark, { backgroundColor: theme.romantic.primary }]}>
                          <Foundation name="check" size={14} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Background Effects */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Effets d'arrière-plan ({activeEffects.length}/8)
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Sélectionnez jusqu'à 8 effets
                </Text>

                <View style={styles.effectsGrid}>
                  {effectOptions.map((effect) => {
                    const isActive = activeEffects.includes(effect.type);
                    const canActivate = activeEffects.length < 8 || isActive;

                    return (
                      <TouchableOpacity
                        key={effect.type}
                        style={[
                          styles.effectOption,
                          isActive && {
                            borderColor: theme.romantic.primary,
                            borderWidth: 3,
                            backgroundColor: 'rgba(255, 105, 180, 0.15)',
                          },
                          !canActivate && styles.effectOptionDisabled,
                        ]}
                        onPress={() => canActivate && handleEffectToggle(effect.type)}
                        disabled={!canActivate}
                        activeOpacity={0.7}
                      >
                        <Foundation name={effect.icon} size={28} color={effect.color} />
                        <Text style={styles.effectLabel}>{effect.label}</Text>
                        {isActive && (
                          <View style={[styles.effectCheckmark, { backgroundColor: theme.romantic.primary }]}>
                            <Foundation name="check" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Reset Button */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                  activeOpacity={0.8}
                >
                  <Foundation name="refresh" size={20} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.resetButtonText}>
                    Réinitialiser par défaut
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Info */}
              <View style={styles.infoBox}>
                <Foundation name="info" size={18} color={theme.romantic.primary} />
                <Text style={styles.infoText}>
                  Appuyez longuement sur le vinyle dans l'écran de lecture pour personnaliser
                </Text>
              </View>
            </ScrollView>

            {/* Done Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: theme.romantic.primary }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.doneButtonText}>Terminé</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    width: SCREEN_WIDTH - 60,
    maxWidth: 450,
    maxHeight: '85%',
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 18,
  },
  modalContent: {
    backgroundColor: 'rgba(25, 25, 35, 0.98)',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    maxHeight: 500,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  preview: {
    marginTop: 16,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 105, 180, 0.15)',
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentPhoto: {
    marginTop: 16,
    alignItems: 'center',
  },
  currentPhotoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255, 105, 180, 0.6)',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  colorOption: {
    width: (SCREEN_WIDTH - 140) / 3,
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(40, 40, 50, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  colorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 105, 180, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  doneButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: -8,
    marginBottom: 16,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  effectOption: {
    width: (SCREEN_WIDTH - 140) / 4,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(40, 40, 50, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    gap: 6,
  },
  effectOptionDisabled: {
    opacity: 0.4,
  },
  effectLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  effectCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VinylCustomizationModal;
