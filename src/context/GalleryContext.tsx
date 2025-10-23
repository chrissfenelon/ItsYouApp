import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  MediaItem,
  Album,
  MemoryTimeline,
  GalleryFilter,
  GallerySortOption,
  GalleryViewMode,
  GalleryStats,
  MediaUpload,
  MediaPermissions
} from '../types/gallery';
import GalleryService from '../services/GalleryService';
import LocalMediaStorage from '../services/LocalMediaStorage';
import CloudMediaStorage from '../services/CloudMediaStorage';
import { useApp } from './AppContext';

interface GalleryContextType {
  // Media data
  media: MediaItem[];
  sharedMedia: MediaItem[];
  albums: Album[];
  memories: MemoryTimeline[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;

  // Upload management
  uploads: MediaUpload[];
  isUploading: boolean;

  // View settings
  viewMode: GalleryViewMode;
  filter: GalleryFilter;
  sortOption: GallerySortOption;

  // Stats
  stats: GalleryStats | null;

  // Permissions
  permissions: MediaPermissions;

  // Actions - Media
  uploadMedia: (mediaData: {
    uri: string;
    type: 'image' | 'video';
    fileName: string;
    fileSize: number;
    width?: number;
    height?: number;
    duration?: number;
    title?: string;
    description?: string;
  }) => Promise<MediaItem>;
  updateMedia: (mediaId: string, updates: Partial<MediaItem>) => Promise<void>;
  deleteMedia: (mediaId: string) => Promise<void>;
  shareMediaWithPartner: (mediaId: string) => Promise<void>;
  unshareMedia: (mediaId: string) => Promise<void>;
  addReaction: (mediaId: string, emoji: string, isSharedMedia?: boolean) => Promise<void>;
  addComment: (mediaId: string, content: string, isSharedMedia?: boolean) => Promise<void>;

  // Actions - Albums
  createAlbum: (albumData: Omit<Album, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName' | 'mediaCount' | 'totalSize'>) => Promise<string>;
  updateAlbum: (albumId: string, updates: Partial<Album>) => Promise<void>;
  deleteAlbum: (albumId: string) => Promise<void>;
  addMediaToAlbum: (mediaId: string, albumId: string) => Promise<void>;
  removeMediaFromAlbum: (mediaId: string) => Promise<void>;

  // Actions - Memories
  createMemory: (memoryData: Omit<MemoryTimeline, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'>) => Promise<string>;
  updateMemory: (memoryId: string, updates: Partial<MemoryTimeline>) => Promise<void>;
  deleteMemory: (memoryId: string) => Promise<void>;

  // View controls
  setViewMode: (viewMode: GalleryViewMode) => void;
  setFilter: (filter: GalleryFilter) => void;
  setSortOption: (sort: GallerySortOption) => void;
  searchMedia: (query: string) => void;
  clearSearch: () => void;

  // Utility
  refreshGallery: () => Promise<void>;
  getFilteredMedia: () => MediaItem[];
  requestPermissions: () => Promise<MediaPermissions>;
  getCoupleId: () => string | null;
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

interface GalleryProviderProps {
  children: ReactNode;
}

export const GalleryProvider: React.FC<GalleryProviderProps> = ({ children }) => {
  const { user } = useApp();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [sharedMedia, setSharedMedia] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [memories, setMemories] = useState<MemoryTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Upload management
  const [uploads, setUploads] = useState<MediaUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // View settings
  const [viewMode, setViewModeState] = useState<GalleryViewMode>({
    layout: 'grid',
    gridSize: 'medium',
    showDetails: false,
    showLocation: false,
    groupBy: 'date',
  });

  const [filter, setFilterState] = useState<GalleryFilter>({
    type: 'all',
    isArchived: false,
  });

  const [sortOption, setSortOptionState] = useState<GallerySortOption>({
    field: 'createdAt',
    direction: 'desc',
  });

  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [permissions, setPermissions] = useState<MediaPermissions>({
    camera: false,
    photoLibrary: false,
    location: false,
    storage: false,
  });

  // Real-time listeners
  useEffect(() => {
    if (!user?.id) return;

    setIsLoading(true);

    // Load local media (private media stored on device)
    const loadLocalMedia = async () => {
      try {
        const localMediaList = await LocalMediaStorage.getAllMediaMetadata();
        const mediaArray = Object.values(localMediaList);
        setMedia(mediaArray);
        updateStats(mediaArray);
        setIsLoading(false);
        setHasError(false);
      } catch (error) {
        console.error('Error loading local media:', error);
        setHasError(true);
        setErrorMessage('Erreur lors du chargement des médias locaux');
        setIsLoading(false);
      }
    };

    loadLocalMedia();

    // Listen to albums
    const unsubscribeAlbums = GalleryService.getUserAlbums(user.id)
      .onSnapshot(
        (snapshot) => {
          const albumsData = snapshot.docs.map(doc =>
            GalleryService.convertFirebaseAlbum({ id: doc.id, ...doc.data() })
          );
          setAlbums(albumsData);
        },
        (error) => {
          console.error('Error listening to albums:', error);
        }
      );

    // Listen to memories
    const unsubscribeMemories = GalleryService.getUserMemories(user.id)
      .onSnapshot(
        (snapshot) => {
          const memoriesData = snapshot.docs.map(doc =>
            GalleryService.convertFirebaseMemory({ id: doc.id, ...doc.data() })
          );
          setMemories(memoriesData);
        },
        (error) => {
          console.error('Error listening to memories:', error);
        }
      );

    // Listen to shared media if user has a partner (from Firebase)
    let unsubscribeSharedMedia: (() => void) | undefined;
    if (user.partnerId) {
      console.log('GalleryContext: Setting up shared media listener for couple:', {
        userId: user.id,
        partnerId: user.partnerId,
      });

      unsubscribeSharedMedia = CloudMediaStorage.subscribeToSharedMedia(
        user.id,
        user.partnerId,
        (sharedMediaData) => {
          console.log('GalleryContext: Received shared media update:', sharedMediaData.length, 'items');
          setSharedMedia(sharedMediaData);
        },
        (error) => {
          // Silently ignore permission errors when user has no partner
          if (error.code !== 'permission-denied') {
            console.error('GalleryContext: Error listening to shared media:', error);
          } else {
            console.log('GalleryContext: Permission denied for shared media (expected if no data yet)');
          }
        }
      );
    } else {
      console.log('GalleryContext: No partner ID, skipping shared media listener');
    }

    return () => {
      unsubscribeAlbums();
      unsubscribeMemories();
      if (unsubscribeSharedMedia) {
        unsubscribeSharedMedia();
      }
    };
  }, [user?.id, user?.partnerId, filter]);

  // Media actions
  const uploadMedia = async (mediaData: {
    uri: string;
    type: 'image' | 'video';
    fileName: string;
    fileSize: number;
    width?: number;
    height?: number;
    duration?: number;
    title?: string;
    description?: string;
  }): Promise<MediaItem> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsUploading(true);

      console.log('GalleryContext: Starting upload with data:', {
        uri: mediaData.uri?.substring(0, 50) + '...',
        type: mediaData.type,
        fileName: mediaData.fileName,
        fileSize: mediaData.fileSize,
      });

      // Generate unique media ID
      const mediaId = `media_${user.id}_${Date.now()}`;

      console.log('GalleryContext: Generated media ID:', mediaId);

      // Create MediaItem object (stored locally by default)
      const mediaItem: MediaItem = {
        id: mediaId,
        uri: mediaData.uri, // Local URI
        type: mediaData.type === 'image' ? 'photo' : 'video',
        fileName: mediaData.fileName,
        fileSize: mediaData.fileSize || 0,
        mimeType: mediaData.type === 'image' ? 'image/jpeg' : 'video/mp4',
        dimensions: mediaData.width && mediaData.height ? {
          width: mediaData.width,
          height: mediaData.height,
        } : undefined,
        duration: mediaData.duration,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: user.id,
        authorName: user.name || 'Unknown',
        title: mediaData.title,
        description: mediaData.description,
        tags: [],
        isSharedWithPartner: false, // Initially NOT shared
        visibility: 'private',
        isFavorite: false,
        isArchived: false,
        reactions: [],
        comments: [],
        metadata: {
          fileName: mediaData.fileName,
          size: mediaData.fileSize || 0,
          width: mediaData.width,
          height: mediaData.height,
          duration: mediaData.duration,
        },
      };

      console.log('GalleryContext: Created media item object');

      // Save to local storage
      try {
        console.log('GalleryContext: Saving metadata...');
        await LocalMediaStorage.saveMediaMetadata(mediaItem);
        console.log('GalleryContext: Metadata saved successfully');
      } catch (metadataError) {
        console.error('GalleryContext: Failed to save metadata:', metadataError);
        throw new Error(`Failed to save metadata: ${metadataError instanceof Error ? metadataError.message : 'Unknown error'}`);
      }

      try {
        console.log('GalleryContext: Saving index...');
        await LocalMediaStorage.saveMediaIndex(mediaId, mediaData.uri, false);
        console.log('GalleryContext: Index saved successfully');
      } catch (indexError) {
        console.error('GalleryContext: Failed to save index:', indexError);
        // Try to clean up metadata
        try {
          await LocalMediaStorage.deleteMediaMetadata(mediaId);
        } catch (cleanupError) {
          console.error('GalleryContext: Failed to cleanup after index error:', cleanupError);
        }
        throw new Error(`Failed to save index: ${indexError instanceof Error ? indexError.message : 'Unknown error'}`);
      }

      console.log('GalleryContext: Storage saved successfully');

      // Update local state
      setMedia(prev => [mediaItem, ...prev]);

      console.log('GalleryContext: State updated, upload complete');

      setIsUploading(false);
      return mediaItem;
    } catch (error) {
      console.error('GalleryContext: Error uploading media:', error);
      if (error instanceof Error) {
        console.error('GalleryContext: Error message:', error.message);
        console.error('GalleryContext: Error stack:', error.stack);
      }
      setIsUploading(false);
      throw error;
    }
  };

  const updateMedia = async (mediaId: string, updates: Partial<MediaItem>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update in local storage
      await LocalMediaStorage.updateMediaMetadata(mediaId, updates);

      // If media is shared, also update in Firestore
      const isShared = await LocalMediaStorage.isShared(mediaId);
      if (isShared && user.partnerId) {
        await CloudMediaStorage.updateSharedMediaMetadata(mediaId, user.id, user.partnerId, updates);
      }

      // Update local state
      setMedia(prev => prev.map(m =>
        m.id === mediaId ? { ...m, ...updates, updatedAt: new Date() } : m
      ));

      if (isShared) {
        setSharedMedia(prev => prev.map(m =>
          m.id === mediaId ? { ...m, ...updates, updatedAt: new Date() } : m
        ));
      }
    } catch (error) {
      console.error('Error updating media:', error);
      throw error;
    }
  };

  const deleteMedia = async (mediaId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Check if media is shared
      const isShared = await LocalMediaStorage.isShared(mediaId);

      // If shared, delete from Firebase
      if (isShared && user.partnerId) {
        await CloudMediaStorage.deleteSharedMedia(mediaId, user.id, user.partnerId);
      }

      // Delete from local storage
      await LocalMediaStorage.deleteMediaMetadata(mediaId);

      // Update local state
      setMedia(prev => prev.filter(m => m.id !== mediaId));
      setSharedMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  };

  const shareMediaWithPartner = async (mediaId: string): Promise<void> => {
    if (!user?.partnerId) throw new Error('No partner to share with');

    try {
      // Get media from local storage
      const mediaItem = await LocalMediaStorage.getMediaMetadata(mediaId);
      if (!mediaItem) throw new Error('Media not found');

      // Get local URI
      const localUri = await LocalMediaStorage.getLocalUri(mediaId);
      if (!localUri) throw new Error('Local URI not found');

      // Upload to Firebase Storage
      const downloadUrl = await CloudMediaStorage.uploadMediaFile(
        localUri,
        user.id,
        mediaId,
        mediaItem.metadata?.fileName || `media_${mediaId}`
      );

      // Upload metadata to Firestore
      await CloudMediaStorage.uploadMediaMetadata(
        mediaItem,
        downloadUrl,
        user.id,
        user.partnerId
      );

      // Update local storage to mark as shared
      await LocalMediaStorage.markAsShared(mediaId, downloadUrl);
      await LocalMediaStorage.updateMediaMetadata(mediaId, {
        isSharedWithPartner: true,
      });

      // Update local state
      setMedia(prev => prev.map(m =>
        m.id === mediaId ? { ...m, isSharedWithPartner: true } : m
      ));
      setSharedMedia(prev => [{ ...mediaItem, isSharedWithPartner: true, uri: downloadUrl }, ...prev]);
    } catch (error) {
      console.error('Error sharing media:', error);
      throw error;
    }
  };

  const unshareMedia = async (mediaId: string): Promise<void> => {
    if (!user?.partnerId) throw new Error('No partner to unshare with');

    try {
      // Delete from Firebase Storage and Firestore
      await CloudMediaStorage.unshareMedia(mediaId, user.id, user.partnerId);

      // Update local storage to mark as not shared
      await LocalMediaStorage.markAsUnshared(mediaId);
      await LocalMediaStorage.updateMediaMetadata(mediaId, {
        isSharedWithPartner: false,
      });

      // Update local state
      setMedia(prev => prev.map(m =>
        m.id === mediaId ? { ...m, isSharedWithPartner: false } : m
      ));
      setSharedMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch (error) {
      console.error('Error unsharing media:', error);
      throw error;
    }
  };

  const addReaction = async (mediaId: string, emoji: string, isSharedMedia = false): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const coupleId = user.partnerId ? generateCoupleId(user.id, user.partnerId) : undefined;
      await GalleryService.addReaction(user.id, mediaId, emoji as any, isSharedMedia, coupleId);
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  };

  const addComment = async (mediaId: string, content: string, isSharedMedia = false): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const coupleId = user.partnerId ? generateCoupleId(user.id, user.partnerId) : undefined;
      await GalleryService.addComment(user.id, user.name, mediaId, content, isSharedMedia, coupleId);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  // Album actions
  const createAlbum = async (albumData: Omit<Album, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName' | 'mediaCount' | 'totalSize'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newAlbum: Omit<Album, 'id' | 'createdAt' | 'updatedAt'> = {
        ...albumData,
        authorId: user.id,
        authorName: user.name,
        mediaCount: 0,
        totalSize: 0,
      };

      return await GalleryService.createAlbum(user.id, newAlbum);
    } catch (error) {
      console.error('Error creating album:', error);
      throw error;
    }
  };

  const updateAlbum = async (albumId: string, updates: Partial<Album>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      await GalleryService.updateAlbum(user.id, albumId, updates);
    } catch (error) {
      console.error('Error updating album:', error);
      throw error;
    }
  };

  const deleteAlbum = async (albumId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Remove album from all media first
      const albumMedia = media.filter(m => m.albumId === albumId);
      await Promise.all(
        albumMedia.map(m => updateMedia(m.id, { albumId: undefined }))
      );

      // Delete album
      await GalleryService.updateAlbum(user.id, albumId, { isArchived: true });
    } catch (error) {
      console.error('Error deleting album:', error);
      throw error;
    }
  };

  const addMediaToAlbum = async (mediaId: string, albumId: string): Promise<void> => {
    await updateMedia(mediaId, { albumId });
  };

  const removeMediaFromAlbum = async (mediaId: string): Promise<void> => {
    await updateMedia(mediaId, { albumId: undefined });
  };

  // Memory actions
  const createMemory = async (memoryData: Omit<MemoryTimeline, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newMemory: Omit<MemoryTimeline, 'id' | 'createdAt' | 'updatedAt'> = {
        ...memoryData,
        authorId: user.id,
        authorName: user.name,
      };

      return await GalleryService.createMemory(user.id, newMemory);
    } catch (error) {
      console.error('Error creating memory:', error);
      throw error;
    }
  };

  const updateMemory = async (memoryId: string, updates: Partial<MemoryTimeline>): Promise<void> => {
    // Implementation would be similar to updateAlbum
    throw new Error('Not implemented');
  };

  const deleteMemory = async (memoryId: string): Promise<void> => {
    // Implementation would be similar to deleteAlbum
    throw new Error('Not implemented');
  };

  // View controls
  const setViewMode = (mode: GalleryViewMode) => {
    setViewModeState(mode);
  };

  const setFilter = (newFilter: GalleryFilter) => {
    setFilterState({ ...filter, ...newFilter });
  };

  const setSortOption = (sort: GallerySortOption) => {
    setSortOptionState(sort);
  };

  const searchMedia = (query: string) => {
    setFilter({ ...filter, searchQuery: query });
  };

  const clearSearch = () => {
    const { searchQuery, ...filterWithoutSearch } = filter;
    setFilter(filterWithoutSearch);
  };

  // Utility
  const refreshGallery = async (): Promise<void> => {
    // Real-time listeners handle refreshing automatically
    return Promise.resolve();
  };

  const getFilteredMedia = (): MediaItem[] => {
    let filteredMedia = [...media];

    // Apply filters
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filteredMedia = filteredMedia.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filter.type && filter.type !== 'all') {
      filteredMedia = filteredMedia.filter(item => item.type === filter.type);
    }

    if (filter.albumId) {
      filteredMedia = filteredMedia.filter(item => item.albumId === filter.albumId);
    }

    if (filter.isFavorite !== undefined) {
      filteredMedia = filteredMedia.filter(item => item.isFavorite === filter.isFavorite);
    }

    if (filter.isArchived !== undefined) {
      filteredMedia = filteredMedia.filter(item => item.isArchived === filter.isArchived);
    }

    if (filter.isSharedWithPartner !== undefined) {
      filteredMedia = filteredMedia.filter(item => item.isSharedWithPartner === filter.isSharedWithPartner);
    }

    // Apply sorting
    filteredMedia.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortOption.field) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'fileSize':
          aValue = a.fileSize;
          bValue = b.fileSize;
          break;
        case 'isFavorite':
          aValue = a.isFavorite ? 1 : 0;
          bValue = b.isFavorite ? 1 : 0;
          break;
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
      }

      if (sortOption.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredMedia;
  };

  const requestPermissions = async (): Promise<MediaPermissions> => {
    // Implementation would use react-native-permissions
    // For now, return current permissions
    return permissions;
  };

  const getCoupleId = (): string | null => {
    if (!user?.partnerId) return null;
    return generateCoupleId(user.id, user.partnerId);
  };

  // Helper functions
  const updateStats = (mediaData: MediaItem[]) => {
    const stats: GalleryStats = {
      totalMedia: mediaData.length,
      totalPhotos: mediaData.filter(m => m.type === 'photo').length,
      totalVideos: mediaData.filter(m => m.type === 'video').length,
      totalSize: mediaData.reduce((acc, m) => acc + (m.fileSize || 0), 0),
      sharedMedia: mediaData.filter(m => m.isSharedWithPartner).length,
      favoriteMedia: mediaData.filter(m => m.isFavorite).length,
      albumsCount: albums.length,
      memoriesCount: memories.length,
      thisMonthUploads: mediaData.filter(m => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const createdAt = m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt);
        return createdAt >= monthStart;
      }).length,
      storageUsed: mediaData.reduce((acc, m) => acc + (m.fileSize || 0), 0),
      storageLimit: 1024 * 1024 * 1024 * 5, // 5GB limit
    };

    setStats(stats);
  };

  const generateCoupleId = (user1Id: string, user2Id: string): string => {
    return [user1Id, user2Id].sort().join('_');
  };

  const value: GalleryContextType = {
    media,
    sharedMedia,
    albums,
    memories,
    isLoading,
    hasError,
    errorMessage,
    uploads,
    isUploading,
    viewMode,
    filter,
    sortOption,
    stats,
    permissions,
    uploadMedia,
    updateMedia,
    deleteMedia,
    shareMediaWithPartner,
    unshareMedia,
    addReaction,
    addComment,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    addMediaToAlbum,
    removeMediaFromAlbum,
    createMemory,
    updateMemory,
    deleteMemory,
    setViewMode,
    setFilter,
    setSortOption,
    searchMedia,
    clearSearch,
    refreshGallery,
    getFilteredMedia,
    requestPermissions,
    getCoupleId,
  };

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
};

export const useGallery = (): GalleryContextType => {
  const context = useContext(GalleryContext);
  if (context === undefined) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};

export default GalleryContext;