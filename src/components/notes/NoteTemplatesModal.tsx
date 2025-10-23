import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { NoteTemplate, NoteStyle } from '../../types/notes';
import CustomAlert from '../common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

interface NoteTemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: NoteTemplate) => void;
  theme: any;
}

const NoteTemplatesModal: React.FC<NoteTemplatesModalProps> = ({
  visible,
  onClose,
  onSelectTemplate,
  theme,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('romantic');
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const templateCategories = [
    { id: 'romantic', name: 'Romantique', icon: 'heart' },
    { id: 'memories', name: 'Souvenirs', icon: 'camera' },
    { id: 'letters', name: 'Lettres', icon: 'mail' },
    { id: 'dates', name: 'Rendez-vous', icon: 'calendar' },
    { id: 'gratitude', name: 'Gratitude', icon: 'star' },
    { id: 'dreams', name: 'Rêves', icon: 'cloud' },
  ];

  const noteTemplates: NoteTemplate[] = [
    // Romantic Templates
    {
      id: 'love-letter-1',
      name: 'Lettre d\'amour classique',
      description: 'Une lettre d\'amour traditionnelle et romantique',
      category: 'romantic',
      content: `Mon amour,

Chaque jour qui passe, je tombe un peu plus amoureux/se de toi. Tu illumines ma vie d'une manière que je n'aurais jamais imaginée possible.

Quand je te regarde, je vois non seulement la personne la plus belle au monde, mais aussi mon meilleur ami, mon complice et mon âme sœur.

Je veux passer le reste de ma vie à te faire sourire, à découvrir le monde à tes côtés et à construire notre histoire d'amour unique.

Tu es mon bonheur, mon inspiration et ma raison de me lever chaque matin avec le sourire.

Avec tout mon amour,
[Votre nom]`,
      style: {
        fontFamily: 'romantic',
        fontSize: 'medium',
        backgroundColor: '#FFF8F9',
        backgroundType: 'color',
        backgroundValue: '#FFF8F9',
        textColor: '#2C2C2C',
        isBold: false,
        isItalic: true,
        isUnderlined: false,
      },
    },
    {
      id: 'simple-love',
      name: 'Mot d\'amour simple',
      description: 'Un petit mot doux pour exprimer ses sentiments',
      category: 'romantic',
      content: `Hey toi ❤️

Je voulais juste te dire que tu me manques et que j'ai hâte de te retrouver.

Tu rends chaque moment plus beau rien qu'en étant toi.

Je t'aime ❤️`,
      style: {
        fontFamily: 'handwritten',
        fontSize: 'medium',
        backgroundColor: '#FFE4E7',
        backgroundType: 'color',
        backgroundValue: '#FFE4E7',
        textColor: '#DC143C',
        isBold: false,
        isItalic: false,
        isUnderlined: false,
      },
    },

    // Memory Templates
    {
      id: 'memory-1',
      name: 'Notre premier rendez-vous',
      description: 'Immortaliser le souvenir de votre première rencontre',
      category: 'memories',
      content: `📅 Notre premier rendez-vous

Date : [Date]
Lieu : [Lieu]

Ce que je me souviens :
• Comment tu étais habillé(e) :
• Ce qu'on a fait :
• Ce qui m'a marqué(e) :
• Ce que je pensais de toi :

Mes sentiments ce jour-là :
[Décrivez vos émotions]

Pourquoi ce moment était spécial :
[Ce qui rendait ce moment unique]

📸 Photos ou objets souvenirs :
[Décrivez les souvenirs associés]`,
      style: {
        fontFamily: 'default',
        fontSize: 'medium',
        backgroundColor: '#F0F8FF',
        backgroundType: 'color',
        backgroundValue: '#F0F8FF',
        textColor: '#2C2C2C',
        isBold: false,
        isItalic: false,
        isUnderlined: false,
      },
    },
    {
      id: 'memory-special-moment',
      name: 'Moment spécial',
      description: 'Capturer un moment précieux de votre relation',
      category: 'memories',
      content: `✨ Un moment magique

📅 Quand : [Date et heure]
📍 Où : [Lieu]

Ce qui s'est passé :
[Racontez l'histoire de ce moment]

Pourquoi c'était spécial :
[Ce qui rendait ce moment unique]

Ce que j'ai ressenti :
[Vos émotions et sensations]

Ce que ça a changé pour nous :
[L'impact sur votre relation]

💭 Je veux me souvenir de :
• [Détail 1]
• [Détail 2]
• [Détail 3]

❤️ Je t'aime parce que : [Raison liée à ce moment]`,
      style: {
        fontFamily: 'elegant',
        fontSize: 'medium',
        backgroundColor: '#FFF8DC',
        backgroundType: 'color',
        backgroundValue: '#FFF8DC',
        textColor: '#2C2C2C',
        isBold: false,
        isItalic: false,
        isUnderlined: false,
      },
    },

    // Letter Templates
    {
      id: 'miss-you-letter',
      name: 'Tu me manques',
      description: 'Exprimer votre manque quand vous êtes séparés',
      category: 'letters',
      content: `Mon cœur,

Cela fait [durée] que tu es parti(e) et tu me manques déjà terriblement.

La maison semble si vide sans ton rire, sans tes blagues et sans ta présence chaleureuse. Même notre lit me semble trop grand sans toi.

Ce qui me manque le plus :
• [Quelque chose de spécifique]
• [Une habitude que vous partagez]
• [Sa façon d'être]

J'ai hâte de :
• [Activité que vous ferez ensemble]
• [Moment que vous partagerez]
• [Simplement être ensemble]

En attendant ton retour, je [ce que vous faites pour penser à lui/elle].

Reviens-moi vite,
Ton/ta [surnom affectueux]

P.S. : [Petit message personnel]`,
      style: {
        fontFamily: 'romantic',
        fontSize: 'medium',
        backgroundColor: '#E6E6FA',
        backgroundType: 'color',
        backgroundValue: '#E6E6FA',
        textColor: '#4B0082',
        isBold: false,
        isItalic: true,
        isUnderlined: false,
      },
    },

    // Date Ideas Templates
    {
      id: 'date-planning',
      name: 'Idées de rendez-vous',
      description: 'Planifier vos prochaines sorties romantiques',
      category: 'dates',
      content: `💕 Nos prochaines aventures

🏠 À la maison :
• [Idée 1 - ex: Soirée cinéma avec nos films préférés]
• [Idée 2 - ex: Cuisiner ensemble un nouveau plat]
• [Idée 3 - ex: Soirée jeux de société]

🌆 En ville :
• [Restaurant à essayer]
• [Exposition ou musée]
• [Spectacle ou concert]
• [Balade dans un nouveau quartier]

🌿 Dans la nature :
• [Randonnée ou pique-nique]
• [Plage ou lac]
• [Parc ou jardin]

✨ Expériences spéciales :
• [Activité insolite]
• [Weekend quelque part]
• [Cours ensemble (danse, cuisine, etc.)]

💭 Celui/celle que j'ai le plus hâte de faire : [Votre choix]

💝 Surprise que je prépare : [Mystère...]`,
      style: {
        fontFamily: 'modern',
        fontSize: 'medium',
        backgroundColor: '#F5FFFA',
        backgroundType: 'color',
        backgroundValue: '#F5FFFA',
        textColor: '#2C2C2C',
        isBold: false,
        isItalic: false,
        isUnderlined: false,
      },
    },

    // Gratitude Templates
    {
      id: 'daily-gratitude',
      name: 'Gratitude quotidienne',
      description: 'Exprimer votre reconnaissance pour votre partenaire',
      category: 'gratitude',
      content: `🙏 Aujourd'hui, je suis reconnaissant(e) pour toi

📅 Date : [Date d'aujourd'hui]

Ce pour quoi je te remercie aujourd'hui :
1. [Quelque chose qu'il/elle a fait]
2. [Une qualité que vous admirez]
3. [Un moment de bonheur partagé]

💫 Comment tu as rendu ma journée meilleure :
[Description spécifique]

❤️ Ce que j'aime le plus chez toi en ce moment :
[Trait de caractère, action, etc.]

🌟 Un souvenir récent qui me fait sourire :
[Moment partagé récemment]

💕 Ma promesse pour demain :
[Comment vous voulez lui montrer votre amour]

Merci d'être toi, merci d'être nous.

Avec amour et gratitude,
[Votre nom]`,
      style: {
        fontFamily: 'elegant',
        fontSize: 'medium',
        backgroundColor: '#FFFACD',
        backgroundType: 'color',
        backgroundValue: '#FFFACD',
        textColor: '#8B4513',
        isBold: false,
        isItalic: false,
        isUnderlined: false,
      },
    },

    // Dreams Templates
    {
      id: 'future-dreams',
      name: 'Nos rêves d\'avenir',
      description: 'Partager vos projets et rêves de couple',
      category: 'dreams',
      content: `🌟 Nos rêves à deux

💑 Dans 1 an, j'aimerais qu'on :
• [Projet à court terme]
• [Objectif commun]
• [Expérience à vivre]

🏡 Dans 5 ans, je nous vois :
• [Vision de votre vie commune]
• [Où vous aimeriez vivre]
• [Ce que vous aimeriez accomplir]

✨ Mon rêve le plus fou avec toi :
[Rêve ambitieux ou fantaisiste]

🎯 Nos objectifs de couple :
• [Objectif relationnel]
• [Projet concret]
• [Habitude à développer]

💝 Ce que j'espère qu'on ne changera jamais :
[Aspects de votre relation à préserver]

🚀 Notre prochaine grande aventure :
[Projet excitant à réaliser ensemble]

🌈 Pourquoi j'ai hâte de vieillir avec toi :
[Vision à long terme de votre amour]`,
      style: {
        fontFamily: 'modern',
        fontSize: 'medium',
        backgroundColor: '#F0FFFF',
        backgroundType: 'color',
        backgroundValue: '#F0FFFF',
        textColor: '#2C2C2C',
        isBold: false,
        isItalic: false,
        isUnderlined: false,
      },
    },
  ];

  const filteredTemplates = noteTemplates.filter(
    template => template.category === selectedCategory
  );

  const handleSelectTemplate = (template: NoteTemplate) => {
    showAlert({
      title: 'Utiliser ce modèle',
      message: `Voulez-vous créer une nouvelle note avec le modèle "${template.name}" ?`,
      type: 'info',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Utiliser',
          onPress: () => {
            onSelectTemplate(template);
            onClose();
          }
        }
      ]
    });
  };

  return (
    <>
      <Modal
        visible={visible && !isVisible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modal, { backgroundColor: theme.background.card }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text.primary }]}>
                Modèles de notes
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Foundation name="x" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {templateCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  { backgroundColor: theme.background.secondary },
                  selectedCategory === category.id && {
                    backgroundColor: theme.romantic.primary,
                  }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Foundation
                  name={category.icon}
                  size={16}
                  color={selectedCategory === category.id ? '#FFFFFF' : theme.text.primary}
                />
                <Text style={[
                  styles.categoryText,
                  {
                    color: selectedCategory === category.id ? '#FFFFFF' : theme.text.primary
                  }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Templates */}
          <ScrollView style={styles.templatesContainer} showsVerticalScrollIndicator={false}>
            {filteredTemplates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[styles.templateCard, { backgroundColor: theme.background.secondary }]}
                onPress={() => handleSelectTemplate(template)}
              >
                <View style={styles.templateHeader}>
                  <View style={styles.templateInfo}>
                    <Text style={[styles.templateName, { color: theme.text.primary }]}>
                      {template.name}
                    </Text>
                    <Text style={[styles.templateDescription, { color: theme.text.secondary }]}>
                      {template.description}
                    </Text>
                  </View>
                  <Foundation name="arrow-right" size={16} color={theme.text.tertiary} />
                </View>

                <View style={[
                  styles.templatePreview,
                  { backgroundColor: template.style.backgroundColor }
                ]}>
                  <Text
                    style={[
                      styles.templateContent,
                      {
                        color: template.style.textColor,
                        fontWeight: template.style.isBold ? 'bold' : 'normal',
                        fontStyle: template.style.isItalic ? 'italic' : 'normal',
                        textDecorationLine: template.style.isUnderlined ? 'underline' : 'none',
                      }
                    ]}
                    numberOfLines={4}
                  >
                    {template.content}
                  </Text>
                </View>

                <View style={styles.templateFooter}>
                  <View style={styles.styleIndicators}>
                    <View style={[styles.colorIndicator, { backgroundColor: template.style.backgroundColor }]} />
                    <Text style={[styles.fontIndicator, { color: theme.text.tertiary }]}>
                      {template.style.fontFamily}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.useButton, { backgroundColor: theme.romantic.primary }]}
                    onPress={() => handleSelectTemplate(template)}
                  >
                    <Text style={styles.useButtonText}>Utiliser</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>

    {alertConfig && (
      <CustomAlert
        visible={isVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
        onClose={hideAlert}
        theme={theme}
      />
    )}
  </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  templatesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  templateCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  templatePreview: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    minHeight: 80,
  },
  templateContent: {
    fontSize: 14,
    lineHeight: 18,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  styleIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  fontIndicator: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  useButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12,
  },
  useButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default NoteTemplatesModal;