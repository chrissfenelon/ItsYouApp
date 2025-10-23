import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface GameMiniatureProps {
  title: string;
  miniature: React.ReactNode;
  onPress: () => void;
}

const GamesScreen: React.FC = () => {
  const { user, currentTheme, navigateToScreen } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const styles = createStyles(currentTheme);

  const GameMiniature: React.FC<GameMiniatureProps> = ({ title, miniature, onPress }) => {
    return (
      <TouchableOpacity
        style={[styles.gameMiniature, { backgroundColor: currentTheme?.background?.secondary || 'rgba(255, 255, 255, 0.1)' }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.miniatureContainer}>
          {miniature}
        </View>
        <Text style={[styles.gameMiniatureTitle, { color: currentTheme?.text?.primary || '#FFFFFF' }]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  // Miniature components for each game
  const MorpionMiniature = () => {
    return (
      <View style={styles.morpionMini}>
        <View style={styles.morpionGrid}>
          <View style={[styles.morpionCell, styles.morpionBorderRight, styles.morpionBorderBottom]}>
            <Text style={styles.morpionX}>×</Text>
          </View>
          <View style={[styles.morpionCell, styles.morpionBorderRight, styles.morpionBorderBottom]}>
            <Text style={styles.morpionO}>○</Text>
          </View>
          <View style={[styles.morpionCell, styles.morpionBorderBottom]} />
          <View style={[styles.morpionCell, styles.morpionBorderRight]}>
            <Text style={styles.morpionO}>○</Text>
          </View>
          <View style={[styles.morpionCell, styles.morpionBorderRight]}>
            <Text style={styles.morpionX}>×</Text>
          </View>
          <View style={styles.morpionCell}>
            <Text style={styles.morpionX}>×</Text>
          </View>
          <View style={[styles.morpionCell, styles.morpionBorderRight]} />
          <View style={styles.morpionCell} />
          <View style={styles.morpionCell} />
        </View>
      </View>
    );
  };

  const PuissanceMiniature = () => (
    <View style={styles.puissanceMini}>
      <View style={styles.puissanceGrid}>
        {[...Array(21)].map((_, i) => (
          <View key={i} style={[
            styles.puissanceCell,
            i === 14 && styles.puissanceRed,
            i === 15 && styles.puissanceRed,
            i === 16 && styles.puissanceRed,
            i === 7 && styles.puissanceYellow,
            i === 8 && styles.puissanceYellow,
          ]} />
        ))}
      </View>
    </View>
  );

  const PuzzleMiniature = () => (
    <View style={styles.puzzleMini}>
      <View style={styles.puzzleGrid}>
        <View style={[styles.puzzlePiece, { backgroundColor: '#FF6B6B' }]} />
        <View style={[styles.puzzlePiece, { backgroundColor: '#4ECDC4' }]} />
        <View style={[styles.puzzlePiece, { backgroundColor: '#45B7D1' }]} />
        <View style={[styles.puzzlePiece, { backgroundColor: '#96CEB4' }]} />
        <View style={[styles.puzzlePiece, { backgroundColor: '#FFEAA7' }]} />
        <View style={[styles.puzzlePiece, { backgroundColor: '#DDA0DD' }]} />
        <View style={[styles.puzzlePiece, { backgroundColor: '#FF7675' }]} />
        <View style={[styles.puzzlePiece, { backgroundColor: '#74B9FF' }]} />
        <View style={styles.puzzlePiece} />
      </View>
    </View>
  );

  const CrosswordsMiniature = () => (
    <View style={styles.crosswordsMini}>
      <View style={styles.crosswordsGrid}>
        {[...Array(25)].map((_, i) => (
          <View key={i} style={[
            styles.crosswordsCell,
            [0, 2, 4, 5, 7, 9, 10, 12, 14, 15, 17, 19, 20, 22, 24].includes(i) && styles.crosswordsBlack,
            [1, 3, 6, 8, 11, 13, 16, 18, 21, 23].includes(i) && styles.crosswordsWhite,
          ]} />
        ))}
      </View>
    </View>
  );

  const QuizMiniature = () => (
    <View style={styles.quizMini}>
      <Foundation name="heart" size={30} color="#FF69B4" />
      <Text style={styles.quizText}>?</Text>
    </View>
  );

  const DominosMiniature = () => (
    <View style={styles.dominosMini}>
      <View style={styles.dominoTile}>
        <View style={styles.dominoTop}>
          <View style={[styles.dominoDot, { top: 3, left: 3 }]} />
          <View style={[styles.dominoDot, { top: 3, right: 3 }]} />
          <View style={[styles.dominoDot, { top: 12, left: 8 }]} />
          <View style={[styles.dominoDot, { bottom: 3, left: 3 }]} />
          <View style={[styles.dominoDot, { bottom: 3, right: 3 }]} />
        </View>
        <View style={styles.dominoDivider} />
        <View style={styles.dominoBottom}>
          <View style={[styles.dominoDot, { top: 8, left: 8 }]} />
        </View>
      </View>
    </View>
  );

  const MoodTrackerMiniature = () => (
    <View style={styles.moodTrackerMini}>
      <Text style={styles.moodTrackerEmoji}>💭</Text>
    </View>
  );

  const handleComingSoon = (gameName: string) => {
    showAlert({
      title: 'Bientôt disponible',
      message: `Le jeu sera disponible dans la prochaine mise à jour !`,
      type: 'info',
      buttons: [{ text: 'OK', style: 'default' }]
    });
  };

  const games = [
    {
      title: 'Morpion',
      miniature: <MorpionMiniature />,
      onPress: () => navigateToScreen('morpionWelcome'),
    },
    {
      title: 'Puissance 4',
      miniature: <PuissanceMiniature />,
      onPress: () => navigateToScreen('puissance4Mode'),
    },
    {
      title: 'Puzzle',
      miniature: <PuzzleMiniature />,
      onPress: () => handleComingSoon('Puzzle'),
    },
    {
      title: 'Mots Mêlés',
      miniature: <CrosswordsMiniature />,
      onPress: () => navigateToScreen('wordsearch'),
    },
    {
      title: 'Quiz Couple',
      miniature: <QuizMiniature />,
      onPress: () => navigateToScreen('quizCouple'),
    },
    {
      title: 'Mood Tracker',
      miniature: <MoodTrackerMiniature />,
      onPress: () => navigateToScreen('moodTrackerHome'),
    },
  ];

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
              onPress={() => navigateToScreen('home')}
            >
              <Foundation name="arrow-left" size={20} color={currentTheme?.text?.primary || '#FFFFFF'} />
            </TouchableOpacity>

            <Text style={styles.title}>Jeux</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Games Grid */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.gamesGrid}>
              {games.map((game, index) => (
                <GameMiniature
                  key={index}
                  title={game.title}
                  miniature={game.miniature}
                  onPress={game.onPress}
                />
              ))}
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
          theme={currentTheme}
        />
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.background?.primary || '#000000',
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: theme?.background?.overlay || 'rgba(0, 0, 0, 0.5)',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme?.interactive?.active || 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme?.text?.primary || '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 100,
  },
  gameMiniature: {
    width: (width - 60) / 2,
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  miniatureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameMiniatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
  },
  // Morpion miniature styles
  morpionMini: {
    width: 60,
    height: 60,
  },
  morpionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 60,
    height: 60,
  },
  morpionCell: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morpionBorderRight: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
  },
  morpionBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
  },
  morpionX: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  morpionO: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  // Puissance 4 miniature styles
  puissanceMini: {
    width: 60,
    height: 50,
  },
  puissanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 60,
    height: 50,
  },
  puissanceCell: {
    width: 8.5,
    height: 8.5,
    borderRadius: 4.25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    margin: 0.5,
  },
  puissanceRed: {
    backgroundColor: '#FF6B6B',
  },
  puissanceYellow: {
    backgroundColor: '#FFEAA7',
  },
  // Puzzle miniature styles
  puzzleMini: {
    width: 60,
    height: 60,
  },
  puzzleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 60,
    height: 60,
  },
  puzzlePiece: {
    width: 18,
    height: 18,
    margin: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  // Crosswords miniature styles
  crosswordsMini: {
    width: 60,
    height: 60,
  },
  crosswordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 60,
    height: 60,
  },
  crosswordsCell: {
    width: 10,
    height: 10,
    margin: 1,
    borderRadius: 1,
  },
  crosswordsBlack: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  crosswordsWhite: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  // Quiz miniature styles
  quizMini: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  quizText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Dominos miniature styles
  dominosMini: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dominoTile: {
    width: 24,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  dominoTop: {
    flex: 1,
    position: 'relative',
  },
  dominoBottom: {
    flex: 1,
    position: 'relative',
  },
  dominoDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dominoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
    position: 'absolute',
  },
  // Mood Tracker miniature styles
  moodTrackerMini: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodTrackerEmoji: {
    fontSize: 50,
  },
});

export default GamesScreen;