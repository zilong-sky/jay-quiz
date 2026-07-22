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
        :style="getTileStyle(idx, tile)"
        @mousedown.stop="startDrag($event, idx)"
        @touchstart.stop.prevent="startTouch($event, idx)"
      >
        <div class="tile-number">{{ tile + 1 }}</div>
      </div>
    </div>
    <div v-if="!isCompleted" class="puzzle-hint">
      🧩 <b>按住方块拖到目标位置交换</b>！还剩 {{ shuffleCount }} 次重新打乱
      <button v-if="shuffleCount > 0" class="btn tiny" @click="shuffle">再打乱</button>
    </div>
    <div v-else class="puzzle-success">✅ 拼图完成！可以答题了</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

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

// 拖拽偏移
const dragX = ref(0)
const dragY = ref(0)
const startX = ref(0)
const startY = ref(0)

// 方块位置缓存
const tileRects = ref<DOMRect[]>([])

// 计算每个方块的样式
function getTileStyle(idx: number, tileIdx: number) {
  const row = Math.floor(tileIdx / cols)
  const col = tileIdx % cols
  
  const baseStyle = {
    backgroundImage: `url(${props.imageUrl})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${col * 100 / (cols - 1)}% ${row * 100 / (rows - 1)}%`
  }
  
  if (draggingTile.value === idx) {
    return {
      ...baseStyle,
      transform: `translate(${dragX.value}px, ${dragY.value}px)`,
      zIndex: '100',
      opacity: '0.9'
    }
  }
  
  return baseStyle
}

// 缓存所有方块的位置
function cacheTileRects() {
  if (!gridRef.value) return
  const children = Array.from(gridRef.value.children) as HTMLElement[]
  tileRects.value = children.map(el => el.getBoundingClientRect())
}

// 根据坐标找到目标方块
function findTarget(clientX: number, clientY: number): number | null {
  for (let i = 0; i < tileRects.value.length; i++) {
    const rect = tileRects.value[i]
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return i
    }
  }
  return null
}

// ========== 桌面端拖拽 ==========
function startDrag(e: MouseEvent, idx: number) {
  if (isCompleted.value) return
  
  draggingTile.value = idx
  startX.value = e.clientX
  startY.value = e.clientY
  dragX.value = 0
  dragY.value = 0
  
  nextTick(() => {
    cacheTileRects()
  })
  
  const onMove = (e: MouseEvent) => {
    if (draggingTile.value === null) return
    
    dragX.value = e.clientX - startX.value
    dragY.value = e.clientY - startY.value
    
    const target = findTarget(e.clientX, e.clientY)
    dropTarget.value = target !== draggingTile.value ? target : null
  }
  
  const onUp = (e: MouseEvent) => {
    const target = findTarget(e.clientX, e.clientY)
    if (target !== null && target !== draggingTile.value && draggingTile.value !== null) {
      swap(draggingTile.value, target)
    }
    endDrag()
  }
  
  const endDrag = () => {
    draggingTile.value = null
    dropTarget.value = null
    dragX.value = 0
    dragY.value = 0
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// ========== 移动端触摸拖拽 ==========
function startTouch(e: TouchEvent, idx: number) {
  if (isCompleted.value) return
  
  const touch = e.touches[0]
  draggingTile.value = idx
  startX.value = touch.clientX
  startY.value = touch.clientY
  dragX.value = 0
  dragY.value = 0
  
  nextTick(() => {
    cacheTileRects()
  })
  
  const onMove = (e: TouchEvent) => {
    if (draggingTile.value === null) return
    e.preventDefault()
    
    const touch = e.touches[0]
    dragX.value = touch.clientX - startX.value
    dragY.value = touch.clientY - startY.value
    
    const target = findTarget(touch.clientX, touch.clientY)
    dropTarget.value = target !== draggingTile.value ? target : null
  }
  
  const onEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0]
    const target = findTarget(touch.clientX, touch.clientY)
    if (target !== null && target !== draggingTile.value && draggingTile.value !== null) {
      swap(draggingTile.value, target)
    }
    endDrag()
  }
  
  const endDrag = () => {
    draggingTile.value = null
    dropTarget.value = null
    dragX.value = 0
    dragY.value = 0
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
  }
  
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onEnd)
}

// 交换两个位置
function swap(i: number, j: number) {
  const temp = tiles.value[i]
  tiles.value[i] = tiles.value[j]
  tiles.value[j] = temp
  
  // 交换后重新缓存位置
  nextTick(() => cacheTileRects())
  
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

function init() {
  tiles.value = Array.from({ length: totalTiles }, (_, i) => i)
  isCompleted.value = false
  draggingTile.value = null
  dropTarget.value = null
}

// 暴露给父组件的方法
defineExpose({
  isCompleted,
  shuffle,
  init
})

onMounted(() => {
  init()
  setTimeout(() => {
    cacheTileRects()
    shuffle(100)
  }, 500)
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
}

.puzzle-tile {
  aspect-ratio: 1;
  border-radius: 4px;
  cursor: grab;
  position: relative;
  transition: box-shadow 0.1s ease, opacity 0.1s ease;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  will-change: transform;
}

.puzzle-tile:active {
  cursor: grabbing;
}

.puzzle-tile.dragging {
  transition: none;
  box-shadow: 0 8px 25px rgba(0,0,0,0.35);
}

.puzzle-tile.drop-target {
  outline: 3px dashed #8b1e2b;
  outline-offset: -3px;
  opacity: 0.6;
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
