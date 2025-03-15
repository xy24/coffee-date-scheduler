import { NextRequest, NextResponse } from 'next/server';
import { getReactions, saveReactions } from '@/lib/db';

export async function GET() {
  try {
    const data = await getReactions();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting reactions:', error);
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await saveReactions(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving reactions:', error);
    return NextResponse.json({ error: 'Failed to save reactions' }, { status: 500 });
  }
} 