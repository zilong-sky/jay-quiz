# 周杰伦粉丝答题 - 微信小程序迁移指南

## 📋 项目概述
当前项目基于 Nuxt 3 (Vue 3) + Nitro 服务端开发，需要迁移到微信小程序平台。

---

## 🔧 迁移方案选择

### 方案一：uniapp 重构（推荐）
- **优点**：一次开发，多端运行（小程序/H5/App），生态成熟
- **工作量**：前端代码需要改写，后端接口可复用
- **推荐度**：⭐⭐⭐⭐⭐

### 方案二：Nuxt 小程序预设
- **优点**：代码改动最小
- **缺点**：Nuxt 小程序生态不如 uniapp 成熟，坑多
- **推荐度**：⭐⭐⭐

---

## 📝 迁移细节要点

### 1. 🔐 登录认证体系

| 项 | 当前 Web 实现 | 小程序适配说明 |
|----|-------------|-------------|
| 登录方式 | 账号密码登录 | 微信 `wx.login()` 获取 code → 后端换取 openid → 自动注册/登录 |
| 鉴权方式 | Cookie + Session | `header` 中带 token |
| 登录状态持久化 | `localStorage` | `wx.setStorageSync()` / `wx.getStorageSync()` |
| 用户信息 | 用户名/密码 | 微信头像、昵称（可选，通过 `wx.getUserProfile` 获取） |

**后端需要新增接口：**
```
POST /api/auth/wechat
Body: { code: string }
Return: { token: string, user: User }
```

**已预留代码位置：**
- `composables/useAuth.ts` 中的 `wechatLogin()` 方法
- `pages/login.vue` 已自动检测小程序环境并显示微信一键登录

---

### 2. 📦 本地存储

| Web 实现 | 小程序对应 |
|---------|-----------|
| `localStorage` / `sessionStorage` | `wx.setStorageSync()` / `wx.getStorageSync()` |
| `useStorage()` composable | 需要改写为小程序存储封装 |

**需要迁移的存储项：**
| Key | 用途 |
|-----|------|
| `token` | 登录凭证 |
| `localBestScore` | 本周本地最高分 |
| `quizSession` | 休闲模式答题进度 |
| `adventureDailyCount` | 冒险模式每日挑战次数 |
| `myRecords` | 答题历史战绩 |

---

### 3. 🌐 网络请求

| Web 实现 | 小程序对应 |
|---------|-----------|
| `fetch` / `$fetch` | `wx.request()` |

**注意事项：**
- 小程序要求所有接口必须是 HTTPS
- 需要在微信公众平台配置服务器域名白名单
- 请求超时时间建议设置为 10s
- 统一错误处理：网络错误、401 未授权、403 禁止等

**请求封装参考：**
```typescript
function request(url: string, options: any = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://your-domain.com' + url,
      method: options.method || 'GET',
      data: options.body,
      header: {
        'Authorization': 'Bearer ' + getToken(),
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      success: (res) => resolve(res.data),
      fail: reject
    })
  })
}
```

---

### 4. 🧩 拼图组件适配

**当前实现问题：**
- 自由拖拽使用原生 `mousedown/mousemove/mouseup` 事件
- 小程序没有 DOM，需要使用小程序的触摸事件

**适配方案：**
```typescript
// Web 事件 → 小程序触摸事件
mousedown → touchstart
mousemove → touchmove
mouseup   → touchend

// 获取位置：
e.touches[0].clientX / clientY
```

**备选方案（更简单）：**
拼图改为点击交换模式，不做复杂拖拽，兼容更好

---

### 5. 🎨 UI 组件适配

| Web 组件库 | 小程序对应 |
|-----------|-----------|
| Element Plus | Vant / uView UI |

**需要适配的核心组件：**
- ✅ 按钮、表单、输入框
- ✅ 弹窗、确认框、Toast
- ✅ 列表、分页
- ✅ 进度条
- ✅ 选择器

---

### 6. 🚦 路由和导航

| Web 实现 | 小程序对应 |
|---------|-----------|
| `vue-router` / `NuxtLink` | `wx.navigateTo()` / `wx.switchTab()` |
| 路由文件自动生成 | `app.json` 中配置 pages |

**页面路由映射：**
| Web 路径 | 小程序路径 | 说明 |
|---------|-----------|------|
| `/` | `pages/index/index` | 首页 |
| `/login` | `pages/login/index` | 登录页 |
| `/quiz` | `pages/quiz/index` | 休闲模式答题 |
| `/adventure` | `pages/adventure/index` | 冒险模式 |
| `/ranking` | `pages/ranking/index` | 排行榜 |
| `/record` | `pages/record/index` | 我的战绩 |
| `/admin/login` | ❌ 管理后台不放小程序 |
| `/admin/questions` | ❌ 管理后台不放小程序 |

> 💡 管理后台单独保留 Web 版，小程序不做管理功能

---

### 7. 📊 后端接口复用

**✅ 90% 后端接口可以直接复用：**

| 接口 | 复用性 | 说明 |
|-----|--------|------|
| `/api/questions/random` | ✅ 完全复用 | 随机题接口 |
| `/api/questions/sync` | ✅ 完全复用 | 题库同步 |
| `/api/rankings/*` | ✅ 完全复用 | 排行榜所有接口 |
| `/api/auth/login` | ⚠️ 部分复用 | Web 账号密码登录保留 |
| `/api/auth/wechat` | ❌ 需要新增 | 小程序微信登录 |
| `/api/admin/*` | ✅ 完全复用 | 管理后台接口不变 |

**注意：小程序端不需要调用任何 `/api/admin/*` 接口**

---

### 8. 🔔 其他特性适配

#### 8.1 分享功能
小程序需要增加：
- 分享到微信群/好友
- 分享到朋友圈
- 生成答题邀请海报

#### 8.2 广告接入
- 激励视频广告（答题复活）
- Banner 广告
- 插屏广告

#### 8.3 支付（可选）
- 微信支付接入
- 会员/道具购买

#### 8.4 客服消息
- 接入微信客服

---

## 📅 迁移步骤建议

### Phase 1：基础框架搭建（1-2 天）
1. 初始化 uniapp 项目
2. 配置网络请求封装
3. 配置存储封装
4. 微信登录对接

### Phase 2：核心页面迁移（3-4 天）
1. 首页 + 等级徽章
2. 休闲模式答题页
3. 冒险模式答题页
4. 排行榜页
5. 我的战绩页

### Phase 3：组件和细节适配（2-3 天）
1. 拼图组件重写
2. UI 样式统一
3. 交互优化
4. 测试和 bug 修复

### Phase 4：小程序专属功能（2 天）
1. 分享功能
2. 广告接入（可选）
3. 提交审核

**总计：约 1-2 周完成迁移**

---

## ⚠️ 注意事项和坑

1. **DOM 限制**：小程序没有真实 DOM，所有操作 DOM 的代码都要重写
2. **包体积限制**：主包不能超过 2MB，总分包不能超过 20MB
3. **审核规则**：答题类小程序需要注意：
   - 不能有诱导分享
   - 不能有赌博性质内容
   - 内容必须合规
4. **用户隐私**：获取用户头像、昵称需要弹窗授权
5. **网络域名**：所有接口域名必须在微信公众平台备案
6. **图片资源**：建议都放到 CDN，不要打包在小程序里

---

## 📁 迁移后项目结构建议

```
jay-quiz-miniprogram/
├── pages/
│   ├── index/           # 首页
│   ├── login/           # 登录页
│   ├── quiz/            # 休闲模式
│   ├── adventure/       # 冒险模式
│   ├── ranking/         # 排行榜
│   └── record/          # 我的战绩
├── components/
│   ├── PuzzleGame.vue   # 拼图组件（重写）
│   └── RulesModal.vue   # 规则弹窗
├── utils/
│   ├── request.ts       # 网络请求封装
│   ├── storage.ts       # 本地存储封装
│   ├── level.ts         # 等级计算（直接复用）
│   └── week.ts          # 周计算（直接复用）
├── composables/
│   ├── useAuth.ts       # 认证（重写微信登录）
│   ├── useQuiz.ts       # 答题逻辑（大部分复用）
│   └── useMyRecord.ts   # 战绩（存储部分重写）
├── static/              # 静态资源
└── app.json             # 小程序配置
```

---

## ✅ 已预留的兼容点

当前项目已经做了小程序兼容预留：

1. ✅ `composables/useAuth.ts` 已预留 `wechatLogin()` 方法
2. ✅ `pages/login.vue` 已自动检测小程序环境并显示微信一键登录
3. ✅ 所有业务逻辑（等级计算、周榜规则、拼图逻辑）都与 UI 分离，可直接复用
4. ✅ 后端接口设计与平台无关，小程序可直接调用
5. ✅ 存储层已封装为 `useStorage()`，迁移时只需改写底层实现

---

## 🎯 总结

迁移难度：**中等**
- 后端几乎不用改
- 前端业务逻辑大部分可复用
- 主要工作量在：UI 组件重写、网络/存储适配、拼图组件重写

**核心优势：**
- 题库和管理后台已搭建完成，迁移后直接可用
- 数据结构完全兼容，已有数据无缝迁移
- 核心算法和规则已验证稳定
