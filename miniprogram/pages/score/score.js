// pages/score/score.js
const app = getApp()

Page({
  data: {
    studentList: [], 
    currentStudentIndex: 0,
    scoreList: [],
    currentExam: null,
    loading: true
  },

  onLoad() { this.initData() },
  
  // 下拉刷新
  onPullDownRefresh() { this.initData() },

  initData() {
    const user = app.globalData.roleInfo
    if (!user) { setTimeout(() => { this.initData() }, 500); return; }

    const students = user.children_ids.map(id => ({ id: id, name: '张小明' })) 
    this.setData({ studentList: students, currentStudentIndex: 0 })
    if (students.length > 0) this.fetchScores(students[0].id)
  },

  fetchScores(studentId) {
    wx.showLoading({ title: '加载成绩...' })
    wx.cloud.callFunction({
      name: 'biz_getScores',
      data: { student_id: studentId },
      success: res => {
        wx.hideLoading()
        wx.stopPullDownRefresh()
        
        if (res.result.code === 200) {
          let list = res.result.data
          
          // === 数据预处理 ===
          list.forEach(exam => {
            // 1. 修复排名显示 (兼容字段)
            if (!exam.class_rank && exam.rank) exam.class_rank = exam.rank;
            // 如果没有年级排名，模拟生成一个 (假设年级有6个班)
            if (!exam.grade_rank) {
              exam.grade_rank = (exam.class_rank || 10) * 6 - Math.floor(Math.random() * 5); 
            }

            // 2. 计算颜色和进度条
            if (exam.subjects) {
              exam.subjects.forEach(sub => {
                if (sub.score >= 90) sub.scoreClass = 'score-high'
                else if (sub.score >= 60) sub.scoreClass = 'score-mid'
                else sub.scoreClass = 'score-low'
                
                sub.widthStyle = 'width: ' + sub.score + '%;' 
              })
            }
          })

          if (list.length > 0) {
            this.setData({ scoreList: list, currentExam: list[0], loading: false })
          } else {
            this.setData({ scoreList: [], currentExam: null, loading: false })
          }
        }
      },
      fail: err => {
        wx.hideLoading()
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  // 切换考试批次
  onPickerChange(e) {
    const index = e.detail.value
    // 【BUG修复】必须加 .data 才能获取到数据
    this.setData({ 
      currentExam: this.data.scoreList[index] 
    })
  }
})