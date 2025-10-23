import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { MultiplayerGame, MultiplayerPlayer, Word } from '../../types/wordSearch.types';
import { MultiplayerService } from '../../services/multiplayer/MultiplayerService';
import { WORD_SEARCH_COLORS } from '../../data/constants/colors';
import WordSearchGrid from '../../components/wordsearch/core/WordSearchGrid';
import WordList from '../../components/wordsearch/core/WordList';
import WordFoundAnimation from '../../components/wordsearch/animations/WordFoundAnimation';
import { AvatarDisplay } from '../../utils/avatarUtils';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import SoundService from '../../services/SoundService';

interface MultiplayerGameScreenProps {
  gameId: string;
  playerId: string;
  onExit: () => void;
  onGameComplete: (result: any) => void;
}

const MultiplayerGameScreen: React.FC<MultiplayerGameScreenProps> = ({
  gameId,
  playerId,
  onExit,
  onGameComplete,
}) => {
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [game, setGame] = useState<MultiplayerGame | null>(null);
  const [selectedCells, setSelectedCells] = useState<any[]>([]);
  const [foundWordAnimation, setFoundWordAnimation] = useState<string | null>(null);
  const [finderName, setFinderName] = useState<string>('');
  const [previousPlayerCount, setPreviousPlayerCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const gameFinishedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownGameOverRef = useRef(false);

  // Start background music when component mounts
  useEffect(() => {
    SoundService.startGameMusic('wordsearch');
    return () => {
      SoundService.stopBackgroundMusic();
    };
  }, []);

  // Helper pour reconstruire la grille 2D depuis le tableau aplati
  const reconstructGrid = (flatCells: any[], gridSize: number) => {
    const cells2D: any[][] = [];
    for (let i = 0; i < gridSize; i++) {
      cells2D[i] = flatCells.slice(i * gridSize, (i + 1) * gridSize);
    }
    return cells2D;
  };

  useEffect(() => {
    // Subscribe to game updates
    const unsubscribe = MultiplayerService.subscribeToGame(
      gameId,
      (updatedGame) => {
        // Reconstruire la grille 2D si les cells sont aplaties
        if (updatedGame.grid && Array.isArray(updatedGame.grid.cells) && updatedGame.grid.cells.length > 0) {
          // Vérifier si c'est un tableau aplati (premier élément n'est pas un tableau)
          if (!Array.isArray(updatedGame.grid.cells[0])) {
            updatedGame.grid.cells = reconstructGrid(updatedGame.grid.cells, updatedGame.grid.size);
          }
        }

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
        setIsReconnecting(false);

        // Check if game is finished (show alert only once)
        if (updatedGame.status === 'finished' && updatedGame.winnerId && !hasShownGameOverRef.current) {
          hasShownGameOverRef.current = true;
          const winner = updatedGame.players.find(p => p.id === updatedGame.winnerId);

          // Play victory or defeat sound
          if (updatedGame.winnerId === playerId) {
            SoundService.playGameWin();
          } else {
            SoundService.playGameEnd();
          }

          gameFinishedTimeoutRef.current = setTimeout(() => {
            showAlert({
              title: 'Partie terminée !',
              message: `${winner?.profile.name || 'Un joueur'} a gagné !`,
              type: 'success',
              buttons: [{ text: 'OK', onPress: () => onGameComplete({ winner }) }],
            });
          }, 1000);
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
      if (gameFinishedTimeoutRef.current) {
        clearTimeout(gameFinishedTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [gameId, onGameComplete, previousPlayerCount, isReconnecting, onExit]);

  const handleSelectionComplete = async (cells: any[]) => {
    if (!game || game.status !== 'playing') return;

    // Validate selection against words
    const selectedWord = cells.map(c => c.letter).join('');
    const foundWord = game.grid.words.find(
      w => !w.found && w.text === selectedWord
    );

    if (foundWord) {
      try {
        // Play word found sound
        SoundService.playWordFound();

        // Show animation immediately
        const currentPlayer = game.players.find(p => p.id === playerId);
        setFoundWordAnimation(foundWord.text);
        setFinderName(currentPlayer?.profile.name || 'Vous');

        // Calculate updated words found and score
        const foundWords = [...(currentPlayer?.wordsFound || []), foundWord.text];
        const newScore = (currentPlayer?.score || 0) + 100;

        // Update in Firestore
        await MultiplayerService.updatePlayerProgress(
          gameId,
          playerId,
          foundWords,
          newScore
        );

        // Check if all words are found
        const allWords = game.grid.words.filter(w => !w.isBonus);

        if (foundWords.length === allWords.length) {
          // This player found all words first - they win!
          await MultiplayerService.finishGame(gameId, playerId);
        }
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }

    setSelectedCells([]);
  };

  const handleLeaveGame = () => {
    showAlert({
      title: 'Quitter la partie ?',
      message: 'Êtes-vous sûr de vouloir quitter cette partie multijoueur ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await MultiplayerService.leaveLobby(gameId, playerId);
              onExit();
            } catch (error) {
              console.error('Error leaving game:', error);
              onExit();
            }
          },
        },
      ],
    });
  };

  if (!game) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement de la partie...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentPlayer = game.players.find(p => p.id === playerId);
  const otherPlayers = game.players.filter(p => p.id !== playerId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Reconnection Banner */}
        {isReconnecting && (
          <View style={styles.reconnectingBanner}>
            <Text style={styles.reconnectingText}>🔄 Reconnexion en cours...</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleLeaveGame}>
            <Text style={styles.backButtonText}>← Quitter</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.gameTitle}>Partie Multijoueur</Text>
            <Text style={styles.gameCode}>Code: {gameId.slice(-6).toUpperCase()}</Text>
          </View>

          <View style={styles.placeholder} />
        </View>

        {/* Players Scores */}
        <View style={styles.playersContainer}>
          {/* Current Player */}
          <View style={[styles.playerCard, styles.currentPlayerCard]}>
            <AvatarDisplay
              avatar={currentPlayer?.profile.avatar || { type: 'emoji', value: '👤' }}
              photoURL={currentPlayer?.profile.photoURL}
              imageStyle={styles.playerAvatarImage}
              textStyle={styles.playerAvatar}
            />
            <Text style={styles.playerName}>Vous</Text>
            <Text style={styles.playerScore}>{currentPlayer?.score || 0}</Text>
            <Text style={styles.playerWordsCount}>
              {currentPlayer?.wordsFound.length || 0}/{game.grid.words.filter(w => !w.isBonus).length} mots
            </Text>
          </View>

          {/* Other Players */}
          {otherPlayers.map(player => (
            <View key={player.id} style={styles.playerCard}>
              <AvatarDisplay
                avatar={player.profile.avatar}
                photoURL={player.profile.photoURL}
                imageStyle={styles.playerAvatarImage}
                textStyle={styles.playerAvatar}
              />
              <Text style={styles.playerName}>{player.profile.name}</Text>
              <Text style={styles.playerScore}>{player.score}</Text>
              <Text style={styles.playerWordsCount}>
                {player.wordsFound.length}/{game.grid.words.filter(w => !w.isBonus).length} mots
              </Text>
              {!player.isConnected && (
                <Text style={styles.disconnectedBadge}>Déconnecté</Text>
              )}
            </View>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.gridContainer}>
          <WordSearchGrid
            grid={game.grid}
            onSelectionComplete={handleSelectionComplete}
            disabled={game.status !== 'playing'}
          />

          {/* Word Found Animation */}
          {foundWordAnimation && (
            <WordFoundAnimation
              word={foundWordAnimation}
              isBonus={false}
              onComplete={() => {
                setFoundWordAnimation(null);
                setFinderName('');
              }}
            />
          )}
        </View>

        {/* Word List - Show which words are found and by whom */}
        <View style={styles.wordListContainer}>
          <Text style={styles.wordListTitle}>Mots à Trouver</Text>
          <View style={styles.wordGrid}>
            {game.grid.words
              .filter(w => !w.isBonus)
              .map((word, index) => {
                // Find who found this word
                const finder = game.players.find(p =>
                  p.wordsFound.includes(word.text)
                );

                return (
                  <View
                    key={index}
                    style={[
                      styles.wordChip,
                      finder && styles.wordChipFound,
                      finder?.id === playerId && styles.wordChipFoundByMe,
                    ]}
                  >
                    <Text
                      style={[
                        styles.wordChipText,
                        finder && styles.wordChipTextFound,
                      ]}
                    >
                      {word.text}
                    </Text>
                    {finder && (
                      <View style={styles.wordFinderBadge}>
                        {finder.id === playerId ? (
                          <Text style={styles.wordFinderText}>✓</Text>
                        ) : (
                          <AvatarDisplay
                            avatar={finder.profile.avatar}
                            photoURL={finder.profile.photoURL}
                            imageStyle={styles.wordFinderAvatar}
                            textStyle={styles.wordFinderText}
                          />
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        </View>

        {/* Game Status */}
        {game.status === 'finished' && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverTitle}>Partie Terminée !</Text>
            <Text style={styles.gameOverText}>
              {game.winnerId === playerId ? '🎉 Vous avez gagné !' : '😔 Vous avez perdu'}
            </Text>
          </View>
        )}
      </ScrollView>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WORD_SEARCH_COLORS.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: WORD_SEARCH_COLORS.primary,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  gameCode: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    width: 60,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    gap: 8,
  },
  playerCard: {
    flex: 1,
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentPlayerCard: {
    borderColor: WORD_SEARCH_COLORS.primary,
  },
  playerAvatar: {
    fontSize: 32,
    marginBottom: 4,
  },
  playerAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
    backgroundColor: WORD_SEARCH_COLORS.background,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 4,
  },
  playerScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.primary,
    marginBottom: 2,
  },
  playerWordsCount: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  disconnectedBadge: {
    fontSize: 10,
    color: WORD_SEARCH_COLORS.error,
    marginTop: 4,
  },
  gridContainer: {
    marginVertical: 16,
  },
  wordListContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  wordListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 12,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: WORD_SEARCH_COLORS.cellBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wordChipFound: {
    backgroundColor: WORD_SEARCH_COLORS.cellFoundPrimary,
    borderColor: WORD_SEARCH_COLORS.primary,
  },
  wordChipFoundByMe: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
  },
  wordChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  wordChipTextFound: {
    color: WORD_SEARCH_COLORS.textWhite,
    textDecorationLine: 'line-through',
  },
  wordFinderBadge: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordFinderText: {
    fontSize: 12,
  },
  wordFinderAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  gameOverContainer: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  gameOverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 8,
  },
  gameOverText: {
    fontSize: 18,
    color: WORD_SEARCH_COLORS.textSecondary,
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
});

export default MultiplayerGameScreen;
