export type MediaType = 'photo' | 'video' | 'note';

export interface MediaComment {
  id: string;
  mediaId: string;
  mediaType: MediaType;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
  parentCommentId?: string; // Pour les réponses
  repliesCount: number;
  isEdited: boolean;
}

export interface MediaCommentThread extends MediaComment {
  replies: MediaComment[];
  showReplies: boolean;
}

export interface CommentNotification {
  mediaId: string;
  mediaType: MediaType;
  unreadCount: number;
  lastCommentAt: number;
  lastCommentBy: string;
  lastCommentText: string;
}

export const formatCommentTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return "À l'instant";
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Il y a ${diffInDays}j`;

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};
