import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Note, NotesFilter, NotesSortOption, NotesViewMode, NoteTemplate } from '../types/notes';
import NotesService from '../services/NotesService';
import { useApp } from './AppContext';
import firestore from '@react-native-firebase/firestore';

interface NotesContextType {
  // Notes data
  notes: Note[];
  sharedNotes: Note[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;

  // View settings
  viewMode: NotesViewMode;
  filter: NotesFilter;
  sortOption: NotesSortOption;

  // Actions
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'>) => Promise<string>;
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  shareNote: (noteId: string, visibility: 'shared' | 'view-only') => Promise<void>;
  unshareNote: (noteId: string) => Promise<void>;
  addReaction: (noteId: string, reaction: string, isSharedNote?: boolean) => Promise<void>;
  addComment: (noteId: string, content: string, isSharedNote?: boolean) => Promise<void>;

  // Filters and sorting
  setFilter: (filter: NotesFilter) => void;
  setSortOption: (sort: NotesSortOption) => void;
  setViewMode: (viewMode: NotesViewMode) => void;
  searchNotes: (query: string) => void;
  clearSearch: () => void;

  // Utility
  refreshNotes: () => Promise<void>;
  getFilteredNotes: () => Note[];
  getCoupleId: () => string | null;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
  children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
  const { user } = useApp();
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // View settings
  const [viewMode, setViewModeState] = useState<NotesViewMode>({
    layout: 'grid',
    cardSize: 'medium',
    showPreviews: true,
  });

  const [filter, setFilterState] = useState<NotesFilter>({
    isArchived: false, // Don't show archived by default
  });

  const [sortOption, setSortOptionState] = useState<NotesSortOption>({
    field: 'updatedAt',
    direction: 'desc',
  });

  // Real-time listeners using local storage
  useEffect(() => {
    if (!user?.id) return;

    setIsLoading(true);

    // Subscribe to local notes changes
    const unsubscribeNotes = NotesService.subscribeToLocalNotes(
      user.id,
      (notesData) => {
        setNotes(notesData);
        setIsLoading(false);
        setHasError(false);
      },
      filter
    );

    // Listen to shared notes from Firebase if user has a partner
    let unsubscribeSharedNotes: (() => void) | undefined;
    if (user.partnerId) {
      const coupleId = generateCoupleId(user.id, user.partnerId);
      unsubscribeSharedNotes = NotesService.getSharedNotes(coupleId)
        .onSnapshot(
          (snapshot) => {
            const sharedNotesData = snapshot.docs.map(doc =>
              NotesService.convertFirebaseNote({ id: doc.id, ...doc.data() } as any)
            );
            setSharedNotes(sharedNotesData);
          },
          (error) => {
            // Silently ignore permission errors
            if (error.code !== 'permission-denied') {
              console.error('Error listening to shared notes:', error);
            }
          }
        );
    }

    return () => {
      unsubscribeNotes();
      if (unsubscribeSharedNotes) {
        unsubscribeSharedNotes();
      }
    };
  }, [user?.id, user?.partnerId]);

  // Actions
  const createNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
        ...noteData,
        authorId: user.id,
        authorName: user.name,
        partnerId: user.partnerId,
        wordCount: countWords(noteData.content),
        characterCount: noteData.content.length,
      };

      const noteId = await NotesService.createNote(newNote);
      return noteId;
    } catch (error) {
      console.error('Error creating note:', error);
      setHasError(true);
      setErrorMessage('Erreur lors de la création de la note');
      throw error;
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Note>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update word and character count if content changed
      if (updates.content) {
        updates.wordCount = countWords(updates.content);
        updates.characterCount = updates.content.length;
      }

      await NotesService.updateNote(user.id, noteId, updates);
    } catch (error) {
      console.error('Error updating note:', error);
      setHasError(true);
      setErrorMessage('Erreur lors de la mise à jour de la note');
      throw error;
    }
  };

  const deleteNote = async (noteId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      await NotesService.deleteNote(user.id, noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
      setHasError(true);
      setErrorMessage('Erreur lors de la suppression de la note');
      throw error;
    }
  };

  const shareNote = async (noteId: string, visibility: 'shared' | 'view-only'): Promise<void> => {
    if (!user?.partnerId) throw new Error('No partner to share with');

    try {
      await NotesService.shareNoteWithPartner(user.id, noteId, user.partnerId, visibility);
    } catch (error) {
      console.error('Error sharing note:', error);
      setHasError(true);
      setErrorMessage('Erreur lors du partage de la note');
      throw error;
    }
  };

  const unshareNote = async (noteId: string): Promise<void> => {
    if (!user?.partnerId) throw new Error('No partner to unshare with');

    try {
      await NotesService.unshareNote(user.id, noteId, user.partnerId);
    } catch (error) {
      console.error('Error unsharing note:', error);
      setHasError(true);
      setErrorMessage('Erreur lors de l\'annulation du partage');
      throw error;
    }
  };

  const addReaction = async (noteId: string, reaction: string, isSharedNote = false): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const coupleId = user.partnerId ? generateCoupleId(user.id, user.partnerId) : undefined;
      await NotesService.addReaction(user.id, noteId, reaction as any, isSharedNote, coupleId);
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  };

  const addComment = async (noteId: string, content: string, isSharedNote = false): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const coupleId = user.partnerId ? generateCoupleId(user.id, user.partnerId) : undefined;
      await NotesService.addComment(user.id, user.name, noteId, content, isSharedNote, coupleId);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const setFilter = (newFilter: NotesFilter) => {
    setFilterState({ ...filter, ...newFilter });
  };

  const setSortOption = (sort: NotesSortOption) => {
    setSortOptionState(sort);
  };

  const setViewMode = (mode: NotesViewMode) => {
    setViewModeState(mode);
  };

  const searchNotes = (query: string) => {
    setFilter({ ...filter, searchQuery: query });
  };

  const clearSearch = () => {
    const { searchQuery, ...filterWithoutSearch } = filter;
    setFilter(filterWithoutSearch);
  };

  const refreshNotes = async (): Promise<void> => {
    // Real-time listeners handle refreshing automatically
    return Promise.resolve();
  };

  const getFilteredNotes = (): Note[] => {
    let filteredNotes = [...notes];

    // Apply filters
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filter.category) {
      filteredNotes = filteredNotes.filter(note => note.category === filter.category);
    }

    if (filter.tags && filter.tags.length > 0) {
      filteredNotes = filteredNotes.filter(note =>
        filter.tags!.some(tag => note.tags.includes(tag))
      );
    }

    if (filter.visibility) {
      filteredNotes = filteredNotes.filter(note => note.visibility === filter.visibility);
    }

    if (filter.isPinned !== undefined) {
      filteredNotes = filteredNotes.filter(note => note.isPinned === filter.isPinned);
    }

    if (filter.isFavorite !== undefined) {
      filteredNotes = filteredNotes.filter(note => note.isFavorite === filter.isFavorite);
    }

    if (filter.isArchived !== undefined) {
      filteredNotes = filteredNotes.filter(note => note.isArchived === filter.isArchived);
    }

    // Apply sorting
    filteredNotes.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortOption.field) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'isPinned':
          aValue = a.isPinned ? 1 : 0;
          bValue = b.isPinned ? 1 : 0;
          break;
        default:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
      }

      if (sortOption.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pinned notes always come first regardless of sort
    const pinnedNotes = filteredNotes.filter(note => note.isPinned);
    const unpinnedNotes = filteredNotes.filter(note => !note.isPinned);

    return [...pinnedNotes, ...unpinnedNotes];
  };

  const getCoupleId = (): string | null => {
    if (!user?.partnerId) return null;
    return generateCoupleId(user.id, user.partnerId);
  };

  // Helper functions
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const generateCoupleId = (user1Id: string, user2Id: string): string => {
    return [user1Id, user2Id].sort().join('_');
  };

  const value: NotesContextType = {
    notes,
    sharedNotes,
    isLoading,
    hasError,
    errorMessage,
    viewMode,
    filter,
    sortOption,
    createNote,
    updateNote,
    deleteNote,
    shareNote,
    unshareNote,
    addReaction,
    addComment,
    setFilter,
    setSortOption,
    setViewMode,
    searchNotes,
    clearSearch,
    refreshNotes,
    getFilteredNotes,
    getCoupleId,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = (): NotesContextType => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export default NotesContext;