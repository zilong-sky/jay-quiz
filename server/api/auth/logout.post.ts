import { ok } from '~/server/utils/response'
// 无状态 JWT：仅返回成功，客户端清除 token 即可
export default defineEventHandler(() => ok(null, '已退出'))
