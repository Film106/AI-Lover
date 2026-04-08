import { useState, useEffect } from 'react'
import { isEnvKey, getApiKey, getChatModel } from '../api'

const OPENROUTER_CHAT_MODELS = [
  { id: 'google/gemini-2.5-pro', label: '✨ Gemini 2.5 Pro', free: false },
  { id: 'google/gemini-flash-1.5', label: '⚡ Gemini Flash 1.5', free: false },
  { id: 'meta-llama/llama-3.3-8b-instruct:free', label: '🦙 Llama 3.3 8B (FREE)', free: true },
  { id: 'google/gemma-3-12b-it:free', label: '💎 Gemma 3 12B (FREE)', free: true },
  { id: 'mistralai/mistral-7b-instruct:free', label: '🌪️ Mistral 7B (FREE)', free: true },
  { id: 'openai/gpt-4o-mini', label: '🤖 GPT-4o Mini', free: false },
  { id: 'anthropic/claude-3-haiku', label: '🧬 Claude 3 Haiku', free: false },
]

export default function SettingsModal({ isOpen, onClose, onSave, currentSettings }) {
  const [apiKey, setApiKey] = useState(currentSettings?.apiKey || '')
  const [chatModel, setChatModel] = useState(currentSettings?.chatModel || OPENROUTER_CHAT_MODELS[0].id)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const envKeyActive = isEnvKey()

  useEffect(() => {
    if (isOpen) {
      setApiKey(envKeyActive ? '' : (currentSettings?.apiKey || ''))
      setChatModel(getChatModel())
      setTestResult(null)
    }
  }, [isOpen, currentSettings, envKeyActive])

  const handleSave = () => {
    // บันทึกค่าทั้งหมดรวมถึง vastUrl ไปยัง Parent (App.jsx)
    onSave({ 
      apiKey: apiKey.trim(), 
      chatModel
    })
    onClose()
  }

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ ok: false, msg: 'กรุณาใส่ API Key ก่อน' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Lover'
        },
        body: JSON.stringify({
          model: chatModel,
          messages: [{ role: 'user', content: 'Say "ok".' }],
          max_tokens: 20
        })
      })
      const data = await res.json()
      if (res.ok && data.choices?.[0]) {
        setTestResult({ ok: true, msg: '✅ API Key ใช้งานได้! AI พร้อมจีบแล้ว 💘' })
      } else {
        setTestResult({ ok: false, msg: `❌ ${data.error?.message || 'API Key ไม่ถูกต้อง'}` })
      }
    } catch {
      setTestResult({ ok: false, msg: '❌ เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ต' })
    }
    setTesting(false)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">
            <span>⚙️</span>
            <div>
              <h2>ตั้งค่าระบบ</h2>
              <p>ตั้งค่าสมอง (AI Chat) และร่างกาย (AI Image)</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* ส่วนของ OpenRouter (แชท) */}
          <div className="section-divider">
            <span className="section-title-tag">💬 AI Chat Settings</span>
          </div>

          <div className="settings-field">
            <label className="input-label">OpenRouter API Key</label>
            {envKeyActive ? (
              <div className="env-key-banner">
                <span>🔒 Key โหลดจาก .env แล้ว</span>
              </div>
            ) : (
              <div className="key-input-wrap">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="input-field"
                  placeholder="sk-or-v1-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
                <button className="btn-icon" onClick={() => setShowKey(!showKey)}>
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
            )}
          </div>

          <div className="settings-field">
            <label className="input-label">เลือกโมเดล AI สำหรับจีบ</label>
            <div className="model-grid">
              {OPENROUTER_CHAT_MODELS.map(m => (
                <button
                  key={m.id}
                  className={`model-card ${chatModel === m.id ? 'selected' : ''}`}
                  onClick={() => setChatModel(m.id)}
                >
                  <span className="model-label">{m.label}</span>
                  {m.free && <span className="free-badge">FREE</span>}
                </button>
              ))}
            </div>
          </div>

          {testResult && (
            <div className={`test-result ${testResult.ok ? 'ok' : 'fail'}`}>
              {testResult.msg}
            </div>
          )}

        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleTest} disabled={testing}>
            {testing ? '⏳ ทดสอบ...' : '🧪 ทดสอบ Key'}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={onClose}>ยกเลิก</button>
            <button className="btn-primary" onClick={handleSave}>
              💾 บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </div>

      {/* CSS Styles (คงเดิมและปรับปรุงเล็กน้อย) */}
      <style>{`
        /* ... (CSS ส่วนใหญ่คงเดิมจากที่คุณส่งมา) ... */
        .section-divider {
          display: flex; align-items: center; gap: 10px;
          margin: 10px 0 5px;
        }
        .section-title { 
          font-size: 0.8rem; font-weight: 800; color: var(--pink-bright); 
          text-transform: uppercase; letter-spacing: 1px; 
        }
        .env-key-banner {
          padding: 10px; background: rgba(16,185,129,0.1); 
          border-radius: 8px; color: #10b981; font-size: 0.8rem;
          display: flex; align-items: center; gap: 8px;
        }
      `}</style>
    </div>
  )
}