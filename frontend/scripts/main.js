// 全局状态管理
const state = {
    slots: [
        { id: 1, status: 'free', time: null },
        { id: 2, status: 'free', time: null },
        { id: 3, status: 'free', time: null },
        { id: 4, status: 'free', time: null }
    ],
    remainingSlots: 4,
    user: null
};

// 初始化飞书 SDK
async function initLark() {
    try {
        // 等待 SDK 加载完成
        await new Promise(resolve => {
            if (window.h5sdk) {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });

        // 初始化 SDK
        await window.h5sdk.ready({
            apis: ['getUserInfo']
        });
        
        // 获取用户信息
        const userInfo = await window.h5sdk.getUserInfo();
        
        // 更新用户状态
        state.user = {
            name: userInfo.name,
            avatar: userInfo.avatar_url,
            userId: userInfo.user_id
        };

        // 显示用户信息
        document.querySelector('.user-info').style.display = 'flex';
        document.getElementById('user-avatar').src = state.user.avatar;
        document.getElementById('user-name').textContent = state.user.name;
    } catch (error) {
        console.error('飞书 SDK 初始化失败:', error);
        // 如果初始化失败，继续以访客模式使用
        console.warn('将以访客模式继续');
    }
}

// 更新时间槽显示
function updateSlotDisplay() {
    state.slots.forEach((slot, index) => {
        const slotElement = document.getElementById(`slot${slot.id}`);
        const statusElement = slotElement.querySelector('.slot-status');
        const timeElement = slotElement.querySelector('.slot-time');

        if (slot.status === 'booked') {
            slotElement.classList.add('booked');
            statusElement.textContent = '已预约';
            timeElement.textContent = new Date(slot.time).toLocaleString('zh-CN', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    });

    document.getElementById('remaining-slots').textContent = state.remainingSlots;
}

// 处理预约表单提交
document.getElementById('booking-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        name: state.user ? state.user.name : prompt('请输入您的名字：'),
        date: document.getElementById('date').value,
        time: document.getElementById('time').value
    };

    if (!formData.name) {
        alert('请输入名字');
        return;
    }

    // 检查是否还有剩余名额
    if (state.remainingSlots === 0) {
        alert('抱歉，本月预约名额已满');
        return;
    }

    // 检查日期是否在当月
    const selectedDate = new Date(formData.date);
    const today = new Date();
    if (selectedDate.getMonth() !== today.getMonth() || 
        selectedDate.getFullYear() !== today.getFullYear()) {
        alert('请选择本月的日期');
        return;
    }

    // 更新状态
    const slotIndex = 4 - state.remainingSlots;
    state.slots[slotIndex].status = 'booked';
    state.slots[slotIndex].time = new Date(`${formData.date}T${formData.time}`);
    state.slots[slotIndex].userId = state.user ? state.user.userId : formData.name; // 存储用户ID或名字
    state.remainingSlots--;

    // 更新显示
    updateSlotDisplay();
    
    // 重置表单
    e.target.reset();

    // 显示预约成功提示
    alert('预约成功！');
});

// 初始化抽奖轮盘
const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');

function initWheel() {
    // 设置canvas尺寸
    canvas.width = 300;
    canvas.height = 300;
    
    // 基础轮盘绘制
    ctx.beginPath();
    ctx.arc(150, 150, 145, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#6b4423';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initLark();
    // 设置日期输入框的最小值为今天
    const dateInput = document.getElementById('date');
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    dateInput.min = today.toISOString().split('T')[0];
    dateInput.max = lastDayOfMonth.toISOString().split('T')[0];
    
    updateSlotDisplay();
    initWheel();
}); 