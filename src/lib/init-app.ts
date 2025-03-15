import { startWebSocket } from './lark-ws';

export async function initializeApp() {
  try {
    // Start Lark WebSocket connection
    startWebSocket();
    
    // Add any other app initialization here
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
} 