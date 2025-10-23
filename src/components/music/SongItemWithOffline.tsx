import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Foundation from 'react-native-vector-icons/Foundation';
import LinearGradient from 'react-native-linear-gradient';
import { Song } from '../../types/music';
import MusicService from '../../services/MusicService';

interface SongItemWithOfflineProps {
  song: Song;
  isPlaying: boolean;
  onPress: () => void;
  onLongPress: () => void;
  theme: any;
}

const SongItemWithOffline: React.FC<SongItemWithOfflineProps> = ({
  song,
  isPlaying,
  onPress,
  onLongPress,
  theme,
}) => {
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    checkOfflineAvailability();
  }, [song.id]);

  const checkOfflineAvailability = async () => {
    const available = await MusicService.isAvailableOffline(song.id);
    setIsOfflineAvailable(available);
  };

  const handleDownloadToggle = async () => {
    if (isOfflineAvailable) {
      // Delete offline version
      try {
        await MusicService.deleteOfflineSong(song.id);
        setIsOfflineAvailable(false);
      } catch (error) {
        console.error('Error deleting offline song:', error);
      }
    } else {
      // Download for offline
      try {
        setIsDownloading(true);
        await MusicService.downloadSongForOffline(song, (progress) => {
          setDownloadProgress(progress);
        });
        setIsOfflineAvailable(true);
        setIsDownloading(false);
      } catch (error) {
        console.error('Error downloading song:', error);
        setIsDownloading(false);
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <BlurView
        style={styles.blurContainer}
        blurType="dark"
        blurAmount={10}
        reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.5)"
      >
        <LinearGradient
          colors={
            isPlaying
              ? ['rgba(255, 105, 180, 0.2)', 'rgba(255, 20, 147, 0.1)']
              : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {/* Left section - Play indicator */}
          <View style={styles.leftSection}>
            {isPlaying ? (
              <View style={styles.playingIndicator}>
                <View style={[styles.bar, styles.bar1]} />
                <View style={[styles.bar, styles.bar2]} />
                <View style={[styles.bar, styles.bar3]} />
              </View>
            ) : (
              <Foundation name="play" size={20} color="rgba(255, 255, 255, 0.6)" />
            )}
          </View>

          {/* Middle section - Song info */}
          <View style={styles.middleSection}>
            <Text style={styles.title} numberOfLines={1}>
              {song.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.artist} numberOfLines={1}>
                {song.artist}
              </Text>
              {song.album && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.album} numberOfLines={1}>
                    {song.album}
                  </Text>
                </>
              )}
            </View>
            <View style={styles.tagsRow}>
              {song.isEmbedded && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Intégré</Text>
                </View>
              )}
              {song.isSharedWithPartner && (
                <View style={[styles.tag, styles.sharedTag]}>
                  <Foundation name="heart" size={10} color="#FFFFFF" />
                  <Text style={styles.tagText}>Partagé</Text>
                </View>
              )}
              {isOfflineAvailable && (
                <View style={[styles.tag, styles.offlineTag]}>
                  <Foundation name="check" size={10} color="#FFFFFF" />
                  <Text style={styles.tagText}>Hors ligne</Text>
                </View>
              )}
            </View>
          </View>

          {/* Right section - Duration and download */}
          <View style={styles.rightSection}>
            <Text style={styles.duration}>{formatDuration(song.duration)}</Text>

            {/* Download button (only for non-embedded songs) */}
            {!song.isEmbedded && (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownloadToggle}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <View style={styles.downloadingContainer}>
                    <ActivityIndicator size="small" color={theme.romantic?.primary || '#FF69B4'} />
                    <Text style={styles.progressText}>{Math.round(downloadProgress)}%</Text>
                  </View>
                ) : (
                  <Foundation
                    name={isOfflineAvailable ? 'check' : 'download'}
                    size={18}
                    color={isOfflineAvailable ? '#22C55E' : 'rgba(255, 255, 255, 0.6)'}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </BlurView>

      {/* Animated border for playing song */}
      {isPlaying && (
        <View
          style={[
            styles.playingBorder,
            { borderColor: theme.romantic?.primary || '#FF69B4' },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gradientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  leftSection: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 20,
  },
  bar: {
    width: 3,
    backgroundColor: '#FF69B4',
    borderRadius: 2,
  },
  bar1: {
    height: 12,
    animation: 'pulse 0.6s infinite',
  },
  bar2: {
    height: 18,
    animation: 'pulse 0.6s infinite 0.2s',
  },
  bar3: {
    height: 10,
    animation: 'pulse 0.6s infinite 0.4s',
  },
  middleSection: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  separator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  album: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  sharedTag: {
    backgroundColor: 'rgba(255, 105, 180, 0.3)',
  },
  offlineTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  duration: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  downloadButton: {
    padding: 6,
  },
  downloadingContainer: {
    alignItems: 'center',
    gap: 2,
  },
  progressText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FF69B4',
  },
  playingBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
    pointerEvents: 'none',
  },
});

export default SongItemWithOffline;
