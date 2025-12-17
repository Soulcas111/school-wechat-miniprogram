const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// --- 核心配置 ---
const CLASS_COUNT = 5        // 班级数量
const STUDENTS_PER_CLASS = 20 // 每班人数 (总人数 = 100)
const LOGS_PER_STUDENT = 30   // 每人生成多少条消费流水 (总流水 ≈ 3000条)

// --- 工具函数 ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const generatePhone = () => '13' + Math.floor(Math.random() * 1000000000)
// 生成过去某天的时间
const pastDate = (daysAgo) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d
}

// --- 分批写入工具 (解决云函数单次写入限制) ---
async function batchAdd(collectionName, dataArray) {
  const MAX_LIMIT = 500 // 安全起见，每次写500条
  const total = dataArray.length
  let count = 0
  
  console.log(`正在写入 ${collectionName}, 总条数: ${total}...`)
  
  for (let i = 0; i < total; i += MAX_LIMIT) {
    const batch = dataArray.slice(i, i + MAX_LIMIT)
    await db.collection(collectionName).add({ data: batch })
    count += batch.length
    console.log(`  - 已写入 ${count}/${total}`)
  }
}

exports.main = async (event, context) => {
  console.log('开始生成【海量】测试数据...')

  // 1. 清空旧数据
  const collections = ['sys_users', 'base_students', 'biz_scores', 'biz_menus', 'biz_wallet_logs', 'cms_news']
  for (const col of collections) {
    try {
      await db.collection(col).where({ _id: _.exists(true) }).remove()
    } catch (e) {}
  }

  const allUsers = []
  const allStudents = []
  const allScores = []
  const allLogs = []

  // --- 基础数据 ---
  const classList = []
  for(let i=1; i<=CLASS_COUNT; i++) classList.push(`三年级${i}班`)
  
  const subjectsMain = ['语文', '数学', '英语']
  const subjectsSub = ['物理', '化学', '生物']
  const examBatches = [
    { name: '2025第一学期第一次月考', date: pastDate(60) },
    { name: '2025第一学期期中考试', date: pastDate(30) },
    { name: '2025第一学期第二次月考', date: pastDate(7) }
  ]

  // ===========================================
  // Part 1: 生成老师 (共 15+9=24人)
  // ===========================================
  // 1.1 语数英 (1人1班)
  for (const className of classList) {
    for (const sub of subjectsMain) {
      const isHeadTeacher = (sub === '语文') 
      allUsers.push({
        _id: `t_${sub}_${className}`, 
        _openid: `openid_${sub}_${className}`,
        role: 'teacher',
        name: `${sub}老师(${className})`,
        phone: generatePhone(),
        teach_classes: [className],
        func_perms: isHeadTeacher ? ['news_admin', 'menu_admin', 'course_admin'] : []
      })
    }
  }
  // 1.2 物化生 (1人2班)
  const comboClasses = [
    [classList[0], classList[1]], // 1,2班
    [classList[2], classList[3]], // 3,4班
    [classList[4]]                // 5班
  ]
  subjectsSub.forEach(sub => {
    comboClasses.forEach((classes, idx) => {
      if(!classes[0]) return
      allUsers.push({
        _id: `t_${sub}_${idx}`,
        _openid: `openid_${sub}_${idx}`, // 必须唯一
        role: 'teacher',
        name: `${sub}老师(组${idx+1})`,
        teach_classes: classes,
        func_perms: []
      })
    })
  })

  // ===========================================
  // Part 2: 生成学生 & 家长 & 成绩 & 流水
  // ===========================================
  let globalStuIdx = 1

  for (const className of classList) {
    for (let i = 1; i <= STUDENTS_PER_CLASS; i++) {
      const stuId = `stu_${globalStuIdx}`
      const name = `学生${globalStuIdx}` // 简化名字以便区分
      
      // 2.1 学生
      allStudents.push({
        _id: stuId,
        name: name,
        student_no: `2025${String(globalStuIdx).padStart(4, '0')}`,
        class_name: className,
        balance: parseFloat(randomInt(50, 500).toFixed(2))
      })

      // 2.2 家长 (每人绑定2位)
      allUsers.push({
        _id: `parent_fa_${stuId}`,
        _openid: `openid_fa_${stuId}`,
        role: 'parent',
        name: `${name}爸爸`,
        phone: generatePhone(),
        children_ids: [stuId]
      })
      allUsers.push({
        _id: `parent_mo_${stuId}`,
        _openid: `openid_mo_${stuId}`,
        role: 'parent',
        name: `${name}妈妈`,
        phone: generatePhone(),
        children_ids: [stuId]
      })

      // 2.3 成绩 (生成 3 次考试)
      examBatches.forEach(exam => {
        const subjects = [...subjectsMain, ...subjectsSub]
        const subjectScores = subjects.map(sub => ({
          name: sub,
          score: randomInt(60, 100),
          max_score: 100
        }))
        const total = subjectScores.reduce((acc, cur) => acc + cur.score, 0)
        
        allScores.push({
          student_id: stuId,
          student_name: name,
          class_name: className,
          exam_name: exam.name,
          subjects: subjectScores,
          total_score: total,
          publish_time: exam.date
        })
      })

      // 2.4 【新增】消费流水 (海量数据)
      // 为每位学生生成最近30天的消费
      for (let d = 0; d < LOGS_PER_STUDENT; d++) {
        const amount = -randomInt(8, 20) // 消费 8-20元
        allLogs.push({
          student_id: stuId,
          type: 'consume',
          amount: amount,
          title: randomPick(['早餐消费', '午餐消费', '晚餐消费', '超市消费']),
          location: randomPick(['一食堂', '二食堂', '小卖部']),
          create_time: pastDate(randomInt(0, 30)) // 最近30天随机
        })
      }
      // 偶尔加一条充值记录
      allLogs.push({
        student_id: stuId,
        type: 'recharge',
        amount: 200,
        title: '家长充值',
        location: '线上充值',
        create_time: pastDate(randomInt(10, 20))
      })

      globalStuIdx++
    }
  }

  // ===========================================
  // Part 3: 食谱 & 新闻
  // ===========================================
  const menus = []
  for(let i=0; i<7; i++) {
    menus.push({
      date: pastDate(-i), // 未来7天
      week_day: ['周日','周一','周二','周三','周四','周五','周六'][new Date().getDay()],
      meals: { breakfast: '牛奶面包', lunch: '红烧肉套餐', dinner: '饺子' },
      publisher_id: 'admin'
    })
  }
  
  const news = [
    { type: 'news', title: '运动会开幕式通知', content: '...', status: 1, create_time: new Date() },
    { type: 'course', title: '家庭教育讲座视频', video_url: '...', status: 1, create_time: new Date() }
  ]

  // ===========================================
  // Part 4: 执行写入 (使用分批函数)
  // ===========================================
  try {
    await batchAdd('sys_users', allUsers)
    await batchAdd('base_students', allStudents)
    await batchAdd('biz_scores', allScores)
    await batchAdd('biz_wallet_logs', allLogs) // 这里会有几千条
    await batchAdd('biz_menus', menus)
    await batchAdd('cms_news', news)

    return {
      code: 200,
      msg: '海量数据注入成功',
      stat: {
        users: allUsers.length,
        students: allStudents.length,
        scores: allScores.length,
        logs: allLogs.length
      }
    }
  } catch (err) {
    console.error(err)
    return { code: 500, error: err }
  }
}