import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import VideoProgressBar from './VideoProgressBar';

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  playbackRate: number;
  volume: number;
  showControls: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onChangePlaybackRate: () => void;
  onChangeVolume: (volume: number) => void;
  onClose: () => void;
  onToggleFullscreen?: () => void;
  theme: any;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  isBuffering,
  playbackRate,
  volume,
  showControls,
  onPlayPause,
  onSeek,
  onChangePlaybackRate,
  onChangeVolume,
  onClose,
  onToggleFullscreen,
  theme,
}) => {
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: showControls ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showControls]);

  const playbackRates = [0.5, 1, 1.5, 2];
  const currentRateIndex = playbackRates.indexOf(playbackRate);

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents={showControls ? 'auto' : 'none'}>
      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Foundation name="x" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.topRight}>
          {onToggleFullscreen && (
            <TouchableOpacity style={styles.iconButton} onPress={onToggleFullscreen}>
              <Foundation name="arrows-expand" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Center Play/Pause Button */}
      <View style={styles.centerControls}>
        {isBuffering ? (
          <View style={styles.bufferingContainer}>
            <Text style={styles.bufferingText}>Chargement...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.playPauseButton,
              { backgroundColor: theme.romantic.primary + '99' },
            ]}
            onPress={onPlayPause}
          >
            <Foundation
              name={isPlaying ? 'pause' : 'play'}
              size={40}
              color="#FFFFFF"
              style={!isPlaying && styles.playIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Progress Bar */}
        <VideoProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          theme={theme}
        />

        {/* Control Buttons */}
        <View style={styles.controlButtons}>
          {/* Playback Speed */}
          <TouchableOpacity
            style={styles.speedButton}
            onPress={onChangePlaybackRate}
          >
            <Text style={styles.speedText}>{playbackRate}x</Text>
          </TouchableOpacity>

          {/* Volume Control */}
          <View style={styles.volumeContainer}>
            <Foundation
              name={volume > 0 ? 'volume' : 'volume-none'}
              size={22}
              color="#FFFFFF"
            />
            <TouchableOpacity
              style={styles.volumeBar}
              onPress={() => onChangeVolume(volume > 0 ? 0 : 1)}
            >
              <View style={styles.volumeBarBackground}>
                <View
                  style={[
                    styles.volumeBarFill,
                    {
                      width: `${volume * 100}%`,
                      backgroundColor: theme.romantic.primary,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 10,
  },
  topRight: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 10,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playIcon: {
    marginLeft: 5, // Center the play icon
  },
  bufferingContainer: {
    padding: 20,
  },
  bufferingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomControls: {
    paddingBottom: 30,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  speedButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  volumeBar: {
    width: 80,
    height: 30,
    justifyContent: 'center',
  },
  volumeBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  volumeBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default VideoControls;
