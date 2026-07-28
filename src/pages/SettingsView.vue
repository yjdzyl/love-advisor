<template>
  <div class="settings-view">
    <div class="settings-section">
      <h3 class="section-title">🤖 API 配置</h3>
      <div class="form-group">
        <label>API 提供商</label>
        <div class="provider-selector">
          <button
            v-for="p in providers"
            :key="p.value"
            class="provider-btn"
            :class="{ active: form.provider === p.value }"
            @click="form.provider = p.value"
          >
            {{ p.label }}
          </button>
        </div>
      </div>
      <div class="form-group">
        <label>API Base URL</label>
        <input v-model="form.baseURL" class="form-input" :placeholder="baseURLPlaceholder" />
      </div>
      <div class="form-group">
        <label>API Key</label>
        <input v-model="form.apiKey" class="form-input" type="password" placeholder="输入你的 API Key" />
      </div>
      <div class="form-group">
        <label>模型名称</label>
        <input v-model="form.model" class="form-input" :placeholder="modelPlaceholder" />
      </div>
      <div class="presets">
        <button v-for="p in presets" :key="p.name" class="preset-btn" @click="applyPreset(p)">
          {{ p.name }}
        </button>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="saveConfig">保存</button>
        <button class="btn btn-secondary" @click="testConnection">测试连接</button>
      </div>
      <div v-if="testResult" class="test-result" :class="{ success: testSuccess }">
        {{ testResult }}
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">💾 数据管理</h3>
      <div class="form-actions">
        <button class="btn btn-secondary" @click="exportData">导出数据</button>
        <button class="btn btn-secondary" @click="importData">导入数据</button>
        <button class="btn btn-danger" @click="clearAll">清空所有对话</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { streamChat } from '../ai/api.js'

const form = ref({
  provider: 'openai',
  baseURL: '',
  apiKey: '',
  model: 'gpt-4o-mini'
})

const providers = [
  { value: 'openai', label: 'OpenAI 兼容' },
  { value: 'claude', label: 'Anthropic Claude' }
]

const presets = [
  { name: 'OpenAI', provider: 'openai', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { name: 'DeepSeek', provider: 'openai', baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { name: '商汤日日新', provider: 'openai', baseURL: 'https://api.sensenova.cn/v1', model: 'SenseChat-5' },
  { name: 'Claude Sonnet', provider: 'claude', baseURL: '', model: 'claude-3-5-sonnet-20241022' },
  { name: 'Claude Haiku', provider: 'claude', baseURL: '', model: 'claude-3-5-haiku-20241022' },
  { name: '智谱', provider: 'openai', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { name: '通义', provider: 'openai', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo' }
]

const baseURLPlaceholder = computed(() =>
  form.value.provider === 'claude' ? 'Claude 无需 Base URL' : 'https://api.openai.com/v1'
)

const modelPlaceholder = computed(() =>
  form.value.provider === 'claude' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o-mini'
)

const testResult = ref('')
const testSuccess = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('love-api-config')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      form.value.provider = parsed.provider || 'openai'
      form.value.baseURL = parsed.baseURL || ''
      form.value.apiKey = parsed.apiKey || ''
      form.value.model = parsed.model || 'gpt-4o-mini'
    } catch {}
  }
})

function applyPreset(preset) {
  form.value.provider = preset.provider || 'openai'
  form.value.baseURL = preset.baseURL || ''
  form.value.model = preset.model
}

function saveConfig() {
  localStorage.setItem('love-api-config', JSON.stringify({
    provider: form.value.provider,
    baseURL: form.value.baseURL,
    apiKey: form.value.apiKey,
    model: form.value.model
  }))
  testResult.value = '✅ 配置已保存'
  testSuccess.value = true
  setTimeout(() => { testResult.value = '' }, 2000)
}

async function testConnection() {
  if (!form.value.baseURL || !form.value.apiKey) {
    testResult.value = '⚠️ 请先填写 Base URL 和 API Key'
    testSuccess.value = false
    return
  }

  testResult.value = '⏳ 测试中...'
  try {
    await streamChat(
      {
        provider: form.value.provider,
        baseURL: form.value.baseURL,
        apiKey: form.value.apiKey,
        model: form.value.model
      },
      [{ role: 'user', content: 'hi' }],
      null,
      {
        onChunk() {},
        onDone() {
          testResult.value = '✅ 连接成功！'
          testSuccess.value = true
          setTimeout(() => { testResult.value = '' }, 3000)
        },
        onError(err) {
          testResult.value = `❌ 连接失败：${err.message}`
          testSuccess.value = false
        }
      }
    )
  } catch (err) {
    testResult.value = `❌ 连接失败：${err.message}`
    testSuccess.value = false
  }
}

async function exportData() {
  // 简单导出：下载 localStorage 中的配置
  const data = localStorage.getItem('love-api-config') || '{}'
  const blob = new Blob([JSON.stringify({ config: JSON.parse(data) }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `love-council-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  testResult.value = '✅ 数据已导出'
  testSuccess.value = true
  setTimeout(() => { testResult.value = '' }, 2000)
}

async function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.config) {
        localStorage.setItem('love-api-config', JSON.stringify(data.config))
        const parsed = data.config
        form.value.baseURL = parsed.baseURL || ''
        form.value.apiKey = parsed.apiKey || ''
        form.value.model = parsed.model || ''
        testResult.value = '✅ 数据导入成功'
        testSuccess.value = true
      }
    } catch {
      testResult.value = '❌ 文件格式错误'
      testSuccess.value = false
    }
  }
  input.click()
}

async function clearAll() {
  if (!confirm('确定清空所有对话记录吗？此操作不可撤销。')) return
  try {
    const db = (await import('../memory/db.js')).default
    await db.messages.clear()
    testResult.value = '✅ 已清空'
    testSuccess.value = true
  } catch {
    testResult.value = '❌ 清空失败'
    testSuccess.value = false
  }
}
</script>

<style scoped>
.settings-view {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

.settings-section {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: var(--text2);
  margin-bottom: 5px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 9px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #8a8580;
}

.presets {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.provider-selector {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
  background: var(--surface2);
  border-radius: 6px;
  padding: 3px;
}

.provider-btn {
  flex: 1;
  padding: 7px 12px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}

.provider-btn.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}

.preset-btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}

.preset-btn:hover {
  background: var(--surface3);
  color: var(--text);
}

.form-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 18px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary {
  background: #4a6fa5;
  color: #fff;
}

.btn-secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-danger {
  background: #f5f0eb;
  color: #c44d34;
  border: 1px solid #e8d8d0;
}

.test-result {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  background: #fdf0ee;
  color: #c44d34;
}

.test-result.success {
  background: #eef6ee;
  color: #3a7a3a;
}
</style>
