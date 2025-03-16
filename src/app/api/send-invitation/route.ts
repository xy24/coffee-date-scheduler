import { NextResponse } from 'next/server';
import { saveInvitation } from '@/lib/db';

// Constants for Lark API
const LARK_APP_ID = process.env.NEXT_PUBLIC_LARK_APP_ID;
const LARK_APP_SECRET = process.env.NEXT_PUBLIC_LARK_APP_SECRET;
const LARK_WEBHOOK_URL = process.env.NEXT_PUBLIC_LARK_WEBHOOK_URL;
const SENDER_ID = process.env.NEXT_PUBLIC_LARK_RECEIVE_ID;

if (!SENDER_ID) {
  throw new Error('NEXT_PUBLIC_LARK_RECEIVE_ID is not configured');
}

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

interface InvitationRequest {
  recipientId: string;
  message?: string;
}

export async function POST(request: Request) {
  try {
    if (!LARK_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'LARK_WEBHOOK_URL is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json() as InvitationRequest;
    const { recipientId, message } = body;

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    // Save invitation to database first
    const invitation = await saveInvitation(SENDER_ID, recipientId, message || null);

    // Get Lark token
    const token = await getLarkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to get Lark authentication token' },
        { status: 500 }
      );
    }

    // Create interactive card message with invitation ID
    const cardMessage = {
      receive_id: recipientId,
      msg_type: "interactive",
      content: JSON.stringify({
        type: "template",
        data: {
          template_id: "AAqBpFwvq3wEc",
          template_variable: {
            invitation_id: invitation.id,
            open_id: recipientId
          }
        }
      })
    };

    // Send message via Lark webhook
    const response = await fetch(LARK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cardMessage),
    });

    if (!response.ok) {
      throw new Error(`Failed to send invitation: ${response.statusText}`);
    }

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
} 