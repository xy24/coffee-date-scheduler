import { NextRequest, NextResponse } from 'next/server';
import { getBookingSlots, saveBookingSlots } from '@/lib/sqlite';
import { defaultBookingSlots } from '@/lib/db';
import type { BookingSlots } from '@/lib/types';

export async function GET() {
  try {
    let data = getBookingSlots();
    
    // Ensure the data structure is correct
    if (!data || !data.slots || Object.keys(data.slots).length === 0) {
      data = defaultBookingSlots;
      // Save default data to database
      try {
        saveBookingSlots(defaultBookingSlots);
      } catch (saveError) {
        console.error('Error saving default booking slots:', saveError);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in booking slots GET:', error);
    // Return default data structure on error
    return NextResponse.json(defaultBookingSlots);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { slotId, remainingSlots } = await request.json();
    
    try {
      // Get current data
      const currentData = getBookingSlots();
      
      // Check if the slot is already booked
      if (currentData.slots[slotId] === true) {
        return NextResponse.json(
          { error: `Slot ${slotId} is already booked` },
          { status: 400 }
        );
      }
      
      // Create updated data
      const updatedData = {
        slots: {
          ...currentData.slots,
          [slotId]: true
        },
        remainingSlots
      };
      
      saveBookingSlots(updatedData);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to save booking slots' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error parsing request data:', error);
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }
} 