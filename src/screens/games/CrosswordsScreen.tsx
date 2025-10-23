import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  TextInput,
  Keyboard,
  Modal,
  ScrollView,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useApp } from '../../context/AppContext';
import { getBackgroundSource } from '../../utils/backgroundUtils';
import CrosswordGrid from '../../components/crossword/CrosswordGrid';
import CluesPanel from '../../components/crossword/CluesPanel';
import { generateCrosswordPuzzle, CrosswordGrid as GridData } from '../../services/CrosswordGenerator';
import { frenchCrosswordWords, getWordsByDifficulty } from '../../data/crosswordWords';
import SoundService from '../../services/SoundService';
import { DareButton } from '../../components/DareButton';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

export const CrosswordsScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const styles = createStyles(currentTheme);

  // Game state
  const [difficulty] = useState<'facile' | 'moyen' | 'difficile'>('facile');
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [userInput, setUserInput] = useState<string[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [completedWords, setCompletedWords] = useState<number[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Initialize game
  useEffect(() => {
    const words = getWordsByDifficulty(difficulty);
    const puzzle = generateCrosswordPuzzle(difficulty, words);
    setGridData(puzzle);

    // Initialize user input grid
    const emptyInput = Array(puzzle.size)
      .fill(null)
      .map(() => Array(puzzle.size).fill(''));
    setUserInput(emptyInput);

    SoundService.playGameStart();
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (!isPaused && gridData) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPaused, startTime, gridData]);

  // Check for completed words
  useEffect(() => {
    if (!gridData) return;

    const newCompletedWords: number[] = [];

    gridData.words.forEach((word) => {
      let isComplete = true;
      for (let i = 0; i < word.word.length; i++) {
        const row = word.direction === 'across' ? word.startRow : word.startRow + i;
        const col = word.direction === 'across' ? word.startCol + i : word.startCol;

        if (userInput[row]?.[col]?.toUpperCase() !== word.word[i]) {
          isComplete = false;
          break;
        }
      }

      if (isComplete && !completedWords.includes(word.number)) {
        newCompletedWords.push(word.number);
      }
    });

    if (newCompletedWords.length > 0) {
      setCompletedWords([...completedWords, ...newCompletedWords]);

      // Haptic feedback and sound
      ReactNativeHapticFeedback.trigger('notificationSuccess');
      SoundService.playGameWin();

      // Check if puzzle is complete
      if (completedWords.length + newCompletedWords.length === gridData.words.length) {
        setTimeout(() => {
          showAlert({
            title: '🎉 Félicitations!',
            message: `Puzzle complété en ${formatTime(elapsedTime)}!\n${hintsUsed} indice(s) utilisé(s).`,
            buttons: [
              { text: 'Nouveau puzzle', onPress: () => navigateToScreen('crosswords') },
              { text: 'Menu', onPress: () => navigateToScreen('games') },
            ],
            type: 'success',
          });
        }, 500);
      }
    }
  }, [userInput]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellPress = (row: number, col: number) => {
    if (!gridData) return;

    setSelectedCell({ row, col });

    // Find word that contains this cell
    const word = gridData.words.find(
      (w) =>
        (w.direction === 'across' &&
          w.startRow === row &&
          col >= w.startCol &&
          col < w.startCol + w.word.length) ||
        (w.direction === 'down' &&
          w.startCol === col &&
          row >= w.startRow &&
          row < w.startRow + w.word.length)
    );

    if (word) {
      setSelectedWord(word.number);
    }

    // Focus the hidden input to show keyboard
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    SoundService.playButtonClick();
    ReactNativeHapticFeedback.trigger('impactLight');
  };

  const handleLetterInput = (letter: string) => {
    if (!selectedCell || !gridData) return;

    const { row, col } = selectedCell;

    // Handle backspace
    if (letter === '') {
      const newInput = userInput.map((r) => [...r]);
      newInput[row][col] = '';
      setUserInput(newInput);
      ReactNativeHapticFeedback.trigger('impactLight');
      return;
    }

    // Set the letter
    const newInput = userInput.map((r) => [...r]);
    newInput[row][col] = letter.toUpperCase();
    setUserInput(newInput);

    // Smart navigation: move to next cell in the current word
    if (selectedWord) {
      const word = gridData.words.find((w) => w.number === selectedWord);
      if (word) {
        if (word.direction === 'across') {
          const nextCol = col + 1;
          if (nextCol < word.startCol + word.word.length) {
            setSelectedCell({ row, col: nextCol });
          }
        } else {
          const nextRow = row + 1;
          if (nextRow < word.startRow + word.word.length) {
            setSelectedCell({ row: nextRow, col });
          }
        }
      }
    }

    ReactNativeHapticFeedback.trigger('impactLight');

    // Keep focus on input for continuous typing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCluePress = (wordNumber: number) => {
    if (!gridData) return;

    const word = gridData.words.find((w) => w.number === wordNumber);
    if (word) {
      setSelectedCell({ row: word.startRow, col: word.startCol });
      setSelectedWord(word.number);
      SoundService.playButtonClick();
    }
  };

  const handleHint = () => {
    if (!selectedCell || !gridData) return;

    const { row, col } = selectedCell;
    const correctLetter = gridData.cells[row][col];

    if (correctLetter) {
      const newInput = userInput.map((r) => [...r]);
      newInput[row][col] = correctLetter;
      setUserInput(newInput);
      setHintsUsed(hintsUsed + 1);

      ReactNativeHapticFeedback.trigger('notificationWarning');
      SoundService.playButtonClick();
    }
  };

  if (!gridData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Génération du puzzle...</Text>
      </View>
    );
  }

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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigateToScreen('games')}
            >
              <Foundation name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.title}>Mots Croisés</Text>
              <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
            </View>

            <View style={styles.headerActions}>
              <DareButton
                gameType="crosswords"
                variant="icon"
                iconSize={20}
                showLabel={false}
                style={styles.dareButton}
              />
              <TouchableOpacity
                style={styles.hintButton}
                onPress={handleHint}
                disabled={!selectedCell}
              >
                <Foundation name="lightbulb" size={20} color="#FFFFFF" />
                <Text style={styles.hintText}>{hintsUsed}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setShowSettings(true)}
              >
                <Foundation name="widget" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Grid */}
          <CrosswordGrid
            gridData={gridData}
            userInput={userInput}
            selectedCell={selectedCell}
            completedWords={completedWords}
            onCellPress={handleCellPress}
          />

          {/* Clues Panel */}
          <CluesPanel
            words={gridData.words}
            completedWords={completedWords}
            selectedWord={selectedWord}
            onCluePress={handleCluePress}
          />

          {/* Hidden input for keyboard */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            autoCapitalize="characters"
            maxLength={1}
            onChangeText={handleLetterInput}
            value=""
          />
        </View>
      </ImageBackground>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>⚙️ Paramètres</Text>

            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setShowSettings(false);
                setShowTutorial(true);
              }}
            >
              <Foundation name="info" size={24} color="#FFFFFF" />
              <Text style={styles.settingsOptionText}>Comment jouer</Text>
              <Foundation name="arrow-right" size={20} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                showAlert({
                  title: '📊 Statistiques',
                  message: `Temps écoulé: ${formatTime(elapsedTime)}\nMots complétés: ${completedWords.length}/${gridData?.words.length || 0}\nIndices utilisés: ${hintsUsed}`,
                  buttons: [{ text: 'OK' }],
                  type: 'info',
                });
              }}
            >
              <Foundation name="graph-bar" size={24} color="#FFFFFF" />
              <Text style={styles.settingsOptionText}>Statistiques de la partie</Text>
              <Foundation name="arrow-right" size={20} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingsOption, { borderBottomWidth: 0 }]}
              onPress={() => setShowSettings(false)}
            >
              <Foundation name="x" size={24} color="#FFFFFF" />
              <Text style={styles.settingsOptionText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tutorial Modal */}
      <Modal
        visible={showTutorial}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTutorial(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.tutorialScrollView}
            contentContainerStyle={styles.tutorialContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.tutorialCard}>
              <Text style={styles.tutorialTitle}>📝 Comment Jouer aux Mots Croisés</Text>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSubtitle}>🎯 Objectif</Text>
                <Text style={styles.tutorialText}>
                  Remplissez toutes les cases de la grille en trouvant les mots correspondant aux définitions.
                </Text>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSubtitle}>🎮 Comment Jouer</Text>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Touchez une case pour la sélectionner</Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Le clavier apparaîtra automatiquement</Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Tapez les lettres pour remplir les cases</Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• Les cases passent au vert quand le mot est correct</Text>
                </View>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSubtitle}>💡 Indices</Text>
                <Text style={styles.tutorialText}>
                  Touchez le bouton ampoule 💡 pour révéler la lettre de la case sélectionnée.
                  Attention: chaque indice utilisé est compté!
                </Text>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSubtitle}>📋 Définitions</Text>
                <Text style={styles.tutorialText}>
                  Les définitions sont affichées en bas de l'écran. Touchez une définition pour
                  sélectionner automatiquement la première case du mot correspondant.
                </Text>
              </View>

              <View style={styles.tutorialSection}>
                <Text style={styles.tutorialSubtitle}>🏆 Niveaux</Text>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• <Text style={{ fontWeight: 'bold', color: '#4CAF50' }}>Facile:</Text> Grille 7×7, mots simples</Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• <Text style={{ fontWeight: 'bold', color: '#FFA726' }}>Moyen:</Text> Grille 9×9, mots variés</Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialBullet}>• <Text style={{ fontWeight: 'bold', color: '#EF5350' }}>Difficile:</Text> Grille 11×11, mots complexes</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.tutorialCloseButton}
                onPress={() => setShowTutorial(false)}
              >
                <Foundation name="check" size={24} color="#FFFFFF" />
                <Text style={styles.tutorialCloseText}>Compris!</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
          theme={currentTheme}
          type={alertConfig.type}
        />
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
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
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  timer: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dareButton: {
    width: 44,
    height: 44,
  },
  hintButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  hintText: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  settingsCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.98)',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  settingsOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Tutorial Modal Styles
  tutorialScrollView: {
    width: '100%',
    maxHeight: '90%',
  },
  tutorialContent: {
    padding: 0,
  },
  tutorialCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.98)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tutorialTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  tutorialSection: {
    marginBottom: 20,
  },
  tutorialSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tutorialText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  tutorialItem: {
    marginBottom: 8,
  },
  tutorialBullet: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  tutorialCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 24,
  },
  tutorialCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default CrosswordsScreen;