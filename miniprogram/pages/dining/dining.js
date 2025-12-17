// pages/dining/dining.js
const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    currentTab: 0, // 0: 今日食谱, 1: 消费记录
    student: null,
    
    // 食谱数据
    menuList: [],
    currentDate: '',
    
    // 流水数据
    walletLogs: [],
    page: 0,
    hasMore: true,
    isLoading: false
  },

  onLoad(options) {
    // 如果是从首页点击"充饭卡"进来的，直接切到消费页
    if (options.type === 'recharge') {
      this.setData({ currentTab: 1 })
    }
    this.initData()
  },

  initData() {
    const user = app.globalData.roleInfo
    // 防止页面加载过快还没登录
    if (!user) {
      setTimeout(() => { this.initData() }, 500)
      return
    }

    // 默认取第一个孩子
    const studentId = user.children_ids[0]
    this.setData({
      student: { id: studentId, name: '张小明' }, // 模拟名字
      currentDate: new Date().toISOString().split('T')[0]
    })

    this.loadMenus()
    this.loadWalletLogs(true)
  },

  // --- 功能 A: 切换 Tab ---
  switchTab(e) {
    const idx = parseInt(e.currentTarget.dataset.index)
    this.setData({ currentTab: idx })
  },

// --- 功能 B: 加载食谱 (数据库直连) ---
loadMenus() {
  db.collection('biz_menus')
    .orderBy('date', 'desc') // 按日期倒序
    .limit(7)
    .get()
    .then(res => {
      // 【核心修复】拿到数据后，遍历每一条进行“整容”
      const formattedList = res.data.map((item, index) => {
        // 1. 修复日期显示 [object Object]
        const dateObj = new Date(item.date);
        const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;

        // 2. 修复星期几全是“周三”的问题 (重新计算一遍)
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const correctDay = weekDays[dateObj.getDay()];

        // 3. (可选) 为了演示好看，如果我们生成的饭菜都一样，这里手动给它变一下
        const demoMeals = [
          { b: '牛奶面包', l: '红烧肉套餐', d: '鲜肉水饺' },
          { b: '皮蛋瘦肉粥', l: '宫保鸡丁', d: '番茄鸡蛋面' },
          { b: '豆浆油条', l: '糖醋排骨', d: '馒头稀饭' }
        ];
        // 轮流显示这三套菜
        const food = demoMeals[index % 3]; 

        return {
          ...item,
          date: dateStr,       // 覆盖成字符串格式
          week_day: correctDay, // 覆盖成正确的星期
          // 如果你想让菜谱看起来不一样，可以取消下面这行的注释
          meals: { breakfast: food.b, lunch: food.l, dinner: food.d } 
        };
      });

      this.setData({ menuList: formattedList });
    })
    .catch(err => {
      console.error('食谱加载失败', err)
    })
},

  // --- 功能 C: 加载流水 (调用云函数) ---
  loadWalletLogs(isRefresh = false) {
    if (this.data.isLoading || (!this.data.hasMore && !isRefresh)) return

    this.setData({ isLoading: true })
    if (isRefresh) {
      this.setData({ page: 0, walletLogs: [], hasMore: true })
    }

    wx.cloud.callFunction({
      name: 'biz_getWallet',
      data: {
        student_id: this.data.student.id,
        page: this.data.page
      },
      success: res => {
        const result = res.result
        if (result.code === 200) {
          const newLogs = result.data
          this.setData({
            walletLogs: this.data.walletLogs.concat(newLogs),
            page: this.data.page + 1,
            hasMore: result.hasMore
          })
        }
      },
      complete: () => {
        this.setData({ isLoading: false })
      }
    })
  },

  // 下拉加载更多流水
  onReachBottom() {
    if (this.data.currentTab === 1) {
      this.loadWalletLogs()
    }
  },

  // --- 功能 D: 模拟充值 ---
  onRecharge() {
    wx.showModal({
      title: '在线充值',
      content: '请输入充值金额（模拟支付）',
      editable: true,
      placeholderText: '例如: 100',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.showLoading({ title: '充值中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({ title: '充值成功', icon: 'success' })
            // 刷新流水
            this.loadWalletLogs(true)
          }, 1500)
        }
      }
    })
  }
})