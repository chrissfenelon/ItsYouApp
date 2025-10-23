import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Foundation from 'react-native-vector-icons/Foundation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TextInputModalProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  theme: any;
}

const TextInputModal: React.FC<TextInputModalProps> = ({
  visible,
  title,
  message,
  placeholder,
  initialValue = '',
  onConfirm,
  onCancel,
  theme,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  React.useEffect(() => {
    if (visible) {
      setInputValue(initialValue);
    }
  }, [visible, initialValue]);

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
      setInputValue('');
    }
  };

  const handleCancel = () => {
    onCancel();
    setInputValue('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
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

        {/* Input Card */}
        <View style={styles.inputContainer}>
          <View style={styles.inputContent}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: theme.romantic.primary + '30' }]}>
              <Foundation name="pencil" size={32} color={theme.romantic.primary} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            {message && (
              <Text style={styles.message}>
                {message}
              </Text>
            )}

            {/* Text Input */}
            <TextInput
              style={[styles.textInput, { borderColor: theme.romantic.primary + '60' }]}
              placeholder={placeholder || 'Entrez le texte...'}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
              selectTextOnFocus
            />

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>
                  Annuler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  { backgroundColor: theme.romantic.primary + '40', borderColor: theme.romantic.primary + '70' }
                ]}
                onPress={handleConfirm}
                activeOpacity={0.7}
                disabled={!inputValue.trim()}
              >
                <Text style={[styles.confirmText, { color: theme.romantic.primary }]}>
                  Confirmer
                </Text>
              </TouchableOpacity>
            </View>
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
  inputContainer: {
    width: SCREEN_WIDTH - 80,
    maxWidth: 340,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 18,
  },
  inputContent: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(25, 25, 35, 0.95)',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    width: '100%',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    color: 'rgba(255, 255, 255, 0.85)',
    width: '100%',
  },
  textInput: {
    width: '100%',
    backgroundColor: 'rgba(40, 40, 50, 0.8)',
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  button: {
    flex: 1,
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minHeight: 52,
  },
  confirmButton: {
    backgroundColor: 'rgba(255, 105, 180, 0.22)',
    borderColor: 'rgba(255, 105, 180, 0.65)',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  confirmText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: 0.3,
  },
});

export default TextInputModal;
