import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import Orientation from 'react-native-orientation-locker';
import { useApp } from '../../context/AppContext';
import { MediaItem } from '../../types/gallery';
import MediaCommentsPanel from '../../components/common/MediaCommentsPanel';
import MediaCommentsService from '../../services/MediaCommentsService';

const { width: initialWidth, height: initialHeight } = Dimensions.get('window');

interface MediaViewerScreenProps {
  visible: boolean;
  mediaList: MediaItem[];
  initialIndex: number;
  onClose: () => void;
  onShare?: (mediaId: string) => void;
  onFavorite?: (mediaId: string) => void;
  onDelete?: (mediaId: string) => void;
}

const MediaViewerScreen: React.FC<MediaViewerScreenProps> = ({
  visible,
  mediaList,
  initialIndex,
  onClose,
  onShare,
  onFavorite,
  onDelete,
}) => {
  const { currentTheme } = useApp();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentCounts, setCommentCounts] = useState<{[key: string]: number}>({});
  const flatListRef = useRef<FlatList>(null);
  const commentsHeight = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);

  // Video state
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoBuffering, setVideoBuffering] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // Fullscreen and orientation state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });

  const styles = createStyles(currentTheme, isFullscreen, dimensions);
  const currentMedia = mediaList[currentIndex];

  useEffect(() => {
    // Load comment counts for all media items
    const loadCommentCounts = async () => {
      try {
        const counts: {[key: string]: number} = {};

        // Parallelize requests for better performance
        const promises = mediaList.map(async (item) => {
          try {
            const count = await MediaCommentsService.getCommentCount(
              item.id,
              item.type === 'video' ? 'video' : 'photo'
            );
            if (count > 0) {
              counts[item.id] = count;
            }
          } catch (error) {
            console.error(`Error loading comment count for ${item.id}:`, error);
            // Continue loading other counts even if one fails
          }
        });

        await Promise.all(promises);
        setCommentCounts(counts);
      } catch (error) {
        console.error('Error loading comment counts:', error);
      }
    };

    if (visible) {
      loadCommentCounts();
    }
  }, [visible, mediaList]);

  useEffect(() => {
    Animated.timing(commentsHeight, {
      toValue: showComments ? dimensions.height * 0.7 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showComments, dimensions]);

  // Handle orientation changes
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => {
      dimensionsHandler?.remove();
    };
  }, []);

  // Lock/unlock orientation based on fullscreen state
  useEffect(() => {
    if (visible && currentMedia?.type === 'video') {
      if (isFullscreen) {
        // Allow all orientations in fullscreen
        Orientation.unlockAllOrientations();
      } else {
        // Lock to portrait when not fullscreen
        Orientation.lockToPortrait();
      }
    }

    return () => {
      // Reset to portrait when component unmounts
      Orientation.lockToPortrait();
    };
  }, [visible, isFullscreen, currentMedia]);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / dimensions.width);
    setCurrentIndex(index);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < mediaList.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  // Video control functions
  const startControlsTimer = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!videoPaused) {
        setShowVideoControls(false);
      }
    }, 5000);
  };

  const handleVideoPress = () => {
    setShowVideoControls(!showVideoControls);
    if (!showVideoControls) {
      startControlsTimer();
    }
  };

  const handlePlayPause = () => {
    setVideoPaused(!videoPaused);
    setShowVideoControls(true);
    startControlsTimer();
  };

  const handleSkipForward = () => {
    const newTime = Math.min(videoProgress + 10, videoDuration);
    videoRef.current?.seek(newTime);
    setVideoProgress(newTime);
    setShowVideoControls(true);
    startControlsTimer();
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(videoProgress - 10, 0);
    videoRef.current?.seek(newTime);
    setVideoProgress(newTime);
    setShowVideoControls(true);
    startControlsTimer();
  };

  const handleVideoLoad = (data: any) => {
    setVideoDuration(data.duration);
    setVideoBuffering(false);
  };

  const handleVideoProgress = (data: any) => {
    setVideoProgress(data.currentTime);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setShowVideoControls(true);
    startControlsTimer();
  };

  const handleVideoSeek = (value: number) => {
    videoRef.current?.seek(value);
    setVideoProgress(value);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setShowVideoControls(true);
    startControlsTimer();
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    setIsMuted(value === 0);
  };

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
    setShowVideoControls(true);
    startControlsTimer();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Pause video when switching media
  useEffect(() => {
    if (currentMedia?.type !== 'video') {
      setVideoPaused(true);
    } else {
      setVideoPaused(false);
      setShowVideoControls(true);
      startControlsTimer();
    }
  }, [currentIndex]);

  // Animate controls visibility
  useEffect(() => {
    Animated.timing(controlsOpacity, {
      toValue: showVideoControls ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showVideoControls]);

  // Cleanup controls timer
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const renderMediaItem = ({ item, index }: { item: MediaItem; index: number }) => (
    <View style={styles.mediaContainer}>
      {item.type === 'video' ? (
        <View style={styles.videoWrapper}>
          {/* Video Player */}
          <Video
            ref={index === currentIndex ? videoRef : null}
            source={{ uri: item.uri }}
            style={styles.video}
            paused={index !== currentIndex || videoPaused}
            resizeMode="contain"
            volume={isMuted ? 0 : volume}
            rate={playbackRate}
            onLoad={handleVideoLoad}
            onProgress={handleVideoProgress}
            onBuffer={({ isBuffering }) => setVideoBuffering(isBuffering)}
            progressUpdateInterval={500}
            playInBackground={false}
            playWhenInactive={false}
          />

          {/* Tap Area for Controls */}
          <TouchableWithoutFeedback onPress={handleVideoPress}>
            <View style={styles.tapArea} />
          </TouchableWithoutFeedback>

          {/* Buffering Indicator */}
          {videoBuffering && index === currentIndex && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={currentTheme.romantic.primary} />
            </View>
          )}

          {/* Video Controls */}
          {index === currentIndex && (
            <Animated.View
              style={[styles.videoControlsContainer, { opacity: controlsOpacity }]}
              pointerEvents={showVideoControls ? "box-none" : "none"}
            >
              {/* Top Bar */}
              <View style={styles.videoTopBar}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Foundation name="x" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.videoTitle} numberOfLines={1}>{item.title || 'Video'}</Text>
                <TouchableOpacity
                  onPress={() => setShowSpeedMenu(!showSpeedMenu)}
                  style={styles.speedButton}
                >
                  <Text style={styles.speedButtonText}>{playbackRate}x</Text>
                </TouchableOpacity>
              </View>

              {/* Speed Menu */}
              {showSpeedMenu && (
                <View style={styles.speedMenu}>
                  <Text style={styles.speedMenuTitle}>Playback Speed</Text>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                    <TouchableOpacity
                      key={speed}
                      style={[
                        styles.speedMenuItem,
                        playbackRate === speed && styles.speedMenuItemActive,
                      ]}
                      onPress={() => changePlaybackSpeed(speed)}
                    >
                      <Text style={styles.speedMenuItemText}>
                        {speed === 1 ? 'Normal' : `${speed}x`}
                      </Text>
                      {playbackRate === speed && (
                        <Foundation name="check" size={18} color={currentTheme.romantic.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Center Controls */}
              <View style={styles.centerControls} pointerEvents="box-none">
                <View style={styles.centerButtonsRow}>
                  <TouchableOpacity
                    onPress={handleSkipBackward}
                    style={styles.skipButton}
                  >
                    <Foundation name="rewind-ten" size={36} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handlePlayPause}
                    style={[styles.playButton, { backgroundColor: currentTheme.romantic.primary }]}
                  >
                    <Foundation
                      name={videoPaused ? 'play' : 'pause'}
                      size={40}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSkipForward}
                    style={styles.skipButton}
                  >
                    <Foundation name="fast-forward" size={36} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Controls */}
              <View style={styles.videoBottomBar}>
                {/* Progress Slider */}
                <View style={styles.sliderContainer}>
                  <Text style={styles.timeText}>{formatTime(videoProgress)}</Text>
                  <Slider
                    style={styles.slider}
                    value={videoProgress}
                    minimumValue={0}
                    maximumValue={videoDuration}
                    minimumTrackTintColor={currentTheme.romantic.primary}
                    maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                    thumbTintColor={currentTheme.romantic.primary}
                    onValueChange={handleVideoSeek}
                    onSlidingStart={() => {
                      if (controlsTimeoutRef.current) {
                        clearTimeout(controlsTimeoutRef.current);
                      }
                    }}
                    onSlidingComplete={() => startControlsTimer()}
                  />
                  <Text style={styles.timeText}>{formatTime(videoDuration)}</Text>
                </View>

                {/* Control Buttons Row */}
                <View style={styles.videoButtonsRow}>
                  <View style={styles.leftControls}>
                    <TouchableOpacity onPress={handlePlayPause} style={styles.smallControlButton}>
                      <Foundation
                        name={videoPaused ? 'play' : 'pause'}
                        size={24}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.rightControls}>
                    <TouchableOpacity onPress={toggleMute} style={styles.smallControlButton}>
                      <Foundation
                        name={isMuted ? 'volume-none' : 'volume'}
                        size={24}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                    {!isMuted && (
                      <Slider
                        style={styles.volumeSlider}
                        value={volume}
                        minimumValue={0}
                        maximumValue={1}
                        minimumTrackTintColor={currentTheme.romantic.primary}
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor={currentTheme.romantic.primary}
                        onValueChange={handleVolumeChange}
                      />
                    )}
                    <TouchableOpacity onPress={toggleFullscreen} style={styles.smallControlButton}>
                      <Foundation
                        name={isFullscreen ? 'arrows-compress' : 'arrows-expand'}
                        size={24}
                        color={currentTheme.romantic.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleControls}
          style={styles.mediaTouchable}
        >
          {imageLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.romantic.primary} />
            </View>
          )}
          <Image
            source={{ uri: item.uri }}
            style={styles.mediaImage}
            resizeMode="contain"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Header - Only show for images */}
        {showControls && currentMedia?.type !== 'video' && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Foundation name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                {currentMedia?.title || 'Sans titre'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {currentIndex + 1} / {mediaList.length}
              </Text>
            </View>

            <View style={styles.headerRight}>
              {currentMedia?.isSharedWithPartner && (
                <View style={styles.cloudBadge}>
                  <Foundation name="cloud" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Media List */}
        <FlatList
          ref={flatListRef}
          data={mediaList}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(data, index) => ({
            length: dimensions.width,
            offset: dimensions.width * index,
            index,
          })}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />

        {/* Navigation Arrows - Only for images */}
        {showControls && currentMedia?.type !== 'video' && mediaList.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={handlePrevious}
              >
                <Foundation name="arrow-left" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {currentIndex < mediaList.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={handleNext}
              >
                <Foundation name="arrow-right" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Bottom Controls - For both images and videos */}
        {showControls && !showComments && (
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => onFavorite?.(currentMedia.id)}
            >
              <Foundation
                name="heart"
                size={24}
                color={currentMedia?.isFavorite ? currentTheme.romantic.primary : '#FFFFFF'}
              />
            </TouchableOpacity>

            {currentMedia?.isSharedWithPartner && (
              <TouchableOpacity
                style={[styles.controlButton, showComments && styles.controlButtonActive]}
                onPress={() => setShowComments(!showComments)}
              >
                <Foundation name="comments" size={24} color="#FFFFFF" />
                {commentCounts[currentMedia.id] > 0 && (
                  <View style={styles.commentBadge}>
                    <Text style={styles.commentBadgeText}>
                      {commentCounts[currentMedia.id]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {!currentMedia?.isSharedWithPartner && onShare && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => onShare(currentMedia.id)}
              >
                <Foundation name="share" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => onDelete?.(currentMedia.id)}
            >
              <Foundation name="trash" size={24} color="#FF453A" />
            </TouchableOpacity>
          </View>
        )}

        {/* Media Info */}
        {showControls && currentMedia?.description && !showComments && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>{currentMedia.description}</Text>
            {currentMedia.createdAt && (
              <Text style={styles.infoDate}>
                {currentMedia.createdAt.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            )}
          </View>
        )}

        {/* Comments Panel */}
        <Animated.View
          style={[
            styles.commentsPanel,
            {
              height: commentsHeight,
            },
          ]}
        >
          {showComments && currentMedia && (
            <MediaCommentsPanel
              mediaId={currentMedia.id}
              mediaType={currentMedia.type === 'video' ? 'video' : 'photo'}
              isShared={currentMedia.isSharedWithPartner || false}
              onClose={() => setShowComments(false)}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any, isFullscreen: boolean = false, dimensions: { width: number; height: number } = { width: initialWidth, height: initialHeight }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  headerRight: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cloudBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    width: dimensions.width,
    height: dimensions.height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  tapArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 3,
  },
  videoControlsContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    zIndex: 4,
  },
  videoTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  closeButton: {
    padding: 8,
  },
  videoTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  speedMenu: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(28, 28, 28, 0.95)',
    borderRadius: 12,
    padding: 8,
    minWidth: 160,
    zIndex: 100,
  },
  speedMenuTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  speedMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  speedMenuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedMenuItemText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  skipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  videoBottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    minWidth: 45,
    textAlign: 'center',
  },
  videoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallControlButton: {
    padding: 8,
  },
  volumeSlider: {
    width: 80,
    height: 30,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navButtonLeft: {
    left: 20,
  },
  navButtonRight: {
    right: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 20,
    zIndex: 10,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: theme.romantic.primary,
  },
  commentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#000000',
  },
  commentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    zIndex: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 8,
  },
  infoDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  commentsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 15,
  },
});

export default MediaViewerScreen;