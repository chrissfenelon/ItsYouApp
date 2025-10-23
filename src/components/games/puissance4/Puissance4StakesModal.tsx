import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BlurView } from '@react-native-community/blur';
import FeedbackService from '../../../services/FeedbackService';
import { Puissance4Stakes } from '../../../types/puissance4.types';
import { useApp } from '../../../context/AppContext';

const { width, height } = Dimensions.get('window');

interface Puissance4StakesModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (stakes: Puissance4Stakes) => void;
  mode: 'local' | 'ai' | 'online';
}

interface StakePreset {
  id: string;
  icon: string;
  label: string;
  category: 'romantic' | 'playful' | 'casual';
}

const STAKE_PRESETS: StakePreset[] = [
  // Romantic
  { id: 'massage', icon: 'hand-heart', label: 'Massage relaxant', category: 'romantic' },
  { id: 'dinner', icon: 'silverware-fork-knife', label: 'Prépare le dîner', category: 'romantic' },
  { id: 'date', icon: 'heart', label: 'Organise un date', category: 'romantic' },
  { id: 'breakfast', icon: 'coffee', label: 'Petit-déj au lit', category: 'romantic' },
  { id: 'surprise', icon: 'gift', label: 'Surprise romantique', category: 'romantic' },
  { id: 'movie', icon: 'movie', label: 'Choix du film', category: 'romantic' },

  // Playful
  { id: 'dance', icon: 'dance-ballroom', label: 'Danse en public', category: 'playful' },
  { id: 'song', icon: 'music', label: 'Chante une chanson', category: 'playful' },
  { id: 'joke', icon: 'emoticon-happy', label: 'Raconte 5 blagues', category: 'playful' },
  { id: 'costume', icon: 'tshirt-crew', label: 'Costume ridicule', category: 'playful' },
  { id: 'imitation', icon: 'account-voice', label: 'Imite quelqu\'un', category: 'playful' },

  // Casual
  { id: 'dishes', icon: 'dishwasher', label: 'Fait la vaisselle', category: 'casual' },
  { id: 'cleaning', icon: 'broom', label: 'Nettoie la maison', category: 'casual' },
  { id: 'shopping', icon: 'cart', label: 'Fait les courses', category: 'casual' },
  { id: 'laundry', icon: 'washing-machine', label: 'Fait la lessive', category: 'casual' },
  { id: 'walk', icon: 'walk', label: 'Promenade de 30min', category: 'casual' },
];

const Puissance4StakesModal: React.FC<Puissance4StakesModalProps> = ({
  visible,
  onClose,
  onConfirm,
  mode,
}) => {
  const { currentTheme } = useApp();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customStake, setCustomStake] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const handleConfirm = () => {
    FeedbackService.success();

    let stakes: Puissance4Stakes;

    if (useCustom && customStake.trim()) {
      stakes = {
        type: 'custom',
        description: customStake.trim(),
        createdAt: Date.now(),
      };
    } else if (selectedPreset) {
      const preset = STAKE_PRESETS.find(p => p.id === selectedPreset);
      if (preset) {
        stakes = {
          type: 'preset',
          presetId: preset.id,
          description: preset.label,
          createdAt: Date.now(),
        };
      } else {
        stakes = {
          type: 'none',
          description: 'Partie amicale',
          createdAt: Date.now(),
        };
      }
    } else {
      stakes = {
        type: 'none',
        description: 'Partie amicale',
        createdAt: Date.now(),
      };
    }

    onConfirm(stakes);
    handleClose();
  };

  const handleClose = () => {
    FeedbackService.buttonPress();
    setSelectedPreset(null);
    setCustomStake('');
    setUseCustom(false);
    onClose();
  };

  const handleSkip = () => {
    FeedbackService.buttonPress();
    const stakes: Puissance4Stakes = {
      type: 'none',
      description: 'Partie amicale',
      createdAt: Date.now(),
    };
    onConfirm(stakes);
    handleClose();
  };

  const handlePresetSelect = (presetId: string) => {
    FeedbackService.buttonPress();
    setSelectedPreset(presetId);
    setUseCustom(false);
  };

  const handleCustomToggle = () => {
    FeedbackService.buttonPress();
    setUseCustom(true);
    setSelectedPreset(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'romantic':
        return 'heart';
      case 'playful':
        return 'party-popper';
      case 'casual':
        return 'home';
      default:
        return 'star';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'romantic':
        return currentTheme.romantic.primary;
      case 'playful':
        return currentTheme.romantic.secondary;
      case 'casual':
        return '#6366F1';
      default:
        return currentTheme.text.secondary;
    }
  };

  const romanticStakes = STAKE_PRESETS.filter(s => s.category === 'romantic');
  const playfulStakes = STAKE_PRESETS.filter(s => s.category === 'playful');
  const casualStakes = STAKE_PRESETS.filter(s => s.category === 'casual');

  const styles = createStyles(currentTheme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor={currentTheme.background.primary}
        />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>💝 Ajouter un Enjeu ?</Text>
            <Text style={styles.headerSubtitle}>
              Rendez la partie plus amusante
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Romantic Stakes */}
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <MaterialCommunityIcons
                  name={getCategoryIcon('romantic')}
                  size={20}
                  color={getCategoryColor('romantic')}
                />
                <Text style={[styles.categoryTitle, { color: getCategoryColor('romantic') }]}>
                  Romantique
                </Text>
              </View>
              <View style={styles.presetsGrid}>
                {romanticStakes.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetCard,
                      selectedPreset === preset.id && styles.presetCardSelected,
                    ]}
                    onPress={() => handlePresetSelect(preset.id)}
                  >
                    <MaterialCommunityIcons
                      name={preset.icon as any}
                      size={28}
                      color={
                        selectedPreset === preset.id
                          ? '#FFFFFF'
                          : getCategoryColor(preset.category)
                      }
                    />
                    <Text
                      style={[
                        styles.presetLabel,
                        selectedPreset === preset.id && styles.presetLabelSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Playful Stakes */}
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <MaterialCommunityIcons
                  name={getCategoryIcon('playful')}
                  size={20}
                  color={getCategoryColor('playful')}
                />
                <Text style={[styles.categoryTitle, { color: getCategoryColor('playful') }]}>
                  Amusant
                </Text>
              </View>
              <View style={styles.presetsGrid}>
                {playfulStakes.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetCard,
                      selectedPreset === preset.id && styles.presetCardSelected,
                    ]}
                    onPress={() => handlePresetSelect(preset.id)}
                  >
                    <MaterialCommunityIcons
                      name={preset.icon as any}
                      size={28}
                      color={
                        selectedPreset === preset.id
                          ? '#FFFFFF'
                          : getCategoryColor(preset.category)
                      }
                    />
                    <Text
                      style={[
                        styles.presetLabel,
                        selectedPreset === preset.id && styles.presetLabelSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Casual Stakes */}
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <MaterialCommunityIcons
                  name={getCategoryIcon('casual')}
                  size={20}
                  color={getCategoryColor('casual')}
                />
                <Text style={[styles.categoryTitle, { color: getCategoryColor('casual') }]}>
                  Quotidien
                </Text>
              </View>
              <View style={styles.presetsGrid}>
                {casualStakes.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetCard,
                      selectedPreset === preset.id && styles.presetCardSelected,
                    ]}
                    onPress={() => handlePresetSelect(preset.id)}
                  >
                    <MaterialCommunityIcons
                      name={preset.icon as any}
                      size={28}
                      color={
                        selectedPreset === preset.id
                          ? '#FFFFFF'
                          : getCategoryColor(preset.category)
                      }
                    />
                    <Text
                      style={[
                        styles.presetLabel,
                        selectedPreset === preset.id && styles.presetLabelSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Stake */}
            <View style={styles.customSection}>
              <View style={styles.categoryHeader}>
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color={currentTheme.romantic.primary}
                />
                <Text style={[styles.categoryTitle, { color: currentTheme.romantic.primary }]}>
                  Personnalisé
                </Text>
              </View>
              <Text style={styles.customHint}>
                Tapez votre propre enjeu ici :
              </Text>
              <TextInput
                style={[
                  styles.customInput,
                  useCustom && customStake.trim() && styles.customInputActive,
                ]}
                placeholder="Ex: Faire la vaisselle pendant une semaine..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={customStake}
                onChangeText={(text) => {
                  setCustomStake(text);
                  if (text.trim()) {
                    setUseCustom(true);
                    setSelectedPreset(null);
                  } else {
                    setUseCustom(false);
                  }
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={100}
                autoCorrect={true}
                autoCapitalize="sentences"
              />
              <Text style={styles.charCount}>
                {customStake.length}/100 caractères
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Passer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                (!selectedPreset && !useCustom) && styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedPreset && (!useCustom || !customStake.trim())}
            >
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    backgroundColor: theme.background.secondary || '#1a1a1a',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.romantic.primary,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 105, 180, 0.2)',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.romantic.primary + '26', // 15% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.background.secondary || '#1a1a1a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetCard: {
    width: (width * 0.9 - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 100,
  },
  presetCardSelected: {
    backgroundColor: theme.romantic.primary,
    borderColor: theme.romantic.primary,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
  },
  presetLabelSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  customSection: {
    marginTop: 8,
  },
  customHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  customToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background.secondary + 'B3', // 70% opacity
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.romantic.primary + '1A', // 10% opacity
    gap: 8,
  },
  customToggleActive: {
    backgroundColor: theme.romantic.secondary,
    borderColor: theme.romantic.secondary,
  },
  customToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  customToggleTextActive: {
    color: '#FFFFFF',
  },
  customInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 105, 180, 0.4)',
    minHeight: 100,
  },
  customInputActive: {
    backgroundColor: theme.romantic.secondary + '1A', // 10% opacity
    borderColor: theme.romantic.secondary,
    borderWidth: 2,
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.romantic.primary + '1A', // 10% opacity
    backgroundColor: theme.background.secondary + 'F2', // 95% opacity
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  skipButton: {
    backgroundColor: theme.romantic.primary + '1A', // 10% opacity
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text.secondary,
  },
  confirmButton: {
    backgroundColor: theme.romantic.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default Puissance4StakesModal;
