export interface Song {
  artwork: null;
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  uri: string;
  url?: string; // Firebase Storage URL for uploaded songs
  thumbnailUrl?: string;
  lyrics?: string;
  isEmbedded: boolean; // true for bundled tracks, false for user uploads
  createdAt: Date;
  uploadedBy?: string;
  uploadedAt?: Date;
  playCount?: number;
  updatedAt: Date;
  userId?: string; // undefined for embedded tracks
  isSharedWithPartner?: boolean;
  partnerId?: string; // Partner ID when shared
  metadata?: {
    size?: number;
    bitrate?: number;
    format?: string;
  };
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  songIds: string[];
  userId: string;
  isSharedWithPartner: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ParticleEffectType = 'hearts' | 'stars' | 'sparkles' | 'bubbles' | 'snow' | 'confetti' | 'petals' | 'fireflies';

export interface VinylDisc {
  centerPhotoUri?: string; // Custom photo for center of vinyl
  vinylColor: 'black' | 'red' | 'pink' | 'gold' | 'translucent';
  labelText?: string;
  activeEffects: ParticleEffectType[]; // Can have up to 8 different effects active
  userId: string;
  updatedAt: Date;
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number; // current position in seconds
  duration: number; // total duration in seconds
  queue: Song[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';
  volume: number; // 0 to 1
}

export interface MusicFilter {
  type: 'all' | 'embedded' | 'uploaded';
  isSharedWithPartner?: boolean;
  playlistId?: string;
  searchQuery?: string;
}

export interface MusicStats {
  totalSongs: number;
  uploadedSongs: number;
  embeddedSongs: number;
  totalPlaylists: number;
  sharedSongs: number;
}
