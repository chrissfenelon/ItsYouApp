import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAllSMS } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') ? parseInt(searchParams.get('type')!, 10) as 1 | 2 : undefined;
    const deviceId = searchParams.get('deviceId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const sms = await getAllSMS({
      type,
      deviceId,
      limit,
    });

    return NextResponse.json({
      success: true,
      sms,
      count: sms.length,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error getting SMS:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
