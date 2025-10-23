import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ImageBackground,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Foundation from 'react-native-vector-icons/Foundation';
import { Typography } from '../constants/Typography';
import { CurrentTheme } from '../constants/Themes';
import FeedbackService from '../services/FeedbackService';
import { useApp } from '../context/AppContext';
import FirebaseAuthService from '../services/FirebaseAuthService';
import CustomAlert from '../components/common/CustomAlert';
import useCustomAlert from '../hooks/useCustomAlert';
import BiometricService from '../services/BiometricService';

export const SignInScreen: React.FC = () => {
  const { loginUser, createAccount, navigateToScreen, currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('Biométrie');

  // Animation pour le flou doux du titre
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const titleScale = useRef(new Animated.Value(1)).current;

  // Check biometric availability on component mount
  useEffect(() => {
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

  // Animation de flou doux entrant et sortant
  useEffect(() => {
    const startAnimation = () => {
      // Animation de flou (diminuer l'opacité et légèrement grossir)
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(titleScale, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animation de retour à la normale
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(titleScale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Recommencer l'animation après une pause
          setTimeout(startAnimation, 1500);
        });
      });
    };

    startAnimation();
  }, [titleOpacity, titleScale]);

  // Calcul de la force du mot de passe
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, text: '', color: CurrentTheme.text.muted };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score <= 2) {
      return { score, text: 'Faible', color: '#FF6B6B' };
    } else if (score <= 3) {
      return { score, text: 'Moyen', color: '#FFD93D' };
    } else if (score <= 4) {
      return { score, text: 'Fort', color: '#6BCF7F' };
    } else {
      return { score, text: 'Très fort', color: '#4ECDC4' };
    }
  }, [password]);

  const handleAuth = async () => {
    // Validation pour inscription
    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
        showAlert({
          title: 'Erreur',
          message: 'Veuillez remplir tous les champs',
          type: 'error',
          buttons: [{ text: 'OK' }]
        });
        return;
      }
      if (firstName.trim().length < 2) {
        showAlert({
          title: 'Erreur',
          message: 'Le prénom doit contenir au moins 2 caractères',
          type: 'error',
          buttons: [{ text: 'OK' }]
        });
        return;
      }
      if (lastName.trim().length < 2) {
        showAlert({
          title: 'Erreur',
          message: 'Le nom doit contenir au moins 2 caractères',
          type: 'error',
          buttons: [{ text: 'OK' }]
        });
        return;
      }
      if (password !== confirmPassword) {
        showAlert({
          title: 'Erreur',
          message: 'Les mots de passe ne correspondent pas',
          type: 'error',
          buttons: [{ text: 'OK' }]
        });
        return;
      }
    } else {
      // Validation pour connexion
      if (!email.trim() || !password.trim()) {
        showAlert({
          title: 'Erreur',
          message: 'Veuillez remplir tous les champs',
          type: 'error',
          buttons: [{ text: 'OK' }]
        });
        return;
      }
    }

    try {
      if (isSignUp) {
        // Création de compte avec prénom et nom
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        await createAccount(email, password, fullName);
      } else {
        // Connexion
        await loginUser(email, password);

        // Propose biometric activation if available and not already enabled
        if (biometricAvailable && !biometricEnabled) {
          // Delay the prompt slightly to avoid overlapping with navigation
          setTimeout(() => {
            promptEnableBiometric(email, password);
          }, 500);
        }
      }

      // Play success feedback only after successful authentication
      FeedbackService.loginSuccess();
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de la connexion',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  };

  const handleForgotPassword = () => {
    console.log('🔐 handleForgotPassword called with email:', email);

    if (!email.trim()) {
      console.error('❌ No email provided');
      showAlert({
        title: 'Email requis',
        message: 'Veuillez entrer votre adresse email pour réinitialiser votre mot de passe',
        type: 'warning',
        buttons: [{ text: 'OK' }]
      });
      return;
    }

    showAlert({
      title: 'Réinitialiser le mot de passe',
      message: `Un email de réinitialisation sera envoyé à ${email}`,
      type: 'info',
      buttons: [
        { text: 'Annuler', style: 'cancel', onPress: () => console.log('❌ Password reset cancelled') },
        {
          text: 'Envoyer',
          onPress: async () => {
            console.log('📧 User confirmed, sending reset email to:', email);
            try {
              await FirebaseAuthService.resetPassword(email);
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
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await BiometricService.authenticateAndGetCredentials();

      if (result.success && result.credentials) {
        await loginUser(result.credentials.email, result.credentials.password);
        FeedbackService.loginSuccess();
      } else {
        showAlert({
          title: 'Authentification échouée',
          message: result.error || 'Impossible de vous authentifier',
          type: 'error',
          buttons: [{ text: 'OK' }]
        });
      }
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de l\'authentification biométrique',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  };

  const promptEnableBiometric = async (userEmail: string, userPassword: string) => {
    if (!biometricAvailable) return;

    showAlert({
      title: `Activer ${biometricType}`,
      message: `Voulez-vous activer ${biometricType} pour vous connecter plus rapidement ?`,
      type: 'info',
      buttons: [
        { text: 'Non merci', style: 'cancel' },
        {
          text: 'Activer',
          onPress: async () => {
            const result = await BiometricService.enableBiometric(userEmail, userPassword);
            if (result.success) {
              setBiometricEnabled(true);
              showAlert({
                title: 'Activé',
                message: `${biometricType} activé avec succès`,
                type: 'success',
                buttons: [{ text: 'OK' }]
              });
            } else {
              showAlert({
                title: 'Erreur',
                message: result.error || 'Impossible d\'activer la biométrie',
                type: 'error',
                buttons: [{ text: 'OK' }]
              });
            }
          }
        }
      ]
    });
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Photo d'Orlie en arrière-plan plein écran */}
      <ImageBackground
        source={require('../assets/images/default-background.jpg')}
        style={styles.background}
        imageStyle={styles.photoBackgroundImage}
      >
        {/* Ombres 3D sur les bordures */}
        <View style={styles.topShadow} />
        <View style={styles.bottomShadow} />
        <View style={styles.leftShadow} />
        <View style={styles.rightShadow} />

        {/* Overlay pour améliorer la lisibilité du texte */}
        <View style={styles.textOverlay} />
      </ImageBackground>

      <View style={styles.content}>
          {/* Titre de l'app */}
          <View style={styles.titleContainer}>
            <View style={styles.appNameContainer}>
              <Animated.Text
                style={[
                  styles.appName,
                  {
                    opacity: titleOpacity,
                    transform: [{ scale: titleScale }],
                  }
                ]}
              >
                Bienvenue Madame🤍
              </Animated.Text>
              <Text style={styles.heart} />
            </View>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Créer votre compte couple' : 'Connectez-vous à votre compte'}
            </Text>
          </View>

          {/* Formulaire de connexion */}
          <View style={styles.formContainer}>
            {/* Champs Prénom et Nom - uniquement pour l'inscription */}
            {isSignUp && (
              <>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom"
                    placeholderTextColor={CurrentTheme.text.muted}
                    value={firstName}
                    onChangeText={(text) => setFirstName(text.charAt(0).toUpperCase() + text.slice(1))}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    placeholderTextColor={CurrentTheme.text.muted}
                    value={lastName}
                    onChangeText={(text) => setLastName(text.charAt(0).toUpperCase() + text.slice(1))}
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Adresse email"
                placeholderTextColor={CurrentTheme.text.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mot de passe"
                  placeholderTextColor={CurrentTheme.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Foundation
                    name="eye"
                    size={20}
                    color={showPassword ? CurrentTheme.romantic.primary : CurrentTheme.text.muted}
                  />
                </TouchableOpacity>
              </View>

              {/* Indicateur de force du mot de passe (uniquement lors de la création de compte) */}
              {isSignUp && password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3, 4, 5].map((level) => {
                      const isActive = level <= passwordStrength.score;
                      return (
                        <View
                          key={level}
                          style={[
                            styles.strengthBarSegment,
                            isActive
                              ? { backgroundColor: passwordStrength.color }
                              : styles.strengthBarInactive
                          ]}
                        />
                      );
                    })}
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.text}
                  </Text>
                </View>
              )}
            </View>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor={CurrentTheme.text.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                  >
                    <Foundation
                      name="eye"
                      size={20}
                      color={showConfirmPassword ? CurrentTheme.romantic.primary : CurrentTheme.text.muted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Forgot Password Button - Only visible in login mode */}
            {!isSignUp && (
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotPasswordButton}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Biometric Button - Only visible in login mode if enabled */}
          {!isSignUp && biometricAvailable && biometricEnabled && (
            <View style={styles.biometricContainer}>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                activeOpacity={0.7}
              >
                <Foundation
                  name={biometricType === 'Face ID' ? 'torso' : 'fingerprint'}
                  size={32}
                  color={CurrentTheme.romantic.primary}
                />
                <Text style={styles.biometricText}>
                  Se connecter avec {biometricType}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Boutons */}
          <View style={styles.buttonsContainer}>
            {/* Bouton principal */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAuth}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[CurrentTheme.romantic.primary, CurrentTheme.romantic.secondary]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {isSignUp ? 'Créer mon compte' : 'Se connecter'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>


            {/* Bouton pour basculer entre connexion/inscription */}
            <TouchableOpacity
              onPress={() => {
                FeedbackService.selection();
                setIsSignUp(!isSignUp);
              }}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleButtonText}>
                {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  photoBackgroundImage: {
    opacity: 0.8, // Opacité élevée pour bien voir la photo
    resizeMode: 'cover' as const, // Couvre tout l'écran sans étirement
  },
  // Ombres 3D sur les bordures de l'écran
  topShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    // background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)', // Not supported in React Native
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  leftShadow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  rightShadow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  textOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Very light overlay for better brightness responsiveness
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: {
    ...Typography.styles.largeTitle,
    color: CurrentTheme.text.primary,
    fontWeight: '200',
    fontSize: 24,
    marginRight: 10,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  heart: {
    fontSize: 28,
    textShadowColor: CurrentTheme.romantic.primary,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    ...Typography.styles.title2,
    color: CurrentTheme.text.secondary,
    fontWeight: '400',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: CurrentTheme.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: CurrentTheme.text.primary,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordStrengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBar: {
    flex: 1,
    flexDirection: 'row',
    height: 4,
    marginRight: 12,
    gap: 2,
  },
  strengthBarSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  strengthBarInactive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    ...CurrentTheme.shadows.button,
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    ...Typography.styles.headline,
    color: CurrentTheme.text.primary,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  toggleButton: {
    paddingVertical: 10,
  },
  toggleButtonText: {
    ...Typography.styles.footnote,
    color: CurrentTheme.romantic.tertiary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  forgotPasswordText: {
    ...Typography.styles.footnote,
    color: CurrentTheme.romantic.tertiary,
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  biometricContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 20,
    alignItems: 'center',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
    gap: 12,
  },
  biometricText: {
    ...Typography.styles.body,
    color: CurrentTheme.text.primary,
    fontSize: 15,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default SignInScreen;