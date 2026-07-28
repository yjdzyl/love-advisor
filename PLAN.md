# Love Council AI — 最终实现方案

> 版本：v2.0 最终版
> 日期：2026-07-28
> 定位：个人长期使用的 AI 关系助手

---

## 一、产品定义

### 1.1 一句话

> **Vue3 本地 Web App + IndexedDB 私有记忆 + 规则评分路由 + 五人格专家系统 + 可选综合决策**

### 1.2 是/不是

| ❌ 不是 | ✅ 是 |
|--------|------|
| 恋爱聊天机器人 | 个人关系决策辅助系统 |
| ChatGPT 套壳 | 有记忆的私人 AI 顾问 |
| 一次性工具 | 长期了解你关系历史的助手 |
| 多用户 SaaS | 单人使用的本地 App |

### 1.3 核心价值

同一个问题，5 个专家从不同角度分析，系统记住你的关系历史，越用越懂你。

---

## 二、最终架构

```
                      手机浏览器
                          │
                Vue3 SPA (Vite 构建)
                          │
            ┌─────────────┼─────────────┐
            │             │             │
        AI Engine    Router Lite   Memory Engine
            │             │             │
            │        规则评分引擎    IndexedDB
            │        (route.js)     (6 张表)
            │             │
      Skill Manager  ────┘
            │
    skills/*.json
    (5 个 Skill)
            │
    Response Controller
    ┌───────┼───────┐
    │       │       │
  模式A   模式B   模式C
 (快速)  (委员会) (决策)
            │
        用户输出
```

### 2.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3 + Vite | SPA，组件化开发 |
| 存储 | IndexedDB (Dexie.js) | 聊天/事件/关系结构化数据 |
| 配置 | localStorage | API 配置等简单键值对 |
| API | OpenAI 兼容接口 | 用户自行配置 Base URL + Key + Model |
| 安全 | Web Crypto API | AES-GCM 加密 API Key |
| 部署 | 静态文件托管 | GitHub Pages / Netlify |

---

## 三、完整目录结构

```
love-advisor/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js
│   ├── App.vue
│   │
│   ├── ai/                       ← Module 1: AI Engine
│   │   ├── api.js                ← fetch + SSE 流式调用
│   │   ├── promptBuilder.js      ← 拼接 system prompt + 记忆 + 上下文
│   │   └── stream.js             ← SSE 解析器
│   │
│   ├── router/                   ← Module 2: Router Lite
│   │   ├── route.js              ← 路由引擎（评分 → 排序 → 选 Top N）
│   │   └── rules.js              ← 17 条路由规则（关键词 → Skill → 分数）
│   │
│   ├── skills/                   ← Module 3: Skill Manager
│   │   ├── index.js              ← 加载所有 skill JSON
│   │   ├── goutoujunshi.json     ← 狗头军师
│   │   ├── fangongzi.json        ← 梵公子
│   │   ├── tongjincheng.json     ← 童锦程
│   │   ├── nuwa.json             ← 女娲
│   │   └── colleague.json        ← 同事
│   │
│   ├── memory/                   ← Module 4: Memory Engine
│   │   ├── db.js                 ← Dexie 初始化 + Schema
│   │   ├── stores/
│   │   │   ├── personStore.js        ← 人物 CRUD
│   │   │   ├── relationshipStore.js  ← 关系状态 CRUD
│   │   │   ├── eventStore.js         ← 事件 CRUD
│   │   │   ├── messageStore.js       ← 消息 CRUD + 分页查询
│   │   │   ├── summaryStore.js       ← 摘要 CRUD
│   │   │   └── settingsStore.js      ← 设置 CRUD
│   │   └── backup.js             ← 导出/导入（JSON）
│   │
│   ├── response/                 ← Module 5: Response Controller
│   │   └── controller.js         ← 3 种模式分发
│   │
│   ├── crypto/                   ← Module 6: Crypto
│   │   └── encrypt.js            ← Web Crypto API (AES-GCM + PBKDF2)
│   │
│   ├── pages/                    ← Module 7: Pages
│   │   ├── ChatView.vue          ← 聊天主页
│   │   ├── MemoryView.vue        ← 关系档案页
│   │   └── SettingsView.vue      ← API 配置页
│   │
│   └── components/               ← Module 8: Components
│       ├── SkillTab.vue              ← 底部 Skill 切换 Tab
│       ├── ChatBubble.vue            ← 聊天气泡
│       ├── RouteHint.vue             ← Skill 推荐提示条
│       ├── PersonCard.vue            ← 人物卡片
│       ├── RelationshipTimeline.vue  ← 关系时间线
│       ├── SummaryCard.vue           ← 摘要卡片
│       └── ApiConfigForm.vue         ← API 配置表单
│
└── public/
    └── manifest.json             ← PWA 配置
```

---

## 四、8 个核心模块详细设计

### Module 1: AI Engine (`src/ai/`)

**职责**：调用大模型 API，拼接 Prompt，处理流式输出。

#### `api.js`
```javascript
// 核心函数
async function callChatAPI(messages, options)
// messages: [{role, content}]
// options: { model, temperature, stream: true }
// 返回: SSE 流式响应

async function encryptAndCall(apiConfig, messages)
// 1. 解密 API Key (从 encrypt.js)
// 2. 构建 fetch 请求
// 3. 返回 ReadableStream
```

**支持参数**：
- `model`: 模型名称（用户配置）
- `temperature`: 默认 0.7
- `max_tokens`: 默认 4096
- `stream`: 默认 true

#### `stream.js`
```javascript
// SSE 解析器
async function parseSSEStream(response, onChunk, onDone, onError)
// onChunk(text): 每收到一段文本回调
// onDone(fullText): 流结束回调
// onError(err): 错误回调

// 支持两种格式：
// 1. OpenAI 标准: data: {"choices":[{"delta":{"content":"text"}}]}
// 2. 兼容格式: data: {...}\n\n
```

#### `promptBuilder.js`
```javascript
// 构建最终请求 messages
function buildPrompt(skill, relationshipContext, userMessage)
// skill: 当前 Skill JSON 对象
// relationshipContext: {
//   personName, status, recentEvents, lastSummary
// }
// userMessage: 用户输入

// 返回 messages 数组：
// [
//   { role: "system", content: skill.systemPrompt },
//   { role: "system", content: buildMemoryContext(relationshipContext) },
//   { role: "user", content: userMessage }
// ]

function buildMemoryContext(context)
// 构建记忆上下文字符串：
// "【关系背景】当前对象: {name}, 关系状态: {status}
//  最近事件: {events}
//  对话摘要: {summary}"
```

---

### Module 2: Router Lite (`src/router/`)

**职责**：根据用户输入的关键词，自动推荐最合适的 Skill。

#### `rules.js` — 17 条路由规则

| # | 关键词 | 匹配 Skill | 分数 | 说明 |
|---|--------|-----------|------|------|
| 1 | 策略/博弈/套路/算计/分析 | 狗头军师 | 3 | 策略分析类问题 |
| 2 | 怎么回/回复/话术/怎么说 | 狗头军师 | 2 | 话术编排 |
| 3 | 生气/愤怒/暴躁/发火/吵架 | 梵公子 | 3 | 情绪冲突 |
| 4 | 情绪/心情/烦躁/焦虑/难过 | 梵公子 | 2 | 情绪疏导 |
| 5 | 沟通/表达/说话/聊天/交流 | 梵公子 | 2 | 沟通技巧 |
| 6 | 同事/领导/职场/工作/老板 | 同事 | 3 | 职场关系 |
| 7 | 开会/汇报/邮件/方案/项目 | 同事 | 2 | 职场事务 |
| 8 | 暧昧/喜欢/暗恋/表白/心动 | 女娲 | 3 | 初期关系 |
| 9 | 约会/牵手/接吻/亲密/进展 | 女娲 | 2 | 关系推进 |
| 10 | 分手/复合/挽回/冷战/断联 | 女娲 | 2 | 关系危机 |
| 11 | 婚姻/结婚/离婚/家庭/父母 | 女娲 | 2 | 长期关系 |
| 12 | 决策/选择/纠结/犹豫/迷茫 | 童锦程 | 3 | 决策困难 |
| 13 | 利弊/风险/后果/影响/权衡 | 童锦程 | 2 | 风险评估 |
| 14 | 建议/推荐/方案/计划/行动 | 童锦程 | 2 | 行动建议 |
| 15 | 回忆/总结/回顾/梳理/复盘 | 女娲 | 1 | 回顾分析 |
| 16 | 安慰/鼓励/支持/陪伴/安慰 | 梵公子 | 1 | 情感支持 |
| 17 | 默认 | 狗头军师 | 1 | 兜底规则 |

#### `route.js` — 评分引擎

```javascript
function routeMessage(message) {
  // 1. 对每条规则计算匹配分数
  const scores = {};
  for (const rule of RULES) {
    for (const keyword of rule.keywords) {
      if (message.includes(keyword)) {
        scores[rule.skill] = (scores[rule.skill] || 0) + rule.score;
      }
    }
  }

  // 2. 无匹配时走默认规则
  if (Object.keys(scores).length === 0) {
    return [{ skillId: "goutoujunshi", score: 1 }];
  }

  // 3. 按分数降序排列
  const sorted = Object.entries(scores)
    .map(([skill, score]) => ({ skillId: skill, score }))
    .sort((a, b) => b.score - a.score);

  return sorted;
}

// 根据模式选择 Top N
function getRecommendedSkills(message, mode) {
  const ranked = routeMessage(message);
  switch (mode) {
    case "quick":    return ranked.slice(0, 1);   // Mode A: Top 1
    case "committee": return ranked.slice(0, 3);   // Mode B: Top 3
    case "decision":  return ranked;                 // Mode C: All
  }
}
```

---

### Module 3: Skill Manager (`src/skills/`)

**职责**：管理 5 个 Skill JSON 的定义，提供统一的加载接口。

#### Skill JSON Schema

```json
{
  "id": "goutoujunshi",
  "name": "狗头军师",
  "icon": "🐶",
  "color": "#4A90D9",
  "description": "温暖学术的恋爱军师，重证据、重安全边界",
  "role": "策略顾问",
  "tone": "温暖、清醒、站在用户一边",
  "perspective": "从博弈论和人性角度分析，先接住情绪再给建议",
  "systemPrompt": "你是一个精通人性的策略顾问...（完整 system prompt）",
  "keywords": ["策略", "博弈", "套路", "分析", "怎么办"],
  "quickQuestions": [
    "这句话怎么回？",
    "帮我分析这段关系",
    "她最近冷淡了怎么办"
  ],
  "weight": 1.0
}
```

#### SKILL.md → JSON 映射表

| SKILL.md 内容 | JSON 字段 | 说明 |
|-------------|-----------|------|
| `--- name / description ---` | `id`, `name`, `description` | 元数据 |
| 身份卡/角色介绍 | `role`, `tone`, `perspective` | 角色定位 |
| 核心原则/心智模型 | `models[]` | 每条含 `name` + `oneLiner` |
| 决策启发式 | `heuristics[]` | 简洁的决策规则列表 |
| 表达DNA/风格 | `voice.tone` | 语言风格描述 |
| 安全边界 | `safety[]` | 禁止项列表 |
| 回答工作流 | `workflow[]` | Step 列表 |
| 快捷问题 | `quickQuestions[]` | 预设问题 |

#### Skill 文件格式选择：`.json` 而非 `.md`

**为什么不用 `.md`？**
- 浏览器无法直接 require/import `.md` 文件
- 需要额外的 markdown parser
- YAML frontmatter 解析复杂

**最终方案**：将原始 `SKILL.md` 的内容结构化为 `skill.json`，用 Vite 的 `import` 直接加载。

```
原始 SKILL.md (YAML frontmatter + Markdown)
         │
         ▼  手动映射
  skill.json (结构化 JSON)
         │
         ▼  Vite import
    浏览器 JS 对象
```

**映射关系**：

| SKILL.md 章节 | JSON 字段 | 说明 |
|--------------|-----------|------|
| `--- name / description ---` | `name`, `description` | 元数据 |
| 身份卡 | `identity` | 角色自述 |
| 核心心智模型 | `models[]` | 每条含 `name` + `oneLiner` |
| 决策启发式 | `heuristics[]` | 简洁规则列表 |
| 表达DNA | `voice` | 语气、口头禅、禁忌 |
| 安全边界 | `safety[]` | 禁止项 |
| 回答工作流 | `workflow[]` | 分析步骤 |
| 快捷问题 | `quickQuestions[]` | 预设入口 |

示例（梵公子 skill.json）：

```json
{
  "id": "fangongzi",
  "name": "梵公子",
  "icon": "🔥",
  "color": "#E74C3C",
  "description": "两性关系实战派，粗犷毒舌",
  "identity": "24岁天蝎座，做男性自我提升",
  "voice": {
    "tone": "粗犷直接，该骂就骂",
    "catchphrases": ["兄弟", "我跟你说", "这不是扯吗"],
    "forbidden": ["不装圣人", "不道德说教", "不给鸡汤"]
  },
  "models": [
    { "name": "价值交换论", "oneLiner": "所有社交关系本质都是价值交换" },
    { "name": "展示面优先", "oneLiner": "外在形象是第一道筛选关" },
    { "name": "做题家 vs 黄毛", "oneLiner": "理论+感觉缺一不可" }
  ],
  "heuristics": [
    "先看人、再看目标、再看场景",
    "跳步骤一定翻车",
    "改变系统，答案自然就有了"
  ],
  "safety": [
    "不教操控术",
    "不保证成功率"
  ],
  "workflow": [
    "问题分类 → 追问细节 → 梵式诊断 → 给出建议"
  ],
  "quickQuestions": [
    "我的展示面怎么样？",
    "怎么搭讪？",
    "社交策略建议"
  ]
}
```

#### 5 个 Skill 配置

| Skill | id | icon | color | role |
|-------|-----|------|-------|------|
| 狗头军师 | goutoujunshi | 🐶 | #4A90D9 | 策略顾问 |
| 梵公子 | fangongzi | 🔥 | #E74C3C | 实战导师 |
| 童锦程 | tongjincheng | 💚 | #2ECC71 | 人性洞察 |
| 女娲 | nuwa | 🦋 | #9B59B6 | 关系分析师 |
| 同事 | colleague | 👥 | #7F8C8D | 职场顾问 |

---

### Module 4: Memory Engine (`src/memory/`)

**职责**：IndexedDB 数据管理，6 张表完整 CRUD。

#### `db.js` — Dexie 初始化

```javascript
import Dexie from 'dexie';

const db = new Dexie('LoveCouncil');

db.version(1).stores({
  persons: `
    ++id,
    name,
    avatar,
    gender,
    mbti,
    createdAt
  `,

  relationships: `
    ++id,
    personId,       // → persons.id
    status,         // 陌生|认识|熟悉|暧昧|稳定|冲突|疏远
    myRating,       // 主观评分 0-100
    startDate,
    updatedAt
  `,

  events: `
    ++id,
    personId,       // → persons.id
    date,
    type,           // 约会|聊天|冲突|进展|其他
    title,
    description,
    emotion,        // positive|neutral|negative
    importance      // 1-5
  `,

  messages: `
    ++id,
    personId,       // → persons.id (可为 null)
    role,           // user|assistant
    skillId,        // → skills.id
    content,
    timestamp,
    sessionId       // 会话分组
  `,

  summaries: `
    ++id,
    personId,       // → persons.id
    date,
    content,
    type            // daily|weekly|manual
  `,

  settings: `
    &key,
    value
  `
});
```

#### 外键关系

```
persons (1) ──→ (N) relationships
persons (1) ──→ (N) events
persons (1) ──→ (N) messages
persons (1) ──→ (N) summaries
settings (独立)
```

#### Stores 接口定义

**`personStore.js`**
```javascript
export const personStore = {
  async create(data),    // 新建人物
  async get(id),         // 获取单个
  async getAll(),        // 全部列表
  async update(id, data),// 更新
  async delete(id),      // 删除
  async search(query),   // 搜索
}
```

**`eventStore.js`**
```javascript
export const eventStore = {
  async create(data),
  async getByPerson(personId),
  async getRecent(personId, limit),
  async getTimeline(personId),
  async delete(id),
}
```

**`messageStore.js`**
```javascript
export const messageStore = {
  async save(role, content, skillId, personId),
  async getByPerson(personId, page, pageSize),
  async getBySession(sessionId),
  async clearPerson(personId),
  async clearAll(),
}
```

**`summaryStore.js`**
```javascript
export const summaryStore = {
  async create(data),
  async getLatest(personId),
  async getByDateRange(personId, start, end),
}
```

**`backup.js`**
```javascript
export const backup = {
  async exportAll(),       // 导出全部数据为 JSON
  async importAll(json),   // 从 JSON 导入
}
```

---

### Module 5: Response Controller (`src/response/controller.js`)

**职责**：控制 3 种调用模式。

```javascript
export async function handleResponse(mode, userMessage, skillId) {
  switch (mode) {
    case 'quick':      // Mode A: 1 个 Skill，直接回复
      return callSingleSkill(skillId, userMessage);

    case 'committee':  // Mode B: 2-3 个 Skill，分别回复
      const skills = route.getRecommendedSkills(userMessage, 'committee');
      return callMultipleSkills(skills, userMessage);

    case 'decision':   // Mode C: 所有 Skill + 综合决策
      const allSkills = route.getRecommendedSkills(userMessage, 'decision');
      const responses = await callAllSkills(allSkills, userMessage);
      return callDecisionMaker(responses, userMessage);
  }
}
```

#### Mode A — Quick（默认）

```
适用：日常简单问题
流程：用户输入 → Router 选 Top 1 Skill → 直接调用 → 流式输出
成本：1 次 API 调用
```

#### Mode B — Committee

```
适用：需要多角度分析的问题
流程：用户输入 → Router 选 Top 2-3 Skills → 分别调用 → 并列展示
成本：2-3 次 API 调用
展示：每个 Skill 的回复独立显示，标注来源
```

#### Mode C — Decision

```
适用：重大决策/复杂问题
流程：用户输入 → 调用所有 5 个 Skills → 收集全部回复 →
      拼接 Decision Prompt → 调用 API 生成综合建议 → 输出
成本：6 次 API 调用（5 个 Skill + 1 次综合）
```

---

### Module 5.1: 关系状态系统（人机协同）

**设计原则**：恋爱关系判断非常主观，**不要让 AI 替人做决定**。采用渐进式的人机协同方案。

#### 三阶段演进

| 阶段 | 方式 | 说明 |
|------|------|------|
| **MVP** | 用户手动设置 | 下拉选择：陌生/认识/熟悉/暧昧/稳定/冲突/疏远 |
| **Phase 2** | AI 建议 + 用户确认 | AI 根据最近事件给出建议，用户确认后更新 |
| **Phase 3** | 自动推断 + 用户可覆盖 | 基于事件情感分析自动更新趋势，用户可随时修改 |

#### Phase 2 示例

```
AI 提示：
"根据最近 10 次互动（回复时间变长 70%、主动发消息减少），
建议将关系状态调整为：暧昧 ↓（下降趋势）
是否更新？"

用户：[确认] [忽略]
```

#### Phase 3 自动推断逻辑

```javascript
function inferStatusTrend(events) {
  const recent = events.slice(-10);
  const positiveRatio = recent
    .filter(e => e.emotion === 'positive').length / recent.length;

  if (positiveRatio > 0.7) return { status: '稳定', trend: '↑ 升温' };
  if (positiveRatio > 0.4) return { status: '暧昧', trend: '→ 持平' };
  if (positiveRatio > 0.2) return { status: '冲突', trend: '↓ 降温' };
  return { status: '疏远', trend: '↓ 降温' };
}
```

---

### Module 5.2: Conversation Summary（对话摘要）

**职责**：解决长期聊天下上下文膨胀问题，避免每次把全部历史发给模型。

#### 三级上下文模型

```
┌─────────────────┐
│   长期记忆       │  ← 人物档案、关系状态（每次携带）
│   (always)      │
├─────────────────┤
│   关系摘要       │  ← 定期生成，压缩历史（按需携带）
│   (summary)     │
├─────────────────┤
│   最近聊天       │  ← 最近 N 轮对话（每次携带）
│   (recent)      │
├─────────────────┤
│   当前问题       │
└─────────────────┘
```

#### 摘要生成触发机制（3 种）

| 触发条件 | 说明 |
|---------|------|
| **手动触发** | 用户点击「生成关系总结」按钮 |
| **切换人物** | 从小A切换到小B时，自动为小A生成摘要 |
| **对话长度** | 超过 50 轮对话时，自动提示生成摘要 |

#### 摘要结构（固定格式）

```json
{
  "date": "2026-07-28",
  "period": "过去一周",
  "problem": "近期回复减少，互动频率下降",
  "facts": [
    "主动发消息次数从每天 5 次降到 1 次",
    "对方回复时间从 10 分钟增加到 2 小时",
    "最近一次约会被取消"
  ],
  "conclusion": "关系热度下降，对方投入减少",
  "next": [
    "减少主动联系压力",
    "观察对方是否主动",
    "一周后评估是否继续投入"
  ]
}
```

#### 摘要生成 Prompt

```
请为以下对话生成关系摘要，严格控制输出长度（不超过 200 字）。

对话内容：
{conversation}

输出格式（JSON）：
{
  "problem": "核心问题（1-2句）",
  "facts": ["关键事实1", "关键事实2", "关键事实3"],
  "conclusion": "分析结论（1句）",
  "next": ["建议1", "建议2"]
}
```

---

### Module 6: Crypto (`src/crypto/encrypt.js`)

**职责**：安全存储 API Key。

```javascript
// AES-GCM + PBKDF2
const SALT = 'LoveCouncil-v1';

export async function encryptAPIKey(plaintext, password) {
  // 1. PBKDF2 派生密钥
  const key = await deriveKey(password);
  // 2. AES-GCM 加密
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  // 3. 返回 base64(iv + ciphertext)
  return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)));
}

export async function decryptAPIKey(ciphertext, password) {
  // 反向操作
}
```

---

### Module 7: Pages

#### `ChatView.vue` — 聊天主页

```
┌─────────────────────────────┐
│  [API状态] [关系选择] [设置] │  ← 顶部栏
├─────────────────────────────┤
│                             │
│  用户气泡: 她最近回复很慢    │
│                             │
│  AI气泡: 兄弟，先别急...    │  ← 流式输出
│                             │
│  [路由推荐条] 🐶狗头军师 ⭐ │  ← RouteHint
│                             │
├─────────────────────────────┤
│  [输入框]          [发送]   │  ← 输入区
├─────────────────────────────┤
│  🐶 🔥 💚 🦋 👥   [模式]   │  ← SkillTab 底部栏
└─────────────────────────────┘
```

**状态管理**：
- `currentSkill`: 当前选中的 Skill
- `messages[]`: 当前对话消息
- `responseMode`: quick | committee | decision
- `isStreaming`: 是否正在流式输出

#### `MemoryView.vue` — 关系档案页

```
┌─────────────────────────────┐
│  [人物列表]                  │
│  ┌─────────────────┐        │
│  │ 小A ❤️ 暧昧期    │        │
│  │ 小B 💔 已结束    │        │
│  │ 小C 💼 同事      │        │
│  └─────────────────┘        │
├─────────────────────────────┤
│  当前: 小A                   │
│                             │
│  关系状态: [暧昧期 ▾]       │  ← 手动下拉
│  趋势: ↓ 降温               │
│                             │
│  最近事件:                   │
│  ┌ 7/20 主动聊天减少       │
│  ├ 7/23 取消约会            │
│  ├ 7/25 回复冷淡            │
│  └ [+ 添加事件]             │
│                             │
│  对话摘要:                   │
│  ┌ 7/26 上周摘要...         │
│  └ [生成摘要]               │
└─────────────────────────────┘
```

#### `SettingsView.vue` — API 配置页

```
┌─────────────────────────────┐
│  API 配置                   │
│                             │
│  API Base URL               │
│  [https://api.openai.com/v1]│
│                             │
│  API Key                    │
│  [••••••••••••••••]        │
│                             │
│  模型名称                    │
│  [gpt-4o]                   │
│                             │
│  ┌── 预设配置 ──┐           │
│  │ OpenAI │ 智谱 │ 通义 │    │
│  └──────────────┘           │
│                             │
│  [测试连接]   [保存]         │
│                             │
│  ─── 数据管理 ───            │
│  [导出数据] [导入数据]       │
│  [清空所有对话]              │
└─────────────────────────────┘
```

---

### Module 8: Components

| 组件 | 用途 | Props |
|------|------|-------|
| `SkillTab.vue` | 底部 Tab 栏 | `skills`, `activeSkill`, `@select` |
| `ChatBubble.vue` | 聊天气泡 | `role`, `content`, `skillIcon`, `isStreaming` |
| `RouteHint.vue` | Skill 推荐提示 | `recommendedSkills[]`, `@select` |
| `PersonCard.vue` | 人物卡片 | `person`, `relationship`, `@click` |
| `RelationshipTimeline.vue` | 关系时间线 | `events[]` |
| `SummaryCard.vue` | 摘要卡片 | `summary`, `@generate` |
| `ApiConfigForm.vue` | API 配置表单 | `config`, `presets[]`, `@save` |

---

## 五、Decision Prompt 完整模板（Mode C）

```
你是 Love Council 的决策官。
你的任务是从多个专家顾问的分析中，综合出一份最终建议。

【用户问题】
{userMessage}

【关系背景】
{relationshipContext}

━━━━━━━━━━━━━━━━━━━━━━━━

以下是 5 位顾问对同一问题的独立分析：

【狗头军师 - 策略视角】
核心原则：先接住情绪，再分清事实，最后给能执行的选择。
分析：
{goutoujunshi_response}

【梵公子 - 实战视角】
核心原则：教思考方式，不教标准答案。实战优先，拒绝纯理论。
分析：
{fangongzi_response}

【童锦程 - 人性视角】
核心原则：真诚才是最高级的套路。先问"我有什么值得对方靠近的理由"。
分析：
{tongjincheng_response}

【女娲 - 关系视角】
核心原则：系统化分析关系阶段和动态。
分析：
{nuwa_response}

【同事 - 职场视角】
核心原则：理性、务实、边界清晰。
分析：
{colleague_response}

━━━━━━━━━━━━━━━━━━━━━━━━

请综合以上 5 个视角，给出最终建议：

1. **核心问题诊断**：这个问题的本质是什么？
2. **各视角关键洞察**：每个视角最重要的 1-2 个点
3. **推荐行动方案**（分步骤，可执行）
4. **风险提示**：需要注意什么？什么时候该停？
5. **一句话总结**

请保持客观，指出 5 个视角中不一致的地方，让用户自己选择。
```

---

## 六、IndexedDB 完整 Schema

| 表名 | 主键 | 索引字段 | 外键 | 说明 |
|------|------|---------|------|------|
| `persons` | `++id` | `name` | — | 人物主表 |
| `relationships` | `++id` | `personId`, `status`, `updatedAt` | `personId → persons.id` | 关系状态 |
| `events` | `++id` | `personId`, `date`, `type` | `personId → persons.id` | 事件记录 |
| `messages` | `++id` | `personId`, `skillId`, `timestamp` | `personId → persons.id` | 聊天消息 |
| `summaries` | `++id` | `personId`, `date` | `personId → persons.id` | 对话摘要 |
| `settings` | `&key` | — | — | 键值配置 |

---

## 七、手机使用方式

### 开发阶段

```bash
cd love-advisor
npm install
npm run dev -- --host 0.0.0.0
# 手机访问 http://电脑IP:5173
# （手机和电脑在同一 WiFi 下）
```

### 生产部署

```bash
npm run build
# dist/ 目录部署到任意静态托管：
# - GitHub Pages（免费）
# - Netlify（免费，支持自动部署）
# - Vercel（免费）
# - Cloudflare Pages（免费）

# 手机浏览器访问 https://your-domain.com
# 添加到主屏幕 → 像 App 一样使用
```

---

## 八、开发时间线

| Phase | 内容 | 工时 | 交付物 |
|-------|------|------|--------|
| **Phase 1** | Vite+Vue3 初始化、5 个 Skill JSON、API 调用 + SSE 流式、聊天 UI、API 配置页、IndexedDB 消息存储 | **4h** | 基础聊天可用 |
| **Phase 2** | Router Lite（17 条规则）、3 种响应模式、流式显示优化、Skill 切换动画 | **8h** | 多 Skill 路由 |
| **Phase 3** | 人物管理 CRUD、关系状态管理、事件时间线、对话摘要生成 | **8h** | 记忆系统可用 |
| **Phase 4** | Web Crypto 加密 Key、备份导出/导入、移动端适配优化、PWA manifest、综合测试 | **16h** | 完整产品 |
| **总计** | | **36h ≈ 1 周** | |

### Phase 1 详细任务

```
Phase 1: 基础聊天（4h）
├── 创建 Vite + Vue3 项目（10min）
├── 安装依赖: vue, dexie（5min）
├── 创建 5 个 Skill JSON 文件（30min）
│   ├── skills/goutoujunshi.json
│   ├── skills/fangongzi.json
│   ├── skills/tongjincheng.json
│   ├── skills/nuwa.json
│   └── skills/colleague.json
├── Skill Manager（15min）
│   └── skills/index.js
├── Memory Engine 基础（30min）
│   └── memory/db.js（Dexie 初始化 + messageStore）
├── AI Engine（45min）
│   ├── ai/api.js（fetch + SSE）
│   ├── ai/stream.js（SSE 解析）
│   └── ai/promptBuilder.js（Prompt 拼接）
├── 聊天 UI（60min）
│   ├── pages/ChatView.vue
│   ├── components/SkillTab.vue（底部 Tab）
│   └── components/ChatBubble.vue（气泡）
├── API 配置页（30min）
│   └── pages/SettingsView.vue
└── 集成测试 + 调试（15min）
```

---

## 九、代码规模估算

| 模块 | 预计行数 | 说明 |
|------|---------|------|
| AI Engine (`ai/`) | ~300 行 | api.js + stream.js + promptBuilder.js |
| Router Lite (`router/`) | ~200 行 | rules.js + route.js |
| Skill Manager (`skills/`) | ~500 行 | 5 个 JSON + index.js |
| Memory Engine (`memory/`) | ~600 行 | db.js + 6 个 stores + backup.js |
| Response Controller (`response/`) | ~200 行 | controller.js |
| Crypto (`crypto/`) | ~100 行 | encrypt.js |
| Pages (3 个 Vue) | ~800 行 | ChatView + MemoryView + SettingsView |
| Components (7 个 Vue) | ~700 行 | 组件 |
| 入口 + 样式 + 配置 | ~400 行 | main.js, App.vue, vite.config.js |
| **总计** | **~3800 行** | 个人项目完全可控 |

---

## 十、验收标准

| 功能 | 验收条件 |
|------|---------|
| ✅ Skill 切换 | 底部 Tab 栏，5 个 Skill 一键切换，各自独立对话 |
| ✅ 流式聊天 | 输入消息后 AI 逐字输出，支持 Markdown |
| ✅ API 配置 | Base URL + Key + 模型名，本地保存，支持预设 |
| ✅ 消息持久化 | 刷新页面后聊天记录仍在（IndexedDB） |
| ✅ Router 推荐 | 输入消息后自动推荐最匹配的 Skill（Top 3 + 评分） |
| ✅ 关系档案 | 可管理人物、关系状态、事件时间线 |
| ✅ 对话摘要 | 3 种触发方式，结构化摘要输出 |
| ✅ 数据安全 | API Key AES-GCM 加密存储 |
| ✅ 备份导出 | 全部数据可导出/导入 JSON |
| ✅ 手机适配 | 移动端浏览器友好，PWA 可添加到桌面 |

---

## 十一、设计原则（按优先级排序）

### 🥇 第一：不要破坏原 Skill

5 个 Skill 的价值来自它们独特的人格、风格和判断方式。包装层只负责路由和记忆注入，**不修改 Skill 本身的 system prompt**。

### 🥈 第二：Memory 比 Skill 更重要

没有记忆的系统只是 ChatGPT 套壳。有记忆才能：
- 第 10 次对话和第 1 次不同
- 基于历史给建议，而不是基于"当前这句话"
- 形成私人关系模型

### 🥉 第三：不要追求复杂 Agent

个人使用的 80% 价值来自：

```
Skill（人格系统）
  +
Memory（记忆系统）
  +
简单路由（规则评分）
```

**不是来自**复杂的 Multi-Agent 框架、向量检索、自动推理。

### 第四：人类始终是最终决策者

- 关系状态：AI 建议，用户确认
- 重大决策：综合 5 个视角，用户自己判断
- 事件记录：用户手动添加为主，自动提取为辅

---

## 十二、最终方案评价

| 维度 | 评分 | 说明 |
|------|------|------|
| 开发难度 | ⭐⭐⭐ | Vue3 + Dexie 需要一定学习成本，但整体可控 |
| 可维护性 | ⭐⭐⭐⭐⭐ | Module 拆分清晰，每模块 200-600 行 |
| 隐私保护 | ⭐⭐⭐⭐⭐ | 全本地存储，Key 加密，零上传 |
| 长期价值 | ⭐⭐⭐⭐⭐ | Memory 系统让工具越用越有价值 |
| 扩展能力 | ⭐⭐⭐⭐ | 加 Skill / 加表 / 加模式都很方便 |
| 是否过度设计 | ❌ 否 | 刚好满足 3 个轻量能力，无多余模块 |

### 一句话总结

> **比纯 HTML 多一点开发量，但不陷入工程泥潭，同时保留了真正有价值的 AI 能力。后续加「聊天截图分析」「关系趋势预测」都不用重构。**
