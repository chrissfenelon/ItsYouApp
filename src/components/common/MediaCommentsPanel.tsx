import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Animated,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import MediaCommentsService from '../../services/MediaCommentsService';
import { MediaComment, MediaType, formatCommentTime } from '../../types/mediaComments.types';

interface MediaCommentsPanelProps {
  mediaId: string;
  mediaType: MediaType;
  isShared: boolean;
  onClose?: () => void;
}

interface CommentThread extends MediaComment {
  replies: MediaComment[];
  showReplies: boolean;
}

const MediaCommentsPanel: React.FC<MediaCommentsPanelProps> = ({
  mediaId,
  mediaType,
  isShared,
  onClose,
}) => {
  const { user, currentTheme } = useApp();
  const styles = createStyles(currentTheme);
  const flatListRef = useRef<FlatList>(null);

  const [comments, setComments] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<MediaComment | null>(null);

  useEffect(() => {
    loadComments();

    // Real-time subscription
    const unsubscribe = MediaCommentsService.subscribeToComments(
      mediaId,
      mediaType,
      handleCommentsUpdate
    );

    // Mark as read when opening
    MediaCommentsService.markCommentsAsRead(mediaId, mediaType);

    return () => unsubscribe();
  }, [mediaId, mediaType]);

  const handleCommentsUpdate = (allComments: MediaComment[]) => {
    // Organize comments into threads
    const parentComments = allComments.filter(c => !c.parentCommentId);
    const threaded: CommentThread[] = parentComments.map(parent => {
      const replies = allComments.filter(c => c.parentCommentId === parent.id);
      return {
        ...parent,
        replies,
        showReplies: replies.length > 0,
      };
    });

    setComments(threaded);
    setLoading(false);
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      console.log('Loading comments for:', mediaId, mediaType);

      // Timeout de 8 secondes pour éviter le chargement infini
      const timeoutPromise = new Promise<MediaComment[]>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 8000)
      );

      const commentsPromise = MediaCommentsService.getComments(mediaId, mediaType);

      const allComments = await Promise.race([commentsPromise, timeoutPromise]);

      console.log('Comments loaded:', allComments.length);
      handleCommentsUpdate(allComments);
    } catch (error: any) {
      console.error('Error loading comments:', error);

      // Si c'est un timeout, on affiche quand même l'état vide sans bloquer
      if (error?.message === 'Timeout') {
        console.log('Comments loading timed out - showing empty state');
      }

      // En cas d'erreur, afficher l'état vide
      setComments([]);
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    if (!isShared) {
      Alert.alert(
        'Non partagé',
        'Vous devez d\'abord partager ce média avec votre partenaire pour ajouter des commentaires.'
      );
      return;
    }

    const textToSend = commentText.trim();
    const parentId = replyingTo?.id;

    // Clear input immediately for better UX
    setCommentText('');
    setReplyingTo(null);

    // Create optimistic comment (temporary comment that shows immediately)
    const optimisticComment: MediaComment = {
      id: `temp_${Date.now()}`, // Temporary ID
      mediaId,
      mediaType,
      userId: user?.id || '',
      userName: user?.name || 'Vous',
      userPhotoURL: user?.photoURL,
      text: textToSend,
      createdAt: Date.now(),
      parentCommentId: parentId,
      repliesCount: 0,
      isEdited: false,
    };

    // Add optimistic comment to the list immediately
    setComments(prev => {
      if (parentId) {
        // If it's a reply, add to the parent's replies
        return prev.map(thread => {
          if (thread.id === parentId) {
            return {
              ...thread,
              replies: [...thread.replies, optimisticComment],
              showReplies: true,
            };
          }
          return thread;
        });
      } else {
        // If it's a new comment, add as a new thread
        return [...prev, { ...optimisticComment, replies: [], showReplies: false }];
      }
    });

    // Scroll to bottom immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Send to Firestore in background (don't block UI)
    try {
      const realCommentId = await MediaCommentsService.addComment(
        mediaId,
        mediaType,
        textToSend,
        parentId
      );

      // Update the optimistic comment with the real ID
      setComments(prev => {
        const updateComment = (comment: MediaComment) => {
          if (comment.id === optimisticComment.id) {
            return { ...comment, id: realCommentId };
          }
          return comment;
        };

        return prev.map(thread => ({
          ...updateComment(thread),
          replies: thread.replies.map(updateComment),
        }));
      });

      console.log('Comment sent successfully:', realCommentId);
    } catch (error) {
      console.error('Error adding comment:', error);

      // Remove the optimistic comment on error
      setComments(prev => {
        if (parentId) {
          return prev.map(thread => {
            if (thread.id === parentId) {
              return {
                ...thread,
                replies: thread.replies.filter(r => r.id !== optimisticComment.id),
              };
            }
            return thread;
          });
        } else {
          return prev.filter(t => t.id !== optimisticComment.id);
        }
      });

      // Show error
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire. Veuillez réessayer.');
    }
  };

  const handleReply = (comment: MediaComment) => {
    setReplyingTo(comment);
    setCommentText(`@${comment.userName} `);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const handleDeleteComment = (comment: MediaComment) => {
    Alert.alert(
      'Supprimer le commentaire',
      'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await MediaCommentsService.deleteComment(comment.id);
            } catch (error: any) {
              console.error('Error deleting comment:', error);
              const errorMessage = error.message || 'Impossible de supprimer le commentaire';
              Alert.alert('Erreur', errorMessage);
            }
          },
        },
      ]
    );
  };

  const toggleReplies = (commentId: string) => {
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, showReplies: !c.showReplies } : c
    ));
  };

  const renderProfilePhoto = (photoURL?: string, userName?: string) => {
    if (photoURL) {
      return (
        <Image
          source={{ uri: photoURL }}
          style={styles.profilePhoto}
        />
      );
    }

    const initial = userName?.charAt(0).toUpperCase() || '?';
    return (
      <View style={[styles.profilePhoto, styles.profilePhotoPlaceholder]}>
        <Text style={styles.profilePhotoText}>{initial}</Text>
      </View>
    );
  };

  const renderComment = (comment: MediaComment, isReply: boolean = false) => {
    const isOwn = comment.userId === user?.id;

    return (
      <View
        key={comment.id}
        style={[
          styles.commentContainer,
          isReply && styles.replyContainer,
        ]}
      >
        <View style={styles.commentContent}>
          {/* Profile Photo */}
          {renderProfilePhoto(comment.userPhotoURL, comment.userName)}

          {/* Comment Body */}
          <View style={styles.commentBody}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>
                {comment.userName}
                {isOwn && <Text style={styles.youBadge}> (Vous)</Text>}
              </Text>
              <Text style={styles.commentTimestamp}>
                {formatCommentTime(comment.createdAt)}
                {comment.isEdited && ' (modifié)'}
              </Text>
            </View>

            <Text style={styles.commentText}>{comment.text}</Text>

            {/* Actions */}
            <View style={styles.commentActions}>
              {!isReply && (
                <TouchableOpacity
                  onPress={() => handleReply(comment)}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>Répondre</Text>
                </TouchableOpacity>
              )}

              {isOwn && (
                <TouchableOpacity
                  onPress={() => handleDeleteComment(comment)}
                  style={styles.actionButton}
                >
                  <Text style={[styles.actionButtonText, styles.deleteText]}>
                    Supprimer
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCommentThread = ({ item }: { item: CommentThread }) => (
    <View style={styles.threadContainer}>
      {/* Parent Comment */}
      {renderComment(item, false)}

      {/* Replies Toggle */}
      {item.repliesCount > 0 && (
        <TouchableOpacity
          onPress={() => toggleReplies(item.id)}
          style={styles.viewRepliesButton}
        >
          <View style={styles.replyLine} />
          <Text style={styles.viewRepliesText}>
            {item.showReplies ? 'Masquer' : 'Voir'} {item.repliesCount} réponse{item.repliesCount > 1 ? 's' : ''}
          </Text>
          <Foundation
            name={item.showReplies ? 'minus' : 'plus'}
            size={14}
            color={currentTheme.romantic.primary}
          />
        </TouchableOpacity>
      )}

      {/* Replies */}
      {item.showReplies && item.replies.map(reply => renderComment(reply, true))}
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={currentTheme.romantic.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Foundation name="comments" size={60} color="rgba(255, 255, 255, 0.2)" />
        <Text style={styles.emptyTitle}>Aucun commentaire</Text>
        <Text style={styles.emptyText}>
          {isShared
            ? 'Soyez le premier à commenter !'
            : 'Partagez ce média pour pouvoir commenter'}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Foundation name="comments" size={22} color={currentTheme.text.primary} />
          <Text style={styles.headerTitle}>
            Commentaires
            {comments.length > 0 && (
              <Text style={styles.commentCount}> {comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)}</Text>
            )}
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Foundation name="x" size={24} color={currentTheme.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Comments List */}
      <FlatList
        ref={flatListRef}
        data={comments}
        renderItem={renderCommentThread}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.commentsList}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
      />

      {/* Reply Banner */}
      {replyingTo && (
        <View style={styles.replyBanner}>
          <Foundation name="arrow-right" size={16} color={currentTheme.text.secondary} />
          <Text style={styles.replyBannerText}>
            Répondre à {replyingTo.userName}
          </Text>
          <TouchableOpacity onPress={handleCancelReply}>
            <Foundation name="x" size={18} color={currentTheme.text.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      {isShared && (
        <View style={styles.inputContainer}>
          {renderProfilePhoto(user?.photoURL, user?.name)}

          <TextInput
            style={styles.input}
            placeholder="Ajouter un commentaire..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: currentTheme.romantic.primary },
              !commentText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={!commentText.trim()}
          >
            <Foundation name="mail" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: theme.text.secondary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
  },
  commentCount: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.text.secondary,
  },
  closeButton: {
    padding: 4,
  },
  flatList: {
    flex: 1,
  },
  commentsList: {
    paddingVertical: 8,
  },
  threadContainer: {
    marginBottom: 4,
  },
  commentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyContainer: {
    paddingLeft: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  commentContent: {
    flexDirection: 'row',
    gap: 12,
  },
  profilePhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.romantic.primary,
  },
  profilePhotoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text.primary,
  },
  youBadge: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.romantic.primary,
  },
  commentTimestamp: {
    fontSize: 12,
    color: theme.text.secondary,
  },
  commentText: {
    fontSize: 14,
    color: theme.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    paddingVertical: 2,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  deleteText: {
    color: '#FF4444',
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 56,
    paddingVertical: 8,
    gap: 8,
  },
  replyLine: {
    width: 2,
    height: 16,
    backgroundColor: theme.romantic.primary,
    borderRadius: 1,
  },
  viewRepliesText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.romantic.primary,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  replyBannerText: {
    flex: 1,
    fontSize: 13,
    color: theme.text.secondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.text.primary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default MediaCommentsPanel;
