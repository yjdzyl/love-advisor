<template>
  <div class="timeline">
    <div v-for="event in events" :key="event.id" class="timeline-item">
      <div class="timeline-dot" :class="event.emotion"></div>
      <div class="timeline-content">
        <div class="timeline-date">{{ event.date }}</div>
        <div class="timeline-title">{{ event.title }}</div>
        <div v-if="event.description" class="timeline-desc">{{ event.description }}</div>
      </div>
      <button class="timeline-del" @click="$emit('delete', event.id)">×</button>
    </div>
    <div v-if="!events.length" class="timeline-empty">暂无事件记录</div>
  </div>
</template>

<script setup>
defineProps({
  events: { type: Array, default: () => [] }
})
defineEmits(['delete'])
</script>

<style scoped>
.timeline { position: relative; padding-left: 20px; }
.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  bottom: 4px;
  width: 1px;
  background: var(--border);
}

.timeline-item {
  position: relative;
  padding: 0 0 16px 12px;
  display: flex;
  gap: 8px;
}

.timeline-dot {
  position: absolute;
  left: -16px;
  top: 5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--text3);
  border: 2px solid var(--surface);
}

.timeline-dot.positive { background: #3a7a3a; }
.timeline-dot.negative { background: #c44d34; }
.timeline-dot.neutral { background: var(--text3); }

.timeline-content { flex: 1; }
.timeline-date { font-size: 11px; color: var(--text3); }
.timeline-title { font-size: 14px; font-weight: 500; color: var(--text); }
.timeline-desc { font-size: 12px; color: var(--text2); margin-top: 2px; }

.timeline-del {
  background: none;
  border: none;
  color: var(--text3);
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
  visibility: hidden;
}

.timeline-item:hover .timeline-del { visibility: visible; }
.timeline-empty { font-size: 13px; color: var(--text3); padding: 12px 0; text-align: center; }
</style>
