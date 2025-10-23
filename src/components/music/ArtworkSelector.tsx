import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import CustomAlert from '../common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

interface ArtworkSelectorProps {
  artwork?: string;
  onArtworkChange?: (uri: string) => void;
  editable?: boolean;
  size?: number;
}

const ArtworkSelector: React.FC<ArtworkSelectorProps> = ({
  artwork,
  onArtworkChange,
  editable = true,
  size = width * 0.7,
}) => {
  const { currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempArtwork, setTempArtwork] = useState(artwork);

  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showAlert({
          title: 'Erreur',
          message: 'Impossible de sélectionner l\'image',
          type: 'error',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        if (selectedUri) {
          setTempArtwork(selectedUri);
          onArtworkChange?.(selectedUri);
          setShowEditModal(false);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      showAlert({
        title: 'Erreur',
        message: 'Une erreur est survenue',
        type: 'error',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleRemoveArtwork = () => {
    setTempArtwork(undefined);
    onArtworkChange?.('');
    setShowEditModal(false);
  };

  return (
    <>
      {/* Main Artwork Display */}
      <View style={[styles.artworkContainer, { width: size, height: size }]}>
        {/* Glass effect background */}
        <BlurView
          style={styles.artworkBlur}
          blurType="dark"
          blurAmount={30}
          reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.8)"
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
          >
            {tempArtwork || artwork ? (
              <Image
                source={{ uri: tempArtwork || artwork }}
                style={styles.artworkImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Icon name="music-note" size={size * 0.4} color="rgba(255, 255, 255, 0.3)" />
              </View>
            )}

            {/* Edit button overlay */}
            {editable && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setShowEditModal(true)}
                activeOpacity={0.8}
              >
                <BlurView
                  style={styles.editButtonBlur}
                  blurType="light"
                  blurAmount={10}
                  reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.2)"
                >
                  <Icon name="edit" size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </BlurView>

        {/* Glow effect */}
        <View style={[styles.glowBorder, { width: size, height: size }]} />
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <BlurView
            style={styles.modalBlur}
            blurType="dark"
            blurAmount={20}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.9)"
          >
            <TouchableOpacity activeOpacity={1}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalContent}
              >
                <Text style={styles.modalTitle}>Modifier l'artwork</Text>

                {/* Action buttons */}
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleSelectImage}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#FF69B4', '#FF1493']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Icon name="photo-library" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Choisir une photo</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {(tempArtwork || artwork) && (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleRemoveArtwork}
                    activeOpacity={0.7}
                  >
                    <View style={styles.secondaryButton}>
                      <Icon name="delete" size={24} color="#FF6B6B" />
                      <Text style={[styles.buttonText, styles.deleteButtonText]}>
                        Supprimer l'artwork
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>
      </Modal>

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
    </>
  );
};

const styles = StyleSheet.create({
  artworkContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    alignSelf: 'center',
    marginVertical: 20,
  },
  artworkBlur: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 105, 180, 0.3)',
    pointerEvents: 'none',
  },
  editButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  editButtonBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBlur: {
    width: width * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButtonText: {
    color: '#FF6B6B',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});

export default ArtworkSelector;
