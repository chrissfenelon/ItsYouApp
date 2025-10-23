/**
 * Utilities for network operations with retry logic and error handling
 */

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Check if error is retryable (network errors, timeouts, etc.)
 */
export const isRetryableError = (error: any): boolean => {
  if (!error) return false;

  // Firebase/Firestore specific errors
  const code = error.code || '';
  const retryableCodes = [
    'unavailable',
    'deadline-exceeded',
    'internal',
    'resource-exhausted',
    'aborted',
  ];

  if (retryableCodes.some(c => code.includes(c))) {
    return true;
  }

  // Network errors
  const message = (error.message || '').toLowerCase();
  const retryableMessages = [
    'network',
    'timeout',
    'connection',
    'failed to fetch',
    'fetch failed',
  ];

  return retryableMessages.some(msg => message.includes(msg));
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: any): string => {
  if (!error) return 'Une erreur inconnue est survenue';

  // Firebase/Firestore specific errors
  const code = error.code || '';

  const errorMessages: Record<string, string> = {
    'permission-denied': 'Vous n\'avez pas la permission d\'effectuer cette action',
    'not-found': 'Les données demandées n\'ont pas été trouvées',
    'already-exists': 'Cette ressource existe déjà',
    'invalid-argument': 'Paramètres invalides',
    'unauthenticated': 'Vous devez être connecté pour effectuer cette action',
    'unavailable': 'Service temporairement indisponible',
    'deadline-exceeded': 'L\'opération a pris trop de temps',
    'resource-exhausted': 'Limite de ressources atteinte',
  };

  for (const [key, message] of Object.entries(errorMessages)) {
    if (code.includes(key)) {
      return message;
    }
  }

  // Check for network errors
  const message = (error.message || '').toLowerCase();
  if (message.includes('network') || message.includes('connection')) {
    return 'Erreur de connexion. Vérifiez votre connexion internet.';
  }

  // Default message
  return error.message || 'Une erreur est survenue';
};

/**
 * Execute an async operation with retry logic
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  config?: RetryConfig,
  operationName?: string
): Promise<T> => {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;
  let delay = finalConfig.initialDelay;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const result = await operation();

      // Log success if it's a retry
      if (attempt > 0 && operationName) {
        console.log(`[NetworkUtils] ${operationName} succeeded after ${attempt} retries`);
      }

      return result;
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === finalConfig.maxRetries || !isRetryableError(error)) {
        console.error(
          `[NetworkUtils] ${operationName || 'Operation'} failed after ${attempt} attempts:`,
          error
        );
        throw error;
      }

      // Log retry attempt
      console.warn(
        `[NetworkUtils] ${operationName || 'Operation'} failed (attempt ${attempt + 1}/${finalConfig.maxRetries + 1}), retrying in ${delay}ms...`,
        error.code || error.message
      );

      // Wait before retrying
      await sleep(delay);

      // Exponential backoff
      delay = Math.min(
        delay * finalConfig.backoffMultiplier,
        finalConfig.maxDelay
      );
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
};

/**
 * Execute multiple async operations in parallel with error handling
 */
export const executeParallel = async <T>(
  operations: Array<() => Promise<T>>,
  continueOnError: boolean = false
): Promise<Array<T | Error>> => {
  const promises = operations.map(async (operation) => {
    try {
      return await operation();
    } catch (error) {
      if (continueOnError) {
        return error as Error;
      }
      throw error;
    }
  });

  if (continueOnError) {
    return Promise.all(promises);
  } else {
    return await Promise.all(promises);
  }
};

/**
 * Check if device has internet connection
 */
export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    // Try to fetch a lightweight resource
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('[NetworkUtils] Internet connection check failed:', error);
    return false;
  }
};

/**
 * Debounce function for rate limiting API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for rate limiting API calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
