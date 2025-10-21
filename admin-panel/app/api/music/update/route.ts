import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function PUT(request: NextRequest) {
  try {
    const { trackId, title, artist, category } = await request.json();

    if (!trackId) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (artist) updateData.artist = artist;
    if (category) updateData.category = category;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    await db.collection('musicLibrary').doc(trackId).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Track updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating music:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
