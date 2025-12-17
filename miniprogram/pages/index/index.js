// pages/index/index.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    isLogin: false,
    bannerList: ['#A0C4FF', '#BDB2FF', '#FFC6FF'], // 模拟轮播图颜色
    menuList: [],
    newsList: []
  },

  onLoad: function () {
    // 检查是否已完成自动登录
    if (app.globalData.isLogin) {
      this.initPage(app.globalData.roleInfo)
    } else {
      // 注册回调，等待 app.js 登录完成
      app.loginCallback = (user) => {
        this.initPage(user)
      }
    }
  },

  initPage(user) {
    this.setData({ userInfo: user, isLogin: true })
    this.generateMenu(user.role)
    // 暂时造几条假新闻数据，确保界面有内容
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
    } else { // teacher
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
        wx.switchTab({ url })
      } else {
        wx.navigateTo({ url })
      }
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  }
})