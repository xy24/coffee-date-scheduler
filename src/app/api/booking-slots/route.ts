import { NextRequest, NextResponse } from 'next/server';
import { getBookingSlots, saveBookingSlots } from '@/lib/sqlite';
import { defaultBookingSlots } from '@/lib/db';
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

// Function to send notification via webhook
async function sendLarkWebhookNotification(message: any) {
  try {
    // Get token first
    const token = await getLarkToken();
    if (!token) {
      console.error('Failed to get token for webhook notification');
      return;
    }
    console.log("token", token);

    const response = await fetch(LARK_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receive_id: LARK_RECEIVE_ID,
        msg_type: "interactive",
        content: JSON.stringify(message)  // Need to stringify the card content
      })
    });

    const data = await response.json();
    if (data.code !== 0) {
      console.error('Failed to send Lark webhook notification:', data);
    }
  } catch (error) {
    console.error('Error sending Lark webhook notification:', error);
  }
}

// Main notification function
async function sendLarkNotification(slotId: string) {
  const currentTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const cardMessage = {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: "plain_text",
        content: "☕ 新的咖啡预约!"
      },
      template: "blue"
    },
    elements: [
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: `**预约时段**: ${slotId}\n**预约时间**: ${currentTime}`
        }
      },
      {
        tag: "hr"
      },
      {
        tag: "note",
        elements: [
          {
            tag: "plain_text",
            content: "来自咖啡预约系统"
          }
        ]
      }
    ]
  };

  // Try webhook first if URL is provided
  if (LARK_WEBHOOK_URL) {
    await sendLarkWebhookNotification(cardMessage);
    return;
  }

  console.warn('Lark notification not sent: No valid configuration found');
}

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
      
      // Save booking data
      saveBookingSlots(updatedData);
      
      // Send Lark notification
      sendLarkNotification(slotId).catch(error => {
        console.error('Failed to send Lark notification:', error);
      });
      
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