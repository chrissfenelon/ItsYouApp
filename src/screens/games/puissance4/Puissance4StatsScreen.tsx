import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CurrentTheme } from '../../../constants/Themes';
import { Typography } from '../../../constants/Typography';
import FeedbackService from '../../../services/FeedbackService';
import { useApp } from '../../../context/AppContext';
import { getBackgroundSource } from '../../../utils/backgroundUtils';
import { Puissance4Service } from '../../../services/Puissance4Service';

const { width } = Dimensions.get('window');

interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  averageMoves: number;
  fastestWin: number;
  firstGameDate: Date | null;
  gamesThisWeek: number;
  favoriteColor: 'Rouge' | 'Jaune' | null;
}

const Puissance4StatsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useApp();
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentGames, setRecentGames] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Charger l'historique
      const history = await Puissance4Service.getUserGameHistory(user.id, 100);
      setRecentGames(history.slice(0, 5));

      // Calculer les statistiques
      const totalGames = history.length;
      const wins = history.filter((g: any) => g.winner === user.id).length;
      const losses = history.filter((g: any) => g.loser === user.id).length;
      const draws = history.filter((g: any) => g.result === 'draw').length;
      const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

      // Calculer la série actuelle
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      for (let i = 0; i < history.length; i++) {
        const game = history[i];
        if (game.winner === user.id) {
          tempStreak++;
          if (i === 0) currentStreak = tempStreak;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else if (game.loser === user.id) {
          tempStreak = 0;
        }
      }

      // Moyenne de coups
      const totalMoves = history.reduce((sum: number, g: any) => sum + (g.moveCount || 0), 0);
      const averageMoves = totalGames > 0 ? Math.round(totalMoves / totalGames) : 0;

      // Victoire la plus rapide
      const winsOnly = history.filter((g: any) => g.winner === user.id);
      const fastestWin = winsOnly.length > 0
        ? Math.min(...winsOnly.map((g: any) => g.moveCount || 999))
        : 0;

      // Date du premier jeu
      const firstGameDate = history.length > 0
        ? new Date(history[history.length - 1].timestamp)
        : null;

      // Jeux cette semaine
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const gamesThisWeek = history.filter((g: any) => g.timestamp > oneWeekAgo).length;

      // Couleur favorite (based on wins)
      const rougeWins = history.filter((g: any) => g.winner === user.id && g.result === 'Rouge').length;
      const jauneWins = history.filter((g: any) => g.winner === user.id && g.result === 'Jaune').length;
      const favoriteColor = rougeWins > jauneWins ? 'Rouge' :
                           jauneWins > rougeWins ? 'Jaune' : null;

      setStats({
        totalGames,
        wins,
        losses,
        draws,
        winRate,
        currentStreak,
        longestStreak,
        averageMoves,
        fastestWin,
        firstGameDate,
        gamesThisWeek,
        favoriteColor,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 5) return '🔥';
    if (streak >= 3) return '⭐';
    if (streak >= 1) return '✨';
    return '😔';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CurrentTheme.romantic.primary} />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="chart-box" size={80} color={CurrentTheme.text.tertiary} />
        <Text style={styles.emptyText}>Aucune statistique disponible</Text>
        <Text style={styles.emptyHint}>Jouez votre première partie!</Text>
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
        <View style={styles.blurryOverlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                FeedbackService.buttonPress();
                navigation.goBack();
              }}
            >
              <View style={styles.backButtonBlur}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={CurrentTheme.text.primary}
                />
              </View>
            </TouchableOpacity>

            <Text style={styles.title}>📊 Statistiques</Text>

            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Win Rate Card */}
            <View style={styles.winRateCard}>
              <Text style={styles.winRateLabel}>Taux de Victoire</Text>
              <Text style={styles.winRateValue}>{stats.winRate}%</Text>
              <View style={styles.recordContainer}>
                <View style={styles.recordItem}>
                  <Text style={styles.recordValue}>{stats.wins}</Text>
                  <Text style={styles.recordLabel}>Victoires</Text>
                </View>
                <View style={styles.recordDivider} />
                <View style={styles.recordItem}>
                  <Text style={styles.recordValue}>{stats.draws}</Text>
                  <Text style={styles.recordLabel}>Nuls</Text>
                </View>
                <View style={styles.recordDivider} />
                <View style={styles.recordItem}>
                  <Text style={styles.recordValue}>{stats.losses}</Text>
                  <Text style={styles.recordLabel}>Défaites</Text>
                </View>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {/* Total Games */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="gamepad" size={32} color={CurrentTheme.romantic.primary} />
                <Text style={styles.statValue}>{stats.totalGames}</Text>
                <Text style={styles.statLabel}>Parties Jouées</Text>
              </View>

              {/* Current Streak */}
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>{getStreakEmoji(stats.currentStreak)}</Text>
                <Text style={styles.statValue}>{stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Série Actuelle</Text>
              </View>

              {/* Longest Streak */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="fire" size={32} color="#FF6B6B" />
                <Text style={styles.statValue}>{stats.longestStreak}</Text>
                <Text style={styles.statLabel}>Meilleure Série</Text>
              </View>

              {/* Average Moves */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="counter" size={32} color="#4CAF50" />
                <Text style={styles.statValue}>{stats.averageMoves}</Text>
                <Text style={styles.statLabel}>Coups Moyens</Text>
              </View>

              {/* Fastest Win */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="speedometer" size={32} color="#2196F3" />
                <Text style={styles.statValue}>{stats.fastestWin || '-'}</Text>
                <Text style={styles.statLabel}>Victoire Rapide</Text>
              </View>

              {/* Games This Week */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="calendar-week" size={32} color="#9C27B0" />
                <Text style={styles.statValue}>{stats.gamesThisWeek}</Text>
                <Text style={styles.statLabel}>Cette Semaine</Text>
              </View>
            </View>

            {/* Favorite Color */}
            {stats.favoriteColor && (
              <View style={styles.favoriteCard}>
                <Text style={styles.favoriteLabel}>Couleur Favorite</Text>
                <View style={styles.favoriteContent}>
                  <Text style={styles.favoriteEmoji}>
                    {stats.favoriteColor === 'Rouge' ? '🔴' : '🟡'}
                  </Text>
                  <Text style={styles.favoriteText}>{stats.favoriteColor}</Text>
                </View>
                <Text style={styles.favoriteHint}>
                  Vous gagnez plus souvent avec cette couleur!
                </Text>
              </View>
            )}

            {/* Journey Info */}
            {stats.firstGameDate && (
              <View style={styles.journeyCard}>
                <MaterialCommunityIcons name="calendar-heart" size={24} color={CurrentTheme.romantic.primary} />
                <Text style={styles.journeyText}>
                  Première partie: {stats.firstGameDate.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            )}

            {/* Recent Games */}
            {recentGames.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>Parties Récentes</Text>
                {recentGames.map((game: any, index: number) => (
                  <View key={game.id || index} style={styles.gameCard}>
                    <View style={styles.gameIcon}>
                      {game.winner === user?.id ? (
                        <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
                      ) : game.result === 'draw' ? (
                        <MaterialCommunityIcons name="equal" size={24} color="#FFA502" />
                      ) : (
                        <MaterialCommunityIcons name="close-circle" size={24} color="#FF6B6B" />
                      )}
                    </View>
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameResult}>
                        {game.winner === user?.id ? 'Victoire' :
                         game.result === 'draw' ? 'Match Nul' : 'Défaite'}
                      </Text>
                      <Text style={styles.gameDetails}>
                        {game.moveCount} coups • {game.mode === 'ai' ? 'vs IA' :
                         game.mode === 'online' ? 'En ligne' : 'Local'}
                      </Text>
                    </View>
                    <Text style={styles.gameDate}>
                      {new Date(game.timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CurrentTheme.background,
  },
  backgroundImage: {
    flex: 1,
    width: width,
  },
  blurryOverlay: {
    flex: 1,
    backgroundColor: CurrentTheme.glassmorphism.background,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CurrentTheme.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: CurrentTheme.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CurrentTheme.background,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: CurrentTheme.text.primary,
    marginTop: 24,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 16,
    color: CurrentTheme.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: CurrentTheme.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  winRateCard: {
    backgroundColor: 'rgba(255, 105, 180, 0.2)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
    marginBottom: 20,
    alignItems: 'center',
  },
  winRateLabel: {
    fontSize: 16,
    color: CurrentTheme.text.secondary,
    marginBottom: 8,
  },
  winRateValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: CurrentTheme.text.primary,
    marginBottom: 20,
  },
  recordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  recordItem: {
    flex: 1,
    alignItems: 'center',
  },
  recordValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: CurrentTheme.text.primary,
    marginBottom: 4,
  },
  recordLabel: {
    fontSize: 13,
    color: CurrentTheme.text.secondary,
  },
  recordDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: CurrentTheme.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: CurrentTheme.text.secondary,
    textAlign: 'center',
  },
  favoriteCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 20,
    alignItems: 'center',
  },
  favoriteLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: CurrentTheme.text.primary,
    marginBottom: 12,
  },
  favoriteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  favoriteEmoji: {
    fontSize: 48,
  },
  favoriteText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: CurrentTheme.text.primary,
  },
  favoriteHint: {
    fontSize: 13,
    color: CurrentTheme.text.secondary,
    textAlign: 'center',
  },
  journeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
    gap: 12,
  },
  journeyText: {
    flex: 1,
    fontSize: 14,
    color: CurrentTheme.text.primary,
  },
  recentSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: CurrentTheme.text.primary,
    marginBottom: 16,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
  },
  gameIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameResult: {
    fontSize: 16,
    fontWeight: '600',
    color: CurrentTheme.text.primary,
    marginBottom: 4,
  },
  gameDetails: {
    fontSize: 13,
    color: CurrentTheme.text.secondary,
  },
  gameDate: {
    fontSize: 12,
    color: CurrentTheme.text.tertiary,
  },
});

export default Puissance4StatsScreen;
