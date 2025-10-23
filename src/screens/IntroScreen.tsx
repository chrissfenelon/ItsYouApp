import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import StorageService from '../services/StorageService';
import { useApp } from '../context/AppContext';

export const IntroScreen: React.FC = () => {
  const { navigateToScreen } = useApp();

  useEffect(() => {
    const handleSplashCompletion = async () => {
      // Check if user is already logged in or if it's first time
      const hasValidData = await StorageService.hasValidUserData();

      if (hasValidData) {
        const savedUser = await StorageService.getUserData();
        if (savedUser) {
          // User is logged in, check if PIN is enabled
          const isPinEnabled = await StorageService.isPinEnabled();

          if (isPinEnabled) {
            // PIN is enabled, user must verify PIN before accessing home
            navigateToScreen('pinCode');
          } else {
            // No PIN, go directly to home
            navigateToScreen('home');
          }
          return;
        }
      }

      // Not logged in, go to sign in screen
      navigateToScreen('signIn');
    };

    // Navigate after 2 seconds
    const timer = setTimeout(handleSplashCompletion, 2000);

    return () => clearTimeout(timer);
  }, [navigateToScreen]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Text style={styles.welcomeText}>Welcome</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  welcomeText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});

export default IntroScreen;
