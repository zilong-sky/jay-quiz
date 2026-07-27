export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2024-11-01',
  // modules: ['@element-plus/nuxt'], // 暂时禁用，避免污染全局样式，admin 页面手动引入
  nitro: {
    preset: process.env.NITRO_PRESET || 'vercel',
    storage: {
      db: {
        driver: 'fs',
        base: './.data/db'
      }
    }
  },
  runtimeConfig: {
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
    public: {
      apiBase: '/api'
    }
  }
})
