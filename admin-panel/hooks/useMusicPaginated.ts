'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  db,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from '../lib/firebase-client';

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  url: string;
  uploadedAt: Date;
  uploadedBy?: string;
  size?: number;
  fileName?: string;
  [key: string]: any;
}

interface UseMusicPaginatedResult {
  tracks: MusicTrack[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  totalCount: number;
  loadedCount: number;
}

export function useMusicPaginated(
  isAuthenticated: boolean,
  pageSize: number = 50
): UseMusicPaginatedResult {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Process document into MusicTrack object
  const processDocument = (doc: QueryDocumentSnapshot<DocumentData>): MusicTrack | null => {
    try {
      const data = doc.data();

      // Skip tracks without URL (orphaned metadata)
      if (!data.url) {
        console.warn(`⚠️ Skipping track ${doc.id} - no URL`);
        return null;
      }

      const uploadedAt = data.uploadedAt?.toDate() || data.createdAt?.toDate() || new Date();

      return {
        id: doc.id,
        title: data.title || data.name || 'Unknown',
        artist: data.artist || 'Unknown Artist',
        album: data.album,
        duration: data.duration,
        url: data.url,
        uploadedAt,
        uploadedBy: data.uploadedBy,
        size: data.size,
        fileName: data.fileName,
        ...data,
      } as MusicTrack;
    } catch (error) {
      console.error('Error processing music document:', error);
      return null;
    }
  };

  // Load initial page
  const loadInitialPage = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🎵 Loading first ${pageSize} music tracks...`);

      const q = query(
        collection(db, 'musicLibrary'),
        orderBy('uploadedAt', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const tracksList: MusicTrack[] = [];

      snapshot.forEach((doc) => {
        const track = processDocument(doc);
        if (track) {
          tracksList.push(track);
        }
      });

      setTracks(tracksList);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);

      // Get total count
      const countSnapshot = await getDocs(collection(db, 'musicLibrary'));
      setTotalCount(countSnapshot.size);

      console.log(`✅ Loaded ${tracksList.length} music tracks (Total: ${countSnapshot.size})`);
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Error loading music tracks:', err);
      setError(err.message || 'Failed to load music tracks');
      setLoading(false);
    }
  }, [isAuthenticated, pageSize]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!isAuthenticated || !hasMore || !lastDoc || loading) {
      return;
    }

    try {
      setLoading(true);
      console.log(`🎵 Loading next ${pageSize} music tracks...`);

      const q = query(
        collection(db, 'musicLibrary'),
        orderBy('uploadedAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const newTracks: MusicTrack[] = [];

      snapshot.forEach((doc) => {
        const track = processDocument(doc);
        if (track) {
          newTracks.push(track);
        }
      });

      setTracks((prev) => [...prev, ...newTracks]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);

      console.log(`✅ Loaded ${newTracks.length} more tracks (Total loaded: ${tracks.length + newTracks.length})`);
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Error loading more music tracks:', err);
      setError(err.message || 'Failed to load more tracks');
      setLoading(false);
    }
  }, [isAuthenticated, hasMore, lastDoc, loading, pageSize, tracks.length]);

  // Refresh
  const refresh = useCallback(async () => {
    setTracks([]);
    setLastDoc(null);
    setHasMore(true);
    await loadInitialPage();
  }, [loadInitialPage]);

  // Load initial page on mount
  useEffect(() => {
    loadInitialPage();
  }, [loadInitialPage]);

  return {
    tracks,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
    loadedCount: tracks.length,
  };
}
