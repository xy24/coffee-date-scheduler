import Database from 'better-sqlite3';
import path from 'path';
import { BookingData } from './db';

const dbPath = path.join(process.cwd(), 'booking.db');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS booking_data (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL
  );
`);

// Insert default data if not exists
const initStmt = db.prepare(`
  INSERT INTO booking_data (id, data)
  SELECT 1, ?
  WHERE NOT EXISTS (SELECT 1 FROM booking_data WHERE id = 1);
`);

initStmt.run(JSON.stringify({
  slots: {
    1: { booked: false, time: '第一周' },
    2: { booked: false, time: '第二周' },
    3: { booked: false, time: '第三周' },
    4: { booked: false, time: '第四周' }
  },
  remainingSlots: 4,
  stats: {
    visits: 0,
    todayVisits: {
      date: new Date().toDateString(),
      count: 0
    },
    lastVisitTime: new Date().toLocaleString('zh-CN')
  },
  reactions: {
    like: 0,
    dislike: 0
  }
}));

// Prepare statements
const getDataStmt = db.prepare('SELECT data FROM booking_data WHERE id = 1');
const updateDataStmt = db.prepare('UPDATE booking_data SET data = ? WHERE id = 1');

interface DbRow {
  data: string;
}

export function getData(): BookingData {
  const result = getDataStmt.get() as DbRow;
  return JSON.parse(result.data);
}

export function saveData(data: BookingData): void {
  updateDataStmt.run(JSON.stringify(data));
}

// Close database on process exit
process.on('exit', () => db.close()); 