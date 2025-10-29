import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export function successResponse<T>(
  data: T,
  status: number = 200,
  pagination?: ApiSuccess<T>['pagination']
): NextResponse {
  const response: ApiSuccess<T> = {
    success: true,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return NextResponse.json(response, { status });
}

export function errorResponse(
  error: string,
  status: number = 400,
  details?: string,
  code?: string
): NextResponse {
  const response: ApiError = { error };

  if (details) response.details = details;
  if (code) response.code = code;

  return NextResponse.json(response, { status });
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401, 'Authentication required');
    }

    if (error.message.includes('not found')) {
      return errorResponse('Not found', 404, error.message);
    }

    if (error.message.includes('permission')) {
      return errorResponse('Forbidden', 403, error.message);
    }

    // Generic error
    return errorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }

  return errorResponse('Internal server error', 500);
}

export async function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<NextResponse> {
  try {
    const result = await handler();
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
