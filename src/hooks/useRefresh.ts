import { useState, useCallback } from 'react';

export interface UseRefreshOptions {
  onRefresh: () => Promise<void>;
  initialRefreshing?: boolean;
}

export interface UseRefreshReturn {
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Hook pour gérer le Pull-to-Refresh
 *
 * @example
 * const { refreshing, onRefresh } = useRefresh({
 *   onRefresh: async () => {
 *     await loadMessages();
 *   }
 * });
 *
 * <ScrollView
 *   refreshControl={
 *     <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 *   }
 * >
 */
export const useRefresh = ({
  onRefresh: onRefreshCallback,
  initialRefreshing = false,
}: UseRefreshOptions): UseRefreshReturn => {
  const [refreshing, setRefreshing] = useState(initialRefreshing);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    onRefreshCallback()
      .then(() => {
        console.log('✅ Refresh completed');
      })
      .catch((error) => {
        console.error('❌ Refresh error:', error);
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [onRefreshCallback]);

  return {
    refreshing,
    onRefresh,
  };
};
