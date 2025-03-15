import { sql } from '@vercel/postgres';
import { 
  BookingSlots, 
  VisitStats, 
  Reactions, 
  defaultBookingSlots, 
  defaultVisitStats, 
  defaultReactions 
} from './types';
import { unstable_noStore as noStore } from 'next/cache';

// Booking slots functions
export async function getBookingSlots(): Promise<BookingSlots> {
  try {
    noStore();
    const result = await sql`SELECT * FROM booking_slots`;
    const slots = result.rows;
    
    if (!slots || slots.length === 0) {
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

export async function saveBookingSlots(data: BookingSlots): Promise<void> {
  try {
    for (const [id, booked] of Object.entries(data.slots)) {
      await sql`
        INSERT INTO booking_slots (id, booked, current_month)
        VALUES (${id}, ${booked ? 1 : 0}, ${data.currentMonth})
        ON CONFLICT (id) DO UPDATE 
        SET booked = ${booked ? 1 : 0}, 
            current_month = ${data.currentMonth}
      `;
    }
  } catch (error) {
    console.error('Error saving booking slots:', error);
    throw error;
  }
}

// Visit stats functions
export async function getVisitStats(): Promise<VisitStats> {
  try {
    noStore();
    const result = await sql`SELECT * FROM visit_stats WHERE id = 1`;
    const stats = result.rows[0];
    
    if (!stats) {
      return defaultVisitStats;
    }

    return {
      visits: stats.visits,
      todayVisits: {
        date: new Date().toDateString(),
        count: stats.today_visits
      },
      lastVisitTime: stats.last_visit_time
    };
  } catch (error) {
    console.error('Error getting visit stats:', error);
    throw error;
  }
}

export async function updateVisitStats(): Promise<VisitStats> {
  try {
    const currentStats = await getVisitStats();
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

    await sql`
      INSERT INTO visit_stats (id, visits, today_visits, last_visit_time)
      VALUES (1, ${newStats.visits}, ${newStats.todayVisits.count}, ${newStats.lastVisitTime})
      ON CONFLICT (id) DO UPDATE 
      SET visits = ${newStats.visits}, 
          today_visits = ${newStats.todayVisits.count}, 
          last_visit_time = ${newStats.lastVisitTime}
    `;

    return newStats;
  } catch (error) {
    console.error('Error updating visit stats:', error);
    throw error;
  }
}

// Reactions functions
export async function getReactions(): Promise<Reactions> {
  try {
    noStore();
    const result = await sql`SELECT * FROM reactions WHERE id = 1`;
    const reactions = result.rows[0];
    
    if (!reactions) {
      return defaultReactions;
    }

    return {
      like: reactions.likes,
      dislike: reactions.dislikes
    };
  } catch (error) {
    console.error('Error getting reactions:', error);
    throw error;
  }
}

export async function saveReactions(data: Reactions): Promise<void> {
  try {
    await sql`
      INSERT INTO reactions (id, likes, dislikes)
      VALUES (1, ${data.like}, ${data.dislike})
      ON CONFLICT (id) DO UPDATE 
      SET likes = ${data.like}, 
          dislikes = ${data.dislike}
    `;
  } catch (error) {
    console.error('Error saving reactions:', error);
    throw error;
  }
}
