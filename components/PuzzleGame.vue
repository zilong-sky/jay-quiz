<template>
  <div class="puzzle-container" :class="{ completed: isCompleted }">
    <div class="puzzle-grid">
      <div
        v-for="(tile, idx) in tiles"
        :key="idx"
        class="puzzle-tile"
        :class="{
          empty: tile === null,
          moving: movingTile === idx,
          'drop-hint': isAdjacent(idx, emptyIndex)
        }"
        :style="tileStyle(tile)"
        @touchstart.stop.prevent="onTouchStart($event, idx)"
        @touchmove.stop.prevent="onTouchMove($event, idx)"
        @touchend.stop.prevent="onTouchEnd"
        @mousedown.stop.prevent="onMouseDown($event, idx)"
      >
        <div v-if="tile !== null" class="tile-number">{{ tile + 1 }}</div>
      </div>
    </div>
    <div v-if="!isCompleted" class="puzzle-hint">
      🧩 滑动方块到空位完成拼图！还剩 {{ shuffleCount }} 次重新打乱
      <button v-if="shuffleCount > 0" class="btn tiny" @click="shuffle">再打乱</button>
    </div>
    <div v-else class="puzzle-success">✅ 拼图完成！可以答题了</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

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

// 拼图状态：null 表示空位
const tiles = ref<(number | null)[]>([])
const shuffleCount = ref(3)
const isCompleted = ref(false)

// 滑动状态
const selectedTile = ref<number | null>(null)
const movingTile = ref<number | null>(null)
const startPos = ref<{ x: number; y: number } | null>(null)

// 获取空位位置
const emptyIndex = computed(() => tiles.value.findIndex(t => t === null))

// 初始化有序拼图
function init() {
  tiles.value = Array.from({ length: totalTiles }, (_, i) => i)
  tiles.value[totalTiles - 1] = null // 最后一个位置为空
  isCompleted.value = false
}

// 单个方块的样式
function tileStyle(tile: number | null) {
  if (tile === null) return {}
  const row = Math.floor(tile / cols)
  const col = tile % cols
  return {
    backgroundImage: `url(${props.imageUrl})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${col * 100 / (cols - 1)}% ${row * 100 / (rows - 1)}%`
  }
}

// 检查是否相邻
function isAdjacent(idx: number, emptyIdx: number) {
  if (emptyIdx === -1 || idx === -1 || tiles.value[idx] === null) return false
  const idxRow = Math.floor(idx / cols)
  const idxCol = idx % cols
  const emptyRow = Math.floor(emptyIdx / cols)
  const emptyCol = emptyIdx % cols
  
  // 上下左右相邻
  const rowDiff = Math.abs(idxRow - emptyRow)
  const colDiff = Math.abs(idxCol - emptyCol)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
}

// 检查滑动方向是否正确
function checkDirection(tileIdx: number, dx: number, dy: number): boolean {
  const empty = emptyIndex.value
  if (!isAdjacent(tileIdx, empty)) return false
  
  const tileRow = Math.floor(tileIdx / cols)
  const tileCol = tileIdx % cols
  const emptyRow = Math.floor(empty / cols)
  const emptyCol = empty % cols
  
  const threshold = 15 // 滑动阈值，像素
  
  // 空位在上方，需要向上滑
  if (emptyRow < tileRow && dy < -threshold) return true
  // 空位在下方，需要向下滑
  if (emptyRow > tileRow && dy > threshold) return true
  // 空位在左边，需要向左滑
  if (emptyCol < tileCol && dx < -threshold) return true
  // 空位在右边，需要向右滑
  if (emptyCol > tileCol && dx > threshold) return true
  
  return false
}

// 执行移动
function doMove(tileIdx: number) {
  const empty = emptyIndex.value
  if (!isAdjacent(tileIdx, empty)) return
  
  movingTile.value = tileIdx
  
  setTimeout(() => {
    tiles.value[empty] = tiles.value[tileIdx]
    tiles.value[tileIdx] = null
    movingTile.value = null
    checkComplete()
  }, 100)
}

// ========== 移动端触摸 ==========
function onTouchStart(e: TouchEvent, idx: number) {
  if (tiles.value[idx] === null) return
  
  const touch = e.touches[0]
  startPos.value = { x: touch.clientX, y: touch.clientY }
  selectedTile.value = idx
}

function onTouchMove(e: TouchEvent, idx: number) {
  if (selectedTile.value === null || !startPos.value) return
  
  const touch = e.touches[0]
  const dx = touch.clientX - startPos.value.x
  const dy = touch.clientY - startPos.value.y
  
  // 检查方向是否正确，达到阈值就移动
  if (checkDirection(selectedTile.value, dx, dy)) {
    doMove(selectedTile.value)
    selectedTile.value = null
    startPos.value = null
  }
}

function onTouchEnd() {
  selectedTile.value = null
  startPos.value = null
}

// ========== 桌面端鼠标 ==========
function onMouseDown(e: MouseEvent, idx: number) {
  if (tiles.value[idx] === null) return
  
  startPos.value = { x: e.clientX, y: e.clientY }
  selectedTile.value = idx
  
  const onMouseMove = (e: MouseEvent) => {
    if (selectedTile.value === null || !startPos.value) return
    const dx = e.clientX - startPos.value.x
    const dy = e.clientY - startPos.value.y
    
    if (checkDirection(selectedTile.value, dx, dy)) {
      doMove(selectedTile.value)
      cleanup()
    }
  }
  
  const onMouseUp = () => {
    cleanup()
  }
  
  const cleanup = () => {
    selectedTile.value = null
    startPos.value = null
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 检查拼图是否完成
function checkComplete() {
  for (let i = 0; i < totalTiles - 1; i++) {
    if (tiles.value[i] !== i) return false
  }
  if (tiles.value[totalTiles - 1] !== null) return false
  
  isCompleted.value = true
  emit('complete')
  return true
}

// 打乱拼图（通过随机移动实现，保证有解）
function shuffle(steps = 100) {
  if (shuffleCount.value <= 0) return
  shuffleCount.value--
  
  let lastIdx = -1
  for (let i = 0; i < steps; i++) {
    const empty = emptyIndex.value
    const emptyRow = Math.floor(empty / cols)
    const emptyCol = empty % cols
    
    // 找出所有可移动的相邻位置
    const adjacent = []
    if (emptyRow > 0) adjacent.push(empty - cols) // 上
    if (emptyRow < rows - 1) adjacent.push(empty + cols) // 下
    if (emptyCol > 0) adjacent.push(empty - 1) // 左
    if (emptyCol < cols - 1) adjacent.push(empty + 1) // 右
    
    // 随机选一个（排除刚移动过来的，避免来回跳）
    let candidates = adjacent.filter(idx => idx !== lastIdx)
    if (candidates.length === 0) candidates = adjacent
    
    const randomIdx = candidates[Math.floor(Math.random() * candidates.length)]
    lastIdx = empty
    
    // 移动
    tiles.value[empty] = tiles.value[randomIdx]
    tiles.value[randomIdx] = null
  }
  
  isCompleted.value = false
}

// 暴露给父组件的方法
defineExpose({
  isCompleted,
  shuffle,
  init
})

onMounted(() => {
  init()
  // 延迟一会儿再打乱，让用户先看一眼原图
  setTimeout(() => {
    shuffle(120)
  }, 1200)
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
  touch-action: none;
}

.puzzle-tile {
  aspect-ratio: 1;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: transform 0.1s ease-out, opacity 0.1s ease;
  background: #eee;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.puzzle-tile:active {
  transform: scale(0.98);
}

.puzzle-tile.empty {
  background: rgba(0,0,0,0.05);
  cursor: default;
}

.puzzle-tile.moving {
  opacity: 0.8;
  transition: none;
}

.puzzle-tile.drop-hint {
  cursor: grab;
}

.puzzle-tile.drop-hint:active {
  cursor: grabbing;
}

.tile-number {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  color: rgba(255,255,255,0.7);
  text-shadow: 0 0 2px rgba(0,0,0,0.5);
  pointer-events: none;
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
