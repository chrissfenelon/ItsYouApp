import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Linking,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const HelpCenterScreen: React.FC = () => {
  const { user, navigateToScreen, currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'Comment synchroniser mes données avec mon partenaire ?',
      answer: 'Allez dans Paramètres > Données > Synchroniser. Assurez-vous que vous et votre partenaire êtes connectés au même compte couple.',
      category: 'Synchronisation'
    },
    {
      id: '2',
      question: 'Mes photos sont-elles sécurisées ?',
      answer: 'Oui, toutes vos photos sont chiffrées et stockées de manière sécurisée. Seuls vous et votre partenaire pouvez y accéder.',
      category: 'Sécurité'
    },
    {
      id: '3',
      question: 'Comment jouer au Puissance 4 en ligne ?',
      answer: 'Rendez-vous dans l\'onglet Jeux, sélectionnez Puissance 4, puis invitez votre partenaire. Le jeu se synchronise en temps réel.',
      category: 'Jeux'
    },
    {
      id: '4',
      question: 'Puis-je modifier le message quotidien ?',
      answer: 'Oui, allez dans Paramètres > Apparence > Message du jour pour le personnaliser.',
      category: 'Personnalisation'
    },
    {
      id: '5',
      question: 'Comment ajouter de la musique à la playlist ?',
      answer: 'Dans l\'onglet Musique, appuyez sur le bouton + pour ajouter des morceaux depuis votre bibliothèque.',
      category: 'Musique'
    },
    {
      id: '6',
      question: 'Comment sauvegarder mes données ?',
      answer: 'Activez la sauvegarde automatique dans Paramètres > Données > Sauvegarde automatique. Vos données seront sauvegardées dans le cloud.',
      category: 'Sauvegarde'
    },
    {
      id: '7',
      question: 'Comment changer le thème de l\'application ?',
      answer: 'Allez dans Paramètres > Apparence > Thème de l\'application et choisissez entre mode sombre ou clair.',
      category: 'Personnalisation'
    },
    {
      id: '8',
      question: 'Puis-je utiliser l\'app sans Internet ?',
      answer: 'Certaines fonctionnalités comme les jeux solo et la consultation des photos fonctionnent hors ligne. La synchronisation nécessite une connexion.',
      category: 'Connexion'
    }
  ];

  const categories = ['Toutes', 'Synchronisation', 'Sécurité', 'Jeux', 'Personnalisation', 'Musique', 'Sauvegarde', 'Connexion'];

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Toutes' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleContactSupport = () => {
    showAlert({
      title: 'Contacter le support',
      message: 'Choisissez votre méthode de contact préférée',
      buttons: [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@itsyou-app.com?subject=Support ItsYou App')
        },
        { text: 'Annuler', style: 'cancel' }
      ],
      type: 'info',
    });
  };

  const quickActions = [
    {
      icon: 'mail',
      title: 'Contacter le support',
      subtitle: 'Email de support',
      onPress: handleContactSupport,
    },
  ];

  const renderQuickAction = (action: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.quickActionItem}
      onPress={action.onPress}
      activeOpacity={0.8}
    >
      <View style={styles.glassCard}>
        <View style={[styles.gradientOverlay, {
          backgroundColor: `${currentTheme.romantic.primary}08`
        }]} />

        <View style={styles.quickActionContent}>
          <View style={[styles.quickActionIcon, {
            backgroundColor: `${currentTheme.romantic.primary}25`
          }]}>
            <Foundation name={action.icon} size={24} color={currentTheme.romantic.primary} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
            <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
          </View>
          <Foundation name="arrow-right" size={16} color="rgba(255,255,255,0.5)" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFAQItem = (item: FAQItem) => {
    const isExpanded = expandedItems.includes(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.faqItem}
        onPress={() => toggleExpanded(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.glassCard}>
          <View style={[styles.gradientOverlay, {
            backgroundColor: `${currentTheme.romantic.primary}06`
          }]} />

          <View style={styles.faqContent}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Foundation
                name={isExpanded ? "minus" : "plus"}
                size={20}
                color={currentTheme.romantic.primary}
              />
            </View>

            {isExpanded && (
              <View style={styles.faqAnswerContainer}>
                <Text style={styles.faqAnswer}>{item.answer}</Text>
                <View style={[styles.faqCategory, {
                  backgroundColor: `${currentTheme.romantic.secondary}20`,
                }]}>
                  <Text style={[styles.faqCategoryText, {
                    color: currentTheme.romantic.secondary
                  }]}>{item.category}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScroll}
      contentContainerStyle={styles.categoryScrollContent}
    >
      {categories.map((category, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.categoryButton,
            {
              backgroundColor: selectedCategory === category
                ? `${currentTheme.romantic.primary}30`
                : 'rgba(255, 255, 255, 0.08)',
              borderColor: selectedCategory === category
                ? currentTheme.romantic.primary
                : 'rgba(255, 255, 255, 0.15)',
            }
          ]}
          onPress={() => setSelectedCategory(category)}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category && {
              color: '#FFFFFF',
              fontWeight: '700'
            }
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.adaptiveOverlay}>
            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={[styles.backButton, {
                    backgroundColor: `${currentTheme.romantic.primary}30`,
                    borderColor: `${currentTheme.romantic.primary}50`,
                  }]}
                  onPress={() => navigateToScreen('settings')}
                  activeOpacity={0.8}
                >
                  <Foundation name="arrow-left" size={22} color={currentTheme.romantic.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Centre d'aide</Text>
                <View style={styles.placeholder} />
              </View>

              {/* Search Bar */}
              <View style={styles.searchSection}>
                <View style={styles.glassCard}>
                  <View style={[styles.gradientOverlay, {
                    backgroundColor: `${currentTheme.romantic.primary}08`
                  }]} />

                  <View style={styles.searchContent}>
                    <Foundation name="magnifying-glass" size={20} color="rgba(255,255,255,0.6)" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Rechercher dans l'aide..."
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Foundation name="x" size={20} color="rgba(255,255,255,0.6)" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActionsSection}>
                <Text style={[styles.sectionTitle, {
                  textShadowColor: `${currentTheme.romantic.primary}60`,
                }]}>Actions rapides</Text>
                <View style={styles.quickActionsGrid}>
                  {quickActions.map((action, index) => renderQuickAction(action, index))}
                </View>
              </View>

              {/* Category Filter */}
              <View style={styles.categorySection}>
                <Text style={[styles.sectionTitle, {
                  textShadowColor: `${currentTheme.romantic.primary}60`,
                }]}>Catégories</Text>
                {renderCategoryFilter()}
              </View>

              {/* FAQ Section */}
              <View style={styles.faqSection}>
                <Text style={[styles.sectionTitle, {
                  textShadowColor: `${currentTheme.romantic.primary}60`,
                }]}>
                  Questions fréquentes ({filteredFAQ.length})
                </Text>

                {filteredFAQ.length === 0 ? (
                  <View style={styles.noResultsContainer}>
                    <View style={styles.glassCard}>
                      <View style={[styles.gradientOverlay, {
                        backgroundColor: `${currentTheme.romantic.primary}08`
                      }]} />

                      <View style={styles.noResultsContent}>
                        <Foundation name="magnifying-glass" size={48} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.noResultsTitle}>Aucun résultat trouvé</Text>
                        <Text style={styles.noResultsText}>
                          Essayez de modifier votre recherche ou contactez notre support.
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  filteredFAQ.map(item => renderFAQItem(item))
                )}
              </View>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </ImageBackground>

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
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  adaptiveOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  placeholder: {
    width: 44,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  glassCard: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    opacity: 0.9,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionItem: {
    marginBottom: 0,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.2,
  },
  categorySection: {
    marginBottom: 30,
  },
  categoryScroll: {
    paddingLeft: 20,
  },
  categoryScrollContent: {
    paddingRight: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.3,
  },
  faqSection: {
    paddingHorizontal: 20,
  },
  faqItem: {
    marginBottom: 12,
  },
  faqContent: {
    padding: 18,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  faqAnswerContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  faqAnswer: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  faqCategory: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  faqCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  noResultsContainer: {
    marginTop: 20,
  },
  noResultsContent: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  noResultsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default HelpCenterScreen;
