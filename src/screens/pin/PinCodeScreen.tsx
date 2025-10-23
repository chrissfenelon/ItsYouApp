import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  Vibration,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import StorageService from '../../services/StorageService';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

interface PinCodeScreenProps {
  mode?: 'setup' | 'change' | 'verify';
  onVerified?: () => void;
  navigation?: any;
}

export const PinCodeScreen: React.FC<PinCodeScreenProps> = ({ mode: propMode, onVerified, navigation }) => {
  const { navigateToScreen, currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [mode, setMode] = useState<'setup' | 'change' | 'verify'>(propMode || 'setup');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [firstPin, setFirstPin] = useState(''); // Store the first PIN entry
  const [step, setStep] = useState<'enter' | 'confirm' | 'verify_old'>('enter');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('Biométrie');
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Prevent back button from bypassing lock screen in verify mode
  useEffect(() => {
    if (mode === 'verify') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Block back button in verify mode - user must authenticate
        return true;
      });

      return () => backHandler.remove();
    }
  }, [mode]);

  // Prevent navigation gesture on iOS in verify mode
  useEffect(() => {
    if (mode === 'verify' && navigation) {
      navigation.setOptions({
        gestureEnabled: false,
      });
    }
  }, [mode, navigation]);

  // Auto-detect mode if not provided and set initial step
  useEffect(() => {
    const detectMode = async () => {
      if (!propMode) {
        const pinExists = await StorageService.isPinEnabled();
        // If PIN exists and no mode is specified, we want to verify, not change
        const detectedMode = pinExists ? 'verify' : 'setup';
        setMode(detectedMode);
        // For setup mode, start with enter step (default)
        // For verify mode, start with enter step (default)
      } else if (propMode === 'change') {
        // If explicitly set to change mode, verify old PIN first
        setStep('verify_old');
      }
    };
    detectMode();
  }, [propMode]);

  // Check and try biometric authentication on mount if in verify mode
  useEffect(() => {
    const tryBiometric = async () => {
      if (mode !== 'verify') return;

      // Check if biometric is available and enabled
      const BiometricService = (await import('../../services/BiometricService')).default;
      const { available } = await BiometricService.isBiometricAvailable();
      const enabled = await BiometricService.isBiometricEnabled();
      const typeName = await BiometricService.getBiometricTypeName();

      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
      setBiometricType(typeName);

      if (available && enabled) {
        console.log('🔐 Biometric available, prompting user...');

        // Small delay to avoid UI conflicts
        setTimeout(async () => {
          const result = await BiometricService.authenticate('Déverrouillez ItsYou');

          if (result.success) {
            console.log('✅ Biometric authentication successful');
            setIsUnlocked(true);

            // Wait a bit before navigating
            setTimeout(() => {
              // Use navigation.replace to prevent going back to lock screen
              if (navigation) {
                console.log('📱 Using navigation.replace from PIN screen');
                navigation.replace('main');
              } else if (onVerified) {
                onVerified();
              } else {
                navigateToScreen('main');
              }
            }, 300);
          } else {
            console.log('❌ Biometric authentication failed, showing PIN');
          }
        }, 500);
      }
    };

    tryBiometric();
  }, [mode, onVerified, navigateToScreen]);

  const maxAttempts = 5;
  const lockoutDuration = 30; // seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockoutTime > 0) {
      interval = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockoutTime]);

  const handleNumberPress = (number: string) => {
    if (isLocked) return;

    // Vibrate on key press (light haptic feedback)
    try {
      Vibration.vibrate(50);
    } catch (e) {
      // Vibration not supported
    }

    if (pin.length < 4) {
      const newPin = pin + number;
      setPin(newPin);

      if (newPin.length === 4) {
        setTimeout(() => {
          if (step === 'verify_old') {
            // Verifying old PIN in change mode
            handlePinComplete(newPin);
          } else if (step === 'enter') {
            if (mode === 'setup') {
              setFirstPin(newPin); // Save the first PIN
              setStep('confirm');
              setPin('');
            } else {
              handlePinComplete(newPin);
            }
          } else {
            setConfirmPin(newPin);
            handlePinComplete(newPin);
          }
        }, 100);
      }
    }
  };

  const handlePinComplete = async (enteredPin: string) => {
    if (mode === 'setup') {
      if (step === 'confirm') {
        if (firstPin === enteredPin) {
          try {
            await StorageService.savePinCode(firstPin);
            showAlert({
              title: '🔒 Code PIN configuré',
              message: 'Votre code PIN a été configuré avec succès ! L\'application est maintenant protégée.',
              buttons: [{ text: 'OK', onPress: () => navigateToScreen('settings') }],
              type: 'success',
            });
          } catch (error) {
            showAlert({
              title: 'Erreur',
              message: 'Impossible de sauvegarder le code PIN. Veuillez réessayer.',
              buttons: [{ text: 'OK' }],
              type: 'error',
            });
          }
        } else {
          Vibration.vibrate(500);
          showAlert({
            title: 'Erreur',
            message: 'Les codes PIN ne correspondent pas. Veuillez réessayer.',
            buttons: [{ text: 'OK', onPress: resetPin }],
            type: 'error',
          });
        }
      }
    } else if (mode === 'verify') {
      const isValid = await StorageService.verifyPinCode(enteredPin);
      if (isValid) {
        console.log('✅ PIN verification successful');
        setIsUnlocked(true);

        // Wait a bit before navigating
        setTimeout(() => {
          // Use navigation.replace to prevent going back to lock screen
          if (navigation) {
            console.log('📱 Using navigation.replace after PIN verify');
            navigation.replace('main');
          } else if (onVerified) {
            onVerified();
          } else {
            navigateToScreen('main');
          }
        }, 300);
      } else {
        handleFailedAttempt();
      }
    } else if (mode === 'change') {
      if (step === 'verify_old') {
        // First verify the old PIN
        const isValid = await StorageService.verifyPinCode(enteredPin);
        if (isValid) {
          // Old PIN is correct, now ask for new PIN
          setStep('enter');
          setPin('');
        } else {
          Vibration.vibrate(500);
          showAlert({
            title: 'Code incorrect',
            message: 'Le code PIN actuel est incorrect. Veuillez réessayer.',
            buttons: [{ text: 'OK', onPress: () => setPin('') }],
            type: 'error',
          });
        }
      } else if (step === 'confirm') {
        if (firstPin === enteredPin) {
          try {
            await StorageService.changePinCode(firstPin);
            showAlert({
              title: 'Code PIN modifié',
              message: 'Votre code PIN a été modifié avec succès !',
              buttons: [{ text: 'OK', onPress: () => navigateToScreen('settings') }],
              type: 'success',
            });
          } catch (error) {
            showAlert({
              title: 'Erreur',
              message: 'Impossible de modifier le code PIN. Veuillez réessayer.',
              buttons: [{ text: 'OK' }],
              type: 'error',
            });
          }
        } else {
          Vibration.vibrate(500);
          showAlert({
            title: 'Erreur',
            message: 'Les codes PIN ne correspondent pas. Veuillez réessayer.',
            buttons: [{ text: 'OK', onPress: resetPin }],
            type: 'error',
          });
        }
      } else if (step === 'enter') {
        // Entering new PIN
        setFirstPin(enteredPin);
        setStep('confirm');
        setPin('');
      }
    }
  };

  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setPin('');
    Vibration.vibrate([100, 100, 100]);

    if (newAttempts >= maxAttempts) {
      setIsLocked(true);
      setLockoutTime(lockoutDuration);
      showAlert({
        title: 'Trop de tentatives',
        message: `Accès bloqué pendant ${lockoutDuration} secondes.`,
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    } else {
      showAlert({
        title: 'Code incorrect',
        message: `Tentative ${newAttempts}/${maxAttempts}. ${maxAttempts - newAttempts} tentatives restantes.`,
        buttons: [{ text: 'OK' }],
        type: 'warning',
      });
    }
  };

  const handleDeletePress = () => {
    if (pin.length > 0) {
      // Vibrate on delete
      try {
        Vibration.vibrate(50);
      } catch (e) {
        // Vibration not supported
      }
      setPin(pin.slice(0, -1));
    }
  };

  const resetPin = () => {
    setPin('');
    setConfirmPin('');
    setFirstPin('');
    // Reset to initial step based on mode
    if (mode === 'change') {
      setStep('verify_old');
    } else {
      setStep('enter');
    }
  };

  const handleResetPin = () => {
    showAlert({
      title: '⚠️ Réinitialiser le code PIN',
      message: 'Cette action supprimera définitivement votre code PIN actuel. Vous devrez en créer un nouveau.',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            showAlert({
              title: 'Confirmation',
              message: 'Êtes-vous absolument sûr(e) de vouloir supprimer votre code PIN ?',
              buttons: [
                { text: 'Non, garder le PIN', style: 'cancel' },
                {
                  text: 'Oui, supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await StorageService.removePinCode();
                      showAlert({
                        title: 'PIN supprimé',
                        message: 'Votre code PIN a été supprimé. L\'application n\'est plus protégée.',
                        buttons: [{ text: 'OK', onPress: () => navigateToScreen('settings') }],
                        type: 'success',
                      });
                    } catch (error) {
                      showAlert({
                        title: 'Erreur',
                        message: 'Impossible de supprimer le code PIN. Veuillez réessayer.',
                        buttons: [{ text: 'OK' }],
                        type: 'error',
                      });
                    }
                  }
                }
              ],
              type: 'warning',
            });
          }
        }
      ],
      type: 'warning',
    });
  };

  const handleBiometricLogin = async () => {
    try {
      const BiometricService = (await import('../../services/BiometricService')).default;
      const result = await BiometricService.authenticate('Déverrouillez ItsYou');

      if (result.success) {
        console.log('✅ Biometric authentication successful (manual button)');
        setIsUnlocked(true);

        // Wait a bit before navigating
        setTimeout(() => {
          // Use navigation.replace to prevent going back to lock screen
          if (navigation) {
            console.log('📱 Using navigation.replace from manual biometric button');
            navigation.replace('main');
          } else if (onVerified) {
            onVerified();
          } else {
            navigateToScreen('main');
          }
        }, 300);
      } else {
        console.log('❌ Biometric authentication failed');
      }
    } catch (error) {
      console.error('Error during biometric login:', error);
    }
  };

  const getTitle = () => {
    if (mode === 'setup') {
      return step === 'enter' ? 'Créer un code PIN' : 'Confirmer le code PIN';
    } else if (mode === 'verify') {
      return '🔒 Application Verrouillée';
    } else if (mode === 'change') {
      if (step === 'verify_old') {
        return 'Code PIN actuel';
      } else if (step === 'enter') {
        return 'Nouveau code PIN';
      } else {
        return 'Confirmer le nouveau code';
      }
    } else {
      return 'Code PIN';
    }
  };

  const getSubtitle = () => {
    if (isLocked) {
      return `⏳ Bloqué pendant ${lockoutTime} secondes`;
    }
    if (mode === 'setup') {
      return step === 'enter'
        ? 'Choisissez un code à 4 chiffres'
        : 'Confirmez votre code PIN';
    } else if (mode === 'verify') {
      return attempts > 0
        ? `⚠️ ${maxAttempts - attempts} tentative${maxAttempts - attempts > 1 ? 's' : ''} restante${maxAttempts - attempts > 1 ? 's' : ''}`
        : 'Entrez votre code PIN pour déverrouiller';
    } else if (mode === 'change') {
      if (step === 'verify_old') {
        return 'Entrez votre code PIN actuel';
      } else if (step === 'enter') {
        return 'Choisissez un nouveau code à 4 chiffres';
      } else {
        return 'Confirmez votre nouveau code PIN';
      }
    } else {
      return '';
    }
  };

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[...Array(4)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < pin.length && styles.pinDotFilled
            ]}
          />
        ))}
      </View>
    );
  };

  // Don't render anything if unlocked in verify mode (prevents flash)
  if (isUnlocked && mode === 'verify') {
    console.log('🔓 Already unlocked in verify mode, rendering null');
    return null;
  }

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete']
    ];

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberRow}>
            {row.map((item, itemIndex) => {
              if (item === '') {
                return <View key={itemIndex} style={styles.numberButton} />;
              }

              return (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.numberButton,
                    isLocked && styles.numberButtonDisabled
                  ]}
                  onPress={() => {
                    if (item === 'delete') {
                      handleDeletePress();
                    } else {
                      handleNumberPress(item);
                    }
                  }}
                  activeOpacity={0.7}
                  disabled={isLocked}
                >
                  <LinearGradient
                    colors={
                      item === 'delete'
                        ? ['rgba(255, 69, 58, 0.3)', 'rgba(255, 69, 58, 0.1)']
                        : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                    }
                    style={styles.numberButtonGradient}
                  >
                    {item === 'delete' ? (
                      <Foundation name="x" size={24} color="#FF453A" />
                    ) : (
                      <Text style={styles.numberButtonText}>{item}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={require('../../assets/images/default-background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Header - Only show back button in setup/change mode */}
          {mode !== 'verify' && (
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigateToScreen('settings')}
                activeOpacity={0.8}
              >
                <Foundation name="arrow-left" size={24} color="#FF69B4" />
              </TouchableOpacity>
            </View>
          )}

          {/* Lock Icon for verify mode */}
          {mode === 'verify' && (
            <View style={styles.lockHeader}>
              <View style={styles.lockIconContainer}>
                <Foundation name="lock" size={48} color="#FF69B4" />
              </View>
              <Text style={styles.appName}>ItsYou</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {/* Title and PIN dots */}
            <View style={styles.topSection}>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={[
                styles.subtitle,
                isLocked && styles.subtitleError,
                attempts > 0 && styles.subtitleWarning
              ]}>
                {getSubtitle()}
              </Text>

              {renderPinDots()}

              {isLocked && (
                <View style={styles.lockoutContainer}>
                  <LinearGradient
                    colors={['rgba(255, 69, 58, 0.3)', 'rgba(255, 69, 58, 0.1)']}
                    style={styles.lockoutCard}
                  >
                    <Foundation name="lock" size={32} color="#FF453A" />
                    <Text style={styles.lockoutText}>
                      Accès temporairement bloqué
                    </Text>
                    <Text style={styles.lockoutTimer}>
                      {Math.floor(lockoutTime / 60)}:{(lockoutTime % 60).toString().padStart(2, '0')}
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* Number pad */}
            <View style={styles.bottomSection}>
              {renderNumberPad()}

              {/* Additional options */}
              <View style={styles.optionsContainer}>
                {/* Biometric button in verify mode */}
                {mode === 'verify' && biometricAvailable && biometricEnabled && !isLocked && (
                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricLogin}
                    activeOpacity={0.7}
                  >
                    <Foundation
                      name={biometricType === 'Face ID' ? 'torso' : 'shield'}
                      size={24}
                      color="#FF69B4"
                    />
                    <Text style={styles.biometricButtonText}>
                      Utiliser {biometricType}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Recommencer button for setup/change modes */}
                {(mode === 'setup' || mode === 'change') && step === 'confirm' && (
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={resetPin}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.optionButtonText}>Recommencer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
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
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 105, 180, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockHeader: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  lockIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 105, 180, 0.6)',
    marginBottom: 20,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 105, 180, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 0.3,
  },
  subtitleError: {
    color: '#FF453A',
  },
  subtitleWarning: {
    color: '#FFD60A',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#FF69B4',
    borderColor: '#FF69B4',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  lockoutContainer: {
    marginTop: 20,
    width: '100%',
  },
  lockoutCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 69, 58, 0.4)',
  },
  lockoutText: {
    fontSize: 16,
    color: '#FF453A',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  lockoutTimer: {
    fontSize: 24,
    color: '#FF453A',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  bottomSection: {
    paddingBottom: 60,
  },
  numberPad: {
    alignItems: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  numberButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    overflow: 'hidden',
  },
  numberButtonDisabled: {
    opacity: 0.3,
  },
  numberButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 37.5,
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  optionsContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  optionButtonText: {
    fontSize: 16,
    color: '#FF69B4',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  resetButton: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.4)',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#FF453A',
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 105, 180, 0.2)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.4)',
    gap: 12,
    marginBottom: 10,
  },
  biometricButtonText: {
    fontSize: 16,
    color: '#FF69B4',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default PinCodeScreen;