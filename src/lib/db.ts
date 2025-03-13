'use client';

import { 
  BookingSlots, 
  VisitStats, 
  Reactions, 
  defaultBookingSlots, 
  defaultVisitStats, 
  defaultReactions 
} from './types';

// Re-export everything from types
export type { BookingSlots, VisitStats, Reactions };
export { defaultBookingSlots, defaultVisitStats, defaultReactions };

// Additional types only needed on the client side
export interface BookingData {
  slots: {
    [key: string]: {
      booked: boolean;
      time: string;
    };
  };
  remainingSlots: number;
  stats: {
    visits: number;
    todayVisits: {
      date: string;
      count: number;
    };
    lastVisitTime: string;
  };
  reactions: {
    like: number;
    dislike: number;
  };
}

// Client-side functions
export async function getBookingData(): Promise<BookingData> {
  try {
    const response = await fetch('/api/booking-data');
    if (!response.ok) throw new Error('Failed to fetch data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      slots: Object.fromEntries(Object.entries(defaultBookingSlots)),
      remainingSlots: 4,
      stats: defaultVisitStats,
      reactions: defaultReactions
    };
  }
}

export async function updateBookingData(data: BookingData): Promise<void> {
  console.log('Updating booking data:', data);
  console.log(new Error().stack);
  try {
    const response = await fetch('/api/booking-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update data');
    }
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
}; 