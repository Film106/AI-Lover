/**
 * api.js — OpenRouter API utility
 * Priority: .env (VITE_OPENROUTER_API_KEY) > localStorage (user-input key)
 */

const STORAGE_KEY = 'ai_jib_settings'

/** Get effective API key: env first, then localStorage */
export function getApiKey() {
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY
  if (envKey && envKey.trim()) return envKey.trim()
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
    return s.apiKey?.trim() || ''
  } catch {
    return ''
  }
}

/** Get effective chat model: env first, then localStorage, then default */
export function getChatModel() {
  const envModel = import.meta.env.VITE_OPENROUTER_CHAT_MODEL
  if (envModel && envModel.trim()) return envModel.trim()
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
    return s.chatModel?.trim() || 'google/gemini-2.5-pro'
  } catch {
    return 'google/gemini-2.5-pro'
  }
}

/** Whether API key is from .env (read-only for user) */
export function isEnvKey() {
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY
  return !!(envKey && envKey.trim())
}

/**
 * Call OpenRouter chat completions
 * @param {Array} messages - [{role, content}]
 * @param {string} [model] - override model
 * @returns {Promise<string>} - assistant reply text
 */
export async function chatWithAI(messages, model) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_KEY')

  const usedModel = model || getChatModel()

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AI จีบเพื่อน'
    },
    body: JSON.stringify({
      model: usedModel,
      messages,
      max_tokens: 200,
      temperature: 0.9
    })
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'API error')
  return data.choices?.[0]?.message?.content || ''
}
