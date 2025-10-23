/**
 * CustomInputModal
 *
 * Custom modal with text input following the same design as CustomAlert
 * Used for user input scenarios like dare messages
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Foundation from 'react-native-vector-icons/Foundation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InputButton {
  text: string;
  onPress: (inputValue: string) => void;
  style?: 'default' | 'cancel' | 'destructive';
  icon?: string;
}

interface CustomInputModalProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  buttons: InputButton[];
  onClose: () => void;
  theme: any;
  icon?: string;
  iconColor?: string;
}

const CustomInputModal: React.FC<CustomInputModalProps> = ({
  visible,
  title,
  message,
  placeholder = 'Entrez votre texte...',
  initialValue = '',
  maxLength = 200,
  multiline = true,
  numberOfLines = 3,
  buttons,
  onClose,
  theme,
  icon = 'trophy',
  iconColor = '#FF69B4',
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setInputValue(initialValue);
    }
  }, [visible, initialValue]);

  const handleButtonPress = (button: InputButton) => {
    button.onPress(inputValue);
    onClose();
  };

  const handleCancel = () => {
    setInputValue('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
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
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: iconColor + '25' }]}>
                <Foundation name={icon} size={32} color={iconColor} />
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              {message && <Text style={styles.message}>{message}</Text>}

              {/* Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    multiline && { minHeight: numberOfLines * 24 + 32 },
                  ]}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={placeholder}
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline={multiline}
                  maxLength={maxLength}
                  numberOfLines={numberOfLines}
                  textAlignVertical={multiline ? 'top' : 'center'}
                />
                {maxLength && (
                  <Text style={styles.charCount}>
                    {inputValue.length}/{maxLength}
                  </Text>
                )}
              </View>

              {/* Buttons */}
              <ScrollView
                style={styles.buttonsScrollView}
                contentContainerStyle={styles.buttonsContainer}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
              >
                {buttons.map((button, index) => {
                  const isDestructive = button.style === 'destructive';
                  const isCancel = button.style === 'cancel';
                  const isDefault = !isDestructive && !isCancel;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        isDestructive && styles.destructiveButton,
                        isCancel && styles.cancelButton,
                        isDefault && styles.defaultButton,
                      ]}
                      onPress={() =>
                        isCancel ? handleCancel() : handleButtonPress(button)
                      }
                      activeOpacity={0.7}
                    >
                      {button.icon && (
                        <Foundation
                          name={button.icon}
                          size={20}
                          color={
                            isDestructive
                              ? '#FF8585'
                              : isCancel
                              ? 'rgba(255, 255, 255, 0.92)'
                              : theme.romantic.primary
                          }
                          style={{ marginRight: 8 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.buttonText,
                          isDestructive && styles.destructiveText,
                          isCancel && styles.cancelText,
                          isDefault && { color: theme.romantic.primary },
                        ]}
                      >
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
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
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(25, 25, 35, 0.95)',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.4,
    color: '#FFFFFF',
    width: '100%',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 6,
    textAlign: 'right',
  },
  buttonsScrollView: {
    width: '100%',
    maxHeight: 250, // Hauteur maximale pour forcer le scroll
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
    paddingBottom: 4,
  },
  button: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minHeight: 46,
  },
  defaultButton: {
    backgroundColor: 'rgba(255, 105, 180, 0.22)',
    borderColor: 'rgba(255, 105, 180, 0.65)',
  },
  destructiveButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.22)',
    borderColor: 'rgba(255, 69, 58, 0.65)',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  destructiveText: {
    color: '#FF8585',
  },
  cancelText: {
    color: 'rgba(255, 255, 255, 0.92)',
  },
});

export default CustomInputModal;
