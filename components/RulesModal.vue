<template>
  <div v-if="show" class="modal-mask" @click.self="$emit('close')">
    <div class="modal">
      <h3 style="margin-top:0;color:#0f3d2e">📖 游戏规则</h3>

      <h4>🎖️ 粉丝等级</h4>
      <p class="subtle">
        根据你最近 50 道答题的准确率加权计算：<br>
        填空 40% / 单选 35% / 判断 25%<br>
        答题越多，等级越准确！
      </p>
      <ul class="subtle" style="padding-left:1.1rem">
        <li v-for="r in levels" :key="r.level"><b>{{ r.level }}</b> — {{ r.desc }}</li>
      </ul>

      <h4>🎮 休闲模式</h4>
      <p class="subtle">
        可选择特定分类刷题，适合查漏补缺<br>
        ✅ 支持断点续答，中途退出下次接着玩<br>
        ❌ 不记录战绩，不影响排名
      </p>

      <h4>⚔️ 冒险模式</h4>
      <p class="subtle">
        固定混合题库，挑战极限实力<br>
        ✅ 所有对局永久记录到「我的战绩」<br>
        ✅ 成绩自动参与「本周名人榜」排名
      </p>

      <h4>🏆 本周名人榜</h4>
      <p class="subtle">
        每周一 00:00 自动清零重计<br>
        排名优先级：分数更高 → 用时更短<br>
        登录后自动上传本周最高分参与排名
      </p>

      <h4>📊 计分规则</h4>
      <p class="subtle">
        每题 10 分，共 10 题，满分 100<br>
        仅答对得分，答错不倒扣
      </p>

      <h4>🔐 游客模式</h4>
      <p class="subtle">
        不登录也能完整答题<br>
        结算时可选择是否参与名人榜排名
      </p>

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
