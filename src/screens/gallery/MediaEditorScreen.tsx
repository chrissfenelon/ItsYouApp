import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import { MediaItem } from '../../types/gallery';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MediaEditorScreenProps {
  visible: boolean;
  media: MediaItem | null;
  onClose: () => void;
  onSave: (editedMedia: MediaItem) => void;
}

type EditorTool = 'crop' | 'filter' | 'text' | 'sticker' | 'adjust';

const MediaEditorScreen: React.FC<MediaEditorScreenProps> = ({
  visible,
  media,
  onClose,
  onSave,
}) => {
  const { currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [selectedTool, setSelectedTool] = useState<EditorTool | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);

  const styles = createStyles(currentTheme);

  if (!media) return null;

  const filters = [
    { id: 'none', name: 'Original', filter: null },
    { id: 'grayscale', name: 'N&B', filter: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', filter: 'sepia(100%)' },
    { id: 'vintage', name: 'Vintage', filter: 'sepia(50%) contrast(1.2)' },
    { id: 'cool', name: 'Cool', filter: 'hue-rotate(90deg) saturate(1.3)' },
    { id: 'warm', name: 'Warm', filter: 'hue-rotate(-30deg) saturate(1.2)' },
    { id: 'vivid', name: 'Vivid', filter: 'saturate(2) contrast(1.3)' },
    { id: 'fade', name: 'Fade', filter: 'brightness(1.1) contrast(0.9)' },
  ];

  const tools: { id: EditorTool; icon: string; name: string }[] = [
    { id: 'crop', icon: 'crop', name: 'Recadrer' },
    { id: 'filter', icon: 'photo', name: 'Filtres' },
    { id: 'adjust', icon: 'graph-horizontal', name: 'Ajuster' },
    { id: 'text', icon: 'text-color', name: 'Texte' },
    { id: 'sticker', icon: 'heart', name: 'Stickers' },
  ];

  const handleSave = () => {
    showAlert({
      title: 'Sauvegarder',
      message: 'Voulez-vous sauvegarder les modifications ?',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Sauvegarder',
          onPress: () => {
            // Here we would apply the edits and save
            onSave(media);
            showAlert({
              title: 'Succès',
              message: 'Modifications sauvegardées',
              buttons: [{ text: 'OK' }],
              type: 'success',
            });
            onClose();
          },
        },
      ],
      type: 'info',
    });
  };

  const handleDiscard = () => {
    showAlert({
      title: 'Abandonner',
      message: 'Voulez-vous abandonner les modifications ?',
      buttons: [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: onClose,
        },
      ],
      type: 'warning',
    });
  };

  const renderToolPanel = () => {
    switch (selectedTool) {
      case 'filter':
        return (
          <View style={styles.toolPanel}>
            <Text style={styles.toolPanelTitle}>Filtres</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter.id && styles.filterOptionSelected,
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <View style={styles.filterPreview}>
                    <Image
                      source={{ uri: media.uri }}
                      style={[
                        styles.filterPreviewImage,
                        filter.filter && { opacity: 0.8 },
                      ]}
                    />
                  </View>
                  <Text style={styles.filterName}>{filter.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 'adjust':
        return (
          <View style={styles.toolPanel}>
            <Text style={styles.toolPanelTitle}>Ajustements</Text>
            <View style={styles.adjustmentsList}>
              <View style={styles.adjustmentItem}>
                <Text style={styles.adjustmentLabel}>Luminosité</Text>
                <Text style={styles.adjustmentValue}>{Math.round(brightness * 100)}%</Text>
              </View>
              <View style={styles.adjustmentItem}>
                <Text style={styles.adjustmentLabel}>Contraste</Text>
                <Text style={styles.adjustmentValue}>{Math.round(contrast * 100)}%</Text>
              </View>
              <View style={styles.adjustmentItem}>
                <Text style={styles.adjustmentLabel}>Saturation</Text>
                <Text style={styles.adjustmentValue}>{Math.round(saturation * 100)}%</Text>
              </View>
            </View>
          </View>
        );

      case 'crop':
        return (
          <View style={styles.toolPanel}>
            <Text style={styles.toolPanelTitle}>Recadrage</Text>
            <View style={styles.cropOptions}>
              <TouchableOpacity style={styles.cropOption}>
                <Text style={styles.cropOptionText}>Libre</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cropOption}>
                <Text style={styles.cropOptionText}>1:1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cropOption}>
                <Text style={styles.cropOptionText}>4:3</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cropOption}>
                <Text style={styles.cropOptionText}>16:9</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'text':
        return (
          <View style={styles.toolPanel}>
            <Text style={styles.toolPanelTitle}>Ajouter du texte</Text>
            <Text style={styles.comingSoon}>Fonctionnalité bientôt disponible</Text>
          </View>
        );

      case 'sticker':
        return (
          <View style={styles.toolPanel}>
            <Text style={styles.toolPanelTitle}>Stickers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.stickersGrid}>
                {['❤️', '💕', '😍', '🥰', '💖', '💝', '💘', '💗', '💓', '💞'].map((emoji) => (
                  <TouchableOpacity key={emoji} style={styles.stickerItem}>
                    <Text style={styles.stickerEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleDiscard}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleDiscard}>
            <Foundation name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Éditeur</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
            <Foundation name="check" size={24} color={currentTheme.romantic.primary} />
          </TouchableOpacity>
        </View>

        {/* Image Preview */}
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: media.uri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>

        {/* Tool Panel */}
        {selectedTool && renderToolPanel()}

        {/* Tools Bar */}
        <View style={styles.toolsBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolsScrollContent}
          >
            {tools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={[
                  styles.toolButton,
                  selectedTool === tool.id && styles.toolButtonActive,
                ]}
                onPress={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
              >
                <Foundation
                  name={tool.icon}
                  size={24}
                  color={selectedTool === tool.id ? currentTheme.romantic.primary : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.toolButtonText,
                    selectedTool === tool.id && styles.toolButtonTextActive,
                  ]}
                >
                  {tool.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    headerButton: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    previewContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000000',
    },
    previewImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT * 0.6,
    },
    toolPanel: {
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
      maxHeight: 200,
    },
    toolPanelTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 12,
    },
    filterOption: {
      marginRight: 12,
      alignItems: 'center',
    },
    filterOptionSelected: {
      opacity: 1,
    },
    filterPreview: {
      width: 70,
      height: 70,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 6,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    filterPreviewImage: {
      width: '100%',
      height: '100%',
    },
    filterName: {
      fontSize: 12,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    adjustmentsList: {
      gap: 12,
    },
    adjustmentItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    adjustmentLabel: {
      fontSize: 14,
      color: '#FFFFFF',
    },
    adjustmentValue: {
      fontSize: 14,
      color: theme.romantic.primary,
      fontWeight: '600',
    },
    cropOptions: {
      flexDirection: 'row',
      gap: 12,
    },
    cropOption: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
    },
    cropOptionText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    comingSoon: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
      marginTop: 20,
    },
    stickersGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    stickerItem: {
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
    },
    stickerEmoji: {
      fontSize: 32,
    },
    toolsBar: {
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    toolsScrollContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    toolButton: {
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      minWidth: 70,
    },
    toolButtonActive: {
      backgroundColor: 'rgba(255, 105, 180, 0.2)',
    },
    toolButtonText: {
      fontSize: 12,
      color: '#FFFFFF',
      marginTop: 4,
    },
    toolButtonTextActive: {
      color: theme.romantic.primary,
      fontWeight: '600',
    },
  });

export default MediaEditorScreen;