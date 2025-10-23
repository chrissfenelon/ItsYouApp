import firestore from '@react-native-firebase/firestore';
import { Note, FirebaseNote, NoteComment, NoteReaction, NotesFilter, CoupleNotesMetadata } from '../types/notes';
import LocalNotesStorage from './LocalNotesStorage';
import { fetchWithRetry } from '../utils/retryUtils';

export class NotesService {
  // Collection references - Use global 'notes' collection for shared notes only
  private static getNotesRef() {
    return firestore().collection('notes');
  }

  private static getCoupleNotesRef(coupleId: string) {
    return firestore().collection('couples').doc(coupleId).collection('sharedNotes');
  }

  private static getCoupleMetadataRef(coupleId: string) {
    return firestore().collection('couples').doc(coupleId);
  }

  // Create a new note (stored locally AND in Firestore for persistence)
  static async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('NotesService: Creating note...', {
        authorId: note.authorId,
        title: note.title,
        isSharedWithPartner: note.isSharedWithPartner,
      });

      // Generate unique note ID
      const noteId = `note_${note.authorId}_${Date.now()}`;
      const now = new Date();

      // Create complete note object
      const completeNote: Note = {
        id: noteId,
        ...note,
        category: note.category || null,
        partnerId: note.partnerId || null,
        lastViewedAt: undefined,
        reminderDate: undefined,
        location: note.location || null,
        attachments: note.attachments || [],
        mood: note.mood || null,
        template: note.template || null,
        reactions: note.reactions || [],
        comments: note.comments || [],
        createdAt: now,
        updatedAt: now,
      };

      // Save to local storage first (for offline support)
      await LocalNotesStorage.saveNote(completeNote);
      console.log('NotesService: Note saved locally with ID:', noteId);

      // ALWAYS save to Firestore for cloud backup and recovery (with retry)
      const cleanNote = this.cleanNoteData(completeNote);
      await fetchWithRetry(() =>
        firestore()
          .collection('users')
          .doc(note.authorId)
          .collection('notes')
          .doc(noteId)
          .set({
            ...cleanNote,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          })
      );
      console.log('NotesService: Note saved to Firestore for backup');

      // If shared with partner, also upload to shared collection
      if (note.isSharedWithPartner && note.partnerId) {
        console.log('NotesService: Note is shared, uploading to shared collection...');
        await this.uploadSharedNote(completeNote);
        await LocalNotesStorage.markAsShared(noteId);
      }

      return noteId;
    } catch (error) {
      console.error('NotesService: Error creating note:', error);
      if (error instanceof Error) {
        console.error('NotesService: Error message:', error.message);
        console.error('NotesService: Error stack:', error.stack);
      }
      throw error;
    }
  }

  // Update an existing note
  static async updateNote(userId: string, noteId: string, updates: Partial<Note>): Promise<void> {
    try {
      console.log('NotesService: Updating note...', noteId);

      // Check if note exists in local storage
      const existingNote = await LocalNotesStorage.getNote(noteId);
      const isOwnNote = existingNote !== null;

      if (isOwnNote) {
        // Update in local storage for user's own notes
        await LocalNotesStorage.updateNote(noteId, updates);
        console.log('NotesService: Note updated locally');

        // Update in user's Firestore collection (with retry)
        const cleanUpdates = this.cleanNoteData(updates);
        await fetchWithRetry(() =>
          firestore()
            .collection('users')
            .doc(userId)
            .collection('notes')
            .doc(noteId)
            .update({
              ...cleanUpdates,
              updatedAt: firestore.FieldValue.serverTimestamp(),
            })
        );
        console.log('NotesService: Note updated in user Firestore');

        // Check if note is shared
        const isShared = await LocalNotesStorage.isShared(noteId);
        if (isShared && existingNote) {
          console.log('NotesService: Note is shared, updating in shared collections...');
          const updatedNote = { ...existingNote, ...updates, updatedAt: new Date() };
          await this.updateSharedNoteInFirebase(updatedNote);
        }
      } else {
        // This is a partner's shared note - update only in Firebase shared collections
        console.log('NotesService: Updating partner\'s shared note in Firebase...');
        const cleanUpdates = this.cleanNoteData(updates);

        // Update in global notes collection
        await firestore()
          .collection('notes')
          .doc(noteId)
          .update({
            ...cleanUpdates,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });

        console.log('NotesService: Partner note updated in Firebase');
      }
    } catch (error) {
      console.error('NotesService: Error updating note:', error);
      throw error;
    }
  }

  // Delete a note
  static async deleteNote(userId: string, noteId: string): Promise<void> {
    try {
      console.log('NotesService: Deleting note...', noteId);

      // Check if note is shared before deleting
      const isShared = await LocalNotesStorage.isShared(noteId);
      const note = await LocalNotesStorage.getNote(noteId);

      // Delete from local storage
      await LocalNotesStorage.deleteNote(noteId);
      console.log('NotesService: Note deleted locally');

      // ALWAYS delete from user's Firestore collection (with retry)
      await fetchWithRetry(() =>
        firestore()
          .collection('users')
          .doc(userId)
          .collection('notes')
          .doc(noteId)
          .delete()
      );
      console.log('NotesService: Note deleted from Firestore');

      // If shared, also delete from shared collections
      if (isShared && note?.partnerId) {
        console.log('NotesService: Deleting shared note from shared collections...');
        const coupleId = this.generateCoupleId(userId, note.partnerId);
        await this.removeFromSharedNotes(coupleId, noteId);

        // Also delete from global notes collection
        await this.getNotesRef().doc(noteId).delete();
      }
    } catch (error) {
      console.error('NotesService: Error deleting note:', error);
      throw error;
    }
  }

  // Get user's notes from local storage
  static async getUserNotesLocal(userId: string, filters?: NotesFilter): Promise<Note[]> {
    try {
      let notes = await LocalNotesStorage.getAllNotes();

      // Filter by user
      notes = notes.filter(note => note.authorId === userId);

      // Apply filters
      if (filters) {
        if (filters.category) {
          notes = notes.filter(note => note.category === filters.category);
        }
        if (filters.visibility) {
          notes = notes.filter(note => note.visibility === filters.visibility);
        }
        if (filters.isPinned !== undefined) {
          notes = notes.filter(note => note.isPinned === filters.isPinned);
        }
        if (filters.isFavorite !== undefined) {
          notes = notes.filter(note => note.isFavorite === filters.isFavorite);
        }
        if (filters.isArchived !== undefined) {
          notes = notes.filter(note => note.isArchived === filters.isArchived);
        }
      }

      return notes;
    } catch (error) {
      console.error('NotesService: Error getting user notes:', error);
      return [];
    }
  }

  // Subscribe to local notes changes (polling-based since AsyncStorage doesn't have real-time listeners)
  static subscribeToLocalNotes(
    userId: string,
    onUpdate: (notes: Note[]) => void,
    filters?: NotesFilter
  ): () => void {
    let isCancelled = false;

    const poll = async () => {
      if (!isCancelled) {
        const notes = await this.getUserNotesLocal(userId, filters);
        onUpdate(notes);
        setTimeout(poll, 2000); // Poll every 2 seconds
      }
    };

    poll();

    return () => {
      isCancelled = true;
    };
  }

  // Get shared notes for a couple
  static getSharedNotes(coupleId: string) {
    return this.getCoupleNotesRef(coupleId).orderBy('updatedAt', 'desc');
  }

  // Search notes
  static searchNotes(userId: string, searchQuery: string) {
    // Firestore doesn't support full-text search, so we'll get all notes and filter client-side
    return this.getNotesRef()
      .where('authorId', '==', userId)
      .where('title', '>=', searchQuery)
      .where('title', '<=', searchQuery + '\uf8ff');
  }

  // Add reaction to a note
  static async addReaction(
    userId: string,
    noteId: string,
    reaction: NoteReaction['reaction'],
    isSharedNote = false,
    coupleId?: string
  ): Promise<void> {
    try {
      const reactionData: NoteReaction = {
        userId,
        reaction,
        createdAt: new Date(),
      };

      const noteRef = this.getNotesRef().doc(noteId);

      await noteRef.update({
        reactions: firestore.FieldValue.arrayUnion(reactionData),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Also update in shared collection if applicable
      if (isSharedNote && coupleId) {
        const sharedRef = this.getCoupleNotesRef(coupleId).doc(noteId);
        await sharedRef.update({
          reactions: firestore.FieldValue.arrayUnion(reactionData),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Add comment to a note
  static async addComment(
    userId: string,
    userName: string,
    noteId: string,
    content: string,
    isSharedNote = false,
    coupleId?: string
  ): Promise<void> {
    try {
      const comment: NoteComment = {
        id: firestore().collection('temp').doc().id, // Generate unique ID
        userId,
        userName,
        content,
        createdAt: new Date(),
      };

      const noteRef = this.getNotesRef().doc(noteId);

      await noteRef.update({
        comments: firestore.FieldValue.arrayUnion(comment),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Also update in shared collection if applicable
      if (isSharedNote && coupleId) {
        const sharedRef = this.getCoupleNotesRef(coupleId).doc(noteId);
        await sharedRef.update({
          comments: firestore.FieldValue.arrayUnion(comment),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Share note with partner
  static async shareNoteWithPartner(
    userId: string,
    noteId: string,
    partnerId: string,
    visibility: 'shared' | 'view-only' = 'shared'
  ): Promise<void> {
    try {
      console.log('NotesService: Sharing note with partner...', noteId);

      // Update the note's sharing settings locally
      await LocalNotesStorage.updateNote(noteId, {
        isSharedWithPartner: true,
        partnerId,
        visibility,
      });

      // Get the full note
      const note = await LocalNotesStorage.getNote(noteId);
      if (!note) {
        throw new Error('Note not found');
      }

      // Upload to Firebase
      await this.uploadSharedNote(note);

      // Mark as shared
      await LocalNotesStorage.markAsShared(noteId);

      console.log('NotesService: Note shared successfully');
    } catch (error) {
      console.error('NotesService: Error sharing note:', error);
      throw error;
    }
  }

  // Unshare note
  static async unshareNote(userId: string, noteId: string, partnerId: string): Promise<void> {
    try {
      console.log('NotesService: Unsharing note...', noteId);

      // Update locally
      await LocalNotesStorage.updateNote(noteId, {
        isSharedWithPartner: false,
        partnerId: null,
        visibility: 'private',
      });

      // Remove from Firebase
      const coupleId = this.generateCoupleId(userId, partnerId);
      await this.removeFromSharedNotes(coupleId, noteId);
      await this.getNotesRef().doc(noteId).delete();

      // Mark as not shared
      await LocalNotesStorage.markAsUnshared(noteId);

      console.log('NotesService: Note unshared successfully');
    } catch (error) {
      console.error('NotesService: Error unsharing note:', error);
      throw error;
    }
  }

  // Clean note data to remove undefined values for Firebase
  private static cleanNoteData(obj: any): any {
    const cleaned: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          // Recursively clean nested objects
          cleaned[key] = this.cleanNoteData(value);
        } else {
          cleaned[key] = value;
        }
      }
    }

    return cleaned;
  }

  // Upload a shared note to Firebase
  private static async uploadSharedNote(note: Note): Promise<void> {
    try {
      if (!note.partnerId) {
        throw new Error('Partner ID is required to share note');
      }

      const cleanNote = this.cleanNoteData({
        ...note,
        // Convert dates to Firestore timestamps for upload
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      });

      // Upload to global notes collection
      await this.getNotesRef().doc(note.id).set({
        ...cleanNote,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Add to couple's shared notes
      const coupleId = this.generateCoupleId(note.authorId, note.partnerId);
      await this.addToSharedNotes(coupleId, note);
    } catch (error) {
      console.error('NotesService: Error uploading shared note:', error);
      throw error;
    }
  }

  // Update a shared note in Firebase
  private static async updateSharedNoteInFirebase(note: Note): Promise<void> {
    try {
      if (!note.partnerId) {
        return;
      }

      const cleanNote = this.cleanNoteData(note);

      // Update in global notes collection
      await this.getNotesRef().doc(note.id).update({
        ...cleanNote,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update in couple's shared notes
      const coupleId = this.generateCoupleId(note.authorId, note.partnerId);
      await this.updateSharedNote(coupleId, note.id, cleanNote);
    } catch (error) {
      console.error('NotesService: Error updating shared note in Firebase:', error);
      throw error;
    }
  }

  // Private helper methods
  private static async addToSharedNotes(coupleId: string, note: Note): Promise<void> {
    try {
      const sharedRef = this.getCoupleNotesRef(coupleId).doc(note.id);

      // Remove undefined fields to avoid Firestore errors
      const cleanNote = this.cleanNoteData({
        ...note,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      await sharedRef.set(cleanNote);

      // Update couple metadata
      await this.updateCoupleMetadata(coupleId);
    } catch (error) {
      console.error('NotesService: Error adding to shared notes:', error);
      throw new Error('Impossible d\'ajouter la note partagée. Vérifiez votre connexion.');
    }
  }

  private static async updateSharedNote(coupleId: string, noteId: string, updates: Partial<Note>): Promise<void> {
    try {
      const sharedRef = this.getCoupleNotesRef(coupleId).doc(noteId);

      // Remove undefined fields to avoid Firestore errors
      const cleanUpdates = this.cleanNoteData({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      await sharedRef.update(cleanUpdates);
    } catch (error) {
      console.error('NotesService: Error updating shared note:', error);
      throw new Error('Impossible de mettre à jour la note partagée. Vérifiez votre connexion.');
    }
  }

  private static async removeFromSharedNotes(coupleId: string, noteId: string): Promise<void> {
    try {
      const sharedRef = this.getCoupleNotesRef(coupleId).doc(noteId);
      await sharedRef.delete();

      // Update couple metadata
      await this.updateCoupleMetadata(coupleId);
    } catch (error) {
      console.error('NotesService: Error removing from shared notes:', error);
      throw new Error('Impossible de supprimer la note partagée. Vérifiez votre connexion.');
    }
  }

  private static async updateCoupleMetadata(coupleId: string): Promise<void> {
    try {
      const metadataRef = this.getCoupleMetadataRef(coupleId);
      // Use set with merge to create the document if it doesn't exist
      await metadataRef.set({
        lastActivity: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('NotesService: Error updating couple metadata:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  private static generateCoupleId(user1Id: string, user2Id: string): string {
    // Generate consistent couple ID regardless of order
    return [user1Id, user2Id].sort().join('_');
  }

  // Initialize couple metadata
  static async initializeCoupleMetadata(
    user1Id: string,
    user2Id: string,
    user1Name: string,
    user2Name: string
  ): Promise<string> {
    try {
      const coupleId = this.generateCoupleId(user1Id, user2Id);
      const metadataRef = this.getCoupleMetadataRef(coupleId);

      const metadata: Omit<CoupleNotesMetadata, 'lastActivity'> & { lastActivity: any } = {
        coupleId,
        user1Id,
        user2Id,
        user1Name,
        user2Name,
        sharedNotesCount: 0,
        lastActivity: firestore.FieldValue.serverTimestamp(),
        isActive: true,
      };

      await metadataRef.set(metadata, { merge: true });
      return coupleId;
    } catch (error) {
      console.error('Error initializing couple metadata:', error);
      throw error;
    }
  }

  /**
   * Sync notes from Firestore to local storage on login
   * This allows users to recover their notes when they log in again
   */
  static async syncNotesFromFirestore(userId: string): Promise<number> {
    try {
      console.log('NotesService: Syncing notes from Firestore for user:', userId);

      // Get all notes from Firestore (with retry)
      const snapshot = await fetchWithRetry(() =>
        firestore()
          .collection('users')
          .doc(userId)
          .collection('notes')
          .get()
      );

      let syncedCount = 0;

      // Save each note to local storage
      for (const doc of snapshot.docs) {
        const firebaseNote = doc.data() as any;
        const note = this.convertFirebaseNote({ id: doc.id, ...firebaseNote } as FirebaseNote);

        // Save to local storage
        await LocalNotesStorage.saveNote(note);

        // Mark as shared if applicable
        if (note.isSharedWithPartner) {
          await LocalNotesStorage.markAsShared(note.id);
        }

        syncedCount++;
      }

      console.log(`NotesService: Synced ${syncedCount} notes from Firestore`);
      return syncedCount;
    } catch (error) {
      console.error('NotesService: Error syncing notes from Firestore:', error);
      throw error;
    }
  }

  // Convert Firestore timestamps to Date objects
  static convertFirebaseNote(firebaseNote: FirebaseNote): Note {
    const convertToDate = (value: any): Date => {
      if (!value) return new Date();
      if (value instanceof Date) return value;
      if (typeof value === 'object' && typeof value.toDate === 'function') {
        return value.toDate();
      }
      if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value);
      }
      return new Date();
    };

    const convertToDateOrUndefined = (value: any): Date | undefined => {
      if (!value) return undefined;
      if (value instanceof Date) return value;
      if (typeof value === 'object' && typeof value.toDate === 'function') {
        return value.toDate();
      }
      if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value);
      }
      return undefined;
    };

    return {
      ...firebaseNote,
      createdAt: convertToDate(firebaseNote.createdAt),
      updatedAt: convertToDate(firebaseNote.updatedAt),
      lastViewedAt: convertToDateOrUndefined(firebaseNote.lastViewedAt),
      reminderDate: convertToDateOrUndefined(firebaseNote.reminderDate),
      reactions: (firebaseNote.reactions || []).map(reaction => ({
        ...reaction,
        createdAt: convertToDate(reaction.createdAt),
      })),
      comments: (firebaseNote.comments || []).map(comment => ({
        ...comment,
        createdAt: convertToDate(comment.createdAt),
        updatedAt: convertToDate(comment.updatedAt || comment.createdAt),
      })),
    };
  }
}

export default NotesService;