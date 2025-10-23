/**
 * Types for Video Gallery and Player
 */

export interface Video {
  id: string;
  uri: string;
  thumbnailUri?: string;
  title?: string;
  description?: string;
  duration: number; // in seconds
  uploadedBy: string;
  uploaderName: string;
  partnerId: string | null;
  partnerName: string | null;
  isSharedWithPartner: boolean;
  sharedWith?: string;
  size?: number; // File size in bytes
  width?: number;
  height?: number;
  createdAt: Date;
  updatedAt?: Date;
  views?: number;
  lastViewedAt?: Date;
  // Watch Party
  isWatchParty?: boolean;
  watchPartyId?: string;
  // Position de lecture sauvegardée
  savedPosition?: number;
}

export interface VideoMetadata {
  title?: string;
  description?: string;
  duration: number;
  width?: number;
  height?: number;
  size?: number;
  thumbnailUri?: string;
}

export interface VideoUploadProgress {
  videoId: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface WatchParty {
  id: string;
  videoId: string;
  hostId: string;
  hostName: string;
  guestId: string;
  guestName: string;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
  createdAt: Date;
  endedAt?: Date;
}

export interface VideoComment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number; // Position dans la vidéo (en secondes)
  createdAt: Date;
}

export interface VideoStats {
  videoId: string;
  views: number;
  totalWatchTime: number; // Total seconds watched
  averageCompletion: number; // Percentage 0-100
  lastViewedAt: Date;
}

export type VideoQuality = 'low' | 'medium' | 'high' | 'original';

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  quality: VideoQuality;
  error?: string;
}

// Helper to format duration
export const formatVideoDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Helper to format file size
export const formatVideoSize = (bytes: number): string => {
  if (!bytes) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

// Helper to get thumbnail from video URI
export const getVideoThumbnail = async (videoUri: string): Promise<string | null> => {
  // This would use a library like react-native-video-helper or ffmpeg
  // For now, return null and generate thumbnails on upload
  return null;
};
