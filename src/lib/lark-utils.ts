// Lark API credentials
const LARK_WEBHOOK_URL = process.env.NEXT_PUBLIC_LARK_WEBHOOK_URL;

export interface LarkCardMessage {
  title: string;
  content: string;
  template?: 'blue' | 'grey';
}

/**
 * Sends a message to Lark using the webhook URL
 * @param message The message to send
 * @returns A boolean indicating whether the message was sent successfully
 */
export async function sendLarkMessage(message: LarkCardMessage): Promise<boolean> {
  if (!LARK_WEBHOOK_URL) {
    console.error('Lark webhook URL not configured');
    return false;
  }

  try {
    const response = await fetch(LARK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msg_type: "interactive",
        card: {
          header: {
            title: {
              tag: "plain_text",
              content: message.title
            },
            template: message.template || "blue"
          },
          elements: [
            {
              tag: "div",
              text: {
                tag: "lark_md",
                content: message.content
              }
            }
          ]
        }
      })
    });

    if (!response.ok) {
      console.error('Failed to send message to Lark:', await response.text());
      return false;
    }

    const data = await response.json();
    return data.code === 0;
  } catch (error) {
    console.error('Error sending message to Lark:', error);
    return false;
  }
}

export default {
  sendLarkMessage
}; 