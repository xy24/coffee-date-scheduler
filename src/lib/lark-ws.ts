import { WSClient, EventDispatcher } from "@larksuiteoapi/node-sdk";
import { sendLarkMessage } from '@/lib/lark-utils';
import { updateInvitationStatus } from '@/lib/db';

// Constants for Lark API
const LARK_APP_ID = process.env.NEXT_PUBLIC_LARK_APP_ID;
const LARK_APP_SECRET = process.env.NEXT_PUBLIC_LARK_APP_SECRET;

if (!LARK_APP_ID || !LARK_APP_SECRET) {
  throw new Error('Lark credentials not configured. Please check your .env.local file.');
}

// Initialize WebSocket client
export const wsClient = new WSClient({
  appId: LARK_APP_ID,
  appSecret: LARK_APP_SECRET,
});

// Create event dispatcher for handling card actions
export const eventDispatcher = new EventDispatcher({}).register({
  "card.action.trigger": async (data: { 
    action: { 
      tag: string; 
      value?: { 
        action_type: string;
        invitation_id: string;
      } 
    }; 
    operator: { 
      open_id: string 
    } 
  }) => {
    console.log('Card action received:', data);
    
    // Extract action and user information
    const { action, operator } = data;
    
    // Handle different button actions
    if (action.tag === "button" && action.value?.invitation_id) {
      const actionType = action.value.action_type;
      const userId = operator.open_id;
      const invitationId = action.value.invitation_id;
      
      let message;
      
      try {
        if (actionType === "accept") {
          // Update invitation status in database
          await updateInvitationStatus(invitationId, 'accepted');
          message = "已接受邀请";
        } else if (actionType === "reject") {
          // Update invitation status in database
          await updateInvitationStatus(invitationId, 'rejected');
          message = "已婉拒邀请";
        }
        
        // Return toast message and disable the card
        return {
          toast: {
            type: "success",
            content: message,
            i18n: {
              zh_cn: message,
              en_us: actionType === "accept" ? "Invitation accepted" : "Invitation declined",
            },
          },
          card: {
            type: "raw",
            data: {
              "disabled": true,
            }
          },
        };
      } catch (error) {
        console.error('Error handling card action:', error);
        return {
          toast: {
            type: "error",
            content: "系统错误",
            i18n: {
              zh_cn: "系统错误",
              en_us: "System error",
            },
          },
        };
      }
    }

    return {
      toast: {
        type: "success",
        content: "卡片交互成功",
        i18n: {
          zh_cn: "卡片交互成功",
          en_us: "Card action success",
        },
      },
    };
  },
});

// Start WebSocket connection
export function startWebSocket() {
  try {
    wsClient.start({ eventDispatcher });
    console.log('Lark WebSocket connection started successfully');
  } catch (error) {
    console.error('Failed to start Lark WebSocket connection:', error);
  }
} 