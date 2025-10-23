import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  ScrollView,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { BlurView } from '@react-native-community/blur';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import SoundService from '../../../services/SoundService';
import { MorpionService } from '../../../services/MorpionService';
import CustomAlert from '../../../components/common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface GameMode {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  gradient: string[];
  features: string[];
  difficulty?: string;
  players: string;
}

interface MorpionGameModeScreenProps {
  route?: {
    params?: {
      playerName?: string;
      boardSize?: number;
      winCondition?: number;
    };
  };
}

const MorpionGameModeScreen: React.FC<MorpionGameModeScreenProps> = ({ route }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const styles = createStyles(currentTheme);
  const boardSize = route?.params?.boardSize || 3;
  const winCondition = route?.params?.winCondition || 3;
  const playerName = route?.params?.playerName || user?.name || 'Joueur 1';

  // State
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [cardScales] = useState(
    Array.from({ length: 3 }, () => new Animated.Value(0.9))
  );

  const gameModes: GameMode[] = [
    {
      id: 'ai',
      title: 'Intelligence Artificielle',
      subtitle: 'Défi contre l\'IA',
      description: 'Affrontez une intelligence artificielle avec différents niveaux de difficulté et styles de jeu personnalisables.',
      icon: 'laptop',
      color: '#2196F3',
      gradient: ['#2196F3', '#1976D2'],
      features: ['4 niveaux de difficulté', '3 styles de jeu', 'Progression adaptative', 'Statistiques détaillées'],
      difficulty: 'Ajustable',
      players: '1 joueur',
    },
    {
      id: 'multiplayer',
      title: 'Multijoueur',
      subtitle: 'Défi avec Orlie',
      description: 'Jouez en temps réel avec Orlie. Envoyez des invitations et profitez d\'une expérience de jeu partagée.',
      icon: 'heart',
      color: '#FF69B4',
      gradient: ['#FF69B4', '#E91E63'],
      features: ['Jeu en temps réel', 'Invitations push', 'Chat intégré', 'Parties privées'],
      difficulty: 'Variable',
      players: '2 joueurs',
    },
    {
      id: 'tournament',
      title: 'Tournoi',
      subtitle: 'Compétition ultime',
      description: 'Participez à des tournois contre plusieurs adversaires IA avec des défis progressifs.',
      icon: 'trophy',
      color: '#FF9800',
      gradient: ['#FF9800', '#F57C00'],
      features: ['Élimination directe', 'Récompenses', 'Classement global', 'Défis quotidiens'],
      difficulty: 'Élevée',
      players: 'Multi-étapes',
    },
  ];

  useEffect(() => {
    // Start animations
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
      ...cardScales.map((scale, index) =>
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        })
      ),
    ]).start();

    SoundService.playButtonClick();
  }, []);

  const handleModeSelect = (mode: GameMode) => {
    SoundService.playButtonClick();
    setSelectedMode(mode);

    // Animate selection
    Animated.sequence([
      Animated.timing(cardScales[gameModes.indexOf(mode)], {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(cardScales[gameModes.indexOf(mode)], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleStartGame = () => {
    if (!selectedMode) return;

    SoundService.playButtonClick();

    switch (selectedMode.id) {
      case 'ai':
        navigateToScreen('morpionAISettings', {
          playerName,
          boardSize,
          winCondition,
        });
        break;
      case 'multiplayer':
        navigateToScreen('morpionOnline', {
          playerName,
          boardSize,
          winCondition,
        });
        break;
      case 'tournament':
        // TODO: Implement tournament mode
        navigateToScreen('morpionGame', {
          gameMode: 'tournament',
          playerName,
          boardSize,
          winCondition,
        });
        break;
    }
  };

  const handleBack = () => {
    SoundService.playButtonClick();
    navigateToScreen('morpionBoardSize', { playerName });
  };

  const handleJoinGame = async () => {
    if (!roomCode.trim()) {
      showAlert({
        title: 'Code requis',
        message: 'Veuillez entrer un code de salle',
        type: 'warning',
      });
      return;
    }

    if (!user?.id) {
      showAlert({
        title: 'Erreur',
        message: 'Utilisateur non connecté',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // Join game by room code (this adds the player to the game)
      const gameId = await MorpionService.joinGameByCode(
        roomCode.toUpperCase(),
        {
          id: user.id,
          name: user.name || playerName,
          avatar: user.avatar || { type: 'emoji', value: '👤' },
          photoURL: user.photoURL,
        }
      );

      // Navigate to lobby
      setShowJoinModal(false);
      setRoomCode('');
      SoundService.playButtonClick();
      navigateToScreen('morpionLobby', {
        gameId,
        boardSize,
        winCondition,
      });
    } catch (error: any) {
      console.error('Error joining game:', error);
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de rejoindre la partie',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderGameModeCard = (mode: GameMode, index: number) => (
    <Animated.View
      key={mode.id}
      style={[
        styles.modeCardContainer,
        { transform: [{ scale: cardScales[index] }] },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.modeCard,
          selectedMode?.id === mode.id && styles.selectedModeCard,
        ]}
        onPress={() => handleModeSelect(mode)}
        activeOpacity={0.9}
      >
        <BlurView style={styles.modeCardBlur} blurType="dark" blurAmount={15}>
          <View
            style={[
              styles.modeCardGlass,
              selectedMode?.id === mode.id && {
                borderColor: mode.color,
                backgroundColor: `${mode.color}15`,
              },
            ]}
          />
        </BlurView>

        {/* Header */}
        <View style={styles.modeCardHeader}>
          <View style={[styles.modeIcon, { backgroundColor: `${mode.color}20` }]}>
            <Foundation name={mode.icon} size={32} color={mode.color} />
          </View>
          <View style={styles.modeHeaderText}>
            <Text style={styles.modeTitle}>{mode.title}</Text>
            <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
          </View>
          {selectedMode?.id === mode.id && (
            <View style={[styles.selectedBadge, { backgroundColor: mode.color }]}>
              <Foundation name="check" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.modeDescription}>{mode.description}</Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {mode.features.map((feature, featureIndex) => (
            <View key={featureIndex} style={styles.featureItem}>
              <Foundation name="check" size={12} color={mode.color} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Info badges */}
        <View style={styles.infoBadges}>
          <View style={styles.infoBadge}>
            <Foundation name="torsos-all" size={14} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.infoBadgeText}>{mode.players}</Text>
          </View>
          <View style={styles.infoBadge}>
            <Foundation name="graph-trend" size={14} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.infoBadgeText}>{mode.difficulty}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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

              <Text style={styles.headerTitle}>Modes de Jeu</Text>

              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => {
                  SoundService.playButtonClick();
                  setShowJoinModal(true);
                }}
              >
                <Foundation name="link" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.introSection}>
                <Text style={styles.introTitle}>Choisissez votre aventure</Text>
                <Text style={styles.introDescription}>
                  Sélectionnez le mode de jeu qui correspond à vos envies du moment
                </Text>
              </View>

              {/* Game Modes */}
              <View style={styles.modesContainer}>
                {gameModes.map((mode, index) => renderGameModeCard(mode, index))}
              </View>

              <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Action Button */}
            {selectedMode && (
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={[styles.startButton, { borderColor: selectedMode.color }]}
                  onPress={handleStartGame}
                  activeOpacity={0.8}
                >
                  <BlurView style={styles.startButtonBlur} blurType="light" blurAmount={20}>
                    <View
                      style={[
                        styles.startButtonGlass,
                        { backgroundColor: `${selectedMode.color}40` },
                      ]}
                    />
                  </BlurView>

                  <View style={styles.startButtonContent}>
                    <Foundation name="play" size={24} color={selectedMode.color} />
                    <Text style={[styles.startButtonText, { color: selectedMode.color }]}>
                      {selectedMode.id === 'ai' ? 'Configurer l\'IA' :
                       selectedMode.id === 'multiplayer' ? 'Inviter à jouer' :
                       'Commencer le tournoi'}
                    </Text>
                    <Foundation name="arrow-right" size={20} color={`${selectedMode.color}80`} />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </ImageBackground>

      {/* Join Game Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejoindre une Partie</Text>
            <Text style={styles.modalSubtitle}>
              Entrez le code de salle à 6 caractères
            </Text>

            <TextInput
              style={styles.input}
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  SoundService.playButtonClick();
                  setShowJoinModal(false);
                  setRoomCode('');
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleJoinGame}
                disabled={loading || roomCode.length !== 6}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Connexion...' : 'Rejoindre'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
          onClose={hideAlert}
          theme={currentTheme}
        />
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
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
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
  },
  joinButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1,
  },
  introDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  modesContainer: {
    gap: 20,
  },
  modeCardContainer: {
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 220,
  },
  selectedModeCard: {
    shadowColor: 'rgba(255, 105, 180, 0.6)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  modeCardBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modeCardGlass: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    gap: 15,
  },
  modeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modeHeaderText: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  infoBadges: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  infoBadgeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 120,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  startButton: {
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    shadowColor: 'rgba(255, 105, 180, 0.6)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  startButtonGlass: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  startButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  confirmButton: {
    backgroundColor: '#FF69B4',
    borderWidth: 1,
    borderColor: '#FF69B4',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default MorpionGameModeScreen;