import { NextRequest, NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = (formData as any).get('file') as File | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = ((formData as any).get('userId') as string | null) || 'admin';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deviceId = ((formData as any).get('deviceId') as string | null) || 'admin-panel';

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `photo_${timestamp}_${sanitizedFilename}`;
    const filePath = `photos/${filename}`;

    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const fileRef = bucket.file(filePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          userId,
          deviceId,
        },
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Save metadata to Firestore
    const photoDoc = await db.collection('sharedPhotos').add({
      userId,
      deviceId,
      url: publicUrl,
      filename: file.name,
      size: file.size,
      uploadedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully',
      photo: {
        id: photoDoc.id,
        url: publicUrl,
        filename: file.name,
        size: file.size,
        userId,
        deviceId,
      },
    });
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
