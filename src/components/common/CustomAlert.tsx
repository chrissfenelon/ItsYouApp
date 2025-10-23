import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Foundation from 'react-native-vector-icons/Foundation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  theme?: any;
  type?: 'success' | 'error' | 'warning' | 'info';
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
  theme,
  type = 'info',
}) => {
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'check', color: '#4CAF50' };
      case 'error':
        return { name: 'x', color: '#FF453A' };
      case 'warning':
        return { name: 'alert', color: '#FFD60A' };
      default:
        return { name: 'info', color: theme?.romantic?.primary || '#FF69B4' };
    }
  };

  const icon = getIconConfig();

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Background Blur */}
        <BlurView
          style={styles.blurOverlay}
          blurType="dark"
          blurAmount={15}
          reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.8)"
        />

        {/* Alert Card */}
        <View style={styles.alertContainer}>
          <View style={styles.alertContent}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: icon.color + '25' }]}>
              <Foundation name={icon.name} size={40} color={icon.color} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            {message && (
              <Text style={styles.message}>
                {message}
              </Text>
            )}

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
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
                      buttons.length === 1 && styles.singleButton,
                    ]}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isDestructive && styles.destructiveText,
                        isCancel && styles.cancelText,
                        isDefault && { color: theme?.romantic?.primary || '#FF69B4' },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
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
  alertContainer: {
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
  alertContent: {
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
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    color: 'rgba(255, 255, 255, 0.85)',
    width: '100%',
  },
  buttonsContainer: {
    width: '100%',
    gap: 13,
    marginTop: 6,
  },
  button: {
    borderRadius: 15,
    paddingVertical: 17,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minHeight: 54,
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
  singleButton: {
    marginTop: 6,
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

export default CustomAlert;