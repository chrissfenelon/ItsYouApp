import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ToastService, { ToastConfig } from '../../services/ToastService';

const { width } = Dimensions.get('window');
const TOAST_WIDTH = width - 40;

const Toast: React.FC = () => {
  const [config, setConfig] = useState<ToastConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const toastService = ToastService.getInstance();

    const showListener = (toastConfig: ToastConfig) => {
      setConfig(toastConfig);
      setVisible(true);

      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const hideListener = () => {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        setConfig(null);
      });
    };

    toastService.on('show', showListener);
    toastService.on('hide', hideListener);

    return () => {
      toastService.removeListener('show', showListener);
      toastService.removeListener('hide', hideListener);
    };
  }, []);

  if (!visible || !config) {
    return null;
  }

  const getIconName = () => {
    switch (config.type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      case 'info':
        return 'information';
      default:
        return 'information';
    }
  };

  const getIconColor = () => {
    switch (config.type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      case 'info':
        return '#2196F3';
      default:
        return '#2196F3';
    }
  };

  const getBorderColor = () => {
    switch (config.type) {
      case 'success':
        return 'rgba(76, 175, 80, 0.5)';
      case 'error':
        return 'rgba(244, 67, 54, 0.5)';
      case 'warning':
        return 'rgba(255, 152, 0, 0.5)';
      case 'info':
        return 'rgba(33, 150, 243, 0.5)';
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.toastWrapper}>
        {/* Blur Background */}
        {Platform.OS === 'ios' ? (
          <BlurView
            style={styles.blur}
            blurType="dark"
            blurAmount={20}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.8)"
          />
        ) : (
          <View style={[styles.blur, styles.androidBlur]} />
        )}

        {/* Glass Overlay */}
        <View
          style={[
            styles.glassOverlay,
            {
              borderColor: getBorderColor(),
            },
          ]}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={getIconName()}
              size={24}
              color={getIconColor()}
            />
          </View>

          {/* Message */}
          <Text style={styles.message} numberOfLines={2}>
            {config.message}
          </Text>

          {/* Action Button */}
          {config.action && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: getIconColor() }]}
              onPress={() => {
                config.action?.onPress();
                ToastService.hide();
              }}
            >
              <Text style={[styles.actionText, { color: getIconColor() }]}>
                {config.action.label}
              </Text>
            </TouchableOpacity>
          )}

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => ToastService.hide()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={20}
              color="rgba(255, 255, 255, 0.7)"
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 1000,
  },
  toastWrapper: {
    width: TOAST_WIDTH,
    minHeight: 60,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default Toast;
