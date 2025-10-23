import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Text,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import Foundation from 'react-native-vector-icons/Foundation';
import Orientation from 'react-native-orientation-locker';
import { Video as VideoType } from '../../types/video.types';
import VideoService from '../../services/VideoService';
import { useApp } from '../../context/AppContext';
import MediaCommentsPanel from '../common/MediaCommentsPanel';

const { width, height } = Dimensions.get('window');

interface YouTubeStylePlayerProps {
  visible: boolean;
  video: VideoType | null;
  onClose: () => void;
  initialPosition?: number;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

const YouTubeStylePlayer: React.FC<YouTubeStylePlayerProps> = ({
  visible,
  video,
  onClose,
  initialPosition = 0,
}) => {
  const { currentTheme } = useApp();
  const videoRef = useRef<Video>(null);

  // Video state
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');

  // Animations
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const seekIndicatorOpacity = useRef(new Animated.Value(0)).current;
  const commentsHeight = useRef(new Animated.Value(0)).current;
  const actionsHeight = useRef(new Animated.Value(0)).current;

  // Timer for hiding controls
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && video) {
      Orientation.unlockAllOrientations();
      VideoService.trackView(video.id);

      // Listen for orientation changes
      const orientationListener = Orientation.addOrientationListener((ori) => {
        if (ori === 'LANDSCAPE-LEFT' || ori === 'LANDSCAPE-RIGHT') {
          setOrientation('LANDSCAPE');
          setIsFullscreen(true);
        } else if (ori === 'PORTRAIT') {
          setOrientation('PORTRAIT');
          setIsFullscreen(false);
        }
      });

      // Get initial orientation
      Orientation.getOrientation((ori) => {
        if (ori === 'LANDSCAPE-LEFT' || ori === 'LANDSCAPE-RIGHT') {
          setOrientation('LANDSCAPE');
          setIsFullscreen(true);
        } else {
          setOrientation('PORTRAIT');
          setIsFullscreen(false);
        }
      });

      return () => {
        if (currentTime > 0 && video) {
          VideoService.savePosition(video.id, currentTime);
        }
        Orientation.removeOrientationListener(orientationListener);
        Orientation.lockToPortrait();
      };
    }
  }, [visible, video]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && !paused) {
      resetControlsTimer();
    }

    Animated.timing(controlsOpacity, {
      toValue: showControls ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, [showControls, paused]);

  // Comments panel animation
  useEffect(() => {
    Animated.spring(commentsHeight, {
      toValue: showComments ? height * 0.7 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [showComments]);

  // Actions panel animation
  useEffect(() => {
    Animated.spring(actionsHeight, {
      toValue: showActions ? 300 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [showActions]);

  const resetControlsTimer = () => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
    controlsTimer.current = setTimeout(() => {
      if (!paused) {
        setShowControls(false);
      }
    }, 5000);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    if (!showControls) {
      resetControlsTimer();
    }
  };

  const togglePlayPause = () => {
    setPaused(!paused);
    setShowControls(true);
    resetControlsTimer();
  };

  const handleProgress = (data: any) => {
    setCurrentTime(data.currentTime);
  };

  const handleLoad = (data: any) => {
    setDuration(data.duration);
    if (initialPosition > 0) {
      videoRef.current?.seek(initialPosition);
    }
  };

  const handleSeek = (time: number) => {
    videoRef.current?.seek(time);
    setCurrentTime(time);
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      Orientation.lockToPortrait();
    } else {
      Orientation.lockToLandscape();
    }
  };

  // Double tap to seek (YouTube style)
  const handleDoubleTap = (side: 'left' | 'right') => {
    const seekAmount = side === 'left' ? -10 : 10;
    const newTime = Math.max(0, Math.min(duration, currentTime + seekAmount));

    setSeekTime(seekAmount);
    handleSeek(newTime);

    // Show seek indicator
    Animated.sequence([
      Animated.timing(seekIndicatorOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(seekIndicatorOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setSeekTime(null));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleClose = () => {
    if (currentTime > 0 && video) {
      VideoService.savePosition(video.id, currentTime);
    }
    onClose();
  };

  if (!video) return null;

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <StatusBar hidden />

        {/* Video Player */}
        <TouchableWithoutFeedback onPress={toggleControls}>
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: video.uri }}
              style={styles.video}
              paused={paused}
              onProgress={handleProgress}
              onLoad={handleLoad}
              onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
              resizeMode={isFullscreen ? "cover" : "contain"}
              rate={playbackRate}
              progressUpdateInterval={250}
            />

            {/* Buffering Indicator */}
            {buffering && (
              <View style={styles.bufferingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}

            {/* Double Tap Areas */}
            <View style={styles.doubleTapContainer}>
              <TouchableOpacity
                style={styles.doubleTapArea}
                activeOpacity={1}
                onPress={() => handleDoubleTap('left')}
              >
                {seekTime && seekTime < 0 && (
                  <Animated.View
                    style={[
                      styles.seekIndicator,
                      { opacity: seekIndicatorOpacity },
                    ]}
                  >
                    <Foundation name="rewind" size={40} color="#FFFFFF" />
                    <Text style={styles.seekText}>10s</Text>
                  </Animated.View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doubleTapArea}
                activeOpacity={1}
                onPress={() => handleDoubleTap('right')}
              >
                {seekTime && seekTime > 0 && (
                  <Animated.View
                    style={[
                      styles.seekIndicator,
                      { opacity: seekIndicatorOpacity },
                    ]}
                  >
                    <Foundation name="fast-forward" size={40} color="#FFFFFF" />
                    <Text style={styles.seekText}>10s</Text>
                  </Animated.View>
                )}
              </TouchableOpacity>
            </View>

            {/* Controls Overlay */}
            <Animated.View
              style={[styles.controlsOverlay, { opacity: controlsOpacity }]}
              pointerEvents={showControls ? 'auto' : 'none'}
            >
              {/* Top Bar */}
              <View style={styles.topBar}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleClose}
                >
                  <Foundation name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                  <Text style={styles.videoTitle} numberOfLines={1}>
                    {video.title || 'Video'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => setShowActions(!showActions)}
                >
                  <Foundation name="list" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Center Play/Pause */}
              <View style={styles.centerControls}>
                <TouchableOpacity
                  style={styles.playPauseButton}
                  onPress={togglePlayPause}
                >
                  <Foundation
                    name={paused ? 'play' : 'pause'}
                    size={50}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                  </View>
                </View>

                {/* Control Buttons */}
                <View style={styles.controlButtons}>
                  <View style={styles.leftControls}>
                    <TouchableOpacity onPress={togglePlayPause}>
                      <Foundation
                        name={paused ? 'play' : 'pause'}
                        size={24}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>

                    <Text style={styles.timeText}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </Text>
                  </View>

                  <View style={styles.rightControls}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => setShowComments(true)}
                    >
                      <Foundation name="comments" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => setShowSpeedMenu(!showSpeedMenu)}
                    >
                      <Text style={styles.speedText}>
                        {playbackRate === 1 ? '1x' : `${playbackRate}x`}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={toggleFullscreen}
                    >
                      <Foundation
                        name={isFullscreen ? "arrows-in" : "arrows-out"}
                        size={20}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>

        {/* Speed Menu */}
        {showSpeedMenu && (
          <View style={styles.speedMenu}>
            <Text style={styles.speedMenuTitle}>Vitesse de lecture</Text>
            {PLAYBACK_SPEEDS.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedOption,
                  playbackRate === speed && styles.speedOptionActive,
                ]}
                onPress={() => {
                  setPlaybackRate(speed);
                  setShowSpeedMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.speedOptionText,
                    playbackRate === speed && styles.speedOptionTextActive,
                  ]}
                >
                  {speed === 1 ? 'Normal' : `${speed}x`}
                </Text>
                {playbackRate === speed && (
                  <Foundation name="check" size={18} color={currentTheme.romantic.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions Bottom Sheet */}
        <Animated.View
          style={[
            styles.actionsSheet,
            { height: actionsHeight },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Actions</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={async () => {
              await VideoService.shareWithPartner(video.id);
              setShowActions(false);
            }}
          >
            <Foundation name="heart" size={24} color={currentTheme.romantic.primary} />
            <Text style={styles.actionItemText}>Partager avec mon partenaire</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={async () => {
              await VideoService.createWatchParty(video.id);
              setShowActions(false);
            }}
          >
            <Foundation name="torsos-all" size={24} color={currentTheme.romantic.primary} />
            <Text style={styles.actionItemText}>Regarder ensemble</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              setShowActions(false);
              setShowComments(true);
            }}
          >
            <Foundation name="comments" size={24} color={currentTheme.romantic.primary} />
            <Text style={styles.actionItemText}>Commentaires</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Comments Panel */}
        <Animated.View
          style={[
            styles.commentsPanel,
            { height: commentsHeight },
          ]}
        >
          {showComments && (
            <MediaCommentsPanel
              mediaId={video.id}
              mediaType="video"
              isShared={video.isSharedWithPartner}
              onClose={() => setShowComments(false)}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  doubleTapContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  doubleTapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 50,
  },
  seekText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF1744',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  timeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  controlButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Speed Menu
  speedMenu: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(28, 28, 28, 0.95)',
    borderRadius: 12,
    padding: 8,
    minWidth: 180,
  },
  speedMenuTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontWeight: '600',
  },
  speedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  speedOptionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedOptionText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  speedOptionTextActive: {
    fontWeight: '600',
  },
  // Actions Sheet
  actionsSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(28, 28, 28, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  actionItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  // Comments Panel
  commentsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
});

export default YouTubeStylePlayer;
