import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  ImageBackground,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { NoteStyle, NoteFontFamily, NoteTextSize, NoteBackgroundType } from '../../types/notes';

const { width, height } = Dimensions.get('window');

interface NoteStyleCustomizerProps {
  visible: boolean;
  onClose: () => void;
  currentStyle: NoteStyle;
  onStyleChange: (style: Partial<NoteStyle>) => void;
  theme: any;
}

const NoteStyleCustomizer: React.FC<NoteStyleCustomizerProps> = ({
  visible,
  onClose,
  currentStyle,
  onStyleChange,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'font' | 'size' | 'colors' | 'backgrounds'>('font');

  const fontOptions: { family: NoteFontFamily; name: string; preview: string }[] = [
    { family: 'default', name: 'Par défaut', preview: 'Amour éternel' },
    { family: 'romantic', name: 'Romantique', preview: 'Mon cœur' },
    { family: 'elegant', name: 'Élégant', preview: 'Toujours toi' },
    { family: 'handwritten', name: 'Manuscrit', preview: 'Je t\'aime' },
    { family: 'modern', name: 'Moderne', preview: 'Nos rêves' },
    { family: 'classic', name: 'Classique', preview: 'Pour toujours' },
  ];

  const sizeOptions: { size: NoteTextSize; name: string; fontSize: number }[] = [
    { size: 'small', name: 'Petit', fontSize: 14 },
    { size: 'medium', name: 'Moyen', fontSize: 16 },
    { size: 'large', name: 'Grand', fontSize: 18 },
    { size: 'extra-large', name: 'Très grand', fontSize: 22 },
  ];

  const textColors = [
    { name: 'Noir doux', color: '#2C2C2C' },
    { name: 'Rose tendre', color: '#FF69B4' },
    { name: 'Violet amour', color: '#9370DB' },
    { name: 'Bleu ciel', color: '#87CEEB' },
    { name: 'Vert émeraude', color: '#50C878' },
    { name: 'Rouge passion', color: '#DC143C' },
    { name: 'Or royal', color: '#FFD700' },
    { name: 'Argent', color: '#C0C0C0' },
  ];

  const backgroundColors = [
    { name: 'Blanc perle', color: '#FFF8F8' },
    { name: 'Rose poudré', color: '#FFE4E7' },
    { name: 'Lavande', color: '#E6E6FA' },
    { name: 'Bleu alice', color: '#F0F8FF' },
    { name: 'Mint cream', color: '#F5FFFA' },
    { name: 'Miel', color: '#FFF8DC' },
    { name: 'Pêche', color: '#FFEFD5' },
    { name: 'Ivoire', color: '#FFFFF0' },
  ];

  const romanticBackgrounds = [
    { name: 'Cœurs dorés', url: 'https://example.com/hearts-gold.jpg' },
    { name: 'Fleurs roses', url: 'https://example.com/pink-flowers.jpg' },
    { name: 'Étoiles romantiques', url: 'https://example.com/romantic-stars.jpg' },
    { name: 'Papillons', url: 'https://example.com/butterflies.jpg' },
    { name: 'Dentelle vintage', url: 'https://example.com/vintage-lace.jpg' },
    { name: 'Nuages roses', url: 'https://example.com/pink-clouds.jpg' },
    { name: 'Coucher de soleil', url: 'https://example.com/sunset.jpg' },
    { name: 'Jardin secret', url: 'https://example.com/secret-garden.jpg' },
  ];

  const gradientBackgrounds = [
    { name: 'Rose au violet', colors: ['#FFB6C1', '#DDA0DD'] },
    { name: 'Ciel au coucher', colors: ['#FF69B4', '#FF1493'] },
    { name: 'Océan d\'amour', colors: ['#87CEEB', '#4169E1'] },
    { name: 'Forêt enchantée', colors: ['#98FB98', '#32CD32'] },
    { name: 'Coucher doré', colors: ['#FFD700', '#FFA500'] },
    { name: 'Lavande mystique', colors: ['#E6E6FA', '#9370DB'] },
  ];

  const getFontStyle = (family: NoteFontFamily) => {
    switch (family) {
      case 'romantic': return { fontFamily: 'Georgia', fontStyle: 'italic' as const };
      case 'elegant': return { fontFamily: 'serif' };
      case 'handwritten': return { fontFamily: 'cursive' };
      case 'modern': return { fontFamily: 'sans-serif' };
      case 'classic': return { fontFamily: 'Times New Roman' };
      default: return {};
    }
  };

  const renderFontTab = () => (
    <ScrollView style={styles.tabContent}>
      {fontOptions.map((font) => (
        <TouchableOpacity
          key={font.family}
          style={[
            styles.fontOption,
            currentStyle.fontFamily === font.family && styles.activeFontOption
          ]}
          onPress={() => onStyleChange({ fontFamily: font.family })}
        >
          <View style={styles.fontInfo}>
            <Text style={styles.fontName}>{font.name}</Text>
            <Text style={[styles.fontPreview, getFontStyle(font.family)]}>
              {font.preview}
            </Text>
          </View>
          {currentStyle.fontFamily === font.family && (
            <Foundation name="check" size={20} color={theme.romantic.primary} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSizeTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sizeGrid}>
        {sizeOptions.map((size) => (
          <TouchableOpacity
            key={size.size}
            style={[
              styles.sizeOption,
              currentStyle.fontSize === size.size && styles.activeSizeOption
            ]}
            onPress={() => onStyleChange({ fontSize: size.size })}
          >
            <Text style={[styles.sizeText, { fontSize: size.fontSize }]}>Aa</Text>
            <Text style={styles.sizeLabel}>{size.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.formatSection}>
        <Text style={styles.sectionTitle}>Format du texte</Text>
        <View style={styles.formatRow}>
          <TouchableOpacity
            style={[styles.formatButton, currentStyle.isBold && styles.activeFormat]}
            onPress={() => onStyleChange({ isBold: !currentStyle.isBold })}
          >
            <Text style={[styles.formatText, { fontWeight: 'bold' }]}>B</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.formatButton, currentStyle.isItalic && styles.activeFormat]}
            onPress={() => onStyleChange({ isItalic: !currentStyle.isItalic })}
          >
            <Text style={[styles.formatText, { fontStyle: 'italic' }]}>I</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.formatButton, currentStyle.isUnderlined && styles.activeFormat]}
            onPress={() => onStyleChange({ isUnderlined: !currentStyle.isUnderlined })}
          >
            <Text style={[styles.formatText, { textDecorationLine: 'underline' }]}>U</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderColorsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.colorSection}>
        <Text style={styles.sectionTitle}>Couleur du texte</Text>
        <View style={styles.colorGrid}>
          {textColors.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.colorOption,
                { backgroundColor: color.color },
                currentStyle.textColor === color.color && styles.activeColorOption
              ]}
              onPress={() => onStyleChange({ textColor: color.color })}
            >
              {currentStyle.textColor === color.color && (
                <Foundation name="check" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.colorSection}>
        <Text style={styles.sectionTitle}>Couleur d\'arrière-plan</Text>
        <View style={styles.colorGrid}>
          {backgroundColors.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.colorOption,
                { backgroundColor: color.color },
                currentStyle.backgroundColor === color.color && styles.activeColorOption
              ]}
              onPress={() => onStyleChange({
                backgroundColor: color.color,
                backgroundType: 'color',
                backgroundValue: color.color
              })}
            >
              {currentStyle.backgroundColor === color.color && (
                <Foundation name="check" size={16} color={theme.text.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderBackgroundsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.backgroundSection}>
        <Text style={styles.sectionTitle}>Arrière-plans romantiques</Text>
        <View style={styles.backgroundGrid}>
          {romanticBackgrounds.map((bg, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.backgroundOption,
                currentStyle.backgroundValue === bg.url && styles.activeBackgroundOption
              ]}
              onPress={() => onStyleChange({
                backgroundType: 'predefined',
                backgroundValue: bg.url,
                backgroundColor: theme.background.card // fallback
              })}
            >
              <View style={[styles.backgroundPreview, { backgroundColor: '#FFE4E7' }]}>
                <Foundation name="photo" size={24} color={theme.text.tertiary} />
              </View>
              <Text style={styles.backgroundName}>{bg.name}</Text>
              {currentStyle.backgroundValue === bg.url && (
                <Foundation name="check" size={16} color={theme.romantic.primary} style={styles.backgroundCheck} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.backgroundSection}>
        <Text style={styles.sectionTitle}>Dégradés romantiques</Text>
        <View style={styles.gradientGrid}>
          {gradientBackgrounds.map((gradient, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.gradientOption,
                currentStyle.backgroundValue === JSON.stringify(gradient.colors) && styles.activeBackgroundOption
              ]}
              onPress={() => onStyleChange({
                backgroundType: 'gradient',
                backgroundValue: JSON.stringify(gradient.colors),
                backgroundColor: gradient.colors[0] // fallback
              })}
            >
              <View style={[
                styles.gradientPreview,
                { backgroundColor: gradient.colors[0] } // simplified preview
              ]} />
              <Text style={styles.gradientName}>{gradient.name}</Text>
              {currentStyle.backgroundValue === JSON.stringify(gradient.colors) && (
                <Foundation name="check" size={16} color={theme.romantic.primary} style={styles.backgroundCheck} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const tabs = [
    { id: 'font', name: 'Police', icon: 'text-color' },
    { id: 'size', name: 'Taille', icon: 'text-size' },
    { id: 'colors', name: 'Couleurs', icon: 'paint-bucket' },
    { id: 'backgrounds', name: 'Fonds', icon: 'photo' },
  ] as const;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.customizer, { backgroundColor: theme.background.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              Personnaliser votre note
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Foundation name="x" size={24} color={theme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={[styles.tabBar, { backgroundColor: theme.background.secondary }]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && { backgroundColor: theme.background.card }
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Foundation
                  name={tab.icon}
                  size={16}
                  color={activeTab === tab.id ? theme.text.primary : theme.text.tertiary}
                />
                <Text style={[
                  styles.tabText,
                  { color: activeTab === tab.id ? theme.text.primary : theme.text.tertiary }
                ]}>
                  {tab.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'font' && renderFontTab()}
            {activeTab === 'size' && renderSizeTab()}
            {activeTab === 'colors' && renderColorsTab()}
            {activeTab === 'backgrounds' && renderBackgroundsTab()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  customizer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
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
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    margin: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Font styles
  fontOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeFontOption: {
    borderColor: '#FF69B4',
    backgroundColor: 'rgba(255,105,180,0.1)',
  },
  fontInfo: {
    flex: 1,
  },
  fontName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fontPreview: {
    fontSize: 18,
    color: '#FF69B4',
  },

  // Size styles
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  sizeOption: {
    width: (width - 64) / 4,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeSizeOption: {
    borderColor: '#FF69B4',
    backgroundColor: 'rgba(255,105,180,0.1)',
  },
  sizeText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sizeLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  formatSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeFormat: {
    borderColor: '#FF69B4',
    backgroundColor: 'rgba(255,105,180,0.1)',
  },
  formatText: {
    fontSize: 18,
    color: '#FFFFFF',
  },

  // Color styles
  colorSection: {
    marginBottom: 30,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  activeColorOption: {
    borderColor: '#FF69B4',
  },

  // Background styles
  backgroundSection: {
    marginBottom: 30,
  },
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  backgroundOption: {
    width: (width - 64) / 2,
    aspectRatio: 1.2,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeBackgroundOption: {
    borderColor: '#FF69B4',
    backgroundColor: 'rgba(255,105,180,0.1)',
  },
  backgroundPreview: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  backgroundName: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  backgroundCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  gradientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gradientOption: {
    width: (width - 64) / 3,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gradientPreview: {
    flex: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  gradientName: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default NoteStyleCustomizer;