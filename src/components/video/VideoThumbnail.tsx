import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import LinearGradient from 'react-native-linear-gradient';
import { Video, formatVideoDuration } from '../../types/video.types';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');
const THUMBNAIL_WIDTH = (width - 60) / 2; // 2 columns with padding

interface VideoThumbnailProps {
  video: Video;
  onPress: () => void;
  onLongPress?: () => void;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  video,
  onPress,
  onLongPress,
}) => {
  const { currentTheme, user } = useApp();

  const isOwner = video.uploadedBy === user?.id;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.9}
    >
      {/* Thumbnail Image */}
      <View style={styles.thumbnailContainer}>
        {video.thumbnailUri ? (
          <Image
            source={{ uri: video.thumbnailUri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
            <Foundation name="play-video" size={40} color="rgba(255, 255, 255, 0.5)" />
          </View>
        )}

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
          style={styles.gradient}
        >
          {/* Duration */}
          <View style={styles.durationContainer}>
            <Text style={styles.duration}>{formatVideoDuration(video.duration)}</Text>
          </View>
        </LinearGradient>

        {/* Play Icon Overlay */}
        <View style={styles.playIconContainer}>
          <View style={[styles.playIconBackground, { backgroundColor: currentTheme.romantic.primary }]}>
            <Foundation name="play" size={24} color="#FFFFFF" />
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          {video.isSharedWithPartner && (
            <View style={[styles.badge, styles.sharedBadge]}>
              <Foundation name="heart" size={12} color="#FF69B4" />
            </View>
          )}

          {!isOwner && (
            <View style={[styles.badge, styles.partnerBadge]}>
              <Foundation name="torso" size={12} color="#4ECDC4" />
            </View>
          )}
        </View>
      </View>

      {/* Video Info */}
      <View style={styles.infoContainer}>
        {video.title ? (
          <Text style={styles.title} numberOfLines={2}>
            {video.title}
          </Text>
        ) : (
          <Text style={styles.placeholderTitle}>Vidéo sans titre</Text>
        )}

        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>{video.uploaderName}</Text>
          {video.views !== undefined && video.views > 0 && (
            <>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.metaText}>{video.views} vue{video.views > 1 ? 's' : ''}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: THUMBNAIL_WIDTH,
    marginBottom: 20,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 8,
  },
  durationContainer: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  duration: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playIconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badges: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 6,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sharedBadge: {
    backgroundColor: 'rgba(255, 105, 180, 0.2)',
  },
  partnerBadge: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
  },
  infoContainer: {
    paddingTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 18,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  metaSeparator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 6,
  },
});

export default VideoThumbnail;
