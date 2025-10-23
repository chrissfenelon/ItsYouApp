import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { WORD_SEARCH_COLORS } from '../../data/constants/colors';
import { Avatar } from '../../types/wordSearch.types';
import { AvatarDisplay } from '../../utils/avatarUtils';
import { DareButton } from '../../components/DareButton';

interface MenuScreenProps {
  onPlaySolo: () => void;
  onPlayMultiplayer: () => void;
  onSettings: () => void;
  onShop: () => void;
  onLevels: () => void;
  onEditProfile?: () => void;
  playerName?: string;
  coins?: number;
  level?: number;
  avatar?: Avatar;
}

const MenuScreen: React.FC<MenuScreenProps> = ({
  onPlaySolo,
  onPlayMultiplayer,
  onSettings,
  onShop,
  onLevels,
  onEditProfile,
  playerName = 'Player',
  coins = 0,
  level = 1,
  avatar,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.userInfo} onPress={onEditProfile}>
            {avatar ? (
              <View style={styles.avatar}>
                <AvatarDisplay
                  avatar={avatar}
                  imageStyle={styles.avatarPhoto}
                  textStyle={styles.avatarEmoji}
                />
              </View>
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{playerName[0].toUpperCase()}</Text>
              </View>
            )}
            <View>
              <Text style={styles.playerName}>{playerName}</Text>
              <Text style={styles.level}>Niveau {level}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <DareButton
              gameType="wordsearch"
              variant="icon"
              iconSize={20}
              showLabel={false}
              style={styles.dareButton}
            />
            <TouchableOpacity style={styles.coinContainer} onPress={onShop}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinValue}>{coins}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Mots Mêlés</Text>
          <Text style={styles.subtitle}>Trouve les mots cachés !</Text>
        </View>

        {/* Main Menu Buttons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={[styles.menuButton, styles.soloButton]} onPress={onLevels}>
            <Text style={styles.menuButtonIcon}>🎮</Text>
            <Text style={styles.menuButtonText}>Jouer Solo</Text>
            <Text style={styles.menuButtonSubtext}>300 niveaux à conquérir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuButton, styles.multiplayerButton]} onPress={onPlayMultiplayer}>
            <Text style={styles.menuButtonIcon}>👥</Text>
            <Text style={styles.menuButtonText}>Multijoueur</Text>
            <Text style={styles.menuButtonSubtext}>Joue avec des amis</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onPlaySolo}>
              <Text style={styles.secondaryButtonIcon}>🎯</Text>
              <Text style={styles.secondaryButtonText}>Jeu Rapide</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onShop}>
              <Text style={styles.secondaryButtonIcon}>🏪</Text>
              <Text style={styles.secondaryButtonText}>Boutique</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onSettings}>
              <Text style={styles.secondaryButtonIcon}>⚙️</Text>
              <Text style={styles.secondaryButtonText}>Paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer decoration */}
        <View style={styles.footer}>
          <View style={styles.grass} />
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: WORD_SEARCH_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  avatarPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: WORD_SEARCH_COLORS.background,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  level: {
    fontSize: 14,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dareButton: {
    width: 40,
    height: 40,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  coinIcon: {
    fontSize: 20,
  },
  coinValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.primary,
    textShadowColor: WORD_SEARCH_COLORS.selectionLineShadow,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginTop: 8,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  menuButton: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  soloButton: {
    borderWidth: 3,
    borderColor: WORD_SEARCH_COLORS.primary,
  },
  multiplayerButton: {
    borderWidth: 3,
    borderColor: WORD_SEARCH_COLORS.secondary,
  },
  menuButtonIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  menuButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 4,
  },
  menuButtonSubtext: {
    fontSize: 14,
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  footer: {
    marginTop: 20,
  },
  grass: {
    height: 40,
    backgroundColor: WORD_SEARCH_COLORS.grassGreen,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: -20,
  },
});

export default MenuScreen;
