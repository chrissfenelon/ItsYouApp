import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Foundation from 'react-native-vector-icons/Foundation';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import { useApp } from '../context/AppContext';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const { width } = Dimensions.get('window');
const imageWidth = (width - 60) / 2; // 2 colonnes avec padding

// Arrière-plans prédéfinis
const predefinedBackgrounds = [
  { id: 'default', name: 'Défaut', source: require('../assets/images/default-background.jpg') },
  { id: 'predefined-1', name: 'Arrière-plan 1', source: require('../assets/images/predefined-background (1).jpg') },
  { id: 'predefined-2', name: 'Arrière-plan 2', source: require('../assets/images/predefined-background (2).jpg') },
  { id: 'predefined-3', name: 'Arrière-plan 3', source: require('../assets/images/predefined-background (3).jpg') },
  { id: 'predefined-4', name: 'Arrière-plan 4', source: require('../assets/images/predefined-background (4).jpg') },
  { id: 'predefined-5', name: 'Arrière-plan 5', source: require('../assets/images/predefined-background (5).jpg') },
  { id: 'predefined-7', name: 'Arrière-plan 7', source: require('../assets/images/predefined-background (7).jpg') },
  { id: 'predefined-8', name: 'Arrière-plan 8', source: require('../assets/images/predefined-background (8).jpg') },
];

export const BackgroundSelectorScreen: React.FC = () => {
  const { user, navigateToScreen, updateUserProfile, currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [selectedBackground, setSelectedBackground] = useState(
    user?.backgroundImage || 'default'
  );
  const [customBackground, setCustomBackground] = useState<string | null>(
    user?.backgroundType === 'custom' ? user.backgroundImage : null
  );

  const handleSelectPredefined = (backgroundId: string) => {
    setSelectedBackground(backgroundId);
    setCustomBackground(null);
  };

  const handleChooseCustomBackground = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1080,
      maxHeight: 1920,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        showAlert({
          title: 'Erreur',
          message: 'Impossible de sélectionner l\'image. Veuillez réessayer.',
          buttons: [{ text: 'OK' }],
          type: 'error',
        });
      } else if (response.assets && response.assets[0].uri) {
        setCustomBackground(response.assets[0].uri);
        setSelectedBackground('custom');
      }
    });
  };

  const handleSaveBackground = async () => {
    let backgroundImage = selectedBackground;
    let backgroundType: 'default' | 'predefined' | 'custom' = 'default';

    if (selectedBackground === 'custom' && customBackground) {
      backgroundImage = customBackground;
      backgroundType = 'custom';
    } else if (selectedBackground !== 'default') {
      backgroundType = 'predefined';
    }

    try {
      await updateUserProfile({
        backgroundImage,
        backgroundType,
      });

      showAlert({
        title: 'Arrière-plan mis à jour',
        message: 'Votre arrière-plan a été changé avec succès.',
        buttons: [
          {
            text: 'OK',
            onPress: () => navigateToScreen('home'),
          },
        ],
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving background:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de sauvegarder l\'arrière-plan. Veuillez réessayer.',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    }
  };

  const renderPredefinedBackground = (background: any) => (
    <TouchableOpacity
      key={background.id}
      style={[
        styles.backgroundItem,
        selectedBackground === background.id && styles.selectedBackground,
      ]}
      onPress={() => handleSelectPredefined(background.id)}
      activeOpacity={0.8}
    >
      <Image source={background.source} style={styles.backgroundImage} />
      <LinearGradient
        colors={
          selectedBackground === background.id
            ? ['rgba(255, 105, 180, 0.4)', 'rgba(255, 105, 180, 0.2)']
            : ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)']
        }
        style={styles.backgroundOverlay}
      >
        <Text style={styles.backgroundName}>{background.name}</Text>
        {selectedBackground === background.id && (
          <View style={styles.checkIcon}>
            <Foundation name="check" size={16} color="#FFFFFF" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={require('../assets/images/default-background.jpg')}
        style={styles.backgroundImageContainer}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigateToScreen('settings')} style={styles.backButton}>
              <Foundation name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Choisir l'arrière-plan</Text>
            <TouchableOpacity onPress={handleSaveBackground} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Sauver</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Section Arrière-plans prédéfinis */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Arrière-plans prédéfinis</Text>
              <View style={styles.backgroundGrid}>
                {predefinedBackgrounds.map(renderPredefinedBackground)}
              </View>
            </View>

            {/* Section Arrière-plan personnalisé */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Arrière-plan personnalisé</Text>

              {/* Option d'arrière-plan personnalisé */}
              <TouchableOpacity
                style={[
                  styles.customBackgroundOption,
                  selectedBackground === 'custom' && styles.selectedBackground,
                ]}
                onPress={handleChooseCustomBackground}
                activeOpacity={0.8}
              >
                {customBackground ? (
                  <Image source={{ uri: customBackground }} style={styles.backgroundImage} />
                ) : (
                  <View style={styles.addCustomBackground}>
                    <Foundation name="plus" size={32} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.addCustomText}>Ajouter votre image</Text>
                  </View>
                )}
                <LinearGradient
                  colors={
                    selectedBackground === 'custom'
                      ? ['rgba(255, 105, 180, 0.4)', 'rgba(255, 105, 180, 0.2)']
                      : ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)']
                  }
                  style={styles.backgroundOverlay}
                >
                  <Text style={styles.backgroundName}>
                    {customBackground ? 'Votre image' : 'Choisir une image'}
                  </Text>
                  {selectedBackground === 'custom' && (
                    <View style={styles.checkIcon}>
                      <Foundation name="check" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60, // SafeArea equivalent
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 105, 180, 0.8)',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  backgroundItem: {
    width: imageWidth,
    height: imageWidth * 1.5,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBackground: {
    borderColor: '#FF69B4',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backgroundOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customBackgroundOption: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addCustomBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addCustomText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    letterSpacing: 0.3,
  },
});

export default BackgroundSelectorScreen;