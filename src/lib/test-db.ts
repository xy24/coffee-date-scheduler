import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

import { sql } from '@vercel/postgres';

async function testDb() {
  try {
    console.log('Testing database connection...');

    // Test booking slots
    const bookingSlots = await sql`SELECT * FROM booking_slots`;
    console.log('\nBooking Slots:', bookingSlots.rows);

    // Test reactions
    const reactions = await sql`SELECT * FROM reactions`;
    console.log('\nReactions:', reactions.rows);

    // Test visit stats
    const visitStats = await sql`SELECT * FROM visit_stats`;
    console.log('\nVisit Stats:', visitStats.rows);

    console.log('\nDatabase test completed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDb(); 