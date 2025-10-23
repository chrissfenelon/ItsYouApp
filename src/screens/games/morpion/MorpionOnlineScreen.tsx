import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ImageBackground,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CurrentTheme } from '../../../constants/Themes';
import { Typography } from '../../../constants/Typography';
import FeedbackService from '../../../services/FeedbackService';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { MorpionService } from '../../../services/MorpionService';
import CustomAlert from '../../../components/common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

const { width } = Dimensions.get('window');

const MorpionOnlineScreen: React.FC<any> = ({ navigation, route }) => {
  const { user } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const boardSize = route?.params?.boardSize || 3;
  const winCondition = route?.params?.winCondition || 3;

  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateGame = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const playerProfile = {
        id: user.id,
        name: user.name || 'Joueur',
        avatar: (user.profilePicture?.startsWith('http') || user.profilePicture?.startsWith('file://'))
          ? { type: 'photo' as const, value: user.profilePicture }
          : { type: 'emoji' as const, value: user.profilePicture || '👤' },
      };

      const gameId = await MorpionService.createGame(playerProfile, boardSize, winCondition);

      FeedbackService.success();
      navigation.navigate('morpionLobby', { gameId, boardSize, winCondition });
    } catch (error: any) {
      console.error('Error creating game:', error);
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de créer la partie',
        type: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!user) return;

    const code = roomCode.trim().toUpperCase();

    if (code.length !== 6) {
      showAlert({
        title: 'Code invalide',
        message: 'Le code de partie doit contenir 6 caractères',
        type: 'warning',
      });
      return;
    }

    setIsJoining(true);
    try {
      const playerProfile = {
        id: user.id,
        name: user.name || 'Joueur',
        avatar: (user.profilePicture?.startsWith('http') || user.profilePicture?.startsWith('file://'))
          ? { type: 'photo' as const, value: user.profilePicture }
          : { type: 'emoji' as const, value: user.profilePicture || '👤' },
      };

      const gameId = await MorpionService.joinGameByCode(code, playerProfile);

      FeedbackService.success();
      navigation.navigate('morpionLobby', { gameId, boardSize, winCondition });
    } catch (error: any) {
      console.error('Error joining game:', error);
      showAlert({
        title: 'Impossible de rejoindre',
        message: error.message || 'Partie non trouvée',
        type: 'error',
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
              onPress={() => {
                FeedbackService.buttonPress();
                navigation.goBack();
              }}
            >
              <View style={styles.backButtonBlur}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={CurrentTheme.text.primary}
                />
              </View>
            </TouchableOpacity>

            <Text style={styles.title}>Multijoueur En Ligne</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Create Game Card */}
            <View style={styles.optionCard}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="plus-circle" size={48} color={CurrentTheme.romantic.primary} />
              </View>
              <Text style={styles.optionTitle}>Créer une partie</Text>
              <Text style={styles.optionDescription}>
                Créez une nouvelle partie et invitez Orlie avec un code
              </Text>
              <TouchableOpacity
                style={[styles.actionButton, styles.createButton]}
                onPress={handleCreateGame}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Créer une partie</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Join Game Card */}
            <View style={styles.optionCard}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="login" size={48} color={CurrentTheme.romantic.primary} />
              </View>
              <Text style={styles.optionTitle}>Rejoindre une partie</Text>
              <Text style={styles.optionDescription}>
                Entrez le code de partie partagé par Orlie
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="CODE"
                  placeholderTextColor={CurrentTheme.text.tertiary}
                  value={roomCode}
                  onChangeText={(text) => setRoomCode(text.toUpperCase())}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.actionButton, styles.joinButton]}
                onPress={handleJoinGame}
                disabled={isJoining || roomCode.length !== 6}
              >
                {isJoining ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="login" size={24} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Rejoindre</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information" size={24} color={CurrentTheme.romantic.primary} />
              <Text style={styles.infoText}>
                Le mode en ligne vous permet de jouer à distance avec Orlie en temps réel
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
          onClose={hideAlert}
          theme={CurrentTheme}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CurrentTheme.background,
  },
  backgroundImage: {
    flex: 1,
    width: width,
  },
  blurryOverlay: {
    flex: 1,
    backgroundColor: CurrentTheme.glassmorphism.background,
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
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: CurrentTheme.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CurrentTheme.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 15,
    color: CurrentTheme.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: CurrentTheme.text.primary,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    width: '100%',
  },
  createButton: {
    backgroundColor: CurrentTheme.romantic.primary,
  },
  joinButton: {
    backgroundColor: CurrentTheme.romantic.secondary,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: CurrentTheme.text.tertiary,
    marginHorizontal: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 105, 180, 0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: CurrentTheme.text.secondary,
    lineHeight: 20,
  },
});

export default MorpionOnlineScreen;
