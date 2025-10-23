import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { Song } from '../../types/music';

interface SongItemProps {
  song: Song;
  isPlaying: boolean;
  onPress: () => void;
  onLongPress: () => void;
  theme: any;
  isOfflineAvailable?: boolean;
  downloadProgress?: number;
  isDownloading?: boolean;
}

const SongItem: React.FC<SongItemProps> = ({
  song,
  isPlaying,
  onPress,
  onLongPress,
  theme,
  isOfflineAvailable = false,
  downloadProgress = 0,
  isDownloading = false,
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        isPlaying && { backgroundColor: 'rgba(255, 105, 180, 0.15)' },
      ]}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {song.thumbnailUrl ? (
          <Image
            source={{ uri: song.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.romantic?.primary + '40' || 'rgba(255, 105, 180, 0.4)' }]}>
            <Foundation name="music" size={24} color={theme.romantic?.primary || '#FF69B4'} />
          </View>
        )}

        {/* Playing indicator */}
        {isPlaying && (
          <View style={styles.playingOverlay}>
            <Foundation name="volume" size={20} color="#FFFFFF" />
          </View>
        )}

        {/* Offline checkmark */}
        {isOfflineAvailable && !isDownloading && (
          <View style={styles.offlineCheckmark}>
            <Foundation name="check" size={16} color="#22C55E" />
          </View>
        )}
      </View>

      {/* Song info */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isPlaying && styles.playingTitle]}
            numberOfLines={1}
          >
            {song.title}
          </Text>
          {song.isEmbedded && (
            <View style={[styles.badge, { backgroundColor: theme.romantic?.primary + '30' || 'rgba(255, 105, 180, 0.3)' }]}>
              <Foundation name="star" size={10} color={theme.romantic?.primary || '#FF69B4'} />
              <Text style={[styles.badgeText, { color: theme.romantic?.primary || '#FF69B4' }]}>
                Intégré
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist}
          </Text>
          {song.isSharedWithPartner && (
            <Foundation name="heart" size={12} color={theme.romantic?.primary || '#FF69B4'} style={styles.sharedIcon} />
          )}
        </View>
      </View>

      {/* Duration */}
      <Text style={styles.duration}>
        {formatDuration(song.duration)}
      </Text>

      {/* More icon */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onLongPress();
        }}
        style={styles.moreButton}
      >
        <Foundation name="list" size={20} color="rgba(255, 255, 255, 0.7)" />
      </TouchableOpacity>

      {/* Download Progress Bar */}
      {isDownloading && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${downloadProgress}%`,
                  backgroundColor: theme.romantic?.primary || '#FF69B4'
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(downloadProgress)}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  thumbnailPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.4)',
  },
  playingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 105, 180, 0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  playingTitle: {
    color: '#FF69B4',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artist: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  sharedIcon: {
    marginLeft: 4,
  },
  duration: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginRight: 8,
    minWidth: 40,
    textAlign: 'right',
  },
  moreButton: {
    padding: 8,
  },
  offlineCheckmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 35,
    textAlign: 'right',
  },
});

export default SongItem;
