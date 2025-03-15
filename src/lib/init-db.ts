import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

import { sql } from '@vercel/postgres';
import { defaultBookingSlots, defaultReactions, defaultVisitStats } from './types';

async function initDb() {
  try {
    // Verify environment variables are loaded
    if (!process.env.POSTGRES_URL) {
      throw new Error('Database connection string not found. Make sure POSTGRES_URL is set in .env.local');
    }

    console.log('Creating tables...');
    
    // Drop existing tables
    await sql`DROP TABLE IF EXISTS booking_slots`;
    await sql`DROP TABLE IF EXISTS visit_stats`;
    await sql`DROP TABLE IF EXISTS reactions`;

    // Create tables
    await sql`CREATE TABLE IF NOT EXISTS booking_slots (
      id TEXT PRIMARY KEY,
      booked INTEGER DEFAULT 0,
      current_month TEXT
    )`;

    await sql`CREATE TABLE IF NOT EXISTS visit_stats (
      id INTEGER PRIMARY KEY,
      visits INTEGER DEFAULT 0,
      today_visits INTEGER DEFAULT 0,
      last_visit_time TEXT
    )`;

    await sql`CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY,
      likes INTEGER DEFAULT 0,
      dislikes INTEGER DEFAULT 0
    )`;

    console.log('Tables created successfully');

    // Initialize with default data
    console.log('Initializing booking slots...');
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Insert all booking slots
    for (const [id, booked] of Object.entries(defaultBookingSlots.slots)) {
      await sql`
        INSERT INTO booking_slots (id, booked, current_month) 
        VALUES (${id}, ${booked ? 1 : 0}, ${currentMonth})
        ON CONFLICT (id) DO UPDATE 
        SET booked = ${booked ? 1 : 0}, 
            current_month = ${currentMonth}
      `;
    }

    console.log('Initializing reactions...');
    await sql`
      INSERT INTO reactions (id, likes, dislikes) 
      VALUES (1, ${defaultReactions.like}, ${defaultReactions.dislike})
      ON CONFLICT (id) DO UPDATE 
      SET likes = ${defaultReactions.like}, 
          dislikes = ${defaultReactions.dislike}
    `;

    console.log('Initializing visit stats...');
    await sql`
      INSERT INTO visit_stats (id, visits, today_visits, last_visit_time) 
      VALUES (1, ${defaultVisitStats.visits}, ${defaultVisitStats.todayVisits.count}, ${defaultVisitStats.lastVisitTime})
      ON CONFLICT (id) DO UPDATE 
      SET visits = ${defaultVisitStats.visits}, 
          today_visits = ${defaultVisitStats.todayVisits.count}, 
          last_visit_time = ${defaultVisitStats.lastVisitTime}
    `;

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Run the initialization
initDb(); 