import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getHomeMessage, updateHomeMessage } from '@/lib/db';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    await requireAuth();
    const message = await getHomeMessage();
    return successResponse({ message });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return errorResponse('Message is required', 400);
    }

    const success = await updateHomeMessage(message);

    if (!success) {
      return errorResponse('Failed to update home message', 500);
    }

    return successResponse({ message: 'Home message updated successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
