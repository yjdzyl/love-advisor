<template>
  <div class="chat-view">
    <div class="messages-area" ref="messagesRef">
      <TransitionGroup name="msg">
        <div v-if="!messages.length" key="welcome" class="welcome">
          <div class="welcome-icon">{{ currentSkill?.icon }}</div>
          <div class="welcome-title">{{ currentSkill?.name }}</div>
          <div class="welcome-desc">{{ currentSkill?.description }}</div>
          <div class="quick-questions">
            <button
              v-for="(q, i) in currentSkill?.quickQuestions"
              :key="i"
              class="quick-btn"
              @click="sendMessage(q)"
            >
              {{ q }}
            </button>
          </div>
        </div>

        <div v-for="(msg, i) in messages" :key="msg._key || i" class="msg-wrapper">
          <ChatBubble
            :role="msg.role"
            :content="msg.content"
            :skillIcon="msg.skillIcon"
            :skillName="msg.skillName"
            :streaming="msg.streaming"
          />
        </div>

        <div v-if="showSynthesis" :key="'synth'" class="synthesis-section">
          <div class="synth-label">📋 综合决策</div>
          <ChatBubble
            role="assistant"
            :content="synthesisText"
            skillIcon="⚖️"
            skillName="决策官"
            :streaming="synthStreaming"
          />
        </div>
      </TransitionGroup>
    </div>

    <RouteHint
      v-if="routeHint.length && !isStreaming"
      :recommended="routeHint"
      @select="switchToSkill"
    />

    <div class="input-area">
      <div class="mode-selector">
        <button
          v-for="mode in modes"
          :key="mode.value"
          class="mode-btn"
          :class="{ active: responseMode === mode.value }"
          @click="responseMode = mode.value"
        >
          {{ mode.label }}
        </button>
      </div>
      <div class="input-row">
        <input
          ref="inputRef"
          v-model="userInput"
          class="text-input"
          placeholder="输入你的问题..."
          @keydown.enter.prevent="sendMessage(userInput)"
          @input="onInputChange"
          :disabled="isStreaming"
        />
        <button
          class="send-btn"
          :disabled="!userInput.trim() || isStreaming"
          @click="sendMessage(userInput)"
        >
          {{ isStreaming ? '...' : '发送' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import ChatBubble from '../components/ChatBubble.vue'
import RouteHint from '../components/RouteHint.vue'
import { streamChat } from '../ai/api.js'
import { buildPrompt } from '../ai/promptBuilder.js'
import { getRecommendedSkills } from '../router/route.js'
import { messageStore } from '../memory/stores/messageStore.js'
import { skills } from '../skills/index.js'

const props = defineProps({
  currentSkill: { type: Object, default: null },
  skills: { type: Array, default: () => [] }
})

const emit = defineEmits(['switch-skill'])

const messages = ref([])
const userInput = ref('')
const isStreaming = ref(false)
const responseMode = ref('quick')
const routeHint = ref([])
const messagesRef = ref(null)
const inputRef = ref(null)

// Mode C 专用
const showSynthesis = ref(false)
const synthesisText = ref('')
const synthStreaming = ref(false)

const modes = [
  { value: 'quick', label: '快速' },
  { value: 'committee', label: '讨论' },
  { value: 'decision', label: '决策' }
]

let msgCounter = 0
function nextKey() { return ++msgCounter }

watch(() => props.currentSkill?.id, () => {
  loadMessages()
})

async function loadMessages() {
  try {
    const result = await messageStore.getAll({ page: 1, pageSize: 100 })
    messages.value = result.items.map(m => ({
      _key: nextKey(),
      role: m.role,
      content: m.content,
      skillIcon: props.skills.find(s => s.id === m.skillId)?.icon || '',
      skillName: props.skills.find(s => s.id === m.skillId)?.name || '',
      streaming: false
    }))
  } catch {
    messages.value = []
  }
  scrollToBottom()
}

function onInputChange() {
  if (userInput.value.trim().length > 2) {
    routeHint.value = getRecommendedSkills(userInput.value, responseMode.value)
  } else {
    routeHint.value = []
  }
}

async function sendMessage(text) {
  if (!text?.trim() || isStreaming.value || !props.currentSkill) return
  const content = text.trim()
  userInput.value = ''

  // 1. Router 分析
  const recommended = getRecommendedSkills(content, responseMode.value)
  routeHint.value = recommended

  // 2. 添加用户消息
  const userMsg = { _key: nextKey(), role: 'user', content, skillIcon: '', skillName: '', streaming: false }
  messages.value.push(userMsg)
  await messageStore.save({ role: 'user', content, skillId: props.currentSkill.id }).catch(() => {})

  // 3. 读取 API 配置
  const apiConfig = JSON.parse(localStorage.getItem('love-api-config') || '{}')
  if (!apiConfig.apiKey || (!apiConfig.baseURL && apiConfig.provider !== 'claude')) {
    messages.value.push({
      _key: nextKey(), role: 'assistant', content: '⚠️ 请先在设置页面配置 API。',
      skillIcon: '⚠️', skillName: '', streaming: false
    })
    return
  }

  if (responseMode.value === 'quick') {
    await sendQuick(content, apiConfig)
  } else if (responseMode.value === 'committee') {
    await sendCommittee(content, apiConfig, recommended)
  } else {
    await sendDecision(content, apiConfig)
  }
}

// ===== Mode A: 快速 =====
async function sendQuick(content, apiConfig) {
  isStreaming.value = true
  const aiMsg = {
    _key: nextKey(), role: 'assistant', content: '',
    skillIcon: props.currentSkill.icon, skillName: props.currentSkill.name, streaming: true
  }
  messages.value.push(aiMsg)
  scrollToBottom()

  const { messages: promptMessages, systemPrompt } = buildPrompt(props.currentSkill, null, content)

  let fullContent = ''
  await streamChat(
    { provider: apiConfig.provider, baseURL: apiConfig.baseURL, apiKey: apiConfig.apiKey, model: apiConfig.model },
    promptMessages, systemPrompt,
    {
      onChunk(c) { fullContent += c; aiMsg.content = fullContent; scrollToBottom() },
      onDone(t) { aiMsg.streaming = false; isStreaming.value = false; messageStore.save({ role: 'assistant', content: t, skillId: props.currentSkill.id }) },
      onError(e) { aiMsg.content = `❌ ${e.message}`; aiMsg.streaming = false; isStreaming.value = false }
    }
  )
}

// ===== Mode B: 委员会（2-3 个 Skill 并行调用）=====
async function sendCommittee(content, apiConfig, recommended) {
  isStreaming.value = true
  const targetSkills = recommended.slice(0, 3)
  const results = []

  // 为每个推荐 Skill 创建占位
  for (const r of targetSkills) {
    const skill = skills.find(s => s.id === r.skillId)
    if (!skill) continue
    const placeholder = {
      _key: nextKey(), role: 'assistant', content: '', streaming: true,
      skillIcon: skill.icon, skillName: skill.name
    }
    messages.value.push(placeholder)
    scrollToBottom()
    results.push({ skill, placeholder, fullText: '' })
  }

  // 并行调用所有 Skill
  await Promise.all(results.map(async ({ skill, placeholder }) => {
    const { messages: promptMessages, systemPrompt } = buildPrompt(skill, null, content)
    let fullText = ''
    await streamChat(
      { provider: apiConfig.provider, baseURL: apiConfig.baseURL, apiKey: apiConfig.apiKey, model: apiConfig.model },
      promptMessages, systemPrompt,
      {
        onChunk(c) { fullText += c; placeholder.content = fullText; scrollToBottom() },
        onDone() { placeholder.streaming = false },
        onError(e) { placeholder.content = `❌ ${e.message}`; placeholder.streaming = false }
      }
    )
    // 保存
    try { await messageStore.save({ role: 'assistant', content: fullText, skillId: skill.id }) } catch {}
  }))

  isStreaming.value = false
}

// ===== Mode C: 决策（5 个 Skill + 综合）=====
async function sendDecision(content, apiConfig) {
  isStreaming.value = true
  const allResponses = {}

  // 为每个 Skill 创建占位
  const placeholders = []
  for (const skill of skills) {
    const placeholder = {
      _key: nextKey(), role: 'assistant', content: '', streaming: true,
      skillIcon: skill.icon, skillName: skill.name
    }
    messages.value.push(placeholder)
    scrollToBottom()
    placeholders.push({ skill, placeholder, fullText: '' })
  }

  // 并行调用 5 个 Skill
  await Promise.all(placeholders.map(async ({ skill, placeholder }) => {
    const { messages: promptMessages, systemPrompt } = buildPrompt(skill, null, content)
    let fullText = ''
    await streamChat(
      { provider: apiConfig.provider, baseURL: apiConfig.baseURL, apiKey: apiConfig.apiKey, model: apiConfig.model },
      promptMessages, systemPrompt,
      {
        onChunk(c) { fullText += c; placeholder.content = fullText; scrollToBottom() },
        onDone() { placeholder.streaming = false },
        onError(e) { placeholder.content = `❌ ${e.message}`; placeholder.streaming = false }
      }
    )
    allResponses[skill.id] = fullText
    try { await messageStore.save({ role: 'assistant', content: fullText, skillId: skill.id }) } catch {}
  }))

  // ===== 综合决策 =====
  showSynthesis.value = true
  synthStreaming.value = true
  scrollToBottom()

  const decisionPrompt = buildDecisionPrompt(content, allResponses)
  let fullSynth = ''

  await streamChat(
    { provider: apiConfig.provider, baseURL: apiConfig.baseURL, apiKey: apiConfig.apiKey, model: apiConfig.model },
    [{ role: 'user', content: decisionPrompt }],
    null,
    {
      onChunk(c) { fullSynth += c; synthesisText.value = fullSynth; scrollToBottom() },
      onDone() { synthStreaming.value = false; isStreaming.value = false },
      onError(e) { synthesisText.value = `❌ 综合失败：${e.message}`; synthStreaming.value = false; isStreaming.value = false }
    }
  )
}

function buildDecisionPrompt(question, responses) {
  return `你是 Love Council 的决策官。请综合以下 5 位顾问的分析，给出最终建议。

【用户问题】
${question}

━━━━━━━━━━━━━━━━

${skills.map(s => `【${s.icon} ${s.name} - ${s.role}】
${responses[s.id] || '（未获取到分析）'}
`).join('\n')}

━━━━━━━━━━━━━━━━

请输出：
1. **核心问题诊断**：这个问题的本质是什么？
2. **各视角关键洞察**：每位顾问最重要的观点
3. **推荐行动方案**（分步骤）
4. **风险提示**
5. **一句话总结`
}

function switchToSkill(skillId) {
  emit('switch-skill', skillId)
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
  -webkit-overflow-scrolling: touch;
}

/* 消息动画 */
.msg-enter-active { transition: all 0.25s ease-out; }
.msg-enter-from { opacity: 0; transform: translateY(12px); }

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60%;
  padding: 40px 24px;
  text-align: center;
}

.welcome-icon { font-size: 44px; margin-bottom: 12px; }
.welcome-title { font-size: 20px; font-weight: 600; margin-bottom: 6px; color: var(--text); }
.welcome-desc { font-size: 13px; color: var(--text2); margin-bottom: 28px; line-height: 1.5; }

.quick-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 320px;
}

.quick-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  box-shadow: var(--shadow);
}

.quick-btn:hover {
  border-color: #b0aba6;
  background: var(--surface2);
}

.synthesis-section {
  padding: 8px 16px 0;
}

.synth-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  padding: 6px 12px;
  background: var(--surface2);
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 8px;
}

.input-area {
  flex-shrink: 0;
  padding: 8px 12px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.mode-selector {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.mode-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text2);
  font-size: 11px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;
}

.mode-btn.active {
  background: var(--surface2);
  color: var(--text);
  border-color: var(--text3);
}

.input-row {
  display: flex;
  gap: 8px;
}

.text-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.text-input:focus {
  border-color: #8a8580;
}

.text-input::placeholder { color: var(--text3); }

.send-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: #4a6fa5;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  letter-spacing: 0.5px;
}

.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
