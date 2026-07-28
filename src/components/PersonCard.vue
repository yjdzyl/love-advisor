<template>
  <div class="person-card" @click="$emit('select', person)">
    <div class="card-avatar">{{ person.name?.charAt(0) || '?' }}</div>
    <div class="card-info">
      <div class="card-name">{{ person.name }}</div>
      <div v-if="relationship" class="card-status" :class="relationship.status">
        {{ statusLabel }} <span v-if="trend" class="trend">{{ trend }}</span>
      </div>
    </div>
    <div class="card-arrow">›</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  person: { type: Object, default: null },
  relationship: { type: Object, default: null },
  trend: { type: String, default: '' }
})

defineEmits(['select'])

const statusLabel = computed(() => {
  const map = {
    stranger: '陌生', acquaintance: '认识', friend: '熟悉',
    crush: '暧昧', stable: '稳定', conflict: '冲突', distant: '疏远'
  }
  return map[props.relationship?.status] || props.relationship?.status || ''
})
</script>

<style scoped>
.person-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: var(--shadow);
}

.person-card:hover { border-color: #b0aba6; }

.card-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--surface3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
}

.card-info { flex: 1; min-width: 0; }
.card-name { font-size: 15px; font-weight: 600; color: var(--text); }
.card-status { font-size: 12px; color: var(--text2); margin-top: 2px; }
.trend { margin-left: 4px; }

.card-arrow { font-size: 20px; color: var(--text3); }
</style>
