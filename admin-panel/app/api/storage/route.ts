import { NextResponse } from 'next/server';
import { getAllPhotos, getAllMusic } from '@/lib/db';

export async function GET() {
  try {
    // Get all files from database
    const [photos, music] = await Promise.all([
      getAllPhotos(10000),
      getAllMusic(),
    ]);

    // Calculate storage by type
    const photoSize = photos.reduce((sum, p) => sum + p.size, 0);
    const musicSize = music.reduce((sum, m) => sum + m.size, 0);

    const totalSize = photoSize + musicSize;

    // Calculate percentages
    const photoPercentage = totalSize > 0 ? Math.round((photoSize / totalSize) * 100) : 0;
    const musicPercentage = totalSize > 0 ? Math.round((musicSize / totalSize) * 100) : 0;

    // Storage breakdown
    const breakdown = [
      {
        category: 'Photos',
        size: photoSize,
        percentage: photoPercentage,
        count: photos.length,
        color: 'bg-pink-500',
      },
      {
        category: 'Music',
        size: musicSize,
        percentage: musicPercentage,
        count: music.length,
        color: 'bg-purple-500',
      },
    ];

    // Recent uploads (combine and sort by date)
    const allFiles = [
      ...photos.map(p => ({
        id: p.id,
        name: p.filename,
        type: 'Photo',
        size: p.size,
        uploadedAt: p.uploadedAt,
        userId: p.userId,
      })),
      ...music.map(m => ({
        id: m.id,
        name: m.filename,
        type: 'Music',
        size: m.size,
        uploadedAt: m.uploadedAt,
        userId: 'Admin', // Music doesn't have userId
      })),
    ];

    const recentUploads = allFiles
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 10);

    // Calculate this month's uploads
    const now = new Date();
    const thisMonth = allFiles.filter(f => {
      const date = new Date(f.uploadedAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    // Calculate average upload size
    const avgSize = allFiles.length > 0
      ? Math.round(totalSize / allFiles.length)
      : 0;

    return NextResponse.json({
      success: true,
      storage: {
        total: totalSize,
        breakdown,
        recentUploads,
        stats: {
          totalFiles: allFiles.length,
          thisMonth,
          avgSize,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting storage analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
