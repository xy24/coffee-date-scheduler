// 存储预约数据的结构
let bookingData = {
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

// 添加 JsonBin 配置
const STORAGE_CONFIG = {
    jsonbin: {
        binId: '67bf17cfad19ca34f812b18b',  // 从 URL 复制 bin ID
        apiKey: '$2a$10$ZKUU1N.KO3Va9GKRpAPKEeEuNTxyGwJKEGSbOqJUq6k45RileiQce', // 从 API Keys 页面复制
        baseUrl: 'https://api.jsonbin.io/v3/b'
    }
};

// 添加数据持久化函数
async function saveBookingData(data) {
    try {
        const response = await fetch(`${STORAGE_CONFIG.jsonbin.baseUrl}/${STORAGE_CONFIG.jsonbin.binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': STORAGE_CONFIG.jsonbin.apiKey,
                'X-Bin-Meta': false,
                'X-Access-Control-Allow-Origin': '*'
            },
            mode: 'cors',  // 明确指定 CORS 模式
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to save booking data');
        return await response.json();
    } catch (error) {
        console.error('Failed to save booking data:', error);
        // 失败时使用 localStorage 作为备份
        localStorage.setItem('bookingData', JSON.stringify(data));
    }
}

async function loadBookingData() {
    try {
        const response = await fetch(`${STORAGE_CONFIG.jsonbin.baseUrl}/${STORAGE_CONFIG.jsonbin.binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': STORAGE_CONFIG.jsonbin.apiKey,
                'X-Bin-Meta': false,
                'Content-Type': 'application/json',
                'X-Access-Control-Allow-Origin': '*'
            },
            mode: 'cors'  // 明确指定 CORS 模式
        });

        if (!response.ok) throw new Error('Failed to load booking data');
        const result = await response.json();
        return result;  // 注意：移除了 .record，因为设置了 X-Bin-Meta: false
    } catch (error) {
        console.error('Failed to load booking data:', error);
        return null;
    }
}

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

// 添加显示/隐藏加载蒙版的函数
function showLoading() {
    document.getElementById('loading-mask').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-mask').style.display = 'none';
}

// 修改初始化函数
async function init() {
    showLoading(); // 显示加载蒙版
    
    try {
        // 加载所有数据
        const data = await loadBookingData();
        if (data && data.slots) {
            // 确保所有必要的数据结构都存在
            data.stats = data.stats || {
                visits: 0,
                todayVisits: {
                    date: new Date().toDateString(),
                    count: 0
                },
                lastVisitTime: new Date().toLocaleString('zh-CN')
            };
            data.reactions = data.reactions || { like: 0, dislike: 0 };
            bookingData = data;
        } else {
            console.log("no booking data from load");
            // 如果没有数据，初始化默认数据
            bookingData = {
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
            };
            await saveBookingData(bookingData);
        }

        // 初始化所有功能
        updateUI();
        await updateVisitCount();
        await initReactions();
        
        // 添加事件监听
        document.getElementById('booking-form').addEventListener('submit', handleBooking);
        document.getElementById('reset-button').addEventListener('click', handleReset);
        initCoffeeBanner();
        updateMonthDisplay();
        
    } catch (error) {
        console.error('Failed to initialize:', error);
        alert('加载失败，请刷新页面重试');
    } finally {
        hideLoading(); // 隐藏加载蒙版
    }
}

// 修改预约处理函数
async function handleBooking(event) {
    event.preventDefault();
    
    const slotSelect = document.getElementById('slot-select');
    const slotId = slotSelect.value;

    if (!slotId) {
        alert('请选择时间段');
        return;
    }

    if (bookingData.slots[slotId].booked) {
        alert('该时间段已被预约');
        return;
    }

    try {
        // 更新预约数据
        bookingData.slots[slotId].booked = true;
        // 不存储姓名，只记录预约状态
        bookingData.remainingSlots--;

        // 保存到 JsonBin
        await saveBookingData(bookingData);
        
        // 更新UI
        updateUI();

        // 显示成功动画
        showSuccessAnimation();

        // 发送通知（可选，若需要通知管理员）
        // await notifyAdmin(name, slotId); // 这里可以选择不发送姓名

        // 重置表单
        event.target.reset();
    } catch (error) {
        console.error('预约失败：', error);
        alert('预约失败，请重试');
    }
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

// 修改重置数据函数
async function resetBookingData() {
    try {
        // 先获取当前数据以保留所有现有数据
        const currentData = await loadBookingData();
        
        // 只有在确认重置时才更新 slots 数据
        if (currentData && !localStorage.getItem('lastResetDate')) {
            const newBookingData = {
                ...currentData,  // 保留所有现有数据
                slots: {
                    1: { booked: false, time: '第一周' },
                    2: { booked: false, time: '第二周' },
                    3: { booked: false, time: '第三周' },
                    4: { booked: false, time: '第四周' }
                },
                remainingSlots: 4
            };
            
            // 保存到 JsonBin
            await saveBookingData(newBookingData);
            
            // 更新本地数据
            bookingData = newBookingData;
            
            // 记录重置时间
            localStorage.setItem('lastResetDate', new Date().toISOString());
        }
        
        updateUI();
    } catch (error) {
        console.error('重置失败：', error);
        alert('重置失败，请重试');
    }
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
async function updateVisitCount() {
    try {
        const data = await loadBookingData();
        
        // 确保 stats 对象存在
        data.stats = data.stats || {
            visits: 0,
            todayVisits: {
                date: new Date().toDateString(),
                count: 0
            },
            lastVisitTime: new Date().toLocaleString('zh-CN')
        };
        
        const now = new Date();
        const today = now.toDateString();
        
        // 更新访问数据
        data.stats.visits = (data.stats.visits || 0) + 1;
        
        // 检查是否需要重置今日访问
        if (!data.stats.todayVisits || data.stats.todayVisits.date !== today) {
            data.stats.todayVisits = {
                date: today,
                count: 1
            };
        } else {
            data.stats.todayVisits.count += 1;
        }
        
        // 更新最后访问时间
        data.stats.lastVisitTime = now.toLocaleString('zh-CN');
        
        // 保存数据
        await saveBookingData(data);
        
        // 更新显示
        document.getElementById('visit-count').textContent = data.stats.visits;
        document.getElementById('today-visit-count').textContent = data.stats.todayVisits.count;
        document.getElementById('last-visit-time').textContent = data.stats.lastVisitTime;
    } catch (error) {
        console.error('Failed to update visit count:', error);
    }
}

// 修改点赞处理函数
async function handleReaction(type) {
    try {
        // 先从本地获取数据
        const localData = JSON.parse(localStorage.getItem('reactionData') || '{"like":0,"dislike":0}');
        
        // 立即更新本地数据和显示
        localData[type] = (localData[type] || 0) + 1;
        localStorage.setItem('reactionData', JSON.stringify(localData));
        
        // 立即更新显示
        document.getElementById(`${type}-count`).textContent = localData[type];
        
        // 动画效果
        const btn = document.querySelector(`.reaction-btn.${type}`);
        const emojiElement = btn.querySelector('.emoji');
        
        emojiElement.classList.add('pop');
        setTimeout(() => emojiElement.classList.remove('pop'), 300);

        const floating = document.createElement('span');
        floating.textContent = type === 'like' ? '❤️' : '🌚';
        floating.className = 'floating';
        btn.appendChild(floating);
        setTimeout(() => floating.remove(), 800);

        // 后台异步同步到服务器
        setTimeout(async () => {
            try {
                const data = await loadBookingData();
                data.reactions = data.reactions || { like: 0, dislike: 0 };
                data.reactions[type] = Math.max(data.reactions[type] || 0, localData[type]);
                await saveBookingData(data);
            } catch (error) {
                console.error('Failed to sync reaction to server:', error);
            }
        }, 0);
    } catch (error) {
        console.error('Failed to handle reaction:', error);
    }
}

// 修改初始化点赞功能
async function initReactions() {
    try {
        // 先从本地获取数据
        const localData = JSON.parse(localStorage.getItem('reactionData') || '{"like":0,"dislike":0}');
        
        // 尝试从服务器加载数据
        try {
            const data = await loadBookingData();
            data.reactions = data.reactions || { like: 0, dislike: 0 };
            
            // 使用较大的数值
            localData.like = Math.max(localData.like, data.reactions.like || 0);
            localData.dislike = Math.max(localData.dislike, data.reactions.dislike || 0);
            
            // 更新本地存储
            localStorage.setItem('reactionData', JSON.stringify(localData));
            
            // 同步回服务器
            data.reactions = localData;
            await saveBookingData(data);
        } catch (error) {
            console.error('Failed to sync with server:', error);
        }
        
        // 更新显示
        document.getElementById('like-count').textContent = localData.like;
        document.getElementById('dislike-count').textContent = localData.dislike;
        
        // 添加点击事件监听
        const likeBtn = document.querySelector('.reaction-btn.like');
        const dislikeBtn = document.querySelector('.reaction-btn.dislike');

        likeBtn.addEventListener('click', () => handleReaction('like'));
        dislikeBtn.addEventListener('click', () => handleReaction('dislike'));
    } catch (error) {
        console.error('Failed to initialize reactions:', error);
    }
}

// 修改咖啡图片点击效果
async function initCoffeeBanner() {
    const banner = document.getElementById('coffee-banner');
    
    banner.addEventListener('click', async () => {
        try {
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

            // 增加点赞并更新显示（使用相同的处理函数）
            await handleReaction('like');
        } catch (error) {
            console.error('Failed to handle coffee banner click:', error);
        }
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init); 