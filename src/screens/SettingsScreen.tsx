import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  Switch,
  ScrollView,
  Modal,
  TextInput,
  ActionSheetIOS,
  Platform,
  Linking,
  Clipboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import PartnerLinkModal from '../components/PartnerLinkModal';
import PartnerLinkService from '../services/PartnerLinkService';
import ProfileSection from '../components/settings/ProfileSection';
import CustomAlert from '../components/common/CustomAlert';
import useCustomAlert from '../hooks/useCustomAlert';
import DatePickerModal from '../components/common/DatePickerModal';
import StorageService from '../services/StorageService';
import NotesService from '../services/NotesService';
import FirebaseAuthService from '../services/FirebaseAuthService';
import BiometricService from '../services/BiometricService';
import FCMService from '../services/FCMService';
import BackgroundDataService from '../services/BackgroundDataService';
import firestore from '@react-native-firebase/firestore';
import DataExportService from '../services/DataExportService';
import ToastService from '../services/ToastService';
import RemoteVibrateService, {
  VibratePattern,
  PRESET_MESSAGES,
  PATTERN_NAMES
} from '../services/RemoteVibrateService';
import CustomInputModal from '../components/common/CustomInputModal';
import InteractiveVibrateModal from '../components/InteractiveVibrateModal';

export const SettingsScreen: React.FC = () => {
  const { user, logoutUser, isDarkTheme, navigateToScreen, updateUserProfile, toggleTheme, currentTheme, mergeGlobalFont } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => createSettingsStyles(currentTheme), [currentTheme]);

  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [tempUserName, setTempUserName] = useState(user?.name || '');
  const [selectedTheme, setSelectedTheme] = useState(isDarkTheme ? 'dark' : 'luxurious');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [showProfilePhoto, setShowProfilePhoto] = useState(user?.showProfilePhoto !== false);
  const [isPartnerLinkModalVisible, setIsPartnerLinkModalVisible] = useState(false);
  const [isPartnerProfileModalVisible, setIsPartnerProfileModalVisible] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{name: string; email: string; photoURL?: string} | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('Biométrie');
  const [isEditingRelationshipDate, setIsEditingRelationshipDate] = useState(false);
  const [isEditingTalkingDate, setIsEditingTalkingDate] = useState(false);
  const [showVibrateMessageModal, setShowVibrateMessageModal] = useState(false);
  const [showVibratePatternModal, setShowVibratePatternModal] = useState(false);
  const [selectedVibrateMessage, setSelectedVibrateMessage] = useState('');
  const [selectedVibratePattern, setSelectedVibratePattern] = useState<VibratePattern>('heartbeat');
  const [showInteractiveVibrateModal, setShowInteractiveVibrateModal] = useState(false);

  // Load partner info when user has a partner (real-time sync)
  React.useEffect(() => {
    if (!user?.partnerId) {
      setPartnerInfo(null);
      return;
    }

    // Set up real-time listener for partner profile changes
    const unsubscribe = firestore()
      .collection('users')
      .doc(user.partnerId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            setPartnerInfo({
              name: data?.name || 'Partenaire',
              email: data?.email || '',
              photoURL: data?.photoURL,
            });
          } else {
            setPartnerInfo(null);
          }
        },
        (error) => {
          console.error('Error listening to partner profile:', error);
        }
      );

    // Cleanup listener on unmount or when partnerId changes
    return () => unsubscribe();
  }, [user?.partnerId]);

  // Check biometric availability on component mount
  React.useEffect(() => {
    const checkBiometric = async () => {
      const { available } = await BiometricService.isBiometricAvailable();
      const enabled = await BiometricService.isBiometricEnabled();
      const typeName = await BiometricService.getBiometricTypeName();

      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
      setBiometricType(typeName);
    };

    checkBiometric();
  }, []);

  // Load user preferences for notifications and auto backup
  React.useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;

      try {
        const userDoc = await firestore().collection('users').doc(user.id).get();
        const userData = userDoc.data();

        if (userData) {
          setNotificationsEnabled(userData.notificationsEnabled ?? true);
          setAutoBackupEnabled(userData.autoBackupEnabled ?? true);
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadPreferences();
  }, [user?.id]);

  // Memoize relationship duration calculation
  const relationshipDuration = useMemo(() => {
    if (!user?.relationshipStartDate) return 'Non défini';

    let startDate = user.relationshipStartDate;

    // Convert to Date if it's not already (could be Firestore Timestamp)
    if (typeof startDate.getTime !== 'function') {
      startDate = new Date(startDate as any);
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const remainingDays = diffDays % 365;

    if (years > 0) {
      return `${years} an${years > 1 ? 's' : ''} et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
    }
    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  }, [user?.relationshipStartDate]);

  // Format date for display
  const formatDateDisplay = useCallback((date?: Date) => {
    if (!date) return 'Non défini';
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('fr-FR', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }, []);

  // Memoized callback functions to prevent recreation
  const handleProfileUpdate = useCallback(async () => {
    if (tempUserName.trim()) {
      try {
        await updateUserProfile({ name: tempUserName });
        showAlert({
          title: 'Profil mis à jour',
          message: `Votre nom a été changé pour: ${tempUserName}`,
          type: 'success',
          buttons: [{ text: 'OK', onPress: () => setIsProfileModalVisible(false) }]
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        showAlert({
          title: 'Erreur',
          message: 'Impossible de mettre à jour le profil',
          type: 'error',
          buttons: [{ text: 'OK' }]
        });
      }
    }
  }, [tempUserName, updateUserProfile, showAlert]);

  const getThemeDisplayName = useCallback((themeType: string) => {
    switch (themeType) {
      case 'dark': return 'Mode sombre';
      case 'luxurious': return 'Mode luxueux';
      case 'rose': return 'Mode rose';
      case 'sunset': return 'Mode coucher de soleil';
      case 'auto': return 'Automatique';
      default: return 'Mode sombre';
    }
  }, []);

  const handleThemeChange = useCallback(() => {
    const options = ['Mode sombre', 'Mode luxueux', 'Annuler'];
    const themeTypes = ['dark', 'luxurious'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
          title: 'Choisir le thème'
        },
        (buttonIndex) => {
          if (buttonIndex >= 0 && buttonIndex < themeTypes.length) {
            const newTheme = themeTypes[buttonIndex];
            setSelectedTheme(newTheme);
            if ((newTheme === 'dark' && !isDarkTheme) || (newTheme === 'luxurious' && isDarkTheme)) {
              toggleTheme();
            }
          }
        }
      );
    } else {
      showAlert({
        title: 'Choisir le thème',
        message: 'Sélectionnez votre thème préféré',
        type: 'info',
        buttons: [
          {
            text: 'Mode sombre',
            onPress: () => {
              setSelectedTheme('dark');
              if (!isDarkTheme) toggleTheme();
            }
          },
          {
            text: 'Mode luxueux',
            onPress: () => {
              setSelectedTheme('luxurious');
              if (isDarkTheme) toggleTheme();
            }
          },
          { text: 'Annuler', style: 'cancel' }
        ]
      });
    }
  }, [isDarkTheme, toggleTheme, showAlert]);

  const handleToggleProfilePhoto = useCallback((value: boolean) => {
    setShowProfilePhoto(value);
    updateUserProfile({ showProfilePhoto: value });
  }, [updateUserProfile]);

  const handleBackgroundChange = useCallback(() => {
    navigateToScreen('backgroundSelector');
  }, [navigateToScreen]);

  const handleDeleteAllData = useCallback(() => {
    showAlert({
      title: '⚠️ Supprimer toutes les données',
      message: 'Cette action supprimera définitivement toutes vos données, photos, messages et paramètres. Cette action est irréversible.',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer tout',
          style: 'destructive',
          onPress: () => {
            showAlert({
              title: 'Confirmation finale',
              message: 'Êtes-vous absolument sûr(e) ? Toutes vos données seront perdues à jamais.',
              type: 'warning',
              buttons: [
                { text: 'Non, garder mes données', style: 'cancel' },
                {
                  text: 'Oui, tout supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Delete all data
                      if (user?.id) {
                        // Delete all notes from the user
                        const allNotes = await NotesService.getNotes(user.id);
                        for (const note of allNotes) {
                          await NotesService.deleteNote(user.id, note.id);
                        }
                      }

                      // Clear local storage
                      await StorageService.clearUserData();

                      // Sign out from Firebase
                      await FirebaseAuthService.signOut();

                      showAlert({
                        title: 'Données supprimées',
                        message: 'Toutes vos données ont été supprimées.',
                        type: 'success',
                        buttons: [{ text: 'OK', onPress: logoutUser }]
                      });
                    } catch (error) {
                      console.error('Error deleting all data:', error);
                      showAlert({
                        title: 'Erreur',
                        message: 'Une erreur s\'est produite lors de la suppression des données.',
                        type: 'error',
                        buttons: [{ text: 'OK' }]
                      });
                    }
                  }
                }
              ]
            });
          }
        }
      ]
    });
  }, [user, logoutUser, showAlert]);

  const handleBiometricToggle = useCallback(async (newValue: boolean) => {
    if (newValue) {
      // Enable biometrics - need password for secure storage
      showAlert({
        title: `Activer ${biometricType}`,
        message: `Pour activer ${biometricType}, vous devrez vous reconnecter avec votre mot de passe. Voulez-vous continuer ?`,
        type: 'info',
        buttons: [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se reconnecter',
            onPress: async () => {
              // Logout and navigate to sign in
              await logoutUser();
              showAlert({
                title: 'Reconnexion requise',
                message: `Connectez-vous à nouveau pour activer ${biometricType}. L'activation vous sera proposée après connexion.`,
                type: 'info',
                buttons: [{ text: 'OK' }]
              });
            }
          }
        ]
      });
    } else {
      // Disable biometrics
      showAlert({
        title: 'Désactiver la biométrie',
        message: `Êtes-vous sûr de vouloir désactiver ${biometricType} ?`,
        type: 'warning',
        buttons: [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Désactiver',
            style: 'destructive',
            onPress: async () => {
              try {
                await BiometricService.disableBiometric();
                setBiometricEnabled(false);
                showAlert({
                  title: 'Désactivé',
                  message: `${biometricType} a été désactivé`,
                  type: 'success',
                  buttons: [{ text: 'OK' }]
                });
              } catch (error: any) {
                showAlert({
                  title: 'Erreur',
                  message: error.message || 'Impossible de désactiver la biométrie',
                  type: 'error',
                  buttons: [{ text: 'OK' }]
                });
              }
            }
          }
        ]
      });
    }
  }, [biometricType, user, showAlert]);

  const handleNotificationToggle = useCallback(async (newValue: boolean) => {
    try {
      if (newValue) {
        // Enable notifications - request permission
        const hasPermission = await FCMService.hasPermission();

        if (!hasPermission) {
          const granted = await FCMService.requestPermission();

          if (!granted) {
            showAlert({
              title: 'Permission refusée',
              message: 'Vous devez autoriser les notifications dans les paramètres de votre appareil',
              type: 'warning',
              buttons: [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Ouvrir paramètres',
                  onPress: () => {
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      Linking.openSettings();
                    }
                  }
                }
              ]
            });
            return;
          }
        }

        // Register FCM token
        await FCMService.saveFCMToken();

        // Save preference to Firestore
        if (user?.id) {
          await firestore().collection('users').doc(user.id).update({
            notificationsEnabled: true,
            notificationsEnabledAt: firestore.FieldValue.serverTimestamp(),
          });
        }

        setNotificationsEnabled(true);
        showAlert({
          title: 'Notifications activées',
          message: 'Vous recevrez maintenant les notifications push',
          type: 'success',
          buttons: [{ text: 'OK' }]
        });
      } else {
        // Disable notifications
        showAlert({
          title: 'Désactiver les notifications',
          message: 'Êtes-vous sûr de vouloir désactiver les notifications push ?',
          type: 'warning',
          buttons: [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Désactiver',
              style: 'destructive',
              onPress: async () => {
                try {
                  // Delete FCM token
                  await FCMService.deleteFCMToken();

                  // Save preference to Firestore
                  if (user?.id) {
                    await firestore().collection('users').doc(user.id).update({
                      notificationsEnabled: false,
                      notificationsDisabledAt: firestore.FieldValue.serverTimestamp(),
                    });
                  }

                  setNotificationsEnabled(false);
                  showAlert({
                    title: 'Notifications désactivées',
                    message: 'Vous ne recevrez plus de notifications push',
                    type: 'info',
                    buttons: [{ text: 'OK' }]
                  });
                } catch (error) {
                  console.error('Error disabling notifications:', error);
                  showAlert({
                    title: 'Erreur',
                    message: 'Impossible de désactiver les notifications',
                    type: 'error',
                    buttons: [{ text: 'OK' }]
                  });
                }
              }
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showAlert({
        title: 'Erreur',
        message: 'Une erreur s\'est produite',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  }, [user, showAlert]);

  const handleAutoBackupToggle = useCallback(async (newValue: boolean) => {
    try {
      // Save preference to Firestore
      if (user?.id) {
        await firestore().collection('users').doc(user.id).update({
          autoBackupEnabled: newValue,
          autoBackupUpdatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      setAutoBackupEnabled(newValue);

      if (newValue) {
        // Trigger immediate backup
        showAlert({
          title: 'Sauvegarde en cours',
          message: 'Synchronisation de vos données...',
          type: 'info',
          buttons: []
        });

        try {
          await BackgroundDataService.registerDevice();

          showAlert({
            title: 'Sauvegarde automatique activée',
            message: 'Vos données seront automatiquement sauvegardées dans le cloud',
            type: 'success',
            buttons: [{ text: 'OK' }]
          });
        } catch (error) {
          console.error('Error during backup:', error);
          showAlert({
            title: 'Sauvegarde activée',
            message: 'La sauvegarde automatique est activée mais la synchronisation initiale a échoué',
            type: 'warning',
            buttons: [{ text: 'OK' }]
          });
        }
      } else {
        showAlert({
          title: 'Sauvegarde automatique désactivée',
          message: 'Vos données ne seront plus automatiquement sauvegardées',
          type: 'info',
          buttons: [{ text: 'OK' }]
        });
      }
    } catch (error) {
      console.error('Error toggling auto backup:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de modifier la sauvegarde automatique',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  }, [user, showAlert]);

  const handleRelationshipDateChange = useCallback(async (newDate: Date) => {
    try {
      setIsEditingRelationshipDate(false);

      // Update user profile
      await updateUserProfile({ relationshipStartDate: newDate });

      // If user has a partner, sync the date
      if (user?.partnerId && user?.id) {
        await firestore().collection('users').doc(user.partnerId).update({
          relationshipStartDate: newDate,
        });
      }

      showAlert({
        title: 'Date mise à jour',
        message: user?.partnerId
          ? 'La date "Ensemble depuis" a été synchronisée avec votre partenaire'
          : 'La date "Ensemble depuis" a été mise à jour',
        type: 'success',
        buttons: [{ text: 'OK' }]
      });
    } catch (error) {
      console.error('Error updating relationship date:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de mettre à jour la date',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  }, [user, updateUserProfile, showAlert]);

  const handleTalkingDateChange = useCallback(async (newDate: Date) => {
    try {
      setIsEditingTalkingDate(false);

      // Update user profile
      await updateUserProfile({ talkingStartDate: newDate });

      // If user has a partner, sync the date
      if (user?.partnerId && user?.id) {
        await firestore().collection('users').doc(user.partnerId).update({
          talkingStartDate: newDate,
        });
      }

      showAlert({
        title: 'Date mise à jour',
        message: user?.partnerId
          ? 'La date "Temps depuis qu\'on se parle" a été synchronisée avec votre partenaire'
          : 'La date "Temps depuis qu\'on se parle" a été mise à jour',
        type: 'success',
        buttons: [{ text: 'OK' }]
      });
    } catch (error) {
      console.error('Error updating talking date:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de mettre à jour la date',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  }, [user, updateUserProfile, showAlert]);

  const handleLogout = useCallback(() => {
    showAlert({
      title: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: logoutUser },
      ]
    });
  }, [logoutUser, showAlert]);

  const handleUnlinkPartner = useCallback(async () => {
    if (!user?.partnerId) return;

    showAlert({
      title: 'Délier le partenaire',
      message: `Êtes-vous sûr de vouloir vous délier de ${partnerInfo?.name || 'votre partenaire'} ? Vos données partagées seront conservées mais ne seront plus synchronisées.`,
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Délier',
          style: 'destructive',
          onPress: async () => {
            try {
              await PartnerLinkService.unlinkPartner(user.id);
              await updateUserProfile({ partnerId: undefined, relationshipStartDate: undefined });
              showAlert({
                title: 'Succès',
                message: 'Vous avez été délié de votre partenaire',
                type: 'success',
                buttons: [{ text: 'OK' }]
              });
            } catch (error: any) {
              showAlert({
                title: 'Erreur',
                message: error.message || 'Impossible de délier le partenaire',
                type: 'error',
                buttons: [{ text: 'OK' }]
              });
            }
          },
        },
      ]
    });
  }, [user, partnerInfo, updateUserProfile, showAlert]);

  const handleViewPartnerProfile = useCallback(() => {
    if (partnerInfo) {
      setIsPartnerProfileModalVisible(true);
    }
  }, [partnerInfo]);

  // Navigation callbacks
  const navigateToEditProfile = useCallback(() => navigateToScreen('editProfile'), [navigateToScreen]);
  const navigateToSoundsSettings = useCallback(() => navigateToScreen('soundsSettings'), [navigateToScreen]);
  const navigateToPinCode = useCallback(() => navigateToScreen('pinCode'), [navigateToScreen]);
  const navigateToPrivacySettings = useCallback(() => navigateToScreen('privacySettings'), [navigateToScreen]);
  const navigateToHelpCenter = useCallback(() => navigateToScreen('helpCenter'), [navigateToScreen]);

  // Synchronization handler
  const handleSynchronization = useCallback(async () => {
    try {
      showAlert({
        title: 'Synchronisation',
        message: 'Synchronisation en cours...',
        type: 'info',
        buttons: []
      });

      // Register/update device in Firestore
      await BackgroundDataService.registerDevice();

      // If user has a partner, show sync with partner info
      if (user?.partnerId) {
        showAlert({
          title: 'Synchronisation terminée',
          message: 'Vos données ont été synchronisées avec le cloud et votre partenaire',
          type: 'success',
          buttons: [{ text: 'OK' }]
        });
      } else {
        showAlert({
          title: 'Synchronisation terminée',
          message: 'Vos données ont été synchronisées avec le cloud',
          type: 'success',
          buttons: [{ text: 'OK' }]
        });
      }
    } catch (error) {
      console.error('Error during synchronization:', error);
      showAlert({
        title: 'Erreur de synchronisation',
        message: 'Impossible de synchroniser vos données. Vérifiez votre connexion Internet',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  }, [user, showAlert]);

  // Contact handler
  const handleContact = useCallback(() => {
    const email = 'support@itsyou-app.com';
    const subject = 'Support ItsYou';
    const body = `\n\nVersion: 1.0.0\nDevice: ${Platform.OS}\nUser ID: ${user?.id || 'N/A'}`;

    showAlert({
      title: 'Nous contacter',
      message: email,
      type: 'info',
      buttons: [
        {
          text: 'Copier l\'email',
          onPress: () => {
            Clipboard.setString(email);
            showAlert({
              title: 'Email copié',
              message: 'L\'adresse email a été copiée dans le presse-papiers',
              type: 'success',
              buttons: [{ text: 'OK' }]
            });
          }
        },
        {
          text: 'Ouvrir client email',
          onPress: () => {
            const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            Linking.openURL(mailto).catch((error) => {
              console.error('Error opening email client:', error);
              showAlert({
                title: 'Erreur',
                message: 'Impossible d\'ouvrir le client email. L\'adresse a été copiée.',
                type: 'error',
                buttons: [{ text: 'OK' }]
              });
              Clipboard.setString(email);
            });
          }
        },
        { text: 'Annuler', style: 'cancel' }
      ]
    });
  }, [user, showAlert]);

  // About handler
  const handleAbout = useCallback(() => {
    showAlert({
      title: 'Ok, sa w vin chèche la?😂',
      message: 'M pa konn kisa w vin cheche la, men chak fwa w vin la, raple w nan ki pwen m renmen w.🤍🌹',
      type: 'info',
      buttons: [{ text: 'OK' }]
    });
  }, [showAlert]);

  // Reset password handler
  const handleResetPassword = useCallback(() => {
    console.log('🔐 handleResetPassword called for user:', user?.email);

    if (!user?.email) {
      console.error('❌ No email found for user');
      showAlert({
        title: 'Erreur',
        message: 'Aucune adresse email associée à votre compte',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
      return;
    }

    showAlert({
      title: 'Réinitialiser le mot de passe',
      message: `Un email de réinitialisation sera envoyé à ${user.email}`,
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel', onPress: () => console.log('❌ Password reset cancelled') },
        {
          text: 'Envoyer',
          onPress: async () => {
            console.log('📧 User confirmed, sending reset email to:', user.email);
            try {
              await FirebaseAuthService.resetPassword(user.email);
              console.log('✅ Reset email sent successfully');
              showAlert({
                title: 'Email envoyé',
                message: 'Un email de réinitialisation a été envoyé à votre adresse email. Vérifiez votre boîte de réception et vos spams.',
                type: 'success',
                buttons: [{ text: 'OK' }]
              });
            } catch (error: any) {
              console.error('❌ Error sending reset email:', error);
              showAlert({
                title: 'Erreur',
                message: error.message || 'Impossible d\'envoyer l\'email de réinitialisation',
                type: 'error',
                buttons: [{ text: 'OK' }]
              });
            }
          }
        }
      ]
    });
  }, [user, showAlert]);

  // Vibration handler
  const handleSendVibration = useCallback(() => {
    if (!user?.partnerId) {
      showAlert({
        title: 'Partenaire requis',
        message: 'Vous devez être lié à un partenaire pour envoyer des vibrations',
        type: 'warning',
        buttons: [{ text: 'OK' }]
      });
      return;
    }
    setShowVibrateMessageModal(true);
  }, [user, showAlert]);

  const handleVibrateMessageConfirm = useCallback((message: string) => {
    setSelectedVibrateMessage(message);
    setShowVibrateMessageModal(false);
    setShowVibratePatternModal(true);
  }, []);

  const handleVibratePatternSelect = useCallback(async (pattern: VibratePattern) => {
    try {
      setShowVibratePatternModal(false);

      ToastService.info('Envoi de la vibration...', 2000);

      await RemoteVibrateService.sendVibrate(selectedVibrateMessage, pattern);

      showAlert({
        title: '💕 Vibration envoyée',
        message: `Votre partenaire va recevoir: "${selectedVibrateMessage}" avec ${PATTERN_NAMES[pattern]}`,
        type: 'success',
        buttons: [{ text: 'OK' }]
      });

      ToastService.success('Vibration envoyée avec succès!', 3000);
    } catch (error) {
      console.error('Error sending vibration:', error);

      let errorTitle = '❌ Erreur';
      let errorMessage = 'Impossible d\'envoyer la vibration';

      if (error instanceof Error) {
        switch (error.message) {
          case 'NO_INTERNET':
            errorTitle = '📡 Pas de connexion';
            errorMessage = 'Vous n\'êtes pas connecté à Internet. Veuillez vérifier votre connexion et réessayer.';
            break;
          case 'NOT_AUTHENTICATED':
            errorTitle = '🔐 Non authentifié';
            errorMessage = 'Vous devez être connecté pour envoyer une vibration. Veuillez vous reconnecter.';
            break;
          case 'NO_PARTNER':
            errorTitle = '💔 Aucun partenaire';
            errorMessage = 'Vous n\'avez pas de partenaire lié. Veuillez d\'abord lier votre compte avec celui de votre partenaire.';
            break;
          case 'PARTNER_NOT_FOUND':
            errorTitle = '👤 Partenaire introuvable';
            errorMessage = 'Le compte de votre partenaire est introuvable. Il a peut-être supprimé son compte.';
            break;
          default:
            errorMessage = error.message;
        }
      }

      showAlert({
        title: errorTitle,
        message: errorMessage,
        type: 'error',
        buttons: [{ text: 'OK' }]
      });

      ToastService.error(errorTitle, 3000);
    }
  }, [selectedVibrateMessage, showAlert]);

  // Export functions
  const handleExportData = useCallback(async () => {
    try {
      // Get export stats first
      const stats = await DataExportService.getExportStats();

      showAlert({
        title: 'Exporter mes données',
        message: `Vos données:\n• ${stats.totalNotes} notes\n• ${stats.totalPhotos} photos\n• ${stats.totalMusic} chansons\n• ${stats.totalMessages} messages\nTaille estimée: ${stats.estimatedSize}\n\nChoisissez le format:`,
        type: 'info',
        buttons: [
          {
            text: 'JSON Complet',
            onPress: async () => {
              try {
                ToastService.info('Export en cours...', 2000);

                const filePath = await DataExportService.exportAsJSON();

                showAlert({
                  title: 'Export réussi',
                  message: `Vos données ont été exportées:\n\n${filePath}\n\nFichier sauvegardé dans Téléchargements`,
                  type: 'success',
                  buttons: [{ text: 'OK' }]
                });

                ToastService.success('Export terminé avec succès!', 3000);
              } catch (error) {
                console.error('Export error:', error);
                showAlert({
                  title: 'Erreur d\'export',
                  message: error instanceof Error ? error.message : 'Impossible d\'exporter les données',
                  type: 'error',
                  buttons: [{ text: 'OK' }]
                });
              }
            }
          },
          {
            text: 'JSON Compact',
            onPress: async () => {
              try {
                ToastService.info('Export en cours...', 2000);

                const filePath = await DataExportService.exportAsCompactJSON();

                showAlert({
                  title: 'Export réussi',
                  message: `Version compacte exportée:\n\n${filePath}\n\nFichier sauvegardé dans Téléchargements`,
                  type: 'success',
                  buttons: [{ text: 'OK' }]
                });

                ToastService.success('Export compact terminé!', 3000);
              } catch (error) {
                console.error('Export error:', error);
                showAlert({
                  title: 'Erreur d\'export',
                  message: error instanceof Error ? error.message : 'Impossible d\'exporter les données',
                  type: 'error',
                  buttons: [{ text: 'OK' }]
                });
              }
            }
          },
          {
            text: 'Dossier Complet (avec photos)',
            onPress: async () => {
              try {
                ToastService.info('Création du dossier d\'export...', 3000);

                const folderPath = await DataExportService.exportAsZIP();

                showAlert({
                  title: 'Export réussi',
                  message: `Dossier complet créé:\n\n${folderPath}\n\nContient:\n• data.json\n• README.txt\n• photos/ (jusqu'à 50 photos)\n\nDossier dans Téléchargements`,
                  type: 'success',
                  buttons: [{ text: 'OK' }]
                });

                ToastService.success('Export complet terminé!', 3000);
              } catch (error) {
                console.error('Export error:', error);
                showAlert({
                  title: 'Erreur d\'export',
                  message: error instanceof Error ? error.message : 'Impossible de créer le dossier d\'export',
                  type: 'error',
                  buttons: [{ text: 'OK' }]
                });
              }
            }
          },
          { text: 'Annuler', style: 'cancel' }
        ]
      });
    } catch (error) {
      console.error('Error getting export stats:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de récupérer les statistiques',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  }, [showAlert]);

  // Memoize settings items to prevent recreation
  const settingsItems = useMemo(() => [
    {
      section: 'Compte couple',
      items: user?.partnerId ? [
        {
          icon: 'torsos-all',
          title: 'Partenaire lié',
          subtitle: partnerInfo ? `${partnerInfo.name} (${partnerInfo.email})` : 'Chargement...',
          type: 'navigate',
          onPress: handleViewPartnerProfile,
        },
        {
          icon: 'clock',
          title: 'Depuis',
          subtitle: relationshipDuration,
          type: 'info',
        },
        {
          icon: 'x',
          title: 'Délier le partenaire',
          subtitle: 'Rompre la connexion avec votre partenaire',
          type: 'navigate',
          onPress: handleUnlinkPartner,
        },
      ] : [
        {
          icon: 'link',
          title: 'Lier avec un partenaire',
          subtitle: 'Connectez-vous avec votre partenaire pour partager',
          type: 'navigate',
          onPress: () => setIsPartnerLinkModalVisible(true),
        },
      ],
    },
    {
      section: 'Fonctionnalités couple',
      items: [
        {
          icon: 'heart',
          title: 'Envoyer une vibration',
          subtitle: user?.partnerId
            ? 'Faire vibrer le téléphone de votre partenaire'
            : 'Liez-vous avec un partenaire pour utiliser cette fonction',
          type: 'navigate',
          onPress: handleSendVibration,
        },
        {
          icon: 'burst',
          title: 'Mode Vibration Interactif',
          subtitle: user?.partnerId
            ? 'Faire vibrer en temps réel avec des boutons d\'intensité'
            : 'Liez-vous avec un partenaire pour utiliser cette fonction',
          type: 'navigate',
          onPress: () => {
            if (!user?.partnerId) {
              showAlert({
                title: '💔 Aucun partenaire',
                message: 'Vous devez être lié avec un partenaire pour utiliser cette fonctionnalité.',
                type: 'error',
              });
              return;
            }
            setShowInteractiveVibrateModal(true);
          },
        },
      ],
    },
    {
      section: 'Dates importantes',
      items: [
        {
          icon: 'heart',
          title: 'Ensemble depuis',
          subtitle: formatDateDisplay(user?.relationshipStartDate),
          type: 'navigate',
          onPress: () => setIsEditingRelationshipDate(true),
        },
        {
          icon: 'calendar',
          title: 'Temps depuis qu\'on se parle',
          subtitle: formatDateDisplay(user?.talkingStartDate),
          type: 'navigate',
          onPress: () => setIsEditingTalkingDate(true),
        },
      ],
    },
    {
      section: 'Apparence',
      items: [
        {
          icon: 'paint-bucket',
          title: 'Thème de l\'application',
          subtitle: getThemeDisplayName(selectedTheme),
          type: 'navigate',
          onPress: handleThemeChange,
        },
        {
          icon: 'photo',
          title: 'Photo de profil',
          subtitle: 'Changer votre photo de profil',
          type: 'navigate',
          onPress: navigateToEditProfile,
        },
        {
          icon: 'eye',
          title: 'Afficher photo sur l\'accueil',
          subtitle: showProfilePhoto ? 'Photo visible sur l\'écran d\'accueil' : 'Photo masquée sur l\'écran d\'accueil',
          type: 'switch',
          value: showProfilePhoto,
          onPress: handleToggleProfilePhoto,
        },
        {
          icon: 'background-color',
          title: 'Arrière-plan d\'accueil',
          subtitle: 'Personnaliser l\'arrière-plan',
          type: 'navigate',
          onPress: handleBackgroundChange,
        },
        {
          icon: 'text-color',
          title: 'Message du jour',
          subtitle: 'Personnaliser le conteneur de message',
          type: 'navigate',
          onPress: () => navigateToScreen('messageCustomization'),
        },
        {
          icon: 'text-color',
          title: 'Police globale',
          subtitle: 'Changer la police de l\'application',
          type: 'navigate',
          onPress: () => navigateToScreen('globalFontSettings'),
        },
        {
          icon: 'photo',
          title: 'Artwork du lecteur',
          subtitle: 'Image pour l\'écran de verrouillage',
          type: 'navigate',
          onPress: () => navigateToScreen('musicPlayerArtwork'),
        },
        {
          icon: 'layout',
          title: 'Disposition de l\'écran d\'accueil',
          subtitle: 'Repositionner les éléments',
          type: 'navigate',
          onPress: () => navigateToScreen('homeLayoutCustomization'),
        },
      ]
    },
    {
      section: 'Notifications',
      items: [
        {
          icon: 'sound',
          title: 'Notifications push',
          subtitle: 'Recevoir les notifications',
          type: 'switch',
          value: notificationsEnabled,
          onPress: handleNotificationToggle,
        },
        {
          icon: 'volume',
          title: 'Sons et vibrations',
          subtitle: 'Personnaliser les sons',
          type: 'navigate',
          onPress: navigateToSoundsSettings,
        },
      ]
    },
    {
      section: 'Sécurité',
      items: [
        {
          icon: 'key',
          title: 'Code de verrouillage',
          subtitle: 'Définir un code PIN',
          type: 'navigate',
          onPress: navigateToPinCode,
        },
        {
          icon: 'unlock',
          title: 'Réinitialiser mot de passe',
          subtitle: 'Recevoir un email de réinitialisation',
          type: 'navigate',
          onPress: handleResetPassword,
        },
        ...(biometricAvailable ? [{
          icon: biometricType === 'Face ID' ? 'torso' : 'shield',
          title: biometricType,
          subtitle: biometricEnabled ? `${biometricType} activé` : `Activer ${biometricType}`,
          type: 'switch',
          value: biometricEnabled,
          onPress: handleBiometricToggle,
        }] : []),
      ]
    },
    {
      section: 'Confidentialité',
      items: [
        {
          icon: 'lock',
          title: 'Paramètres de confidentialité',
          subtitle: 'Gérer vos données personnelles',
          type: 'navigate',
          onPress: navigateToPrivacySettings,
        },
      ]
    },
    {
      section: 'Données',
      items: [
        {
          icon: 'database',
          title: 'Sauvegarde automatique',
          subtitle: 'Synchroniser avec le cloud',
          type: 'switch',
          value: autoBackupEnabled,
          onPress: handleAutoBackupToggle,
        },
        {
          icon: 'upload-cloud',
          title: 'Exporter mes données',
          subtitle: 'Télécharger une copie',
          type: 'navigate',
          onPress: handleExportData,
        },
        {
          icon: 'refresh',
          title: 'Synchroniser',
          subtitle: 'Synchroniser avec votre partenaire',
          type: 'navigate',
          onPress: handleSynchronization,
        },
      ]
    },
    {
      section: 'Support',
      items: [
        {
          icon: 'mail',
          title: 'Nous contacter',
          subtitle: 'Support technique',
          type: 'navigate',
          onPress: handleContact,
        },
        {
          icon: 'info',
          title: 'Centre d\'aide',
          subtitle: 'FAQ et tutoriels',
          type: 'navigate',
          onPress: navigateToHelpCenter,
        },
        {
          icon: 'heart',
          title: 'À propos',
          subtitle: 'Version et informations',
          type: 'navigate',
          onPress: handleAbout,
        },
      ]
    },
    {
      section: 'Zone dangereuse',
      items: [
        {
          icon: 'trash',
          title: 'Supprimer toutes les données',
          subtitle: 'Action irréversible',
          type: 'danger',
          onPress: handleDeleteAllData,
        },
      ]
    },
  ], [
    user?.partnerId,
    user?.relationshipStartDate,
    user?.talkingStartDate,
    partnerInfo,
    relationshipDuration,
    handleUnlinkPartner,
    handleViewPartnerProfile,
    handleSendVibration,
    formatDateDisplay,
    selectedTheme,
    showProfilePhoto,
    notificationsEnabled,
    biometricAvailable,
    biometricEnabled,
    biometricType,
    autoBackupEnabled,
    getThemeDisplayName,
    handleThemeChange,
    navigateToEditProfile,
    handleToggleProfilePhoto,
    handleBackgroundChange,
    handleNotificationToggle,
    navigateToSoundsSettings,
    handleBiometricToggle,
    handleResetPassword,
    navigateToPinCode,
    navigateToPrivacySettings,
    handleAutoBackupToggle,
    handleExportData,
    handleSynchronization,
    handleContact,
    navigateToHelpCenter,
    handleAbout,
    handleDeleteAllData,
    navigateToScreen
  ]);

  // Memoized render function for setting items
  const renderSettingItem = useCallback((item: any, index: number, isDanger = false) => (
    <TouchableOpacity
      key={index}
      style={styles.settingItem}
      onPress={item.onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.settingContainer,
          isDanger ? styles.dangerContainer : styles.normalContainer
        ]}
      >
        <View style={styles.settingContent}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, isDanger && styles.dangerIconContainer]}>
              <Foundation name={item.icon} size={24} color={isDanger ? "#FF453A" : "#FF69B4"} />
            </View>
            <View style={styles.textContainer}>
              <Text style={mergeGlobalFont([styles.settingTitle, isDanger && styles.dangerTitle], 16)}>{item.title}</Text>
              <Text style={mergeGlobalFont(styles.settingSubtitle, 13)}>{item.subtitle}</Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            {item.type === 'switch' ? (
              <Switch
                value={item.value}
                onValueChange={item.onPress}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#FF69B4' }}
                thumbColor="#FFFFFF"
              />
            ) : (
              <Foundation name="arrow-right" size={20} color="rgba(255,255,255,0.6)" />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ), [styles, mergeGlobalFont]);

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
            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              scrollEventThrottle={16}
              // Add these performance props
              windowSize={10}
              maxToRenderPerBatch={5}
              initialNumToRender={10}
              updateCellsBatchingPeriod={50}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={mergeGlobalFont(styles.title, 28)}>Paramètres</Text>
                <Text style={mergeGlobalFont(styles.subtitle, 14)}>Personnalisez votre expérience</Text>
              </View>

            {/* Profile Section */}
            <ProfileSection />

            {/* Settings Items */}
            <View style={styles.settingsContainer}>
              {settingsItems.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.settingsSection}>
                  <Text style={mergeGlobalFont(styles.sectionTitle, 14)}>{section.section}</Text>
                  {section.items.map((item, itemIndex) =>
                    renderSettingItem(item, itemIndex, section.section === 'Zone dangereuse')
                  )}
                </View>
              ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <View style={styles.logoutContainer}>
                <Foundation name="arrow-left" size={24} color="#FF453A" />
                <Text style={mergeGlobalFont(styles.logoutText, 16)}>Se déconnecter</Text>
              </View>
            </TouchableOpacity>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Profile Edit Modal */}
      <Modal
        visible={isProfileModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.textInput}
                value={tempUserName}
                onChangeText={setTempUserName}
                placeholder="Votre nom"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <Text style={styles.emailDisplay}>{user?.email || 'Non défini'}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Relation depuis</Text>
              <Text style={styles.emailDisplay}>{relationshipDuration}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setTempUserName(user?.name || '');
                  setIsProfileModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleProfileUpdate}
              >
                <Text style={styles.saveButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Partner Link Modal */}
      <PartnerLinkModal
        visible={isPartnerLinkModalVisible}
        onClose={() => setIsPartnerLinkModalVisible(false)}
        onSuccess={() => {
          // Partner link successful - no need to do anything as the useEffect will reload partner info
          setIsPartnerLinkModalVisible(false);
        }}
      />

      {/* Partner Profile Modal */}
      <Modal
        visible={isPartnerProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPartnerProfileModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.partnerProfileOverlay}>
          <View style={styles.partnerProfileModal}>
            <View style={styles.partnerProfileHeader}>
              <Text style={mergeGlobalFont(styles.partnerProfileTitle, 20)}>
                Profil du partenaire
              </Text>
              <TouchableOpacity
                onPress={() => setIsPartnerProfileModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Foundation name="x" size={24} color={currentTheme.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.partnerProfileContent}>
              {/* Profile Photo */}
              <View style={styles.partnerPhotoContainer}>
                {partnerInfo?.photoURL ? (
                  <Image
                    source={{ uri: partnerInfo.photoURL }}
                    style={styles.partnerPhoto}
                  />
                ) : (
                  <View style={styles.partnerPhotoPlaceholder}>
                    <Foundation name="torso" size={60} color={currentTheme.text.secondary} />
                  </View>
                )}
              </View>

              {/* Partner Info */}
              <View style={styles.partnerInfoRow}>
                <Foundation name="torso" size={20} color={currentTheme.romantic.primary} />
                <View style={styles.partnerInfoText}>
                  <Text style={mergeGlobalFont(styles.partnerInfoLabel, 12)}>Nom</Text>
                  <Text style={mergeGlobalFont(styles.partnerInfoValue, 16)}>
                    {partnerInfo?.name || 'Non défini'}
                  </Text>
                </View>
              </View>

              <View style={styles.partnerInfoRow}>
                <Foundation name="mail" size={20} color={currentTheme.romantic.primary} />
                <View style={styles.partnerInfoText}>
                  <Text style={mergeGlobalFont(styles.partnerInfoLabel, 12)}>Email</Text>
                  <Text style={mergeGlobalFont(styles.partnerInfoValue, 16)}>
                    {partnerInfo?.email || 'Non défini'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.partnerProfileCloseButton}
              onPress={() => setIsPartnerProfileModalVisible(false)}
            >
              <Text style={mergeGlobalFont(styles.partnerProfileCloseButtonText, 16)}>
                Fermer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {/* Date Picker Modals */}
      <DatePickerModal
        visible={isEditingRelationshipDate}
        title="Ensemble depuis"
        message={user?.partnerId ? "Cette date sera synchronisée avec votre partenaire" : undefined}
        initialDate={user?.relationshipStartDate || new Date()}
        onConfirm={handleRelationshipDateChange}
        onCancel={() => setIsEditingRelationshipDate(false)}
        theme={currentTheme}
      />

      <DatePickerModal
        visible={isEditingTalkingDate}
        title="Temps depuis qu'on se parle"
        message={user?.partnerId ? "Cette date sera synchronisée avec votre partenaire" : undefined}
        initialDate={user?.talkingStartDate || new Date()}
        onConfirm={handleTalkingDateChange}
        onCancel={() => setIsEditingTalkingDate(false)}
        theme={currentTheme}
      />

      {/* Vibrate Message Selection Modal */}
      <CustomInputModal
        visible={showVibrateMessageModal}
        title="💕 Envoyer une vibration"
        message="Choisissez un message pour votre partenaire"
        placeholder="Votre message personnalisé..."
        maxLength={100}
        buttons={[
          { text: 'Annuler', style: 'cancel', onPress: () => setShowVibrateMessageModal(false) },
          ...PRESET_MESSAGES.map(msg => ({
            text: `${msg.emoji} ${msg.text}`,
            style: 'default' as const,
            onPress: () => handleVibrateMessageConfirm(msg.text),
          })),
          {
            text: 'Message personnalisé',
            style: 'default' as const,
            icon: 'pencil',
            onPress: (customMessage?: string) => {
              if (customMessage && customMessage.trim()) {
                handleVibrateMessageConfirm(customMessage);
              }
            }
          },
        ]}
        onClose={() => setShowVibrateMessageModal(false)}
        theme={currentTheme}
        icon="heart"
        iconColor="#FF69B4"
      />

      {/* Vibrate Pattern Selection Modal */}
      <Modal
        visible={showVibratePatternModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowVibratePatternModal(false)}
      >
        <TouchableOpacity
          style={styles.vibrateModalOverlay}
          activeOpacity={1}
          onPress={() => setShowVibratePatternModal(false)}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={15}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.7)"
          />
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.vibrateModalContent}>
              <Text style={styles.vibrateModalTitle}>Choisir le type de vibration</Text>
              <Text style={styles.vibrateModalSubtitle}>Message: "{selectedVibrateMessage}"</Text>

              <ScrollView
                style={styles.vibratePatternScrollView}
                contentContainerStyle={styles.vibratePatternScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {Object.entries(PATTERN_NAMES).map(([key, name]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.vibratePatternOption}
                    onPress={() => handleVibratePatternSelect(key as VibratePattern)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.vibratePatternName}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.vibrateCancelButton}
                onPress={() => setShowVibratePatternModal(false)}
              >
                <Text style={styles.vibrateCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Interactive Vibrate Modal */}
      <InteractiveVibrateModal
        visible={showInteractiveVibrateModal}
        onClose={() => setShowInteractiveVibrateModal(false)}
        partnerName={partnerInfo?.name}
      />
    </View>
  );
};

// Move styles outside component to prevent recreation
const createSettingsStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  backgroundImage: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  adaptiveOverlay: {
    flex: 1,
    backgroundColor: theme.background.overlay,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  userCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.3)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 105, 180, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 105, 180, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  userEmail: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.3,
  },
  relationshipDuration: {
    fontSize: 13,
    color: 'rgba(255,105,180,1)',
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(255, 105, 180, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userBadge: {
    fontSize: 12,
    color: 'rgba(255,215,0,1)',
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  settingsContainer: {
    paddingHorizontal: 20,
  },
  settingItem: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  settingContainer: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.4)',
    borderRadius: 18,
  },
  normalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 105, 180, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  settingSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  settingRight: {
    marginLeft: 10,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 18,
    overflow: 'hidden',
  },
  logoutContainer: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 69, 58, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 69, 58, 0.25)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF453A',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 200,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 105, 180, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  emailDisplay: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 105, 180, 0.8)',
    borderWidth: 1,
    borderColor: '#FF69B4',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsSection: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 105, 180, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    opacity: 0.9,
  },
  dangerContainer: {
    borderColor: 'rgba(255, 69, 58, 0.4)',
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
  },
  dangerIconContainer: {
    backgroundColor: 'rgba(255, 69, 58, 0.3)',
    shadowColor: '#FF453A',
  },
  dangerTitle: {
    color: '#FF453A',
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  patternScrollView: {
    maxHeight: 240,
    width: '100%',
  },
  patternOption: {
    backgroundColor: 'rgba(255, 105, 180, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.4)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 6,
    alignItems: 'center',
  },
  patternName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  partnerProfileOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  partnerProfileModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(40, 40, 50, 0.95)',
    borderRadius: 24,
    padding: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 105, 180, 0.5)',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  partnerProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  partnerProfileTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 105, 180, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerProfileContent: {
    marginBottom: 30,
  },
  partnerPhotoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  partnerPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255, 105, 180, 0.6)',
  },
  partnerPhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 3,
    borderColor: 'rgba(255, 105, 180, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  partnerInfoText: {
    marginLeft: 16,
    flex: 1,
  },
  partnerInfoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partnerInfoValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  partnerProfileCloseButton: {
    width: '100%',
    backgroundColor: 'rgba(255, 105, 180, 0.9)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#FF69B4',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  partnerProfileCloseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Vibrate Pattern Modal Styles
  vibrateModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  vibrateModalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(30, 30, 40, 0.97)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.4)',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  vibrateModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  vibrateModalSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 105, 180, 0.9)',
    textAlign: 'center',
    marginBottom: 14,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  vibratePatternScrollView: {
    maxHeight: 300,
    width: '100%',
  },
  vibratePatternScrollContent: {
    paddingBottom: 4,
    gap: 0,
  },
  vibratePatternOption: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 105, 180, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255, 105, 180, 0.65)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  vibratePatternName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  vibrateCancelButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 46,
  },
  vibrateCancelButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: 0.4,
  },
});

export default SettingsScreen;