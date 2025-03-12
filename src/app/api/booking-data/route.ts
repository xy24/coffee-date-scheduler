import { NextRequest, NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/sqlite';

export async function GET() {
  try {
    const data = getData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/booking-data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    saveData(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/booking-data:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
} 