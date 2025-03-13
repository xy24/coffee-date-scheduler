import { NextRequest, NextResponse } from 'next/server';
import { getReactions, saveReactions } from '@/lib/sqlite';

export async function GET() {
  try {
    const data = getReactions();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting reactions:', error);
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    saveReactions(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating reactions:', error);
    return NextResponse.json({ error: 'Failed to update reactions' }, { status: 500 });
  }
} 