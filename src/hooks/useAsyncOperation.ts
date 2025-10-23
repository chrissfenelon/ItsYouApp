import { useState, useCallback } from 'react';
import ToastService from '../services/ToastService';

/**
 * Interface pour le résultat d'une opération asynchrone
 */
export interface UseAsyncOperationResult<T> {
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Options de configuration pour useAsyncOperation
 */
export interface UseAsyncOperationOptions {
  showErrorToast?: boolean;
  errorMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour gérer les états de chargement et d'erreur des opérations asynchrones
 *
 * Simplifie la gestion des états loading/error et intègre automatiquement
 * le service de notifications toast pour les erreurs.
 *
 * @example
 * const { loading, error, execute, reset } = useAsyncOperation(
 *   async (userId: string) => {
 *     return await fetchUserData(userId);
 *   },
 *   {
 *     showErrorToast: true,
 *     errorMessage: 'Erreur lors du chargement des données',
 *     onSuccess: (data) => console.log('Succès:', data),
 *   }
 * );
 *
 * // Utilisation
 * <Button onPress={() => execute(userId)} disabled={loading}>
 *   {loading ? 'Chargement...' : 'Charger'}
 * </Button>
 */
export function useAsyncOperation<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions = {}
): UseAsyncOperationResult<T> {
  const {
    showErrorToast = true,
    errorMessage = 'Une erreur est survenue',
    onSuccess,
    onError,
  } = options;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Exécute l'opération asynchrone avec gestion automatique des états
   */
  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        // Afficher un toast d'erreur si configuré
        if (showErrorToast) {
          ToastService.error(errorMessage);
        }

        // Callback d'erreur personnalisé
        if (onError) {
          onError(error);
        }

        console.error('useAsyncOperation error:', error);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction, showErrorToast, errorMessage, onSuccess, onError]
  );

  /**
   * Réinitialise les états d'erreur et de chargement
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset,
  };
}

export default useAsyncOperation;
