import { NextResponse } from 'next/server';
import { getVisitStats, updateVisitStats } from '@/lib/sqlite';

export async function GET() {
  try {
    // Get and update stats in one operation
    const updatedStats = updateVisitStats();
    return NextResponse.json(updatedStats);
  } catch (error) {
    console.error('Error getting visit stats:', error);
    return NextResponse.json({ error: 'Failed to fetch visit stats' }, { status: 500 });
  }
} 