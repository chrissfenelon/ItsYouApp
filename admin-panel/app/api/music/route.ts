import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getMusicPaginated } from '@/lib/db-pagination';
import { deleteMusic } from '@/lib/db';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await getMusicPaginated({
      category,
      page,
      limit,
    });

    return successResponse(result.data, 200, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const trackId = searchParams.get('id');

    if (!trackId) {
      return errorResponse('Track ID is required', 400);
    }

    const success = await deleteMusic(trackId);

    if (!success) {
      return errorResponse('Failed to delete music track', 500);
    }

    return successResponse({ message: 'Music track deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
