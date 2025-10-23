export interface MediaItem {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  fileName: string;
  fileSize: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // For videos in seconds
  createdAt: Date;
  updatedAt: Date;

  // Author info
  authorId: string;
  authorName: string;

  // Metadata
  title?: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  tags: string[];

  // Sharing
  isSharedWithPartner: boolean;
  visibility: 'private' | 'shared';

  // Organization
  albumId?: string;
  isFavorite: boolean;
  isArchived: boolean;

  // Interaction
  reactions: MediaReaction[];
  comments: MediaComment[];

  // System
  cloudStorageUrl?: string;
  thumbnailUrl?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

export interface MediaReaction {
  id: string;
  userId: string;
  userName: string;
  emoji: '❤️' | '😍' | '🥰' | '😊' | '🔥' | '👏' | '💕' | '✨';
  createdAt: Date;
}

export interface MediaComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Album {
  id: string;
  title: string;
  description?: string;
  coverImageId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Author info
  authorId: string;
  authorName: string;

  // Sharing
  isSharedWithPartner: boolean;
  visibility: 'private' | 'shared';

  // Organization
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;

  // Stats
  mediaCount: number;
  totalSize: number;

  // Settings
  autoAddLocation?: boolean;
  autoAddDate?: boolean;
}

export interface GalleryFilter {
  type?: 'photo' | 'video' | 'all';
  albumId?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  isSharedWithPartner?: boolean;
  searchQuery?: string;
}

export interface GallerySortOption {
  field: 'createdAt' | 'updatedAt' | 'title' | 'fileSize' | 'isFavorite';
  direction: 'asc' | 'desc';
}

export interface GalleryViewMode {
  layout: 'grid' | 'list' | 'timeline' | 'map';
  gridSize: 'small' | 'medium' | 'large';
  showDetails: boolean;
  showLocation: boolean;
  groupBy?: 'date' | 'album' | 'location' | 'none';
}

export interface MemoryTimeline {
  id: string;
  title: string;
  description?: string;
  date: Date;
  mediaItems: string[]; // MediaItem IDs
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  tags: string[];
  isSharedWithPartner: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  authorName: string;
}

export interface GalleryStats {
  totalMedia: number;
  totalPhotos: number;
  totalVideos: number;
  totalSize: number;
  sharedMedia: number;
  favoriteMedia: number;
  albumsCount: number;
  memoriesCount: number;
  thisMonthUploads: number;
  storageUsed: number;
  storageLimit: number;
}

// Upload types
export interface MediaUpload {
  id: string;
  localUri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: 'photo' | 'video';
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  metadata?: {
    title?: string;
    description?: string;
    albumId?: string;
    tags?: string[];
    isSharedWithPartner?: boolean;
  };
}

// Permissions
export interface MediaPermissions {
  camera: boolean;
  photoLibrary: boolean;
  location: boolean;
  storage: boolean;
}

export type MediaSource = 'camera' | 'library' | 'files';

export interface CameraOptions {
  mediaType: 'photo' | 'video' | 'mixed';
  quality: 'low' | 'medium' | 'high';
  includeBase64?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  maxDuration?: number; // For videos
}