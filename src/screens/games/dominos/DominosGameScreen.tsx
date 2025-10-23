import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { DominosService } from '../../../services/dominos/DominosService';
import { DominosGame, DominosPlayer } from '../../../types/dominos.types';
import { getAllPossibleMoves } from '../../../utils/dominosLogic';
import { AvatarDisplay } from '../../../utils/avatarUtils';
import CustomAlert from '../../../components/common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import { DominoBoard } from '../../../components/dominos/DominoBoard';
import { DominoHand } from '../../../components/dominos/DominoHand';
import { useDominosSettings } from '../../../hooks/useDominosSettings';

const { width, height } = Dimensions.get('window');

interface DominosGameScreenProps {
  route: {
    params: {
      gameId: string;
      playerId: string;
    };
  };
}

export const DominosGameScreen: React.FC<DominosGameScreenProps> = ({
  route,
}) => {
  const { gameId, playerId } = route.params;
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [game, setGame] = useState<DominosGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [placementAnim] = useState(new Animated.Value(1));
  const [turnPulseAnim] = useState(new Animated.Value(1));
  const [gameTime, setGameTime] = useState(0);
  const { settings } = useDominosSettings();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const unsubscribe = DominosService.subscribeToGame(
      gameId,
      (updatedGame) => {
        setGame(updatedGame);
        setLoading(false);

        // Navigate to results if game is finished
        if (updatedGame.status === 'finished') {
          navigationTimeoutRef.current = setTimeout(() => {
            navigateToScreen('dominosResults', { gameId, playerId });
          }, 1500);
        }
      },
      (error) => {
        console.error('Error loading dominos game:', error);
        setLoading(false);
        showAlert({
          title: 'Erreur',
          message: 'Impossible de charger la partie',
          type: 'error',
          buttons: [
            {
              text: 'Retour',
              style: 'cancel',
              onPress: () => navigateToScreen('dominosMenu'),
            },
          ],
        });
      }
    );

    return () => {
      unsubscribe();
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [gameId, playerId]);

  // Timer effect
  useEffect(() => {
    if (game?.status === 'playing' && game.startedAt) {
      const interval = setInterval(() => {
        setGameTime(Math.floor((Date.now() - game.startedAt!) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [game?.status, game?.startedAt]);

  // Turn indicator animation
  useEffect(() => {
    if (game?.status === 'playing' && game.currentPlayerId === playerId) {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(turnPulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(turnPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current.start();
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      turnPulseAnim.setValue(1);
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [game?.currentPlayerId, playerId, game?.status]);

  // Auto-placement logic (must be before early returns)
  useEffect(() => {
    if (!game || !selectedTileId || !settings.autoPlaceTile || isProcessing) return;

    const currentPlayer = game.players.find((p) => p.id === playerId);
    if (!currentPlayer) return;

    const isMyTurn = game.currentPlayerId === playerId;
    if (!isMyTurn) return;

    const possibleMoves = getAllPossibleMoves(currentPlayer.hand, game.leftEnd, game.rightEnd);
    const tile = currentPlayer.hand.find((t) => t.id === selectedTileId);

    if (tile) {
      const tileMoves = possibleMoves.filter((m) => m.tileId === selectedTileId);
      if (tileMoves.length === 1) {
        handlePlaceTile(tileMoves[0].side);
      }
    }
  }, [selectedTileId, game, isProcessing, settings.autoPlaceTile, playerId]);

  const handleTileSelect = (tile: any) => {
    if (selectedTileId === tile.id) {
      setSelectedTileId(null);
      setSelectedSide(null);
    } else {
      setSelectedTileId(tile.id);
      setSelectedSide(null);
    }
  };

  const handleTileDragEnd = async (tile: any, dropZone: 'left' | 'right' | 'pass' | null) => {
    if (!dropZone || !game || !isMyTurn || isProcessing) return;

    if (dropZone === 'pass') {
      // User dragged to pass zone
      if (canPass) {
        await handlePassTurn();
      } else if (canDraw) {
        await handleDrawTile();
      }
    } else {
      // User dragged to left or right
      setSelectedTileId(tile.id);
      await handlePlaceTile(dropZone);
    }
  };

  const handlePlaceTile = async (side: 'left' | 'right') => {
    if (!selectedTileId || !game) return;

    setIsProcessing(true);

    // Animation de placement
    const animationDuration =
      settings.animationSpeed === 'fast' ? 150 :
      settings.animationSpeed === 'slow' ? 500 : 300;

    Animated.sequence([
      Animated.timing(placementAnim, {
        toValue: 0.8,
        duration: animationDuration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(placementAnim, {
        toValue: 1,
        duration: animationDuration / 2,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await DominosService.placeTile(gameId, playerId, selectedTileId, side);
      setSelectedTileId(null);
      setSelectedSide(null);
    } catch (error: any) {
      console.error('Error placing tile:', error);
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de placer cette tuile',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrawTile = async () => {
    if (!game) return;

    setIsProcessing(true);
    try {
      await DominosService.drawTile(gameId, playerId);
      // After drawing, check if we now have playable moves
      // The game state will update via subscription, pile will auto-close if moves available
    } catch (error: any) {
      console.error('Error drawing tile:', error);
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de piocher',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePassTurn = async () => {
    if (!game) return;

    const passTurnAction = async () => {
      setIsProcessing(true);
      try {
        await DominosService.passTurn(gameId, playerId);
      } catch (error: any) {
        console.error('Error passing turn:', error);
        showAlert({
          title: 'Erreur',
          message: error.message || 'Impossible de passer',
          type: 'error',
          buttons: [{ text: 'OK', style: 'cancel' }],
        });
      } finally {
        setIsProcessing(false);
      }
    };

    // Vérifier si confirmation requise selon les paramètres
    if (settings.confirmBeforePass) {
      showAlert({
        title: 'Passer votre tour',
        message: 'Êtes-vous sûr de vouloir passer ?',
        type: 'warning',
        buttons: [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Passer',
            style: 'destructive',
            onPress: passTurnAction,
          },
        ],
      });
    } else {
      passTurnAction();
    }
  };

  const handleLeave = () => {
    showAlert({
      title: 'Quitter la partie',
      message: 'Abandonner la partie ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Abandonner',
          style: 'destructive',
          onPress: async () => {
            try {
              await DominosService.leaveGame(gameId, playerId);
              navigateToScreen('dominosMenu');
            } catch (error) {
              console.error('Error leaving game:', error);
            }
          },
        },
      ],
    });
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
            <Text style={styles.errorText}>Partie non trouvée</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  const currentPlayer = game.players.find((p) => p.id === playerId);
  const opponent = game.players.find((p) => p.id !== playerId);
  const isMyTurn = game.currentPlayerId === playerId;
  const possibleMoves = currentPlayer
    ? getAllPossibleMoves(currentPlayer.hand, game.leftEnd, game.rightEnd)
    : [];
  const canDraw = game.drawPileCount > 0 && !currentPlayer?.hasDrawn;
  const canPass =
    possibleMoves.length === 0 &&
    (game.drawPileCount === 0 || currentPlayer?.hasDrawn);

  // Get playable tile IDs for hints
  const playableTileIds = possibleMoves.map((move) => move.tileId);

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
            <TouchableOpacity style={styles.backButton} onPress={handleLeave}>
              <Foundation name="x" size={24} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <View style={styles.centerInfo}>
              <Animated.View
                style={[
                  styles.turnIndicator,
                  isMyTurn && { transform: [{ scale: turnPulseAnim }] },
                ]}
              >
                <Text style={styles.turnText}>
                  {isMyTurn ? '🎯 Votre tour' : '⏳ Tour adverse'}
                </Text>
              </Animated.View>

              {game.status === 'playing' && (
                <Text style={styles.timerText}>
                  {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}
                </Text>
              )}
            </View>

            <View style={styles.rightButtons}>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => {
                  showAlert({
                    title: '📖 Règles du jeu',
                    message:
                      '• 7 tuiles par joueur au début\n' +
                      '• Placer les tuiles bout à bout\n' +
                      '• Les numéros doivent correspondre\n' +
                      '• Premier à poser toutes ses tuiles gagne\n' +
                      '• Si blocage : moins de points gagne\n' +
                      '• Piocher si aucun coup possible\n' +
                      '• Passer si pioche vide et aucun coup',
                    type: 'info',
                    buttons: [{ text: 'Compris', style: 'cancel' }],
                  });
                }}
              >
                <Foundation name="info" size={20} color={currentTheme.text.primary} />
              </TouchableOpacity>

              <View style={styles.drawPileInfo}>
                <Foundation name="layers" size={20} color={currentTheme.text.secondary} />
                <Text style={styles.drawPileText}>{game.drawPileCount}</Text>
              </View>
            </View>
          </View>

          {/* Opponent Info */}
          {opponent && (
            <View style={styles.opponentContainer}>
              <View style={styles.opponentAvatar}>
                <AvatarDisplay
                  avatar={opponent.profile.avatar}
                  imageStyle={styles.opponentAvatarImage}
                  textStyle={styles.opponentAvatarEmoji}
                />
              </View>
              <Text style={styles.opponentName}>{opponent.profile.name}</Text>
              {settings.showOpponentTilesCount && (
                <Text style={styles.opponentTiles}>{opponent.tilesCount} tuiles</Text>
              )}
            </View>
          )}

          {/* Opponent Hand (just show count) - removed to save space */}

          {/* Board */}
          <Animated.View
            style={[
              styles.boardSection,
              { transform: [{ scale: placementAnim }] },
            ]}
          >
            <DominoBoard placements={game.board} currentTheme={currentTheme} />
          </Animated.View>

          {/* Draw Pile - Auto-opens when no moves available */}
          {isMyTurn && canDraw && possibleMoves.length === 0 && (
            <View style={styles.drawPileContainer}>
              <TouchableOpacity
                style={[styles.drawPileButton, { borderColor: currentTheme.romantic.primary }]}
                onPress={handleDrawTile}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={currentTheme.romantic.primary} />
                ) : (
                  <>
                    <Foundation name="layers" size={32} color={currentTheme.romantic.primary} />
                    <Text style={[styles.drawPileButtonText, { color: currentTheme.romantic.primary }]}>
                      Piocher ({game.drawPileCount})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Placement Buttons removed - using drag & drop instead */}

          {/* Player Hand */}
          {currentPlayer && (
            <View style={styles.playerHandContainer}>
              <DominoHand
                tiles={currentPlayer.hand}
                selectedTileId={selectedTileId}
                onSelectTile={handleTileSelect}
                isSelectable={isMyTurn && !isProcessing}
                currentTheme={currentTheme}
                label="Votre main"
                playableTileIds={playableTileIds}
                showHints={settings.showHints && isMyTurn}
                enableDrag={isMyTurn && !isProcessing}
                onTileDragEnd={handleTileDragEnd}
              />
            </View>
          )}

          {/* Actions removed - using auto-pile and drag & drop instead */}
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
      paddingBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.interactive.active,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerInfo: {
      alignItems: 'center',
      gap: 4,
    },
    turnIndicator: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    turnText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.primary,
    },
    timerText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.text.secondary,
    },
    rightButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    helpButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    drawPileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    drawPileText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.primary,
    },
    opponentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    opponentAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.romantic.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    opponentAvatarEmoji: {
      fontSize: 22,
    },
    opponentAvatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    opponentName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.primary,
    },
    opponentTiles: {
      fontSize: 12,
      color: theme.text.secondary,
    },
    opponentHandContainer: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    boardSection: {
      marginHorizontal: 20,
      marginVertical: 12,
    },
    drawPileContainer: {
      alignItems: 'center',
      marginVertical: 16,
    },
    drawPileButton: {
      backgroundColor: 'rgba(25, 25, 35, 0.8)',
      borderRadius: 20,
      borderWidth: 2,
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    drawPileButtonText: {
      fontSize: 16,
      fontWeight: '700',
    },
    placementButtons: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    placementButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.romantic.primary,
      borderRadius: 12,
      paddingVertical: 12,
    },
    leftButton: {},
    rightButton: {},
    placementButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFF',
    },
    playerHandContainer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 12,
      paddingVertical: 14,
    },
    drawButton: {
      backgroundColor: theme.romantic.secondary,
    },
    passButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFF',
    },
    errorText: {
      fontSize: 16,
      color: theme.text.primary,
      textAlign: 'center',
    },
  });

export default DominosGameScreen;
