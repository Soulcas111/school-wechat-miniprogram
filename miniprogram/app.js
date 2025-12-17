// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      // 1. 初始化云开发
      wx.cloud.init({
        // 这里已经填入你提供的真实环境 ID
        env: 'cloud1-7gimxj5r98564c5e', 
        traceUser: true,
      })
    }

    // 2. 获取全局用户信息
    this.globalData = {
      userInfo: null, // 微信基本信息
      roleInfo: null, // 数据库里的角色信息 (sys_users表)
      isLogin: false
    }

    // 3. 尝试静默登录
    this.checkLogin()
  },

  checkLogin: function() {
    // 调用我们在上一轮写的 sys_login 云函数
    wx.cloud.callFunction({
      name: 'sys_login',
      success: res => {
        if (res.result.code === 200) {
          console.log('自动登录成功:', res.result.user)
          this.globalData.roleInfo = res.result.user
          this.globalData.isLogin = true
          
          // 如果页面定义了 onLoginSuccess 回调，则触发它 (用于刷新页面)
          if (this.loginCallback) {
            this.loginCallback(res.result.user)
          }
        } else {
          console.log('登录成功，但未在数据库找到用户记录 (如果是调试模式，请检查 sys_login 云函数)')
        }
      },
      fail: err => {
        console.error('登录云函数调用失败', err)
      }
    })
  }
})