// pages/news-detail/news-detail.js
Page({
  data: {
    news: null,
    loading: true
  },

  onLoad(options) {
    console.log('页面加载，ID:', options.id)
    
    // 模拟网络延迟，0.5秒后显示数据
    setTimeout(() => {
      this.renderMockNews(options.id || '1')
    }, 500)
  },

  renderMockNews(id) {
    // 构造一条模拟新闻
    const mockData = {
      _id: id,
      title: '关于举办秋季运动会的通知',
      type: 'news',
      author: '教务处',
      create_time: new Date().getTime(),
      content: '【模拟数据模式】\n\n各位家长、同学：\n\n为了丰富校园文化生活，提高学生身体素质，学校定于下周五举办秋季田径运动会。\n\n一、时间：2025年10月24日\n二、地点：学校大操场\n三、参会人员：全校师生\n\n(如果能看到这段文字，说明你的 WXML 和 JS 都完全修好了！)'
    }

    // 格式化时间
    const d = new Date(mockData.create_time)
    mockData.dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

    // 更新界面
    this.setData({
      news: mockData,
      loading: false
    })
    
    console.log('数据已更新，Loading关闭')
  }
})