/**
 * Utility function to retry async operations with exponential backoff
 * Useful for network requests that might fail temporarily
 */

export interface RetryOptions {
  maxRetries?: number; // Default: 3
  initialDelay?: number; // Default: 1000ms
  maxDelay?: number; // Default: 10000ms
  exponentialBase?: number; // Default: 2
  shouldRetry?: (error: any) => boolean; // Custom retry logic
  onRetry?: (attempt: number, error: any) => void; // Callback on retry
}

/**
 * Delay function
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  exponentialBase: number,
  maxDelay: number
): number => {
  const exponentialDelay = initialDelay * Math.pow(exponentialBase, attempt);
  return Math.min(exponentialDelay, maxDelay);
};

/**
 * Default retry logic: retry on network errors
 */
const defaultShouldRetry = (error: any): boolean => {
  // Retry on network errors
  if (error.message?.includes('Network request failed')) return true;
  if (error.message?.includes('timeout')) return true;
  if (error.code === 'ECONNREFUSED') return true;
  if (error.code === 'ETIMEDOUT') return true;

  // Don't retry on client errors (4xx)
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return false;
  }

  // Retry on server errors (5xx)
  if (error.response?.status >= 500) return true;

  return false;
};

/**
 * Retry an async function with exponential backoff
 *
 * @example
 * ```typescript
 * const data = await fetchWithRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    exponentialBase = 2,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Try to execute the function
      return await fn();
    } catch (error: any) {
      lastError = error;

      // If we've used all retries, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Check if we should retry
      if (!shouldRetry(error)) {
        throw error;
      }

      // Calculate delay for this attempt
      const delayMs = calculateDelay(attempt, initialDelay, exponentialBase, maxDelay);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms`, error.message);

      // Wait before retrying
      await delay(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Retry a function with a simple retry count (no exponential backoff)
 *
 * @example
 * ```typescript
 * const data = await simpleRetry(
 *   () => fetch('https://api.example.com/data'),
 *   3, // maxRetries
 *   1000 // delay between retries
 * );
 * ```
 */
export async function simpleRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  return fetchWithRetry(fn, {
    maxRetries,
    initialDelay: delayMs,
    exponentialBase: 1, // No exponential backoff
  });
}

/**
 * Retry only on specific error codes/messages
 *
 * @example
 * ```typescript
 * const data = await retryOnErrors(
 *   () => fetchData(),
 *   ['NETWORK_ERROR', 'TIMEOUT'],
 *   3
 * );
 * ```
 */
export async function retryOnErrors<T>(
  fn: () => Promise<T>,
  errorCodes: string[],
  maxRetries: number = 3
): Promise<T> {
  return fetchWithRetry(fn, {
    maxRetries,
    shouldRetry: (error) => {
      return errorCodes.some(code =>
        error.message?.includes(code) || error.code === code
      );
    },
  });
}

export default fetchWithRetry;
