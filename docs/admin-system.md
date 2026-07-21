# 周杰伦粉丝答题 — 题目管理系统设计文档

## 项目概述
基于 Nuxt 4 Server 的轻量级后端管理系统，用于题目 CRUD、分类管理、题库同步、数据统计等核心功能。

---

## 技术栈
- **框架**：Nuxt 4 (Vue 3 + Nitro Server)
- **UI**：Element Plus / Ant Design Vue
- **存储**：KV (Vercel) / 本地文件 (开发环境)
- **认证**：Admin 单密码登录 (Cookie Session)
- **数据导出**：JSON / Excel

---

## 目录结构
```
jay-quiz/
├── pages/
│   └── admin/
│       ├── index.vue              # 登录页
│       ├── dashboard.vue          # 控制台首页
│       ├── questions.vue          # 题目列表/CRUD
│       ├── categories.vue         # 分类权重管理
│       ├── stats.vue              # 答题统计
│       └── sync.vue               # 题库同步/导入导出
├── server/
│   ├── api/
│   │   └── admin/
│   │       ├── auth/
│   │       │   ├── login.post.ts  # 登录
│   │       │   └── logout.get.ts  # 登出
│   │       ├── questions/
│   │       │   ├── index.get.ts   # 列表（分页/筛选）
│   │       │   ├── index.post.ts  # 新增/编辑
│   │       │   ├── delete.post.ts # 批量删除
│   │       │   ├── import.post.ts # 批量导入
│   │       │   └── export.get.ts  # 导出
│   │       ├── categories/
│   │       │   ├── index.get.ts   # 分类列表
│   │       │   └── index.post.ts  # 更新权重
│   │       ├── stats/
│   │       │   └── overview.get.ts # 统计概览
│   │       └── sync/
│   │           ├── to-kv.post.ts  # 种子数据同步到 KV
│   │           └── to-file.post.ts # KV 数据备份到文件
│   └── middleware/
│       └── admin-auth.ts           # 管理员认证中间件
├── composables/
│   └── useAdminAuth.ts             # 前端认证状态
└── docs/
    └── admin-system.md             # 本文档
```

---

## 核心功能模块

### 1. 认证模块
- **登录**：单管理员密码，登录成功写入 `admin_session` Cookie
- **会话有效期**：7 天
- **中间件**：所有 `/api/admin/*` 接口统一校验
- **配置**：密码通过环境变量 `ADMIN_PASSWORD` 注入

### 2. 题目管理模块
| 功能 | 说明 |
|------|------|
| 题目列表 | 分页展示，支持按分类/题型/难度筛选 |
| 新增题目 | 表单录入：题干/选项/答案/解析/分类/题型 |
| 编辑题目 | 支持修改所有字段，ID 不变 |
| 删除题目 | 单个删除 / 批量删除 |
| 批量导入 | 支持 JSON / Excel 格式导入，校验格式 |
| 批量导出 | 导出全部或筛选后的题目为 JSON |
| 搜索 | 按题干关键词模糊搜索 |

### 3. 分类权重管理
- 展示当前分类权重配置（歌词 50% / 创作 30% / 个人 20%）
- 支持在线调整权重，实时生效
- 自动校验权重总和为 100%

### 4. 数据统计模块
- 题目总量、各分类/题型分布
- 答题次数、正确率统计（按周/月）
- 高频错题排行
- 活跃用户数

### 5. 题库同步模块
- **种子 → KV**：将 `server/data/questions.ts` 的种子数据同步到 KV（覆盖/增量两种模式）
- **KV → 备份**：将当前 KV 中的题库导出为 JSON 文件备份
- **版本记录**：同步操作记录时间和快照，支持回滚

---

## 数据模型

### Question (题目)
```typescript
interface Question {
  id: string                    // 题目唯一标识 q0001
  category: 'lyrics' | 'creation' | 'life'  // 分类
  type: 'single' | 'judge' | 'blank'         // 题型
  content: string               // 题干
  options?: string[]            // 选项（单选/判断）
  answer: string                // 正确答案
  explanation: string           // 解析
  difficulty: 1 | 2 | 3        // 难度等级
  createdAt: number             // 创建时间
  updatedAt: number             // 更新时间
  usedCount?: number            // 出题次数
  correctCount?: number         // 答对次数
}
```

### CategoryWeight (分类权重)
```typescript
interface CategoryWeight {
  key: string
  label: string
  weight: number                // 0-1 小数
}
```

### AdminSession (管理员会话)
```typescript
interface AdminSession {
  id: string
  createdAt: number
  expiresAt: number
}
```

---

## API 接口设计

### 认证
```
POST /api/admin/auth/login
  Body: { password: string }
  Return: { code: 0 | 1, message: string }

GET /api/admin/auth/logout
  Return: { code: 0 }
```

### 题目管理
```
GET /api/admin/questions
  Query: { page?, pageSize?, category?, type?, keyword? }
  Return: { list: Question[], total: number }

POST /api/admin/questions
  Body: Question
  Return: { code: 0, data: Question }

POST /api/admin/questions/delete
  Body: { ids: string[] }
  Return: { code: 0, deletedCount: number }

POST /api/admin/questions/import
  Body: FormData (file)
  Return: { code: 0, importedCount: number, failed: Array }

GET /api/admin/questions/export
  Query: { category?, type? }
  Return: JSON 文件下载
```

### 分类权重
```
GET /api/admin/categories
  Return: CategoryWeight[]

POST /api/admin/categories
  Body: CategoryWeight[]
  Return: { code: 0 }
```

### 统计
```
GET /api/admin/stats/overview
  Return: {
    totalQuestions: number,
    categoryBreakdown: Record<string, number>,
    typeBreakdown: Record<string, number>,
    weeklyAnswers: number,
    weeklyCorrectRate: number,
    topWrongQuestions: Question[]
  }
```

### 同步
```
POST /api/admin/sync/to-kv
  Body: { mode: 'overwrite' | 'increment' }
  Return: { code: 0, syncedCount: number }

POST /api/admin/sync/to-file
  Return: { code: 0, filename: string }
```

---

## 开发计划

### Phase 1: 基础框架
- 管理员登录/登出
- 认证中间件
- 控制台首页

### Phase 2: 题目 CRUD
- 题目列表分页/筛选
- 新增/编辑/删除题目
- 表单校验

### Phase 3: 批量操作
- 批量导入/导出
- 批量删除
- 分类权重配置

### Phase 4: 统计与同步
- 答题数据统计
- 题库同步功能
- 操作日志

---

## 安全注意事项
1. 所有管理接口必须经过认证中间件
2. 密码不能明文存储，使用 bcrypt 哈希
3. 导入文件需要严格校验格式和大小
4. 生产环境必须配置 HTTPS
5. 管理后台建议通过 Nginx 做 IP 白名单限制

---

## 后续扩展方向
- 多管理员账号支持
- 题目审核流程
- 题目版本历史
- 定时自动备份
- 答题数据可视化大屏
- 微信小程序端管理入口
