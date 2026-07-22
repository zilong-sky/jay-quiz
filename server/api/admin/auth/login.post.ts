// 管理员登录
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { password } = await readBody(event)
  const config = useRuntimeConfig()
  
  // 比对密码（明文比对，环境变量配置
  if (password !== config.adminPassword) {
    return { code: 1, message: '密码错误' }
  }
  
  // 生成 7 天有效期的 session
  const session = btoa(JSON.stringify({
    id: 'admin',
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  }))
  
  setCookie(event, 'admin_session', session, {
    maxAge: 7 * 24 * 60 * 60,
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  })
  
  return { code: 0, message: '登录成功' }
})
