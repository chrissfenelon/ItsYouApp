import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getAllMessages, getAllSMS } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get user details
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's activity (messages and SMS)
    const [messages, sms] = await Promise.all([
      getAllMessages({ limit: 1000 }),
      getAllSMS({ limit: 1000 }),
    ]);

    // Filter by userId
    const userMessages = messages.filter(m => m.userId === userId);
    const userSMS = sms.filter(s => s.userId === userId);

    return NextResponse.json({
      success: true,
      user,
      activity: {
        totalMessages: userMessages.length,
        totalSMS: userSMS.length,
        recentMessages: userMessages.slice(0, 10),
        recentSMS: userSMS.slice(0, 10),
      },
    });
  } catch (error: any) {
    console.error('Error getting user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
