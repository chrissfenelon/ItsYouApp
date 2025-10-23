import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Clipboard,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import PartnerLinkService from '../services/PartnerLinkService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PartnerLinkModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PartnerLinkModal: React.FC<PartnerLinkModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user, currentTheme, updateUserProfile } = useApp();
  const [mode, setMode] = useState<'choose' | 'generate' | 'enter' | 'email'>('choose');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [enteredEmail, setEnteredEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGenerateCode = async () => {
    if (!user) {
      setError('Vous devez être connecté pour générer un code');
      return;
    }

    // Vérifier que l'email est bien chargé
    if (!user.email || user.email.trim() === '') {
      setError('Email non chargé. Veuillez fermer et rouvrir l\'application, puis réessayez.');
      console.error('User email missing:', { id: user.id, name: user.name, email: user.email });
      return;
    }

    console.log('Current user data:', { id: user.id, name: user.name, email: user.email });

    setLoading(true);
    setError('');
    try {
      const code = await PartnerLinkService.createLinkCode(
        user.id,
        user.name,
        user.email
      );
      setGeneratedCode(code);
      setMode('generate');
    } catch (error: any) {
      setError(error.message || 'Impossible de générer le code');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(generatedCode);
    // Could add a toast notification here
  };

  const handleUseCode = async () => {
    if (!user || !enteredCode.trim()) {
      setError('Veuillez entrer un code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await PartnerLinkService.useLinkCode(
        enteredCode.trim().toUpperCase(),
        user.id
      );

      // Update user profile with partner ID
      await updateUserProfile({
        partnerId: result.partnerId,
        relationshipStartDate: new Date(),
      });

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      setError(error.message || 'Code invalide');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkByEmail = async () => {
    if (!user || !enteredEmail.trim()) {
      setError('Veuillez entrer une adresse email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await PartnerLinkService.linkByEmail(
        user.id,
        enteredEmail.trim()
      );

      // Update user profile with partner ID
      await updateUserProfile({
        partnerId: result.partnerId,
        relationshipStartDate: new Date(),
      });

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      setError(error.message || 'Email invalide');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode('choose');
    setGeneratedCode('');
    setEnteredCode('');
    setEnteredEmail('');
    setError('');
    onClose();
  };

  const renderChooseMode = () => (
    <View style={styles.content}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: currentTheme.romantic.primary + '30' }]}>
        <Foundation name="link" size={32} color={currentTheme.romantic.primary} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Lier avec un partenaire</Text>

      {/* Description */}
      <Text style={styles.description}>
        Choisissez une option pour vous connecter avec votre partenaire
      </Text>

      {/* Generate Code Button */}
      <TouchableOpacity
        style={[
          styles.optionButton,
          {
            backgroundColor: currentTheme.romantic.primary + '30',
            borderColor: currentTheme.romantic.primary + '60'
          }
        ]}
        onPress={handleGenerateCode}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={currentTheme.romantic.primary} />
        ) : (
          <>
            <Foundation name="page-add" size={24} color={currentTheme.romantic.primary} />
            <Text style={[styles.optionButtonText, { color: currentTheme.romantic.primary }]}>
              Générer un code
            </Text>
            <Text style={styles.optionButtonSubtext}>
              Créez un code à partager avec votre partenaire
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Enter Code Button */}
      <TouchableOpacity
        style={[
          styles.optionButton,
          {
            backgroundColor: currentTheme.romantic.secondary + '30',
            borderColor: currentTheme.romantic.secondary + '60'
          }
        ]}
        onPress={() => setMode('enter')}
        activeOpacity={0.7}
      >
        <Foundation name="page-edit" size={24} color={currentTheme.romantic.secondary} />
        <Text style={[styles.optionButtonText, { color: currentTheme.romantic.secondary }]}>
          Entrer un code
        </Text>
        <Text style={styles.optionButtonSubtext}>
          Saisissez le code de votre partenaire
        </Text>
      </TouchableOpacity>

      {/* Link by Email Button */}
      <TouchableOpacity
        style={[
          styles.optionButton,
          {
            backgroundColor: currentTheme.romantic.accent + '30',
            borderColor: currentTheme.romantic.accent + '60'
          }
        ]}
        onPress={() => setMode('email')}
        activeOpacity={0.7}
      >
        <Foundation name="mail" size={24} color={currentTheme.romantic.accent} />
        <Text style={[styles.optionButtonText, { color: currentTheme.romantic.accent }]}>
          Lier par email
        </Text>
        <Text style={styles.optionButtonSubtext}>
          Entrez l'email de votre partenaire
        </Text>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGenerateMode = () => (
    <View style={styles.content}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: currentTheme.romantic.primary + '30' }]}>
        <Foundation name="ticket" size={32} color={currentTheme.romantic.primary} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Votre code de liaison</Text>

      {/* Description */}
      <Text style={styles.description}>
        Partagez ce code avec votre partenaire.{'\n'}Il expire dans 24 heures.
      </Text>

      {/* Code Display */}
      <View style={[styles.codeContainer, { borderColor: currentTheme.romantic.primary + '60' }]}>
        <Text style={[styles.code, { color: currentTheme.romantic.primary }]}>
          {generatedCode}
        </Text>
      </View>

      {/* Copy Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: currentTheme.romantic.primary + '40',
            borderColor: currentTheme.romantic.primary + '70'
          }
        ]}
        onPress={handleCopyCode}
        activeOpacity={0.7}
      >
        <Foundation name="page-copy" size={20} color={currentTheme.romantic.primary} />
        <Text style={[styles.primaryButtonText, { color: currentTheme.romantic.primary }]}>
          Copier le code
        </Text>
      </TouchableOpacity>

      {/* Close Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEnterMode = () => (
    <View style={styles.content}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: currentTheme.romantic.secondary + '30' }]}>
        <Foundation name="page-edit" size={32} color={currentTheme.romantic.secondary} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Entrer le code</Text>

      {/* Description */}
      <Text style={styles.description}>
        Saisissez le code généré par votre partenaire
      </Text>

      {/* Error Message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Foundation name="alert" size={18} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Text Input */}
      <TextInput
        style={[
          styles.input,
          { borderColor: error ? '#FF6B6B' : currentTheme.romantic.secondary + '60' }
        ]}
        placeholder="Entrez le code (6 caractères)"
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        value={enteredCode}
        onChangeText={(text) => {
          setEnteredCode(text.toUpperCase());
          setError('');
        }}
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
      />

      {/* Validate Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: currentTheme.romantic.secondary + '40',
            borderColor: currentTheme.romantic.secondary + '70'
          },
          (!enteredCode.trim() || loading) && styles.buttonDisabled,
        ]}
        onPress={handleUseCode}
        disabled={!enteredCode.trim() || loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={currentTheme.romantic.secondary} />
        ) : (
          <>
            <Foundation name="check" size={20} color={currentTheme.romantic.secondary} />
            <Text style={[styles.primaryButtonText, { color: currentTheme.romantic.secondary }]}>
              Valider
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          setMode('choose');
          setEnteredCode('');
          setError('');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmailMode = () => (
    <View style={styles.content}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: currentTheme.romantic.accent + '30' }]}>
        <Foundation name="mail" size={32} color={currentTheme.romantic.accent} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Lier par email</Text>

      {/* Description */}
      <Text style={styles.description}>
        Entrez l'adresse email de votre partenaire
      </Text>

      {/* Error Message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Foundation name="alert" size={18} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Email Input */}
      <TextInput
        style={[
          styles.input,
          { borderColor: error ? '#FF6B6B' : currentTheme.romantic.accent + '60' }
        ]}
        placeholder="exemple@email.com"
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        value={enteredEmail}
        onChangeText={(text) => {
          setEnteredEmail(text);
          setError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />

      {/* Validate Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: currentTheme.romantic.accent + '40',
            borderColor: currentTheme.romantic.accent + '70'
          },
          (!enteredEmail.trim() || loading) && styles.buttonDisabled,
        ]}
        onPress={handleLinkByEmail}
        disabled={!enteredEmail.trim() || loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={currentTheme.romantic.accent} />
        ) : (
          <>
            <Foundation name="check" size={20} color={currentTheme.romantic.accent} />
            <Text style={[styles.primaryButtonText, { color: currentTheme.romantic.accent }]}>
              Valider
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          setMode('choose');
          setEnteredEmail('');
          setError('');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Background Blur */}
        <BlurView
          style={styles.blurOverlay}
          blurType="dark"
          blurAmount={15}
          reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.8)"
        />

        {/* Modal Card */}
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {mode === 'choose' && renderChooseMode()}
            {mode === 'generate' && renderGenerateMode()}
            {mode === 'enter' && renderEnterMode()}
            {mode === 'email' && renderEmailMode()}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: SCREEN_WIDTH - 80,
    maxWidth: 400,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 18,
  },
  modalContent: {
    backgroundColor: 'rgba(25, 25, 35, 0.95)',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  title: {
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.4,
    color: '#FFFFFF',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  optionButton: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    gap: 8,
  },
  optionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  optionButtonSubtext: {
    fontSize: 13,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  codeContainer: {
    width: '100%',
    backgroundColor: 'rgba(40, 40, 50, 0.8)',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
  },
  code: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 8,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(40, 40, 50, 0.8)',
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 20,
    fontWeight: '700',
  },
  errorContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    marginBottom: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cancelButton: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default PartnerLinkModal;
