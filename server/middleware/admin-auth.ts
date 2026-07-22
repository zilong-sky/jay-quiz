// 管理员认证中间件
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  
  // 登录接口不校验
  if (url.pathname.includes('/api/admin/auth/login')) {
    return
  }
  
  // 校验 admin_session cookie
  const session = getCookie(event, 'admin_session')
  if (!session) {
    throw createError({
      statusCode: 401,
      message: '未登录，请先登录'
    })
  }
  
  try {
    const { id, expiresAt } = JSON.parse(atob(session))
    if (Date.now() > expiresAt) {
      throw createError({
        statusCode: 401,
        message: '登录已过期，请重新登录'
      })
    }
  } catch (e) {
    throw createError({
      statusCode: 401,
      message: '无效的会话'
    })
  }
})
