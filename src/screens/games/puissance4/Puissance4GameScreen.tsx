import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CurrentTheme } from '../../../constants/Themes';
import { Typography } from '../../../constants/Typography';
import FeedbackService from '../../../services/FeedbackService';
import { PUISSANCE4_CONFIG, PUISSANCE4_MESSAGES } from '../../../constants/Puissance4Constants';
import { usePuissance4Game } from '../../../hooks/usePuissance4Game';
import Puissance4Column from '../../../components/puissance4/Puissance4Column';
import AIThinkingBubble from '../../../components/puissance4/AIThinkingBubble';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import CustomAlert from '../../../components/common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import { AvatarDisplay } from '../../../utils/avatarUtils';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');
const BOARD_WIDTH = width - 40;
const CELL_SIZE = BOARD_WIDTH / PUISSANCE4_CONFIG.COLS;

const Puissance4GameScreen: React.FC<any> = ({ route, navigation }) => {
  const { mode, difficulty, playerColor, players, gameId, stakes } = route.params || {};
  const { user } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const [showMenu, setShowMenu] = useState(false);

  // handleGameEnd DOIT être défini AVANT usePuissance4Game
  const handleGameEnd = React.useCallback(async (result: 'Rouge' | 'Jaune' | 'draw') => {
    console.log('🏆 Game ended with result:', result);
    // Sauvegarder dans l'historique pour les modes local et AI
    if ((mode === 'local' || mode === 'ai') && user?.id) {
      try {
        const winnerId = result === 'draw' ? null :
          result === playerColor ? user.id : (players?.[1]?.id || null);
        const loserId = result === 'draw' ? null :
          result !== playerColor ? user.id : (players?.[1]?.id || null);

        await firestore().collection('puissance4_history').add({
          players: [user.id, players?.[1]?.id || 'ai'],
          playerProfiles: [
            { id: user.id, name: user.name, avatar: user.photoURL ? { type: 'photo', value: user.photoURL } : { type: 'emoji', value: '👤' } },
            players?.[1] || { id: 'ai', name: mode === 'ai' ? 'IA' : 'Joueur 2', avatar: { type: 'emoji', value: mode === 'ai' ? '🤖' : '🟡' } }
          ],
          winner: winnerId,
          loser: loserId,
          result,
          moveCount,
          duration: 0,
          stakes: null,
          winningLine,
          forfeited: false,
          timestamp: Date.now(),
          mode,
        });
        console.log('Game history saved for local/AI mode');
      } catch (error) {
        console.error('Error saving game history:', error);
      }
    }

    // Attendre un peu pour l'animation
    timeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;

      let messageText;
      let emoji;
      let title;

      if (result === 'draw') {
        const randomMsg = PUISSANCE4_MESSAGES.MATCH_NUL[
          Math.floor(Math.random() * PUISSANCE4_MESSAGES.MATCH_NUL.length)
        ];
        messageText = randomMsg.message;
        emoji = randomMsg.emoji;
        title = randomMsg.title;
      } else if (mode === 'ai') {
        const isPlayerWin = result === playerColor;
        if (isPlayerWin) {
          const msgs = PUISSANCE4_MESSAGES.JOUEUR_VICTOIRE_VS_IA[difficulty];
          const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
          messageText = randomMsg.message;
          emoji = randomMsg.emoji;
          title = randomMsg.title;
        } else {
          const msgs = PUISSANCE4_MESSAGES.IA_VICTOIRE[difficulty];
          const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
          messageText = randomMsg.message;
          emoji = randomMsg.emoji;
          title = randomMsg.title;
        }
      } else {
        const msgs =
          result === 'Rouge'
            ? PUISSANCE4_MESSAGES.VICTOIRE_ROUGE
            : PUISSANCE4_MESSAGES.VICTOIRE_JAUNE;
        const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
        messageText = randomMsg.message;
        emoji = randomMsg.emoji;
        title = randomMsg.title;
      }

      // Determine if the user is the winner
      let isWinner = false;
      if (result !== 'draw') {
        if (mode === 'ai') {
          isWinner = result === playerColor;
        } else if (mode === 'online') {
          // For online mode, check the color assigned to the user
          isWinner = result === playerColor;
        } else {
          // For local mode, we don't track individual wins
          isWinner = false;
        }
      }

      navigation.navigate('puissance4Results', {
        winner: result,
        message: {
          emoji,
          title,
          message: messageText,
        },
        moveCount,
        winningLine,
        mode,
        difficulty,
        stakes: stakes || null,
        isWinner,
      });
    }, 1500);
  }, [mode, playerColor, players, user, difficulty, stakes, navigation]);

  // Initialize the game hook AFTER handleGameEnd
  const {
    board,
    currentPlayer,
    winner,
    winningLine,
    isAIThinking,
    aiReasoning,
    moveCount,
    playMove,
    resetGame,
    forfeit,
  } = usePuissance4Game({
    mode,
    difficulty,
    playerColor,
    gameId,
    playerId: user?.id,
    onGameEnd: handleGameEnd,
  });

  const handleColumnPress = (columnIndex: number) => {
    playMove(columnIndex);
  };

  const handleMenuPress = () => {
    FeedbackService.buttonPress();
    setShowMenu(!showMenu);
  };

  const handleForfeit = () => {
    showAlert({
      title: 'Abandonner',
      message: 'Voulez-vous vraiment abandonner la partie ?',
      type: 'warning',
      buttons: [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            FeedbackService.error();
            await forfeit();
            navigation.goBack();
          },
        },
      ]
    });
  };

  const handleRestart = () => {
    showAlert({
      title: 'Recommencer',
      message: 'Voulez-vous recommencer la partie ?',
      type: 'info',
      buttons: [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          onPress: () => {
            FeedbackService.success();
            resetGame();
            setShowMenu(false);
          },
        },
      ]
    });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Convertir winningLine en Set pour chaque colonne
  const getWinningCellsForColumn = (colIndex: number): Set<number> => {
    const set = new Set<number>();
    winningLine.forEach(cell => {
      if (cell.col === colIndex) {
        set.add(cell.row);
      }
    });
    return set;
  };

  // Déterminer la couleur de preview
  const previewColor = mode === 'ai' && isAIThinking ? undefined : currentPlayer;

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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <View style={styles.backButtonBlur}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={CurrentTheme.text.primary}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <View style={styles.menuButtonBlur}>
            <MaterialCommunityIcons
              name="dots-vertical"
              size={24}
              color={CurrentTheme.text.primary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Menu Dropdown */}
      {showMenu && (
        <View style={styles.menuDropdown}>
          <View style={styles.menuDropdownBlur}>
            <TouchableOpacity style={styles.menuItem} onPress={handleRestart}>
              <MaterialCommunityIcons name="restart" size={20} color="#FFFFFF" />
              <Text style={styles.menuItemText}>Recommencer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleForfeit}>
              <MaterialCommunityIcons name="flag" size={20} color="#FF6B6B" />
              <Text style={[styles.menuItemText, { color: '#FF6B6B' }]}>Abandonner</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Player Info */}
        <View style={styles.playersContainer}>
          <View style={styles.playerCard}>
            <View
              style={[
                styles.playerCardBlur,
                currentPlayer === 'Rouge' && !winner && styles.playerCardActive,
              ]}
            >
              {/* Avatar */}
              <View style={styles.playerAvatar}>
                {user?.photoURL || user?.profilePicture ? (
                  <AvatarDisplay
                    avatar={{ type: 'photo', value: user.profilePicture || user.photoURL || '' }}
                    photoURL={user.photoURL}
                    imageStyle={styles.avatarImage}
                    textStyle={styles.avatarEmoji}
                  />
                ) : (
                  <AvatarDisplay
                    avatar={{ type: 'emoji', value: '🔴' }}
                    imageStyle={styles.avatarImage}
                    textStyle={styles.avatarEmoji}
                  />
                )}
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {mode === 'online' ? (players?.[0]?.name || user?.name || 'Joueur 1') :
                   players?.[0]?.name || user?.name || 'Vous'}
                </Text>
                <View style={styles.colorBadge}>
                  <View style={[styles.colorDot, { backgroundColor: PUISSANCE4_CONFIG.COLORS.RED }]} />
                  <Text style={styles.playerColor}>Rouge</Text>
                </View>
              </View>
              {currentPlayer === 'Rouge' && !winner && (
                <View style={styles.turnIndicator}>
                  <Text style={styles.turnText}>Votre tour</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.playerCard}>
            <View
              style={[
                styles.playerCardBlur,
                currentPlayer === 'Jaune' && !winner && styles.playerCardActive,
              ]}
            >
              {/* Avatar */}
              <View style={styles.playerAvatar}>
                {players?.[1]?.avatar ? (
                  <AvatarDisplay
                    avatar={players[1].avatar}
                    photoURL={players[1].photoURL}
                    imageStyle={styles.avatarImage}
                    textStyle={styles.avatarEmoji}
                  />
                ) : mode === 'ai' ? (
                  <AvatarDisplay
                    avatar={{ type: 'emoji', value: '🤖' }}
                    imageStyle={styles.avatarImage}
                    textStyle={styles.avatarEmoji}
                  />
                ) : (
                  <AvatarDisplay
                    avatar={{ type: 'emoji', value: '🟡' }}
                    imageStyle={styles.avatarImage}
                    textStyle={styles.avatarEmoji}
                  />
                )}
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {mode === 'online' ? (players?.[1]?.name || 'Partenaire') :
                   mode === 'ai' ? (players?.[1]?.name || 'IA') :
                   players?.[1]?.name || 'Joueur 2'}
                </Text>
                <View style={styles.colorBadge}>
                  <View style={[styles.colorDot, { backgroundColor: PUISSANCE4_CONFIG.COLORS.YELLOW }]} />
                  <Text style={styles.playerColor}>Jaune</Text>
                </View>
              </View>
              {currentPlayer === 'Jaune' && !winner && (
                <View style={styles.turnIndicator}>
                  <Text style={styles.turnText}>
                    {mode === 'ai' && isAIThinking ? 'Réfléchit...' : 'Votre tour'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* AI Thinking Bubble */}
        {mode === 'ai' && (isAIThinking || aiReasoning) && (
          <AIThinkingBubble message={aiReasoning} isThinking={isAIThinking} />
        )}

        {/* Game Board */}
        <View style={styles.boardContainer}>
          <View style={styles.boardBackground}>
            <View style={styles.board}>
              {/* Render columns */}
              <View style={styles.columnsContainer}>
                {board && Array.isArray(board) && board.length > 0 && Array.from({ length: PUISSANCE4_CONFIG.COLS }).map((_, colIndex) => {
                  const columnCells = board.map(row => row && Array.isArray(row) ? row[colIndex] : null);
                  const winningCells = getWinningCellsForColumn(colIndex);

                  return (
                    <Puissance4Column
                      key={colIndex}
                      columnIndex={colIndex}
                      cells={columnCells}
                      onPress={handleColumnPress}
                      disabled={!!winner || isAIThinking}
                      previewColor={previewColor}
                      winningCells={winningCells}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Game Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsBlur}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="counter"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.statText}>{moveCount} coups</Text>
            </View>

            {mode === 'ai' && (
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="brain"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.statText}>IA {difficulty}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CurrentTheme.background,
  },
  backgroundImage: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
  blurryOverlay: {
    flex: 1,
    backgroundColor: CurrentTheme.glassmorphism.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight || 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
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
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  menuButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDropdown: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1000,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  menuDropdownBlur: {
    backgroundColor: 'rgba(40, 40, 60, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemText: {
    ...Typography.styles.body,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  playerCard: {
    flex: 1,
  },
  playerCardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playerCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: '#FFD93D',
    borderWidth: 2,
  },
  playerColorBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    ...CurrentTheme.shadows.small,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...Typography.styles.headline,
    color: CurrentTheme.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  playerColor: {
    ...Typography.styles.footnote,
    color: CurrentTheme.text.muted,
    fontSize: 12,
  },
  colorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  turnIndicator: {
    backgroundColor: CurrentTheme.romantic.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  turnText: {
    ...Typography.styles.footnote,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  vsContainer: {
    marginHorizontal: 8,
  },
  vsText: {
    ...Typography.styles.body,
    color: CurrentTheme.text.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  boardContainer: {
    marginVertical: 20,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    width: BOARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  boardBackground: {
    backgroundColor: PUISSANCE4_CONFIG.COLORS.BOARD_BG,
    borderRadius: 20,
  },
  board: {
    padding: 16,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  statsContainer: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    ...Typography.styles.body,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Puissance4GameScreen;
