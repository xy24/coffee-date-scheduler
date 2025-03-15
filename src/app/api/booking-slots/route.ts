import { NextRequest, NextResponse } from 'next/server';
import { getBookingSlots, saveBookingSlots } from '@/lib/db';
import { defaultBookingSlots } from '@/lib/types';
import type { BookingSlots } from '@/lib/types';

// Constants for Lark API
const LARK_APP_ID = process.env.NEXT_PUBLIC_LARK_APP_ID;
const LARK_APP_SECRET = process.env.NEXT_PUBLIC_LARK_APP_SECRET;
const LARK_RECEIVE_ID = process.env.NEXT_PUBLIC_LARK_RECEIVE_ID;
const LARK_WEBHOOK_URL = process.env.NEXT_PUBLIC_LARK_WEBHOOK_URL;

// Function to get Lark tenant access token
async function getLarkToken() {
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: LARK_APP_ID,
        app_secret: LARK_APP_SECRET
      })
    });

    const data = await response.json();
    if (data.code === 0) {
      return data.tenant_access_token;
    } else {
      console.error('Failed to get Lark token:', data);
      return null;
    }
  } catch (error) {
    console.error('Error getting Lark token:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, time } = data;

    if (!name || !time) {
      return NextResponse.json(
        { error: 'Name and time are required' },
        { status: 400 }
      );
    }

    // Get current booking slots
    let bookingSlots = await getBookingSlots();
    
    // Check if the slot exists and is available
    if (bookingSlots.slots[time]) {
      return NextResponse.json(
        { error: 'Invalid or already booked time slot' },
        { status: 400 }
      );
   } 

    // Update the slot
    bookingSlots.slots[time] = true;
    bookingSlots.remainingSlots--;
    
    // Save to database
    await saveBookingSlots(bookingSlots);

    // Send notification to Lark
    const token = await getLarkToken();
    if (token) {
      const message = `新的咖啡约会预订！\n时间：${time}\n预订人：${name}`;
      
      // Using API
      await fetch('https://open.feishu.cn/open-apis/im/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receive_id: LARK_RECEIVE_ID,
          msg_type: 'text',
          content: {
            text: message
          }
        })
      });
      
    }

    return NextResponse.json(bookingSlots);
  } catch (error) {
    console.error('Error in booking slots POST:', error);
    return NextResponse.json(
      { error: 'Failed to process booking' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    let data = await getBookingSlots();
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Check if month has changed
    if (data.currentMonth !== currentMonth) {
      console.log('Month changed, resetting slots');
      data = {
        ...defaultBookingSlots,
        currentMonth
      };
      await saveBookingSlots(data);
    }
    
    // Ensure the data structure is correct
    if (!data || !data.slots || Object.keys(data.slots).length === 0) {
      data = defaultBookingSlots;
      // Save default data to database
      try {
        await saveBookingSlots(defaultBookingSlots);
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