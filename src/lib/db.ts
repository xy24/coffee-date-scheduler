'use client';

// Define the type for our database
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

// Default data
const defaultData: BookingData = {
  slots: {
    1: { booked: false, time: '第一周' },
    2: { booked: false, time: '第二周' },
    3: { booked: false, time: '第三周' },
    4: { booked: false, time: '第四周' }
  },
  remainingSlots: 4,
  stats: {
    visits: 0,
    todayVisits: {
      date: new Date().toDateString(),
      count: 0
    },
    lastVisitTime: new Date().toLocaleString('zh-CN')
  },
  reactions: {
    like: 0,
    dislike: 0
  }
};

// Client-side functions
export async function getBookingData(): Promise<BookingData> {
  try {
    const response = await fetch('/api/booking-data');
    if (!response.ok) throw new Error('Failed to fetch data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return defaultData;
  }
}

export async function updateBookingData(data: BookingData): Promise<void> {
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
}

export { defaultData }; 