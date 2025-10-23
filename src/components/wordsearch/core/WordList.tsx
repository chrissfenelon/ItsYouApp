import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Word } from '../../../types/wordSearch.types';
import { WORD_SEARCH_COLORS } from '../../../data/constants/colors';

interface WordListProps {
  words: Word[];
}

const WordList: React.FC<WordListProps> = ({ words }) => {
  // Filter out bonus words (they are hidden from the player)
  const visibleWords = words.filter(word => !word.isBonus);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mots à Trouver</Text>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.wordsContainer}>
        {visibleWords.map((word) => (
          <View
            key={word.id}
            style={[
              styles.wordChip,
              word.found && { backgroundColor: word.color || WORD_SEARCH_COLORS.cellFoundPrimary },
            ]}
          >
            <Text
              style={[
                styles.wordText,
                word.found && styles.wordFoundText,
              ]}
            >
              {word.text}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 12,
  },
  scrollView: {
    maxHeight: 120,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    backgroundColor: WORD_SEARCH_COLORS.cellDefault,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: WORD_SEARCH_COLORS.cellBorder,
  },
  wordText: {
    fontSize: 14,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textDark,
  },
  wordFoundText: {
    color: WORD_SEARCH_COLORS.textWhite,
    textDecorationLine: 'line-through',
  },
});

export default WordList;
