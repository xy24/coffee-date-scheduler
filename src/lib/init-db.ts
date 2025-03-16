import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

import { sql } from '@vercel/postgres';
import { defaultBookingSlots, defaultReactions, defaultVisitStats } from './types';

async function createBookingSlotsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS booking_slots (
        id VARCHAR(255) PRIMARY KEY,
        booked INTEGER DEFAULT 0,
        current_month VARCHAR(255)
      );
    `;
    console.log('Booking slots table created successfully');
  } catch (error) {
    console.error('Error creating booking slots table:', error);
    throw error;
  }
}

async function createVisitStatsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS visit_stats (
        id INTEGER PRIMARY KEY,
        visits INTEGER DEFAULT 0,
        today_visits INTEGER DEFAULT 0,
        last_visit_time TIMESTAMP WITH TIME ZONE
      );
    `;
    console.log('Visit stats table created successfully');
  } catch (error) {
    console.error('Error creating visit stats table:', error);
    throw error;
  }
}

async function createReactionsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS reactions (
        id INTEGER PRIMARY KEY,
        likes INTEGER DEFAULT 0,
        dislikes INTEGER DEFAULT 0
      );
    `;
    console.log('Reactions table created successfully');
  } catch (error) {
    console.error('Error creating reactions table:', error);
    throw error;
  }
}

async function createInvitationsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id VARCHAR(255) NOT NULL,
        recipient_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        message TEXT
      );
    `;
    console.log('Invitations table created successfully');
  } catch (error) {
    console.error('Error creating invitations table:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Create all tables
    await createBookingSlotsTable();
    await createVisitStatsTable();
    await createReactionsTable();
    await createInvitationsTable();
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    });
} 