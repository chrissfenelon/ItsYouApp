import { NextRequest, NextResponse } from 'next/server';
import { getAllPhotos, deletePhoto } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const photos = await getAllPhotos(limit);

    return NextResponse.json({
      success: true,
      photos,
    });
  } catch (error: any) {
    console.error('Error getting photos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { photoId } = await request.json();

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    const success = await deletePhoto(photoId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Photo deleted successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete photo' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
