import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { WORD_SEARCH_COLORS } from '../../../data/constants/colors';
import { Word } from '../../../types/wordSearch.types';

interface BonusWordsRevealModalProps {
  visible: boolean;
  bonusWords: Word[];
  onContinue: () => void;
  onFinish: () => void;
}

const BonusWordsRevealModal: React.FC<BonusWordsRevealModalProps> = ({
  visible,
  bonusWords,
  onContinue,
  onFinish,
}) => {
  const foundBonusCount = bonusWords.filter(w => w.found).length;
  const totalBonusCount = bonusWords.length;
  const unfoundBonus = bonusWords.filter(w => !w.found);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onFinish}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.title}>Tous les Mots Trouvés !</Text>
            <Text style={styles.emoji}>🎉</Text>
          </View>

          {/* Bonus Words Section */}
          <View style={styles.bonusSection}>
            <View style={styles.bonusHeader}>
              <Text style={styles.bonusIcon}>💎</Text>
              <Text style={styles.bonusTitle}>Mots Bonus Cachés</Text>
              <Text style={styles.bonusIcon}>💎</Text>
            </View>

            <Text style={styles.bonusStats}>
              Tu as trouvé {foundBonusCount} sur {totalBonusCount} mots bonus !
            </Text>

            {unfoundBonus.length > 0 && (
              <View style={styles.unfoundSection}>
                <Text style={styles.unfoundLabel}>Mots bonus manqués :</Text>
                <ScrollView style={styles.wordsList} contentContainerStyle={styles.wordsListContent}>
                  {unfoundBonus.map((word) => (
                    <View key={word.id} style={styles.wordChip}>
                      <Text style={styles.wordText}>{word.text}</Text>
                    </View>
                  ))}
                </ScrollView>
                <Text style={styles.hintText}>
                  💡 Ces mots étaient cachés dans la grille !
                </Text>
              </View>
            )}

            {foundBonusCount === totalBonusCount && (
              <View style={styles.perfectSection}>
                <Text style={styles.perfectEmoji}>🏆</Text>
                <Text style={styles.perfectText}>PARFAIT !</Text>
                <Text style={styles.perfectSubtext}>Tous les bonus trouvés !</Text>
              </View>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            {unfoundBonus.length > 0 && (
              <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
                <Text style={styles.continueButtonText}>
                  ⏱️ Continuer à Chercher
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.finishButton,
                unfoundBonus.length === 0 && styles.finishButtonPerfect,
              ]}
              onPress={onFinish}
            >
              <Text style={styles.finishButtonText}>
                ✓ Terminer le Niveau
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: WORD_SEARCH_COLORS.background,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.primary,
    textAlign: 'center',
  },
  bonusSection: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  bonusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  bonusIcon: {
    fontSize: 24,
  },
  bonusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  bonusStats: {
    fontSize: 16,
    color: WORD_SEARCH_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  unfoundSection: {
    marginTop: 12,
  },
  unfoundLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 12,
  },
  wordsList: {
    maxHeight: 120,
  },
  wordsListContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  wordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  hintText: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  perfectSection: {
    alignItems: 'center',
    marginTop: 12,
  },
  perfectEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  perfectText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  perfectSubtext: {
    fontSize: 14,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  buttons: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: WORD_SEARCH_COLORS.buttonSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
  finishButton: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  finishButtonPerfect: {
    backgroundColor: '#FFD700',
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
});

export default BonusWordsRevealModal;
