<template>
  <div v-if="show" class="modal-mask" @click.self="$emit('close')">
    <div class="modal">
      <h3 style="margin-top:0;color:#0f3d2e">📖 规则说明</h3>
      <h4>计分规则</h4>
      <p class="subtle">每题 10 分，共 10 题，满分 100。仅答对得分，答错不倒扣。</p>
      <h4>粉丝等级</h4>
      <ul class="subtle" style="padding-left:1.1rem">
        <li v-for="r in levels" :key="r.level"><b>{{ r.level }}</b>（{{ r.range }}）— {{ r.desc }}</li>
      </ul>
      <h4>周榜规则</h4>
      <p class="subtle">榜单每周一 00:00 重置；同一账号仅保留本周最高分记录，分数更高才更新，同分则用时更短者优先。</p>
      <h4>登录 & 权限</h4>
      <p class="subtle">未登录可自由刷题练手，但无法上传分数、无法上榜。</p>
      <div style="text-align:right;margin-top:1rem">
        <button class="btn" @click="$emit('close')">好，收下</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LEVEL_RULES } from '~/utils/level'
defineProps<{ show: boolean }>()
defineEmits<{ (e: 'close'): void }>()
const levels = LEVEL_RULES
</script>
