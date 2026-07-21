# Web → 微信小程序 迁移指南

本项目在架构上全面兼容微信小程序移植，遵循「视图层零业务、业务集中在 composables、平台差异集中在 utils」的分层。

## 一、目录映射

| Nuxt 目录 | 小程序等价 | 迁移做法 |
| --- | --- | --- |
| `pages/*.vue` | `pages/*` | 拆分为 `.wxml + .js + .wxss + .json` |
| `components/*.vue` | `components/*` | 同上，自定义组件 |
| `composables/*.ts` | `utils/business/*.ts` | 直接复用，剥离 Vue 依赖（下述兼容层） |
| `utils/*.ts` | `utils/*.ts` | 替换 `storage.ts` / `request.ts` 内部实现 |
| `types/*.ts` | `types/*.ts` | 100% 直接复用 |
| `server/api/*` | 独立后端服务 | 已经就是无状态 HTTP API，微信端仅需改 baseURL |

## 二、需要替换的平台层

### 1. 存储 —— `utils/storage.ts`
Web 使用 `localStorage`。小程序侧改为：

```ts
const mpAdapter = {
  get: (k) => { try { return wx.getStorageSync(k) || null } catch { return null } },
  set: (k, v) => wx.setStorageSync(k, v),
  remove: (k) => wx.removeStorageSync(k),
  clear: () => wx.clearStorageSync()
}
```
业务代码 `useStorage()` 调用签名不变。

### 2. 网络 —— `utils/request.ts`
Web 使用 `$fetch`。小程序侧改为：

```ts
export function useRequest(url, opts) {
  return new Promise((resolve) => {
    wx.request({
      url: BASE_URL + url,
      method: opts.method || 'GET',
      header: { 'Content-Type': 'application/json', ...authHeader() },
      data: opts.body,
      success: (r) => resolve(r.data),
      fail: () => resolve({ code: -1, message: '网络异常', data: null })
    })
  })
}
```

### 3. 路由
Nuxt 的 `NuxtLink`、`useRouter()` 替换为 `wx.navigateTo({ url })`。UI 上按钮组件封装即可。

### 4. 样式
- 已使用 `rem` 单位，可通过 `wxss` 的 `rpx` 换算：`1rem ≈ 32rpx`（也可保留 `rem` 由构建脚本转换）。
- 未使用 `window`、`document`、`fetch` 等 Web 专属 API。

## 三、开关配置

`app.config.ts` 中定义功能开关：

```ts
features: {
  enablePuzzle: false,
  enableMusicRecognition: false
}
```
小程序侧建议在 `app.json` 同步维护。功能页面已骨架预留：

- 拼图：`pages/puzzle.vue` + `server/api/puzzle/images.get.ts`
- 听歌识曲：`pages/music.vue` + `server/api/music/clips.get.ts` + `verify.post.ts`

## 四、后端

Nitro 生成的 API 完全兼容任意前端接入。生产建议：

- **Vercel 部署**：`vercel.json` 已配置 `NITRO_PRESET=vercel`
- **持久化**：本地开发使用 `fs` 驱动（`.data/db/`），生产切换为 `vercel-kv`
  ```ts
  // nuxt.config.ts
  nitro: {
    storage: {
      db: { driver: 'vercel-kv' }
    }
  }
  ```
- **定时任务**：`server/plugins/init.ts` 内嵌 `setInterval` 兜底；无状态部署请改用 Vercel Cron / 计划任务调用清理接口。

## 五、检查清单

- [x] 未使用 `window` / `document`
- [x] 存储、请求已抽象
- [x] 组件命名与结构对齐小程序 `components`
- [x] Token 存储在 `useStorage`，随小程序适配一并迁移
- [x] 路由集中通过 `useRouter` / `NuxtLink`，可批量替换
