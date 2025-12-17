// pages/index/index.js
const app = getApp()

Page({ // <--- Page 开始
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
        wx.switchTab({ url })
      } else {
        wx.navigateTo({ url })
      }
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  },

  // === 必须在 Page 的肚子里面 ===
  onNewsTap(e) {
    console.log('点击事件触发成功！')
    const id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({
        url: `/pages/news-detail/news-detail?id=${id}`,
        success: () => console.log('跳转成功'),
        fail: (err) => {
          console.error('跳转失败，可能是app.json没注册页面', err)
          wx.showModal({ title: '跳转失败', content: '请检查app.json里是否注册了news-detail页面' })
        }
      })
    }
  }

}) // <--- Page 结束