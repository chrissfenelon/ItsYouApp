/**
 * Retry utility for network requests with exponential backoff
 * Helps handle transient network failures gracefully
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  shouldRetry: (error: any) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (!error) return false;

    // Network errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return true;
    }

    // Firebase errors that should be retried
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return true;
    }

    // HTTP status codes that should be retried
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    return false;
  },
  onRetry: () => {},
};

/**
 * Executes a function with retry logic and exponential backoff
 *
 * @example
 * ```tsx
 * const data = await fetchWithRetry(
 *   () => FirebaseService.getData(),
 *   { maxRetries: 5, baseDelay: 2000 }
 * );
 * ```
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // If this is the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        console.error(`❌ Failed after ${opts.maxRetries + 1} attempts:`, error);
        throw error;
      }

      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        console.error(`❌ Error not retryable:`, error);
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt),
        opts.maxDelay
      );

      console.warn(
        `⚠️ Attempt ${attempt + 1}/${opts.maxRetries + 1} failed. ` +
        `Retrying in ${delay}ms...`,
        error
      );

      // Call retry callback
      opts.onRetry(attempt + 1, error);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Batch retry for multiple promises
 * Retries each promise independently
 *
 * @example
 * ```tsx
 * const [notes, media, songs] = await batchFetchWithRetry([
 *   () => NotesService.getNotes(),
 *   () => GalleryService.getMedia(),
 *   () => MusicService.getSongs(),
 * ]);
 * ```
 */
export async function batchFetchWithRetry<T>(
  fns: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  return Promise.all(
    fns.map(fn => fetchWithRetry(fn, options))
  );
}

/**
 * Retry with custom condition check
 * Useful for polling until a condition is met
 *
 * @example
 * ```tsx
 * const game = await retryUntil(
 *   () => GameService.getGame(gameId),
 *   (game) => game.status === 'ready',
 *   { maxRetries: 10, baseDelay: 500 }
 * );
 * ```
 */
export async function retryUntil<T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastResult: T | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      lastResult = await fn();

      if (condition(lastResult)) {
        return lastResult;
      }

      // If this is the last attempt, throw
      if (attempt === opts.maxRetries) {
        throw new Error(`Condition not met after ${opts.maxRetries + 1} attempts`);
      }

      // Calculate delay
      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt),
        opts.maxDelay
      );

      console.log(
        `⏳ Condition not met on attempt ${attempt + 1}/${opts.maxRetries + 1}. ` +
        `Retrying in ${delay}ms...`
      );

      opts.onRetry(attempt + 1, new Error('Condition not met'));

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      // If this is the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        throw error;
      }

      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt),
        opts.maxDelay
      );

      console.warn(`⚠️ Error on attempt ${attempt + 1}. Retrying in ${delay}ms...`, error);
      opts.onRetry(attempt + 1, error);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry limit exceeded');
}

/**
 * Create a retryable version of any async function
 *
 * @example
 * ```tsx
 * const retryableFetch = createRetryable(
 *   FirebaseService.getData,
 *   { maxRetries: 5 }
 * );
 *
 * const data = await retryableFetch();
 * ```
 */
export function createRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: any[]) => {
    return fetchWithRetry(() => fn(...args), options);
  }) as T;
}

export default {
  fetchWithRetry,
  batchFetchWithRetry,
  retryUntil,
  createRetryable,
};
