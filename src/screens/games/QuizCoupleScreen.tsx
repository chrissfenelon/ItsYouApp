import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import { QuizCoupleService } from '../../services/quiz/QuizCoupleService';
import { QuizGameMode } from '../../types/quizCouple.types';
import QuizGameModeScreen from '../quiz/QuizGameModeScreen';
import QuizSettingsScreen from '../quiz/QuizSettingsScreen';
import { DareButton } from '../../components/DareButton';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

export const QuizCoupleScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectMode = async (mode: QuizGameMode) => {
    if (!user) return;

    setLoading(true);
    try {
      const playerProfile = {
        id: user.id,
        name: user.name || 'Joueur',
        avatar: {
          type: (user.profilePicture?.startsWith('http') || user.profilePicture?.startsWith('file://')) ? 'photo' as const : 'emoji' as const,
          value: user.profilePicture || '👤',
        },
        photoURL: user.photoURL || null, // Photo Firebase Auth pour affichage
        level: user.level || 1,
        xp: user.xp || 0,
        coins: user.coins || 0,
        stats: user.stats || {
          gamesPlayed: 0,
          gamesWon: 0,
          totalWordsFound: 0,
          totalScore: 0,
          bestTime: 0,
          favortieDifficulty: 'easy' as const,
          multiplayerWins: 0,
          multiplayerGames: 0,
        },
        unlockedThemes: user.unlockedThemes || [],
        unlockedAvatars: user.unlockedAvatars || [],
        completedLevels: user.completedLevels || [],
        powerUps: user.powerUps || {
          revealLetter: 0,
          revealWord: 0,
          timeFreeze: 0,
          highlightFirst: 0,
        },
        createdAt: user.createdAt || Date.now(),
      };

      const gameId = await QuizCoupleService.createQuizGame(playerProfile, mode);

      // Navigate to lobby with game ID
      navigateToScreen('quizCoupleLobby', { gameId, playerId: user.id });
    } catch (error) {
      console.error('Error creating game:', error);
      showAlert({ title: 'Erreur', message: 'Impossible de créer la partie. Veuillez réessayer.', type: 'error' });
    } finally {
      setLoading(false);
      setShowModeSelection(false);
    }
  };

  const handleCreateGame = () => {
    setShowModeSelection(true);
  };

  const handleJoinGame = async () => {
    if (!user || !roomCode.trim()) {
      showAlert({ title: 'Code requis', message: 'Veuillez entrer un code de salle', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const playerProfile = {
        id: user.id,
        name: user.name || 'Joueur',
        avatar: {
          type: (user.profilePicture?.startsWith('http') || user.profilePicture?.startsWith('file://')) ? 'photo' as const : 'emoji' as const,
          value: user.profilePicture || '👤',
        },
        photoURL: user.photoURL || null, // Photo Firebase Auth pour affichage
        level: user.level || 1,
        xp: user.xp || 0,
        coins: user.coins || 0,
        stats: user.stats || {
          gamesPlayed: 0,
          gamesWon: 0,
          totalWordsFound: 0,
          totalScore: 0,
          bestTime: 0,
          favortieDifficulty: 'easy' as const,
          multiplayerWins: 0,
          multiplayerGames: 0,
        },
        unlockedThemes: user.unlockedThemes || [],
        unlockedAvatars: user.unlockedAvatars || [],
        completedLevels: user.completedLevels || [],
        powerUps: user.powerUps || {
          revealLetter: 0,
          revealWord: 0,
          timeFreeze: 0,
          highlightFirst: 0,
        },
        createdAt: user.createdAt || Date.now(),
      };

      const gameId = await QuizCoupleService.joinGameByCode(
        roomCode.toUpperCase(),
        playerProfile
      );

      setShowJoinModal(false);
      setRoomCode('');

      // Navigate to lobby
      navigateToScreen('quizCoupleLobby', { gameId, playerId: user.id });
    } catch (error: any) {
      console.error('Error joining game:', error);
      showAlert({ title: 'Erreur', message: error.message || 'Impossible de rejoindre la partie', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

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
              onPress={() => navigateToScreen('games')}
            >
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Quiz Couple</Text>

            <View style={styles.headerActions}>
              <DareButton
                gameType="quizcouple"
                variant="icon"
                iconSize={20}
                showLabel={false}
                style={styles.dareButton}
              />
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setShowSettings(true)}
              >
                <Foundation name="widget" size={20} color={currentTheme.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Text style={styles.heroIcon}>💕</Text>
              <Text style={styles.heroTitle}>Quiz Couple</Text>
              <Text style={styles.heroSubtitle}>
                Testez votre compatibilité et apprenez-en plus sur votre relation !
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.createButton]}
                onPress={handleCreateGame}
                disabled={loading}
              >
                <Foundation name="plus" size={28} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Créer une Partie</Text>
                <Text style={styles.actionButtonSubtext}>Invitez votre partenaire</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.joinButton]}
                onPress={() => setShowJoinModal(true)}
                disabled={loading}
              >
                <Foundation name="link" size={28} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Rejoindre</Text>
                <Text style={styles.actionButtonSubtext}>Entrez le code de salle</Text>
              </TouchableOpacity>
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Foundation name="comments" size={40} color={currentTheme.romantic.primary} />
                <Text style={styles.infoTitle}>10 Questions</Text>
                <Text style={styles.infoText}>
                  Questions amusantes sur votre couple et votre compatibilité
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Foundation name="clock" size={40} color={currentTheme.romantic.primary} />
                <Text style={styles.infoTitle}>15s par Question</Text>
                <Text style={styles.infoText}>
                  Répondez rapidement pour gagner des bonus de points
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Foundation name="trophy" size={40} color={currentTheme.romantic.primary} />
                <Text style={styles.infoTitle}>2 Joueurs</Text>
                <Text style={styles.infoText}>
                  Affrontez votre partenaire pour voir qui connaît mieux l'autre
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Mode Selection Modal */}
      <Modal
        visible={showModeSelection}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowModeSelection(false)}
      >
        <QuizGameModeScreen
          onSelectMode={handleSelectMode}
          onBack={() => setShowModeSelection(false)}
        />
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSettings(false)}
      >
        <QuizSettingsScreen onBack={() => setShowSettings(false)} />
      </Modal>

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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dareButton: {
    width: 40,
    height: 40,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.interactive.active,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
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
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...theme.shadows.button,
  },
  createButton: {
    backgroundColor: theme.romantic.primary,
    borderColor: theme.romantic.primary,
  },
  joinButton: {
    backgroundColor: theme.romantic.secondary,
    borderColor: theme.romantic.secondary,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  infoSection: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
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
    backgroundColor: theme.background.secondary,
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
    color: theme.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text.primary,
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
    color: theme.text.secondary,
  },
  confirmButton: {
    backgroundColor: theme.romantic.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default QuizCoupleScreen;