import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { WORD_SEARCH_COLORS } from '../../data/constants/colors';
import { CooperativeGame, CooperativePlayer } from '../../types/cooperativeGame.types';
import { Cell } from '../../types/wordSearch.types';
import { CooperativeGameService } from '../../services/multiplayer/CooperativeGameService';
import WordSearchGrid from '../../components/wordsearch/core/WordSearchGrid';
import PlayerCursors from '../../components/wordsearch/cooperative/PlayerCursors';
import ActiveSelections from '../../components/wordsearch/cooperative/ActiveSelections';
import { usePreferences } from '../../hooks/storage/usePreferences';
import { AvatarDisplay } from '../../utils/avatarUtils';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import SoundService from '../../services/SoundService';

interface CooperativeGameScreenProps {
  gameId: string | null;
  playerId: string;
  onExit: () => void;
  onGameComplete: (result: any) => void;
}

const CooperativeGameScreen: React.FC<CooperativeGameScreenProps> = ({
  gameId,
  playerId,
  onExit,
  onGameComplete,
}) => {
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [game, setGame] = useState<CooperativeGame | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previousPlayerCount, setPreviousPlayerCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { currentTheme } = usePreferences();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start background music when component mounts
  useEffect(() => {
    SoundService.startGameMusic('wordsearch');
    return () => {
      SoundService.stopBackgroundMusic();
    };
  }, []);

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = CooperativeGameService.subscribeToGame(
      gameId,
      (updatedGame) => {
        console.log('Game updated:', {
          hasGrid: !!updatedGame.grid,
          hasCells: !!updatedGame.grid?.cells,
          cellsIsArray: Array.isArray(updatedGame.grid?.cells),
          firstCellIsArray: Array.isArray(updatedGame.grid?.cells?.[0]),
          gridSize: updatedGame.grid?.size,
        });

        // Detect player leaving
        if (previousPlayerCount > 0 && updatedGame.players.length < previousPlayerCount) {
          const leavingPlayerCount = previousPlayerCount - updatedGame.players.length;
          showAlert({
            title: '👋 Joueur parti',
            message: `${leavingPlayerCount} joueur${leavingPlayerCount > 1 ? 's ont' : ' a'} quitté la partie.`,
            type: 'info',
            buttons: [
              {
                text: updatedGame.status === 'waiting' ? 'Retour au lobby' : 'Continuer',
                onPress: () => {
                  if (updatedGame.status === 'waiting') {
                    // Could navigate back to lobby here
                  }
                },
              },
            ],
          });
        }

        setPreviousPlayerCount(updatedGame.players.length);
        setGame(updatedGame);
        setTimeRemaining(updatedGame.timeRemaining);
        setLoading(false);
        setIsReconnecting(false);

        // Check if game is completed
        if (updatedGame.status === 'completed') {
          handleGameCompleted(updatedGame);
        }
      },
      (error) => {
        console.error('Erreur lors de la souscription au jeu:', error);

        // Try to reconnect instead of exiting immediately
        setIsReconnecting(true);

        // Retry after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isReconnecting) {
            showAlert({
              title: 'Connexion perdue',
              message: 'Impossible de se reconnecter au jeu. Voulez-vous réessayer?',
              type: 'error',
              buttons: [
                { text: 'Quitter', style: 'destructive', onPress: onExit },
                { text: 'Réessayer', onPress: () => window.location.reload() },
              ],
            });
          }
        }, 3000);
      }
    );

    return () => {
      unsubscribe();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [gameId]);

  // Timer countdown
  useEffect(() => {
    if (!game || game.status !== 'playing') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game?.status]);

  const handleTimeUp = () => {
    if (!game) return;

    showAlert({
      title: '⏱️ Temps écoulé',
      message: `Vous avez trouvé ${game.wordsFound.length}/${game.words.length} mots ensemble.`,
      type: 'warning',
      buttons: [{ text: 'OK', onPress: () => onExit() }],
    });
  };

  const handleGameCompleted = (completedGame: CooperativeGame) => {
    const totalScore = completedGame.players.reduce((sum, p) => sum + p.score, 0);
    const timeElapsed = completedGame.timeLimit - completedGame.timeRemaining;

    // Play victory sound
    SoundService.playGameWin();

    onGameComplete({
      success: true,
      time: timeElapsed,
      totalScore,
      wordsFound: completedGame.wordsFound.length,
      totalWords: completedGame.words.length,
    });
  };

  const handleSelectionComplete = useCallback(async (selectedCells: Cell[]) => {
    if (!game || selectedCells.length === 0) return;

    // Extract selected word
    const selectedWord = selectedCells.map((cell) => cell.letter).join('');

    // Try to submit word
    const isValid = await CooperativeGameService.submitWord(
      gameId!,
      playerId,
      selectedWord,
      selectedCells
    );

    if (isValid) {
      // Play word found sound
      SoundService.playWordFound();
    } else {
      // Invalid word - could show feedback here
      console.log('Mot invalide:', selectedWord);
    }
  }, [game, gameId, playerId]);

  const handleExit = () => {
    showAlert({
      title: 'Quitter la partie',
      message: 'Êtes-vous sûr de vouloir quitter ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            if (gameId) {
              await CooperativeGameService.leaveGame(gameId, playerId);
            }
            onExit();
          },
        },
      ],
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPlayer = game?.players.find((p) => p.id === playerId);

  if (loading || !game || !game.grid || !game.grid.cells || !Array.isArray(game.grid.cells[0])) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement de la partie...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Reconnection Banner */}
        {isReconnecting && (
          <View style={styles.reconnectingBanner}>
            <Text style={styles.reconnectingText}>🔄 Reconnexion en cours...</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
            <Text style={styles.exitButtonText}>← Quitter</Text>
          </TouchableOpacity>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>

          <View style={styles.placeholder} />
        </View>

        {/* Score Board */}
        <View style={styles.scoreBoard}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Mots trouvés</Text>
            <Text style={styles.scoreValue}>
              {game.wordsFound.length}/{game.words.length}
            </Text>
          </View>

          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Score total</Text>
            <Text style={styles.scoreValue}>
              {game.players.reduce((sum, p) => sum + p.score, 0)}
            </Text>
          </View>
        </View>

        {/* Players List */}
        <View style={styles.playersContainer}>
          {game.players.map((player) => {
            const color = CooperativeGameService.getPlayerColor(player.id, game.players);
            return (
              <View
                key={player.id}
                style={[
                  styles.playerCard,
                  player.id === playerId && styles.currentPlayerCard,
                ]}
              >
                <View style={[styles.playerColorIndicator, { backgroundColor: color }]} />
                <AvatarDisplay
                  avatar={player.profile.avatar}
                  photoURL={player.profile.photoURL}
                  imageStyle={styles.playerAvatarImage}
                  textStyle={styles.playerAvatar}
                />
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.profile.name}
                  </Text>
                  <Text style={styles.playerScore}>{player.score} pts</Text>
                </View>
                <Text style={styles.playerWords}>{player.wordsFound.length} 🎯</Text>
              </View>
            );
          })}
        </View>

        {/* Word Search Grid */}
        <View style={styles.gridContainer}>
          <WordSearchGrid
            grid={game.grid}
            onSelectionComplete={handleSelectionComplete}
            disabled={game.status !== 'playing'}
            theme={currentTheme}
          />

          {/* Overlay for real-time features */}
          <PlayerCursors players={game.players} currentPlayerId={playerId} gridSize={game.grid.size} />
          <ActiveSelections game={game} currentPlayerId={playerId} cellSize={30} gridSize={game.grid.size} />
        </View>

        {/* Word List */}
        <View style={styles.wordListContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.wordListContent}
          >
            {game.words.map((word, index) => {
              const found = game.wordsFound.includes(word);
              return (
                <View
                  key={index}
                  style={[styles.wordChip, found && styles.wordChipFound]}
                >
                  <Text style={[styles.wordText, found && styles.wordTextFound]}>
                    {word}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
      <CustomAlert
        visible={isVisible}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
        buttons={alertConfig?.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WORD_SEARCH_COLORS.background,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: WORD_SEARCH_COLORS.textPrimary,
    fontWeight: '600',
  },
  reconnectingBanner: {
    backgroundColor: '#FFA500',
    padding: 8,
    alignItems: 'center',
  },
  reconnectingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  exitButton: {
    flex: 1,
  },
  exitButtonText: {
    fontSize: 16,
    color: WORD_SEARCH_COLORS.primary,
    fontWeight: '600',
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  placeholder: {
    flex: 1,
  },
  scoreBoard: {
    flexDirection: 'row',
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 20,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.primary,
  },
  playersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  playerCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 10,
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentPlayerCard: {
    borderColor: WORD_SEARCH_COLORS.primary,
  },
  playerColorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  playerAvatar: {
    fontSize: 24,
    marginRight: 8,
  },
  playerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: WORD_SEARCH_COLORS.background,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  playerScore: {
    fontSize: 10,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  playerWords: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    fontWeight: '600',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  wordListContainer: {
    height: 80,
  },
  wordListContent: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  wordChip: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: WORD_SEARCH_COLORS.cardBg,
    marginRight: 8,
  },
  wordChipFound: {
    backgroundColor: WORD_SEARCH_COLORS.success + '20',
    borderColor: WORD_SEARCH_COLORS.success,
  },
  wordText: {
    fontSize: 12,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  wordTextFound: {
    color: WORD_SEARCH_COLORS.success,
    textDecorationLine: 'line-through',
  },
});

export default CooperativeGameScreen;
