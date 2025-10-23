import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useMusic } from '../context/MusicCon';
import { useGallery } from '../context/GalleryContext';
import { useNotes } from '../context/NotesContext';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
}

export const useAppLoading = (): LoadingState => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    message: 'Initialisation...',
  });

  const { user } = useApp();
  const { songs } = useMusic();
  const { photos } = useGallery();
  const { notes } = useNotes();

  useEffect(() => {
    let progress = 0;
    let message = 'Initialisation...';

    // Check app context (user data)
    if (user !== undefined) {
      progress += 25;
      message = 'Chargement des photos...';
    }

    // Check gallery context
    if (photos !== undefined) {
      progress += 25;
      message = 'Chargement de la musique...';
    }

    // Check music context
    if (songs !== undefined) {
      progress += 25;
      message = 'Chargement des notes...';
    }

    // Check notes context
    if (notes !== undefined) {
      progress += 25;
      message = 'Presque prêt...';
    }

    const isLoading = progress < 100;

    setLoadingState({
      isLoading,
      progress,
      message,
    });
  }, [user, songs, photos, notes]);

  return loadingState;
};
