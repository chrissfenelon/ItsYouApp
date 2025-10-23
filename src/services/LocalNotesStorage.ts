import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/notes';

const NOTES_STORAGE_KEY = '@notes_local';
const NOTES_INDEX_KEY = '@notes_index';
const SHARED_NOTES_INDEX_KEY = '@notes_shared_index';

interface NotesIndex {
  [noteId: string]: {
    isShared: boolean;
    lastModified: number;
  };
}

class LocalNotesStorage {
  /**
   * Save a note to local storage
   */
  async saveNote(note: Note): Promise<void> {
    try {
      console.log('LocalNotesStorage: Saving note locally...', note.id);

      // Save note data
      const noteKey = `${NOTES_STORAGE_KEY}_${note.id}`;
      await AsyncStorage.setItem(noteKey, JSON.stringify(note));

      // Update index
      await this.updateIndex(note.id, false);

      console.log('LocalNotesStorage: Note saved successfully');
    } catch (error) {
      console.error('LocalNotesStorage: Error saving note:', error);
      throw new Error('Failed to save note locally');
    }
  }

  /**
   * Get a note from local storage
   */
  async getNote(noteId: string): Promise<Note | null> {
    try {
      const noteKey = `${NOTES_STORAGE_KEY}_${noteId}`;
      const noteData = await AsyncStorage.getItem(noteKey);

      if (!noteData) {
        return null;
      }

      const note = JSON.parse(noteData);

      // Convert date strings back to Date objects
      return {
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
        lastViewedAt: note.lastViewedAt ? new Date(note.lastViewedAt) : undefined,
        reminderDate: note.reminderDate ? new Date(note.reminderDate) : undefined,
        reactions: note.reactions?.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
        })) || [],
        comments: note.comments?.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(c.createdAt),
        })) || [],
      };
    } catch (error) {
      console.error('LocalNotesStorage: Error getting note:', error);
      return null;
    }
  }

  /**
   * Get all notes from local storage
   */
  async getAllNotes(): Promise<Note[]> {
    try {
      const index = await this.getIndex();
      const noteIds = Object.keys(index);

      const notes: Note[] = [];
      for (const noteId of noteIds) {
        const note = await this.getNote(noteId);
        if (note) {
          notes.push(note);
        }
      }

      // Sort by createdAt descending
      return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('LocalNotesStorage: Error getting all notes:', error);
      return [];
    }
  }

  /**
   * Update a note in local storage
   */
  async updateNote(noteId: string, updates: Partial<Note>): Promise<void> {
    try {
      const existingNote = await this.getNote(noteId);
      if (!existingNote) {
        throw new Error('Note not found');
      }

      const updatedNote: Note = {
        ...existingNote,
        ...updates,
        updatedAt: new Date(),
      };

      await this.saveNote(updatedNote);
    } catch (error) {
      console.error('LocalNotesStorage: Error updating note:', error);
      throw error;
    }
  }

  /**
   * Delete a note from local storage
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      console.log('LocalNotesStorage: Deleting note...', noteId);

      // Delete note data
      const noteKey = `${NOTES_STORAGE_KEY}_${noteId}`;
      await AsyncStorage.removeItem(noteKey);

      // Remove from index
      await this.removeFromIndex(noteId);

      console.log('LocalNotesStorage: Note deleted successfully');
    } catch (error) {
      console.error('LocalNotesStorage: Error deleting note:', error);
      throw error;
    }
  }

  /**
   * Mark a note as shared
   */
  async markAsShared(noteId: string): Promise<void> {
    try {
      await this.updateIndex(noteId, true);
    } catch (error) {
      console.error('LocalNotesStorage: Error marking note as shared:', error);
      throw error;
    }
  }

  /**
   * Mark a note as not shared
   */
  async markAsUnshared(noteId: string): Promise<void> {
    try {
      await this.updateIndex(noteId, false);
    } catch (error) {
      console.error('LocalNotesStorage: Error marking note as unshared:', error);
      throw error;
    }
  }

  /**
   * Check if a note is shared
   */
  async isShared(noteId: string): Promise<boolean> {
    try {
      const index = await this.getIndex();
      return index[noteId]?.isShared || false;
    } catch (error) {
      console.error('LocalNotesStorage: Error checking if note is shared:', error);
      return false;
    }
  }

  /**
   * Get all shared note IDs
   */
  async getSharedNoteIds(): Promise<string[]> {
    try {
      const index = await this.getIndex();
      return Object.keys(index).filter(id => index[id].isShared);
    } catch (error) {
      console.error('LocalNotesStorage: Error getting shared note IDs:', error);
      return [];
    }
  }

  /**
   * Search notes by title or content
   */
  async searchNotes(query: string): Promise<Note[]> {
    try {
      const allNotes = await this.getAllNotes();
      const lowerQuery = query.toLowerCase();

      return allNotes.filter(note =>
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery) ||
        note.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('LocalNotesStorage: Error searching notes:', error);
      return [];
    }
  }

  /**
   * Clear all notes from local storage
   */
  async clearAllNotes(): Promise<void> {
    try {
      const index = await this.getIndex();
      const noteIds = Object.keys(index);

      // Delete all note data
      for (const noteId of noteIds) {
        const noteKey = `${NOTES_STORAGE_KEY}_${noteId}`;
        await AsyncStorage.removeItem(noteKey);
      }

      // Clear index
      await AsyncStorage.removeItem(NOTES_INDEX_KEY);
      await AsyncStorage.removeItem(SHARED_NOTES_INDEX_KEY);

      console.log('LocalNotesStorage: All notes cleared');
    } catch (error) {
      console.error('LocalNotesStorage: Error clearing all notes:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalNotes: number;
    sharedNotes: number;
    privateNotes: number;
  }> {
    try {
      const index = await this.getIndex();
      const noteIds = Object.keys(index);
      const sharedNotes = noteIds.filter(id => index[id].isShared);

      return {
        totalNotes: noteIds.length,
        sharedNotes: sharedNotes.length,
        privateNotes: noteIds.length - sharedNotes.length,
      };
    } catch (error) {
      console.error('LocalNotesStorage: Error getting storage stats:', error);
      return {
        totalNotes: 0,
        sharedNotes: 0,
        privateNotes: 0,
      };
    }
  }

  // Private helper methods

  private async getIndex(): Promise<NotesIndex> {
    try {
      const indexData = await AsyncStorage.getItem(NOTES_INDEX_KEY);
      return indexData ? JSON.parse(indexData) : {};
    } catch (error) {
      console.error('LocalNotesStorage: Error getting index:', error);
      return {};
    }
  }

  private async updateIndex(noteId: string, isShared: boolean): Promise<void> {
    try {
      const index = await this.getIndex();
      index[noteId] = {
        isShared,
        lastModified: Date.now(),
      };
      await AsyncStorage.setItem(NOTES_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('LocalNotesStorage: Error updating index:', error);
      throw error;
    }
  }

  private async removeFromIndex(noteId: string): Promise<void> {
    try {
      const index = await this.getIndex();
      delete index[noteId];
      await AsyncStorage.setItem(NOTES_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('LocalNotesStorage: Error removing from index:', error);
      throw error;
    }
  }
}

export default new LocalNotesStorage();
