import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NativeMusicPlayerService from '../services/NativeMusicPlayerService';
import { useCustomAlert } from '../hooks/useCustomAlert';
import CustomAlert from '../components/common/CustomAlert';

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = (width - 80) / 3;

// Bundled artwork options
const BUNDLED_ARTWORKS = [
  { id: 'app_logo', title: 'Logo de l\'app', source: require('../assets/logo/applogo.png') },
  { id: 'intro_logo', title: 'Logo intro', source: require('../assets/logo/intrologo.png') },
  { id: 'bg_1', title: 'Fond 1', source: require('../assets/images/predefined-background (1).jpg') },
  { id: 'bg_2', title: 'Fond 2', source: require('../assets/images/predefined-background (2).jpg') },
  { id: 'bg_3', title: 'Fond 3', source: require('../assets/images/predefined-background (3).jpg') },
  { id: 'bg_4', title: 'Fond 4', source: require('../assets/images/predefined-background (4).jpg') },
  { id: 'bg_5', title: 'Fond 5', source: require('../assets/images/predefined-background (5).jpg') },
  { id: 'bg_6', title: 'Fond 6', source: require('../assets/images/predefined-background (6).jpg') },
  { id: 'bg_7', title: 'Fond 7', source: require('../assets/images/predefined-background (7).jpg') },
  { id: 'bg_8', title: 'Fond 8', source: require('../assets/images/predefined-background (8).jpg') },
];

export const MusicPlayerArtworkScreen: React.FC = () => {
  const { user, navigateToScreen, currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [selectedArtwork, setSelectedArtwork] = useState<string>('app_logo');
  const [customArtworkUri, setCustomArtworkUri] = useState<string | null>(null);

  useEffect(() => {
    loadSavedArtwork();
  }, []);

  const loadSavedArtwork = async () => {
    try {
      const saved = await AsyncStorage.getItem('@music_player_artwork');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedArtwork(parsed.id);
        if (parsed.customUri) {
          setCustomArtworkUri(parsed.customUri);
        }
      }
    } catch (error) {
      console.error('Error loading artwork:', error);
    }
  };

  const saveArtworkSelection = async (artworkId: string, customUri?: string) => {
    try {
      const artworkData = {
        id: artworkId,
        customUri: customUri || null,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem('@music_player_artwork', JSON.stringify(artworkData));
      setSelectedArtwork(artworkId);
      if (customUri) {
        setCustomArtworkUri(customUri);
      }

      // Update the artwork in the currently playing track
      try {
        await NativeMusicPlayerService.updateCurrentArtwork();
        console.log('✅ Artwork updated in music player');
      } catch (updateError) {
        console.log('⚠️ Could not update artwork in player (may not be playing):', updateError);
        // Non-critical error - artwork will be used on next play
      }
    } catch (error) {
      console.error('Error saving artwork:', error);
    }
  };

  const handleSelectBundledArtwork = (artworkId: string) => {
    saveArtworkSelection(artworkId);
  };

  const handleSelectCustomArtwork = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (uri) {
          await saveArtworkSelection('custom', uri);
        }
      }
    } catch (error) {
      console.error('Error selecting custom artwork:', error);
    }
  };

  const getArtworkSource = (artwork: typeof BUNDLED_ARTWORKS[0]) => {
    return artwork.source;
  };

  const handleSave = () => {
    showAlert({
      type: 'success',
      title: 'Sauvegardé',
      message: 'Votre artwork a été enregistré',
      onConfirm: () => navigateToScreen('settings'),
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.adaptiveOverlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigateToScreen('settings')}
              >
                <Foundation name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.title}>Artwork du lecteur</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Description */}
              <View style={styles.descriptionContainer}>
                <Text style={styles.description}>
                  Sélectionnez l'artwork qui apparaîtra sur l'écran de verrouillage pendant la lecture de musique.
                </Text>
              </View>

              {/* Bundled Artworks */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ARTWORKS INTÉGRÉS</Text>
                <View style={styles.artworkGrid}>
                  {BUNDLED_ARTWORKS.map((artwork) => (
                    <TouchableOpacity
                      key={artwork.id}
                      style={[
                        styles.artworkItem,
                        selectedArtwork === artwork.id && styles.artworkItemSelected,
                      ]}
                      onPress={() => handleSelectBundledArtwork(artwork.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.artworkImageContainer}>
                        <Image
                          source={getArtworkSource(artwork)}
                          style={styles.artworkImage}
                          resizeMode="cover"
                        />
                        {selectedArtwork === artwork.id && (
                          <View style={styles.selectedOverlay}>
                            <Foundation name="check" size={32} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.artworkTitle}>{artwork.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Artwork */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ARTWORK PERSONNALISÉ</Text>
                <TouchableOpacity
                  style={[
                    styles.customArtworkButton,
                    selectedArtwork === 'custom' && styles.customArtworkButtonSelected,
                  ]}
                  onPress={handleSelectCustomArtwork}
                  activeOpacity={0.8}
                >
                  <View style={styles.customArtworkContent}>
                    {customArtworkUri && selectedArtwork === 'custom' ? (
                      <Image
                        source={{ uri: customArtworkUri }}
                        style={styles.customArtworkImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.customArtworkPlaceholder}>
                        <Foundation name="photo" size={48} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.customArtworkText}>
                          Choisir depuis la galerie
                        </Text>
                      </View>
                    )}
                    {selectedArtwork === 'custom' && customArtworkUri && (
                      <View style={styles.selectedOverlay}>
                        <Foundation name="check" size={32} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Preview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>APERÇU</Text>
                <View style={styles.previewContainer}>
                  <View style={styles.previewCard}>
                    <Image
                      source={
                        selectedArtwork === 'custom' && customArtworkUri
                          ? { uri: customArtworkUri }
                          : getArtworkSource(
                              BUNDLED_ARTWORKS.find((a) => a.id === selectedArtwork) ||
                                BUNDLED_ARTWORKS[0]
                            )
                      }
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewTitle}>Titre de la chanson</Text>
                      <Text style={styles.previewArtist}>Nom de l'artiste</Text>
                    </View>
                  </View>
                  <Text style={styles.previewNote}>
                    Aperçu de l'artwork sur l'écran de verrouillage
                  </Text>
                </View>
              </View>

              <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Foundation name="check" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Sauvegarder et revenir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Alert */}
      {isVisible && alertConfig && (
        <CustomAlert
          visible={isVisible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={hideAlert}
          theme={currentTheme}
          buttons={[
            {
              text: alertConfig.confirmText || 'OK',
              style: 'default',
              onPress: alertConfig.onConfirm,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  adaptiveOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  descriptionContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 105, 180, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  artworkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  artworkItem: {
    width: ARTWORK_SIZE,
    alignItems: 'center',
  },
  artworkItemSelected: {
    transform: [{ scale: 1.05 }],
  },
  artworkImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 105, 180, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  customArtworkButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  customArtworkButtonSelected: {
    borderColor: 'rgba(255, 105, 180, 0.8)',
    transform: [{ scale: 1.02 }],
  },
  customArtworkContent: {
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customArtworkPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    height: '100%',
  },
  customArtworkText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
    fontWeight: '500',
  },
  customArtworkImage: {
    width: '100%',
    height: '100%',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  previewInfo: {
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  previewArtist: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  previewNote: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 100,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 105, 180, 0.3)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 105, 180, 0.8)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF69B4',
    gap: 8,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default MusicPlayerArtworkScreen;
