import { NextRequest, NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/sqlite';

export async function GET() {
  try {
    console.log('GET /api/booking-data: Fetching data...');
    const data = getData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/booking-data: Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/booking-data: Saving data...');
    const data = await request.json();
    saveData(data);
    console.log('POST /api/booking-data: Data saved successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/booking-data: Error:', error);
    return NextResponse.json(
      { error: 'Failed to update data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 