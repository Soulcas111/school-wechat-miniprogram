const app = getApp()

Page({
  data: {
    userInfo: null,
    isLogin: false,
    bannerList: ['#A0C4FF', '#BDB2FF', '#FFC6FF'],
    menuList: [],
    newsList: []
  },

  onLoad: function () {
    if (app.globalData.isLogin) {
      this.initPage(app.globalData.roleInfo)
    } else {
      app.loginCallback = (user) => {
        this.initPage(user)
      }
    }
  },

  initPage(user) {
    this.setData({ userInfo: user, isLogin: true })
    this.generateMenu(user.role)
    this.setData({
      newsList: [
        { _id: '1', type: 'news', title: '关于举办秋季运动会的通知', author: '教务处', date: '2025-10-20' },
        { _id: '2', type: 'course', title: '家长课堂：如何培养孩子的专注力', author: '心理室', date: '2025-10-18' },
        { _id: '3', type: 'news', title: '第十周国旗下讲话安排', author: '德育处', date: '2025-10-15' }
      ]
    })
  },

  generateMenu(role) {
    let menus = []
    if (role === 'parent') {
      menus = [
        { title: '查成绩', icon: '📊', url: '/pages/score/score', color: '#E3F2FD' },
        { title: '看食谱', icon: '🍎', url: '/pages/dining/dining', color: '#E8F5E9' },
        { title: '充饭卡', icon: '💳', url: '/pages/dining/dining?type=recharge', color: '#FFF3E0' },
        { title: '家长课', icon: '🎓', url: '/pages/news/news', color: '#F3E5F5' }
      ]
    } else { 
      menus = [
        { title: '班级成绩', icon: '📈', url: '/pages/score/score', color: '#E3F2FD' },
        { title: '发布作业', icon: '📝', url: '', color: '#E8F5E9' },
        { title: '发布新闻', icon: '📢', url: '', color: '#FFF3E0' },
        { title: '食谱管理', icon: '🍲', url: '', color: '#F3E5F5' }
      ]
    }
    this.setData({ menuList: menus })
  },

  onMenuTap(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      if (url.includes('score') || url.includes('dining')) {
        // 【核心修复】如果是充饭卡，通过全局变量传参
        if (url.includes('type=recharge')) {
          app.globalData.needSwitchToWallet = true; // 设置一个标记
        }
        
        wx.switchTab({ url })
      } else {
        wx.navigateTo({ url })
      }
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  },

  // ✅ 【关键修复】补回了这个丢失的函数
  onNewsTap(e) {
    console.log('点击新闻，尝试跳转 ID:', e.currentTarget.dataset.id)
    const id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({
        url: `/pages/news-detail/news-detail?id=${id}`,
        fail: (err) => {
          console.error('跳转失败，请检查 app.json 是否注册了该页面', err)
        }
      })
    }
  }
})