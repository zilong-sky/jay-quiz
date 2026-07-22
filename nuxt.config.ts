export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2024-11-01',
  modules: ['@element-plus/nuxt'],
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
