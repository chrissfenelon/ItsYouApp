import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { BlurView } from '@react-native-community/blur';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import SoundService from '../../../services/SoundService';

const { width, height } = Dimensions.get('window');

interface BoardSizeOption {
  size: number;
  title: string;
  description: string;
  winCondition: number;
  difficulty: string;
  color: string;
  icon: string;
}

interface MorpionBoardSizeScreenProps {
  route?: {
    params?: {
      playerName?: string;
    };
  };
}

const MorpionBoardSizeScreen: React.FC<MorpionBoardSizeScreenProps> = ({ route }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const playerName = route?.params?.playerName || user?.name || 'Joueur 1';

  const [selectedSize, setSelectedSize] = useState<BoardSizeOption | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const boardSizes: BoardSizeOption[] = [
    {
      size: 3,
      title: '3x3 Classique',
      description: 'Le morpion traditionnel, rapide et stratégique',
      winCondition: 3,
      difficulty: 'Facile',
      color: '#4CAF50',
      icon: 'list-thumbnails',
    },
    {
      size: 4,
      title: '4x4 Intermédiaire',
      description: 'Plus d\'espace, plus de stratégie, alignez 4 pour gagner',
      winCondition: 4,
      difficulty: 'Moyen',
      color: '#FF9800',
      icon: 'thumbnails',
    },
    {
      size: 5,
      title: '5x5 Expert',
      description: 'Grille étendue, alignez 4 symboles pour la victoire',
      winCondition: 4,
      difficulty: 'Difficile',
      color: '#F44336',
      icon: 'page-multiple',
    },
    {
      size: 6,
      title: '6x6 Master',
      description: 'Le défi ultime, alignez 5 pour dominer',
      winCondition: 5,
      difficulty: 'Expert',
      color: '#9C27B0',
      icon: 'page-copy',
    },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    SoundService.playButtonClick();
  }, []);

  const handleSizeSelect = (size: BoardSizeOption) => {
    SoundService.playButtonClick();
    setSelectedSize(size);
  };

  const handleContinue = () => {
    if (!selectedSize) return;
    SoundService.playButtonClick();
    navigateToScreen('morpionGameMode', {
      playerName,
      boardSize: selectedSize.size,
      winCondition: selectedSize.winCondition,
    });
  };

  const handleBack = () => {
    SoundService.playButtonClick();
    navigateToScreen('morpionWelcome');
  };

  const renderBoardPreview = (size: number) => {
    const cells = Array(size * size).fill(null);
    const cellSize = 50 / size; // Adjust cell size based on grid

    return (
      <View style={styles.boardPreview}>
        {Array.from({ length: size }).map((_, row) => (
          <View key={row} style={styles.previewRow}>
            {Array.from({ length: size }).map((_, col) => (
              <View
                key={`${row}-${col}`}
                style={[
                  styles.previewCell,
                  {
                    width: cellSize,
                    height: cellSize,
                    borderRightWidth: col < size - 1 ? 1 : 0,
                    borderBottomWidth: row < size - 1 ? 1 : 0,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderSizeCard = (option: BoardSizeOption) => (
    <TouchableOpacity
      key={option.size}
      style={[
        styles.sizeCard,
        selectedSize?.size === option.size && styles.selectedSizeCard,
      ]}
      onPress={() => handleSizeSelect(option)}
      activeOpacity={0.8}
    >
      <BlurView style={styles.cardBlur} blurType="dark" blurAmount={15}>
        <View
          style={[
            styles.cardGlass,
            selectedSize?.size === option.size && {
              borderColor: option.color,
              backgroundColor: `${option.color}15`,
            },
          ]}
        />
      </BlurView>

      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}>
            <Foundation name={option.icon} size={32} color={option.color} />
          </View>

          {selectedSize?.size === option.size && (
            <View style={[styles.selectedBadge, { backgroundColor: option.color }]}>
              <Foundation name="check" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Board Preview */}
        <View style={styles.previewContainer}>{renderBoardPreview(option.size)}</View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.sizeTitle}>{option.title}</Text>
          <Text style={styles.sizeDescription}>{option.description}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Foundation name="target" size={16} color={option.color} />
              <Text style={styles.infoText}>Alignez {option.winCondition}</Text>
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: `${option.color}20` }]}>
              <Text style={[styles.difficultyText, { color: option.color }]}>
                {option.difficulty}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Foundation name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Taille de la Grille</Text>

              <View style={styles.placeholder} />
            </View>

            {/* Subtitle */}
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>
                🎯 Choisissez la taille de votre plateau de jeu
              </Text>
              <Text style={styles.subtitleHint}>
                Plus la grille est grande, plus le jeu est stratégique !
              </Text>
            </View>

            {/* Board Size Options */}
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {boardSizes.map(option => renderSizeCard(option))}
            </ScrollView>

            {/* Continue Button */}
            {selectedSize && (
              <Animated.View
                style={[
                  styles.continueContainer,
                  {
                    opacity: fadeAnim,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                >
                  <BlurView style={styles.continueBlur} blurType="light" blurAmount={20}>
                    <View
                      style={[
                        styles.continueGlass,
                        { backgroundColor: `${selectedSize.color}60` },
                      ]}
                    />
                  </BlurView>

                  <View style={styles.continueContent}>
                    <Text style={styles.continueText}>Continuer</Text>
                    <Foundation name="arrow-right" size={24} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    backgroundImage: {
      flex: 1,
      width,
      height,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    contentContainer: {
      flex: 1,
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
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    placeholder: {
      width: 50,
    },
    subtitleContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitleHint: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
      lineHeight: 20,
    },
    scrollContent: {
      flex: 1,
    },
    scrollContainer: {
      paddingHorizontal: 20,
      paddingBottom: 100,
      gap: 20,
    },
    sizeCard: {
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 20,
    },
    selectedSizeCard: {
      shadowColor: '#FF69B4',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 8,
    },
    cardBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    cardGlass: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    cardContent: {
      padding: 20,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    selectedBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    previewContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    boardPreview: {
      padding: 10,
    },
    previewRow: {
      flexDirection: 'row',
    },
    previewCell: {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    cardInfo: {
      gap: 12,
    },
    sizeTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    sizeDescription: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: 20,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoText: {
      fontSize: 14,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.9)',
    },
    difficultyBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    difficultyText: {
      fontSize: 12,
      fontWeight: '600',
    },
    continueContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingVertical: 20,
      paddingBottom: 30,
    },
    continueButton: {
      height: 60,
      borderRadius: 16,
      overflow: 'hidden',
    },
    continueBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    continueGlass: {
      flex: 1,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    continueContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    continueText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

export default MorpionBoardSizeScreen;