<template>
  <div class="puzzle-container" :class="{ completed: isCompleted }">
    <div class="puzzle-grid">
      <div
        v-for="(tile, idx) in tiles"
        :key="idx"
        class="puzzle-tile"
        :class="{
          selected: selectedTile === idx,
          'swap-hint': selectedTile !== null && selectedTile !== idx
        }"
        :style="tileStyle(tile)"
        @click="onClick(idx)"
        @touchstart.stop.prevent="onTouchStart($event, idx)"
        @touchend.stop.prevent="onTouchEnd(idx)"
      >
        <div class="tile-number">{{ tile + 1 }}</div>
      </div>
    </div>
    <div v-if="!isCompleted" class="puzzle-hint">
      🧩 <b>先点一块，再点另一块交换位置</b>！还剩 {{ shuffleCount }} 次重新打乱
      <button v-if="shuffleCount > 0" class="btn tiny" @click="shuffle">再打乱</button>
    </div>
    <div v-else class="puzzle-success">✅ 拼图完成！可以答题了</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

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

// 拼图状态：每个格子放的是原图片的位置索引（0-15）
const tiles = ref<number[]>([])
const shuffleCount = ref(3)
const isCompleted = ref(false)
const selectedTile = ref<number | null>(null)

// 初始化有序拼图
function init() {
  tiles.value = Array.from({ length: totalTiles }, (_, i) => i)
  isCompleted.value = false
  selectedTile.value = null
}

// 单个方块的样式（根据原始位置显示对应的图片部分）
function tileStyle(tileIdx: number) {
  const row = Math.floor(tileIdx / cols)
  const col = tileIdx % cols
  return {
    backgroundImage: `url(${props.imageUrl})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${col * 100 / (cols - 1)}% ${row * 100 / (rows - 1)}%`
  }
}

// 点击交换
function onClick(idx: number) {
  if (isCompleted.value) return
  
  // 第一次点击：选中
  if (selectedTile.value === null) {
    selectedTile.value = idx
    return
  }
  
  // 点击同一个：取消选中
  if (selectedTile.value === idx) {
    selectedTile.value = null
    return
  }
  
  // 点击另一个：交换
  swap(selectedTile.value, idx)
  selectedTile.value = null
}

// 触摸支持
function onTouchStart(e: TouchEvent, idx: number) {
  if (isCompleted.value) return
  // 先选中第一个
  if (selectedTile.value === null) {
    selectedTile.value = idx
  }
}

function onTouchEnd(idx: number) {
  if (isCompleted.value || selectedTile.value === null) return
  
  // 松开的是另一个，就交换
  if (selectedTile.value !== idx) {
    swap(selectedTile.value, idx)
  }
  selectedTile.value = null
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
function shuffle(steps = 50) {
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
  if (sorted) shuffle(10) // 如果还是有序，再打乱一次
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
    shuffle(80)
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
}

.puzzle-tile {
  aspect-ratio: 1;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.puzzle-tile:hover {
  transform: scale(1.02);
}

.puzzle-tile.selected {
  transform: scale(0.95);
  box-shadow: 0 0 0 3px #8b1e2b;
  z-index: 10;
}

.puzzle-tile.swap-hint:hover {
  box-shadow: 0 0 0 2px rgba(139, 30, 43, 0.5);
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
