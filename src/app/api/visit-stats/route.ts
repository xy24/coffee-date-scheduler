import { NextResponse } from 'next/server';
import { getVisitStats, updateVisitStats } from '@/lib/sqlite';

export async function GET() {
  try {
    const data = getVisitStats();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting visit stats:', error);
    return NextResponse.json({ error: 'Failed to fetch visit stats' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const updatedStats = updateVisitStats();
    return NextResponse.json(updatedStats);
  } catch (error) {
    console.error('Error updating visit stats:', error);
    return NextResponse.json({ error: 'Failed to update visit stats' }, { status: 500 });
  }
} 