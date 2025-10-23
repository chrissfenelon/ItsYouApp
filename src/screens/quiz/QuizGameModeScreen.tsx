import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import { QuizGameMode } from '../../types/quizCouple.types';

const { width, height } = Dimensions.get('window');

interface QuizGameModeScreenProps {
  onSelectMode: (mode: QuizGameMode) => void;
  onBack: () => void;
}

export const QuizGameModeScreen: React.FC<QuizGameModeScreenProps> = ({
  onSelectMode,
  onBack,
}) => {
  const { user, currentTheme } = useApp();
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
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Mode de Jeu</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Main Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Text style={styles.heroIcon}>🎮</Text>
              <Text style={styles.heroTitle}>Choisissez votre Mode</Text>
              <Text style={styles.heroSubtitle}>
                Trois façons de jouer, trois expériences uniques !
              </Text>
            </View>

            {/* Game Modes */}
            <View style={styles.modesContainer}>
              {/* Mode Compétitif */}
              <TouchableOpacity
                style={[styles.modeCard, styles.competitiveCard]}
                onPress={() => onSelectMode('competitive')}
                activeOpacity={1}
              >
                <Foundation name="trophy" size={60} color="#FFD700" style={styles.modeIcon} />
                <Text style={styles.modeTitle}>Mode Compétitif</Text>
                <Text style={styles.modeDescription}>
                  Répondez aux mêmes questions et celui qui répond le plus vite et le mieux gagne
                  des points !
                </Text>
                <View style={styles.modeFeatures}>
                  <View style={styles.featureRow}>
                    <Foundation name="check" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Mêmes questions pour les deux</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Foundation name="check" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Bonus de vitesse</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Foundation name="check" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Le meilleur score gagne</Text>
                  </View>
                </View>
                <View style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Sélectionner</Text>
                  <Foundation name="arrow-right" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Mode Prédiction */}
              <TouchableOpacity
                style={[styles.modeCard, styles.predictionCard]}
                onPress={() => onSelectMode('prediction')}
                activeOpacity={1}
              >
                <Foundation name="heart" size={60} color="#FF69B4" style={styles.modeIcon} />
                <Text style={styles.modeTitle}>Mode Prédiction</Text>
                <Text style={styles.modeDescription}>
                  Devinez ce que votre partenaire a répondu ! Connais-tu vraiment ton/ta
                  partenaire ?
                </Text>
                <View style={styles.modeFeatures}>
                  <View style={styles.featureRow}>
                    <Foundation name="check" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Questions alternées</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Foundation name="check" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Devinez la réponse du partenaire</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Foundation name="check" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Points si vous devinez juste</Text>
                  </View>
                </View>
                <View style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Sélectionner</Text>
                  <Foundation name="arrow-right" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Mode Custom */}
              <TouchableOpacity
                style={[styles.modeCard, styles.customCard]}
                onPress={() => onSelectMode('custom')}
                activeOpacity={1}
              >
                <Foundation name="pencil" size={60} color="#9C27B0" style={styles.modeIcon} />
                <Text style={styles.modeTitle}>Mode Personnalisé</Text>
                <Text style={styles.modeDescription}>
                  Posez vos propres questions et jugez les réponses de votre partenaire !
                </Text>
                <View style={styles.modeFeatures}>
                  <View style={styles.featureRow}>
                    <Foundation name="check" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Créez vos questions</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Foundation name="check" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Réponses libres au clavier</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Foundation name="check" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Vous jugez: Bon, Presque, Mauvais</Text>
                  </View>
                </View>
                <View style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Sélectionner</Text>
                  <Foundation name="arrow-right" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 40,
      marginTop: 20,
    },
    heroIcon: {
      fontSize: 80,
      marginBottom: 16,
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontSize: 16,
      color: theme.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    modesContainer: {
      gap: 20,
    },
    modeCard: {
      backgroundColor: 'transparent',
      borderRadius: 20,
      padding: 24,
      borderWidth: 3,
    },
    competitiveCard: {
      borderColor: '#FFD700',
    },
    predictionCard: {
      borderColor: '#FF69B4',
    },
    customCard: {
      borderColor: '#9C27B0',
    },
    modeIcon: {
      marginBottom: 16,
      alignSelf: 'center',
    },
    modeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    modeDescription: {
      fontSize: 16,
      color: theme.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 20,
    },
    modeFeatures: {
      gap: 12,
      marginBottom: 24,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    featureText: {
      fontSize: 14,
      color: theme.text.primary,
      flex: 1,
    },
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderRadius: 12,
      padding: 16,
      gap: 8,
      borderWidth: 2,
      borderColor: theme.romantic.primary,
    },
    selectButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  });

export default QuizGameModeScreen;
