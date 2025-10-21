import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAnalytics } from '@/lib/db';

export async function GET() {
  try {
    // Require authentication
    await requireAuth();

    const analytics = await getAnalytics();

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error getting analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
