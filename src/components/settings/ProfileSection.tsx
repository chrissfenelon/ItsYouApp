import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Clipboard,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { launchImageLibrary } from 'react-native-image-picker';
import { useApp } from '../../context/AppContext';
import FirebaseProfileService from '../../services/FirebaseProfileService';
import ProfileSyncService from '../../services/ProfileSyncService';
import FirebaseAuthService from '../../services/FirebaseAuthService';
import TextInputModal from '../common/TextInputModal';
import DatePickerModal from '../common/DatePickerModal';
import CustomAlert from '../common/CustomAlert';
import useCustomAlert from '../../hooks/useCustomAlert';
import firestore from '@react-native-firebase/firestore';

interface ProfileSectionProps {
  onPhotoChange?: (photoURL: string) => void;
  onNameChange?: (name: string) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  onPhotoChange,
  onNameChange,
}) => {
  const { user, currentTheme, updateUserProfile } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [countdown, setCountdown] = useState({
    years: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Live countdown - use relationshipStartDate from user profile
  useEffect(() => {
    const calculateCountdown = () => {
      // Use relationshipStartDate from user profile, fallback to default if not set
      const startDate = user?.relationshipStartDate || new Date('2025-07-13T00:00:00');
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();

      if (diff < 0) {
        setCountdown({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const years = Math.floor(days / 365);

      setCountdown({
        years,
        days: days % 365,
        hours: hours % 24,
        minutes: minutes % 60,
        seconds: seconds % 60,
      });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [user?.relationshipStartDate]);

  const handlePhotoChange = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    });

    if (result.didCancel || !result.assets?.[0]?.uri || !user) {
      return;
    }

    setUploadingPhoto(true);
    try {
      const photoURL = await FirebaseProfileService.uploadProfilePhoto(
        user.id,
        result.assets[0].uri
      );

      await updateUserProfile({ photoURL });
      await ProfileSyncService.syncAllGameProfiles(user.id, user.name || 'Utilisateur', photoURL);

      onPhotoChange?.(photoURL);

      showAlert({
        title: 'Photo mise à jour',
        message: 'Votre photo de profil a été mise à jour avec succès',
        type: 'success',
        buttons: [{ text: 'OK' }]
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de mettre à jour la photo',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleNameChange = async (newName: string) => {
    if (!user || !newName.trim()) return;

    try {
      const nameParts = newName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await updateUserProfile({
        name: newName.trim(),
        firstName,
        lastName,
      });

      await ProfileSyncService.syncAllGameProfiles(user.id, newName.trim(), user.photoURL);

      onNameChange?.(newName.trim());
      setIsEditingName(false);

      showAlert({
        title: 'Nom mis à jour',
        message: `Votre nom a été changé pour: ${newName}`,
        type: 'success',
        buttons: [{ text: 'OK' }]
      });
    } catch (error) {
      console.error('Error updating name:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le nom',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  };

  const handleCopyEmail = () => {
    if (user?.email) {
      Clipboard.setString(user.email);
      showAlert({
        title: 'Email copié',
        message: 'L\'adresse email a été copiée dans le presse-papiers',
        type: 'success',
        buttons: [{ text: 'OK' }]
      });
    }
  };

  const handleResetPassword = () => {
    if (!user?.email) return;

    showAlert({
      title: 'Réinitialiser le mot de passe',
      message: `Un email de réinitialisation sera envoyé à ${user.email}. Continuer ?`,
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            try {
              await FirebaseAuthService.resetPassword(user.email);
              showAlert({
                title: 'Email envoyé',
                message: `Un email de réinitialisation a été envoyé à ${user.email}. Vérifiez votre boîte de réception.`,
                type: 'success',
                buttons: [{ text: 'OK' }]
              });
            } catch (error: any) {
              showAlert({
                title: 'Erreur',
                message: error.message || 'Impossible d\'envoyer l\'email',
                type: 'error',
                buttons: [{ text: 'OK' }]
              });
            }
          }
        }
      ]
    });
  };

  const formatCountdown = () => {
    const parts = [];

    if (countdown.years > 0) {
      parts.push(`${countdown.years} an${countdown.years > 1 ? 's' : ''}`);
    }
    if (countdown.days > 0) {
      parts.push(`${countdown.days} jour${countdown.days > 1 ? 's' : ''}`);
    }

    parts.push(`${String(countdown.hours).padStart(2, '0')}:${String(countdown.minutes).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`);

    return parts.join(', ');
  };

  const formatDate = (date?: Date) => {
    if (!date) return '13 juillet 2025';

    const dateObj = date instanceof Date ? date : new Date(date);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('fr-FR', { month: 'long' });
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <View style={styles.container}>
      {/* Glassmorphism Profile Card */}
      <View style={styles.glassCard}>
        {/* Gradient Overlay */}
        <View style={[styles.gradientOverlay, {
          backgroundColor: `${currentTheme.romantic.primary}15`
        }]} />

        {/* Main Content */}
        <View style={styles.cardContent}>
          {/* Top Section - Photo & Name */}
          <View style={styles.topSection}>
            {/* Photo Container */}
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={handlePhotoChange}
              activeOpacity={0.8}
              disabled={uploadingPhoto}
            >
              <View style={[styles.photoWrapper, {
                borderColor: `${currentTheme.romantic.primary}80`,
                shadowColor: currentTheme.romantic.primary,
              }]}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.photo} />
                ) : (
                  <View style={[styles.photoPlaceholder, {
                    backgroundColor: `${currentTheme.romantic.primary}20`
                  }]}>
                    <Foundation name="torso" size={56} color={currentTheme.romantic.primary} />
                  </View>
                )}

                {uploadingPhoto && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                )}

                {/* Floating Camera Icon */}
                <View style={[styles.cameraIcon, {
                  backgroundColor: currentTheme.romantic.primary,
                  shadowColor: currentTheme.romantic.primary,
                }]}>
                  <Foundation name="camera" size={18} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>

            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Utilisateur'}
                </Text>
                <TouchableOpacity
                  style={[styles.editIconButton, {
                    backgroundColor: `${currentTheme.romantic.primary}30`,
                    borderColor: `${currentTheme.romantic.primary}60`,
                  }]}
                  onPress={() => setIsEditingName(true)}
                  activeOpacity={0.7}
                >
                  <Foundation name="pencil" size={14} color={currentTheme.romantic.primary} />
                </TouchableOpacity>
              </View>

              {/* Badge */}
              {user?.badge && (
                <View style={[styles.badge, {
                  backgroundColor: `${currentTheme.romantic.secondary}25`,
                  borderColor: `${currentTheme.romantic.secondary}60`,
                }]}>
                  <Text style={[styles.badgeText, { color: currentTheme.romantic.secondary }]}>
                    {user.badge === 'couple' ? '💑 Couple' :
                     user.badge === 'premium' ? '⭐ Premium' :
                     user.badge === 'verified' ? '✓ Vérifié' : '❤️ Love'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />

          {/* Account Details Section */}
          <View style={styles.detailsSection}>
            {/* Email Row */}
            <TouchableOpacity
              style={styles.detailRow}
              onPress={handleCopyEmail}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, {
                backgroundColor: `${currentTheme.romantic.primary}20`
              }]}>
                <Foundation name="mail" size={18} color={currentTheme.romantic.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {user?.email || 'Non défini'}
                </Text>
              </View>
              <Foundation name="page-copy" size={18} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>

            {/* Reset Password Row */}
            <TouchableOpacity
              style={styles.detailRow}
              onPress={handleResetPassword}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, {
                backgroundColor: `${currentTheme.romantic.secondary}20`
              }]}>
                <Foundation name="key" size={18} color={currentTheme.romantic.secondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Mot de passe</Text>
                <Text style={styles.detailValue}>Réinitialiser</Text>
              </View>
              <Foundation name="arrow-right" size={18} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Glassmorphism Countdown Card */}
      <View style={styles.glassCard}>
        <View style={[styles.gradientOverlay, {
          backgroundColor: `${currentTheme.romantic.secondary}15`
        }]} />

        <View style={styles.cardContent}>
          <View style={styles.countdownHeader}>
            <View style={[styles.iconCircle, {
              backgroundColor: `${currentTheme.romantic.secondary}25`
            }]}>
              <Foundation name="heart" size={20} color={currentTheme.romantic.secondary} />
            </View>
            <Text style={styles.countdownTitle}>Ensemble depuis</Text>
          </View>

          <Text style={[styles.countdownDate, { color: currentTheme.romantic.primary }]}>
            {formatDate(user?.relationshipStartDate)}
          </Text>

          <View style={[styles.countdownDisplay, {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: `${currentTheme.romantic.secondary}30`,
          }]}>
            <Text style={[styles.countdownText, { color: currentTheme.romantic.secondary }]}>
              {formatCountdown()}
            </Text>
          </View>
        </View>
      </View>

      {/* Name Edit Modal */}
      <TextInputModal
        visible={isEditingName}
        title="Modifier le nom"
        message="Entrez votre nouveau nom"
        placeholder="Nom complet"
        initialValue={user?.name || ''}
        onConfirm={handleNameChange}
        onCancel={() => setIsEditingName(false)}
        theme={currentTheme}
      />

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

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  glassCard: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  cardContent: {
    padding: 20,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  photoContainer: {
    position: 'relative',
  },
  photoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3.5,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  userInfo: {
    flex: 1,
    gap: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    marginVertical: 18,
    opacity: 0.6,
  },
  detailsSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  countdownTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  countdownDate: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  countdownDisplay: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  countdownText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});

export default ProfileSection;
