// cloudfunctions/biz_getWallet/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  // event.page: 页码，从 0 开始
  // event.student_id: 要查哪个学生 (家长必填，因为可能有二胎)
  const page = event.page || 0
  const pageSize = 20
  const studentId = event.student_id

  if (!studentId) return { code: 400, msg: '缺少学生ID' }

  // 1. 查询总条数 (用于前端显示“共xx条”)
  const countResult = await db.collection('biz_wallet_logs').where({
    student_id: studentId
  }).count()

  // 2. 分页查询
  const listResult = await db.collection('biz_wallet_logs')
    .where({ student_id: studentId })
    .orderBy('create_time', 'desc') // 最近的在最上面
    .skip(page * pageSize)
    .limit(pageSize)
    .get()

  return {
    code: 200,
    data: listResult.data,
    total: countResult.total,
    hasMore: (page * pageSize + listResult.data.length) < countResult.total
  }
}