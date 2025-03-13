// Shared types for both client and server
export interface BookingSlots {
  slots: {
    [key: string]: boolean;
  };
  remainingSlots: number;
  currentMonth: string;
}

export interface VisitStats {
  visits: number;
  todayVisits: {
    date: string;
    count: number;
  };
  lastVisitTime: string;
}

export interface Reactions {
  like: number;
  dislike: number;
}

// Default data with proper structure
export const defaultBookingSlots: BookingSlots = {
  slots: {
    '第一周': false,
    '第二周': false,
    '第三周': false,
    '第四周': false,
  },
  remainingSlots: 4,
  currentMonth: new Date().toISOString().slice(0, 7)
};

export const defaultVisitStats: VisitStats = {
  visits: 0,
  todayVisits: {
    date: new Date().toDateString(),
    count: 0
  },
  lastVisitTime: new Date().toLocaleString('zh-CN')
};

export const defaultReactions: Reactions = {
  like: 0,
  dislike: 0
}; 