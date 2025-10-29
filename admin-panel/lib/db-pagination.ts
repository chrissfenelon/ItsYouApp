// Firebase Admin removed - all data access is now client-side via hooks
// This file is kept for compatibility but returns empty data

export interface PaginationOptions {
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Helper to convert Firestore timestamp to Date
function _timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

// ============= MESSAGES WITH PAGINATION =============

export async function getMessagesPaginated(options: PaginationOptions & {
  app?: string;
  type?: 'sent' | 'received';
  deviceId?: string;
}) {
  // Data access moved to client-side - return empty for now
  const limit = options.limit || 50;
  const page = options.page || 1;

  return {
    data: [],
    pagination: {
      page,
      limit,
      total: 0,
      hasMore: false,
    },
  };
}

// ============= SMS WITH PAGINATION =============

export async function getSMSPaginated(options: PaginationOptions & {
  type?: 'sent' | 'received';
  deviceId?: string;
}) {
  // Data access moved to client-side - return empty for now
  const limit = options.limit || 50;
  const page = options.page || 1;

  return {
    data: [],
    pagination: {
      page,
      limit,
      total: 0,
      hasMore: false,
    },
  };
}

// ============= PHOTOS WITH PAGINATION =============

export async function getPhotosPaginated(options: PaginationOptions & {
  deviceId?: string;
}) {
  // Data access moved to client-side - return empty for now
  const limit = options.limit || 50;
  const page = options.page || 1;

  return {
    data: [],
    pagination: {
      page,
      limit,
      total: 0,
      hasMore: false,
    },
  };
}

// ============= MUSIC WITH PAGINATION =============

export async function getMusicPaginated(options: PaginationOptions & {
  category?: string;
}) {
  // Data access moved to client-side - return empty for now
  const limit = options.limit || 50;
  const page = options.page || 1;

  return {
    data: [],
    pagination: {
      page,
      limit,
      total: 0,
      hasMore: false,
    },
  };
}

// ============= USERS WITH PAGINATION =============

export async function getUsersPaginated(options: PaginationOptions & {
  status?: 'active' | 'inactive' | 'disabled';
}) {
  // Data access moved to client-side - return empty for now
  const limit = options.limit || 50;
  const page = options.page || 1;

  return {
    data: [],
    pagination: {
      page,
      limit,
      total: 0,
      hasMore: false,
    },
  };
}

// ============= ANALYTICS (OPTIMIZED) =============

export async function getAnalyticsStats() {
  // Data access moved to client-side - return empty for now
  return {
    totalUsers: 0,
    totalMessages: 0,
    totalSMS: 0,
    totalPhotos: 0,
    totalMusic: 0,
    todayMessages: 0,
    whatsappMessages: 0,
    instagramMessages: 0,
  };
}

// ============= STORAGE STATS =============

export async function getStorageStats() {
  // Data access moved to client-side - return empty for now
  const totalCapacity = 5 * 1024 * 1024 * 1024; // 5GB

  return {
    totalUsed: 0,
    totalCapacity,
    usagePercentage: 0,
    photosSize: 0,
    musicSize: 0,
    photosCount: 0,
    musicCount: 0,
  };
}
