import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import Foundation from 'react-native-vector-icons/Foundation';
import { Song } from '../../types/music';

const { width } = Dimensions.get('window');

interface GlassmorphicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  repeat: 'off' | 'all' | 'one';
  shuffle: boolean;
  canSkipPrevious: boolean;
  canSkipNext: boolean;
  onPlayPause: () => void;
  onSkipPrevious: () => void;
  onSkipNext: () => void;
  onSeek: (value: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  theme: any;
}

const GlassmorphicPlayer: React.FC<GlassmorphicPlayerProps> = ({
  currentSong,
  isPlaying,
  position,
  duration,
  repeat,
  shuffle,
  canSkipPrevious,
  canSkipNext,
  onPlayPause,
  onSkipPrevious,
  onSkipNext,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  theme,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRepeatIcon = () => {
    if (repeat === 'one') return 'loop';
    return 'refresh';
  };

  return (
    <View style={styles.container}>
      {/* Glassmorphic Background */}
      <BlurView
        style={styles.blurContainer}
        blurType="dark"
        blurAmount={20}
        reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.7)"
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        >
          {/* Now Playing Info */}
          {currentSong && (
            <View style={styles.nowPlayingSection}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {currentSong.title}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {currentSong.artist}
              </Text>
            </View>
          )}

          {!currentSong && (
            <View style={styles.nowPlayingSection}>
              <Text style={styles.placeholderText}>
                Aucune chanson sélectionnée
              </Text>
            </View>
          )}

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration || 1}
                value={position}
                onSlidingComplete={onSeek}
                minimumTrackTintColor={theme.romantic?.primary || '#FF69B4'}
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#FFFFFF"
              />
              {/* Glow effect */}
              <View
                style={[
                  styles.progressGlow,
                  {
                    width: `${(position / (duration || 1)) * 100}%`,
                    shadowColor: theme.romantic?.primary || '#FF69B4',
                  },
                ]}
              />
            </View>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          {/* Main Controls */}
          <View style={styles.controlsSection}>
            <TouchableOpacity
              onPress={onSkipPrevious}
              style={[styles.controlButton, !canSkipPrevious && styles.disabledButton]}
              disabled={!canSkipPrevious}
            >
              <Foundation
                name="previous"
                size={32}
                color={canSkipPrevious ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)'}
              />
            </TouchableOpacity>

            {/* Play/Pause with Glassmorphic Circle */}
            <View style={styles.playButtonContainer}>
              <BlurView
                style={styles.playButtonBlur}
                blurType="light"
                blurAmount={10}
                reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.2)"
              >
                <TouchableOpacity
                  onPress={onPlayPause}
                  style={styles.playButton}
                  disabled={!currentSong}
                >
                  <LinearGradient
                    colors={[
                      theme.romantic?.primary || '#FF69B4',
                      theme.romantic?.secondary || '#FF1493',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.playGradient}
                  >
                    <Foundation
                      name={isPlaying ? 'pause' : 'play'}
                      size={40}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            </View>

            <TouchableOpacity
              onPress={onSkipNext}
              style={[styles.controlButton, !canSkipNext && styles.disabledButton]}
              disabled={!canSkipNext}
            >
              <Foundation
                name="next"
                size={32}
                color={canSkipNext ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)'}
              />
            </TouchableOpacity>
          </View>

          {/* Secondary Controls */}
          <View style={styles.secondaryControls}>
            <TouchableOpacity onPress={onToggleShuffle} style={styles.secondaryButton}>
              <Foundation
                name="shuffle"
                size={22}
                color={shuffle ? theme.romantic?.primary || '#FF69B4' : 'rgba(255, 255, 255, 0.5)'}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={onToggleRepeat} style={styles.secondaryButton}>
              <Foundation
                name={getRepeatIcon()}
                size={22}
                color={repeat !== 'off' ? theme.romantic?.primary || '#FF69B4' : 'rgba(255, 255, 255, 0.5)'}
              />
              {repeat === 'one' && (
                <View style={styles.repeatBadge}>
                  <Text style={styles.repeatBadgeText}>1</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </BlurView>

      {/* Border glow */}
      <View style={[styles.borderGlow, { borderColor: theme.romantic?.primary || '#FF69B4' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gradientOverlay: {
    padding: 24,
    paddingBottom: 28,
  },
  borderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    pointerEvents: 'none',
    opacity: 0.3,
  },
  nowPlayingSection: {
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 50,
    justifyContent: 'center',
  },
  songTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  artistName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    width: 40,
    textAlign: 'center',
  },
  sliderContainer: {
    flex: 1,
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  progressGlow: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
    bottom: 18,
    left: 0,
    pointerEvents: 'none',
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 32,
  },
  controlButton: {
    padding: 12,
  },
  disabledButton: {
    opacity: 0.3,
  },
  playButtonContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonBlur: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButton: {
    width: '100%',
    height: '100%',
  },
  playGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  secondaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 60,
  },
  secondaryButton: {
    padding: 8,
    position: 'relative',
  },
  repeatBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default GlassmorphicPlayer;
