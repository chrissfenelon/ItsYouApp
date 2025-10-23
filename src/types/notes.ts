export type NoteVisibility = 'private' | 'shared' | 'view-only';

export type NoteFontFamily =
  | 'default'
  | 'romantic'
  | 'elegant'
  | 'handwritten'
  | 'modern'
  | 'classic';

export type NoteTextSize = 'small' | 'medium' | 'large' | 'extra-large';

export type NoteBackgroundType = 'color' | 'gradient' | 'predefined' | 'custom';

export interface NoteStyle {
  fontFamily: NoteFontFamily;
  fontSize: NoteTextSize;
  backgroundColor?: string;
  backgroundType: NoteBackgroundType;
  backgroundValue: string; // color code, gradient, or image path
  textColor: string;
  glowColor: string; // Border glow effect color
  isBold: boolean;
  isItalic: boolean;
  isUnderlined: boolean;
}

export interface NoteReaction {
  userId: string;
  reaction: '❤️' | '😊' | '👍' | '😍' | '🥰' | '💕';
  createdAt: Date;
}

export interface NoteComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;

  // Visibility and sharing
  visibility: NoteVisibility;
  isSharedWithPartner: boolean;
  partnerId?: string;

  // Organization
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  category?: string;
  tags: string[];

  // Customization
  style: NoteStyle;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date;
  wordCount: number;
  characterCount: number;

  // Social features
  reactions: NoteReaction[];
  comments: NoteComment[];

  // Additional features
  reminderDate?: Date;
  location?: {
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  attachments?: string[]; // image URLs
  mood?: string;
  template?: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  style: Partial<NoteStyle>;
  thumbnail?: string;
}

export interface NotesFilter {
  searchQuery?: string;
  category?: string;
  tags?: string[];
  visibility?: NoteVisibility;
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  author?: string;
}

export interface NotesSortOption {
  field: 'createdAt' | 'updatedAt' | 'title' | 'isPinned';
  direction: 'asc' | 'desc';
}

export interface NotesViewMode {
  layout: 'grid' | 'list';
  cardSize: 'small' | 'medium' | 'large';
  showPreviews: boolean;
}

// Firebase document interfaces
export interface FirebaseNote extends Omit<Note, 'createdAt' | 'updatedAt' | 'lastViewedAt' | 'reminderDate'> {
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  lastViewedAt?: any; // Firestore Timestamp
  reminderDate?: any; // Firestore Timestamp
}

export interface CoupleNotesMetadata {
  coupleId: string;
  user1Id: string;
  user2Id: string;
  user1Name: string;
  user2Name: string;
  sharedNotesCount: number;
  lastActivity: Date;
  isActive: boolean;
}