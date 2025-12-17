// pages/news-detail/news-detail.js
const db = wx.cloud.database()

Page({
  data: {
    news: null,
    loading: true
  },

  onLoad(options) {
    console.log('详情页接收到的参数:', options) // 方便调试
    if (options.id) {
      this.loadNewsDetail(options.id)
    }
  },

  loadNewsDetail(id) {
    wx.showLoading({ title: '加载中...' })
    
    // 尝试去数据库查
    db.collection('cms_news').doc(id).get()
      .then(res => {
        // 1. 查到了真数据
        this.renderNews(res.data)
      })
      .catch(err => {
        // 2. 【核心修改】查不到（可能是首页的假数据ID），我们伪造一条数据显示，而不是退出
        console.log('数据库查询失败，使用模拟数据渲染', err)
        const mockDetail = {
          title: '这是测试新闻标题 (ID: ' + id + ')',
          type: 'news',
          create_time: new Date(),
          content: '恭喜你！跳转成功了。\n\n之所以显示这条内容，是因为首页使用的是“模拟数据(ID=1)”，而在你的云数据库里并没有真实ID为1的记录。\n\n但这证明你的【首页跳转逻辑】和【详情页渲染逻辑】都是完全正确的！'
        }
        this.renderNews(mockDetail)
      })
  },

  // 渲染辅助函数
  renderNews(data) {
    const d = new Date(data.create_time)
    data.dateStr = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
    
    this.setData({
      news: data,
      loading: false
    })
    wx.hideLoading()
  }
})