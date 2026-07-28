<template>
  <div class="summary-card">
    <div class="summary-header">
      <span class="summary-date">{{ summary.date }}</span>
      <span class="summary-type">{{ typeLabel }}</span>
    </div>
    <div class="summary-problem">{{ summary.problem }}</div>
    <div v-if="summary.facts?.length" class="summary-facts">
      <div v-for="(f, i) in summary.facts" :key="i" class="fact-item">• {{ f }}</div>
    </div>
    <div class="summary-conclusion">{{ summary.conclusion }}</div>
    <div v-if="summary.next?.length" class="summary-next">
      <div v-for="(n, i) in summary.next" :key="i" class="next-item">→ {{ n }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  summary: { type: Object, default: () => ({}) }
})

const typeLabel = computed(() => {
  const map = { daily: '日报', weekly: '周报', manual: '手动' }
  return map[props.summary.type] || props.summary.type || ''
})
</script>

<style scoped>
.summary-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  box-shadow: var(--shadow);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.summary-date { font-size: 11px; color: var(--text3); }
.summary-type { font-size: 11px; color: var(--text2); background: var(--surface2); padding: 1px 8px; border-radius: 4px; }

.summary-problem { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 8px; }

.summary-facts { margin-bottom: 8px; }
.fact-item { font-size: 13px; color: var(--text2); line-height: 1.6; padding-left: 4px; }

.summary-conclusion { font-size: 13px; color: var(--text); padding: 8px 10px; background: var(--surface2); border-radius: 6px; margin-bottom: 8px; }

.summary-next { }
.next-item { font-size: 13px; color: #4a6fa5; line-height: 1.8; }
</style>
