import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { Note, NoteReaction, NoteComment } from '../../types/notes';

const { width, height } = Dimensions.get('window');

interface NoteReactionsCommentsProps {
  visible: boolean;
  onClose: () => void;
  note: Note;
  currentUserId: string;
  currentUserName: string;
  onAddReaction: (reaction: NoteReaction['reaction']) => void;
  onAddComment: (content: string) => void;
  theme: any;
}

const NoteReactionsComments: React.FC<NoteReactionsCommentsProps> = ({
  visible,
  onClose,
  note,
  currentUserId,
  currentUserName,
  onAddReaction,
  onAddComment,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'reactions' | 'comments'>('reactions');
  const [commentInput, setCommentInput] = useState('');

  const availableReactions: NoteReaction['reaction'][] = ['❤️', '😊', '👍', '😍', '🥰', '💕'];

  const userReaction = note.reactions.find(r => r.userId === currentUserId);

  const reactionCounts = availableReactions.map(reaction => ({
    reaction,
    count: note.reactions.filter(r => r.reaction === reaction).length,
    users: note.reactions.filter(r => r.reaction === reaction).map(r => r.userId),
  }));

  const sortedComments = [...note.comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleReactionPress = (reaction: NoteReaction['reaction']) => {
    onAddReaction(reaction);
  };

  const handleAddComment = () => {
    if (commentInput.trim()) {
      onAddComment(commentInput.trim());
      setCommentInput('');
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderReactionsTab = () => (
    <View style={styles.tabContent}>
      {/* Available Reactions */}
      <View style={styles.reactionsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Votre réaction
        </Text>

        <View style={styles.reactionsGrid}>
          {availableReactions.map((reaction) => {
            const isSelected = userReaction?.reaction === reaction;
            const count = reactionCounts.find(r => r.reaction === reaction)?.count || 0;

            return (
              <TouchableOpacity
                key={reaction}
                style={[
                  styles.reactionButton,
                  { backgroundColor: theme.background.secondary },
                  isSelected && {
                    backgroundColor: theme.romantic.primary,
                    transform: [{ scale: 1.1 }],
                  }
                ]}
                onPress={() => handleReactionPress(reaction)}
              >
                <Text style={styles.reactionEmoji}>{reaction}</Text>
                {count > 0 && (
                  <Text style={[
                    styles.reactionCount,
                    { color: isSelected ? '#FFFFFF' : theme.text.secondary }
                  ]}>
                    {count}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Reactions Summary */}
      {note.reactions.length > 0 && (
        <View style={styles.reactionsSummary}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Toutes les réactions ({note.reactions.length})
          </Text>

          {reactionCounts
            .filter(r => r.count > 0)
            .sort((a, b) => b.count - a.count)
            .map((reactionData, index) => (
              <View key={index} style={[styles.reactionSummaryItem, { backgroundColor: theme.background.secondary }]}>
                <Text style={styles.reactionSummaryEmoji}>{reactionData.reaction}</Text>
                <Text style={[styles.reactionSummaryText, { color: theme.text.primary }]}>
                  {reactionData.count} {reactionData.count === 1 ? 'personne' : 'personnes'}
                </Text>
                <Text style={[styles.reactionSummaryDetails, { color: theme.text.secondary }]}>
                  {reactionData.users.includes(currentUserId) ? 'Vous' : ''}{' '}
                  {reactionData.users.length > 1 && reactionData.users.includes(currentUserId) ? 'et ' : ''}
                  {reactionData.users.filter(id => id !== currentUserId).length > 0 ? 'votre partenaire' : ''}
                </Text>
              </View>
            ))}
        </View>
      )}

      {note.reactions.length === 0 && (
        <View style={styles.emptyState}>
          <Foundation name="heart" size={48} color={theme.text.tertiary} />
          <Text style={[styles.emptyStateText, { color: theme.text.secondary }]}>
            Soyez le premier à réagir à cette note
          </Text>
        </View>
      )}
    </View>
  );

  const renderCommentsTab = () => (
    <View style={styles.tabContent}>
      {/* Add Comment */}
      <View style={styles.addCommentSection}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Ajouter un commentaire
        </Text>

        <View style={styles.commentInputContainer}>
          <TextInput
            style={[styles.commentInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
            placeholder="Écrivez votre commentaire..."
            placeholderTextColor={theme.text.tertiary}
            value={commentInput}
            onChangeText={setCommentInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: commentInput.trim() ? theme.romantic.primary : theme.background.tertiary }
            ]}
            onPress={handleAddComment}
            disabled={!commentInput.trim()}
          >
            <Foundation name="arrow-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.characterCount, { color: theme.text.tertiary }]}>
          {commentInput.length}/500 caractères
        </Text>
      </View>

      {/* Comments List */}
      {sortedComments.length > 0 ? (
        <View style={styles.commentsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Commentaires ({note.comments.length})
          </Text>

          <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
            {sortedComments.map((comment) => (
              <View key={comment.id} style={[styles.commentItem, { backgroundColor: theme.background.secondary }]}>
                <View style={styles.commentHeader}>
                  <View style={[styles.userAvatar, { backgroundColor: theme.romantic.primary }]}>
                    <Text style={styles.userInitial}>
                      {comment.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.commentMeta}>
                    <Text style={[styles.commentAuthor, { color: theme.text.primary }]}>
                      {comment.userId === currentUserId ? 'Vous' : comment.userName}
                    </Text>
                    <Text style={[styles.commentDate, { color: theme.text.tertiary }]}>
                      {formatDate(new Date(comment.createdAt))}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.commentContent, { color: theme.text.secondary }]}>
                  {comment.content}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Foundation name="comment" size={48} color={theme.text.tertiary} />
          <Text style={[styles.emptyStateText, { color: theme.text.secondary }]}>
            Aucun commentaire pour le moment
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.text.tertiary }]}>
            Soyez le premier à commenter cette note
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modal, { backgroundColor: theme.background.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              Réactions et commentaires
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Foundation name="x" size={24} color={theme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Note Info */}
          <View style={[styles.noteInfo, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.noteTitle, { color: theme.text.primary }]} numberOfLines={1}>
              {note.title || 'Note sans titre'}
            </Text>
            <Text style={[styles.noteAuthor, { color: theme.text.secondary }]}>
              Par {note.authorId === currentUserId ? 'vous' : note.authorName}
            </Text>
          </View>

          {/* Tabs */}
          <View style={[styles.tabBar, { backgroundColor: theme.background.secondary }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'reactions' && { backgroundColor: theme.background.card }
              ]}
              onPress={() => setActiveTab('reactions')}
            >
              <Foundation
                name="heart"
                size={16}
                color={activeTab === 'reactions' ? theme.romantic.primary : theme.text.tertiary}
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'reactions' ? theme.text.primary : theme.text.tertiary }
              ]}>
                Réactions ({note.reactions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'comments' && { backgroundColor: theme.background.card }
              ]}
              onPress={() => setActiveTab('comments')}
            >
              <Foundation
                name="comment"
                size={16}
                color={activeTab === 'comments' ? theme.text.primary : theme.text.tertiary}
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'comments' ? theme.text.primary : theme.text.tertiary }
              ]}>
                Commentaires ({note.comments.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'reactions' && renderReactionsTab()}
            {activeTab === 'comments' && renderCommentsTab()}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  noteInfo: {
    padding: 15,
    margin: 20,
    borderRadius: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteAuthor: {
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    margin: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Reactions
  reactionsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  reactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reactionButton: {
    width: (width - 84) / 4,
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  reactionsSummary: {
    marginBottom: 25,
  },
  reactionSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  reactionSummaryEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  reactionSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  reactionSummaryDetails: {
    fontSize: 12,
  },

  // Comments
  addCommentSection: {
    marginBottom: 25,
  },
  commentInputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  commentsSection: {
    flex: 1,
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 12,
    marginTop: 2,
  },
  commentContent: {
    fontSize: 15,
    lineHeight: 20,
  },

  // Empty States
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default NoteReactionsComments;