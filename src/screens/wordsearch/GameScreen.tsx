import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useWordSearchGame } from '../../hooks/wordsearch/useWordSearchGame';
import { useProfile } from '../../hooks/storage/useProfile';
import { usePreferences } from '../../hooks/storage/usePreferences';
import WordSearchGrid from '../../components/wordsearch/core/WordSearchGrid';
import WordList from '../../components/wordsearch/core/WordList';
import GameTimer from '../../components/wordsearch/core/GameTimer';
import WordFoundAnimation from '../../components/wordsearch/animations/WordFoundAnimation';
import BonusWordsRevealModal from '../../components/wordsearch/ui/BonusWordsRevealModal';
import PowerUpsBar from '../../components/wordsearch/ui/PowerUpsBar';
import QuickShopModal from '../../components/wordsearch/ui/QuickShopModal';
import { WORD_SEARCH_COLORS } from '../../data/constants/colors';
import { Difficulty, Word, PlayerPowerUps } from '../../types/wordSearch.types';

interface GameScreenProps {
  difficulty: Difficulty;
  words: string[];
  themeId: string;
  themeName: string;
  levelId?: number;
  bonusWords?: string[];
  onExit?: () => void;
  onGameComplete?: (result: any) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({
  difficulty,
  words,
  themeId,
  themeName,
  levelId,
  bonusWords = [],
  onExit,
  onGameComplete,
}) => {
  const { profile, usePowerUp, addPowerUp, spendCoins } = useProfile();
  const { currentTheme } = usePreferences();
  const [foundWordAnimation, setFoundWordAnimation] = useState<string | null>(null);
  const [isBonusWord, setIsBonusWord] = useState<boolean>(false);
  const [showBonusReveal, setShowBonusReveal] = useState<boolean>(false);
  const [remainingBonusWords, setRemainingBonusWords] = useState<Word[]>([]);
  const [showQuickShop, setShowQuickShop] = useState<boolean>(false);
  const [quickShopPowerUpType, setQuickShopPowerUpType] = useState<keyof PlayerPowerUps>('revealLetter');

  const handleWordFound = (word: any) => {
    setFoundWordAnimation(word.text);
    setIsBonusWord(word.isBonus || false);
  };

  const handleAllRegularWordsFound = (bonusWordsRemaining: Word[]) => {
    setRemainingBonusWords(bonusWordsRemaining);
    setShowBonusReveal(true);
    // Pause the game to show the modal
    pauseGame();
  };

  const handleContinuePlaying = () => {
    setShowBonusReveal(false);
    resumeGame();
  };

  const handleFinishLevel = () => {
    setShowBonusReveal(false);
    // Use the endGame function from the hook to properly calculate rewards
    if (endGame) {
      endGame();
    }
  };

  const {
    grid,
    gameState,
    handleSelectionComplete,
    pauseGame,
    resumeGame,
    restartGame,
    endGame,
    highlightedCells,
    timeFreezeRemaining,
    powerUps: gamePowerUps,
  } = useWordSearchGame({
    difficulty,
    words,
    themeId,
    levelId,
    bonusWords,
    onGameComplete,
    onWordFound: handleWordFound,
    onAllRegularWordsFound: handleAllRegularWordsFound,
  });

  const handleSelection = (cells: any[]) => {
    handleSelectionComplete(cells);
  };

  const handleUsePowerUp = async (type: keyof PlayerPowerUps) => {
    try {
      // Apply the power-up effect to the game
      switch (type) {
        case 'revealLetter':
          gamePowerUps.revealLetter();
          break;
        case 'revealWord':
          gamePowerUps.revealWord();
          break;
        case 'timeFreeze':
          gamePowerUps.timeFreeze();
          break;
        case 'highlightFirst':
          gamePowerUps.highlightFirst();
          break;
      }

      // Deduct from profile
      await usePowerUp(type);
    } catch (error) {
      console.error('Error using power-up:', error);
    }
  };

  const handleBuyPowerUp = (type: keyof PlayerPowerUps) => {
    setQuickShopPowerUpType(type);
    setShowQuickShop(true);
  };

  const handlePurchasePowerUp = async (type: keyof PlayerPowerUps, quantity: number) => {
    const PRICES: Record<keyof PlayerPowerUps, number> = {
      revealLetter: 10,
      revealWord: 30,
      timeFreeze: 20,
      highlightFirst: 15,
    };

    const totalCost = PRICES[type] * quantity;

    // Spend coins
    await spendCoins(totalCost);
    // Add power-ups to inventory
    await addPowerUp(type, quantity);
  };

  if (!grid) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Génération du puzzle...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      {/* Bonus Words Reveal Modal */}
      {grid && (
        <BonusWordsRevealModal
          visible={showBonusReveal}
          bonusWords={grid.words.filter(w => w.isBonus)}
          onContinue={handleContinuePlaying}
          onFinish={handleFinishLevel}
        />
      )}

      {/* Quick Shop Modal */}
      {profile && (
        <QuickShopModal
          visible={showQuickShop}
          powerUpType={quickShopPowerUpType}
          currentCoins={profile.coins}
          onPurchase={handlePurchasePowerUp}
          onClose={() => setShowQuickShop(false)}
        />
      )}

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={onExit}>
              <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.themeTitle}>{themeName}</Text>
            <Text style={styles.difficultyBadge}>{difficulty.toUpperCase()}</Text>
          </View>

          <View style={styles.statsRow}>
            <GameTimer
              timeElapsed={gameState.timeElapsed}
              timeLimit={gameState.timeLimit}
              isPaused={gameState.isPaused}
            />
            {timeFreezeRemaining > 0 && (
              <View style={styles.timeFreezeIndicator}>
                <Text style={styles.timeFreezeText}>⏸️ Gel: {timeFreezeRemaining}s</Text>
              </View>
            )}
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{gameState.score}</Text>
            </View>
          </View>
        </View>

        {/* Power-Ups Bar */}
        {profile && profile.powerUps && (
          <PowerUpsBar
            powerUps={profile.powerUps}
            onUsePowerUp={handleUsePowerUp}
            onBuyPowerUp={handleBuyPowerUp}
            disabled={gameState.isGameOver || gameState.isPaused}
          />
        )}

        {/* Grid */}
        <View style={styles.gridContainer}>
          <WordSearchGrid
            grid={grid}
            onSelectionComplete={handleSelection}
            disabled={gameState.isGameOver || gameState.isPaused}
            highlightedCells={highlightedCells}
            theme={currentTheme}
          />

          {/* Animation mot trouvé */}
          {foundWordAnimation && (
            <WordFoundAnimation
              word={foundWordAnimation}
              isBonus={isBonusWord}
              onComplete={() => {
                setFoundWordAnimation(null);
                setIsBonusWord(false);
              }}
            />
          )}
        </View>

        {/* Word List */}
        <WordList words={grid.words} />

        {/* Controls */}
        <View style={styles.controls}>
          {gameState.isGameOver ? (
            <View style={styles.gameOverContainer}>
              <Text style={styles.gameOverTitle}>
                {gameState.foundWords.length === grid.words.length ? '🎉 Parfait !' : 'Temps écoulé !'}
              </Text>
              <Text style={styles.gameOverText}>
                Trouvé {gameState.foundWords.length} sur {grid.words.length} mots
              </Text>
              <Text style={styles.gameOverScore}>Score: {gameState.score}</Text>
              <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
                <Text style={styles.restartButtonText}>Rejouer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={gameState.isPaused ? resumeGame : pauseGame}
            >
              <Text style={styles.pauseButtonText}>
                {gameState.isPaused ? '▶ Reprendre' : '⏸ Pause'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.background,
  },
  loadingText: {
    fontSize: 18,
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: WORD_SEARCH_COLORS.primary,
    fontWeight: '600',
  },
  themeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  difficultyBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
    backgroundColor: WORD_SEARCH_COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.headerBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.primary,
  },
  gridContainer: {
    marginVertical: 16,
  },
  controls: {
    marginTop: 16,
    marginBottom: 32,
  },
  pauseButton: {
    backgroundColor: WORD_SEARCH_COLORS.buttonSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
  gameOverContainer: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 12,
  },
  gameOverText: {
    fontSize: 18,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 8,
  },
  gameOverScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.primary,
    marginBottom: 24,
  },
  restartButton: {
    backgroundColor: WORD_SEARCH_COLORS.buttonPrimary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  restartButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
  timeFreezeIndicator: {
    backgroundColor: WORD_SEARCH_COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeFreezeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
});

export default GameScreen;
