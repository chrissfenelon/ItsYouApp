import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Foundation from 'react-native-vector-icons/Foundation';
import { CrosswordWord } from '../../services/CrosswordGenerator';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

interface CluesPanelProps {
  words: CrosswordWord[];
  completedWords: number[];
  selectedWord: number | null;
  onCluePress: (wordNumber: number) => void;
}

export const CluesPanel: React.FC<CluesPanelProps> = ({
  words,
  completedWords,
  selectedWord,
  onCluePress,
}) => {
  const { currentTheme } = useApp();
  const styles = createStyles(currentTheme);

  const acrossWords = words.filter((w) => w.direction === 'across');
  const downWords = words.filter((w) => w.direction === 'down');

  const completedCount = completedWords.length;
  const totalCount = words.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  const renderClue = (word: CrosswordWord) => {
    const isCompleted = completedWords.includes(word.number);
    const isSelected = selectedWord === word.number;

    return (
      <TouchableOpacity
        key={word.number}
        style={[
          styles.clueItem,
          isSelected && styles.selectedClue,
          isCompleted && styles.completedClue,
        ]}
        onPress={() => onCluePress(word.number)}
        activeOpacity={0.7}
      >
        <BlurView style={styles.clueBlur} blurType="dark" blurAmount={8}>
          <View
            style={[
              styles.clueGlass,
              isSelected && styles.selectedClueGlass,
              isCompleted && styles.completedClueGlass,
            ]}
          />
        </BlurView>

        <View style={styles.clueContent}>
          <View style={styles.clueHeader}>
            <Text style={[styles.clueNumber, isCompleted && styles.completedText]}>
              {word.number}.
            </Text>
            {isCompleted && (
              <Foundation
                name="check"
                size={16}
                color="#FFD700"
                style={styles.checkIcon}
              />
            )}
          </View>
          <Text
            style={[
              styles.clueText,
              isCompleted && styles.completedClueText,
            ]}
            numberOfLines={2}
          >
            {word.clue}
          </Text>
          <Text style={styles.wordLength}>({word.word.length} lettres)</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Progress header */}
      <View style={styles.progressContainer}>
        <BlurView style={styles.progressBlur} blurType="dark" blurAmount={15}>
          <View style={styles.progressGlass} />
        </BlurView>

        <Text style={styles.progressTitle}>Progression</Text>
        <Text style={styles.progressText}>
          {completedCount} / {totalCount} mots ({progressPercentage}%)
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Horizontal clues */}
        {acrossWords.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Foundation name="arrow-right" size={20} color={currentTheme.romantic?.primary || '#FF69B4'} />
              <Text style={styles.sectionTitle}>Horizontalement</Text>
            </View>
            {acrossWords.map(renderClue)}
          </View>
        )}

        {/* Vertical clues */}
        {downWords.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Foundation name="arrow-down" size={20} color={currentTheme.romantic?.primary || '#FF69B4'} />
              <Text style={styles.sectionTitle}>Verticalement</Text>
            </View>
            {downWords.map(renderClue)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
    },
    progressContainer: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    progressBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    progressGlass: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    progressTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text?.primary || '#FFFFFF',
      marginBottom: 8,
    },
    progressText: {
      fontSize: 14,
      color: theme.text?.secondary || 'rgba(255, 255, 255, 0.7)',
      marginBottom: 12,
    },
    progressBarContainer: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarBg: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 4,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.romantic?.primary || '#FF69B4',
      borderRadius: 4,
      shadowColor: theme.romantic?.primary || '#FF69B4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 4,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text?.primary || '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    clueItem: {
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    selectedClue: {
      borderWidth: 2,
      borderColor: theme.romantic?.primary || '#FF69B4',
      shadowColor: theme.romantic?.primary || '#FF69B4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 4,
    },
    completedClue: {
      borderColor: 'rgba(255, 215, 0, 0.4)',
    },
    clueBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    clueGlass: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    selectedClueGlass: {
      backgroundColor: 'rgba(255, 105, 180, 0.15)',
    },
    completedClueGlass: {
      backgroundColor: 'rgba(255, 215, 0, 0.15)',
    },
    clueContent: {
      flex: 1,
    },
    clueHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    clueNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text?.primary || '#FFFFFF',
      marginRight: 8,
    },
    checkIcon: {
      marginLeft: 4,
    },
    clueText: {
      fontSize: 14,
      color: theme.text?.secondary || 'rgba(255, 255, 255, 0.8)',
      lineHeight: 20,
      marginBottom: 4,
    },
    completedClueText: {
      color: 'rgba(255, 215, 0, 0.9)',
    },
    completedText: {
      color: '#FFD700',
    },
    wordLength: {
      fontSize: 12,
      color: theme.text?.secondary || 'rgba(255, 255, 255, 0.5)',
      fontStyle: 'italic',
    },
  });
};

export default CluesPanel;
