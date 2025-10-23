import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { useApp } from '../context/AppContext';
import NavigationService from '../services/NavigationService';

export const ThemeLoadingScreen: React.FC = () => {
  const { currentTheme, user } = useApp();

  useEffect(() => {
    // Wait a short moment to show the loading screen, then navigate
    const timer = setTimeout(() => {
      console.log('✅ Theme loaded, navigating to main screen');
      NavigationService.navigate('main');
    }, 1500); // 1.5 seconds to show theme is being applied

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background.primary }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Theme preview circles */}
      <View style={styles.themePreview}>
        <View style={[styles.circle, { backgroundColor: currentTheme.romantic.primary }]} />
        <View style={[styles.circle, { backgroundColor: currentTheme.romantic.secondary }]} />
        <View style={[styles.circle, { backgroundColor: currentTheme.romantic.tertiary }]} />
      </View>

      <Text style={[styles.title, { color: currentTheme.text.primary }]}>
        Application du thème
      </Text>

      <Text style={[styles.subtitle, { color: currentTheme.text.secondary }]}>
        Préparation de votre expérience personnalisée...
      </Text>

      <ActivityIndicator
        size="large"
        color={currentTheme.romantic.primary}
        style={styles.loader}
      />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: currentTheme.text.tertiary }]}>
          It's You Babe
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  themePreview: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 15,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  loader: {
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: '300',
  },
});

export default ThemeLoadingScreen;
