// cloudfunctions/biz_getScores/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  console.log('正在查询成绩，参数:', event)

  // 1. 尝试获取用户信息
  let user = null
  const userRes = await db.collection('sys_users').where({ _openid: OPENID }).get()

  if (userRes.data.length > 0) {
    user = userRes.data[0]
  } else {
    // === 【关键】调试模式兼容逻辑 ===
    // 如果数据库里查不到你（因为我们在用强制登录），就默认你是那个测试家长
    console.log('未找到真实用户，启用调试默认身份')
    user = {
      role: 'parent',
      children_ids: ['stu_1'] // 确保这里跟 sys_login 里的学号一致！
    }
  }

  // 2. 构建查询条件
  let queryCondition = {}

  if (user.role === 'parent') {
    // 家长查孩子
    if (!user.children_ids || user.children_ids.length === 0) {
      return { code: 200, data: [] }
    }
    // 查询条件：学生的ID在家长的 children_ids 数组里
    // 并且按学号查询（如果指定了 student_id）
    if (event.student_id) {
       queryCondition.student_id = event.student_id
    } else {
       queryCondition.student_id = _.in(user.children_ids)
    }
  } 
  else if (user.role === 'teacher') {
    // 老师查班级 (后续扩展)
    return { code: 200, data: [], msg: '老师功能暂未开放' }
  }

  // 3. 筛选考试批次 (如果前端传了)
  if (event.exam_name) {
    queryCondition.exam_name = event.exam_name
  }

  // 4. 执行查询
  const res = await db.collection('biz_scores')
    .where(queryCondition)
    .orderBy('publish_time', 'desc')
    .get()

  return {
    code: 200,
    data: res.data
  }
}