import { useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  refreshingDelay?: number; // Minimum time to show refreshing state (for UX)
}

/**
 * Hook for pull-to-refresh functionality
 *
 * @example
 * ```tsx
 * const { refreshing, onRefresh } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await loadNotes();
 *     await loadMedia();
 *   }
 * });
 *
 * <ScrollView
 *   refreshControl={
 *     <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 *   }
 * >
 *   {content}
 * </ScrollView>
 * ```
 */
export const usePullToRefresh = ({
  onRefresh: refreshFn,
  refreshingDelay = 500
}: UsePullToRefreshOptions) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes

    setRefreshing(true);
    const startTime = Date.now();

    try {
      await refreshFn();
    } catch (error) {
      console.error('❌ Pull to refresh error:', error);
      // Don't throw - just log and continue
    } finally {
      // Ensure minimum refresh time for smooth UX
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, refreshingDelay - elapsed);

      if (remainingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingDelay));
      }

      setRefreshing(false);
    }
  }, [refreshFn, refreshing, refreshingDelay]);

  return {
    refreshing,
    onRefresh,
  };
};

export default usePullToRefresh;
