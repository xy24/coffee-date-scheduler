# Coffee Date Scheduler

A Next.js application for scheduling coffee dates. Built with TypeScript, Tailwind CSS, and modern web technologies.

## Features

- Schedule coffee dates for different time slots
- Like/Dislike reactions
- Visit statistics tracking
- Privacy-focused design
- Responsive UI
- Email notifications for new bookings
- Server-side data storage with file persistence

## Prerequisites

- Node.js 18.x or later
- npm or yarn

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd coffee-date-scheduler
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

The application uses the following environment variables:

- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`: Your EmailJS public key
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID`: Your EmailJS service ID
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`: Your EmailJS template ID

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm start
# or
yarn start
```

## Data Storage

The application uses a server-side file-based storage system. All data is stored in a `db.json` file in the root directory of the project. The data is accessed and modified through API routes.

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- GSAP (GreenSock Animation Platform)
- EmailJS
- Server-side API routes for data persistence

## License

MIT 