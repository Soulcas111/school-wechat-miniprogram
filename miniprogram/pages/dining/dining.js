// pages/dining/dining.js
const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    currentTab: 0, // 0: 今日食谱, 1: 消费记录
    student: null,
    
    // 新增：余额变量，初始值为 128.50
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
    // onLoad 只在页面首次加载时触发
    this.initData()
  },

  // 每次页面显示时触发（包括从首页切过来）
  onShow() {
    // 检查全局变量里有没有“跳转到充值”的标记
    if (app.globalData.needSwitchToWallet) {
      this.setData({ currentTab: 1 }) // 切换到消费记录 Tab
      app.globalData.needSwitchToWallet = false // 用完即焚，防止下次误触
      
      // 如果还没加载过流水，顺便加载一下
      if (this.data.walletLogs.length === 0) {
        this.loadWalletLogs(true)
      }
    }
  },

  initData() {
    const user = app.globalData.roleInfo
    // 防止页面加载过快还没登录
    if (!user) {
      setTimeout(() => { this.initData() }, 500)
      return
    }

    // 默认取第一个孩子
    const studentId = user.children_ids ? user.children_ids[0] : ''
    this.setData({
      student: { id: studentId, name: '张小明' }, // 模拟名字
      currentDate: new Date().toISOString().split('T')[0]
    })

    this.loadMenus()
    // 预加载第一页流水，避免切换时空白
    this.loadWalletLogs(true)
  },

  // --- 功能 A: 切换 Tab ---
  switchTab(e) {
    const idx = parseInt(e.currentTarget.dataset.index)
    this.setData({ currentTab: idx })
    
    // 如果切到消费记录且为空，加载数据
    if (idx === 1 && this.data.walletLogs.length === 0) {
      this.loadWalletLogs(true)
    }
  },

  // --- 功能 B: 加载食谱 (数据库直连 + 前端美化) ---
  loadMenus() {
    db.collection('biz_menus')
      .orderBy('date', 'desc') // 按日期倒序
      .limit(7)
      .get()
      .then(res => {
        // 数据美化处理
        const formattedList = res.data.map((item, index) => {
          const dateObj = new Date(item.date);
          const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
          const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          const correctDay = weekDays[dateObj.getDay()];

          // 演示用：轮流显示不同菜谱
          const demoMeals = [
            { b: '牛奶面包', l: '红烧肉套餐', d: '鲜肉水饺' },
            { b: '皮蛋瘦肉粥', l: '宫保鸡丁', d: '番茄鸡蛋面' },
            { b: '豆浆油条', l: '糖醋排骨', d: '馒头稀饭' }
          ];
          const food = demoMeals[index % 3]; 

          return {
            ...item,
            date: dateStr,
            week_day: correctDay,
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

    if (!this.data.student || !this.data.student.id) {
        this.setData({ isLoading: false })
        return
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

  // --- 功能 D: 模拟充值 (修复版) ---
  onRecharge() {
    wx.showModal({
      title: '在线充值',
      // 【修复1】将 content 留空，避免文字出现在输入框中或者干扰输入
      content: '', 
      editable: true,
      // 【修复1】把提示语放在 placeholderText 里
      placeholderText: '请输入金额 (例如: 100)',
      success: (res) => {
        // res.content 是用户输入的内容
        if (res.confirm && res.content) {
          const amount = parseFloat(res.content)
          
          // 简单的金额校验
          if (isNaN(amount) || amount <= 0) {
            wx.showToast({ title: '请输入有效金额', icon: 'none' })
            return
          }

          wx.showLoading({ title: '充值中...' })
          setTimeout(() => {
            wx.hideLoading()
            
            // 【修复2】计算新余额并更新视图
            // toFixed(2) 保证金额保留两位小数
            const newBalance = this.data.balance + amount
            this.setData({
              balance: parseFloat(newBalance.toFixed(2))
            })

            wx.showToast({ title: '充值成功', icon: 'success' })
            
            // 刷新流水（注意：因为是模拟充值，云端数据没变，所以流水列表里不会立刻出现这笔充值，但余额变了）
            this.loadWalletLogs(true)
          }, 1500)
        }
      }
    })
  }
})