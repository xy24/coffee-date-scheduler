import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync, existsSync } from 'fs';
import { 
  BookingSlots, 
  VisitStats, 
  Reactions, 
  defaultBookingSlots, 
  defaultVisitStats, 
  defaultReactions 
} from './types';

// Use an absolute path for the database
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'booking.db');

console.log('Database path:', DB_PATH);

// Ensure the data directory exists
if (!existsSync(DATA_DIR)) {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory:', DATA_DIR);
  } catch (error) {
    console.error('Failed to create data directory:', error);
    throw error;
  }
}

function initializeDatabase() {
  if (db) {
    try {
      db.close();
    } catch (error) {
      console.error('Error closing existing database connection:', error);
    }
  }

  try {
    console.log('Initializing database connection...');
    db = new Database(DB_PATH, { 
      timeout: 5000      // Wait up to 5 seconds when the database is busy
    });
    
    // Configure busy timeout
    db.pragma('busy_timeout = 5000');
    
    // Initialize database schema with separate tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS booking_slots (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS visit_stats (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reactions (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Initialize tables with default data if empty
    const initializeTable = (tableName: string, defaultData: any) => {
      const count = db!.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number };
      
      if (count.count === 0) {
        console.log(`Initializing ${tableName} with default data:`, defaultData);
        const stmt = db!.prepare(`INSERT INTO ${tableName} (id, data) VALUES (1, ?)`);
        stmt.run(JSON.stringify(defaultData));
        console.log(`${tableName} initialized successfully`);
      }
    };

    // Initialize each table
    initializeTable('booking_slots', defaultBookingSlots);
    initializeTable('visit_stats', defaultVisitStats);
    initializeTable('reactions', defaultReactions);

    // Prepare statements
    const statements = {
      bookingSlots: {
        get: db.prepare('SELECT data FROM booking_slots WHERE id = 1'),
        update: db.prepare('UPDATE booking_slots SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
      },
      visitStats: {
        get: db.prepare('SELECT data FROM visit_stats WHERE id = 1'),
        update: db.prepare('UPDATE visit_stats SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
      },
      reactions: {
        get: db.prepare('SELECT data FROM reactions WHERE id = 1'),
        update: db.prepare('UPDATE reactions SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
      }
    };

    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Initialize database connection
let db: Database.Database | null = null;
try {
  console.log('Initial database setup...');
  db = initializeDatabase();
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Failed to setup database:', error);
  throw error;
}

// Export the prepared statements
const statements = {
  bookingSlots: {
    get: db.prepare('SELECT data FROM booking_slots WHERE id = 1'),
    update: db.prepare('UPDATE booking_slots SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
  },
  visitStats: {
    get: db.prepare('SELECT data FROM visit_stats WHERE id = 1'),
    update: db.prepare('UPDATE visit_stats SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
  },
  reactions: {
    get: db.prepare('SELECT data FROM reactions WHERE id = 1'),
    update: db.prepare('UPDATE reactions SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
  }
};

export function getBookingSlots(): BookingSlots {
  try {
    if (!db) db = initializeDatabase();
    const result = statements.bookingSlots.get.get() as { data: string } | undefined;
    
    if (!result) {
      console.log('No booking slots found, initializing with default');
      saveBookingSlots(defaultBookingSlots);
      return defaultBookingSlots;
    }

    try {
      const parsedData = JSON.parse(result.data);
      
      if (!parsedData.slots || typeof parsedData.remainingSlots !== 'number') {
        saveBookingSlots(defaultBookingSlots);
        return defaultBookingSlots;
      }
      
      return parsedData;
    } catch (parseError) {
      console.error('Error parsing booking slots:', parseError);
      saveBookingSlots(defaultBookingSlots);
      return defaultBookingSlots;
    }
  } catch (error) {
    console.error('Error getting booking slots:', error);
    return defaultBookingSlots;
  }
}

export function saveBookingSlots(data: BookingSlots): void {
  if (!db) db = initializeDatabase();
  statements.bookingSlots.update.run(JSON.stringify(data));
}

export function getVisitStats(): VisitStats {
  try {
    if (!db) db = initializeDatabase();
    const result = statements.visitStats.get.get() as { data: string };
    return JSON.parse(result.data);
  } catch (error) {
    console.error('Error getting visit stats:', error);
    throw error;
  }
}

export function updateVisitStats(): VisitStats {
  try {
    if (!db) db = initializeDatabase();
    const currentStats = getVisitStats();
    const today = new Date().toDateString();
    
    const newStats: VisitStats = {
      visits: currentStats.visits + 1,
      todayVisits: {
        date: today,
        count: currentStats.todayVisits.date === today 
          ? currentStats.todayVisits.count + 1 
          : 1
      },
      lastVisitTime: new Date().toLocaleString('zh-CN')
    };

    statements.visitStats.update.run(JSON.stringify(newStats));
    return newStats;
  } catch (error) {
    console.error('Error updating visit stats:', error);
    throw error;
  }
}

export function getReactions(): Reactions {
  try {
    if (!db) db = initializeDatabase();
    const result = statements.reactions.get.get() as { data: string };
    return JSON.parse(result.data);
  } catch (error) {
    console.error('Error getting reactions:', error);
    throw error;
  }
}

export function saveReactions(data: Reactions): void {
  try {
    if (!db) db = initializeDatabase();
    statements.reactions.update.run(JSON.stringify(data));
  } catch (error) {
    console.error('Error saving reactions:', error);
    throw error;
  }
}

// Handle process termination
process.on('exit', () => {
  if (db) {
    console.log('Closing database connection...');
    try {
      db.close();
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
});

process.on('SIGINT', () => {
  if (db) {
    console.log('Closing database connection on SIGINT...');
    try {
      db.close();
    } catch (error) {
      console.error('Error closing database on SIGINT:', error);
    }
  }
  process.exit(0);
}); 