'use client';

import React from 'react';

interface LoadingProgressProps {
  loaded: number;
  total: number;
  itemName?: string;
  showPercentage?: boolean;
  className?: string;
}

export default function LoadingProgress({
  loaded,
  total,
  itemName: _itemName = 'items',
  showPercentage = true,
  className = '',
}: LoadingProgressProps) {
  const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Progress bar */}
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Text indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-[140px]">
        <span className="font-medium">
          {loaded.toLocaleString()} / {total.toLocaleString()}
        </span>
        {showPercentage && (
          <span className="text-xs text-gray-500 dark:text-gray-500">
            ({percentage}%)
          </span>
        )}
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
      />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}

interface DataLoadingStateProps {
  loading: boolean;
  loaded: number;
  total: number;
  itemName: string;
  error?: string | null;
  hasData: boolean;
  children: React.ReactNode;
}

/**
 * Comprehensive loading state component that handles:
 * - Initial loading state with spinner
 * - Progress bar during data fetching
 * - Error states
 * - Empty states
 * - Loaded data display
 */
export function DataLoadingState({
  loading,
  loaded,
  total,
  itemName,
  error,
  hasData,
  children,
}: DataLoadingStateProps) {
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-red-800 dark:text-red-200">
            Error loading data
          </h3>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // Initial loading state (no data yet)
  if (loading && loaded === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner message={`Loading ${itemName}...`} size="lg" />
      </div>
    );
  }

  // Loading more data (show progress)
  if (loading && loaded > 0) {
    return (
      <div className="space-y-4">
        {children}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Loading {itemName}...
          </p>
          <LoadingProgress
            loaded={loaded}
            total={total}
            itemName={itemName}
            showPercentage={true}
          />
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && !hasData) {
    return (
      <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No {itemName} found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            There are no {itemName} to display.
          </p>
        </div>
      </div>
    );
  }

  // Data loaded successfully
  return <>{children}</>;
}
