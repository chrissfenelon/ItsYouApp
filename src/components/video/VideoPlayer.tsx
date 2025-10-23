import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import VideoControls from './VideoControls';

const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

interface VideoPlayerProps {
  source: { uri: string };
  onClose: () => void;
  theme: any;
  paused?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  onClose,
  theme,
  paused: externalPaused = false,
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(!externalPaused);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState(getScreenDimensions());

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Lock to portrait on mount, restore on unmount
  useEffect(() => {
    Orientation.lockToPortrait();

    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

  // Listen to orientation changes
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions(getScreenDimensions());
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Auto-hide controls after 3 seconds
  const resetHideControlsTimeout = () => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    setShowControls(true);

    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    resetHideControlsTimeout();
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [isPlaying]);

  // Handle external paused prop changes
  useEffect(() => {
    setIsPlaying(!externalPaused);
  }, [externalPaused]);

  const handleLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    setIsBuffering(false);
  };

  const handleProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    resetHideControlsTimeout();
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.seek(time);
      setCurrentTime(time);
    }
  };

  const handleChangePlaybackRate = () => {
    const rates = [0.5, 1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
    resetHideControlsTimeout();
  };

  const handleChangeVolume = (newVolume: number) => {
    setVolume(newVolume);
    resetHideControlsTimeout();
  };

  const handleToggleFullscreen = () => {
    if (isFullscreen) {
      // Exit fullscreen - go back to portrait
      Orientation.lockToPortrait();
      setIsFullscreen(false);
    } else {
      // Enter fullscreen - go to landscape
      Orientation.lockToLandscape();
      setIsFullscreen(true);
    }
    resetHideControlsTimeout();
  };

  const handleScreenPress = () => {
    if (showControls) {
      // Si les contrôles sont visibles, les cacher immédiatement
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
      setShowControls(false);
    } else {
      // Si les contrôles sont cachés, les montrer et démarrer le timer
      resetHideControlsTimeout();
    }
  };

  const handleBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
    setIsBuffering(isBuffering);
  };

  const handleEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleScreenPress}>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={source}
            style={[styles.video, { width: dimensions.width, height: dimensions.height }]}
            paused={!isPlaying}
            rate={playbackRate}
            volume={volume}
            resizeMode="contain"
            onLoad={handleLoad}
            onProgress={handleProgress}
            onBuffer={handleBuffer}
            onEnd={handleEnd}
            onError={(error) => {
              console.error('Video Error:', error);
              setIsBuffering(false);
            }}
          />

          {isBuffering && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.romantic.primary} />
            </View>
          )}

          <VideoControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            isBuffering={isBuffering}
            playbackRate={playbackRate}
            volume={volume}
            showControls={showControls}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onChangePlaybackRate={handleChangePlaybackRate}
            onChangeVolume={handleChangeVolume}
            onClose={onClose}
            onToggleFullscreen={handleToggleFullscreen}
            theme={theme}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    // Dimensions will be set dynamically
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default VideoPlayer;
