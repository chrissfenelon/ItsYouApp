import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  PermissionsAndroid,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Foundation from 'react-native-vector-icons/Foundation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useApp } from '../context/AppContext';
import {
  requestPermission,
  checkPermission,
  requestAndroidAdminPermissions,
  type PermissionType,
} from '../utils/permissionsUtils';
import AdminDataService from '../services/AdminDataService';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface PermissionsScreenProps {
  onComplete?: () => void;
}

interface Permission {
  id: PermissionType | 'notifications' | 'admin' | 'accessibility' | 'notification-listener' | 'device-admin';
  title: string;
  description: string;
  icon: string;
  granted: boolean;
  required: boolean;
  iconType?: 'foundation' | 'material';
}

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onComplete }) => {
  const { navigateToScreen, currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Pour recevoir les notifications d\'invitations aux jeux et rester connecté avec votre partenaire',
      icon: 'bell',
      iconType: 'material',
      granted: false,
      required: false,
    },
    {
      id: 'photo-library',
      title: 'Galerie Photos',
      description: 'Pour sélectionner des photos de profil, tokens de jeu personnalisés et partager des souvenirs',
      icon: 'image',
      iconType: 'material',
      granted: false,
      required: false,
    },
    {
      id: 'camera',
      title: 'Appareil Photo',
      description: 'Pour prendre des photos de profil et capturer des moments avec votre partenaire',
      icon: 'camera',
      iconType: 'foundation',
      granted: false,
      required: false,
    },
    {
      id: 'microphone',
      title: 'Microphone',
      description: 'Pour enregistrer des notes vocales et utiliser la transcription',
      icon: 'microphone',
      iconType: 'material',
      granted: false,
      required: false,
    },
    {
      id: 'media-audio',
      title: 'Bibliothèque Musicale',
      description: 'Pour gérer vos playlists de couple et accéder à votre musique',
      icon: 'music-note',
      iconType: 'material',
      granted: false,
      required: false,
    },
  ]);

  // Function to check all permissions status
  const checkAllPermissions = async () => {
    const updatedPermissions = await Promise.all(
      permissions.map(async (permission) => {
        let granted = false;

        if (permission.id === 'notifications') {
          // Keep current granted state for notifications
          granted = permission.granted;
        } else {
          granted = await checkPermission(permission.id as PermissionType);
        }

        return { ...permission, granted };
      })
    );

    setPermissions(updatedPermissions);

    // Save permissions status
    try {
      await AsyncStorage.setItem('@permissions_status', JSON.stringify(updatedPermissions));
    } catch (error) {
      console.error('Error saving permissions status:', error);
    }
  };

  // Check initial permissions status on mount
  useEffect(() => {
    const loadAndCheckPermissions = async () => {
      try {
        const savedState = await AsyncStorage.getItem('@permissions_status');
        if (savedState) {
          const savedPermissions = JSON.parse(savedState);
          setPermissions(prev =>
            prev.map(p => {
              const saved = savedPermissions.find((s: Permission) => s.id === p.id);
              return saved ? { ...p, granted: saved.granted } : p;
            })
          );
        }
      } catch (error) {
        console.error('Error loading saved permissions:', error);
      }
      await checkAllPermissions();
    };
    loadAndCheckPermissions();
  }, []);

  // Recheck permissions when app returns to foreground (user comes back from settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // User returned to the app, recheck all permissions
        console.log('App became active, rechecking permissions...');
        checkAllPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [permissions]);

  const handleRequestPermission = async (permissionId: string) => {
    let granted = false;

    if (permissionId === 'notifications') {
      // Open notification settings
      showAlert({
        title: 'Permission Notifications',
        message: 'Vous allez être redirigé vers les paramètres de notifications pour activer l\'accès.',
        buttons: [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Ouvrir Paramètres',
            onPress: async () => {
              try {
                await Linking.openSettings();
                setPermissions((prev) =>
                  prev.map((p) => (p.id === permissionId ? { ...p, granted: true } : p))
                );
              } catch (error) {
                console.error('Error opening settings:', error);
              }
            },
          },
        ],
      });
      return;
    } else {
      // Use utility function for other permissions
      granted = await requestPermission(permissionId as PermissionType, true);
    }

    setPermissions((prev) =>
      prev.map((p) => (p.id === permissionId ? { ...p, granted } : p))
    );
  };

  const handleContinue = async () => {
    // Save that permissions have been requested
    await AsyncStorage.setItem('@permissions_requested', 'true');
    await AsyncStorage.setItem('@permissions_status', JSON.stringify(permissions));
    if (onComplete) {
      onComplete();
    } else {
      navigateToScreen('main');
    }
  };

  const handleSkip = async () => {
    // Save that user skipped permissions
    await AsyncStorage.setItem('@permissions_requested', 'true');
    await AsyncStorage.setItem('@permissions_skipped', 'true');
    await AsyncStorage.setItem('@permissions_status', JSON.stringify(permissions));
    if (onComplete) {
      onComplete();
    } else {
      navigateToScreen('main');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Autorisations Recommandées</Text>
          <Text style={styles.subtitle}>
            Ces permissions améliorent votre expérience, mais vous pouvez les configurer plus tard
          </Text>
        </View>

        {/* Permissions List */}
        <View style={styles.permissionsList}>
          {permissions.map((permission) => (
            <View key={permission.id} style={styles.permissionCard}>
              <View style={styles.permissionHeader}>
                <View style={styles.permissionIcon}>
                  {permission.iconType === 'material' ? (
                    <MaterialCommunityIcons name={permission.icon as any} size={24} color="#FF69B4" />
                  ) : (
                    <Foundation name={permission.icon} size={24} color="#FF69B4" />
                  )}
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>{permission.title}</Text>
                  <Text style={styles.permissionDescription}>{permission.description}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.permissionButton,
                  permission.granted && styles.permissionButtonGranted,
                ]}
                onPress={() => handleRequestPermission(permission.id)}
                disabled={permission.granted}
              >
                {permission.granted ? (
                  <View style={styles.buttonContent}>
                    <Foundation name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Accordée</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Demander</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Foundation name="info" size={20} color="#4A90E2" />
          <Text style={styles.infoText}>
            Ces permissions sont nécessaires pour la fonctionnalité de l'application. Vos données
            restent privées et sécurisées gras ak tekonoloji kriptaj 32bit lan.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continuer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Passer pour le moment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    backgroundColor: '#1A1A2E',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    lineHeight: 24,
  },
  permissionsList: {
    marginBottom: 20,
  },
  permissionCard: {
    backgroundColor: '#16213E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.2)',
  },
  permissionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 105, 180, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  requiredBadge: {
    backgroundColor: 'rgba(255, 69, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 0, 0.4)',
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6347',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  permissionButtonGranted: {
    backgroundColor: '#4CAF50',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    marginBottom: 30,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#B0B0B0',
    lineHeight: 20,
    marginLeft: 12,
  },
  actions: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B0B0B0',
  },
  skipButtonText: {
    color: '#B0B0B0',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PermissionsScreen;
