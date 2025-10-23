import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { DominosService } from '../../../services/dominos/DominosService';
import { PlayerProfile } from '../../../types/wordSearch.types';
import CustomAlert from '../../../components/common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import auth from '@react-native-firebase/auth';

const { width, height } = Dimensions.get('window');

export const DominosMenuScreen: React.FC<any> = ({ navigation }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGame = async () => {
    console.log('handleCreateGame called, user:', user);
    if (!user || !user.id) {
      console.log('No user or id, returning');
      return;
    }

    setLoading(true);
    try {
      // Ensure user is authenticated
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('User not authenticated, signing in anonymously...');
        await auth().signInAnonymously();
        console.log('Anonymous sign-in successful');
      }

      const playerProfile: PlayerProfile = {
        id: user.id,
        name: user.name || 'Joueur',
        avatar: {
          type: (user.profilePicture?.startsWith('http') || user.profilePicture?.startsWith('file://') ? 'photo' : 'emoji') as 'emoji' | 'photo',
          value: user.profilePicture || '👤',
        },
        level: 1,
        xp: 0,
        coins: 0,
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          totalScore: 0,
          bestScore: 0,
          winStreak: 0,
          bestWinStreak: 0,
        },
        unlockedThemes: [],
        unlockedAvatars: [],
        completedLevels: [],
        powerUps: {
          hint: 0,
          shuffle: 0,
          freeze: 0,
        },
        createdAt: Date.now(),
      };

      console.log('Creating dominos game with profile:', playerProfile);
      const gameId = await DominosService.createGame(playerProfile);
      navigateToScreen('dominosLobby' as any, { gameId, playerId: user.id });
    } catch (error: any) {
      console.error('Error creating dominos game:', error);
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de créer la partie',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!user || !roomCode.trim()) {
      showAlert({
        title: 'Code requis',
        message: 'Veuillez entrer un code de salle',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
      return;
    }

    setLoading(true);
    try {
      // Ensure user is authenticated
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('User not authenticated, signing in anonymously...');
        await auth().signInAnonymously();
        console.log('Anonymous sign-in successful');
      }

      const playerProfile: PlayerProfile = {
        id: user.id,
        name: user.name || 'Joueur',
        avatar: {
          type: (user.profilePicture?.startsWith('http') || user.profilePicture?.startsWith('file://') ? 'photo' : 'emoji') as 'emoji' | 'photo',
          value: user.profilePicture || '👤',
        },
        level: 1,
        xp: 0,
        coins: 0,
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          totalScore: 0,
          bestScore: 0,
          winStreak: 0,
          bestWinStreak: 0,
        },
        unlockedThemes: [],
        unlockedAvatars: [],
        completedLevels: [],
        powerUps: {
          hint: 0,
          shuffle: 0,
          freeze: 0,
        },
        createdAt: Date.now(),
      };

      const gameId = await DominosService.joinGameByCode(
        roomCode.toUpperCase(),
        playerProfile
      );
      navigateToScreen('dominosLobby' as any, { gameId, playerId: user.id });
    } catch (error: any) {
      console.error('Error joining dominos game:', error);
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de rejoindre la partie',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
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
              onPress={() => navigateToScreen('gamesMenu')}
            >
              <Foundation name="arrow-left" size={24} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Dominos</Text>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigateToScreen('dominosSettings')}
            >
              <Foundation name="widget" size={24} color={currentTheme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Game Icon */}
            <View style={styles.iconContainer}>
              <Foundation name="puzzle" size={80} color={currentTheme.romantic.primary} />
              <Text style={styles.subtitle}>Jeu de Dominos classique</Text>
              <Text style={styles.description}>
                2 joueurs • 28 tuiles • Double-six
              </Text>
            </View>

            {/* Create Game Button */}
            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreateGame}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Foundation name="plus" size={24} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Créer une partie</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Join Game Section */}
            <View style={styles.joinSection}>
              <Text style={styles.joinLabel}>Rejoindre une partie</Text>
              <View style={styles.joinInputContainer}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="Code de salle"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={roomCode}
                  onChangeText={setRoomCode}
                  autoCapitalize="characters"
                  maxLength={6}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={[styles.joinButton, !roomCode.trim() && styles.joinButtonDisabled]}
                  onPress={handleJoinGame}
                  disabled={loading || !roomCode.trim()}
                >
                  <Foundation name="play" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Rules */}
            <View style={styles.rulesContainer}>
              <Text style={styles.rulesTitle}>📖 Règles du jeu</Text>
              <Text style={styles.rulesText}>
                • 7 tuiles par joueur au début{'\n'}
                • Placer les tuiles bout à bout{'\n'}
                • Les numéros doivent correspondre{'\n'}
                • Premier à poser toutes ses tuiles gagne{'\n'}
                • Si blocage : moins de points gagne
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
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
          theme={currentTheme}
        />
      )}
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
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text.primary,
      marginTop: 16,
    },
    description: {
      fontSize: 14,
      color: theme.text.secondary,
      marginTop: 8,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      borderRadius: 16,
      padding: 18,
      marginBottom: 24,
    },
    createButton: {
      backgroundColor: theme.romantic.primary,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    joinSection: {
      marginBottom: 24,
    },
    joinLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 12,
    },
    joinInputContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    codeInput: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      padding: 16,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text.primary,
      textAlign: 'center',
      letterSpacing: 4,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    joinButton: {
      width: 60,
      backgroundColor: theme.romantic.secondary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    joinButtonDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    rulesContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    rulesTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 12,
    },
    rulesText: {
      fontSize: 14,
      color: theme.text.secondary,
      lineHeight: 22,
    },
  });

export default DominosMenuScreen;
