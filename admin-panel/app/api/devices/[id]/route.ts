import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDeviceById, getMessagesByDevice, getSMSByDevice } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();

    const { id } = await params;
    const device = await getDeviceById(id);

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // Get device messages and SMS
    const [messages, sms] = await Promise.all([
      getMessagesByDevice(id, 100),
      getSMSByDevice(id, 100),
    ]);

    return NextResponse.json({
      success: true,
      device,
      messages,
      sms,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error getting device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
