import { NextRequest, NextResponse } from 'next/server';
import { getAllMessages } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const app = searchParams.get('app') || undefined;
    const type = searchParams.get('type') as 'sent' | 'received' | undefined;
    const deviceId = searchParams.get('deviceId') || undefined;

    const messages = await getAllMessages({
      app,
      type,
      deviceId,
      limit: 10000, // Export all messages
    });

    if (format === 'csv') {
      // Convert to CSV
      const csvHeader = 'ID,App Name,Sender,Text,Type,Timestamp,Device ID\n';
      const csvRows = messages.map(m =>
        `"${m.id}","${m.appName}","${m.sender}","${m.text.replace(/"/g, '""')}","${m.messageType}","${new Date(m.timestamp).toISOString()}","${m.deviceId || 'N/A'}"`
      ).join('\n');

      const csv = csvHeader + csvRows;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="messages_export_${Date.now()}.csv"`,
        },
      });
    } else {
      // JSON format
      const json = JSON.stringify(messages, null, 2);

      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="messages_export_${Date.now()}.json"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Error exporting messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
