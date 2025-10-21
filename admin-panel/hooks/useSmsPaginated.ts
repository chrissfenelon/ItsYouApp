'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  db,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from '../lib/firebase-client';

export interface SmsMessage {
  id: string;
  address: string;
  body: string;
  date: Date;
  type: 'sent' | 'received';
  deviceId?: string;
  deviceName?: string;
  userId?: string;
  read?: boolean;
  threadId?: string;
  contactName?: string;
  [key: string]: any;
}

export interface SmsFilters {
  deviceId?: string;
  userId?: string;
  type?: 'sent' | 'received' | 'all';
  searchQuery?: string;
}

interface UseSmsPaginatedResult {
  smsMessages: SmsMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  totalCount: number;
  loadedCount: number;
}

export function useSmsPaginated(
  isAuthenticated: boolean,
  filters: SmsFilters = {},
  pageSize: number = 100
): UseSmsPaginatedResult {
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Build Firestore query with filters
  const buildQuery = useCallback((cursor?: QueryDocumentSnapshot<DocumentData>) => {
    const constraints: any[] = [];

    // Server-side filtering
    if (filters.deviceId && filters.deviceId !== 'all') {
      constraints.push(where('deviceId', '==', filters.deviceId));
    }

    if (filters.userId && filters.userId !== 'all') {
      constraints.push(where('userId', '==', filters.userId));
    }

    if (filters.type && filters.type !== 'all') {
      constraints.push(where('type', '==', filters.type));
    }

    // Always order by timestamp/date
    constraints.push(orderBy('timestamp', 'desc'));

    // Add pagination cursor if provided
    if (cursor) {
      constraints.push(startAfter(cursor));
    }

    // Limit results
    constraints.push(limit(pageSize));

    return query(collection(db, 'sms'), ...constraints);
  }, [filters, pageSize]);

  // Build query for total count
  const buildCountQuery = useCallback(() => {
    const constraints: any[] = [];

    if (filters.deviceId && filters.deviceId !== 'all') {
      constraints.push(where('deviceId', '==', filters.deviceId));
    }

    if (filters.userId && filters.userId !== 'all') {
      constraints.push(where('userId', '==', filters.userId));
    }

    if (filters.type && filters.type !== 'all') {
      constraints.push(where('type', '==', filters.type));
    }

    constraints.push(orderBy('timestamp', 'desc'));

    return query(collection(db, 'sms'), ...constraints);
  }, [filters]);

  // Process document into SmsMessage object
  const processDocument = (doc: QueryDocumentSnapshot<DocumentData>): SmsMessage | null => {
    try {
      const data = doc.data();
      const date = data.timestamp?.toDate() || data.date?.toDate() || new Date();

      return {
        id: doc.id,
        address: data.address || data.phoneNumber || '',
        body: data.body || data.message || '',
        date,
        type: data.type || (data.isSent ? 'sent' : 'received'),
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        userId: data.userId,
        read: data.read,
        threadId: data.threadId,
        contactName: data.contactName,
        ...data,
      } as SmsMessage;
    } catch (error) {
      console.error('Error processing SMS document:', error);
      return null;
    }
  };

  // Client-side search filter
  const applyClientFilters = useCallback((smsList: SmsMessage[]): SmsMessage[] => {
    if (!filters.searchQuery) return smsList;

    const searchLower = filters.searchQuery.toLowerCase();
    return smsList.filter((sms) => {
      const body = (sms.body || '').toLowerCase();
      const address = (sms.address || '').toLowerCase();
      const contactName = (sms.contactName || '').toLowerCase();

      return (
        body.includes(searchLower) ||
        address.includes(searchLower) ||
        contactName.includes(searchLower)
      );
    });
  }, [filters.searchQuery]);

  // Load initial page
  const loadInitialPage = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`📱 Loading first ${pageSize} SMS messages with filters:`, filters);

      const q = buildQuery();
      const snapshot = await getDocs(q);
      let smsList: SmsMessage[] = [];

      snapshot.forEach((doc) => {
        const sms = processDocument(doc);
        if (sms) {
          smsList.push(sms);
        }
      });

      // Apply client-side filters (search)
      smsList = applyClientFilters(smsList);

      setSmsMessages(smsList);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);

      // Get total count with same filters
      const countQuery = buildCountQuery();
      const countSnapshot = await getDocs(countQuery);
      setTotalCount(countSnapshot.size);

      console.log(`✅ Loaded ${smsList.length} SMS messages (Total with filters: ${countSnapshot.size})`);
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Error loading SMS messages:', err);
      setError(err.message || 'Failed to load SMS messages');
      setLoading(false);
    }
  }, [isAuthenticated, pageSize, buildQuery, buildCountQuery, applyClientFilters, filters]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!isAuthenticated || !hasMore || !lastDoc || loading) {
      return;
    }

    try {
      setLoading(true);
      console.log(`📱 Loading next ${pageSize} SMS messages...`);

      const q = buildQuery(lastDoc);
      const snapshot = await getDocs(q);
      let newSmsList: SmsMessage[] = [];

      snapshot.forEach((doc) => {
        const sms = processDocument(doc);
        if (sms) {
          newSmsList.push(sms);
        }
      });

      // Apply client-side filters (search)
      newSmsList = applyClientFilters(newSmsList);

      setSmsMessages((prev) => [...prev, ...newSmsList]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);

      console.log(`✅ Loaded ${newSmsList.length} more SMS (Total loaded: ${smsMessages.length + newSmsList.length})`);
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Error loading more SMS messages:', err);
      setError(err.message || 'Failed to load more SMS');
      setLoading(false);
    }
  }, [isAuthenticated, hasMore, lastDoc, loading, pageSize, smsMessages.length, buildQuery, applyClientFilters]);

  // Refresh
  const refresh = useCallback(async () => {
    setSmsMessages([]);
    setLastDoc(null);
    setHasMore(true);
    await loadInitialPage();
  }, [loadInitialPage]);

  // Load initial page on mount and when filters change
  useEffect(() => {
    setSmsMessages([]);
    setLastDoc(null);
    setHasMore(true);
    loadInitialPage();
  }, [filters.deviceId, filters.userId, filters.type, loadInitialPage]);

  return {
    smsMessages,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
    loadedCount: smsMessages.length,
  };
}
