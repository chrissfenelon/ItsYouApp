import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { WORD_SEARCH_COLORS } from '../../../data/constants/colors';
import { PlayerPowerUps } from '../../../types/wordSearch.types';
import CustomAlert from '../../common/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import { useApp } from '../../../context/AppContext';

interface QuickShopModalProps {
  visible: boolean;
  powerUpType: keyof PlayerPowerUps;
  currentCoins: number;
  onPurchase: (type: keyof PlayerPowerUps, quantity: number) => Promise<void>;
  onClose: () => void;
}

interface PowerUpShopInfo {
  icon: string;
  name: string;
  description: string;
  pricePerUnit: number;
}

const POWER_UP_SHOP: Record<keyof PlayerPowerUps, PowerUpShopInfo> = {
  revealLetter: {
    icon: '💡',
    name: 'Révéler une Lettre',
    description: 'Révèle une lettre aléatoire d\'un mot non trouvé',
    pricePerUnit: 10,
  },
  revealWord: {
    icon: '🔍',
    name: 'Révéler un Mot',
    description: 'Révèle automatiquement un mot complet',
    pricePerUnit: 30,
  },
  timeFreeze: {
    icon: '⏸️',
    name: 'Gel du Temps',
    description: 'Arrête le chrono pendant 30 secondes',
    pricePerUnit: 20,
  },
  highlightFirst: {
    icon: '✨',
    name: 'Premières Lettres',
    description: 'Surligne la première lettre de chaque mot',
    pricePerUnit: 15,
  },
};

const QUANTITY_OPTIONS = [1, 3, 5, 10];

const QuickShopModal: React.FC<QuickShopModalProps> = ({
  visible,
  powerUpType,
  currentCoins,
  onPurchase,
  onClose,
}) => {
  const { currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [purchasing, setPurchasing] = useState(false);

  const powerUpInfo = POWER_UP_SHOP[powerUpType];
  const totalCost = powerUpInfo.pricePerUnit * selectedQuantity;
  const canAfford = currentCoins >= totalCost;

  const handlePurchase = async () => {
    if (!canAfford) {
      showAlert({
        title: 'Pas assez de pièces',
        message: `Il te faut ${totalCost} pièces mais tu n'en as que ${currentCoins}.`,
        type: 'warning',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    setPurchasing(true);
    try {
      await onPurchase(powerUpType, selectedQuantity);
      showAlert({
        title: 'Achat réussi !',
        message: `Tu as acheté ${selectedQuantity} ${powerUpInfo.name}`,
        type: 'success',
        buttons: [{ text: 'OK', style: 'default', onPress: onClose }],
      });
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de l\'achat',
        type: 'error',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Boutique Express</Text>

          {/* Power-Up Info */}
          <View style={styles.powerUpCard}>
            <Text style={styles.powerUpIcon}>{powerUpInfo.icon}</Text>
            <Text style={styles.powerUpName}>{powerUpInfo.name}</Text>
            <Text style={styles.powerUpDescription}>{powerUpInfo.description}</Text>
            <Text style={styles.powerUpPrice}>💰 {powerUpInfo.pricePerUnit} pièces</Text>
          </View>

          {/* Quantity Selection */}
          <Text style={styles.quantityLabel}>Quantité :</Text>
          <View style={styles.quantityOptions}>
            {QUANTITY_OPTIONS.map(qty => (
              <TouchableOpacity
                key={qty}
                style={[
                  styles.quantityButton,
                  selectedQuantity === qty && styles.quantityButtonSelected,
                ]}
                onPress={() => setSelectedQuantity(qty)}
              >
                <Text
                  style={[
                    styles.quantityButtonText,
                    selectedQuantity === qty && styles.quantityButtonTextSelected,
                  ]}
                >
                  ×{qty}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Total Cost */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total :</Text>
            <Text style={[styles.totalCost, !canAfford && styles.totalCostError]}>
              💰 {totalCost} pièces
            </Text>
          </View>

          {/* Current Balance */}
          <Text style={styles.balanceText}>
            Solde : 💰 {currentCoins} pièces
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={purchasing}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.buyButton,
                (!canAfford || purchasing) && styles.buyButtonDisabled,
              ]}
              onPress={handlePurchase}
              disabled={!canAfford || purchasing}
            >
              <Text style={styles.buyButtonText}>
                {purchasing ? 'Achat...' : 'Acheter'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  powerUpCard: {
    backgroundColor: WORD_SEARCH_COLORS.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  powerUpIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  powerUpName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 8,
  },
  powerUpDescription: {
    fontSize: 14,
    color: WORD_SEARCH_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  powerUpPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.accent,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 12,
  },
  quantityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quantityButton: {
    flex: 1,
    backgroundColor: WORD_SEARCH_COLORS.cellDefault,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quantityButtonSelected: {
    backgroundColor: WORD_SEARCH_COLORS.primary,
    borderColor: WORD_SEARCH_COLORS.accent,
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textSecondary,
  },
  quantityButtonTextSelected: {
    color: WORD_SEARCH_COLORS.textWhite,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  totalCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.primary,
  },
  totalCostError: {
    color: WORD_SEARCH_COLORS.error,
  },
  balanceText: {
    fontSize: 14,
    color: WORD_SEARCH_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: WORD_SEARCH_COLORS.buttonSecondary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
  buyButton: {
    backgroundColor: WORD_SEARCH_COLORS.buttonPrimary,
  },
  buyButtonDisabled: {
    backgroundColor: WORD_SEARCH_COLORS.cellDefault,
    opacity: 0.5,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textWhite,
  },
});

export default QuickShopModal;
