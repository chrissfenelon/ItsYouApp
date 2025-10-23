import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { WORD_SEARCH_COLORS } from '../../data/constants/colors';
import { ShopItem } from '../../types/wordSearch.types';
import { SHOP_ITEMS } from '../../data/shop';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

interface ShopScreenProps {
  onBack: () => void;
  userCoins: number;
  onPurchase: (item: ShopItem) => Promise<void>;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ onBack, userCoins, onPurchase }) => {
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (item: ShopItem) => {
    if (userCoins < item.price) {
      showAlert({
        title: 'Pas assez de pièces',
        message: `Il te faut ${item.price} pièces pour acheter cet article.`,
        type: 'warning',
      });
      return;
    }

    setPurchasing(item.id);
    try {
      await onPurchase(item);
      showAlert({
        title: 'Achat réussi !',
        message: `Tu as acheté ${item.name}`,
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Une erreur est survenue lors de l\'achat.',
        type: 'error',
      });
    } finally {
      setPurchasing(null);
    }
  };

  const renderShopItem = (item: ShopItem) => {
    const canAfford = userCoins >= item.price;
    const isPurchasing = purchasing === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.shopItem, !canAfford && styles.shopItemDisabled]}
        onPress={() => handlePurchase(item)}
        disabled={!canAfford || isPurchasing}
      >
        <View style={styles.itemIconContainer}>
          <Text style={styles.itemIcon}>{item.icon}</Text>
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={[styles.priceText, !canAfford && styles.priceTextDisabled]}>
              {item.price}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
          onPress={() => handlePurchase(item)}
          disabled={!canAfford || isPurchasing}
        >
          <Text style={styles.buyButtonText}>
            {isPurchasing ? '...' : canAfford ? 'Acheter' : 'Pas assez'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Grouper les articles par type
  const consumables = SHOP_ITEMS.filter(item => item.type === 'consumable');
  const powerups = SHOP_ITEMS.filter(item => item.type === 'powerup');
  const themes = SHOP_ITEMS.filter(item => item.type === 'theme');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Boutique</Text>

          <View style={styles.coinDisplay}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinValue}>{userCoins}</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Indices et Consommables */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Indices</Text>
            {consumables.map(renderShopItem)}
          </View>

          {/* Power-ups */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Power-ups</Text>
            {powerups.map(renderShopItem)}
          </View>

          {/* Thèmes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Thèmes</Text>
            {themes.map(renderShopItem)}
          </View>
        </ScrollView>
      </View>
      <CustomAlert
        visible={isVisible}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
        buttons={alertConfig?.buttons}
        onClose={hideAlert}
      />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  coinDisplay: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 12,
  },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopItemDisabled: {
    opacity: 0.5,
  },
  itemIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: WORD_SEARCH_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 32,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.accent,
  },
  priceTextDisabled: {
    color: WORD_SEARCH_COLORS.buttonDisabled,
  },
  buyButton: {
    backgroundColor: WORD_SEARCH_COLORS.buttonPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buyButtonDisabled: {
    backgroundColor: WORD_SEARCH_COLORS.buttonDisabled,
  },
  buyButtonText: {
    color: WORD_SEARCH_COLORS.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ShopScreen;
