import './globals.css';
import { initializeApp } from '@/lib/init-app';

// Initialize app on the server side
initializeApp().catch(console.error);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 