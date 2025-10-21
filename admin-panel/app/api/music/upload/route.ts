import { NextRequest, NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = (formData as any).get('file') as File | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const title = (formData as any).get('title') as string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const artist = (formData as any).get('artist') as string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const category = (formData as any).get('category') as string | null;

    if (!file || !title || !artist || !category) {
      return NextResponse.json(
        { error: 'File, title, artist, and category are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP3, WAV, OGG, and M4A files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `music_${timestamp}_${sanitizedFilename}`;
    const filePath = `music/${filename}`;

    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const fileRef = bucket.file(filePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          title,
          artist,
          category,
        },
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Save metadata to Firestore
    const musicDoc = await db.collection('musicLibrary').add({
      title,
      artist,
      category,
      url: publicUrl,
      filename: file.name,
      size: file.size,
      duration: null, // Could be calculated with an audio processing library
      uploadedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Music uploaded successfully',
      track: {
        id: musicDoc.id,
        title,
        artist,
        category,
        url: publicUrl,
        filename: file.name,
        size: file.size,
      },
    });
  } catch (error: any) {
    console.error('Error uploading music:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
