/**
 * api.js — รวมฟังก์ชันจัดการ API แบบฝังค่า
 */

const STORAGE_KEY = 'ai_jib_settings'

/** ดึง API Key จาก .env (VITE_OPENROUTER_API_KEY) */
export function getApiKey() {
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY
  return envKey?.trim() || ''
}

/** ดึง Chat Model จาก .env หรือใช้ค่าเริ่มต้น */
export function getChatModel() {
  const envModel = import.meta.env.VITE_OPENROUTER_CHAT_MODEL
  return envModel?.trim() || 'google/gemini-2.5-pro'
}

/** ดึง URL ของ Vast.ai จาก .env (VITE_VAST_API_URL) */
export function getVastSettings() {
  const envUrl = import.meta.env.VITE_VAST_API_URL
  return envUrl?.trim() || ''
}

/** ดึงค่าการตั้งค่าเสียง (ใช้สำหรับหน้าแชท) */
export function getVoiceSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
    return {
      femaleVoiceURI: s.femaleVoiceURI || '',
      maleVoiceURI: s.maleVoiceURI || '',
      pitch: s.pitch ?? 1.3,
      rate: s.rate ?? 1.0
    }
  } catch {
    return { femaleVoiceURI: '', maleVoiceURI: '', pitch: 1.3, rate: 1.0 }
  }
}

/** ฟังก์ชันตรวจสอบ Key ใน .env (เพื่อแก้ Syntax Error ที่คุณเจอ) */
export function isEnvKey() {
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY
  return !!(envKey && envKey.trim())
}

/** บันทึกการตั้งค่าลง localStorage */
export function saveSettings(newSettings) {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
    const updated = { ...current, ...newSettings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return true
  } catch {
    return false
  }
}

/** เรียกใช้ OpenRouter API */
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