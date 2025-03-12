'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import emailjs from '@emailjs/browser';
import { BookingData, getBookingData, updateBookingData } from '@/lib/db';
import ClickableImage from './components/ClickableImage';
import AnimatedReactionButton from './components/AnimatedReactionButton';

// Constants
const NOTIFICATION_CONFIG = {
  emailjs: {
    serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_9jpbn2p',
    templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_s88ikl9',
  }
};

const TIME_CONFIG = {
  monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', 
               '七月', '八月', '九月', '十月', '十一月', '十二月']
};

export default function Home() {
  const [bookingData, setBookingData] = useState<BookingData>({
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
  });
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slot: ''
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const data = await loadBookingData();
      if (data) {
        setBookingData(data);
      }
      await updateVisitCount();
      initReactions();
      initCoffeeBanner();
    } catch (error) {
      console.error('Failed to initialize:', error);
      alert('加载失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  const loadBookingData = async () => {
    try {
      return await getBookingData();
    } catch (error) {
      console.error('Failed to load booking data:', error);
      return null;
    }
  };

  const saveBookingData = async (data: BookingData) => {
    try {
      await updateBookingData(data);
      return data;
    } catch (error) {
      console.error('Failed to save booking data:', error);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.slot) {
      alert('请选择时间段');
      return;
    }

    if (bookingData.slots[formData.slot].booked) {
      alert('该时间段已被预约');
      return;
    }

    try {
      const newBookingData = {
        ...bookingData,
        slots: {
          ...bookingData.slots,
          [formData.slot]: { ...bookingData.slots[formData.slot], booked: true }
        },
        remainingSlots: bookingData.remainingSlots - 1
      };

      await saveBookingData(newBookingData);
      setBookingData(newBookingData);
      setShowSuccess(true);
      setFormData({ name: '', slot: '' });

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('预约失败：', error);
      alert('预约失败，请重试');
    }
  };

  const handleReaction = async (type: 'like' | 'dislike') => {
    const newBookingData = {
      ...bookingData,
      reactions: {
        ...bookingData.reactions,
        [type]: bookingData.reactions[type] + 1
      }
    };

    await saveBookingData(newBookingData);
    setBookingData(newBookingData);
  };

  const updateVisitCount = async () => {
    const today = new Date().toDateString();
    const newBookingData = {
      ...bookingData,
      stats: {
        ...bookingData.stats,
        visits: bookingData.stats.visits + 1,
        todayVisits: {
          date: today,
          count: bookingData.stats.todayVisits.date === today 
            ? bookingData.stats.todayVisits.count + 1 
            : 1
        },
        lastVisitTime: new Date().toLocaleString('zh-CN')
      }
    };

    await saveBookingData(newBookingData);
    setBookingData(newBookingData);
  };

  const initReactions = () => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "hick0U5XbCJJWRHmF");
  };

  const initCoffeeBanner = () => {
    gsap.to("#coffee-banner", {
      y: -10,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="header text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">☕️ 来和我喝杯咖啡吧</h1>
        <div className="coffee-banner-wrapper mb-4">
          <ClickableImage onImageClick={() => handleReaction('like')} />
        </div>
        <div className="reaction-buttons flex justify-center gap-4">
          <AnimatedReactionButton
            onClick={() => handleReaction('like')}
            emoji="❤️"
            label="赞一赞"
            count={bookingData.reactions.like}
            className="bg-pink-100 hover:bg-pink-200"
          />
          <AnimatedReactionButton
            onClick={() => handleReaction('dislike')}
            emoji="🌚"
            label="踩一踩"
            count={bookingData.reactions.dislike}
            className="bg-gray-100 hover:bg-gray-200"
          />
        </div>
      </div>

      <div className="month-display text-center mb-8">
        <h2 className="text-2xl">
          预约yxy <span>{TIME_CONFIG.monthNames[new Date().getMonth()]}</span> 咖啡时间
        </h2>
      </div>

      <div className="privacy-notice bg-blue-50 p-4 rounded-lg mb-8">
        <p className="text-sm">
          🔒 隐私保护：您的预约信息将被严格保密，其他人只能看到时间段是否被预约。预约成功后，我将收到邮件通知。
        </p>
      </div>

      <div className="status-panel mb-8">
        <h2 className="text-xl mb-4">本月剩余名额：<span>{bookingData.remainingSlots}</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(bookingData.slots).map(([slotId, data]) => (
            <div
              key={slotId}
              className={`slot-item p-4 rounded-lg ${
                data.booked ? 'bg-red-100' : 'bg-green-100'
              }`}
            >
              <div className="slot-status font-bold">
                {data.booked ? '已预约' : '空闲'}
              </div>
              <div className="slot-time">{data.time}</div>
              <div className="slot-name">
                {data.booked ? '已被预约' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="booking-panel bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl mb-4">预约咖啡时间</h3>
        <form onSubmit={handleBooking}>
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
            <label htmlFor="slot-select" className="block mb-2">选择时间段</label>
            <select
              id="slot-select"
              value={formData.slot}
              onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">请选择时间段</option>
              {Object.entries(bookingData.slots)
                .filter(([_, data]) => !data.booked)
                .map(([slotId, data]) => (
                  <option key={slotId} value={slotId}>
                    {data.time}
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
        <p>👀 总访问次数：{bookingData.stats.visits}</p>
        <p>📅 今日访问：{bookingData.stats.todayVisits.count}</p>
        <p>🕒 最近访问：{bookingData.stats.lastVisitTime}</p>
      </div>
    </main>
  );
} 