import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { BlurView } from '@react-native-community/blur';
import Slider from '@react-native-community/slider';
import { useMusic } from '../../context/MusicCon';
import VinylDisc from './VinylDisc';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NowPlayingScreenProps {
  visible: boolean;
  onClose: () => void;
  onOpenCustomization: () => void;
  theme: any;
}

const NowPlayingScreen: React.FC<NowPlayingScreenProps> = ({
  visible,
  onClose,
  onOpenCustomization,
  theme,
}) => {
  const {
    playerState,
    vinylDisc,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    setRepeatMode,
    toggleShuffle,
    setVolume,
  } = useMusic();

  const [showLyrics, setShowLyrics] = useState(false);

  if (!playerState.currentSong) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRepeatToggle = () => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(playerState.repeat);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const getRepeatIcon = () => {
    switch (playerState.repeat) {
      case 'one':
        return 'loop';
      case 'all':
        return 'refresh';
      default:
        return 'refresh';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Background */}
        <BlurView
          style={styles.background}
          blurType="dark"
          blurAmount={50}
          reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.95)"
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Foundation name="x" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>En lecture</Text>
            <TouchableOpacity style={styles.moreButton}>
              <Foundation name="list" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Vinyl Disc */}
          <View style={styles.vinylSection}>
            <VinylDisc
              size={SCREEN_WIDTH * 0.8}
              isPlaying={playerState.isPlaying}
              vinylDisc={vinylDisc}
              albumArt={playerState.currentSong.thumbnailUrl}
              onLongPress={onOpenCustomization}
            />
          </View>

          {/* Song Info */}
          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={2}>
              {playerState.currentSong.title}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {playerState.currentSong.artist}
            </Text>
            {playerState.currentSong.album && (
              <Text style={styles.songAlbum} numberOfLines={1}>
                {playerState.currentSong.album}
              </Text>
            )}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={playerState.duration}
              value={playerState.position}
              onSlidingComplete={seekTo}
              minimumTrackTintColor={theme.romantic?.primary || '#FF69B4'}
              maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
              thumbTintColor={theme.romantic?.primary || '#FF69B4'}
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>
                {formatTime(playerState.position)}
              </Text>
              <Text style={styles.timeText}>
                {formatTime(playerState.duration)}
              </Text>
            </View>
          </View>

          {/* Main Controls */}
          <View style={styles.mainControls}>
            <TouchableOpacity
              onPress={skipToPrevious}
              style={styles.mainControlButton}
            >
              <Foundation name="previous" size={36} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPause}
              style={styles.playPauseButton}
            >
              <Foundation
                name={playerState.isPlaying ? 'pause' : 'play'}
                size={42}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={skipToNext}
              style={styles.mainControlButton}
            >
              <Foundation name="next" size={36} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Secondary Controls */}
          <View style={styles.secondaryControls}>
            <TouchableOpacity
              onPress={toggleShuffle}
              style={styles.secondaryButton}
            >
              <Foundation
                name="shuffle"
                size={22}
                color={playerState.shuffle ? theme.romantic?.primary || '#FF69B4' : 'rgba(255, 255, 255, 0.6)'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRepeatToggle}
              style={styles.secondaryButton}
            >
              <Foundation
                name={getRepeatIcon()}
                size={22}
                color={playerState.repeat !== 'off' ? theme.romantic?.primary || '#FF69B4' : 'rgba(255, 255, 255, 0.6)'}
              />
            </TouchableOpacity>

            {playerState.currentSong.lyrics && (
              <TouchableOpacity
                onPress={() => setShowLyrics(!showLyrics)}
                style={styles.secondaryButton}
              >
                <Foundation
                  name="text-color"
                  size={22}
                  color={showLyrics ? theme.romantic?.primary || '#FF69B4' : 'rgba(255, 255, 255, 0.6)'}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Lyrics Section */}
          {showLyrics && playerState.currentSong.lyrics && (
            <View style={styles.lyricsSection}>
              <Text style={styles.lyricsTitle}>Paroles</Text>
              <Text style={styles.lyricsText}>
                {playerState.currentSong.lyrics}
              </Text>
            </View>
          )}

          {/* Queue Preview */}
          {playerState.queue.length > 1 && (
            <View style={styles.queueSection}>
              <Text style={styles.queueTitle}>
                À suivre: {playerState.queue[playerState.currentIndex + 1]?.title || 'Fin de la file'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  moreButton: {
    padding: 8,
  },
  vinylSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  songInfo: {
    paddingHorizontal: 32,
    marginBottom: 32,
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  songArtist: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: 4,
  },
  songAlbum: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 32,
  },
  mainControlButton: {
    padding: 12,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  secondaryButton: {
    padding: 12,
  },
  lyricsSection: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: 'rgba(40, 40, 50, 0.6)',
    borderRadius: 16,
    marginHorizontal: 20,
  },
  lyricsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  lyricsText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  queueSection: {
    marginTop: 16,
    paddingHorizontal: 32,
  },
  queueTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default NowPlayingScreen;
