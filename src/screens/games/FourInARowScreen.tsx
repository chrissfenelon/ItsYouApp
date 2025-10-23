import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';

const { width, height } = Dimensions.get('window');

export const FourInARowScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.blurryOverlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigateToScreen('gamesMenu')}
            >
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Puissance 4</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Placeholder Content */}
          <View style={styles.placeholderContainer}>
            <View style={styles.placeholderCard}>
              <Foundation name="graph-pie" size={80} color={currentTheme.romantic.primary} />
              <Text style={styles.placeholderTitle}>Puissance 4</Text>
              <Text style={styles.placeholderText}>
                Bientôt disponible !{'\n'}
                Ce jeu sera implémenté prochainement.
              </Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>En développement...</Text>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  blurryOverlay: {
    flex: 1,
    backgroundColor: theme.background.overlay,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.interactive.active,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: 300,
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  comingSoonBadge: {
    backgroundColor: theme.romantic.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FourInARowScreen;