/**
 * Prompt 构建器
 * 拼接 system prompt + 记忆上下文 + 用户问题
 */

/**
 * Prompt 构建器
 * 拼接 system prompt + 记忆上下文 + 用户问题
 * 支持 OpenAI 和 Claude 两种格式
 */

/**
 * 构建 API 请求的 messages 数组
 * @returns {{ messages: Array, systemPrompt: string|null }}
 *   - messages: 消息数组（不含 system，Claude 的 system 在单独字段）
 *   - systemPrompt: Claude 专用，提取出来的 system prompt 文本
 */
export function buildPrompt(skill, personContext, userMessage) {
  const messages = []
  let systemParts = [skill.systemPrompt]

  // 1. 记忆上下文（如果有）
  if (personContext) {
    const memoryContext = buildMemoryContext(personContext)
    if (memoryContext) {
      systemParts.push(`【关系背景信息】\n${memoryContext}`)
    }
  }

  const systemPrompt = systemParts.join('\n\n')

  // 2. 用户问题
  messages.push({
    role: 'user',
    content: userMessage
  })

  return { messages, systemPrompt }
}

/**
 * 向后兼容：旧版直接返回 messages 数组
 * 新版 ChatView 已适配新格式
 */
export function buildPromptLegacy(skill, personContext, userMessage) {
  const { messages, systemPrompt } = buildPrompt(skill, personContext, userMessage)
  return [
    { role: 'system', content: systemPrompt },
    ...messages
  ]
}

function buildMemoryContext(ctx) {
  const parts = []
  if (ctx.personName) parts.push(`当前对象：${ctx.personName}`)
  if (ctx.status) parts.push(`关系状态：${ctx.status}`)
  if (ctx.trend) parts.push(`趋势：${ctx.trend}`)

  if (ctx.recentEvents?.length) {
    const events = ctx.recentEvents.slice(-3).map(e =>
      `${e.date || ''} ${e.title || e.content || ''}`
    ).join('\n')
    if (events) parts.push(`最近事件：\n${events}`)
  }

  if (ctx.lastSummary?.content) {
    parts.push(`对话摘要：${ctx.lastSummary.content}`)
  }

  return parts.length ? parts.join('\n\n') : ''
}
