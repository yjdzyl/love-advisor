<template>
  <div
    class="chat-bubble"
    :class="[role, { streaming }]"
  >
    <div v-if="role === 'assistant' && skillIcon" class="bubble-avatar">{{ skillIcon }}</div>
    <div class="bubble-content">
      <div v-if="role === 'assistant' && skillName" class="bubble-label">{{ skillName }}</div>
      <div class="bubble-text" v-html="renderedContent"></div>
      <div v-if="streaming && !content" class="streaming-dots">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  role: { type: String, default: 'user' },
  content: { type: String, default: '' },
  skillIcon: { type: String, default: '' },
  skillName: { type: String, default: '' },
  streaming: { type: Boolean, default: false }
})

const renderedContent = computed(() => {
  if (!props.content) return ''
  // 简单 Markdown 渲染：加粗、换行、代码块
  return props.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
})
</script>

<style scoped>
.chat-bubble {
  display: flex;
  gap: 8px;
  padding: 6px 16px;
  max-width: 100%;
}

.chat-bubble.user {
  flex-direction: row-reverse;
}

.bubble-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  background: var(--surface2);
  flex-shrink: 0;
  align-self: flex-end;
}

.bubble-content {
  max-width: 78%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  box-shadow: var(--shadow);
}

.user .bubble-content {
  background: #4a6fa5;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.assistant .bubble-content {
  background: var(--surface);
  color: var(--text);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--border);
}

.bubble-label {
  font-size: 11px;
  color: var(--text2);
  margin-bottom: 4px;
  font-weight: 500;
}

.bubble-text :deep(code) {
  background: var(--surface3);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 13px;
  color: #c44d34;
}

.streaming-dots {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text3);
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
