import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { BlurView } from '@react-native-community/blur';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { GameMode, AIDifficulty, AIPersonality } from '../../../types/games';
import MorpionAIService from '../../../services/MorpionAIService';
import MorpionCoupleMessagesService from '../../../services/MorpionCoupleMessagesService';
import SoundService from '../../../services/SoundService';
import { MorpionService } from '../../../services/MorpionService';
import CustomAlert from '../../../components/common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import { MorpionSettingsScreen } from './MorpionSettingsScreen';
import PresenceService, { PlayerPresence } from '../../../services/PresenceService';
import InAppNotification, { NotificationType } from '../../../components/multiplayer/InAppNotification';
import PlayerStatusIndicator from '../../../components/multiplayer/PlayerStatusIndicator';
import DisconnectionModal from '../../../components/multiplayer/DisconnectionModal';

const { width, height } = Dimensions.get('window');

interface MorpionGameScreenProps {
  route?: {
    params?: {
      gameMode?: GameMode;
      aiDifficulty?: AIDifficulty;
      aiPersonality?: AIPersonality;
      playerName?: string;
      player2Name?: string;
      boardSize?: number;
      winCondition?: number;
      gameId?: string;
      playerId?: string;
      players?: Array<{
        id: string;
        name: string;
        avatar: any;
        symbol: 'X' | 'O';
      }>;
    };
  };
}

type CellValue = 'X' | 'O' | null;

interface GameStats {
  xWins: number;
  oWins: number;
  draws: number;
  totalGames: number;
}

const MorpionGameScreen: React.FC<MorpionGameScreenProps> = ({ route }) => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  // Game configuration
  const gameMode: GameMode = route?.params?.gameMode || 'ai';
  const aiDifficulty: AIDifficulty = route?.params?.aiDifficulty || 'medium';
  const aiPersonality: AIPersonality = route?.params?.aiPersonality || 'balanced';
  const boardSize: number = route?.params?.boardSize || 3;
  const winCondition: number = route?.params?.winCondition || 3;

  // Online mode parameters
  const gameId: string | undefined = route?.params?.gameId;
  const playerId: string | undefined = route?.params?.playerId;
  const onlinePlayers = route?.params?.players;

  // Player names - for online mode, get from players array
  const player1Name: string = gameMode === 'online' && onlinePlayers?.[0]?.name
    ? onlinePlayers[0].name
    : route?.params?.playerName || user?.name || 'Joueur 1';
  const player2Name: string = gameMode === 'online' && onlinePlayers?.[1]?.name
    ? onlinePlayers[1].name
    : route?.params?.player2Name || 'Joueur 2';

  // Get current player's symbol in online mode
  const mySymbol: 'X' | 'O' | null = gameMode === 'online' && onlinePlayers && playerId
    ? (onlinePlayers.find(p => p.id === playerId)?.symbol || null)
    : null;

  // Initialize board with dynamic size
  const createEmptyBoard = (size: number): CellValue[][] => {
    return Array(size).fill(null).map(() => Array(size).fill(null));
  };

  // Game state
  const [board, setBoard] = useState<CellValue[][]>(() => createEmptyBoard(boardSize));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');

  // Fix: Ensure cells with values have their animations set to 1
  useEffect(() => {
    // CRITICAL FIX: Ensure cells with values have their animations set to 1
    board.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        const cellIndex = rowIdx * boardSize + colIdx;
        if (cell !== null && cellAnimations[cellIndex]) {
          // If cell has a value but animation is at 0, set it to 1
          if (cellAnimations[cellIndex]._value === 0) {
            cellAnimations[cellIndex].setValue(1);
          }
        }
      });
    });
  }, [board, boardSize, cellAnimations]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'finished'>('playing');
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string>('');
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [moveHistory, setMoveHistory] = useState<Array<{ row: number; col: number; player: CellValue }>>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    xWins: 0,
    oWins: 0,
    draws: 0,
    totalGames: 0,
  });
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consecutiveWins, setConsecutiveWins] = useState<{ X: number; O: number }>({ X: 0, O: 0 });

  // Online presence tracking states
  const [opponentPresence, setOpponentPresence] = useState<PlayerPresence | null>(null);
  const [showDisconnectionModal, setShowDisconnectionModal] = useState(false);
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: NotificationType;
    playerName: string;
    message?: string;
  }>({ visible: false, type: 'player_joined', playerName: '' });

  // Animation values - dynamic based on board size
  const [cellAnimations] = useState(() =>
    Array(boardSize * boardSize).fill(0).map(() => new Animated.Value(0))
  );
  const [winLineAnim] = useState(new Animated.Value(0));
  const [aiThinkingAnim] = useState(new Animated.Value(0));
  const [celebrationScale] = useState(new Animated.Value(0));
  const [boardShakeAnim] = useState(new Animated.Value(0));

  // Timeout refs for cleanup
  const aiMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const winAnimationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Generate winning patterns dynamically based on board size and win condition
  const generateWinningPatterns = (size: number, winLen: number): number[][] => {
    const patterns: number[][] = [];

    // Rows
    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= size - winLen; col++) {
        const pattern = [];
        for (let i = 0; i < winLen; i++) {
          pattern.push(row * size + col + i);
        }
        patterns.push(pattern);
      }
    }

    // Columns
    for (let col = 0; col < size; col++) {
      for (let row = 0; row <= size - winLen; row++) {
        const pattern = [];
        for (let i = 0; i < winLen; i++) {
          pattern.push((row + i) * size + col);
        }
        patterns.push(pattern);
      }
    }

    // Diagonals (top-left to bottom-right)
    for (let row = 0; row <= size - winLen; row++) {
      for (let col = 0; col <= size - winLen; col++) {
        const pattern = [];
        for (let i = 0; i < winLen; i++) {
          pattern.push((row + i) * size + (col + i));
        }
        patterns.push(pattern);
      }
    }

    // Diagonals (top-right to bottom-left)
    for (let row = 0; row <= size - winLen; row++) {
      for (let col = winLen - 1; col < size; col++) {
        const pattern = [];
        for (let i = 0; i < winLen; i++) {
          pattern.push((row + i) * size + (col - i));
        }
        patterns.push(pattern);
      }
    }

    return patterns;
  };

  const WINNING_PATTERNS = generateWinningPatterns(boardSize, winCondition);

  // Initialize game
  useEffect(() => {
    SoundService.playGameStart();
    // Start with a subtle board entrance animation
    Animated.spring(boardShakeAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (aiMoveTimeoutRef.current) {
        clearTimeout(aiMoveTimeoutRef.current);
      }
      if (aiDelayTimeoutRef.current) {
        clearTimeout(aiDelayTimeoutRef.current);
      }
      winAnimationTimeoutsRef.current.forEach(id => clearTimeout(id));
      winAnimationTimeoutsRef.current = [];
    };
  }, []);

  // Subscribe to online game updates
  useEffect(() => {
    if (gameMode !== 'online' || !gameId) return;

    console.log('🎮 Subscribing to online game:', gameId);

    const unsubscribe = MorpionService.subscribeToGame(
      gameId,
      (updatedGame) => {
        console.log('📡 Game update received:', updatedGame);

        // Convert flat board array to 2D array
        const newBoard: CellValue[][] = [];
        for (let row = 0; row < boardSize; row++) {
          const rowData: CellValue[] = [];
          for (let col = 0; col < boardSize; col++) {
            const index = row * boardSize + col;
            rowData.push(updatedGame.board[index] as CellValue);
          }
          newBoard.push(rowData);
        }

        // Update board state
        setBoard(newBoard);
        setCurrentPlayer(updatedGame.currentPlayer as 'X' | 'O');
        setMoveCount(updatedGame.moves?.length || 0);

        // Check for game end
        if (updatedGame.status === 'finished') {
          const result = checkWinner(newBoard);
          if (result.winner) {
            handleGameEnd(result.winner, result.line);
          }
        }
      },
      (error) => {
        console.error('❌ Error subscribing to game:', error);
      }
    );

    return () => {
      console.log('🔌 Unsubscribing from online game');
      unsubscribe();
    };
  }, [gameMode, gameId]);

  // Online presence tracking
  useEffect(() => {
    if (gameMode !== 'online' || !gameId || !playerId) return;

    console.log('📡 Starting presence tracking for online game');

    // Mark current user as online
    PresenceService.markUserOnline(playerId, gameId, 'morpion');

    // Get opponent ID
    const opponentId = onlinePlayers?.find(p => p.id !== playerId)?.id;
    if (!opponentId) {
      console.log('⚠️ No opponent found for presence tracking');
      return;
    }

    const opponentName = onlinePlayers?.find(p => p.id === opponentId)?.name || 'Adversaire';

    // Subscribe to opponent's presence
    const unsubscribe = PresenceService.subscribeToUserPresence(
      gameId,
      opponentId,
      (presence) => {
        const previousPresence = opponentPresence;
        setOpponentPresence(presence);

        console.log('📡 Opponent presence update:', presence?.status, presence?.connectionQuality);

        if (presence) {
          // Player reconnected
          if (previousPresence?.status === 'offline' && presence.status === 'online') {
            showNotification('player_reconnected', opponentName);
            setShowDisconnectionModal(false);
            SoundService.playButtonClick();

            // Resume the game
            if (gameId && opponentId) {
              MorpionService.resumeGame(gameId, opponentId)
                .catch(error => console.error('Error resuming game:', error));
            }
          }
          // Player disconnected
          else if (previousPresence?.status === 'online' && presence.status === 'offline') {
            showNotification('player_disconnected', opponentName, 'Connexion perdue');
            setShowDisconnectionModal(true);
            SoundService.playGameEnd();

            // Pause the game
            if (gameId && playerId) {
              MorpionService.pauseGame(gameId, opponentId, 'player_disconnected')
                .catch(error => console.error('Error pausing game:', error));
            }
          }
          // Poor connection detected
          else if (presence.connectionQuality === 'poor' && previousPresence?.connectionQuality !== 'poor') {
            showNotification('connection_poor', opponentName, 'Connexion instable');
          }
        } else {
          // Presence data is null - player is offline
          if (previousPresence && previousPresence.status === 'online') {
            showNotification('player_disconnected', opponentName, 'Déconnexion détectée');
            setShowDisconnectionModal(true);
          }
        }
      }
    );

    return () => {
      console.log('📡 Stopping presence tracking');
      unsubscribe();
      PresenceService.markUserOffline(playerId, gameId);
    };
  }, [gameMode, gameId, playerId, onlinePlayers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameMode === 'online' && playerId && gameId) {
        PresenceService.markUserOffline(playerId, gameId);
      }
    };
  }, [gameMode, playerId, gameId]);

  const showNotification = (type: NotificationType, playerName: string, message?: string) => {
    setNotification({ visible: true, type, playerName, message });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  const handleDisconnectionWait = () => {
    console.log('⏳ Player chose to wait for opponent reconnection');
    // Keep modal open, waiting for reconnection
  };

  const handleDisconnectionForfeit = () => {
    console.log('🏳️ Player forfeited due to disconnection');
    setShowDisconnectionModal(false);

    showAlert({
      title: 'Partie terminée',
      message: 'Vous avez abandonné la partie.',
      type: 'warning',
      buttons: [
        {
          text: 'OK',
          onPress: () => {
            navigateToScreen('morpionOnline');
          }
        }
      ]
    });
  };

  // Timer update - real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // AI thinking animation
  useEffect(() => {
    if (isAIThinking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(aiThinkingAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(aiThinkingAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      aiThinkingAnim.setValue(0);
    }
  }, [isAIThinking]);

  // Check for winner with extended pattern checking
  const checkWinner = (currentBoard: CellValue[][]): { winner: 'X' | 'O' | 'draw' | null; line: number[] | null } => {
    const flatBoard = currentBoard.flat();

    // Check winning patterns
    for (const pattern of WINNING_PATTERNS) {
      const values = pattern.map(idx => flatBoard[idx]);
      const firstValue = values[0];
      
      if (firstValue && values.every(val => val === firstValue)) {
        return { winner: firstValue as 'X' | 'O', line: pattern };
      }
    }

    // Check for draw
    if (flatBoard.every(cell => cell !== null)) {
      return { winner: 'draw', line: null };
    }

    return { winner: null, line: null };
  };

  // Enhanced handle cell press with proper indexing
  const handleCellPress = (row: number, col: number) => {
    // Validation checks
    if (board[row][col] !== null || gameStatus === 'finished') {
      // Shake animation for invalid move
      Animated.sequence([
        Animated.timing(boardShakeAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(boardShakeAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(boardShakeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (gameMode === 'ai' && currentPlayer === 'O') return;
    if (isAIThinking) return;

    // ONLINE MODE: Check if it's the current player's turn
    if (gameMode === 'online') {
      if (!mySymbol) {
        console.log('❌ No symbol assigned to player');
        return;
      }
      if (currentPlayer !== mySymbol) {
        console.log(`❌ Not your turn! Current: ${currentPlayer}, Your symbol: ${mySymbol}`);
        // Shake animation for invalid move
        Animated.sequence([
          Animated.timing(boardShakeAnim, {
            toValue: 1.05,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(boardShakeAnim, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(boardShakeAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
        return;
      }
    }

    makeMove(row, col, currentPlayer);
  };

  // Make move with explicit board parameter (for AI to use updated board)
  const makeMoveWithBoard = (currentBoard: CellValue[][], row: number, col: number, player: 'X' | 'O') => {
    // Create new board with the move
    const newBoard = currentBoard.map((r, rIdx) =>
      r.map((c, cIdx) => {
        if (rIdx === row && cIdx === col) {
          return player;
        }
        return c;
      })
    );

    // Update board state
    setBoard(newBoard);
    setLastMove({ row, col });
    setMoveCount(prev => prev + 1);
    setMoveHistory(prev => [...prev, { row, col, player }]);

    // Animate the specific cell - Use simple timing instead of spring
    const cellIndex = row * boardSize + col;
    Animated.timing(cellAnimations[cellIndex], {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    SoundService.playButtonClick();

    // Check for winner
    const result = checkWinner(newBoard);
    if (result.winner) {
      handleGameEnd(result.winner, result.line);
    } else {
      // Switch player
      const nextPlayer = player === 'X' ? 'O' : 'X';
      setCurrentPlayer(nextPlayer);

      // If AI mode and it's AI's turn, make AI move
      if (gameMode === 'ai' && nextPlayer === 'O') {
        aiMoveTimeoutRef.current = setTimeout(() => makeAIMove(newBoard), 600);
      }
    }
  };

  // Enhanced make move function with proper state updates (uses current board state)
  const makeMove = async (row: number, col: number, player: 'X' | 'O') => {
    // ONLINE MODE: Send move to Firestore
    if (gameMode === 'online' && gameId && playerId) {
      try {
        console.log(`🎯 Making online move at [${row}, ${col}] for player ${player}`);
        const position = row * boardSize + col;
        await MorpionService.playMove(gameId, playerId, position);
        SoundService.playButtonClick();
        // The board will be updated via the Firestore subscription
      } catch (error) {
        console.error('❌ Error making online move:', error);
        showAlert({
          title: 'Erreur',
          message: 'Impossible de jouer ce coup',
          type: 'error',
        });
      }
      return;
    }

    // LOCAL/AI MODE: Update board locally
    makeMoveWithBoard(board, row, col, player);
  };

  // Enhanced AI move with personality-based reasoning
  const makeAIMove = async (currentBoard: CellValue[][]) => {
    setIsAIThinking(true);

    // Convert board format for AI
    const aiBoard = currentBoard.map(row => row.map(cell => cell as string | null));

    try {
      // Use enhanced AI with board size support
      const aiMove = MorpionAIService.getBestMove(aiBoard, 'O', aiDifficulty, aiPersonality, boardSize);

      // Use the AI's reasoning directly
      setAiReasoning(aiMove.reasoning);

      // Realistic delay based on difficulty
      const delays = {
        easy: 600,
        medium: 1000,
        hard: 1400,
        expert: 1800,
      };

      await new Promise(resolve => {
        aiDelayTimeoutRef.current = setTimeout(resolve, delays[aiDifficulty] || 1000);
      });

      setIsAIThinking(false);
      // Use the currentBoard passed to this function, not the state
      makeMoveWithBoard(currentBoard, aiMove.row, aiMove.col, 'O');
    } catch (error) {
      console.error('AI move error:', error);
      setIsAIThinking(false);
      // Fallback to random move
      const emptyCells: { row: number; col: number }[] = [];
      currentBoard.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
          if (cell === null) {
            emptyCells.push({ row: rIdx, col: cIdx });
          }
        });
      });

      if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        makeMoveWithBoard(currentBoard, randomCell.row, randomCell.col, 'O');
      }
    }
  };
  // Handle game end with enhanced animations and stats
  const handleGameEnd = (gameWinner: 'X' | 'O' | 'draw', line: number[] | null) => {
    setWinner(gameWinner);
    setWinningLine(line);
    setGameStatus('finished');
    setIsAIThinking(false);

    // Update game statistics
    setGameStats(prev => ({
      ...prev,
      xWins: gameWinner === 'X' ? prev.xWins + 1 : prev.xWins,
      oWins: gameWinner === 'O' ? prev.oWins + 1 : prev.oWins,
      draws: gameWinner === 'draw' ? prev.draws + 1 : prev.draws,
      totalGames: prev.totalGames + 1,
    }));

    // Update consecutive wins
    if (gameWinner === 'X' || gameWinner === 'O') {
      setConsecutiveWins(prev => ({
        X: gameWinner === 'X' ? prev.X + 1 : 0,
        O: gameWinner === 'O' ? prev.O + 1 : 0,
      }));
    } else {
      setConsecutiveWins({ X: 0, O: 0 });
    }

    if (line) {
      // Animate winning line with stagger effect
      line.forEach((cellIndex, index) => {
        const timeoutId = setTimeout(() => {
          Animated.sequence([
            Animated.timing(cellAnimations[cellIndex], {
              toValue: 1.3,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(cellAnimations[cellIndex], {
              toValue: 1.1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
        }, index * 100);
        winAnimationTimeoutsRef.current.push(timeoutId);
      });

      // Animate winning line glow
      Animated.timing(winLineAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }

    // Celebration animation
    Animated.spring(celebrationScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    if (gameWinner === 'draw') {
      SoundService.playGameEnd();
    } else {
      SoundService.playGameWin();
    }

    // Auto-save high score if applicable
    if (gameWinner === 'X' && gameMode === 'ai') {
      // Could save to AsyncStorage here
      console.log('Player victory against AI!');
    }
  };

  // Enhanced reset game with animation
  const resetGame = () => {
    SoundService.playButtonClick();

    // For online mode, navigate back to lobby to create a new game
    if (gameMode === 'online') {
      navigateToScreen('morpionOnline');
      return;
    }

    // For local/AI mode, reset the game state
    // Reset animations
    Animated.parallel([
      ...cellAnimations.map(anim =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ),
      Animated.timing(celebrationScale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(winLineAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset state after animations
      setBoard(createEmptyBoard(boardSize));
      setCurrentPlayer('X');
      setGameStatus('playing');
      setWinner(null);
      setWinningLine(null);
      setMoveCount(0);
      setIsAIThinking(false);
      setAiReasoning('');
      setLastMove(null);
      setMoveHistory([]);

      // Re-entrance animation
      Animated.spring(boardShakeAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  };

  // Undo last move function
  const undoLastMove = () => {
    if (moveHistory.length === 0 || gameStatus === 'finished') return;

    const lastMoveData = moveHistory[moveHistory.length - 1];
    const newBoard = board.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (rIdx === lastMoveData.row && cIdx === lastMoveData.col) {
          return null;
        }
        return cell;
      })
    );

    setBoard(newBoard);
    setMoveHistory(prev => prev.slice(0, -1));
    setMoveCount(prev => Math.max(0, prev - 1));
    // Switch to the player who made the last move (so they can make it again)
    setCurrentPlayer(lastMoveData.player === 'X' ? 'X' : 'O');

    // Animate cell removal
    const cellIndex = lastMoveData.row * boardSize + lastMoveData.col;
    Animated.timing(cellAnimations[cellIndex], {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    SoundService.playButtonClick();
  };

  // Handle back button with confirmation
  const handleBack = () => {
    if (gameStatus === 'playing' && moveCount > 0) {
      showAlert({
        title: 'Quitter la partie?',
        message: 'La partie en cours sera perdue.',
        type: 'warning',
        buttons: [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Quitter',
            style: 'destructive',
            onPress: () => {
              // Clean up animations
              cellAnimations.forEach(anim => anim.setValue(0));
              navigateToScreen('main');
            }
          },
        ],
      });
    } else {
      navigateToScreen('main');
    }
  };

  // Render cell with enhanced animations and interactions
  const renderCell = (row: number, col: number) => {
    const cellIndex = row * boardSize + col;
    const value = board[row][col];
    const isWinningCell = winningLine?.includes(cellIndex);
    const isLastMove = lastMove?.row === row && lastMove?.col === col;

    const scale = cellAnimations[cellIndex]?.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }) || new Animated.Value(1);

    // Dynamic font size based on board size
    const fontSizes: { [key: number]: number } = {
      3: 48,
      4: 36,
      5: 28,
      6: 24,
      7: 20,
    };
    const fontSize = fontSizes[boardSize] || 24;

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.cell,
          isWinningCell && styles.winningCell,
          { flex: 1 / boardSize }
        ]}
        onPress={() => handleCellPress(row, col)}
        activeOpacity={0.7}
        disabled={value !== null || gameStatus === 'finished' || isAIThinking}
      >
        <BlurView style={styles.cellBlur} blurType="dark" blurAmount={10}>
          <View style={[
            styles.cellGlass,
            isLastMove && styles.lastMoveGlass,
            isWinningCell && styles.winningCellGlass
          ]} />
        </BlurView>

        {value && (
          <Animated.View
            style={{
              transform: [{ scale }]
            }}
          >
            <Text style={[
              styles.cellText,
              { fontSize },
              value === 'X' ? styles.playerXText : styles.playerOText,
              isWinningCell && styles.winningCellText
            ]}>
              {value}
            </Text>
          </Animated.View>
        )}

        {/* Hover effect for empty cells */}
        {!value && gameStatus === 'playing' && !isAIThinking && (
          <View style={styles.cellHoverHint}>
            <Text style={[
              styles.cellHintText,
              { fontSize: fontSize * 0.5 },
              currentPlayer === 'X' ? styles.playerXText : styles.playerOText
            ]}>
              {currentPlayer}
            </Text>
          </View>
        )}

        {/* Winning cell glow effect */}
        {isWinningCell && (
          <Animated.View
            style={[
              styles.winGlow,
              {
                opacity: winLineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.6],
                }),
                transform: [{ 
                  scale: winLineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  })
                }],
              },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Get player info with enhanced display
  const getCurrentPlayerName = () => {
    if (currentPlayer === 'X') return player1Name;
    if (gameMode === 'ai') return 'IA';
    return player2Name;
  };

  const getPlayerAvatar = (player: 'X' | 'O') => {
    if (player === 'O' && gameMode === 'ai') {
      const aiIcons: { [key: string]: string } = {
        easy: 'battery-empty',
        medium: 'battery-half',
        hard: 'battery-full',
        expert: 'battery-full',
      };
      return aiIcons[aiDifficulty] || 'laptop';
    }
    return null;
  };

  // Stats modal component
  const renderStatsModal = () => {
    if (!showStats) return null;

    return (
      <Animated.View style={styles.statsModal}>
        <BlurView style={styles.statsModalBlur} blurType="dark" blurAmount={30}>
          <View style={styles.statsModalGlass} />
        </BlurView>
        
        <View style={styles.statsModalContent}>
          <Text style={styles.statsModalTitle}>📊 Statistiques</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{gameStats.xWins}</Text>
              <Text style={styles.statLabel}>Victoires {player1Name}</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{gameStats.oWins}</Text>
              <Text style={styles.statLabel}>
                Victoires {gameMode === 'ai' ? 'IA' : player2Name}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{gameStats.draws}</Text>
              <Text style={styles.statLabel}>Matchs Nuls</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{gameStats.totalGames}</Text>
              <Text style={styles.statLabel}>Parties Jouées</Text>
            </View>
          </View>
          
          {(consecutiveWins.X > 2 || consecutiveWins.O > 2) && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>
                🔥 Série de {Math.max(consecutiveWins.X, consecutiveWins.O)} victoires!
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.statsCloseButton}
            onPress={() => setShowStats(false)}
          >
            <Text style={styles.statsCloseText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };
  // Main render
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Foundation name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Morpion</Text>
              {boardSize !== 3 && (
                <Text style={styles.headerSubtitle}>
                  {boardSize}×{boardSize} • {winCondition} pour gagner
                </Text>
              )}
            </View>

            <View style={styles.headerActions}>
              {moveHistory.length > 0 && gameStatus === 'playing' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.undoButton]}
                  onPress={undoLastMove}
                >
                  <Foundation name="arrow-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  SoundService.playButtonClick();
                  setShowSettings(true);
                }}
              >
                <Foundation name="widget" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowStats(true)}
              >
                <Foundation name="graph-bar" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={resetGame}>
                <Foundation name="loop" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Players Info */}
          <View style={styles.playersContainer}>
            {/* Player X */}
            <Animated.View 
              style={[
                styles.playerCard,
                currentPlayer === 'X' && gameStatus === 'playing' && styles.activePlayerCard,
                {
                  transform: [{
                    scale: currentPlayer === 'X' && gameStatus === 'playing' 
                      ? boardShakeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.98, 1.02],
                        })
                      : 1
                  }]
                }
              ]}
            >
              <BlurView style={styles.playerCardBlur} blurType="dark" blurAmount={15}>
                <View style={[
                  styles.playerCardGlass,
                  currentPlayer === 'X' && gameStatus === 'playing' && styles.activePlayerCardGlass
                ]} />
              </BlurView>
              <View style={styles.playerCardContent}>
                <View style={[styles.playerAvatar, styles.playerXAvatar]}>
                  <Text style={styles.playerSymbol}>X</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player1Name}
                  </Text>
                  <Text style={styles.playerRole}>
                    {gameStats.xWins > 0 && `${gameStats.xWins} victoire${gameStats.xWins > 1 ? 's' : ''}`}
                    {gameStats.xWins === 0 && 'Joueur 1'}
                  </Text>
                </View>
                {consecutiveWins.X > 2 && (
                  <View style={styles.streakIcon}>
                    <Text>🔥</Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* VS Badge */}
            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            {/* Player O */}
            <Animated.View 
              style={[
                styles.playerCard,
                currentPlayer === 'O' && gameStatus === 'playing' && styles.activePlayerCard,
                {
                  transform: [{
                    scale: currentPlayer === 'O' && gameStatus === 'playing'
                      ? boardShakeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.98, 1.02],
                        })
                      : 1
                  }]
                }
              ]}
            >
              <BlurView style={styles.playerCardBlur} blurType="dark" blurAmount={15}>
                <View style={[
                  styles.playerCardGlass,
                  currentPlayer === 'O' && gameStatus === 'playing' && styles.activePlayerCardGlass
                ]} />
              </BlurView>
              <View style={styles.playerCardContent}>
                <View style={[styles.playerAvatar, styles.playerOAvatar]}>
                  {gameMode === 'ai' ? (
                    <Foundation name="laptop" size={24} color="#2196F3" />
                  ) : (
                    <Text style={styles.playerSymbol}>O</Text>
                  )}
                </View>
                <View style={styles.playerInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {gameMode === 'ai' ? 'IA' : player2Name}
                    </Text>
                    {gameMode === 'online' && opponentPresence && (
                      <PlayerStatusIndicator
                        status={opponentPresence.status}
                        connectionQuality={opponentPresence.connectionQuality}
                        ping={opponentPresence.ping}
                        size="small"
                        showPing={true}
                        showLabel={false}
                      />
                    )}
                  </View>
                  <Text style={styles.playerRole}>
                    {gameMode === 'ai' ? `${aiDifficulty} • ${aiPersonality}` :
                     gameStats.oWins > 0 ? `${gameStats.oWins} victoire${gameStats.oWins > 1 ? 's' : ''}` :
                     'Joueur 2'}
                  </Text>
                </View>
                {consecutiveWins.O > 2 && (
                  <View style={styles.streakIcon}>
                    <Text>🔥</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Game Status */}
          <View style={styles.statusContainer}>
            {gameStatus === 'playing' && (
              <>
                {isAIThinking ? (
                  <Animated.View
                    style={[
                      styles.statusBadge,
                      styles.aiThinkingBadge,
                      {
                        opacity: aiThinkingAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1],
                        }),
                        transform: [{
                          scale: aiThinkingAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.1],
                          })
                        }]
                      },
                    ]}
                  >
                    <Foundation name="laptop" size={16} color="#00E5FF" />
                    <Text style={styles.statusText}>IA réfléchit...</Text>
                  </Animated.View>
                ) : (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      Tour de {getCurrentPlayerName()}
                    </Text>
                  </View>
                )}
                {aiReasoning && gameMode === 'ai' && (
                  <Animated.Text 
                    style={[
                      styles.aiReasoningText,
                      {
                        opacity: aiThinkingAnim
                      }
                    ]}
                  >
                    {aiReasoning}
                  </Animated.Text>
                )}
              </>
            )}
          </View>

          {/* Game Board */}
          <Animated.View 
            style={[
              styles.boardContainer,
              {
                transform: [{
                  scale: boardShakeAnim
                }]
              }
            ]}
          >
            <BlurView style={styles.boardBlur} blurType="dark" blurAmount={20}>
              <View style={styles.boardGlass} />
            </BlurView>

            <View style={[styles.board, { padding: boardSize > 4 ? 8 : 10 }]}>
              {Array.from({ length: boardSize }).map((_, row) => (
                <View key={row} style={[styles.row, { gap: boardSize > 4 ? 6 : 10 }]}>
                  {Array.from({ length: boardSize }).map((_, col) => renderCell(row, col))}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Game Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Foundation name="clock" size={20} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.statText}>
                {elapsedTime}s
              </Text>
            </View>
            <View style={styles.statItem}>
              <Foundation name="target" size={20} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.statText}>{moveCount} coups</Text>
            </View>
            {gameStats.totalGames > 0 && (
              <View style={styles.statItem}>
                <Foundation name="trophy" size={20} color="rgba(255, 215, 0, 0.9)" />
                <Text style={styles.statText}>
                  {Math.round((gameStats.xWins / gameStats.totalGames) * 100)}% win
                </Text>
              </View>
            )}
          </View>

          {/* Stats Modal */}
          {renderStatsModal()}

          {/* Game Over Overlay */}
          {gameStatus === 'finished' && (
            <Animated.View
              style={[
                styles.gameOverOverlay,
                {
                  opacity: celebrationScale,
                },
              ]}
            >
              <BlurView style={styles.gameOverBlur} blurType="dark" blurAmount={30}>
                <View style={styles.gameOverGlass} />
              </BlurView>

              <Animated.View
                style={[
                  styles.gameOverContent,
                  {
                    transform: [{ 
                      scale: celebrationScale.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      })
                    }],
                  },
                ]}
              >
                {(() => {
                  // Get personalized message based on game mode
                  let victoryMsg;

                  if (winner === 'draw') {
                    victoryMsg = (gameMode === 'local' || gameMode === 'multiplayer')
                      ? MorpionCoupleMessagesService.getDrawMessage(player1Name, player2Name, user)
                      : { title: '🤝 Match Nul!', message: 'Égalité parfaite!', emoji: '🤝' };
                  } else if (gameMode === 'ai') {
                    victoryMsg = MorpionCoupleMessagesService.getAIVictoryMessage(
                      winner === 'X',
                      player1Name,
                      aiDifficulty
                    );
                  } else {
                    // Local/Multiplayer mode - use romantic messages
                    victoryMsg = MorpionCoupleMessagesService.getWinnerMessage(
                      winner as 'X' | 'O',
                      player1Name,
                      player2Name,
                      consecutiveWins[winner as 'X' | 'O'],
                      user,
                      true // Assuming player X is the user
                    );
                  }

                  return (
                    <>
                      <Text style={styles.gameOverTitle}>
                        {victoryMsg.emoji}
                      </Text>
                      <Text style={styles.gameOverSubtitle}>
                        {victoryMsg.title}
                      </Text>
                      <Text style={styles.gameOverMessage}>
                        {victoryMsg.message}
                      </Text>
                    </>
                  );
                })()}

                {consecutiveWins[winner as 'X' | 'O'] > 1 && winner !== 'draw' && gameMode === 'ai' && (
                  <Text style={styles.winStreakText}>
                    🔥 {consecutiveWins[winner as 'X' | 'O']} victoires consécutives!
                  </Text>
                )}

                {/* Game Stats */}
                <View style={styles.gameOverStats}>
                  <View style={styles.statRow}>
                    <Foundation name="clock" size={20} color="rgba(255, 255, 255, 0.7)" />
                    <Text style={styles.statLabel}>
                      {elapsedTime}s
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Foundation name="graph-bar" size={20} color="rgba(255, 255, 255, 0.7)" />
                    <Text style={styles.statLabel}>{moveCount} coups</Text>
                  </View>
                  {winner !== 'draw' && (
                    <View style={styles.statRow}>
                      <Foundation name="trophy" size={20} color="#FFD700" />
                      <Text style={styles.statLabel}>
                        {winner === 'X' ? gameStats.xWins + 1 : gameStats.oWins + 1} victoire(s)
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.gameOverButtons}>
                  <TouchableOpacity
                    style={[styles.gameOverButton, styles.replayButton]}
                    onPress={resetGame}
                    activeOpacity={0.8}
                  >
                    <Foundation name="loop" size={24} color="#FFFFFF" />
                    <Text style={styles.gameOverButtonText}>Rejouer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.gameOverButton, styles.menuButtonStyle]}
                    onPress={() => navigateToScreen('main')}
                    activeOpacity={0.8}
                  >
                    <Foundation name="home" size={24} color="#FFFFFF" />
                    <Text style={styles.gameOverButtonText}>Menu</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </ImageBackground>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSettings(false)}
      >
        <MorpionSettingsScreen onBack={() => setShowSettings(false)} />
      </Modal>

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

      {/* In-App Notification for Online Mode */}
      {gameMode === 'online' && (
        <InAppNotification
          visible={notification.visible}
          type={notification.type}
          playerName={notification.playerName}
          message={notification.message}
          duration={3000}
          onDismiss={hideNotification}
        />
      )}

      {/* Disconnection Modal for Online Mode */}
      {gameMode === 'online' && showDisconnectionModal && onlinePlayers && (
        <DisconnectionModal
          visible={showDisconnectionModal}
          playerName={onlinePlayers.find(p => p.id !== playerId)?.name || 'Adversaire'}
          onWait={handleDisconnectionWait}
          onForfeit={handleDisconnectionForfeit}
          reconnectionTimeLimit={120}
          gameType="morpion"
        />
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    backgroundImage: {
      flex: 1,
      width,
      height,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 10,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    headerSubtitle: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    undoButton: {
      backgroundColor: 'rgba(255, 165, 0, 0.2)',
      borderColor: 'rgba(255, 165, 0, 0.4)',
    },
    playersContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    playerCard: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
      height: 80,
    },
    activePlayerCard: {
      shadowColor: '#FF69B4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    },
    playerCardBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    playerCardGlass: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    activePlayerCardGlass: {
      backgroundColor: 'rgba(255, 105, 180, 0.15)',
      borderColor: 'rgba(255, 105, 180, 0.4)',
    },
    playerCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      gap: 12,
    },
    playerAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
    },
    playerXAvatar: {
      backgroundColor: 'rgba(255, 105, 180, 0.2)',
      borderColor: '#FF69B4',
    },
    playerOAvatar: {
      backgroundColor: 'rgba(33, 150, 243, 0.2)',
      borderColor: '#2196F3',
    },
    playerSymbol: {
      fontSize: 28,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    playerInfo: {
      flex: 1,
    },
    playerName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    playerRole: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.6)',
      textTransform: 'capitalize',
    },
    streakIcon: {
      marginLeft: 4,
    },
    vsBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 8,
      borderWidth: 2,
      borderColor: '#FFD700',
    },
    vsText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFD700',
    },
    statusContainer: {
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
      minHeight: 50,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    aiThinkingBadge: {
      backgroundColor: 'rgba(0, 229, 255, 0.15)',
      borderColor: 'rgba(0, 229, 255, 0.4)',
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    aiReasoningText: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.7)',
      fontStyle: 'italic',
      marginTop: 8,
      textAlign: 'center',
    },
    boardContainer: {
      alignSelf: 'center',
      width: width - 40,
      aspectRatio: 1,
      maxWidth: 400,
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 20,
    },
    boardBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    boardGlass: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    board: {
      flex: 1,
      padding: 10,
    },
    row: {
      flex: 1,
      flexDirection: 'row',
      gap: 10,
    },
    cell: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cellBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    cellGlass: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    lastMoveGlass: {
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      borderColor: 'rgba(255, 215, 0, 0.4)',
    },
    winningCell: {
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 12,
      elevation: 8,
    },
    winningCellGlass: {
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      borderColor: '#FFD700',
      borderWidth: 2,
    },
    cellText: {
      fontSize: 48,
      fontWeight: '700',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    playerXText: {
      color: '#FF69B4',
    },
    playerOText: {
      color: '#2196F3',
    },
    winningCellText: {
      color: '#FFD700',
      textShadowColor: 'rgba(255, 215, 0, 0.5)',
      textShadowRadius: 8,
    },
    cellHoverHint: {
      position: 'absolute',
      opacity: 0.3,
    },
    cellHintText: {
      fontWeight: '600',
    },
    winGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 215, 0, 0.3)',
      borderRadius: 12,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 20,
      gap: 20,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    statText: {
      fontSize: 14,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.9)',
    },
    statsModal: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    statsModalBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    statsModalGlass: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    statsModalContent: {
      backgroundColor: 'rgba(30, 30, 30, 0.95)',
      borderRadius: 24,
      padding: 30,
      maxWidth: 350,
      width: '90%',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statsModalTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 20,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 5,
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
    },
    streakBadge: {
      backgroundColor: 'rgba(255, 165, 0, 0.2)',
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 165, 0, 0.4)',
      marginBottom: 20,
    },
    streakText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFA500',
      textAlign: 'center',
    },
    statsCloseButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    statsCloseText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    gameOverOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    gameOverBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    gameOverGlass: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    gameOverContent: {
      alignItems: 'center',
      padding: 35,
      maxWidth: 400,
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      shadowColor: 'rgba(255, 105, 180, 0.5)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 15,
    },
    gameOverTitle: {
      fontSize: 80,
      marginBottom: 15,
    },
    gameOverSubtitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFD700',
      textAlign: 'center',
      textShadowColor: 'rgba(255, 215, 0, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
      marginBottom: 10,
    },
    gameOverMessage: {
      fontSize: 18,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.95)',
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
      marginBottom: 20,
      paddingHorizontal: 20,
      lineHeight: 26,
    },
    winStreakText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFA500',
      textAlign: 'center',
      marginBottom: 20,
    },
    gameOverStats: {
      flexDirection: 'row',
      gap: 30,
      marginBottom: 30,
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    gameOverButtons: {
      flexDirection: 'row',
      gap: 15,
      width: '100%',
    },
    gameOverButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 16,
      borderWidth: 2,
    },
    replayButton: {
      backgroundColor: 'rgba(76, 175, 80, 0.3)',
      borderColor: '#4CAF50',
    },
    menuButtonStyle: {
      backgroundColor: 'rgba(33, 150, 243, 0.3)',
      borderColor: '#2196F3',
    },
    gameOverButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

export default MorpionGameScreen;