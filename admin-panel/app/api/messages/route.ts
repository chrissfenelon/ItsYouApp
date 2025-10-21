import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAllMessages } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const app = searchParams.get('app') || undefined;
    const type = searchParams.get('type') as 'sent' | 'received' | undefined;
    const deviceId = searchParams.get('deviceId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const messages = await getAllMessages({
      app,
      type,
      deviceId,
      limit,
    });

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error getting messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
