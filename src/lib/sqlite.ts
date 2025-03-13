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
        id TEXT PRIMARY KEY,
        booked INTEGER DEFAULT 0,
        current_month TEXT
      );

      CREATE TABLE IF NOT EXISTS visit_stats (
        id INTEGER PRIMARY KEY,
        visits INTEGER DEFAULT 0,
        today_visits INTEGER DEFAULT 0,
        last_visit_time TEXT
      );

      CREATE TABLE IF NOT EXISTS reactions (
        id INTEGER PRIMARY KEY,
        likes INTEGER DEFAULT 0,
        dislikes INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Initialize default data if tables are empty
    const slotsCount = db.prepare('SELECT COUNT(*) as count FROM booking_slots').get() as { count: number };
    const reactionsCount = db.prepare('SELECT COUNT(*) as count FROM reactions').get() as { count: number };
    const visitStatsCount = db.prepare('SELECT COUNT(*) as count FROM visit_stats').get() as { count: number };

    if (slotsCount.count === 0) {
      const stmt = db.prepare('INSERT INTO booking_slots (id, booked, current_month) VALUES (?, ?, ?)');
      Object.entries(defaultBookingSlots.slots).forEach(([id, booked]) => {
        stmt.run(id, booked ? 1 : 0, new Date().toISOString().slice(0, 7));
      });
    }

    if (reactionsCount.count === 0) {
      db.prepare('INSERT INTO reactions (likes, dislikes) VALUES (?, ?)')
        .run(defaultReactions.like, defaultReactions.dislike);
    }

    if (visitStatsCount.count === 0) {
      db.prepare('INSERT INTO visit_stats (visits, today_visits, last_visit_time) VALUES (?, ?, ?)')
        .run(defaultVisitStats.visits, defaultVisitStats.todayVisits.count, defaultVisitStats.lastVisitTime);
    }

    // Prepare statements
    const statements = {
      bookingSlots: {
        get: db.prepare('SELECT * FROM booking_slots'),
        update: db.prepare('UPDATE booking_slots SET booked = ? WHERE id = ?')
      },
      visitStats: {
        get: db.prepare('SELECT * FROM visit_stats WHERE id = 1'),
        update: db.prepare('UPDATE visit_stats SET visits = ?, today_visits = ?, last_visit_time = ? WHERE id = 1')
      },
      reactions: {
        get: db.prepare('SELECT * FROM reactions WHERE id = 1'),
        update: db.prepare('UPDATE reactions SET likes = ?, dislikes = ? WHERE id = 1')
      },
      messages: {
        get: db.prepare('SELECT * FROM messages ORDER BY created_at DESC'),
        add: db.prepare('INSERT INTO messages (content, author) VALUES (?, ?)')
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
    get: db.prepare('SELECT * FROM booking_slots'),
    update: db.prepare('UPDATE booking_slots SET booked = ? WHERE id = ?')
  },
  visitStats: {
    get: db.prepare('SELECT * FROM visit_stats WHERE id = 1'),
    update: db.prepare('UPDATE visit_stats SET visits = ?, today_visits = ?, last_visit_time = ? WHERE id = 1')
  },
  reactions: {
    get: db.prepare('SELECT * FROM reactions WHERE id = 1'),
    update: db.prepare('UPDATE reactions SET likes = ?, dislikes = ? WHERE id = 1')
  },
  messages: {
    get: db.prepare('SELECT * FROM messages ORDER BY created_at DESC'),
    add: db.prepare('INSERT INTO messages (content, author) VALUES (?, ?)')
  }
};

export function getBookingSlots(): BookingSlots {
  try {
    if (!db) db = initializeDatabase();
    const slots = statements.bookingSlots.get.all() as Array<{
      id: string;
      booked: number;
      current_month: string;
    }>;
    
    if (!slots || slots.length === 0) {
      console.log('No booking slots found, initializing with default');
      saveBookingSlots(defaultBookingSlots);
      return defaultBookingSlots;
    }

    const slotsMap: { [key: string]: boolean } = {};
    slots.forEach(slot => {
      slotsMap[slot.id] = slot.booked === 1;
    });

    return {
      slots: slotsMap,
      remainingSlots: slots.filter(slot => slot.booked === 0).length,
      currentMonth: slots[0].current_month
    };
  } catch (error) {
    console.error('Error getting booking slots:', error);
    return defaultBookingSlots;
  }
}

export function saveBookingSlots(data: BookingSlots): void {
  if (!db) db = initializeDatabase();
  const stmt = db.prepare('INSERT OR REPLACE INTO booking_slots (id, booked, current_month) VALUES (?, ?, ?)');
  
  Object.entries(data.slots).forEach(([id, booked]) => {
    stmt.run(id, booked ? 1 : 0, data.currentMonth);
  });
}

export function getVisitStats(): VisitStats {
  try {
    if (!db) db = initializeDatabase();
    const result = statements.visitStats.get.get() as {
      visits: number;
      today_visits: number;
      last_visit_time: string;
    };
    
    return {
      visits: result.visits,
      todayVisits: {
        date: new Date().toDateString(),
        count: result.today_visits
      },
      lastVisitTime: result.last_visit_time
    };
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

    statements.visitStats.update.run(
      newStats.visits,
      newStats.todayVisits.count,
      newStats.lastVisitTime
    );
    return newStats;
  } catch (error) {
    console.error('Error updating visit stats:', error);
    throw error;
  }
}

export function getReactions(): Reactions {
  try {
    if (!db) db = initializeDatabase();
    const result = statements.reactions.get.get() as {
      likes: number;
      dislikes: number;
    };
    
    return {
      like: result.likes,
      dislike: result.dislikes
    };
  } catch (error) {
    console.error('Error getting reactions:', error);
    throw error;
  }
}

export function saveReactions(data: Reactions): void {
  try {
    if (!db) db = initializeDatabase();
    statements.reactions.update.run(data.like, data.dislike);
  } catch (error) {
    console.error('Error saving reactions:', error);
    throw error;
  }
}

export function getMessages() {
  try {
    if (!db) db = initializeDatabase();
    return statements.messages.get.all();
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

export function addMessage(content: string, author: string) {
  try {
    if (!db) db = initializeDatabase();
    const result = statements.messages.add.run(content, author);
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error adding message:', error);
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