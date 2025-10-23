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
  Animated,
} from 'react-native';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { DominosService } from '../../../services/dominos/DominosService';
import { DominosGame, DominoTile } from '../../../types/dominos.types';
import { getAllPossibleMoves } from '../../../utils/dominosLogic';
import Foundation from 'react-native-vector-icons/Foundation';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import CustomAlert from '../../../components/common/CustomAlert';
import { DominoTile3D } from '../../../components/dominos/DominoTile3D';
import SoundService from '../../../services/SoundService';

const { width, height } = Dimensions.get('window');

interface DominosGameLandscapeScreenProps {
  route: {
    params: {
      gameId: string;
      playerId: string;
    };
  };
}

export const DominosGameLandscapeScreen: React.FC<DominosGameLandscapeScreenProps> = ({
  route,
}) => {
  const { gameId, playerId } = route.params;
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [game, setGame] = useState<DominosGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  // Start background music when entering game
  useEffect(() => {
    SoundService.startGameMusic('dominos');

    return () => {
      SoundService.stopGameMusic();
    };
  }, []);

  const hasShownStartMessage = React.useRef(false);

  useEffect(() => {
    const unsubscribe = DominosService.subscribeToGame(
      gameId,
      (updatedGame) => {
        // Show starting tile message only once
        if (!hasShownStartMessage.current && !game && updatedGame.board.length > 0) {
          const firstTile = updatedGame.board[0].tile;
          if (firstTile.left === firstTile.right) {
            // It's a double
            hasShownStartMessage.current = true;
            showAlert({
              title: '🎲 Partie lancée',
              message: `Le double-${firstTile.left} a été placé au centre pour commencer!`,
              type: 'success',
              buttons: [{ text: 'OK', style: 'cancel' }],
            });
          }
        }
        setGame(updatedGame);
        setLoading(false);
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
    };
  }, [gameId, playerId]);

  const handleTileSelect = (tile: DominoTile) => {
    if (!isMyTurn || isProcessing) {
      console.log('Cannot select tile: not my turn or processing');
      SoundService.playInvalidMove();
      return;
    }

    console.log('Tile selected:', tile.id, 'Values:', tile.left, tile.right);
    // Just select the tile, validation will happen when placing
    setSelectedTileId(tile.id);
    SoundService.playTileSelect();
  };

  const handlePlaceTile = async (side: 'left' | 'right') => {
    if (!selectedTileId || !game || isProcessing) {
      console.log('Cannot place tile:', { selectedTileId, hasGame: !!game, isProcessing });
      return;
    }

    console.log('Placing tile:', selectedTileId, 'on side:', side, 'Board length:', game.board.length);
    setIsProcessing(true);
    try {
      // For first tile, side doesn't matter, always use 'left'
      const actualSide = game.board.length === 0 ? 'left' : side;
      console.log('Actual side:', actualSide);
      await DominosService.placeTile(gameId, playerId, selectedTileId, actualSide);
      console.log('Tile placed successfully!');
      SoundService.playTilePlace();
      setSelectedTileId(null);
    } catch (error: any) {
      console.error('Error placing tile:', error);
      SoundService.playInvalidMove();
      showAlert({
        title: 'Coup invalide',
        message: error.message || 'Impossible de placer cette tuile ici',
        type: 'error',
        buttons: [{ text: 'OK', style: 'cancel' }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrawOrPass = async () => {
    if (!game || isProcessing) return;

    setIsProcessing(true);
    try {
      const currentPlayer = game.players.find((p) => p.id === playerId);
      if (!currentPlayer) return;

      const possibleMoves = getAllPossibleMoves(currentPlayer.hand, game.leftEnd, game.rightEnd);
      const canDraw = game.drawPileCount > 0;

      if (possibleMoves.length === 0 && canDraw) {
        // Draw a tile
        await DominosService.drawTile(gameId, playerId);
        SoundService.playTileSelect();
      } else if (possibleMoves.length === 0 && !canDraw) {
        // Pass turn
        await DominosService.passTurn(gameId, playerId);
        SoundService.haptic('medium');
      } else {
        // Has moves, cannot pass
        SoundService.playInvalidMove();
        showAlert({
          title: 'Impossible',
          message: 'Vous avez des coups possibles, vous ne pouvez pas passer',
          type: 'warning',
          buttons: [{ text: 'OK', style: 'cancel' }],
        });
      }
    } catch (error) {
      console.error('Error during draw/pass:', error);
      SoundService.playInvalidMove();
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-draw when no moves available
  useEffect(() => {
    if (!game || !isMyTurn || isProcessing) return;

    const currentPlayer = game.players.find((p) => p.id === playerId);
    if (!currentPlayer) return;

    const possibleMoves = getAllPossibleMoves(currentPlayer.hand, game.leftEnd, game.rightEnd);

    // If no moves and can draw, auto-draw
    if (possibleMoves.length === 0 && game.drawPileCount > 0) {
      const autoDrawTimer = setTimeout(() => {
        handleDrawOrPass();
      }, 500); // Wait 500ms before auto-drawing

      return () => clearTimeout(autoDrawTimer);
    }
  }, [game, isMyTurn, isProcessing]);

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
          <View style={styles.overlay}>
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
        <Text style={styles.errorText}>Partie non trouvée</Text>
      </View>
    );
  }

  const currentPlayer = game.players.find((p) => p.id === playerId);
  const opponent = game.players.find((p) => p.id !== playerId);
  const isMyTurn = game.currentPlayerId === playerId;

  const possibleMoves = currentPlayer
    ? getAllPossibleMoves(currentPlayer.hand, game.leftEnd, game.rightEnd)
    : [];
  const playableTileIds = possibleMoves.map((move) => move.tileId);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background with felt texture */}
      <View style={styles.tableBackground}>
        {/* Header - Compact */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={handleLeave}>
            <Foundation name="list" size={20} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.turnIndicator}>
            <Text style={styles.turnText}>
              {isMyTurn ? '🎯 Votre tour' : '⏳ Tour adverse'}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: 0</Text>
          </View>
        </View>

        {/* Opponent Hand - Top (20%) */}
        <View style={styles.opponentZone}>
          {opponent && (
            <>
              <View style={styles.opponentInfo}>
                <Text style={styles.opponentName}>{opponent.profile.name}</Text>
                <Text style={styles.opponentTiles}>{opponent.tilesCount} tuiles</Text>
              </View>
              <View style={styles.opponentHand}>
                {opponent.hand.slice(0, 7).map((tile) => (
                  <View key={tile.id} style={styles.smallTileWrapper}>
                    <DominoTile3D tile={tile} showBack={true} size="small" />
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Center Game Board (60%) */}
        <View style={styles.gameBoardContainer}>
          {/* Left Side - Draw Pile */}
          <View style={styles.leftSidePanel}>
            <TouchableOpacity
              style={styles.drawPileButton}
              onPress={handleDrawOrPass}
              disabled={!isMyTurn || isProcessing}
            >
              <View style={styles.drawPileStack}>
                <View style={[styles.stackedTile, { top: 0, left: 0 }]} />
                <View style={[styles.stackedTile, { top: 2, left: 2 }]} />
                <View style={[styles.stackedTile, { top: 4, left: 4 }]} />
              </View>
              <Text style={styles.drawPileCount}>{game.drawPileCount}</Text>
            </TouchableOpacity>
          </View>

          {/* Center - Game Table */}
          <View style={styles.gameTable}>
            {game.board.length === 0 ? (
              <View style={styles.emptyTable}>
                <View style={styles.centerCircle} />
                <Text style={styles.emptyTableText}>
                  {selectedTileId ? 'Tapez ici pour placer' : 'Sélectionnez une tuile'}
                </Text>
                {selectedTileId && (
                  <TouchableOpacity
                    style={styles.placeFirstTileButton}
                    onPress={() => handlePlaceTile('left')}
                    disabled={isProcessing}
                  >
                    <Foundation name="check" size={32} color="#FFF" />
                    <Text style={styles.placeFirstTileText}>Placer</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.dominoChainContainer}>
                {/* Left End Button */}
                {selectedTileId && (
                  <TouchableOpacity
                    style={[styles.sideButton, styles.leftSideButton]}
                    onPress={() => handlePlaceTile('left')}
                    disabled={isProcessing}
                  >
                    <Foundation name="arrow-left" size={24} color="#FFF" />
                    <Text style={styles.sideButtonText}>Gauche</Text>
                  </TouchableOpacity>
                )}

                {/* Domino Chain */}
                <View style={styles.dominoChain}>
                  {game.board.map((placement, index) => {
                    const tile = placement.tile;
                    const isDouble = tile.left === tile.right;

                    return (
                      <View
                        key={tile.id}
                        style={styles.chainTileWrapper}
                      >
                        <DominoTile3D
                          tile={tile}
                          size="small"
                          isHorizontal={!isDouble}
                        />
                      </View>
                    );
                  })}
                </View>

                {/* Right End Button */}
                {selectedTileId && (
                  <TouchableOpacity
                    style={[styles.sideButton, styles.rightSideButton]}
                    onPress={() => handlePlaceTile('right')}
                    disabled={isProcessing}
                  >
                    <Foundation name="arrow-right" size={24} color="#FFF" />
                    <Text style={styles.sideButtonText}>Droite</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Right Side - Info */}
          <View style={styles.rightSidePanel}>
            {possibleMoves.length === 0 && game.drawPileCount > 0 && (
              <View style={styles.autoDrawIndicator}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.autoDrawText}>Pioche...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Player Hand - Bottom (20%) */}
        <View style={styles.playerZone}>
          {currentPlayer && (
            <>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>Votre main ({currentPlayer.hand.length} tuiles)</Text>
              </View>
              <View style={styles.playerHand}>
                {currentPlayer.hand.map((tile) => {
                  const isPlayable = playableTileIds.includes(tile.id);
                  const isSelected = selectedTileId === tile.id;

                  return (
                    <TouchableOpacity
                      key={tile.id}
                      onPress={() => handleTileSelect(tile)}
                      disabled={!isMyTurn || isProcessing}
                      style={[
                        styles.tileWrapper,
                        isSelected && styles.tileWrapperSelected,
                      ]}
                    >
                      <DominoTile3D
                        tile={tile}
                        size="small"
                        isPlayable={isPlayable}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </View>

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
      backgroundColor: '#000',
    },
    backgroundImage: {
      flex: 1,
      width: width,
      height: height,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: '#FFF',
      fontSize: 18,
      textAlign: 'center',
      marginTop: 100,
    },

    // Main Table Background (Green Felt)
    tableBackground: {
      flex: 1,
      backgroundColor: '#2D5016', // Green felt
      borderWidth: 8,
      borderColor: '#1A3009', // Dark green border
    },

    // Header (Compact)
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      height: 50,
    },
    menuButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    turnIndicator: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    turnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFF',
    },
    scoreContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    scoreText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFF',
    },

    // Opponent Zone (Top 20%)
    opponentZone: {
      height: '20%',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    opponentInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    opponentName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFF',
    },
    opponentTiles: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
    },
    opponentHand: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 4,
    },
    smallTileWrapper: {
      transform: [{ scale: 0.8 }],
    },

    // Game Board Container (60%)
    gameBoardContainer: {
      flex: 1,
      flexDirection: 'row',
      paddingHorizontal: 8,
      paddingVertical: 16,
    },

    // Left Side Panel (Draw Pile)
    leftSidePanel: {
      width: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    drawPileButton: {
      alignItems: 'center',
      gap: 8,
    },
    drawPileStack: {
      width: 60,
      height: 60,
      position: 'relative',
    },
    stackedTile: {
      position: 'absolute',
      width: 50,
      height: 50,
      backgroundColor: '#8B4513',
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#654321',
    },
    drawPileCount: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFF',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },

    // Center Game Table
    gameTable: {
      flex: 1,
      backgroundColor: 'rgba(45, 80, 22, 0.8)', // Darker green for table
      borderRadius: 20,
      borderWidth: 3,
      borderColor: '#1A3009',
      marginHorizontal: 8,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    emptyTable: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderStyle: 'dashed',
    },
    emptyTableText: {
      marginTop: 12,
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.5)',
      fontStyle: 'italic',
    },
    placeFirstTileButton: {
      marginTop: 20,
      backgroundColor: 'rgba(76, 217, 100, 0.9)',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
      gap: 8,
    },
    placeFirstTileText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFF',
    },
    dominoChain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: -2,
      flexWrap: 'wrap',
      justifyContent: 'center',
      maxWidth: '100%',
    },
    chainTileWrapper: {
      marginHorizontal: -5,
    },
    placeholderText: {
      color: 'rgba(255, 255, 255, 0.3)',
      fontSize: 12,
    },

    // Right Side Panel (Info)
    rightSidePanel: {
      width: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    autoDrawIndicator: {
      backgroundColor: 'rgba(255, 152, 0, 0.8)',
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
      gap: 4,
    },
    autoDrawText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFF',
    },

    // Player Zone (Bottom 20%)
    playerZone: {
      height: '20%',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    playerInfo: {
      marginBottom: 8,
    },
    playerName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFF',
    },
    playerHand: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 4,
      flexWrap: 'wrap',
    },
    tileWrapper: {
      padding: 2,
    },
    tileWrapperSelected: {
      backgroundColor: 'rgba(76, 217, 100, 0.3)',
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#4CD964',
      transform: [{ scale: 1.1 }],
    },

    // Chain container with side buttons
    dominoChainContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    sideButton: {
      backgroundColor: 'rgba(76, 217, 100, 0.9)',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 12,
      alignItems: 'center',
      gap: 4,
      marginHorizontal: 8,
    },
    leftSideButton: {
      marginRight: 16,
    },
    rightSideButton: {
      marginLeft: 16,
    },
    sideButtonText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFF',
    },
  });

export default DominosGameLandscapeScreen;
