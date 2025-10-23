import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { DominosService } from '../../../services/dominos/DominosService';
import { DominosStatsService } from '../../../services/dominos/DominosStatsService';
import { DominosGame } from '../../../types/dominos.types';
import { calculateScore } from '../../../utils/dominosLogic';
import { AvatarDisplay } from '../../../utils/avatarUtils';
import CustomAlert from '../../../components/common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface DominosResultsScreenProps {
  route: {
    params: {
      gameId: string;
      playerId: string;
    };
  };
}

export const DominosResultsScreen: React.FC<DominosResultsScreenProps> = ({
  route,
}) => {
  const { gameId, playerId } = route.params;
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [game, setGame] = useState<DominosGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsUpdated, setStatsUpdated] = useState(false);

  useEffect(() => {
    const unsubscribe = DominosService.subscribeToGame(
      gameId,
      (updatedGame) => {
        setGame(updatedGame);
        setLoading(false);

        // Mettre à jour les stats une seule fois
        if (!statsUpdated && updatedGame.status === 'finished' && playerId) {
          DominosStatsService.updateStatsAfterGame(playerId, updatedGame)
            .then(() => setStatsUpdated(true))
            .catch((error) => console.error('Error updating stats:', error));
        }
      },
      (error) => {
        console.error('Error loading game results:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [gameId, playerId, statsUpdated]);

  const handlePlayAgain = () => {
    navigateToScreen('dominosMenu');
  };

  const handleGoHome = () => {
    navigateToScreen('gamesMenu');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ImageBackground
          source={getBackgroundSource(user)}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.blurryOverlay}>
            <ActivityIndicator size="large" color={currentTheme.romantic.primary} />
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ImageBackground
          source={getBackgroundSource(user)}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.blurryOverlay}>
            <Text style={styles.errorText}>Résultats non disponibles</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  const winner = game.players.find((p) => p.id === game.winnerId);
  const isWinner = game.winnerId === playerId;
  const currentPlayer = game.players.find((p) => p.id === playerId);
  const opponent = game.players.find((p) => p.id !== playerId);

  const getWinReasonText = () => {
    const gameTime = game.completedAt && game.startedAt
      ? Math.floor((game.completedAt - game.startedAt) / 1000)
      : 0;
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;

    switch (game.winReason) {
      case 'emptied_hand':
        if (isWinner) {
          return minutes > 5
            ? `Victoire écrasante ! Vous avez posé toutes vos tuiles en ${minutes} minutes`
            : `Victoire rapide ! Toutes vos tuiles posées en seulement ${minutes}:${seconds.toString().padStart(2, '0')} !`;
        }
        return `${winner?.profile.name} a posé toutes ses tuiles avant vous...`;
      case 'lowest_score':
        if (isWinner) {
          return player1Score < 5
            ? 'Victoire stratégique ! Presque aucun point restant !'
            : `Jeu bloqué - Victoire au score (${player1Score} points)`;
        }
        return `Jeu bloqué - ${winner?.profile.name} avait moins de points`;
      case 'opponent_left':
        return "Victoire par forfait - Votre adversaire a quitté";
      default:
        return 'Partie terminée';
    }
  };

  const player1Score = currentPlayer ? calculateScore(currentPlayer.hand) : 0;
  const player2Score = opponent ? calculateScore(opponent.hand) : 0;

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
            <Text style={styles.title}>Résultats</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Winner Announcement */}
            <View style={styles.winnerContainer}>
              <Text style={styles.resultEmoji}>{isWinner ? '🏆' : '😊'}</Text>
              <Text style={styles.resultTitle}>
                {isWinner ? 'Victoire !' : 'Défaite'}
              </Text>
              <Text style={styles.winReason}>{getWinReasonText()}</Text>
            </View>

            {/* Winner Card */}
            {winner && (
              <View style={[styles.playerResultCard, styles.winnerCard]}>
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerBadgeText}>👑 Gagnant</Text>
                </View>
                <View style={styles.winnerAvatar}>
                  <AvatarDisplay
                    avatar={winner.profile.avatar}
                    imageStyle={styles.winnerAvatarImage}
                    textStyle={styles.winnerAvatarEmoji}
                  />
                </View>
                <Text style={styles.playerResultName}>{winner.profile.name}</Text>
                <Text style={styles.playerScore}>
                  Score: {winner.id === currentPlayer?.id ? player1Score : player2Score} points
                </Text>
                <Text style={styles.playerTiles}>
                  {winner.hand.length} tuiles restantes
                </Text>
              </View>
            )}

            {/* Scores Summary */}
            <View style={styles.scoresContainer}>
              <Text style={styles.scoresTitle}>Récapitulatif</Text>

              {currentPlayer && (
                <View style={styles.scoreRow}>
                  <View style={styles.scorePlayerInfo}>
                    <View style={styles.scoreAvatar}>
                      <AvatarDisplay
                        avatar={currentPlayer.profile.avatar}
                        imageStyle={styles.scoreAvatarImage}
                        textStyle={styles.scoreAvatarEmoji}
                      />
                    </View>
                    <Text style={styles.scorePlayerName}>
                      {currentPlayer.profile.name}
                    </Text>
                  </View>
                  <View style={styles.scoreValues}>
                    <Text style={styles.scoreText}>{player1Score} pts</Text>
                    <Text style={styles.tilesText}>{currentPlayer.hand.length} tuiles</Text>
                  </View>
                </View>
              )}

              {opponent && (
                <View style={styles.scoreRow}>
                  <View style={styles.scorePlayerInfo}>
                    <View style={styles.scoreAvatar}>
                      <AvatarDisplay
                        avatar={opponent.profile.avatar}
                        imageStyle={styles.scoreAvatarImage}
                        textStyle={styles.scoreAvatarEmoji}
                      />
                    </View>
                    <Text style={styles.scorePlayerName}>{opponent.profile.name}</Text>
                  </View>
                  <View style={styles.scoreValues}>
                    <Text style={styles.scoreText}>{player2Score} pts</Text>
                    <Text style={styles.tilesText}>{opponent.hand.length} tuiles</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Game Stats */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Statistiques</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{game.board.length}</Text>
                  <Text style={styles.statLabel}>Tuiles jouées</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{game.drawPileCount}</Text>
                  <Text style={styles.statLabel}>Pioche restante</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {game.startedAt && game.completedAt
                      ? Math.round((game.completedAt - game.startedAt) / 60000)
                      : 0}
                  </Text>
                  <Text style={styles.statLabel}>Minutes</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[styles.button, styles.playAgainButton]}
              onPress={handlePlayAgain}
            >
              <Foundation name="refresh" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Rejouer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.homeButton]}
              onPress={handleGoHome}
            >
              <Foundation name="home" size={24} color={currentTheme.romantic.primary} />
              <Text style={[styles.buttonText, { color: currentTheme.romantic.primary }]}>
                Menu des jeux
              </Text>
            </TouchableOpacity>
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
      alignItems: 'center',
      paddingBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    winnerContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    resultEmoji: {
      fontSize: 64,
      marginBottom: 16,
    },
    resultTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 8,
    },
    winReason: {
      fontSize: 14,
      color: theme.text.secondary,
      textAlign: 'center',
    },
    playerResultCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
    },
    winnerCard: {
      borderWidth: 2,
      borderColor: theme.romantic.primary,
    },
    winnerBadge: {
      backgroundColor: theme.romantic.primary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 6,
      marginBottom: 16,
    },
    winnerBadgeText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFF',
    },
    winnerAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    winnerAvatarEmoji: {
      fontSize: 44,
    },
    winnerAvatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    playerResultName: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text.primary,
      marginTop: 12,
    },
    playerScore: {
      fontSize: 16,
      color: theme.text.secondary,
      marginTop: 8,
    },
    playerTiles: {
      fontSize: 14,
      color: theme.text.secondary,
      marginTop: 4,
    },
    scoresContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    scoresTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 16,
    },
    scoreRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    scorePlayerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    scoreAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scoreAvatarEmoji: {
      fontSize: 22,
    },
    scoreAvatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    scorePlayerName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
    },
    scoreValues: {
      alignItems: 'flex-end',
    },
    scoreText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text.primary,
    },
    tilesText: {
      fontSize: 12,
      color: theme.text.secondary,
      marginTop: 2,
    },
    statsContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.romantic.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.text.secondary,
      marginTop: 4,
    },
    bottomContainer: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 12,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      borderRadius: 16,
      padding: 18,
    },
    playAgainButton: {
      backgroundColor: theme.romantic.primary,
    },
    homeButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 2,
      borderColor: theme.romantic.primary,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFF',
    },
    errorText: {
      fontSize: 16,
      color: theme.text.primary,
      textAlign: 'center',
    },
  });

export default DominosResultsScreen;
