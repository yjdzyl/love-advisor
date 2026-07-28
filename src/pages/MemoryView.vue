<template>
  <div class="memory-view">
    <!-- 人物列表 -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">人物档案</h3>
        <button class="add-btn" @click="showAddPerson = true">+ 新建</button>
      </div>
      <div v-if="persons.length" class="person-list">
        <PersonCard
          v-for="p in persons"
          :key="p.id"
          :person="p"
          :relationship="getRel(p.id)"
          @select="selectPerson(p)"
        />
      </div>
      <div v-else class="empty-hint">还没有人物档案，点击「+ 新建」添加</div>
    </div>

    <!-- 选中人物的详情 -->
    <div v-if="selectedPerson" class="person-detail">
      <!-- 基本信息 -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">{{ selectedPerson.name }}</h3>
          <button class="del-btn" @click="deletePerson">删除</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>称呼</label>
            <input v-model="editForm.name" class="form-input" @change="updatePerson" />
          </div>
          <div class="form-group">
            <label>MBTI</label>
            <input v-model="editForm.mbti" class="form-input short" placeholder="INFJ" @change="updatePerson" />
          </div>
        </div>
        <div class="form-group">
          <label>关系状态</label>
          <div class="status-selector">
            <button
              v-for="s in statusOptions"
              :key="s.value"
              class="status-btn"
              :class="{ active: relStatus === s.value }"
              @click="setStatus(s.value)"
            >
              {{ s.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 事件时间线 -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">事件时间线</h3>
          <button class="add-btn" @click="showAddEvent = true">+ 添加</button>
        </div>
        <RelationshipTimeline :events="events" @delete="deleteEvent" />
      </div>

      <!-- 对话摘要 -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">对话摘要</h3>
          <button class="add-btn" :disabled="generatingSummary" @click="generateSummary">
            {{ generatingSummary ? '生成中...' : '生成摘要' }}
          </button>
        </div>
        <SummaryCard v-if="latestSummary" :summary="latestSummary" />
        <div v-else class="empty-hint">暂无摘要，点击「生成摘要」从最近的对话生成</div>
      </div>

      <!-- 聊天记录 -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">聊天记录</h3>
          <span class="msg-count">{{ messages.length }} 条</span>
        </div>
        <div v-if="messages.length" class="message-list">
          <div v-for="msg in messages.slice(-10)" :key="msg.id" class="msg-item">
            <span class="msg-role">{{ msg.role === 'user' ? '你' : msg.skillId }}</span>
            <span class="msg-preview">{{ msg.content.slice(0, 40) }}{{ msg.content.length > 40 ? '...' : '' }}</span>
          </div>
        </div>
        <div v-else class="empty-hint">暂无聊天记录</div>
      </div>
    </div>

    <!-- 添加人物对话框 -->
    <div v-if="showAddPerson" class="dialog-overlay" @click.self="showAddPerson = false">
      <div class="dialog">
        <h3 class="dialog-title">新建人物</h3>
        <input v-model="newPersonName" class="form-input" placeholder="输入称呼" @keydown.enter="confirmAddPerson" />
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="showAddPerson = false">取消</button>
          <button class="btn btn-primary" :disabled="!newPersonName.trim()" @click="confirmAddPerson">确认</button>
        </div>
      </div>
    </div>

    <!-- 添加事件对话框 -->
    <div v-if="showAddEvent" class="dialog-overlay" @click.self="showAddEvent = false">
      <div class="dialog">
        <h3 class="dialog-title">添加事件</h3>
        <div class="form-group">
          <label>日期</label>
          <input v-model="newEvent.date" class="form-input" type="date" />
        </div>
        <div class="form-group">
          <label>标题</label>
          <input v-model="newEvent.title" class="form-input" placeholder="发生了什么" />
        </div>
        <div class="form-group">
          <label>影响</label>
          <div class="emotion-selector">
            <button class="emotion-btn" :class="{ active: newEvent.emotion === 'positive' }" @click="newEvent.emotion = 'positive'">积极 👍</button>
            <button class="emotion-btn" :class="{ active: newEvent.emotion === 'neutral' }" @click="newEvent.emotion = 'neutral'">中性 ➖</button>
            <button class="emotion-btn" :class="{ active: newEvent.emotion === 'negative' }" @click="newEvent.emotion = 'negative'">消极 👎</button>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="showAddEvent = false">取消</button>
          <button class="btn btn-primary" :disabled="!newEvent.title" @click="confirmAddEvent">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PersonCard from '../components/PersonCard.vue'
import RelationshipTimeline from '../components/RelationshipTimeline.vue'
import SummaryCard from '../components/SummaryCard.vue'
import { personStore } from '../memory/stores/personStore.js'
import { relationshipStore } from '../memory/stores/relationshipStore.js'
import { eventStore } from '../memory/stores/eventStore.js'
import { messageStore } from '../memory/stores/messageStore.js'
import { summaryStore } from '../memory/stores/summariesStore.js'

const persons = ref([])
const selectedPerson = ref(null)
const relationships = ref({})
const events = ref([])
const messages = ref([])
const latestSummary = ref(null)
const showAddPerson = ref(false)
const newPersonName = ref('')
const showAddEvent = ref(false)
const newEvent = ref({ date: '', title: '', emotion: 'neutral' })
const editForm = ref({ name: '', mbti: '' })
const relStatus = ref('')
const generatingSummary = ref(false)

const statusOptions = [
  { value: 'stranger', label: '陌生' },
  { value: 'acquaintance', label: '认识' },
  { value: 'friend', label: '熟悉' },
  { value: 'crush', label: '暧昧' },
  { value: 'stable', label: '稳定' },
  { value: 'conflict', label: '冲突' },
  { value: 'distant', label: '疏远' }
]

onMounted(loadPersons)

function getRel(personId) {
  return relationships.value[personId] || null
}

async function loadPersons() {
  persons.value = await personStore.getAll()
  const rels = {}
  for (const p of persons.value) {
    const r = await relationshipStore.getByPerson(p.id)
    if (r) rels[p.id] = r
  }
  relationships.value = rels
}

async function selectPerson(person) {
  selectedPerson.value = person
  editForm.value = { name: person.name, mbti: person.mbti || '' }
  const rel = await relationshipStore.getByPerson(person.id)
  relStatus.value = rel?.status || ''
  events.value = await eventStore.getByPerson(person.id)
  const result = await messageStore.getByPerson(person.id, { page: 1, pageSize: 100 })
  messages.value = result.items || []
  latestSummary.value = await summaryStore.getLatest(person.id)
}

async function confirmAddPerson() {
  const name = newPersonName.value.trim()
  if (!name) return
  const id = await personStore.create({ name, mbti: '' })
  newPersonName.value = ''
  showAddPerson.value = false
  await loadPersons()
  const p = await personStore.get(id)
  if (p) selectPerson(p)
}

async function updatePerson() {
  if (!selectedPerson.value) return
  await personStore.update(selectedPerson.value.id, {
    name: editForm.value.name,
    mbti: editForm.value.mbti
  })
  selectedPerson.value.name = editForm.value.name
  await loadPersons()
}

async function setStatus(status) {
  if (!selectedPerson.value) return
  relStatus.value = status
  await relationshipStore.upsert(selectedPerson.value.id, { status })
  await loadPersons()
}

async function confirmAddEvent() {
  if (!newEvent.value.title || !selectedPerson.value) return
  await eventStore.create({
    personId: selectedPerson.value.id,
    date: newEvent.value.date || new Date().toISOString().slice(0, 10),
    title: newEvent.value.title,
    emotion: newEvent.value.emotion || 'neutral',
    type: 'manual'
  })
  newEvent.value = { date: '', title: '', emotion: 'neutral' }
  showAddEvent.value = false
  events.value = await eventStore.getByPerson(selectedPerson.value.id)
}

async function deleteEvent(id) {
  await eventStore.delete(id)
  events.value = await eventStore.getByPerson(selectedPerson.value.id)
}

async function deletePerson() {
  if (!selectedPerson.value || !confirm(`确定删除「${selectedPerson.value.name}」的所有数据？`)) return
  await personStore.delete(selectedPerson.value.id)
  selectedPerson.value = null
  await loadPersons()
}

async function generateSummary() {
  if (!selectedPerson.value || generatingSummary.value) return
  generatingSummary.value = true

  const result = await messageStore.getByPerson(selectedPerson.value.id, { page: 1, pageSize: 50 })
  const msgs = result.items || []
  const conversation = msgs.slice(-20).map(m =>
    `${m.role === 'user' ? '用户' : 'AI'}: ${m.content.slice(0, 100)}`
  ).join('\n')

  await summaryStore.create({
    personId: selectedPerson.value.id,
    type: 'manual',
    content: JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      problem: `与 ${selectedPerson.value.name} 的最近对话摘要`,
      facts: ['共 ' + msgs.length + ' 条消息记录'],
      conclusion: '摘要已生成',
      next: ['查看更多详情']
    })
  })

  latestSummary.value = await summaryStore.getLatest(selectedPerson.value.id)
  generatingSummary.value = false
}
</script>

<style scoped>
.memory-view {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}
.section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.section-title { font-size: 15px; font-weight: 600; color: var(--text); }
.add-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: #4a6fa5;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.del-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #e8d8d0;
  background: transparent;
  color: #c44d34;
  font-size: 12px;
  cursor: pointer;
}
.person-list { display: flex; flex-direction: column; gap: 8px; }
.form-row { display: flex; gap: 12px; }
.form-row .form-group { flex: 1; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; color: var(--text2); margin-bottom: 4px; font-weight: 500; }
.form-input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  font-size: 14px;
  outline: none;
}
.form-input.short { max-width: 120px; }
.form-input:focus { border-color: #8a8580; }
.status-selector { display: flex; flex-wrap: wrap; gap: 4px; }
.status-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.status-btn.active { background: #4a6fa5; color: #fff; border-color: #4a6fa5; }
.emotion-selector { display: flex; gap: 6px; }
.emotion-btn {
  flex: 1; padding: 6px; border-radius: 6px;
  border: 1px solid var(--border); background: transparent;
  color: var(--text2); font-size: 12px; cursor: pointer;
}
.emotion-btn.active { background: var(--surface2); border-color: var(--text3); }
.empty-hint { font-size: 13px; color: var(--text3); text-align: center; padding: 24px 0; }
.msg-count { font-size: 12px; color: var(--text3); }
.message-list { display: flex; flex-direction: column; gap: 4px; }
.msg-item {
  display: flex; gap: 8px; font-size: 13px; padding: 4px 0;
  border-bottom: 1px solid var(--border);
}
.msg-item:last-child { border-bottom: none; }
.msg-role { color: var(--text2); font-weight: 500; white-space: nowrap; min-width: 40px; }
.msg-preview { color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dialog-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 20px;
}
.dialog {
  background: var(--surface); border-radius: var(--radius);
  padding: 20px; width: 100%; max-width: 360px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.dialog-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text); }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.btn { padding: 8px 18px; border-radius: 6px; border: none; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-primary { background: #4a6fa5; color: #fff; }
.btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
