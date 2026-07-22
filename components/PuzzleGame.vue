<template>
  <div class="puzzle-container" :class="{ completed: isCompleted }">
    <div class="puzzle-grid" ref="gridRef">
      <div
        v-for="(tile, idx) in tiles"
        :key="idx"
        class="puzzle-tile"
        :class="{
          dragging: draggingTile === idx,
          'drop-target': dropTarget === idx && draggingTile !== null && draggingTile !== idx
        }"
        :style="[
          tileStyle(tile),
          draggingTile === idx ? dragStyle : {}
        ]"
        @mousedown.stop.prevent="onDragStart($event, idx)"
        @touchstart.stop.prevent="onTouchStart($event, idx)"
      >
        <div class="tile-number">{{ tile + 1 }}</div>
      </div>
    </div>
    <div v-if="!isCompleted" class="puzzle-hint">
      🧩 <b>拖动任意方块到目标位置交换</b>！还剩 {{ shuffleCount }} 次重新打乱
      <button v-if="shuffleCount > 0" class="btn tiny" @click="shuffle">再打乱</button>
    </div>
    <div v-else class="puzzle-success">✅ 拼图完成！可以答题了</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  imageUrl: string
  rows?: number
  cols?: number
}>()

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const rows = props.rows || 4
const cols = props.cols || 4
const totalTiles = rows * cols

// 拼图状态
const tiles = ref<number[]>([])
const shuffleCount = ref(3)
const isCompleted = ref(false)

// 拖拽状态
const gridRef = ref<HTMLElement | null>(null)
const draggingTile = ref<number | null>(null)
const dropTarget = ref<number | null>(null)
const startPos = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })
const dragStyle = ref({ transform: '', zIndex: '100', opacity: '0.9' })

// 初始化有序拼图
function init() {
  tiles.value = Array.from({ length: totalTiles }, (_, i) => i)
  isCompleted.value = false
  draggingTile.value = null
  dropTarget.value = null
}

// 单个方块的样式
function tileStyle(tileIdx: number) {
  const row = Math.floor(tileIdx / cols)
  const col = tileIdx % cols
  return {
    backgroundImage: `url(${props.imageUrl})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${col * 100 / (cols - 1)}% ${row * 100 / (rows - 1)}%`
  }
}

// 获取方块尺寸
function getTileSize() {
  if (!gridRef.value) return { width: 80, height: 80 }
  const grid = gridRef.value as HTMLElement
  const firstTile = grid.children[0] as HTMLElement
  if (!firstTile) return { width: 80, height: 80 }
  return {
    width: firstTile.offsetWidth + 2, // + gap
    height: firstTile.offsetHeight + 2
  }
}

// 根据坐标找到目标方块索引
function findTargetIdx(clientX: number, clientY: number): number | null {
  if (!gridRef.value) return null
  
  const grid = gridRef.value as HTMLElement
  const rect = grid.getBoundingClientRect()
  const { width, height } = getTileSize()
  
  const x = clientX - rect.left
  const y = clientY - rect.top
  
  const col = Math.floor(x / width)
  const row = Math.floor(y / height)
  
  if (col < 0 || col >= cols || row < 0 || row >= rows) return null
  
  return row * cols + col
}

// ========== 桌面端拖拽 ==========
function onDragStart(e: MouseEvent, idx: number) {
  if (isCompleted.value) return
  
  draggingTile.value = idx
  startPos = { x: e.clientX, y: e.clientY }
  dragOffset = { x: 0, y: 0 }
  
  const onMouseMove = (e: MouseEvent) => {
    if (draggingTile.value === null) return
    
    dragOffset = {
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    }
    dragStyle.transform = `translate(${dragOffset.x}px, ${dragOffset.y}px)`
    
    // 实时检测目标位置
    const target = findTargetIdx(e.clientX, e.clientY)
    dropTarget.value = target !== draggingTile.value ? target : null
  }
  
  const onMouseUp = (e: MouseEvent) => {
    if (draggingTile.value !== null) {
      const target = findTargetIdx(e.clientX, e.clientY)
      if (target !== null && target !== draggingTile.value) {
        swap(draggingTile.value, target)
      }
    }
    cleanup()
  }
  
  const cleanup = () => {
    draggingTile.value = null
    dropTarget.value = null
    dragStyle.transform = ''
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// ========== 移动端触摸拖拽 ==========
function onTouchStart(e: TouchEvent, idx: number) {
  if (isCompleted.value) return
  
  const touch = e.touches[0]
  draggingTile.value = idx
  startPos = { x: touch.clientX, y: touch.clientY }
  dragOffset = { x: 0, y: 0 }
  
  const onTouchMove = (e: TouchEvent) => {
    if (draggingTile.value === null) return
    e.preventDefault()
    
    const touch = e.touches[0]
    dragOffset = {
      x: touch.clientX - startPos.x,
      y: touch.clientY - startPos.y
    }
    dragStyle.transform = `translate(${dragOffset.x}px, ${dragOffset.y}px)`
    
    // 实时检测目标位置
    const target = findTargetIdx(touch.clientX, touch.clientY)
    dropTarget.value = target !== draggingTile.value ? target : null
  }
  
  const onTouchEnd = (e: TouchEvent) => {
    if (draggingTile.value !== null) {
      const touch = e.changedTouches[0]
      const target = findTargetIdx(touch.clientX, touch.clientY)
      if (target !== null && target !== draggingTile.value) {
        swap(draggingTile.value, target)
      }
    }
    cleanup()
  }
  
  const cleanup = () => {
    draggingTile.value = null
    dropTarget.value = null
    dragStyle.transform = ''
    document.removeEventListener('touchmove', onTouchMove, { passive: false })
    document.removeEventListener('touchend', onTouchEnd)
  }
  
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd)
}

// 交换两个位置
function swap(i: number, j: number) {
  const temp = tiles.value[i]
  tiles.value[i] = tiles.value[j]
  tiles.value[j] = temp
  
  checkComplete()
}

// 检查拼图是否完成
function checkComplete() {
  for (let i = 0; i < totalTiles; i++) {
    if (tiles.value[i] !== i) return false
  }
  
  isCompleted.value = true
  emit('complete')
  return true
}

// 打乱拼图
function shuffle(steps = 80) {
  if (shuffleCount.value <= 0) return
  shuffleCount.value--
  
  init()
  
  // 随机交换多次
  for (let i = 0; i < steps; i++) {
    const a = Math.floor(Math.random() * totalTiles)
    const b = Math.floor(Math.random() * totalTiles)
    if (a !== b) {
      const temp = tiles.value[a]
      tiles.value[a] = tiles.value[b]
      tiles.value[b] = temp
    }
  }
  
  // 确保打乱了
  let sorted = true
  for (let i = 0; i < totalTiles; i++) {
    if (tiles.value[i] !== i) {
      sorted = false
      break
    }
  }
  if (sorted) shuffle(20)
}

// 暴露给父组件的方法
defineExpose({
  isCompleted,
  shuffle,
  init
})

onMounted(() => {
  init()
  // 先让用户看一眼原图，再打乱
  setTimeout(() => {
    shuffle(100)
  }, 1500)
})
</script>

<style scoped>
.puzzle-container {
  margin: 1rem 0;
  text-align: center;
  touch-action: none;
}

.puzzle-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
  max-width: 320px;
  margin: 0 auto 1rem;
  background: rgba(0,0,0,0.1);
  padding: 4px;
  border-radius: 8px;
  position: relative;
}

.puzzle-tile {
  aspect-ratio: 1;
  border-radius: 4px;
  cursor: grab;
  position: relative;
  transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.1s ease;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.puzzle-tile:active {
  cursor: grabbing;
}

.puzzle-tile.dragging {
  transition: none;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.puzzle-tile.drop-target {
  outline: 3px dashed #8b1e2b;
  outline-offset: -3px;
  opacity: 0.7;
}

.tile-number {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  color: rgba(255,255,255,0.8);
  text-shadow: 0 0 3px rgba(0,0,0,0.6);
  pointer-events: none;
  font-weight: bold;
}

.puzzle-hint {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.puzzle-hint b {
  color: #8b1e2b;
  font-weight: 500;
}

.puzzle-success {
  font-size: 14px;
  color: #2e7d32;
  font-weight: 500;
}

.completed .puzzle-tile {
  filter: brightness(1.1);
  cursor: default;
}

.btn.tiny {
  padding: 0.2rem 0.5rem;
  font-size: 12px;
}
</style>
