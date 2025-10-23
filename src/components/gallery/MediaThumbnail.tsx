import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';

interface MediaThumbnailProps {
  uri: string;
  thumbnailUrl?: string;
  style?: any;
  isVideo?: boolean;
}

const MediaThumbnail: React.FC<MediaThumbnailProps> = ({
  uri,
  thumbnailUrl,
  style,
  isVideo = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  const imageUri = thumbnailUrl || uri;

  // If it's a video and has no thumbnail, show placeholder
  const shouldShowPlaceholder = isVideo && !thumbnailUrl;

  // Set a timeout for loading - if image doesn't load in 10 seconds, show error
  useEffect(() => {
    if (!imageUri) {
      setLoading(false);
      setError(true);
      return;
    }

    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('MediaThumbnail: Image load timeout for URI:', imageUri?.substring(0, 100));
        setLoadTimeout(true);
        setLoading(false);
        setError(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [imageUri, loading]);

  // Log loading attempts for debugging
  useEffect(() => {
    if (imageUri) {
      console.log('MediaThumbnail: Attempting to load image:', {
        uri: imageUri?.substring(0, 100),
        isFirebaseUrl: imageUri?.includes('firebasestorage.googleapis.com'),
      });
    }
  }, [imageUri]);

  // Show video placeholder if it's a video with no thumbnail
  if (shouldShowPlaceholder) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholderContainer}>
          <Foundation name="play-video" size={48} color="#FFFFFF" style={styles.placeholderIcon} />
          <Text style={styles.placeholderText}>Video</Text>
        </View>
      </View>
    );
  }

  if (!imageUri) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon} />
          <Text style={styles.errorText}>No URI</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}

      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="cover"
        onLoadStart={() => {
          setLoading(true);
          setError(false);
          setLoadTimeout(false);
        }}
        onLoad={() => {
          console.log('MediaThumbnail: Image loaded successfully');
          setLoading(false);
        }}
        onError={(e) => {
          console.error('MediaThumbnail: Image load error:', {
            error: e.nativeEvent.error,
            uri: imageUri?.substring(0, 100),
          });
          setLoading(false);
          setError(true);
        }}
      />

      {error && (
        <View style={styles.errorContainer}>
          {isVideo ? (
            <Foundation name="play-video" size={40} color="#666" style={styles.placeholderIcon} />
          ) : (
            <View style={styles.errorIcon} />
          )}
          {loadTimeout && (
            <Text style={styles.errorText}>Timeout</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
  },
  errorText: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  placeholderIcon: {
    opacity: 0.5,
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
});

export default MediaThumbnail;
