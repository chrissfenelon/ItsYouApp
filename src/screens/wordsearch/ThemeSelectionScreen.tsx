import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { WORD_SEARCH_COLORS } from '../../data/constants/colors';
import { WordTheme } from '../../types/wordSearch.types';

interface ThemeSelectionScreenProps {
  themes: WordTheme[];
  onSelectTheme: (theme: WordTheme) => void;
  onBack: () => void;
  userCoins?: number;
}

const ThemeSelectionScreen: React.FC<ThemeSelectionScreenProps> = ({
  themes,
  onSelectTheme,
  onBack,
  userCoins = 0,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <View style={styles.coinContainer}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinValue}>{userCoins}</Text>
          </View>
        </View>

        <Text style={styles.title}>Choisis un Thème</Text>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {themes.map((theme) => {
            const canPlay = theme.unlocked || (theme.price && userCoins >= theme.price);

            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  { borderColor: theme.color },
                  !canPlay && styles.lockedCard,
                ]}
                onPress={() => canPlay && onSelectTheme(theme)}
                disabled={!canPlay}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.color }]}>
                    <Text style={styles.themeIcon}>{theme.icon}</Text>
                  </View>

                  <View style={styles.themeInfo}>
                    <Text style={styles.themeName}>{theme.name}</Text>
                    <Text style={styles.themeDescription}>{theme.description}</Text>
                    <Text style={styles.wordCount}>{theme.words.length} mots</Text>
                  </View>

                  {!theme.unlocked && theme.price && (
                    <View style={[styles.priceTag, !canPlay && styles.cantAfford]}>
                      <Text style={styles.priceIcon}>🪙</Text>
                      <Text style={styles.priceText}>{theme.price}</Text>
                    </View>
                  )}

                  {theme.unlocked && (
                    <View style={styles.unlockedBadge}>
                      <Text style={styles.unlockedText}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {},
  backButtonText: {
    fontSize: 16,
    color: WORD_SEARCH_COLORS.primary,
    fontWeight: '600',
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  coinIcon: {
    fontSize: 18,
  },
  coinValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
  themeCard: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lockedCard: {
    opacity: 0.6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 32,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 4,
  },
  wordCount: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textLight,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  cantAfford: {
    backgroundColor: WORD_SEARCH_COLORS.buttonDisabled,
  },
  priceIcon: {
    fontSize: 16,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textDark,
  },
  unlockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: WORD_SEARCH_COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    fontSize: 18,
    color: WORD_SEARCH_COLORS.textWhite,
    fontWeight: 'bold',
  },
});

export default ThemeSelectionScreen;
