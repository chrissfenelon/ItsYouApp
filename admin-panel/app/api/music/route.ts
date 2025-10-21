import { NextRequest, NextResponse } from 'next/server';
import { getAllMusic, deleteMusic } from '@/lib/db';

export async function GET() {
  try {
    const tracks = await getAllMusic();

    return NextResponse.json({
      success: true,
      tracks,
    });
  } catch (error: any) {
    console.error('Error getting music:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { trackId } = await request.json();

    if (!trackId) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteMusic(trackId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Track deleted successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete track' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting music:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
