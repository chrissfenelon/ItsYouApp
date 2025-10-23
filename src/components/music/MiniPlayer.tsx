import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { BlurView } from '@react-native-community/blur';
import { useMusic } from '../../context/MusicCon';
import VinylDisc from './VinylDisc';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MiniPlayerProps {
  onPress: () => void;
  theme: any;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress, theme }) => {
  const { playerState, vinylDisc, togglePlayPause, skipToNext, skipToPrevious } = useMusic();

  if (!playerState.currentSong) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = playerState.duration > 0
    ? (playerState.position / playerState.duration) * 100
    : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={styles.container}
    >
      <BlurView
        style={styles.blur}
        blurType="dark"
        blurAmount={20}
        reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.9)"
      />

      <View style={styles.content}>
        {/* Mini vinyl disc */}
        <View style={styles.vinylContainer}>
          <VinylDisc
            size={50}
            isPlaying={playerState.isPlaying}
            vinylDisc={vinylDisc}
            albumArt={playerState.currentSong.thumbnailUrl}
          />
        </View>

        {/* Song info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {playerState.currentSong.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {playerState.currentSong.artist}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              skipToPrevious();
            }}
            style={styles.controlButton}
          >
            <Foundation name="previous" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            style={[styles.controlButton, styles.playButton]}
          >
            <Foundation
              name={playerState.isPlaying ? 'pause' : 'play'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              skipToNext();
            }}
            style={styles.controlButton}
          >
            <Foundation name="next" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progress}%`,
              backgroundColor: theme.romantic?.primary || '#FF69B4',
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60, // Above bottom navigation
    left: 0,
    right: 0,
    height: 70,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  vinylContainer: {
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  artist: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    backgroundColor: 'rgba(255, 105, 180, 0.3)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.6)',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressBar: {
    height: '100%',
  },
});

export default MiniPlayer;
