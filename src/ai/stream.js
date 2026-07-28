/**
 * SSE 流式解析器
 * 支持两种格式：
 * 1. OpenAI 标准: data: {"choices":[{"delta":{"content":"text"}}]}
 * 2. Anthropic Claude: event: content_block_delta / data: {"delta":{"text":"..."}}
 */

// ==================== 通用工具 ====================

async function readStream(response, onLine, onError) {
  if (!response.ok) {
    let errorMsg = `API 请求失败 (${response.status})`
    try {
      const err = await response.json()
      errorMsg = err.error?.message || err.message || errorMsg
    } catch {}
    onError?.(new Error(errorMsg))
    return false
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        onLine(line.trim())
      }
    }

    // 处理 buffer 中剩余数据
    if (buffer.trim()) {
      onLine(buffer.trim())
    }

    return true
  } catch (err) {
    onError?.(err)
    return false
  }
}

// ==================== OpenAI 格式 ====================

export async function parseSSEStream(response, { onChunk, onDone, onError }) {
  let fullText = ''

  const ok = await readStream(response, (line) => {
    if (!line || line.startsWith(':')) return
    if (line === 'data: [DONE]') return

    if (line.startsWith('data: ')) {
      try {
        const json = JSON.parse(line.slice(6))
        const content = json.choices?.[0]?.delta?.content ||
                        json.choices?.[0]?.text ||
                        ''
        if (content) {
          fullText += content
          onChunk?.(content)
        }
      } catch { /* 非 JSON 数据行，忽略 */ }
    }
  }, onError)

  if (ok) onDone?.(fullText)
}

// ==================== Anthropic Claude 格式 ====================

/**
 * Claude SSE 格式示例：
 * event: content_block_start
 * data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}
 *
 * event: content_block_delta
 * data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}
 *
 * event: content_block_stop
 * data: {"type":"content_block_stop","index":0}
 *
 * event: message_stop
 * data: {"type":"message_stop"}
 */
export async function parseClaudeSSE(response, { onChunk, onDone, onError }) {
  let fullText = ''
  let currentEvent = ''

  const ok = await readStream(response, (line) => {
    if (!line) return

    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7)
      return
    }

    if (line.startsWith('data: ')) {
      try {
        const json = JSON.parse(line.slice(6))

        if (json.type === 'content_block_delta' && json.delta?.text) {
          fullText += json.delta.text
          onChunk?.(json.delta.text)
        }
        // 部分 Claude 模型直接返回 text
        if (json.type === 'content_block_start' && json.content_block?.text) {
          fullText += json.content_block.text
          onChunk?.(json.content_block.text)
        }
      } catch { /* 忽略解析错误 */ }
    }
  }, onError)

  if (ok) onDone?.(fullText)
}
