import { WSClient, EventDispatcher } from "@larksuiteoapi/node-sdk";

// Constants for Lark API
const LARK_APP_ID = process.env.NEXT_PUBLIC_LARK_APP_ID;
const LARK_APP_SECRET = process.env.NEXT_PUBLIC_LARK_APP_SECRET;
const LARK_WEBHOOK_URL = process.env.NEXT_PUBLIC_LARK_WEBHOOK_URL;
const LARK_RECEIVE_ID = process.env.NEXT_PUBLIC_LARK_RECEIVE_ID;

if (!LARK_APP_ID || !LARK_APP_SECRET || !LARK_WEBHOOK_URL || !LARK_RECEIVE_ID) {
  throw new Error('Lark credentials not configured. Please check your .env.local file.');
}

// Function to get Lark token
async function getLarkToken() {
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: LARK_APP_ID,
        app_secret: LARK_APP_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tenant_access_token;
  } catch (error) {
    console.error('Error getting Lark token:', error);
    return null;
  }
}

// Function to send Lark message
async function sendLarkMessage(token: string, message: string) {
  if (!LARK_WEBHOOK_URL) {
    console.error('Webhook URL is not configured');
    return;
  }

  try {
    const response = await fetch(LARK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receive_id: LARK_RECEIVE_ID,
        msg_type: "interactive",
        content: JSON.stringify({
          config: {
            wide_screen_mode: true
          },
          header: {
            template: "blue",
            title: {
              tag: "plain_text",
              content: "☕ 咖啡邀请回复通知"
            }
          },
          elements: [
            {
              tag: "div",
              text: {
                tag: "lark_md",
                content: message
              }
            }
          ]
        })
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send Lark message: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending Lark message:', error);
  }
}

// Initialize WebSocket client
export const wsClient = new WSClient({
  appId: LARK_APP_ID,
  appSecret: LARK_APP_SECRET,
});

// Create event dispatcher for handling card actions
export const eventDispatcher = new EventDispatcher({}).register({
  "card.action.trigger": async (data: { action: { tag: string; value?: { action_type: string } }; operator: { open_id: string } }) => {
    console.log('Card action received:', data);
    
    // Extract action and user information
    const { action, operator } = data;
    
    // Handle different button actions
    if (action.tag === "button") {
      const actionType = action.value?.action_type;
      const userId = operator.open_id;
      
      // Get Lark token
      const token = await getLarkToken();
      if (!token) {
        console.error('Failed to get Lark token');
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
      
      let message;
      let notificationMessage;
      if (actionType === "accept") {
        message = "已接受邀请";
        notificationMessage = `<at id="${userId}"></at> 接受了你的咖啡邀请！🎉`;
        await sendLarkMessage(token, notificationMessage);
      } else if (actionType === "reject") {
        message = "已婉拒邀请";
        notificationMessage = `<at id="${userId}"></at> 婉拒了你的咖啡邀请`;
        await sendLarkMessage(token, notificationMessage);
      }

      // Return toast message
      return {
        toast: {
          type: "success",
          content: message,
          i18n: {
            zh_cn: message,
            en_us: actionType === "accept" ? "Invitation accepted" : "Invitation declined",
          },
        },
      };
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