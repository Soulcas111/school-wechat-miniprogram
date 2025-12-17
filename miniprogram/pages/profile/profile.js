// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    menuList: [
      { title: '我的班级', icon: '🏫', desc: '三年级2班' },
      { title: '孩子信息', icon: '👶', desc: '张小明' },
      { title: '消息通知', icon: '🔔', desc: '暂无新消息' }
    ]
  },

  onShow() {
    this.initData()
  },

  initData() {
    // 从全局变量获取用户信息
    const user = app.globalData.roleInfo
    if (user) {
      this.setData({ userInfo: user })
    } else {
      // 如果没登录，试着延迟获取一下
      setTimeout(() => {
        const retryUser = app.globalData.roleInfo
        if (retryUser) {
          this.setData({ userInfo: retryUser })
        }
      }, 500)
    }
  },

  // 1. 关于我们
  onAbout() {
    wx.showModal({
      title: '关于家校通',
      content: '智慧家校通 v1.0.0\n\n致力于提供便捷的家校沟通服务。\n开发者：西南交通大学软件工程学生',
      showCancel: false
    })
  },

  // 2. 清除缓存
  onClearCache() {
    wx.showLoading({ title: '清理中...' })
    setTimeout(() => {
      wx.clearStorageSync()
      wx.hideLoading()
      wx.showToast({ title: '清理完成', icon: 'success' })
    }, 1000)
  },

  // 3. 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清空全局状态
          app.globalData.userInfo = null
          app.globalData.roleInfo = null
          app.globalData.isLogin = false
          
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }
      }
    })
  }
})