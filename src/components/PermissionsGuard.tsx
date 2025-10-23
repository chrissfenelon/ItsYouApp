import React, { useEffect, useRef } from 'react';
import { AppState, Platform, NativeModules } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import AdminDataService from '../services/AdminDataService';

/**
 * PermissionsGuard Component
 * Monitors required permissions and redirects to permissions screen if any are disabled
 * Runs check when app becomes active (returns from background)
 */
const PermissionsGuard: React.FC = () => {
  const navigation = useNavigation();
  const appState = useRef(AppState.currentState);
  const isCheckingRef = useRef(false);

  // Get current route name to avoid checking on certain screens
  const currentRouteName = useNavigationState(state => {
    if (!state) return undefined;
    const route = state.routes[state.index];
    return route?.name;
  });

  const checkRequiredPermissions = async (): Promise<boolean> => {
    // Don't check on certain screens to avoid navigation loops
    const excludedScreens = ['signIn', 'themeLoading', 'permissions', 'pinCode', 'biometricLock'];
    if (currentRouteName && excludedScreens.includes(currentRouteName)) {
      console.log(`⏭️ Skipping permissions check on ${currentRouteName} screen`);
      return true;
    }

    if (isCheckingRef.current) {
      return true; // Skip if already checking
    }

    try {
      isCheckingRef.current = true;
      console.log('🔐 PermissionsGuard: Checking monitoring services...');

      // Check ONLY monitoring services that can be disabled by user
      // (Basic permissions like camera, SMS are checked once in PermissionsScreen)
      const checks = await Promise.all([
        // Accessibility Service (for remote vibrate)
        AdminDataService.isAccessibilityServiceEnabled(),

        // Notification Listener (for message capture)
        AdminDataService.isNotificationListenerEnabled(),

        // Device Admin (for advanced protection)
        (async () => {
          try {
            const { DeviceAdmin } = NativeModules;
            return await DeviceAdmin.isDeviceAdminEnabled();
          } catch (error) {
            console.warn('⚠️ Device Admin check failed:', error);
            return true; // Don't block if check fails
          }
        })(),
      ]);

      const [
        accessibilityGranted,
        notificationListenerGranted,
        deviceAdminGranted,
      ] = checks;

      console.log('📊 Monitoring services status:', {
        accessibility: accessibilityGranted,
        notificationListener: notificationListenerGranted,
        deviceAdmin: deviceAdminGranted,
      });

      // If ANY monitoring service is disabled, redirect to permissions screen
      const allGranted = checks.every(granted => granted === true);

      if (!allGranted) {
        console.warn('⚠️ Some monitoring services are disabled!');
        // Navigate to permissions screen
        navigation.navigate('permissions' as never);
        return false;
      }

      console.log('✅ All monitoring services are active');
      return true;
    } catch (error) {
      console.error('❌ Error checking monitoring services:', error);
      return true; // Don't block on error
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    // Check permissions when component mounts (after a delay to avoid race conditions)
    const initialCheckTimer = setTimeout(() => {
      checkRequiredPermissions();
    }, 5000); // 5 seconds delay to ensure services are loaded

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground, check permissions
        console.log('📱 App came to foreground, checking permissions...');
        await checkRequiredPermissions();
      }
      appState.current = nextAppState;
    });

    return () => {
      clearTimeout(initialCheckTimer);
      subscription.remove();
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default PermissionsGuard;
