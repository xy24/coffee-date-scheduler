# Coffee Date Scheduler

A simple web application for scheduling coffee dates with friends or colleagues.

## Features

- Interactive UI with animations
- Server-side data storage with file persistence
- Booking system for coffee dates
- Visit counter to track page visits
- Like/Dislike reaction system
- Lark (Feishu) bot notifications for new bookings

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env.local` file with the following variables:
   ```
   # Required for both webhook and API methods
   NEXT_PUBLIC_LARK_APP_ID=your_lark_app_id_here
   NEXT_PUBLIC_LARK_APP_SECRET=your_lark_app_secret_here

   # Option 1: Using Lark Custom Bot Webhook
   NEXT_PUBLIC_LARK_WEBHOOK_URL=your_lark_webhook_url_here
   
   # Option 2: Using Lark API with direct messaging
   NEXT_PUBLIC_LARK_RECEIVE_ID=your_lark_receive_id_here
   ```
4. Run the development server with `npm run dev`

## Lark Bot Setup

### Common Setup (Required for both methods)
1. Create a Lark (Feishu) app in the [Lark Developer Console](https://open.feishu.cn/app)
2. Enable the required permissions (message sending)
3. Get your App ID and App Secret
4. Add these values to your `.env.local` file

### Option 1: Using Custom Bot Webhook
1. Create a custom bot in your Lark workspace
2. Get the webhook URL for the bot
3. Add the webhook URL to your `.env.local` file as `NEXT_PUBLIC_LARK_WEBHOOK_URL`

### Option 2: Using Direct Messaging
1. Get the receive_id (user_id or chat_id) where you want to receive notifications
2. Add the receive_id to your `.env.local` file as `NEXT_PUBLIC_LARK_RECEIVE_ID`

## Technologies Used

- Next.js 14 (React framework)
- TypeScript
- SQLite (for data persistence)
- GSAP (for animations)
- Tailwind CSS (for styling)
- Server-side API routes for data persistence
- Lark Bot API for notifications

## License

MIT 