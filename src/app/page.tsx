'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { 
  BookingSlots, 
  VisitStats, 
  Reactions, 
  defaultBookingSlots, 
  defaultVisitStats, 
  defaultReactions 
} from '@/lib/types';
import ClickableImage from './components/ClickableImage';
import AnimatedReactionButton from './components/AnimatedReactionButton';
import { toast } from 'react-hot-toast';

// Constants
const NOTIFICATION_CONFIG = {
  lark: {
    webhookUrl: process.env.NEXT_PUBLIC_LARK_WEBHOOK_URL || 'your_lark_webhook_url_here',
    appId: process.env.NEXT_PUBLIC_LARK_APP_ID || 'your_lark_app_id_here',
    appSecret: process.env.NEXT_PUBLIC_LARK_APP_SECRET || 'your_lark_app_secret_here',
    chatId: process.env.NEXT_PUBLIC_LARK_CHAT_ID || 'your_lark_chat_id_here'
  }
};

const TIME_CONFIG = {
  monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', 
               '七月', '八月', '九月', '十月', '十一月', '十二月']
};

const NOTIFICATION_DURATION = 2000;
const TIME_OPTIONS = ['第一周', '第二周', '第三周', '第四周'];

export default function Home() {
  const [bookingSlots, setBookingSlots] = useState<BookingSlots>(defaultBookingSlots);
  const [visitStats, setVisitStats] = useState<VisitStats>(defaultVisitStats);
  const [reactions, setReactions] = useState<Reactions>(defaultReactions);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', time: '' });
  const [error, setError] = useState<string | null>(null);
  const visitStatsRequested = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        setError(null);
        console.log('Starting data initialization...');
        
        // Load initial data with detailed error logging
        const [slotsResponse, reactionsResponse] = await Promise.all([
          fetch('/api/booking-slots').catch(error => {
            console.error('Failed to fetch booking slots:', error);
            throw new Error('Booking slots fetch failed');
          }),
          fetch('/api/reactions').catch(error => {
            console.error('Failed to fetch reactions:', error);
            throw new Error('Reactions fetch failed');
          })
        ]);

        // Check individual response status
        if (!slotsResponse.ok) {
          console.error('Booking slots response not ok:', await slotsResponse.text());
          throw new Error(`Booking slots error: ${slotsResponse.status}`);
        }
        if (!reactionsResponse.ok) {
          console.error('Reactions response not ok:', await reactionsResponse.text());
          throw new Error(`Reactions error: ${reactionsResponse.status}`);
        }

        // Only fetch visit stats if we haven't already
        let statsResponse;
        if (!visitStatsRequested.current) {
          visitStatsRequested.current = true;
          statsResponse = await fetch('/api/visit-stats').catch(error => {
            console.error('Failed to fetch visit stats:', error);
            throw new Error('Visit stats fetch failed');
          });

          if (!statsResponse.ok) {
            console.error('Visit stats response not ok:', await statsResponse.text());
            throw new Error(`Visit stats error: ${statsResponse.status}`);
          }
        }

        console.log('All responses received, parsing JSON...');

        const slots = await slotsResponse.json();
        const reactions = await reactionsResponse.json();
        const stats = statsResponse ? await statsResponse.json() : visitStats;

        console.log('Received data:', { slots, stats, reactions });

        setBookingSlots(slots);
        setVisitStats(stats);
        setReactions(reactions);

        // Initialize animations
        gsap.from('.booking-slot', {
          opacity: 0,
          y: 20,
          duration: 0.5,
          stagger: 0.1,
        });

        console.log('Initialization complete');
      } catch (error) {
        console.error('Initialization error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleBooking = async (time: string, name: string) => {
    try {
      console.log('Booking time:', time);
      
      // Only send the specific slot we want to update
      const response = await fetch('/api/booking-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time: time,
          name: name
        }),
      });

      const data = await response.json();
      console.log('Booking response:', data);
      
      if (!response.ok) {
        toast.error(data.error || 'Failed to book slot');
        return;
      }

      // Update local state only after successful booking
      setBookingSlots({
        slots: {
          ...bookingSlots.slots,
          [time]: true
        },
        remainingSlots: bookingSlots.remainingSlots - 1,
        currentMonth: bookingSlots.currentMonth
      });
      setFormData({ name: '', time: '' }); // Reset form
      toast.success('Successfully booked!');
    } catch (error) {
      console.error('Network error in booking:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handleReaction = async (type: 'like' | 'dislike') => {
    try {
      const updatedReactions = {
        ...reactions,
        [type]: reactions[type] + 1
      };

      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReactions)
      });

      setReactions(updatedReactions);
    } catch (error) {
      console.error('Error updating reactions:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <div className="mt-4">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  // Ensure we have valid data before rendering
  const slots = bookingSlots?.slots || defaultBookingSlots.slots;
  const remainingSlots = bookingSlots?.remainingSlots ?? defaultBookingSlots.remainingSlots;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="header text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-3xl font-bold">☕️ 来和我喝杯咖啡吧</h1>
          <div className="flex items-center gap-2">
            <div className="coffee-banner-wrapper">
              <ClickableImage onImageClick={() => handleReaction('like')} />
            </div>
            <div className="reaction-buttons flex flex-col gap-2">
              <AnimatedReactionButton
                onClick={() => handleReaction('like')}
                emoji="❤️"
                label="赞一赞"
                count={reactions.like}
                className="bg-pink-100 hover:bg-pink-200"
              />
              <AnimatedReactionButton
                onClick={() => handleReaction('dislike')}
                emoji="🌚"
                label="踩一踩"
                count={reactions.dislike}
                className="bg-gray-100 hover:bg-gray-200"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="month-display text-center mb-8">
        <h2 className="text-2xl">
          预约yxy <span>{TIME_CONFIG.monthNames[new Date().getMonth()+1]}</span> 咖啡时间
        </h2>
      </div>

      <div className="privacy-notice bg-blue-50 p-4 rounded-lg mb-8">
        <p className="text-sm">
          🔒 隐私保护：您的预约信息将被严格保密，其他人只能看到时间段是否被预约。预约成功后，我将收到飞书通知。
        </p>
      </div>

      <div className="status-panel mb-8">
        <h2 className="text-xl mb-4">本月剩余名额：<span>{remainingSlots}</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(slots).map(([slotId, booked]) => (
            <div
              key={slotId}
              className={`slot-item p-4 rounded-lg ${
                booked ? 'bg-red-100' : 'bg-green-100'
              }`}
            >
              <div className="slot-status font-bold">
                {booked ? '已预约' : '空闲'}
              </div>
              <div className="slot-time">{slotId}</div>
              <div className="slot-name">
                {booked ? '已被预约' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="booking-panel bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl mb-4">预约咖啡时间</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleBooking(formData.time, formData.name); }}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2">您的姓名</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full p-2 border rounded"
              placeholder="请输入姓名"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="time-select" className="block mb-2">选择时间段</label>
            <select
              id="time-select"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">请选择时间段</option>
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            预约
          </button>
        </form>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <div className="success-checkmark mb-4">
              <div className="check-icon"></div>
            </div>
            <h3 className="text-xl">预约成功！</h3>
          </div>
        </div>
      )}

      <div className="visit-stats text-center text-sm text-gray-600">
        <p>👀 总访问次数：{visitStats.visits}</p>
        <p>📅 今日访问：{visitStats.todayVisits.count}</p>
        <p>🕒 最近访问：{visitStats.lastVisitTime}</p>
      </div>
    </main>
  );
} 