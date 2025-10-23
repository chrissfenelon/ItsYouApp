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
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../../context/AppContext';
import VideoService from '../../services/VideoService';
import { VideoComment } from '../../types/video.types';

interface CommentsSectionProps {
  videoId: string;
  isSharedWithPartner: boolean;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  videoId,
  isSharedWithPartner,
}) => {
  const { user, currentTheme } = useApp();
  const styles = createStyles(currentTheme);
  const flatListRef = useRef<FlatList>(null);

  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const loadedComments = await VideoService.getComments(videoId);
      setComments(loadedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!isSharedWithPartner) {
      Alert.alert(
        'Non partagé',
        'Vous devez d\'abord partager cette vidéo avec votre partenaire pour ajouter des commentaires.'
      );
      return;
    }

    try {
      setSubmitting(true);
      await VideoService.addComment(videoId, commentText.trim(), 0);
      setCommentText('');
      await loadComments();

      // Scroll to bottom to show new comment
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (comment: VideoComment) => {
    Alert.alert(
      'Supprimer le commentaire',
      'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await VideoService.deleteComment(comment.id);
              await loadComments();
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le commentaire');
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderComment = ({ item }: { item: VideoComment }) => {
    const isOwn = item.userId === user?.id;

    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthorContainer}>
            <View style={[
              styles.avatarCircle,
              { backgroundColor: isOwn ? currentTheme.romantic.primary : currentTheme.romantic.secondary }
            ]}>
              <Text style={styles.avatarText}>
                {item.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.commentHeaderText}>
              <Text style={styles.commentAuthor}>{item.userName}</Text>
              <Text style={styles.commentTimestamp}>
                {formatTimestamp(item.createdAt)}
              </Text>
            </View>
          </View>

          {isOwn && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteComment(item)}
            >
              <Foundation name="trash" size={16} color={currentTheme.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Foundation name="comments" size={40} color="rgba(255, 255, 255, 0.3)" />
      <Text style={styles.emptyText}>
        {isSharedWithPartner
          ? 'Aucun commentaire. Soyez le premier !'
          : 'Partagez cette vidéo pour commenter'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={currentTheme.romantic.primary} />
        <Text style={styles.loadingText}>Chargement des commentaires...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Foundation name="comments" size={20} color={currentTheme.text.primary} />
        <Text style={styles.headerTitle}>
          Commentaires {comments.length > 0 && `(${comments.length})`}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.commentsList}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
      />

      {isSharedWithPartner && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ajouter un commentaire..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            editable={!submitting}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: currentTheme.romantic.primary },
              (!commentText.trim() || submitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Foundation name="paper-plane" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
  },
  flatList: {
    flex: 1,
  },
  commentsList: {
    paddingVertical: 12,
  },
  commentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentHeaderText: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 2,
  },
  commentTimestamp: {
    fontSize: 12,
    color: theme.text.secondary,
  },
  deleteButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    color: theme.text.primary,
    lineHeight: 20,
    marginLeft: 42,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: theme.text.secondary,
    textAlign: 'center',
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default CommentsSection;
