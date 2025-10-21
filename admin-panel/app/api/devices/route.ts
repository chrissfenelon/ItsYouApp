import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAllDevices } from '@/lib/db';

export async function GET() {
  try {
    // Require authentication
    await requireAuth();

    const devices = await getAllDevices();

    return NextResponse.json({
      success: true,
      devices,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error getting devices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
