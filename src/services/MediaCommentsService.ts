import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { MediaComment, MediaType, CommentNotification } from '../types/mediaComments.types';

class MediaCommentsService {
  /**
   * Add a comment to a media (photo, video, note)
   */
  static async addComment(
    mediaId: string,
    mediaType: MediaType,
    text: string,
    parentCommentId?: string
  ): Promise<string> {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    // Get user profile
    const userDoc = await firestore()
      .collection('users')
      .doc(currentUser.uid)
      .get();

    const userData = userDoc.data();
    const userName = userData?.name || 'Utilisateur';
    const userPhotoURL = userData?.photoURL;

    // Build comment object without undefined values (Firestore doesn't accept undefined)
    const comment: any = {
      mediaId,
      mediaType,
      userId: currentUser.uid,
      userName,
      text,
      createdAt: Date.now(),
      repliesCount: 0,
      isEdited: false,
    };

    // Only add optional fields if they have values
    if (userPhotoURL) {
      comment.userPhotoURL = userPhotoURL;
    }
    if (parentCommentId) {
      comment.parentCommentId = parentCommentId;
    }

    const docRef = await firestore()
      .collection('mediaComments')
      .add(comment);

    // If this is a reply, increment the parent's reply count
    if (parentCommentId) {
      try {
        await firestore()
          .collection('mediaComments')
          .doc(parentCommentId)
          .update({
            repliesCount: firestore.FieldValue.increment(1),
          });
      } catch (error) {
        console.error('[MediaCommentsService] Error updating parent reply count:', error);
        // Continue anyway - the comment was added
      }
    }

    // Update media's comment count and last comment info
    // Wrap in try-catch to prevent blocking the comment from being added
    try {
      // Add timeout to prevent hanging
      const statsPromise = this.updateMediaCommentStats(mediaId, mediaType, currentUser.uid, text);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Stats update timeout')), 3000)
      );
      await Promise.race([statsPromise, timeoutPromise]);
    } catch (error) {
      console.error('[MediaCommentsService] Error updating media stats:', error);
      // Continue anyway - the comment was successfully added
    }

    return docRef.id;
  }

  /**
   * Get all comments for a media
   */
  static async getComments(
    mediaId: string,
    mediaType: MediaType
  ): Promise<MediaComment[]> {
    try {
      console.log('[MediaCommentsService] Fetching comments for:', mediaId, mediaType);

      const snapshot = await firestore()
        .collection('mediaComments')
        .where('mediaId', '==', mediaId)
        .where('mediaType', '==', mediaType)
        .orderBy('createdAt', 'asc')
        .get();

      console.log('[MediaCommentsService] Found', snapshot.docs.length, 'comments');

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as MediaComment));
    } catch (error: any) {
      console.error('[MediaCommentsService] Error fetching comments:', error);

      // Si l'index n'existe pas encore, essayer sans orderBy
      if (error.message?.includes('index')) {
        console.log('[MediaCommentsService] Index missing, fetching without orderBy');
        try {
          const snapshot = await firestore()
            .collection('mediaComments')
            .where('mediaId', '==', mediaId)
            .where('mediaType', '==', mediaType)
            .get();

          const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as MediaComment));

          // Trier manuellement par createdAt
          return comments.sort((a, b) => a.createdAt - b.createdAt);
        } catch (fallbackError) {
          console.error('[MediaCommentsService] Fallback fetch failed:', fallbackError);
          return [];
        }
      }

      return [];
    }
  }

  /**
   * Get replies for a specific comment
   */
  static async getReplies(parentCommentId: string): Promise<MediaComment[]> {
    const snapshot = await firestore()
      .collection('mediaComments')
      .where('parentCommentId', '==', parentCommentId)
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as MediaComment));
  }

  /**
   * Subscribe to comments in real-time
   */
  static subscribeToComments(
    mediaId: string,
    mediaType: MediaType,
    onUpdate: (comments: MediaComment[]) => void
  ): () => void {
    console.log('[MediaCommentsService] Subscribing to comments for:', mediaId, mediaType);

    let unsubscribe: (() => void) | null = null;

    try {
      // Try with orderBy first
      unsubscribe = firestore()
        .collection('mediaComments')
        .where('mediaId', '==', mediaId)
        .where('mediaType', '==', mediaType)
        .orderBy('createdAt', 'asc')
        .onSnapshot(
          snapshot => {
            console.log('[MediaCommentsService] Real-time update:', snapshot.docs.length, 'comments');
            const comments = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            } as MediaComment));
            onUpdate(comments);
          },
          error => {
            console.error('[MediaCommentsService] Subscription error:', error);

            // If index missing, try without orderBy
            if (error.message?.includes('index') || error.message?.includes('require')) {
              console.log('[MediaCommentsService] Index missing, subscribing without orderBy');

              if (unsubscribe) unsubscribe();

              unsubscribe = firestore()
                .collection('mediaComments')
                .where('mediaId', '==', mediaId)
                .where('mediaType', '==', mediaType)
                .onSnapshot(
                  snapshot => {
                    console.log('[MediaCommentsService] Real-time update (no orderBy):', snapshot.docs.length, 'comments');
                    const comments = snapshot.docs.map(doc => ({
                      id: doc.id,
                      ...doc.data(),
                    } as MediaComment));
                    // Sort manually
                    comments.sort((a, b) => a.createdAt - b.createdAt);
                    onUpdate(comments);
                  },
                  fallbackError => {
                    console.error('[MediaCommentsService] Fallback subscription error:', fallbackError);
                    onUpdate([]);
                  }
                );
            } else {
              // Other error - return empty
              onUpdate([]);
            }
          }
        );

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('[MediaCommentsService] Error setting up subscription:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(commentId: string, text: string): Promise<void> {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    const commentDoc = await firestore()
      .collection('mediaComments')
      .doc(commentId)
      .get();

    if (!commentDoc.exists) {
      throw new Error('Comment not found');
    }

    const commentData = commentDoc.data();
    if (commentData?.userId !== currentUser.uid) {
      throw new Error('Not authorized to edit this comment');
    }

    await firestore()
      .collection('mediaComments')
      .doc(commentId)
      .update({
        text,
        updatedAt: Date.now(),
        isEdited: true,
      });
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string): Promise<void> {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    const commentDoc = await firestore()
      .collection('mediaComments')
      .doc(commentId)
      .get();

    if (!commentDoc.exists) {
      throw new Error('Comment not found');
    }

    const commentData = commentDoc.data();
    if (commentData?.userId !== currentUser.uid) {
      throw new Error('Not authorized to delete this comment');
    }

    // Check if this comment has replies
    const repliesSnapshot = await firestore()
      .collection('mediaComments')
      .where('parentCommentId', '==', commentId)
      .limit(1)
      .get();

    if (!repliesSnapshot.empty) {
      throw new Error('Cannot delete comment with replies. Please delete replies first.');
    }

    // If this is a reply, decrement parent's reply count
    if (commentData.parentCommentId) {
      try {
        await firestore()
          .collection('mediaComments')
          .doc(commentData.parentCommentId)
          .update({
            repliesCount: firestore.FieldValue.increment(-1),
          });
      } catch (error) {
        console.error('[MediaCommentsService] Error updating parent reply count:', error);
        // Continue with deletion anyway
      }
    }

    // Delete the comment
    await firestore()
      .collection('mediaComments')
      .doc(commentId)
      .delete();

    // Update media's comment count
    await this.updateMediaCommentCount(
      commentData.mediaId,
      commentData.mediaType,
      -1
    );
  }

  /**
   * Get comment count for a media
   */
  static async getCommentCount(
    mediaId: string,
    mediaType: MediaType
  ): Promise<number> {
    const snapshot = await firestore()
      .collection('mediaComments')
      .where('mediaId', '==', mediaId)
      .where('mediaType', '==', mediaType)
      .get();

    return snapshot.size;
  }

  /**
   * Get unread comment notifications for user's shared media
   */
  static async getUnreadComments(userId: string): Promise<CommentNotification[]> {
    const snapshot = await firestore()
      .collection('commentNotifications')
      .where('recipientId', '==', userId)
      .where('unreadCount', '>', 0)
      .orderBy('lastCommentAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      ...doc.data(),
    } as CommentNotification));
  }

  /**
   * Mark comments as read for a media
   */
  static async markCommentsAsRead(
    mediaId: string,
    mediaType: MediaType
  ): Promise<void> {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const notificationId = `${currentUser.uid}_${mediaType}_${mediaId}`;

    await firestore()
      .collection('commentNotifications')
      .doc(notificationId)
      .set({
        unreadCount: 0,
      }, { merge: true });
  }

  /**
   * Update media's comment stats (count, last comment info)
   */
  private static async updateMediaCommentStats(
    mediaId: string,
    mediaType: MediaType,
    commenterId: string,
    commentText: string
  ): Promise<void> {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    // Determine the collection based on media type
    let collection = '';
    let mediaOwnerId = '';

    if (mediaType === 'photo') {
      const photoDoc = await firestore().collection('photos').doc(mediaId).get();
      const photoData = photoDoc.data();
      mediaOwnerId = photoData?.userId || '';
      collection = 'photos';
    } else if (mediaType === 'video') {
      const videoDoc = await firestore().collection('videos').doc(mediaId).get();
      const videoData = videoDoc.data();
      mediaOwnerId = videoData?.uploadedBy || '';
      collection = 'videos';
    } else if (mediaType === 'note') {
      const noteDoc = await firestore().collection('notes').doc(mediaId).get();
      const noteData = noteDoc.data();
      mediaOwnerId = noteData?.userId || '';
      collection = 'notes';
    }

    if (!collection || !mediaOwnerId) return;

    // Update media document with comment count
    await firestore()
      .collection(collection)
      .doc(mediaId)
      .update({
        commentCount: firestore.FieldValue.increment(1),
        lastCommentAt: Date.now(),
      });

    // If commenter is not the owner, create/update notification
    if (commenterId !== mediaOwnerId) {
      const notificationId = `${mediaOwnerId}_${mediaType}_${mediaId}`;

      await firestore()
        .collection('commentNotifications')
        .doc(notificationId)
        .set({
          mediaId,
          mediaType,
          recipientId: mediaOwnerId,
          unreadCount: firestore.FieldValue.increment(1),
          lastCommentAt: Date.now(),
          lastCommentBy: commenterId,
          lastCommentText: commentText.substring(0, 100),
        }, { merge: true });
    }
  }

  /**
   * Update media's comment count
   */
  private static async updateMediaCommentCount(
    mediaId: string,
    mediaType: MediaType,
    delta: number
  ): Promise<void> {
    let collection = '';

    if (mediaType === 'photo') collection = 'photos';
    else if (mediaType === 'video') collection = 'videos';
    else if (mediaType === 'note') collection = 'notes';

    if (!collection) return;

    await firestore()
      .collection(collection)
      .doc(mediaId)
      .update({
        commentCount: firestore.FieldValue.increment(delta),
      });
  }
}

export default MediaCommentsService;
