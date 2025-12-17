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
          
          // === 【核心修改】计算 CSS 类名 和 样式字符串 ===
          list.forEach(exam => {
            if (exam.subjects) {
              exam.subjects.forEach(sub => {
                // 1. 计算颜色类名
                if (sub.score >= 90) {
                  sub.scoreClass = 'score-high'
                } else if (sub.score >= 60) {
                  sub.scoreClass = 'score-mid'
                } else {
                  sub.scoreClass = 'score-low'
                }
                
                // 2. 【新增】直接在这里生成 style 字符串，解决 WXML 报错
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

  onPickerChange(e) {
    this.setData({ currentExam: this.scoreList[e.detail.value] })
  }
})