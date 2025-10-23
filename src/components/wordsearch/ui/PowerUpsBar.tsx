import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { WORD_SEARCH_COLORS } from '../../../data/constants/colors';
import { PlayerPowerUps } from '../../../types/wordSearch.types';
import CustomAlert from '../../common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import { useApp } from '../../../context/AppContext';

interface PowerUpsBarProps {
  powerUps: PlayerPowerUps;
  onUsePowerUp: (type: keyof PlayerPowerUps) => void;
  onBuyPowerUp: (type: keyof PlayerPowerUps) => void;
  disabled?: boolean;
}

const POWER_UP_INFO = {
  revealLetter: {
    icon: '💡',
    name: 'Lettre',
    description: 'Révèle une lettre',
  },
  revealWord: {
    icon: '🔍',
    name: 'Mot',
    description: 'Révèle un mot',
  },
  timeFreeze: {
    icon: '⏸️',
    name: 'Gel',
    description: 'Arrête le temps 30s',
  },
  highlightFirst: {
    icon: '✨',
    name: '1ère Lettre',
    description: 'Surligne 1ères lettres',
  },
};

const PowerUpsBar: React.FC<PowerUpsBarProps> = ({
  powerUps,
  onUsePowerUp,
  onBuyPowerUp,
  disabled = false,
}) => {
  const { currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const handlePress = (type: keyof PlayerPowerUps) => {
    if (disabled) return;

    const quantity = powerUps[type];
    if (quantity > 0) {
      // Use the power-up
      onUsePowerUp(type);
    } else {
      // Offer to buy
      const info = POWER_UP_INFO[type];
      showAlert({
        title: 'Power-Up Vide',
        message: `Tu n'as plus de "${info.name}". Veux-tu en acheter?`,
        type: 'warning',
        buttons: [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Acheter', style: 'default', onPress: () => onBuyPowerUp(type) },
        ],
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Power-Ups</Text>
      <View style={styles.powerUpsGrid}>
        {(Object.keys(powerUps) as Array<keyof PlayerPowerUps>).map((type) => {
          const quantity = powerUps[type];
          const info = POWER_UP_INFO[type];
          const isEmpty = quantity === 0;

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.powerUpButton,
                isEmpty && styles.powerUpButtonEmpty,
                disabled && styles.powerUpButtonDisabled,
              ]}
              onPress={() => handlePress(type)}
              disabled={disabled}
            >
              <Text style={styles.powerUpIcon}>{info.icon}</Text>
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>×{quantity}</Text>
              </View>
              <Text style={styles.powerUpName} numberOfLines={1}>
                {info.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Alert */}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  powerUpsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  powerUpButton: {
    flex: 1,
    backgroundColor: WORD_SEARCH_COLORS.primary,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    position: 'relative',
    minHeight: 70,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  powerUpButtonEmpty: {
    backgroundColor: WORD_SEARCH_COLORS.cellDefault,
    opacity: 0.6,
  },
  powerUpButtonDisabled: {
    opacity: 0.5,
  },
  powerUpIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  quantityBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: WORD_SEARCH_COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
  powerUpName: {
    fontSize: 10,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textWhite,
    textAlign: 'center',
  },
});

export default PowerUpsBar;
