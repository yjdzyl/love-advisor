<template>
  <div v-if="recommended.length" class="route-hint">
    <span class="route-label">💡 推荐：</span>
    <button
      v-for="r in recommended"
      :key="r.skillId"
      class="route-chip"
      :style="{ color: getSkill(r.skillId)?.color }"
      @click="$emit('select', r.skillId)"
    >
      {{ getSkill(r.skillId)?.icon }} {{ getSkill(r.skillId)?.name }}
    </button>
    <span v-if="recommended.length > 1" class="route-score">共 {{ recommended.length }} 位专家</span>
  </div>
</template>

<script setup>
import { skills } from '../skills/index.js'

const props = defineProps({
  recommended: { type: Array, default: () => [] }
})

defineEmits(['select'])

function getSkill(id) {
  return skills.find(s => s.id === id)
}
</script>

<style scoped>
.route-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}

.route-label {
  font-size: 12px;
  color: var(--text2);
  font-weight: 500;
}

.route-chip {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface2);
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}

.route-chip:hover {
  background: var(--surface3);
}

.route-score {
  font-size: 11px;
  color: var(--text2);
  margin-left: auto;
}
</style>
