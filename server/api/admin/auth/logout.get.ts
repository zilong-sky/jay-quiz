// 管理员登出
export default defineEventHandler(async (event) => {
  deleteCookie(event, 'admin_session')
  return { code: 0, message: '登出成功' }
})
