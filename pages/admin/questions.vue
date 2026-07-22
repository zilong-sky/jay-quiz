<template>
  <div class="admin-questions">
    <div class="header">
      <h2>📋 题目管理</h2>
      <div class="actions">
        <el-button type="info" @click="onImport">导入种子数据</el-button>
        <el-button type="success" @click="onExport">导出全部</el-button>
        <el-button type="primary" @click="onAdd">新增题目</el-button>
        <el-button @click="onLogout">退出登录</el-button>
      </div>
    </div>
    
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filters.category" placeholder="筛选分类" clearable @change="loadQuestions">
        <el-option label="歌词填空" value="lyrics" />
        <el-option label="创作背景" value="creation" />
        <el-option label="个人经历" value="life" />
      </el-select>
      <el-input
        v-model="filters.keyword"
        placeholder="搜索题干关键词"
        style="width: 240px"
        clearable
        @keyup.enter="loadQuestions"
      />
      <el-button type="primary" @click="loadQuestions">搜索</el-button>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover">
        <div class="stat-item">
          <span class="label">题目总数</span>
          <span class="value">{{ total }}</span>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="stat-item">
          <span class="label">拼图题</span>
          <span class="value puzzle">{{ puzzleCount }}</span>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="stat-item">
          <span class="label">当前页</span>
          <span class="value">{{ list.length }}</span>
        </div>
      </el-card>
    </div>
    
    <!-- 题目列表（拖拽排序） -->
    <el-card class="list-card">
      <draggable
        v-model="list"
        item-key="id"
        handle=".drag-handle"
        ghost-class="ghost"
        chosen-class="chosen"
        animation="300"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <div class="question-item">
            <div class="drag-handle">⋮⋮</div>
            <div class="q-info">
              <div class="q-header">
                <span class="q-id">{{ element.id }}</span>
                <el-tag size="small" :type="tagType(element.category)">
                  {{ categoryLabel(element.category) }}
                </el-tag>
                <el-tag size="small" :type="typeTagType(element.type)">
                  {{ typeLabel(element.type) }}
                </el-tag>
                <el-tag v-if="element.puzzleEnabled && element.puzzleImage" size="small" type="warning" effect="dark">
                  🧩 拼图
                </el-tag>
              </div>
              <div class="q-content">{{ element.content }}</div>
              <div class="q-answer">答案：{{ element.answer }}</div>
            </div>
            <div class="q-actions">
              <el-button size="small" @click="onEdit(element)">编辑</el-button>
              <el-button size="small" type="danger" @click="onDelete(element.id)">删除</el-button>
            </div>
          </div>
        </template>
      </draggable>
      
      <el-empty v-if="list.length === 0" description="暂无数据" />
      
      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadQuestions"
          @current-change="loadQuestions"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingItem ? '编辑题目' : '新增题目'"
      width="600px"
      @close="dialogVisible = false"
    >
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="歌词填空" value="lyrics" />
            <el-option label="创作背景" value="creation" />
            <el-option label="个人经历" value="life" />
          </el-select>
        </el-form-item>
        <el-form-item label="题型" prop="type">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="单选题" value="single" />
            <el-option label="判断题" value="judge" />
            <el-option label="填空题" value="blank" />
          </el-select>
        </el-form-item>
        <el-form-item label="题干" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item v-if="form.type !== 'blank'" label="选项">
          <div v-if="form.type === 'judge'">
            <el-input v-model="form.options[0]" placeholder="选项A" style="margin-bottom: 8px" />
            <el-input v-model="form.options[1]" placeholder="选项B" />
          </div>
          <div v-else>
            <el-input v-for="(opt, idx) in 4" :key="idx" v-model="form.options[idx]"
              :placeholder="`选项${String.fromCharCode(65 + idx)}`" style="margin-bottom: 8px" />
          </div>
        </el-form-item>
        <el-form-item label="正确答案" prop="answer">
          <el-input v-model="form.answer" placeholder="单选填A/B/C/D，判断填正确/错误，填空直接填答案" />
        </el-form-item>
        <el-form-item label="解析">
          <el-input v-model="form.explanation" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="拼图模式">
          <el-switch v-model="form.puzzleEnabled" active-text="开启" inactive-text="关闭" />
        </el-form-item>
        <el-form-item v-if="form.puzzleEnabled" label="拼图图片">
          <el-input v-model="form.puzzleImage" placeholder="图片 URL 地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Question } from '~/types'

const router = useRouter()
const filters = ref({
  page: 1,
  pageSize: 20,
  category: '',
  keyword: ''
})

const list = ref<Question[]>([])
const total = ref(0)
const loading = ref(false)
const submitting = ref(false)

const dialogVisible = ref(false)
const editingItem = ref<Question | null>(null)
const formRef = ref<FormInstance>()

const form = ref({
  id: '',
  category: 'lyrics',
  type: 'single',
  content: '',
  options: ['', '', '', ''],
  answer: '',
  explanation: '',
  puzzleEnabled: false,
  puzzleImage: ''
})

const rules = {
  category: [{ required: true, message: '请选择分类' }],
  type: [{ required: true, message: '请选择题型' }],
  content: [{ required: true, message: '请输入题干' }],
  answer: [{ required: true, message: '请输入正确答案' }]
} as FormRules

// 统计拼图题数量
const puzzleCount = computed(() => list.value.filter(q => q.puzzleEnabled && q.puzzleImage).length)

// 加载题目列表
async function loadQuestions() {
  loading.value = true
  try {
    const res = await $fetch('/api/admin/questions', {
      query: {
        page: filters.value.page,
        pageSize: filters.value.pageSize,
        category: filters.value.category || undefined,
        keyword: filters.value.keyword || undefined
      }
    })
    
    if (res.code === 0) {
      list.value = res.data.list
      total.value = res.data.total
    }
  } catch (e: any) {
    if (e.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      router.push('/admin/login')
    } else {
      ElMessage.error('加载失败')
    }
  } finally {
    loading.value = false
  }
}

// 拖拽结束保存排序
async function onDragEnd() {
  const ids = list.value.map(q => q.id)
  try {
    await $fetch('/api/admin/questions/reorder', {
      method: 'POST',
      body: { ids }
    })
    ElMessage.success('排序已更新')
  } catch (e) {
    ElMessage.error('排序保存失败')
    await loadQuestions()
  }
}

// 新增
function onAdd() {
  editingItem.value = null
  form.value = {
    id: '',
    category: 'lyrics',
    type: 'single',
    content: '',
    options: ['', '', '', ''],
    answer: '',
    explanation: '',
    puzzleEnabled: false,
    puzzleImage: ''
  }
  dialogVisible.value = true
}

// 编辑
function onEdit(item: Question) {
  editingItem.value = item
  form.value = {
    id: item.id,
    category: item.category,
    type: item.type,
    content: item.content,
    options: [...(item.options || ['', '', '', ''])],
    answer: item.answer,
    explanation: item.explanation || '',
    puzzleEnabled: !!item.puzzleEnabled,
    puzzleImage: item.puzzleImage || ''
  }
  dialogVisible.value = true
}

// 保存
async function onSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  
  submitting.value = true
  try {
    const res = await $fetch('/api/admin/questions', {
      method: 'POST',
      body: form.value
    })
    
    if (res.code === 0) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadQuestions()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

// 删除
async function onDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除这道题吗？', '提示', {
      type: 'warning'
    })
    
    const res = await $fetch('/api/admin/questions/delete', {
      method: 'POST',
      body: { ids: [id] }
    })
    
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadQuestions()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {
    // 取消删除
  }
}

// 导入种子数据
async function onImport() {
  try {
    const { value: mode } = await ElMessageBox.prompt(
      '请选择导入模式：',
      '导入种子数据',
      {
        confirmButtonText: '确认导入',
        cancelButtonText: '取消',
        inputType: 'select',
        inputValue: 'increment',
        inputOptions: [
          { value: 'increment', label: '增量导入（跳过已存在的）' },
          { value: 'overwrite', label: '覆盖导入（清空所有后重新导入）' }
        ]
      }
    )
    
    ElMessage.info('导入中...')
    const res = await $fetch('/api/admin/questions/import', {
      method: 'POST',
      body: { mode }
    })
    
    if (res.code === 0) {
      ElMessage.success(res.message || '导入成功')
      loadQuestions()
    } else {
      ElMessage.error(res.message || '导入失败')
    }
  } catch {
    // 取消
  }
}

// 导出
async function onExport() {
  const res = await $fetch('/api/admin/questions/export')
  if (res.code === 0) {
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jay-quiz-questions-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }
}

// 登出
async function onLogout() {
  try {
    await $fetch('/api/admin/auth/logout')
    ElMessage.success('已退出登录')
    router.push('/admin/login')
  } catch (e) {
    ElMessage.error('登出失败')
  }
}

// 标签颜色
function tagType(category: string) {
  const map: Record<string, string> = {
    lyrics: 'danger',
    creation: 'primary',
    life: 'success'
  }
  return map[category] || ''
}

function categoryLabel(key: string) {
  const map: Record<string, string> = {
    lyrics: '歌词填空',
    creation: '创作背景',
    life: '个人经历'
  }
  return map[key] || key
}

function typeTagType(type: string) {
  const map: Record<string, string> = {
    single: 'primary',
    judge: 'success',
    blank: 'warning'
  }
  return map[type] || ''
}

function typeLabel(key: string) {
  const map: Record<string, string> = {
    single: '单选题',
    judge: '判断题',
    blank: '填空题'
  }
  return map[key] || key
}

onMounted(() => {
  loadQuestions()
})
</script>

<style scoped>
.admin-questions {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-item .label {
  display: block;
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-item .value {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-item .value.puzzle {
  color: #e6a23c;
}

.list-card {
  min-height: 400px;
}

.question-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  transition: background 0.2s;
}

.question-item:hover {
  background: #f5f7fa;
}

.question-item:last-child {
  border-bottom: none;
}

.drag-handle {
  cursor: grab;
  padding: 8px 12px;
  color: #c0c4cc;
  font-size: 18px;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.q-info {
  flex: 1;
  min-width: 0;
}

.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.q-id {
  font-family: monospace;
  color: #909399;
  font-size: 12px;
}

.q-content {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.6;
}

.q-answer {
  font-size: 13px;
  color: #67c23a;
}

.q-actions {
  display: flex;
  gap: 8px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.ghost {
  opacity: 0.5;
  background: #e6f7ff;
}

.chosen {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
</style>
