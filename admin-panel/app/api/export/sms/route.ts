import { NextRequest, NextResponse } from 'next/server';
import { getAllSMS } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const typeParam = searchParams.get('type');
    const type = typeParam ? parseInt(typeParam, 10) as 1 | 2 : undefined;
    const deviceId = searchParams.get('deviceId') || undefined;

    const smsList = await getAllSMS({
      type,
      deviceId,
      limit: 10000, // Export all SMS
    });

    if (format === 'csv') {
      // Convert to CSV
      const csvHeader = 'ID,Phone Number,Message,Type,Date,Device ID\n';
      const csvRows = smsList.map(s =>
        `"${s.id}","${s.address}","${s.body.replace(/"/g, '""')}","${s.type === 1 ? 'Received' : 'Sent'}","${new Date(s.date).toISOString()}","${s.deviceId || 'N/A'}"`
      ).join('\n');

      const csv = csvHeader + csvRows;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sms_export_${Date.now()}.csv"`,
        },
      });
    } else {
      // JSON format
      const json = JSON.stringify(smsList, null, 2);

      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="sms_export_${Date.now()}.json"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Error exporting SMS:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
