// pages/news/news.js
const db = wx.cloud.database()

Page({
  data: {
    tabs: ['全部', '校园通知', '家长课堂'],
    currentTab: 0,
    newsList: [],
    loading: true
  },

  onLoad(options) {
    // 如果是从首页“家长课”点进来的，自动切到“家长课堂”Tab
    if (options.type === 'course') {
      this.setData({ currentTab: 2 })
    }
    this.loadNews()
  },

  // 切换 Tab
  onTabClick(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ 
      currentTab: idx, 
      newsList: [], 
      loading: true 
    })
    this.loadNews()
  },

  // 加载数据
  loadNews() {
    // 1. 组装查询条件
    let condition = {}
    if (this.data.currentTab === 1) condition.type = 'news'   // 通知
    if (this.data.currentTab === 2) condition.type = 'course' // 课程

    // 2. 尝试从数据库查询
    db.collection('cms_news')
      .where(condition)
      .orderBy('create_time', 'desc')
      .get()
      .then(res => {
        // 如果数据库有数据
        if (res.data.length > 0) {
          this.setData({ 
            newsList: this.formatDate(res.data), 
            loading: false 
          })
        } else {
          // 数据库为空，加载模拟数据
          this.loadMockData()
        }
      })
      .catch(err => {
        console.log('数据库查询失败，切换为模拟数据模式', err)
        this.loadMockData()
      })
  },

  // 生成模拟数据（兜底策略）
  loadMockData() {
    setTimeout(() => {
      let mocks = [
        { _id: '1', type: 'news', title: '关于举办秋季运动会的通知', author: '教务处', create_time: new Date().getTime() - 86400000 },
        { _id: '2', type: 'course', title: '家长课堂：如何培养孩子的专注力', author: '心理室', create_time: new Date().getTime() - 172800000 },
        { _id: '3', type: 'news', title: '第十周国旗下讲话安排', author: '德育处', create_time: new Date().getTime() - 259200000 },
        { _id: '4', type: 'course', title: '【视频】春季传染病预防知识讲座', author: '校医室', create_time: new Date().getTime() - 345600000 },
        { _id: '5', type: 'news', title: '关于五一劳动节放假的通知', author: '办公室', create_time: new Date().getTime() - 432000000 },
        { _id: '6', type: 'course', title: '正面管教：如何与青春期的孩子沟通', author: '特邀专家', create_time: new Date().getTime() - 518400000 },
      ]

      // 前端过滤
      if (this.data.currentTab === 1) mocks = mocks.filter(item => item.type === 'news')
      if (this.data.currentTab === 2) mocks = mocks.filter(item => item.type === 'course')

      this.setData({
        newsList: this.formatDate(mocks),
        loading: false
      })
    }, 500)
  },

  // 格式化时间辅助函数
  formatDate(list) {
    return list.map(item => {
      const d = new Date(item.create_time)
      item.dateStr = `${d.getMonth() + 1}月${d.getDate()}日`
      return item
    })
  },

  // 点击跳转详情
  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/news-detail/news-detail?id=${id}`
    })
  }
})