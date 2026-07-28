<template>
  <div class="app" :class="`theme-${currentSkill?.id || 'default'}`">
    <header class="top-bar">
      <div class="top-bar-left">
        <span class="app-title">💞 Love Council</span>
        <span v-if="currentSkill" class="current-skill-badge" :style="{ background: currentSkill.color }">
          {{ currentSkill.icon }} {{ currentSkill.name }}
        </span>
      </div>
      <div class="top-bar-right">
        <button class="icon-btn" @click="currentPage = 'settings'" title="设置">⚙️</button>
      </div>
    </header>

    <main class="main-content">
      <Transition name="page" mode="out-in">
        <ChatView
          v-if="currentPage === 'chat'"
          :key="currentSkill?.id + '-chat'"
          :currentSkill="currentSkill"
          :skills="skills"
          @switch-skill="switchSkill"
        />
        <MemoryView v-else-if="currentPage === 'memory'" :key="'memory'" />
        <SettingsView v-else-if="currentPage === 'settings'" :key="'settings'" />
      </Transition>
    </main>

    <nav class="bottom-nav">
      <button
        v-for="s in skills"
        :key="s.id"
        class="skill-tab"
        :class="{ active: currentSkill?.id === s.id }"
        :style="currentSkill?.id === s.id ? { color: s.color, borderTopColor: s.color } : {}"
        @click="switchSkill(s.id)"
      >
        <span class="skill-icon">{{ s.icon }}</span>
        <span class="skill-name">{{ s.shortName }}</span>
      </button>
      <button
        class="skill-tab memory-tab"
        :class="{ active: currentPage === 'memory' }"
        @click="currentPage = 'memory'"
      >
        <span class="skill-icon">📋</span>
        <span class="skill-name">档案</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { skills } from './skills/index.js'
import ChatView from './pages/ChatView.vue'
import MemoryView from './pages/MemoryView.vue'
import SettingsView from './pages/SettingsView.vue'

const currentPage = ref('chat')
const currentSkillId = ref('goutoujunshi')

const currentSkill = computed(() =>
  skills.find(s => s.id === currentSkillId.value)
)

function switchSkill(id) {
  currentSkillId.value = id
  currentPage.value = 'chat'
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg: #f5f0eb;
  --surface: #ffffff;
  --surface2: #f0ece7;
  --surface3: #e8e3de;
  --text: #2c2c2c;
  --text2: #8a8580;
  --text3: #b0aba6;
  --border: #e0dbd6;
  --radius: 10px;
  --shadow: 0 1px 3px rgba(0,0,0,0.06);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --font: -apple-system, BlinkMacSystemFont, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
}

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  height: 100dvh;
}

#app { height: 100dvh; }

.app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg);
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.5px;
}

.current-skill-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 4px;
  color: #fff;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 6px 8px;
  color: var(--text2);
  transition: color 0.2s;
  border-radius: 6px;
}

.icon-btn:hover {
  color: var(--text);
  background: var(--surface2);
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bottom-nav {
  display: flex;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding-bottom: var(--safe-bottom);
  flex-shrink: 0;
  overflow-x: auto;
  box-shadow: 0 -1px 4px rgba(0,0,0,0.04);
}

.skill-tab {
  flex: 1;
  min-width: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px 6px;
  background: none;
  border: none;
  color: var(--text3);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
  position: relative;
}

.skill-tab::after {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  border-radius: 0 0 2px 2px;
  background: transparent;
  transition: background 0.2s;
}

.skill-tab.active {
  color: var(--text);
}

.skill-tab.active::after {
  background: currentColor;
}

.skill-icon { font-size: 20px; line-height: 1.3; }
.skill-name { white-space: nowrap; font-weight: 500; }

.memory-tab.active { color: #666; }
.memory-tab.active::after { background: #666; }

/* 页面切换动画 */
.page-enter-active, .page-leave-active {
  transition: all 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.page-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
