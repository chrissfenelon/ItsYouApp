import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  ActionSheetIOS,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Foundation from 'react-native-vector-icons/Foundation';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import { useApp } from '../context/AppContext';
import { useAlert } from '../context/AlertContext';
import FirebaseProfileService from '../services/FirebaseProfileService';
import ImageUploadService from '../services/ImageUploadService';
import ProfileSyncService from '../services/ProfileSyncService';

export const EditProfileScreen: React.FC = () => {
  const { user, navigateToScreen, updateUserProfile } = useApp();
  const { showAlert } = useAlert();
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.photoURL || null);
  const [selectedBadge, setSelectedBadge] = useState<'verified' | 'premium' | 'couple' | 'heart'>(user?.badge || 'verified');
  const [isUploading, setIsUploading] = useState(false);

  const badges = [
    { id: 'verified', icon: 'check', label: 'Vérifié', color: '#00D4AA' },
    { id: 'premium', icon: 'star', label: 'Premium', color: '#FFD700' },
    { id: 'couple', icon: 'heart', label: 'Couple', color: '#FF69B4' },
    { id: 'heart', icon: 'like', label: 'Amoureux', color: '#FF6B6B' },
  ];

  const handleChoosePhoto = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        showAlert({
          title: 'Erreur',
          message: 'Impossible de sélectionner l\'image. Veuillez réessayer.',
          type: 'error',
          buttons: [{ text: 'OK' }]
        });
      } else if (response.assets && response.assets[0].uri) {
        setProfilePhoto(response.assets[0].uri);
      }
    });
  };

  const handlePhotoChange = () => {
    const options = ['Choisir dans la galerie', 'Supprimer la photo', 'Annuler'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
          title: 'Photo de profil'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleChoosePhoto();
          } else if (buttonIndex === 1) {
            setProfilePhoto(null);
            showAlert({
              title: 'Photo supprimée',
              message: 'Votre photo de profil a été supprimée',
              type: 'success',
              buttons: [{ text: 'OK' }]
            });
          }
        }
      );
    } else {
      showAlert({
        title: 'Photo de profil',
        message: 'Choisissez une option',
        type: 'info',
        buttons: [
          { text: 'Choisir dans la galerie', onPress: handleChoosePhoto },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              setProfilePhoto(null);
              showAlert({
                title: 'Photo supprimée',
                type: 'success',
                buttons: [{ text: 'OK' }]
              });
            }
          },
          { text: 'Annuler', style: 'cancel' }
        ]
      });
    }
  };

  const handleSaveProfile = async () => {
    if (profileName.trim()) {
      try {
        setIsUploading(true);
        let finalPhotoURL = profilePhoto;

        // Upload photo to Firebase Storage if a new one was selected
        if (profilePhoto && !profilePhoto.startsWith('http') && user?.id) {
          try {
            console.log('📸 Uploading new profile photo to Firebase Storage...');

            // Supprimer l'ancienne photo si elle existe
            if (user.photoURL && user.photoURL.startsWith('http')) {
              await ImageUploadService.deleteProfilePicture(user.photoURL);
            }

            // Uploader la nouvelle photo
            finalPhotoURL = await ImageUploadService.uploadProfilePicture(user.id, profilePhoto);
            console.log('✅ Photo uploaded successfully:', finalPhotoURL);
          } catch (uploadError) {
            console.error('❌ Error uploading photo:', uploadError);
            showAlert({
              title: 'Erreur',
              message: 'Erreur lors du téléchargement de la photo. Les autres modifications seront sauvegardées.',
              type: 'warning',
              buttons: [{ text: 'OK' }]
            });
            finalPhotoURL = profilePhoto; // Keep local URI if upload fails
          }
        }

        // If photo was deleted, clean up old Firebase Storage photo
        if (!profilePhoto && user?.photoURL && user.photoURL.startsWith('http')) {
          try {
            await ImageUploadService.deleteProfilePicture(user.photoURL);
            console.log('✅ Old profile photo deleted');
          } catch (deleteError) {
            console.error('❌ Error deleting old photo:', deleteError);
          }
        }

        // Update profile in context with final photo URL
        updateUserProfile({
          name: profileName,
          photoURL: finalPhotoURL,
          badge: selectedBadge,
        });

        // Sync with Firebase and all game profiles
        try {
          if (user?.id) {
            // Sauvegarder le profil principal dans Firestore
            if (user?.email && user?.relationshipStartDate) {
              await FirebaseProfileService.saveUserProfile({
                id: user.id,
                name: profileName,
                email: user.email,
                photoURL: finalPhotoURL,
                badge: selectedBadge,
                relationshipStartDate: user.relationshipStartDate,
                lastUpdated: new Date(),
              });
              console.log('✅ Main profile synced with Firebase');
            }

            // Synchroniser avec tous les profils de jeux
            await ProfileSyncService.syncAllGameProfiles(user.id, profileName, finalPhotoURL);
            console.log('✅ All game profiles synced');

            // Mettre à jour les parties en cours (si l'utilisateur est en jeu)
            const avatar = ProfileSyncService.getAvatarFromPhotoURL(finalPhotoURL);
            await ProfileSyncService.updateActiveGamesProfile(user.id, profileName, avatar);
            console.log('✅ Active games updated');
          }
        } catch (syncError) {
          console.warn('⚠️ Failed to sync with Firebase:', syncError);
          // Don't show error to user since local update succeeded
        }

        showAlert({
          title: 'Profil sauvegardé',
          message: 'Vos modifications ont été appliquées avec succès et synchronisées avec tous vos jeux.',
          type: 'success',
          buttons: [{
            text: 'OK',
            onPress: () => {
              navigateToScreen('home');
            }
          }]
        });
      } catch (error) {
        console.error('Profile save error:', error);
        showAlert({
          title: 'Erreur',
          message: 'Erreur lors de la sauvegarde du profil.',
          type: 'error',
          buttons: [{ text: 'OK' }]
        });
      } finally {
        setIsUploading(false);
      }
    } else {
      showAlert({
        title: 'Erreur',
        message: 'Veuillez entrer un nom valide.',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  };

  const renderBadgeOption = (badge: any) => (
    <TouchableOpacity
      key={badge.id}
      style={[styles.badgeOption, selectedBadge === badge.id && styles.selectedBadgeOption]}
      onPress={() => setSelectedBadge(badge.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={selectedBadge === badge.id ?
          ['rgba(255, 105, 180, 0.3)', 'rgba(255, 105, 180, 0.1)'] :
          ['rgba(40, 40, 55, 0.9)', 'rgba(25, 25, 40, 0.9)']
        }
        style={styles.badgeContainer}
      >
        <View style={[styles.badgeIconContainer, { backgroundColor: `${badge.color}20` }]}>
          <Foundation name={badge.icon} size={20} color={badge.color} />
        </View>
        <Text style={styles.badgeLabel}>{badge.label}</Text>
        {selectedBadge === badge.id && (
          <View style={styles.selectedIndicator}>
            <Foundation name="check" size={16} color="#FF69B4" />
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
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigateToScreen('home')} style={styles.backButton}>
              <Foundation name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Modifier le profil</Text>
            <TouchableOpacity
              onPress={handleSaveProfile}
              style={[styles.saveButton, isUploading && styles.saveButtonDisabled]}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Sauver</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={handlePhotoChange} style={styles.photoContainer} activeOpacity={0.8}>
              <LinearGradient
                colors={['rgba(50, 50, 65, 0.9)', 'rgba(25, 25, 40, 0.9)']}
                style={styles.photoFrame}
              >
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
                ) : (
                  <View style={styles.placeholderPhoto}>
                    <Foundation name="torso" size={50} color="#FF69B4" />
                  </View>
                )}

                {/* Badge Preview */}
                <View style={[styles.badgePreview, { borderColor: badges.find(b => b.id === selectedBadge)?.color }]}>
                  <Foundation
                    name={badges.find(b => b.id === selectedBadge)?.icon || 'check'}
                    size={14}
                    color={badges.find(b => b.id === selectedBadge)?.color}
                  />
                </View>
              </LinearGradient>

              <View style={styles.cameraButton}>
                <Foundation name="camera" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={styles.photoHint}>Touchez pour changer votre photo</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Nom d'affichage</Text>
            <LinearGradient
              colors={['rgba(40, 40, 55, 0.9)', 'rgba(25, 25, 40, 0.9)']}
              style={styles.inputContainer}
            >
              <TextInput
                style={styles.textInput}
                value={profileName}
                onChangeText={setProfileName}
                placeholder="Votre nom"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </LinearGradient>
          </View>

          {/* Badge Selection */}
          <View style={styles.badgeSection}>
            <Text style={styles.sectionTitle}>Choisir votre badge</Text>
            <View style={styles.badgeGrid}>
              {badges.map(renderBadgeOption)}
            </View>
          </View>

          {/* Sync Info */}
          <LinearGradient
            colors={['rgba(40, 40, 55, 0.9)', 'rgba(25, 25, 40, 0.9)']}
            style={styles.syncInfo}
          >
            <Foundation name="refresh" size={20} color="#FF69B4" />
            <Text style={styles.syncText}>
              Vos modifications seront automatiquement synchronisées avec Firebase et visibles pour votre partenaire.
            </Text>
          </LinearGradient>

        </View>
      </ImageBackground>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
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
  saveButtonDisabled: {
    backgroundColor: 'rgba(150, 150, 150, 0.8)',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  photoContainer: {
    position: 'relative',
  },
  photoFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255, 105, 180, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 57,
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgePreview: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -5,
    left: -5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  photoHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    textAlign: 'center',
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  badgeSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeOption: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedBadgeOption: {
    borderWidth: 2,
    borderColor: '#FF69B4',
  },
  badgeContainer: {
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncInfo: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  syncText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 12,
    lineHeight: 18,
  },
});

export default EditProfileScreen;