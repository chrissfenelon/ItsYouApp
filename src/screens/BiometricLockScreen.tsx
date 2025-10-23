import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  Animated,
  BackHandler,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import BiometricService from '../services/BiometricService';
import FeedbackService from '../services/FeedbackService';

interface BiometricLockScreenProps {
  onUnlocked?: () => void;
  navigation?: any;
}

export const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ onUnlocked, navigation }) => {
  const { navigateToScreen, currentTheme } = useApp();
  const [biometricType, setBiometricType] = useState('Empreinte digitale');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const pulseAnim = new Animated.Value(1);

  // Prevent back button from bypassing lock screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Block back button - user must authenticate
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Prevent navigation gesture on iOS
  useEffect(() => {
    if (navigation) {
      navigation.setOptions({
        gestureEnabled: false,
      });
    }
  }, [navigation]);

  useEffect(() => {
    const initBiometric = async () => {
      const typeName = await BiometricService.getBiometricTypeName();
      setBiometricType(typeName);

      // Check if PIN is enabled
      const StorageService = (await import('../services/StorageService')).default;
      const pinEnabled = await StorageService.isPinEnabled();
      setIsPinEnabled(pinEnabled);

      // Auto-trigger biometric authentication on mount
      setTimeout(() => {
        handleBiometricAuth();
      }, 500);
    };

    initBiometric();
  }, []);

  // Pulse animation for fingerprint icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleBiometricAuth = async () => {
    if (isAuthenticating || isUnlocked) {
      console.log('⏭️ Already authenticating or unlocked, skipping...');
      return;
    }

    console.log('🔐 Starting biometric authentication...');
    setIsAuthenticating(true);
    setError('');

    try {
      const result = await BiometricService.authenticate(`Déverrouillez avec ${biometricType}`);

      if (result.success) {
        console.log('✅ Biometric authentication successful');
        setIsUnlocked(true);
        FeedbackService.success();

        // Wait a bit before navigating to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use navigation.replace to prevent going back to lock screen
        console.log('📱 Navigating to main screen...');
        if (navigation) {
          console.log('📱 Using navigation.replace');
          navigation.replace('main');
        } else if (onUnlocked) {
          console.log('📱 Calling onUnlocked callback');
          onUnlocked();
        } else {
          console.log('📱 Using navigateToScreen');
          navigateToScreen('main');
        }
        console.log('✅ Navigation completed');
      } else {
        console.log('❌ Biometric authentication failed:', result.error);
        setError(result.error || 'Authentification échouée');
        FeedbackService.error();
        setIsAuthenticating(false);
      }
    } catch (err) {
      console.error('❌ Error during biometric auth:', err);
      setError('Une erreur est survenue');
      FeedbackService.error();
      setIsAuthenticating(false);
    }
  };

  const handleUsePIN = () => {
    navigateToScreen('pinCode', { mode: 'verify', onVerified: onUnlocked });
  };

  // Don't render anything if unlocked (prevents flash)
  if (isUnlocked) {
    console.log('🔓 Already unlocked, rendering null');
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={require('../assets/images/default-background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Lock Header */}
          <View style={styles.lockHeader}>
            <Animated.View style={[styles.lockIconContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Foundation
                name={biometricType === 'Face ID' ? 'torso' : 'lock'}
                size={64}
                color="#FF69B4"
              />
            </Animated.View>
            <Text style={styles.appName}>ItsYou</Text>
            <Text style={styles.lockSubtitle}>Application Verrouillée</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.biometricContainer}>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricAuth}
                disabled={isAuthenticating}
                activeOpacity={0.7}
              >
                <View style={styles.biometricIconContainer}>
                  <Foundation
                    name={biometricType === 'Face ID' ? 'torso' : 'shield'}
                    size={80}
                    color="#FF69B4"
                  />
                </View>
                <Text style={styles.biometricTitle}>
                  {isAuthenticating ? 'Authentification...' : `Utiliser ${biometricType}`}
                </Text>
                <Text style={styles.biometricSubtitle}>
                  Touchez pour déverrouiller
                </Text>
              </TouchableOpacity>

              {error && (
                <View style={styles.errorContainer}>
                  <Foundation name="alert" size={20} color="#FF453A" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>

            {/* PIN Fallback Button - Only show if PIN is configured */}
            {isPinEnabled && (
              <TouchableOpacity
                style={styles.pinFallbackButton}
                onPress={handleUsePIN}
                activeOpacity={0.8}
              >
                <Foundation name="key" size={20} color="#FF69B4" />
                <Text style={styles.pinFallbackText}>Utiliser le code PIN</Text>
              </TouchableOpacity>
            )}
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  lockHeader: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 60,
  },
  lockIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 105, 180, 0.6)',
    marginBottom: 24,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 105, 180, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 30,
  },
  biometricContainer: {
    alignItems: 'center',
  },
  biometricButton: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 105, 180, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 105, 180, 0.4)',
    minWidth: 280,
  },
  biometricIconContainer: {
    marginBottom: 20,
  },
  biometricTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  biometricSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.3,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.4)',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF453A',
    fontWeight: '500',
  },
  pinFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  pinFallbackText: {
    fontSize: 16,
    color: '#FF69B4',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default BiometricLockScreen;
