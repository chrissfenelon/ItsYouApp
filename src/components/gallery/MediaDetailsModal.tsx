import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { MediaItem } from '../../types/gallery';

interface MediaDetailsModalProps {
  visible: boolean;
  media: MediaItem | null;
  onClose: () => void;
  theme: any;
}

const MediaDetailsModal: React.FC<MediaDetailsModalProps> = ({
  visible,
  media,
  onClose,
  theme,
}) => {
  if (!media) return null;

  const formatBytes = (bytes: number = 0): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Détails du média</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Foundation name="x" size={24} color={theme.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Thumbnail */}
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: media.uri }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              {media.isSharedWithPartner && (
                <View style={styles.cloudBadge}>
                  <Foundation name="cloud" size={20} color="#FFFFFF" />
                  <Text style={styles.cloudText}>Partagé</Text>
                </View>
              )}
            </View>

            {/* Details */}
            <View style={styles.detailsContainer}>
              <DetailRow
                icon="info"
                label="Titre"
                value={media.title || 'Sans titre'}
                theme={theme}
              />

              {media.description && (
                <DetailRow
                  icon="page-doc"
                  label="Description"
                  value={media.description}
                  theme={theme}
                />
              )}

              <DetailRow
                icon="calendar"
                label="Date de création"
                value={media.createdAt ? new Date(media.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) : 'Date inconnue'}
                theme={theme}
              />

              <DetailRow
                icon={media.type === 'video' ? 'play' : 'photo'}
                label="Type"
                value={media.type === 'video' ? 'Vidéo' : 'Photo'}
                theme={theme}
              />

              <DetailRow
                icon="page-doc"
                label="Taille du fichier"
                value={formatBytes(media.metadata?.size)}
                theme={theme}
              />

              {media.metadata?.width && media.metadata?.height && (
                <DetailRow
                  icon="thumbnails"
                  label="Dimensions"
                  value={`${media.metadata.width} × ${media.metadata.height} px`}
                  theme={theme}
                />
              )}

              <DetailRow
                icon={media.isSharedWithPartner ? 'cloud' : 'mobile'}
                label="Stockage"
                value={media.isSharedWithPartner ? 'Cloud (Firebase)' : 'Local (Appareil)'}
                theme={theme}
              />

              {media.isFavorite && (
                <DetailRow
                  icon="heart"
                  label="Favori"
                  value="Oui ⭐"
                  theme={theme}
                />
              )}

              {media.tags && media.tags.length > 0 && (
                <DetailRow
                  icon="pricetag-multiple"
                  label="Tags"
                  value={media.tags.join(', ')}
                  theme={theme}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

interface DetailRowProps {
  icon: string;
  label: string;
  value: string;
  theme: any;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value, theme }) => {
  return (
    <View style={detailRowStyles.container}>
      <View style={detailRowStyles.labelContainer}>
        <Foundation name={icon} size={16} color={theme.text.tertiary} />
        <Text style={[detailRowStyles.label, { color: theme.text.tertiary }]}>
          {label}
        </Text>
      </View>
      <Text style={[detailRowStyles.value, { color: theme.text.primary }]}>
        {value}
      </Text>
    </View>
  );
};

const detailRowStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
});

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  cloudBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cloudText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  detailsContainer: {
    paddingBottom: 20,
  },
});

export default MediaDetailsModal;