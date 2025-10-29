// Firebase Admin removed - all data access is now client-side via hooks
// This file is kept for compatibility but returns empty data

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

// ============= DEVICES =============

export async function getAllDevices(): Promise<Device[]> {
  return [];
}

export async function getDeviceById(deviceId: string): Promise<Device | null> {
  return null;
}

// ============= MESSAGES =============

export async function getAllMessages(filters?: {
  app?: string;
  type?: 'sent' | 'received';
  deviceId?: string;
  limit?: number;
  offset?: number;
}): Promise<Message[]> {
  return [];
}

export async function getMessagesByDevice(deviceId: string, limit = 50): Promise<Message[]> {
  return [];
}

// ============= SMS =============

export async function getAllSMS(filters?: {
  type?: 1 | 2;
  deviceId?: string;
  limit?: number;
}): Promise<SMS[]> {
  return [];
}

export async function getSMSByDevice(deviceId: string, limit = 50): Promise<SMS[]> {
  return [];
}

// ============= PHOTOS =============

export async function getAllPhotos(limit = 100): Promise<Photo[]> {
  return [];
}

export async function deletePhoto(photoId: string): Promise<boolean> {
  return false;
}

// ============= MUSIC =============

export async function getAllMusic(): Promise<MusicTrack[]> {
  return [];
}

export async function deleteMusic(trackId: string): Promise<boolean> {
  return false;
}

// ============= USERS =============

export async function getAllUsers(): Promise<AppUser[]> {
  return [];
}

export async function getUserById(userId: string): Promise<AppUser | null> {
  return null;
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive' | 'disabled'): Promise<boolean> {
  return false;
}

export async function deleteUser(userId: string): Promise<boolean> {
  return false;
}

// ============= HOME MESSAGE =============

export async function getHomeMessage(): Promise<string> {
  return "Welcome to ItsYouApp! ❤️\n\nYour romantic journey starts here.";
}

export async function updateHomeMessage(message: string): Promise<boolean> {
  return false;
}

// ============= ANALYTICS =============

export async function getAnalytics() {
  return {
    totalUsers: 0,
    activeToday: 0,
    totalMessages: 0,
    totalPhotos: 0,
    totalSMS: 0,
  };
}
