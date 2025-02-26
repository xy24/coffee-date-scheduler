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

// 添加 GitHub API 配置
const GITHUB_CONFIG = {
    token: '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',  // 替换为你的 token
    gistId: '302551a15cf6c0442f93b65c0f579251',      // 创建 Gist 后填入 ID
};

// 添加数据持久化函数
async function saveToGist(data) {
    try {
        const response = await fetch(`https://api.github.com/gists/${GITHUB_CONFIG.gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: {
                    'coffee-data.json': {
                        content: JSON.stringify(data)
                    }
                }
            })
        });
        
        if (!response.ok) throw new Error('Failed to save data');
        return await response.json();
    } catch (error) {
        console.error('Failed to save to Gist:', error);
        // 失败时回退到 localStorage
        localStorage.setItem('coffeeData', JSON.stringify(data));
    }
}

async function loadFromGist() {
    try {
        const response = await fetch(`https://api.github.com/gists/${GITHUB_CONFIG.gistId}`, {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load data');
        
        const gist = await response.json();
        
        // 检查是否存在数据文件
        if (!gist.files['coffee-data.json']) {
            // 如果文件不存在，创建初始数据
            const initialData = {
                visits: 0,
                todayVisits: {
                    date: new Date().toDateString(),
                    count: 0
                },
                lastVisitTime: new Date().toLocaleString('zh-CN'),
                reactions: {
                    like: 0,
                    dislike: 0
                },
                bookings: {
                    slots: {
                        1: { booked: false, name: '', time: '第一周' },
                        2: { booked: false, name: '', time: '第二周' },
                        3: { booked: false, name: '', time: '第三周' },
                        4: { booked: false, name: '', time: '第四周' }
                    },
                    remainingSlots: 4
                }
            };
            
            // 保存初始数据
            await saveToGist(initialData);
            return initialData;
        }
        
        return JSON.parse(gist.files['coffee-data.json'].content);
    } catch (error) {
        console.error('Failed to load from Gist:', error);
        // 返回默认数据结构而不是使用 localStorage
        return {
            visits: 0,
            todayVisits: {
                date: new Date().toDateString(),
                count: 0
            },
            lastVisitTime: new Date().toLocaleString('zh-CN'),
            reactions: {
                like: 0,
                dislike: 0
            },
            bookings: {
                slots: {
                    1: { booked: false, name: '', time: '第一周' },
                    2: { booked: false, name: '', time: '第二周' },
                    3: { booked: false, name: '', time: '第三周' },
                    4: { booked: false, name: '', time: '第四周' }
                },
                remainingSlots: 4
            }
        };
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

// 修改初始化函数
async function init() {
    // 从 Gist 加载所有数据
    try {
        const data = await loadFromGist();
        // 初始化预约数据
        if (data.bookings) {
            bookingData = data.bookings;
        }
        updateUI();
    } catch (error) {
        // 如果加载失败，尝试从 localStorage 加载
        const savedData = localStorage.getItem('bookingData');
        if (savedData) {
            bookingData = JSON.parse(savedData);
            updateUI();
        }
    }

    // 添加事件监听
    document.getElementById('booking-form').addEventListener('submit', handleBooking);
    document.getElementById('reset-button').addEventListener('click', handleReset);
    
    // 更新月份显示
    updateMonthDisplay();
    
    // 更新访问次数
    updateVisitCount();
    
    // 初始化点赞数据
    initReactions();
    
    // 初始化咖啡图片点击效果
    initCoffeeBanner();
}

// 修改预约处理函数
async function handleBooking(event) {
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

    try {
        // 更新预约数据
        bookingData.slots[slotId].booked = true;
        bookingData.slots[slotId].name = name;
        bookingData.remainingSlots--;

        // 获取当前 Gist 数据
        const data = await loadFromGist();
        data.bookings = bookingData;
        
        // 保存到 Gist
        await saveToGist(data);
        
        // 备份到 localStorage
        localStorage.setItem('bookingData', JSON.stringify(bookingData));

        // 更新UI
        updateUI();

        // 显示成功动画
        showSuccessAnimation();

        // 发送通知
        await notifyAdmin(name, slotId);
        console.log('预约通知已发送');

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
    const newBookingData = {
        slots: {
            1: { booked: false, name: '', time: '第一周' },
            2: { booked: false, name: '', time: '第二周' },
            3: { booked: false, name: '', time: '第三周' },
            4: { booked: false, name: '', time: '第四周' }
        },
        remainingSlots: 4
    };
    
    try {
        // 获取当前 Gist 数据
        const data = await loadFromGist();
        data.bookings = newBookingData;
        
        // 保存到 Gist
        await saveToGist(data);
        
        // 更新本地数据
        bookingData = newBookingData;
        
        // 备份到 localStorage
        localStorage.setItem('bookingData', JSON.stringify(bookingData));
        localStorage.setItem('lastResetDate', new Date().toISOString());
        
        updateUI();
    } catch (error) {
        console.error('重置失败：', error);
        alert('重置失败，请重试');
    }
}

// 修改月度重置检查函数
async function checkMonthlyReset() {
    const lastResetDate = localStorage.getItem('lastResetDate');
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (!lastResetDate || new Date(lastResetDate) < firstDayOfMonth) {
        await resetBookingData();
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
        const data = await loadFromGist();
        const now = new Date();
        const today = now.toDateString();
        
        // 更新访问数据
        data.visits = (data.visits || 0) + 1;
        data.todayVisits = data.todayVisits || { date: '', count: 0 };
        
        if (data.todayVisits.date !== today) {
            data.todayVisits = {
                date: today,
                count: 1
            };
        } else {
            data.todayVisits.count += 1;
        }
        
        data.lastVisitTime = now.toLocaleString('zh-CN', {
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // 保存更新后的数据
        await saveToGist(data);
        
        // 更新显示
        document.getElementById('visit-count').textContent = data.visits;
        document.getElementById('today-visit-count').textContent = data.todayVisits.count;
        document.getElementById('last-visit-time').textContent = data.lastVisitTime;
    } catch (error) {
        console.error('Failed to update visit count:', error);
    }
}

// 修改点赞处理函数
async function handleReaction(type) {
    try {
        const data = await loadFromGist();
        
        // 更新点赞/踩数据
        data.reactions = data.reactions || {};
        data.reactions[type] = (data.reactions[type] || 0) + 1;
        
        // 保存数据
        await saveToGist(data);
        
        // 更新显示
        const countElement = document.getElementById(`${type}-count`);
        countElement.textContent = data.reactions[type];
        
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
    } catch (error) {
        console.error('Failed to handle reaction:', error);
    }
}

// 修改初始化点赞功能
async function initReactions() {
    try {
        const data = await loadFromGist();
        
        // 初始化反应数据
        data.reactions = data.reactions || { like: 0, dislike: 0 };
        
        // 更新显示
        document.getElementById('like-count').textContent = data.reactions.like || 0;
        document.getElementById('dislike-count').textContent = data.reactions.dislike || 0;
        
        // 添加点击事件监听
        const likeBtn = document.querySelector('.reaction-btn.like');
        const dislikeBtn = document.querySelector('.reaction-btn.dislike');

        likeBtn.addEventListener('click', () => handleReaction('like'));
        dislikeBtn.addEventListener('click', () => handleReaction('dislike'));
    } catch (error) {
        console.error('Failed to initialize reactions:', error);
    }
}

// 修改初始化咖啡图片点击效果
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

            // 增加点赞数
            const data = await loadFromGist();
            data.reactions = data.reactions || { like: 0, dislike: 0 };
            data.reactions.like = (data.reactions.like || 0) + 1;
            
            // 保存到 Gist
            await saveToGist(data);

            // 更新显示
            document.getElementById('like-count').textContent = data.reactions.like;

            // 给点赞按钮也添加动画效果
            const likeBtn = document.querySelector('.reaction-btn.like .emoji');
            likeBtn.classList.add('pop');
            setTimeout(() => likeBtn.classList.remove('pop'), 300);
        } catch (error) {
            console.error('Failed to handle coffee banner click:', error);
        }
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init); 