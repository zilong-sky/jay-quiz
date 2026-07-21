// Nuxt3 配置文件 —— 兼顾 Web + 微信小程序迁移
// 关键点：
// 1. 所有服务端持久化通过 unstorage 抽象（nitro.storage），本地用 fs，线上可切 vercel-kv
// 2. 前端不直接使用 window/document，统一通过 utils/composables 封装
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: true,
  typescript: { strict: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '周杰伦粉丝知识答题',
      meta: [
        { name: 'viewport', content: 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no' },
        { name: 'description', content: '周杰伦粉丝知识答题周榜' }
      ]
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'jay-chou-super-secret-change-me',
    public: {
      apiBase: '/api'
    }
  },
  nitro: {
    // 服务端 KV：默认使用 fs（本地开发 & Vercel dev）；生产可接入 Vercel KV / Redis
    storage: {
      db: {
        driver: 'fs',
        base: './.data/db'
      }
    },
    // Vercel 部署预设
    preset: process.env.NITRO_PRESET || undefined
  }
})
