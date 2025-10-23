import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  ScrollView,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { BlurView } from '@react-native-community/blur';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import SoundService from '../../../services/SoundService';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';

const { width, height } = Dimensions.get('window');

interface Avatar {
  id: string;
  icon?: string;
  name: string;
  color: string;
  isCustomImage?: boolean;
  imageUri?: string;
}

const MorpionPlayerSetupScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);

  // State
  const [playerName, setPlayerName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [, setCustomImageUri] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const nameInputRef = useRef<TextInput>(null);

  const avatars: Avatar[] = [
    // Profile picture option (if user has one)
    ...(user?.photoURL ? [{
      id: 'profile',
      name: 'Ma Photo',
      color: '#FF69B4',
      isCustomImage: true,
      imageUri: user.photoURL,
    }] : []),
    // Custom image option
    {
      id: 'custom',
      icon: 'photo',
      name: 'Choisir Photo',
      color: '#00D4AA',
    },
    // Default icon avatars
    { id: '1', icon: 'torso', name: 'Classique', color: '#FF69B4' },
    { id: '2', icon: 'crown', name: 'Royal', color: '#FFD700' },
    { id: '3', icon: 'heart', name: 'Romantique', color: '#FF6B6B' },
    { id: '4', icon: 'star', name: 'Star', color: '#4ECDC4' },
    { id: '5', icon: 'trophy', name: 'Champion', color: '#FF9800' },
    { id: '6', icon: 'skull', name: 'Mystérieux', color: '#9C27B0' },
    { id: '7', icon: 'burst', name: 'Explosif', color: '#F44336' },
    { id: '8', icon: 'compass', name: 'Aventurier', color: '#4CAF50' },
  ];

  useEffect(() => {
    // Set default avatar - prefer profile picture if available
    if (!selectedAvatar) {
      const defaultAvatar = user?.photoURL ? avatars.find(a => a.id === 'profile') : avatars.find(a => a.id === '1');
      setSelectedAvatar(defaultAvatar || avatars[0]);
    }

    // Start animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Play sound
    SoundService.playButtonClick();
  }, []);

  const handleContinue = () => {
    if (!playerName.trim()) {
      nameInputRef.current?.focus();
      return;
    }

    SoundService.playButtonClick();
    navigateToScreen('morpionGameMode', {
      playerName: playerName.trim(),
      selectedAvatar,
    });
  };

  const handleBack = () => {
    SoundService.playButtonClick();
    navigateToScreen('morpionWelcome');
  };

  const handleAvatarSelect = (avatar: Avatar) => {
    SoundService.playButtonClick();

    if (avatar.id === 'custom') {
      // Launch image picker for custom photo
      selectCustomImage();
    } else {
      setSelectedAvatar(avatar);
    }
  };

  const selectCustomImage = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 500,
      maxWidth: 500,
      quality: 0.8,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const selectedImageUri = asset.uri;

        if (selectedImageUri) {
          setCustomImageUri(selectedImageUri);
          // Create custom avatar with the selected image
          const customAvatar: Avatar = {
            id: 'custom-selected',
            name: 'Ma Photo',
            color: '#00D4AA',
            isCustomImage: true,
            imageUri: selectedImageUri,
          };
          setSelectedAvatar(customAvatar);
        }
      }
    });
  };

  const canContinue = playerName.trim().length > 0 && selectedAvatar;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <KeyboardAvoidingView
              style={styles.keyboardAvoid}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Foundation name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Configuration du Joueur</Text>

                <View style={styles.placeholder} />
              </View>

              <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Player Name Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>👤 Ton nom de joueur</Text>
                  <Text style={styles.sectionDescription}>
                    Ce nom sera affiché pendant les parties
                  </Text>

                  <View style={[styles.nameInputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' }]}>
                    <View style={styles.nameInputContent}>
                      <Foundation name="torso" size={20} color="rgba(255, 255, 255, 0.8)" />
                      <TextInput
                        ref={nameInputRef}
                        style={styles.nameInput}
                        value={playerName}
                        onChangeText={setPlayerName}
                        placeholder="Entre ton nom..."
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        maxLength={15}
                        autoCapitalize="words"
                        returnKeyType="done"
                        selectionColor="#FF69B4"
                      />
                      <Text style={styles.characterCount}>{playerName.length}/15</Text>
                    </View>
                  </View>
                </View>

                {/* Avatar Selection Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🎭 Choisis ton avatar</Text>
                  <Text style={styles.sectionDescription}>
                    Sélectionne l'icône qui te représente le mieux
                  </Text>

                  <View style={styles.avatarGrid}>
                    {avatars.map((avatar) => (
                      <TouchableOpacity
                        key={avatar.id}
                        style={[
                          styles.avatarCard,
                          selectedAvatar?.id === avatar.id && styles.selectedAvatarCard,
                          { backgroundColor: selectedAvatar?.id === avatar.id ? `${avatar.color}30` : 'rgba(255, 255, 255, 0.15)', borderWidth: 2, borderColor: selectedAvatar?.id === avatar.id ? avatar.color : 'rgba(255, 255, 255, 0.3)' }
                        ]}
                        onPress={() => handleAvatarSelect(avatar)}
                        activeOpacity={0.7}
                      >

                        <View style={styles.avatarContent}>
                          {avatar.isCustomImage && avatar.imageUri ? (
                            <View style={styles.avatarImageContainer}>
                              <Image
                                source={{ uri: avatar.imageUri }}
                                style={styles.avatarImage}
                                resizeMode="cover"
                              />
                            </View>
                          ) : (
                            <Foundation
                              name={avatar.icon || 'torso'}
                              size={32}
                              color={selectedAvatar?.id === avatar.id ? avatar.color : 'rgba(255, 255, 255, 0.8)'}
                            />
                          )}
                          <Text
                            style={[
                              styles.avatarName,
                              selectedAvatar?.id === avatar.id && {
                                color: avatar.color,
                                fontWeight: '600',
                              },
                            ]}
                          >
                            {avatar.name}
                          </Text>
                        </View>

                        {selectedAvatar?.id === avatar.id && (
                          <View style={[styles.selectedIndicator, { backgroundColor: avatar.color }]}>
                            <Foundation name="check" size={16} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Player Preview */}
                {selectedAvatar && playerName.trim() && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👀 Aperçu du joueur</Text>

                    <View style={styles.previewContainer}>
                      <BlurView
                        style={styles.previewBlur}
                        blurType="dark"
                        blurAmount={1}
                        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.1)"
                      >
                        <View style={styles.previewGlass} />
                      </BlurView>

                      <View style={styles.previewContent}>
                        <View style={[styles.previewAvatar, { borderColor: selectedAvatar.color }]}>
                          {selectedAvatar.isCustomImage && selectedAvatar.imageUri ? (
                            <Image
                              source={{ uri: selectedAvatar.imageUri }}
                              style={styles.previewAvatarImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Foundation
                              name={selectedAvatar.icon || 'torso'}
                              size={40}
                              color={selectedAvatar.color}
                            />
                          )}
                        </View>
                        <View style={styles.previewInfo}>
                          <Text style={styles.previewName}>{playerName.trim()}</Text>
                          <Text style={styles.previewSubtitle}>{selectedAvatar.name}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Bottom padding for keyboard */}
                <View style={styles.bottomPadding} />
              </ScrollView>

              {/* Continue Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.continueButton, !canContinue && styles.disabledButton, { backgroundColor: '#FF69B4' }]}
                  onPress={handleContinue}
                  disabled={!canContinue}
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonContent}>
                    <Text style={styles.continueButtonText}>Continuer</Text>
                    <Foundation name="arrow-right" size={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
};

const createStyles = (_theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 60,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  nameInputContainer: {
    position: 'relative',
    marginHorizontal: 10,
  },
  nameInputBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  nameInputGlass: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  nameInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  characterCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarCard: {
    width: (width - 80) / 2,
    height: 100,
    position: 'relative',
    borderRadius: 16,
    marginBottom: 12,
  },
  avatarBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  avatarGlass: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  selectedAvatarCard: {
    shadowColor: 'rgba(255, 105, 180, 0.6)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  avatarImageContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  previewContainer: {
    position: 'relative',
    marginHorizontal: 20,
    borderRadius: 16,
  },
  previewBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  previewGlass: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  previewAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bottomPadding: {
    height: 120,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  continueButton: {
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(255, 105, 180, 0.6)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buttonGlass: {
    flex: 1,
    backgroundColor: 'rgba(255, 105, 180, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.6)',
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MorpionPlayerSetupScreen;