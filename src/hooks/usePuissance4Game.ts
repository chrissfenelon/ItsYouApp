import { useState, useCallback, useEffect, useRef } from 'react';
import { CellValue, AIDifficulty } from '../types/puissance4.types';
import { PUISSANCE4_CONFIG } from '../constants/Puissance4Constants';
import Puissance4AIService from '../services/Puissance4AIService';
import { Puissance4Service } from '../services/Puissance4Service';
import SoundService from '../services/SoundService';

interface UsePuissance4GameProps {
  mode: 'local' | 'ai' | 'online';
  difficulty?: AIDifficulty;
  playerColor?: 'Rouge' | 'Jaune';
  gameId?: string;
  playerId?: string;
  onGameEnd?: (winner: 'Rouge' | 'Jaune' | 'draw') => void;
}

export const usePuissance4Game = ({
  mode,
  difficulty = 'moyen',
  playerColor = 'Rouge',
  gameId,
  playerId,
  onGameEnd,
}: UsePuissance4GameProps) => {
  // État du plateau (6 lignes x 7 colonnes)
  const [board, setBoard] = useState<CellValue[][]>(() => {
    const initialBoard = Array.from({ length: PUISSANCE4_CONFIG.ROWS }, () =>
      Array.from({ length: PUISSANCE4_CONFIG.COLS }, () => null)
    );
    console.log('🎮 Initial board created:', initialBoard.length, 'x', initialBoard[0]?.length);
    return initialBoard;
  });

  const [currentPlayer, setCurrentPlayer] = useState<'Rouge' | 'Jaune'>('Rouge');
  const [winner, setWinner] = useState<'Rouge' | 'Jaune' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<{ row: number; col: number }[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const [moveCount, setMoveCount] = useState(0);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiReasoningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start background music when game starts
  useEffect(() => {
    SoundService.startGameMusic('puissance4');

    return () => {
      SoundService.stopGameMusic();
      // Clear AI timeouts on unmount
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
      if (aiReasoningTimeoutRef.current) {
        clearTimeout(aiReasoningTimeoutRef.current);
      }
    };
  }, []);

  // Écouter les mises à jour Firebase pour le mode online
  useEffect(() => {
    if (mode === 'online' && gameId) {
      console.log('🔗 Setting up Firebase listener for game:', gameId);

      unsubscribeRef.current = Puissance4Service.subscribeToGame(
        gameId,
        (game) => {
          console.log('🔄 Firebase update received:', {
            moveCount: game.moves.length,
            currentPlayer: game.currentPlayer,
            status: game.status,
            boardSize: game.board?.length,
          });

          if (game) {
            // Firebase stocke le board comme un tableau plat de 42 éléments (6x7)
            // Il faut le convertir en tableau 2D
            if (game.board && Array.isArray(game.board)) {
              if (game.board.length === PUISSANCE4_CONFIG.ROWS * PUISSANCE4_CONFIG.COLS) {
                // Convertir le tableau plat en 2D
                const board2D = Puissance4Service.flatTo2D(game.board);
                console.log('📥 Board converted from flat to 2D:', board2D.length, 'x', board2D[0]?.length);
                console.log('🎮 Updating local board state');
                setBoard(board2D);
              } else {
                console.error('Invalid flat board size from Firebase:', game.board.length, '(expected 42)');
                // Réinitialiser le plateau si la taille est incorrecte
                setBoard(
                  Array.from({ length: PUISSANCE4_CONFIG.ROWS }, () =>
                    Array.from({ length: PUISSANCE4_CONFIG.COLS }, () => null)
                  )
                );
              }
            } else {
              console.error('Invalid board from Firebase:', game.board);
            }
            console.log('👤 Updating current player to:', game.currentPlayer);
            setCurrentPlayer(game.currentPlayer);
            setMoveCount(game.moves.length);

            if (game.status === 'finished') {
              if (game.winner === 'draw') {
                setWinner('draw');
              } else if (game.winner) {
                setWinner(game.winner);
                if (game.winningLine) {
                  setWinningLine(game.winningLine);
                }
                if (onGameEnd) {
                  onGameEnd(game.winner);
                }
              }
            }
          }
        },
        (error) => {
          console.error('Error subscribing to game:', error);
        }
      );

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    }
  }, [mode, gameId, onGameEnd]);

  // Trouver la ligne disponible dans une colonne
  const findAvailableRow = useCallback((col: number): number => {
    if (!board || !Array.isArray(board) || board.length === 0) {
      console.error('Invalid board state:', board);
      return -1;
    }

    for (let row = PUISSANCE4_CONFIG.ROWS - 1; row >= 0; row--) {
      if (board[row] && Array.isArray(board[row]) && board[row][col] === null) {
        return row;
      }
    }
    return -1;
  }, [board]);

  // Vérifier s'il y a un gagnant
  const checkWinner = useCallback(
    (
      newBoard: CellValue[][],
      row: number,
      col: number,
      color: 'Rouge' | 'Jaune'
    ): { winner: boolean; line: { row: number; col: number }[] } => {
      const directions = [
        { dr: 0, dc: 1 },  // Horizontal →
        { dr: 1, dc: 0 },  // Vertical ↓
        { dr: 1, dc: 1 },  // Diagonale ↘
        { dr: 1, dc: -1 }, // Diagonale ↙
      ];

      for (const { dr, dc } of directions) {
        const line: { row: number; col: number }[] = [{ row, col }];
        let count = 1;

        // Direction positive
        let r = row + dr;
        let c = col + dc;
        while (
          r >= 0 &&
          r < PUISSANCE4_CONFIG.ROWS &&
          c >= 0 &&
          c < PUISSANCE4_CONFIG.COLS &&
          newBoard[r][c] === color
        ) {
          line.push({ row: r, col: c });
          count++;
          r += dr;
          c += dc;
        }

        // Direction négative
        r = row - dr;
        c = col - dc;
        while (
          r >= 0 &&
          r < PUISSANCE4_CONFIG.ROWS &&
          c >= 0 &&
          c < PUISSANCE4_CONFIG.COLS &&
          newBoard[r][c] === color
        ) {
          line.unshift({ row: r, col: c });
          count++;
          r -= dr;
          c -= dc;
        }

        if (count >= PUISSANCE4_CONFIG.WIN_LENGTH) {
          return { winner: true, line };
        }
      }

      return { winner: false, line: [] };
    },
    []
  );

  // Vérifier si le plateau est plein
  const isBoardFull = useCallback((newBoard: CellValue[][]): boolean => {
    return newBoard[0].every(cell => cell !== null);
  }, []);

  // Jouer un coup
  const playMove = useCallback(
    async (col: number) => {
      if (winner) return; // Partie terminée
      if (isAIThinking) return; // Attendre l'IA

      const row = findAvailableRow(col);
      if (row === -1) {
        SoundService.playInvalidMove();
        return; // Colonne pleine
      }

      // Pour le mode online, envoyer le coup à Firebase
      if (mode === 'online' && gameId && playerId) {
        try {
          console.log('📤 Sending move to Firebase:', { gameId, playerId, col, row });
          await Puissance4Service.playMove(gameId, playerId, col);
          console.log('✅ Move sent successfully to Firebase');
        } catch (error) {
          console.error('❌ Error playing move:', error);
        }
        return;
      }

      // Mode local ou AI: gérer localement
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = currentPlayer;
      setBoard(newBoard);
      setMoveCount(prev => prev + 1);

      // Play tile placement sound
      SoundService.playTilePlace();

      // Vérifier la victoire
      const winResult = checkWinner(newBoard, row, col, currentPlayer);
      if (winResult.winner) {
        setWinner(currentPlayer);
        setWinningLine(winResult.line);
        SoundService.playGameWin();
        if (onGameEnd) {
          onGameEnd(currentPlayer);
        }
        return;
      }

      // Vérifier le match nul
      if (isBoardFull(newBoard)) {
        setWinner('draw');
        SoundService.playGameEnd();
        if (onGameEnd) {
          onGameEnd('draw');
        }
        return;
      }

      // Passer au joueur suivant
      const nextPlayer = currentPlayer === 'Rouge' ? 'Jaune' : 'Rouge';
      setCurrentPlayer(nextPlayer);

      // Si mode IA et c'est le tour de l'IA
      if (mode === 'ai' && nextPlayer !== playerColor) {
        // Attendre un peu pour l'effet de réflexion
        setIsAIThinking(true);
        setAiReasoning('');

        // Créer une référence stable du plateau pour l'IA
        const boardForAI = newBoard.map(r => [...r]);

        aiTimeoutRef.current = setTimeout(async () => {
          const aiColor = nextPlayer;

          // Calculer le meilleur coup de l'IA avec le plateau actuel
          const aiMove = Puissance4AIService.getBestMove(boardForAI, aiColor, difficulty);

          setAiReasoning(aiMove.reasoning);

          // Attendre encore un peu pour que l'utilisateur puisse lire
          await new Promise(resolve => {
            aiReasoningTimeoutRef.current = setTimeout(resolve, 500);
          });

          // Trouver la ligne disponible dans la colonne choisie par l'IA
          let aiRow = -1;
          for (let row = PUISSANCE4_CONFIG.ROWS - 1; row >= 0; row--) {
            if (boardForAI[row][aiMove.column] === null) {
              aiRow = row;
              break;
            }
          }

          // Jouer le coup de l'IA
          if (aiRow !== -1) {
            const aiBoard = boardForAI.map(r => [...r]);
            aiBoard[aiRow][aiMove.column] = aiColor;

            // Mettre à jour le plateau immédiatement
            setBoard(aiBoard);
            setMoveCount(prev => prev + 1);

            // Play AI tile placement sound
            SoundService.playTilePlace();

            // Vérifier la victoire de l'IA
            const aiWinResult = checkWinner(aiBoard, aiRow, aiMove.column, aiColor);
            if (aiWinResult.winner) {
              setWinner(aiColor);
              setWinningLine(aiWinResult.line);
              setIsAIThinking(false);
              SoundService.playGameWin();
              if (onGameEnd) {
                onGameEnd(aiColor);
              }
            } else if (isBoardFull(aiBoard)) {
              setWinner('draw');
              setIsAIThinking(false);
              SoundService.playGameEnd();
              if (onGameEnd) {
                onGameEnd('draw');
              }
            } else {
              // Rendre le tour au joueur
              setCurrentPlayer(playerColor);
              setIsAIThinking(false);
            }
          } else {
            // Si la colonne est pleine (ne devrait pas arriver), essayer une autre
            console.error('AI chose a full column, finding alternative...');
            for (let col = 0; col < PUISSANCE4_CONFIG.COLS; col++) {
              let altRow = -1;
              for (let row = PUISSANCE4_CONFIG.ROWS - 1; row >= 0; row--) {
                if (boardForAI[row][col] === null) {
                  altRow = row;
                  break;
                }
              }
              if (altRow !== -1) {
                const aiBoard = boardForAI.map(r => [...r]);
                aiBoard[altRow][col] = aiColor;
                setBoard(aiBoard);
                setMoveCount(prev => prev + 1);
                setCurrentPlayer(playerColor);
                break;
              }
            }
            setIsAIThinking(false);
          }
        }, PUISSANCE4_CONFIG.AI.THINK_DURATION[difficulty]);
      }
    },
    [
      board,
      currentPlayer,
      winner,
      isAIThinking,
      mode,
      gameId,
      playerId,
      playerColor,
      difficulty,
      findAvailableRow,
      checkWinner,
      isBoardFull,
      onGameEnd,
    ]
  );

  // Réinitialiser la partie
  const resetGame = useCallback(() => {
    setBoard(
      Array.from({ length: PUISSANCE4_CONFIG.ROWS }, () =>
        Array.from({ length: PUISSANCE4_CONFIG.COLS }, () => null)
      )
    );
    setCurrentPlayer('Rouge');
    setWinner(null);
    setWinningLine([]);
    setIsAIThinking(false);
    setAiReasoning('');
    setMoveCount(0);
  }, []);

  // Abandonner (pour le mode online)
  const forfeit = useCallback(async () => {
    if (mode === 'online' && gameId && playerId) {
      try {
        await Puissance4Service.forfeitGame(gameId, playerId);
      } catch (error) {
        console.error('Error forfeiting game:', error);
      }
    }
  }, [mode, gameId, playerId]);

  return {
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
  };
};
