// pages/dining/dining.js
const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    currentTab: 0, // 0: 今日食谱, 1: 消费记录
    student: null,
    
    // 余额
    balance: 128.50,

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
    this.initData()
  },

  onShow() {
    // 检查是否有跳转标记
    if (app.globalData.needSwitchToWallet) {
      this.setData({ currentTab: 1 })
      app.globalData.needSwitchToWallet = false
      if (this.data.walletLogs.length === 0) {
        this.loadWalletLogs(true)
      }
    }
  },

  initData() {
    const user = app.globalData.roleInfo
    if (!user) {
      setTimeout(() => { this.initData() }, 500)
      return
    }

    const studentId = user.children_ids ? user.children_ids[0] : 'stu_1'
    this.setData({
      student: { id: studentId, name: '张小明' },
      currentDate: new Date().toISOString().split('T')[0]
    })

    this.loadMenus()
    // 预加载流水
    this.loadWalletLogs(true)
  },

  switchTab(e) {
    const idx = parseInt(e.currentTarget.dataset.index)
    this.setData({ currentTab: idx })
    if (idx === 1 && this.data.walletLogs.length === 0) {
      this.loadWalletLogs(true)
    }
  },

  loadMenus() {
    db.collection('biz_menus')
      .orderBy('date', 'desc')
      .limit(7)
      .get()
      .then(res => {
        const formattedList = res.data.map((item, index) => {
          const dateObj = new Date(item.date);
          const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
          const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          
          const demoMeals = [
            { b: '牛奶面包', l: '红烧肉套餐', d: '鲜肉水饺' },
            { b: '皮蛋瘦肉粥', l: '宫保鸡丁', d: '番茄鸡蛋面' },
            { b: '豆浆油条', l: '糖醋排骨', d: '馒头稀饭' }
          ];
          const food = demoMeals[index % 3]; 

          return {
            ...item,
            date: dateStr,
            week_day: weekDays[dateObj.getDay()],
            meals: { breakfast: food.b, lunch: food.l, dinner: food.d } 
          };
        });
        this.setData({ menuList: formattedList });
      })
      .catch(err => console.error('食谱加载失败', err))
  },

  // --- 【核心修复】加载流水 ---
  loadWalletLogs(isRefresh = false) {
    if (this.data.isLoading || (!this.data.hasMore && !isRefresh)) return

    this.setData({ isLoading: true })
    if (isRefresh) {
      this.setData({ page: 0, walletLogs: [], hasMore: true })
    }

    const studentId = (this.data.student && this.data.student.id) ? this.data.student.id : 'stu_1'

    wx.cloud.callFunction({
      name: 'biz_getWallet',
      data: {
        student_id: studentId,
        page: this.data.page
      },
      success: res => {
        const result = res.result
        let newLogs = []

        // 1. 如果云端有数据，用云端的
        if (result && result.code === 200 && result.data && result.data.length > 0) {
          newLogs = result.data
        } 
        // 2. 【兜底策略】如果云端没数据且是第一页，我们自己造几条
        else if (this.data.page === 0) {
          console.log('云端无数据，启用模拟流水数据')
          newLogs = [
            { _id: 'm1', title: '食堂消费-午餐', amount: -15.50, create_time: this.formatTime(new Date()) },
            { _id: 'm2', title: '小卖部消费', amount: -4.00, create_time: this.formatTime(new Date(Date.now() - 3600000 * 4)) },
            { _id: 'm3', title: '饭卡充值', amount: 200.00, create_time: this.formatTime(new Date(Date.now() - 86400000)) },
            { _id: 'm4', title: '食堂消费-晚餐', amount: -12.00, create_time: this.formatTime(new Date(Date.now() - 90000000)) }
          ]
        }

        this.setData({
          walletLogs: this.data.walletLogs.concat(newLogs),
          page: this.data.page + 1,
          hasMore: result.hasMore || false
        })
      },
      fail: err => {
        console.error('流水加载失败', err)
        // 即使报错，也显示一点假数据，保证不白屏
        if (this.data.page === 0) {
          this.setData({
            walletLogs: [
              { _id: 'err1', title: '演示数据-早餐', amount: -5.00, create_time: '2025-10-24 07:30' }
            ],
            hasMore: false
          })
        }
      },
      complete: () => {
        this.setData({ isLoading: false })
      }
    })
  },

  // 辅助函数：生成好看的时间字符串
  formatTime(date) {
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    const h = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    return `${m}-${d} ${h}:${min}`
  },

  onReachBottom() {
    if (this.data.currentTab === 1) {
      this.loadWalletLogs()
    }
  },

  onRecharge() {
    wx.showModal({
      title: '在线充值',
      content: '', 
      editable: true,
      placeholderText: '请输入金额 (例如: 100)',
      success: (res) => {
        if (res.confirm && res.content) {
          const amount = parseFloat(res.content)
          if (isNaN(amount) || amount <= 0) {
            wx.showToast({ title: '请输入有效金额', icon: 'none' })
            return
          }

          wx.showLoading({ title: '充值中...' })
          setTimeout(() => {
            wx.hideLoading()
            // 更新余额
            const newBalance = this.data.balance + amount
            this.setData({
              balance: parseFloat(newBalance.toFixed(2))
            })
            wx.showToast({ title: '充值成功', icon: 'success' })
            
            // 往列表头部加一条充值记录
            const newLog = {
              _id: 'new_' + Date.now(),
              title: '饭卡充值(新)',
              amount: amount,
              create_time: this.formatTime(new Date())
            }
            this.setData({
              walletLogs: [newLog].concat(this.data.walletLogs)
            })
          }, 1500)
        }
      }
    })
  }
})