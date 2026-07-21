<template>
  <div class="puzzle-container" :class="{ completed: isCompleted }">
    <div class="puzzle-grid">
      <div
        v-for="(tile, idx) in tiles"
        :key="idx"
        class="puzzle-tile"
        :class="{
          empty: tile === null,
          dragging: draggingTile === idx,
          'drop-target': dropTarget === idx && isAdjacent(idx, emptyIndex)
        }"
        :style="tileStyle(tile)"
        @click="moveTile(idx)"
        draggable="true"
        @dragstart="onDragStart($event, idx)"
        @dragover.prevent="onDragOver($event, idx)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, idx)"
        @dragend="onDragEnd"
      >
        <div v-if="tile !== null" class="tile-number">{{ tile + 1 }}</div>
      </div>
    </div>
    <div v-if="!isCompleted" class="puzzle-hint">
      🧩 拖动方块完成拼图！还剩 {{ shuffleCount }} 次重新打乱
      <button v-if="shuffleCount > 0" class="btn tiny" @click="shuffle">再打乱</button>
    </div>
    <div v-else class="puzzle-success">✅ 拼图完成！可以答题了</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

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

// 拖拽状态
const draggingTile = ref<number | null>(null)
const dropTarget = ref<number | null>(null)

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
  if (emptyIdx === -1) return false
  const idxRow = Math.floor(idx / cols)
  const idxCol = idx % cols
  const emptyRow = Math.floor(emptyIdx / cols)
  const emptyCol = emptyIdx % cols
  
  // 上下左右相邻
  const rowDiff = Math.abs(idxRow - emptyRow)
  const colDiff = Math.abs(idxCol - emptyCol)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
}

// 移动方块
function moveTile(idx: number) {
  if (isCompleted.value || tiles.value[idx] === null) return
  
  const empty = emptyIndex.value
  if (!isAdjacent(idx, empty)) return
  
  // 交换位置
  tiles.value[empty] = tiles.value[idx]
  tiles.value[idx] = null
  
  // 检查是否完成
  checkComplete()
}

// 开始拖拽
function onDragStart(e: DragEvent, idx: number) {
  if (tiles.value[idx] === null) {
    e.preventDefault()
    return
  }
  draggingTile.value = idx
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }
}

// 拖拽经过
function onDragOver(e: DragEvent, idx: number) {
  if (draggingTile.value === null) return
  // 只能拖到空位，且必须相邻
  if (tiles.value[idx] === null && isAdjacent(draggingTile.value, idx)) {
    e.preventDefault()
    dropTarget.value = idx
  }
}

// 离开目标
function onDragLeave() {
  dropTarget.value = null
}

// 放下
function onDrop(e: DragEvent, idx: number) {
  e.preventDefault()
  if (draggingTile.value === null) return
  
  // 只能放到空位，且必须相邻
  if (tiles.value[idx] === null && isAdjacent(draggingTile.value, idx)) {
    // 交换位置
    tiles.value[idx] = tiles.value[draggingTile.value]
    tiles.value[draggingTile.value] = null
    checkComplete()
  }
  
  dropTarget.value = null
}

// 拖拽结束
function onDragEnd() {
  draggingTile.value = null
  dropTarget.value = null
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
function shuffle(steps = 80) {
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
    shuffle(100)
  }, 1200)
})
</script>

<style scoped>
.puzzle-container {
  margin: 1rem 0;
  text-align: center;
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
  transition: transform 0.15s ease, filter 0.15s ease;
  background: #eee;
}

.puzzle-tile:hover {
  transform: scale(1.02);
}

.puzzle-tile.empty {
  background: rgba(0,0,0,0.05);
  cursor: default;
}

.puzzle-tile.dragging {
  opacity: 0.5;
  cursor: grabbing;
  transform: scale(0.95);
}

.puzzle-tile.drop-target {
  outline: 2px dashed #8b1e2b;
  outline-offset: 2px;
  background: rgba(139, 30, 43, 0.1);
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
