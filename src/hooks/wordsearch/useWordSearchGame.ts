import { useState, useEffect, useCallback, useRef } from 'react';
import { Cell, Difficulty, GameResult, GameState, Grid, Word } from '../../types/wordSearch.types';
import { WordSearchGenerator } from '../../services/wordsearch/WordSearchGenerator';
import { DIFFICULTY_CONFIGS } from '../../data/constants/gameRules';
import { COIN_REWARDS, XP_REWARDS } from '../../data/constants/rewards';
import { isBonusWord, getBonusReward } from '../../data/bonusWords';
import SoundService from '../../services/SoundService';

interface UseWordSearchGameProps {
  difficulty: Difficulty;
  words: string[];
  themeId: string;
  levelId?: number;
  bonusWords?: string[];
  onGameComplete?: (result: GameResult) => void;
  onWordFound?: (word: Word) => void;
  onAllRegularWordsFound?: (remainingBonusWords: Word[]) => void;
}

export const useWordSearchGame = ({
  difficulty,
  words,
  themeId,
  levelId,
  bonusWords = [],
  onGameComplete,
  onWordFound,
  onAllRegularWordsFound,
}: UseWordSearchGameProps) => {
  const config = DIFFICULTY_CONFIGS[difficulty];

  const [grid, setGrid] = useState<Grid | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    grid: { cells: [], size: 0, words: [] },
    selectedCells: [],
    foundWords: [],
    score: 0,
    timeElapsed: 0,
    timeLimit: config.timeLimit,
    isGameOver: false,
    isPaused: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastWordFoundTimeRef = useRef<number>(0);
  const [highlightedCells, setHighlightedCells] = useState<{ row: number; col: number }[]>([]);
  const [timeFreezeRemaining, setTimeFreezeRemaining] = useState<number>(0);
  const hasInitialized = useRef(false);

  // Start background music when game starts
  useEffect(() => {
    SoundService.startGameMusic('wordsearch');

    return () => {
      SoundService.stopGameMusic();
    };
  }, []);

  // Initialize game - Only once when component mounts or difficulty changes
  useEffect(() => {
    // Prevent re-initialization if grid already exists and difficulty hasn't changed
    if (hasInitialized.current && grid && grid.size === config.gridSize) {
      return;
    }

    console.log('Initializing word search game with', words.length, 'words');
    const generator = new WordSearchGenerator(config.gridSize);
    const newGrid = generator.generateGrid(words, config, bonusWords);

    if (!newGrid || !newGrid.cells || newGrid.cells.length === 0) {
      console.error('Failed to generate grid');
      return;
    }

    console.log('Grid generated successfully:', {
      size: newGrid.size,
      wordsCount: newGrid.words.length,
      cellsLength: newGrid.cells.length,
    });

    setGrid(newGrid);
    setGameState(prev => ({
      ...prev,
      grid: newGrid,
    }));
    hasInitialized.current = true;
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (gameState.isGameOver || gameState.isPaused || !grid) return;

    timerRef.current = setInterval(() => {
      // Handle time freeze countdown
      if (timeFreezeRemaining > 0) {
        setTimeFreezeRemaining(prev => prev - 1);
        return; // Don't increment time while frozen
      }

      setGameState(prev => {
        const newTimeElapsed = prev.timeElapsed + 1;

        // Play timer tick sound
        SoundService.playTimerTick();

        // Play warning sound when time is running out (last 10 seconds)
        if (config.timeLimit && (config.timeLimit - newTimeElapsed) === 10) {
          SoundService.playTimerWarning();
        }

        // Check if time limit reached
        if (config.timeLimit && newTimeElapsed >= config.timeLimit) {
          endGame();
          return { ...prev, timeElapsed: newTimeElapsed, isGameOver: true };
        }

        return { ...prev, timeElapsed: newTimeElapsed };
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.isGameOver, gameState.isPaused, grid, timeFreezeRemaining, config.timeLimit, endGame]);

  // Handle selection complete
  const handleSelectionComplete = useCallback((selectedCells: Cell[]) => {
    if (gameState.isGameOver || !grid) return;

    // D'abord vérifier si c'est un mot officiel
    const foundWord = WordSearchGenerator.validateSelection(selectedCells, grid.words);

    if (foundWord && !foundWord.found) {
      // Mark word as found
      const updatedWords = grid.words.map(word =>
        word.id === foundWord.id ? { ...word, found: true } : word
      );

      // Mark cells as found
      const updatedCells = grid.cells.map(row =>
        row.map(cell => {
          const isInWord = selectedCells.some(
            selectedCell => selectedCell.row === cell.row && selectedCell.col === cell.col
          );
          return isInWord ? { ...cell, isFound: true, wordId: foundWord.id } : cell;
        })
      );

      // Calculate score
      const basePoints = 100;
      const letterPoints = foundWord.text.length * 10;
      const now = Date.now();
      const timeSinceLastWord = (now - lastWordFoundTimeRef.current) / 1000;
      const comboBonus = timeSinceLastWord < 5 ? 50 : 0;

      const wordScore = basePoints + letterPoints + comboBonus;

      lastWordFoundTimeRef.current = now;

      const updatedGrid: Grid = {
        ...grid,
        words: updatedWords,
        cells: updatedCells,
      };

      const newFoundWords = [...gameState.foundWords, foundWord];
      const newScore = gameState.score + wordScore;

      setGrid(updatedGrid);
      setGameState(prev => ({
        ...prev,
        grid: updatedGrid,
        foundWords: newFoundWords,
        score: newScore,
      }));

      // Play word found sound
      SoundService.playWordFound();

      // Notify word found
      if (onWordFound) {
        onWordFound(foundWord);
      }

      // Check if all regular (non-bonus) words are found
      const regularWords = updatedWords.filter(w => !w.isBonus);
      const allRegularWordsFound = regularWords.every(w => w.found);

      if (allRegularWordsFound) {
        // Check if there are any unfound bonus words
        const bonusWordsInGrid = updatedWords.filter(w => w.isBonus);
        const unfoundBonusWords = bonusWordsInGrid.filter(w => !w.found);

        if (unfoundBonusWords.length > 0 && onAllRegularWordsFound) {
          // Notify that all regular words are found but bonus words remain
          onAllRegularWordsFound(unfoundBonusWords);
        } else {
          // All words (including bonus) are found, end game
          endGame(updatedGrid, newFoundWords, newScore);
        }
      }

      return; // Mot trouvé, on arrête ici
    }

    // Si ce n'est pas un mot officiel, vérifier si c'est un mot bonus
    const selectedWord = selectedCells.map(cell => cell.letter).join('');
    if (selectedCells.length >= 3 && isBonusWord(selectedWord)) {
      const bonusReward = getBonusReward(selectedWord.length);

      if (bonusReward) {
        // Créer un mot bonus
        const bonusWord: Word = {
          id: `bonus-${Date.now()}`,
          text: selectedWord,
          found: true,
          startPos: { row: selectedCells[0].row, col: selectedCells[0].col },
          endPos: { row: selectedCells[selectedCells.length - 1].row, col: selectedCells[selectedCells.length - 1].col },
          direction: 'horizontal',
          color: '#FFD700', // Or pour les bonus
          isBonus: true,
        };

        // Ajouter le mot bonus à la liste
        const updatedWords = [...grid.words, bonusWord];

        // Marquer les cellules comme trouvées avec une couleur spéciale
        const updatedCells = grid.cells.map(row =>
          row.map(cell => {
            const isInWord = selectedCells.some(
              selectedCell => selectedCell.row === cell.row && selectedCell.col === cell.col
            );
            return isInWord ? { ...cell, isFound: true, wordId: bonusWord.id } : cell;
          })
        );

        const updatedGrid: Grid = {
          ...grid,
          words: updatedWords,
          cells: updatedCells,
        };

        // Score bonus
        const bonusScore = bonusReward.coins * 10;
        const newScore = gameState.score + bonusScore;
        const newFoundWords = [...gameState.foundWords, bonusWord];

        setGrid(updatedGrid);
        setGameState(prev => ({
          ...prev,
          grid: updatedGrid,
          foundWords: newFoundWords,
          score: newScore,
        }));

        // Play bonus word sound
        SoundService.playWordFound();

        // Notify bonus word found
        if (onWordFound) {
          onWordFound(bonusWord);
        }

        lastWordFoundTimeRef.current = Date.now();
      }
    }
  }, [grid, gameState, endGame, onWordFound, onAllRegularWordsFound]);

  // End game
  const endGame = useCallback((finalGrid?: Grid, finalFoundWords?: Word[], finalScore?: number) => {
    const usedGrid = finalGrid || grid;
    const usedFoundWords = finalFoundWords || gameState.foundWords;
    const usedScore = finalScore !== undefined ? finalScore : gameState.score;

    if (!usedGrid) return;

    setGameState(prev => ({ ...prev, isGameOver: true }));

    // Calculate rewards
    const regularWords = usedFoundWords.filter(w => !w.isBonus);
    const bonusWords = usedFoundWords.filter(w => w.isBonus);
    const wordsFound = regularWords.length;
    const totalWords = usedGrid.words.filter(w => !w.isBonus).length;
    const isPerfect = wordsFound === totalWords;

    // Play game end sound
    if (isPerfect) {
      SoundService.playGameWin();
    } else {
      SoundService.playGameEnd();
    }

    let coinsEarned = config.coinReward;
    let xpEarned = config.xpReward;

    // Time bonus (if finished early)
    const timeRemaining = Math.max(0, config.timeLimit - gameState.timeElapsed);
    if (timeRemaining > 0 && isPerfect) {
      coinsEarned += Math.floor(timeRemaining * COIN_REWARDS.timeBonus);
      xpEarned += Math.floor(timeRemaining * XP_REWARDS.timeBonus);
    }

    // Perfect bonus
    if (isPerfect) {
      coinsEarned += COIN_REWARDS.perfectBonus;
      xpEarned += XP_REWARDS.perfectBonus;
    }

    // Per word bonus
    xpEarned += wordsFound * XP_REWARDS.perWord;

    // Bonus words rewards
    bonusWords.forEach(bonusWord => {
      const reward = getBonusReward(bonusWord.text.length);
      if (reward) {
        coinsEarned += reward.coins;
        xpEarned += reward.xp;
      }
    });

    const result: GameResult = {
      score: usedScore,
      timeElapsed: gameState.timeElapsed,
      wordsFound,
      totalWords,
      bonusWordsFound: bonusWords.length,
      coinsEarned,
      xpEarned,
      leveledUp: false,
      difficulty,
      theme: themeId,
    };

    if (onGameComplete) {
      onGameComplete(result);
    }
  }, [grid, gameState, config, difficulty, themeId, onGameComplete]);

  // Pause/Resume
  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: false }));
  }, []);

  // Restart game
  const restartGame = useCallback(() => {
    const generator = new WordSearchGenerator(config.gridSize);
    const newGrid = generator.generateGrid(words, config, bonusWords);
    setGrid(newGrid);
    setGameState({
      grid: newGrid,
      selectedCells: [],
      foundWords: [],
      score: 0,
      timeElapsed: 0,
      timeLimit: config.timeLimit,
      isGameOver: false,
      isPaused: false,
    });
    lastWordFoundTimeRef.current = 0;
    setHighlightedCells([]);
    setTimeFreezeRemaining(0);
  }, [words, config, bonusWords]);

  // Power-Up: Reveal Letter
  const revealLetter = useCallback(() => {
    if (!grid) return;

    // Find unfound words
    const unfoundWords = grid.words.filter(w => !w.found && !w.isBonus);
    if (unfoundWords.length === 0) return;

    // Pick random unfound word
    const randomWord = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];

    // Find cells for this word
    const wordCells: { row: number; col: number }[] = [];
    const { startPos, endPos, direction } = randomWord;

    let currentRow = startPos.row;
    let currentCol = startPos.col;

    const rowStep = endPos.row > startPos.row ? 1 : endPos.row < startPos.row ? -1 : 0;
    const colStep = endPos.col > startPos.col ? 1 : endPos.col < startPos.col ? -1 : 0;

    while (currentRow !== endPos.row || currentCol !== endPos.col) {
      wordCells.push({ row: currentRow, col: currentCol });
      currentRow += rowStep;
      currentCol += colStep;
    }
    wordCells.push({ row: endPos.row, col: endPos.col });

    // Pick random cell from this word
    const randomCell = wordCells[Math.floor(Math.random() * wordCells.length)];

    // Highlight this cell for 3 seconds
    setHighlightedCells([randomCell]);
    setTimeout(() => setHighlightedCells([]), 3000);
  }, [grid]);

  // Power-Up: Reveal Word
  const revealWord = useCallback(() => {
    if (!grid) return;

    // Find unfound words
    const unfoundWords = grid.words.filter(w => !w.found && !w.isBonus);
    if (unfoundWords.length === 0) return;

    // Pick random unfound word
    const randomWord = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];

    // Build cells array for this word
    const wordCells: Cell[] = [];
    const { startPos, endPos } = randomWord;

    let currentRow = startPos.row;
    let currentCol = startPos.col;

    const rowStep = endPos.row > startPos.row ? 1 : endPos.row < startPos.row ? -1 : 0;
    const colStep = endPos.col > startPos.col ? 1 : endPos.col < startPos.col ? -1 : 0;

    while (currentRow !== endPos.row || currentCol !== endPos.col) {
      wordCells.push(grid.cells[currentRow][currentCol]);
      currentRow += rowStep;
      currentCol += colStep;
    }
    wordCells.push(grid.cells[endPos.row][endPos.col]);

    // Automatically select and find this word
    handleSelectionComplete(wordCells);
  }, [grid, handleSelectionComplete]);

  // Power-Up: Time Freeze (30 seconds)
  const timeFreeze = useCallback(() => {
    setTimeFreezeRemaining(30);
  }, []);

  // Power-Up: Highlight First Letters
  const highlightFirst = useCallback(() => {
    if (!grid) return;

    // Find unfound words
    const unfoundWords = grid.words.filter(w => !w.found && !w.isBonus);

    // Get first cell of each unfound word
    const firstCells = unfoundWords.map(w => ({
      row: w.startPos.row,
      col: w.startPos.col,
    }));

    // Highlight for 5 seconds
    setHighlightedCells(firstCells);
    setTimeout(() => setHighlightedCells([]), 5000);
  }, [grid]);

  return {
    grid,
    gameState,
    handleSelectionComplete,
    pauseGame,
    resumeGame,
    restartGame,
    endGame,
    highlightedCells,
    timeFreezeRemaining,
    powerUps: {
      revealLetter,
      revealWord,
      timeFreeze,
      highlightFirst,
    },
  };
};
