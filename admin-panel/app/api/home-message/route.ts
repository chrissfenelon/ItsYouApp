import { NextRequest, NextResponse } from 'next/server';
import { getHomeMessage, updateHomeMessage } from '@/lib/db';

export async function GET() {
  try {
    const message = await getHomeMessage();

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Error getting home message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const success = await updateHomeMessage(message);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Home message updated successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating home message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
