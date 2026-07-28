/**
 * 大模型 API 调用（支持 OpenAI 兼容接口 + Anthropic Claude）
 */

import { parseSSEStream, parseClaudeSSE } from './stream.js'

/**
 * OpenAI 兼容接口调用
 */
export async function callOpenAI({ baseURL, apiKey, model, messages, temperature = 0.7 }) {
  const url = `${baseURL.replace(/\/+$/, '')}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 4096,
      stream: true
    })
  })

  return response
}

/**
 * Anthropic Claude 接口调用
 */
export async function callClaude({ apiKey, model, messages, systemPrompt, temperature = 0.7 }) {
  const url = 'https://api.anthropic.com/v1/messages'

  // Claude 的消息格式：system 是单独字段，不在 messages 里
  const body = {
    model,
    max_tokens: 4096,
    temperature,
    stream: true,
    messages: messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))
  }

  if (systemPrompt) {
    body.system = systemPrompt
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  })

  return response
}

/**
 * 完整流式调用（自动识别 provider）
 * @param {Object} config - { provider, baseURL, apiKey, model }
 * @param {Array} messages - [{role, content}]
 * @param {string} [systemPrompt] - Claude 专用：system prompt
 * @param {Object} callbacks - { onChunk(text), onDone(fullText), onError(err) }
 */
export async function streamChat(config, messages, systemPrompt, callbacks) {
  // 兼容旧的调用方式 (config, messages, callbacks)
  if (typeof systemPrompt === 'object' && systemPrompt !== null && 'onChunk' in systemPrompt) {
    callbacks = systemPrompt
    systemPrompt = undefined
  }

  try {
    let response
    const provider = (config.provider || 'openai').toLowerCase()

    if (provider === 'claude') {
      response = await callClaude({
        apiKey: config.apiKey,
        model: config.model,
        messages,
        systemPrompt,
        temperature: config.temperature
      })
      await parseClaudeSSE(response, callbacks)
    } else {
      response = await callOpenAI({
        baseURL: config.baseURL,
        apiKey: config.apiKey,
        model: config.model,
        messages,
        temperature: config.temperature
      })
      await parseSSEStream(response, callbacks)
    }
  } catch (err) {
    callbacks.onError?.(err)
  }
}
