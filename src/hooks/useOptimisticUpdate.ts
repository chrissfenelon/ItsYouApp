import { useState, useCallback, useRef } from 'react';
import ToastService from '../services/ToastService';

/**
 * Options de configuration pour useOptimisticUpdate
 */
export interface UseOptimisticUpdateOptions<T> {
  onError?: (error: Error, rollbackData: T) => void;
  showErrorToast?: boolean;
  errorMessage?: string;
}

/**
 * Interface pour le résultat du hook useOptimisticUpdate
 */
export interface UseOptimisticUpdateResult<T> {
  data: T;
  update: (
    optimisticData: T,
    serverUpdate: () => Promise<T>
  ) => Promise<void>;
  isUpdating: boolean;
  error: Error | null;
  reset: (initialData: T) => void;
}

/**
 * Hook pour les mises à jour optimistes avec rollback en cas d'erreur
 *
 * Permet de mettre à jour l'UI immédiatement (optimistic update) pendant
 * qu'une requête serveur est en cours. En cas d'erreur, les données sont
 * automatiquement restaurées à leur état précédent.
 *
 * @example
 * const { data, update, isUpdating, error } = useOptimisticUpdate(initialMessages);
 *
 * const handleLike = async (messageId: string) => {
 *   await update(
 *     // Mise à jour optimiste
 *     messages.map(msg =>
 *       msg.id === messageId
 *         ? { ...msg, likes: msg.likes + 1, isLiked: true }
 *         : msg
 *     ),
 *     // Requête serveur
 *     () => likeMessageOnServer(messageId)
 *   );
 * };
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  options: UseOptimisticUpdateOptions<T> = {}
): UseOptimisticUpdateResult<T> {
  const {
    onError,
    showErrorToast = true,
    errorMessage = 'Une erreur est survenue lors de la mise à jour',
  } = options;

  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Référence pour stocker les données avant la mise à jour optimiste
  const previousDataRef = useRef<T>(initialData);

  /**
   * Effectue une mise à jour optimiste avec rollback en cas d'erreur
   *
   * @param optimisticData - Les données à afficher immédiatement
   * @param serverUpdate - La fonction qui effectue la mise à jour côté serveur
   */
  const update = useCallback(
    async (
      optimisticData: T,
      serverUpdate: () => Promise<T>
    ): Promise<void> => {
      // Sauvegarder les données actuelles pour le rollback
      previousDataRef.current = data;

      // Mettre à jour immédiatement avec les données optimistes
      setData(optimisticData);
      setIsUpdating(true);
      setError(null);

      try {
        // Effectuer la mise à jour côté serveur
        const serverData = await serverUpdate();

        // Mettre à jour avec les données confirmées du serveur
        setData(serverData);

        console.log('✅ Mise à jour optimiste réussie');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        // Rollback : restaurer les données précédentes
        setData(previousDataRef.current);
        setError(error);

        // Afficher un toast d'erreur si configuré
        if (showErrorToast) {
          ToastService.error(errorMessage);
        }

        // Callback d'erreur personnalisé
        if (onError) {
          onError(error, previousDataRef.current);
        }

        console.error('❌ Erreur lors de la mise à jour optimiste:', error);
        console.log('🔄 Rollback effectué');
      } finally {
        setIsUpdating(false);
      }
    },
    [data, showErrorToast, errorMessage, onError]
  );

  /**
   * Réinitialise les données à une nouvelle valeur
   *
   * @param newData - Les nouvelles données initiales
   */
  const reset = useCallback((newData: T) => {
    setData(newData);
    previousDataRef.current = newData;
    setError(null);
    setIsUpdating(false);
  }, []);

  return {
    data,
    update,
    isUpdating,
    error,
    reset,
  };
}

/**
 * Variante du hook pour les listes (tableaux)
 *
 * Fournit des méthodes pratiques pour ajouter, modifier et supprimer des éléments
 * d'une liste avec des mises à jour optimistes.
 *
 * @example
 * const { data: messages, addItem, updateItem, removeItem } = useOptimisticList(
 *   initialMessages,
 *   (msg) => msg.id
 * );
 *
 * // Ajouter un message
 * await addItem(
 *   newMessage,
 *   () => sendMessageToServer(newMessage)
 * );
 *
 * // Modifier un message
 * await updateItem(
 *   messageId,
 *   { content: 'Nouveau contenu' },
 *   () => updateMessageOnServer(messageId, { content: 'Nouveau contenu' })
 * );
 */
export function useOptimisticList<T>(
  initialData: T[],
  getItemId: (item: T) => string | number,
  options: UseOptimisticUpdateOptions<T[]> = {}
) {
  const { data, update, isUpdating, error, reset } = useOptimisticUpdate<T[]>(
    initialData,
    options
  );

  /**
   * Ajoute un élément à la liste de manière optimiste
   */
  const addItem = useCallback(
    async (
      newItem: T,
      serverUpdate: () => Promise<T[] | T>
    ): Promise<void> => {
      const optimisticData = [...data, newItem];

      await update(optimisticData, async () => {
        const result = await serverUpdate();
        // Si le serveur renvoie juste l'élément ajouté, l'ajouter à la liste
        return Array.isArray(result) ? result : [...data, result];
      });
    },
    [data, update]
  );

  /**
   * Met à jour un élément de la liste de manière optimiste
   */
  const updateItem = useCallback(
    async (
      itemId: string | number,
      updates: Partial<T>,
      serverUpdate: () => Promise<T[] | T>
    ): Promise<void> => {
      const optimisticData = data.map((item) =>
        getItemId(item) === itemId ? { ...item, ...updates } : item
      );

      await update(optimisticData, async () => {
        const result = await serverUpdate();
        // Si le serveur renvoie juste l'élément mis à jour, l'intégrer dans la liste
        if (!Array.isArray(result)) {
          return data.map((item) =>
            getItemId(item) === itemId ? result : item
          );
        }
        return result;
      });
    },
    [data, update, getItemId]
  );

  /**
   * Supprime un élément de la liste de manière optimiste
   */
  const removeItem = useCallback(
    async (
      itemId: string | number,
      serverUpdate: () => Promise<T[] | void>
    ): Promise<void> => {
      const optimisticData = data.filter(
        (item) => getItemId(item) !== itemId
      );

      await update(optimisticData, async () => {
        const result = await serverUpdate();
        // Si le serveur renvoie la liste mise à jour, l'utiliser
        return Array.isArray(result) ? result : optimisticData;
      });
    },
    [data, update, getItemId]
  );

  return {
    data,
    addItem,
    updateItem,
    removeItem,
    isUpdating,
    error,
    reset,
  };
}

export default useOptimisticUpdate;
