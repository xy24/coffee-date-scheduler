// 存储预约数据的结构
let bookingData = {
    slots: {
        1: { booked: false, name: '', time: '第一周' },
        2: { booked: false, name: '', time: '第二周' },
        3: { booked: false, name: '', time: '第三周' },
        4: { booked: false, name: '', time: '第四周' }
    },
    remainingSlots: 4
};

// 通知系统配置
const NOTIFICATION_CONFIG = {
    emailjs: {
        serviceId: 'service_9jpbn2p',  // 替换为您的 Email.js service ID
        templateId: 'template_s88ikl9',  // 替换为您的 Email.js template ID
    }
};

// 在现有配置后添加
const TIME_CONFIG = {
    monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', 
                 '七月', '八月', '九月', '十月', '十一月', '十二月']
};

const ADMIN_CONFIG = {
    passwordHash: 'd8d42ae90acd4c887940ea9290780ec1e50ec5a8d77c4242079d61cd222e8f84'
};

// 生成正确的哈希值
async function generateHash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('Generated hash:', hashHex); // 用于获取正确的哈希值
    return hashHex;
}

// 初始化函数
function init() {
    // 从localStorage加载数据
    const savedData = localStorage.getItem('bookingData');
    if (savedData) {
        bookingData = JSON.parse(savedData);
        updateUI();
    }

    // 添加表单提交事件监听
    document.getElementById('booking-form').addEventListener('submit', handleBooking);

    // 添加重置按钮事件监听
    document.getElementById('reset-button').addEventListener('click', handleReset);

    // 添加月份显示
    updateMonthDisplay();

    // 初始化UI
    updateUI();

    // 更新访问次数
    updateVisitCount();

    // 初始化点赞数据
    initReactions();

    // 初始化咖啡图片点击效果
    initCoffeeBanner();
}

// 处理预约提交
function handleBooking(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('name');
    const slotSelect = document.getElementById('slot-select');
    
    const name = nameInput.value.trim();
    const slotId = slotSelect.value;

    if (!name || !slotId) {
        alert('请填写完整信息');
        return;
    }

    if (bookingData.slots[slotId].booked) {
        alert('该时间段已被预约');
        return;
    }

    // 更新预约数据
    bookingData.slots[slotId].booked = true;
    bookingData.slots[slotId].name = name;
    bookingData.remainingSlots--;

    // 保存到localStorage
    localStorage.setItem('bookingData', JSON.stringify(bookingData));

    // 更新UI
    updateUI();

    // 显示成功动画
    showSuccessAnimation();

    // 发送通知
    notifyAdmin(name, slotId)
        .then(() => {
            console.log('预约通知已发送');
        })
        .catch(error => {
            console.error('预约通知发送失败：', error);
        });

    // 重置表单
    event.target.reset();
}

// 更新UI显示
function updateUI() {
    // 更新剩余名额
    document.getElementById('remaining-slots').textContent = bookingData.remainingSlots;

    // 更新每个时间槽的显示
    Object.entries(bookingData.slots).forEach(([slotId, data]) => {
        const slotElement = document.getElementById(`slot${slotId}`);
        const statusElement = slotElement.querySelector('.slot-status');
        const nameElement = slotElement.querySelector('.slot-name');

        if (data.booked) {
            slotElement.classList.remove('available');
            slotElement.classList.add('booked');
            statusElement.textContent = '已预约';
            nameElement.textContent = '已被预约';  // 不显示具体名字，保护隐私
        } else {
            slotElement.classList.add('available');
            slotElement.classList.remove('booked');
            statusElement.textContent = '空闲';
            nameElement.textContent = '';
        }
    });

    // 更新下拉选择框选项
    updateSlotSelect();
}

// 更新时间槽选择框
function updateSlotSelect() {
    const slotSelect = document.getElementById('slot-select');
    const options = slotSelect.querySelectorAll('option');

    options.forEach(option => {
        if (option.value) {  // 跳过默认的空选项
            const slotId = option.value;
            option.disabled = bookingData.slots[slotId].booked;
        }
    });
}

// 显示成功动画
function showSuccessAnimation() {
    const successAnimation = document.querySelector('.success-animation');
    successAnimation.style.display = 'block';
    
    setTimeout(() => {
        successAnimation.style.display = 'none';
    }, 2000);
}

// 发送通知给管理员
async function notifyAdmin(name, slotId) {
    const time = bookingData.slots[slotId].time;
    const message = `新预约通知：${name} 预约了 ${time} 的咖啡时间`;
    
    try {
        // 发送邮件通知
        await sendEmailNotification(name, time);
        console.log('通知发送成功：', message);
    } catch (error) {
        console.error('通知发送失败：', error);
    }
}

// 发送邮件通知
async function sendEmailNotification(name, time) {
    const templateParams = {
        from_name: name,
        booking_time: time,
        message: `${name} 预约了 ${time} 的咖啡时间`,
    };

    try {
        await emailjs.send(
            NOTIFICATION_CONFIG.emailjs.serviceId,
            NOTIFICATION_CONFIG.emailjs.templateId,
            templateParams
        );
    } catch (error) {
        throw new Error('邮件发送失败：' + error.message);
    }
}

// 检查是否需要月度重置
function checkMonthlyReset() {
    const lastResetDate = localStorage.getItem('lastResetDate');
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (!lastResetDate || new Date(lastResetDate) < firstDayOfMonth) {
        resetBookingData();
    }
}

// 重置预约数据
function resetBookingData() {
    bookingData = {
        slots: {
            1: { booked: false, name: '', time: '第一周' },
            2: { booked: false, name: '', time: '第二周' },
            3: { booked: false, name: '', time: '第三周' },
            4: { booked: false, name: '', time: '第四周' }
        },
        remainingSlots: 4
    };
    
    localStorage.setItem('bookingData', JSON.stringify(bookingData));
    localStorage.setItem('lastResetDate', new Date().toISOString());
    
    updateUI();
}

// 修改重置处理函数
function handleReset() {
    const password = prompt('请输入管理员密码：');
    if (!password) return;
    
    // 使用 SHA-256 哈希算法
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    crypto.subtle.digest('SHA-256', data).then(hash => {
        // 转换哈希值为十六进制字符串
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (hashHex === ADMIN_CONFIG.passwordHash) {
            if (confirm('确定要重置本月的所有预约数据吗？')) {
                resetBookingData();
                alert('数据已重置！');
            }
        } else {
            alert('密码错误！');
        }
    });
}

// 保留月份显示函数
function updateMonthDisplay() {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const monthDisplay = document.getElementById('target-month');
    monthDisplay.textContent = TIME_CONFIG.monthNames[nextMonth.getMonth()];
}

// 修改访问统计函数
function updateVisitCount() {
    // 获取当前时间
    const now = new Date();
    const today = now.toDateString();
    
    // 获取总访问次数
    let visits = parseInt(localStorage.getItem('visitCount') || '0');
    visits += 1;
    
    // 获取今日访问数据
    let todayData = JSON.parse(localStorage.getItem('todayVisits') || '{"date":"","count":0}');
    if (todayData.date !== today) {
        // 新的一天，重置计数
        todayData = {
            date: today,
            count: 1
        };
    } else {
        // 同一天，增加计数
        todayData.count += 1;
    }
    
    // 更新最近访问时间
    const lastVisitTime = now.toLocaleString('zh-CN', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    // 保存数据
    localStorage.setItem('visitCount', visits.toString());
    localStorage.setItem('todayVisits', JSON.stringify(todayData));
    localStorage.setItem('lastVisitTime', lastVisitTime);

    // 更新显示
    document.getElementById('visit-count').textContent = visits.toString();
    document.getElementById('today-visit-count').textContent = todayData.count.toString();
    document.getElementById('last-visit-time').textContent = lastVisitTime;
}

// 处理点赞函数
function handleReaction(type) {
    const countKey = `${type}Count`;
    const count = parseInt(localStorage.getItem(countKey) || '0') + 1;
    localStorage.setItem(countKey, count.toString());
    
    const btn = document.querySelector(`.reaction-btn.${type}`);
    const emojiElement = btn.querySelector('.emoji');
    const countElement = document.getElementById(`${type}-count`);
    
    // 更新计数
    countElement.textContent = count;
    
    // 添加弹出动画
    emojiElement.classList.add('pop');
    setTimeout(() => emojiElement.classList.remove('pop'), 300);

    // 创建浮动表情
    const floating = document.createElement('span');
    floating.textContent = type === 'like' ? '❤️' : '🌚';
    floating.className = 'floating';
    btn.appendChild(floating);

    // 动画结束后移除元素
    setTimeout(() => floating.remove(), 800);
}

// 初始化点赞功能
function initReactions() {
    // 从localStorage加载点赞数据
    const likes = parseInt(localStorage.getItem('likeCount') || '0');
    const dislikes = parseInt(localStorage.getItem('dislikeCount') || '0');
    
    document.getElementById('like-count').textContent = likes;
    document.getElementById('dislike-count').textContent = dislikes;

    // 添加点击事件监听
    const likeBtn = document.querySelector('.reaction-btn.like');
    const dislikeBtn = document.querySelector('.reaction-btn.dislike');

    likeBtn.addEventListener('click', () => handleReaction('like'));
    dislikeBtn.addEventListener('click', () => handleReaction('dislike'));
}

// 修改初始化咖啡图片点击效果
function initCoffeeBanner() {
    const banner = document.getElementById('coffee-banner');
    
    banner.addEventListener('click', () => {
        // 添加弹出动画
        banner.classList.add('pop');
        setTimeout(() => banner.classList.remove('pop'), 300);

        // 创建浮动爱心
        const floating = document.createElement('span');
        floating.textContent = '❤️';
        floating.className = 'floating';
        banner.parentElement.appendChild(floating);

        // 动画结束后移除元素
        setTimeout(() => floating.remove(), 800);

        // 增加点赞数
        const likes = parseInt(localStorage.getItem('likeCount') || '0') + 1;
        localStorage.setItem('likeCount', likes.toString());
        document.getElementById('like-count').textContent = likes;

        // 给点赞按钮也添加动画效果
        const likeBtn = document.querySelector('.reaction-btn.like .emoji');
        likeBtn.classList.add('pop');
        setTimeout(() => likeBtn.classList.remove('pop'), 300);
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init); 