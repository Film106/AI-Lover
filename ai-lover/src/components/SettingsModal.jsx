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
  const envKeyActive = isEnvKey()
  const [apiKey, setApiKey] = useState(currentSettings?.apiKey || '')
  const [chatModel, setChatModel] = useState(currentSettings?.chatModel || OPENROUTER_CHAT_MODELS[0].id)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setApiKey(envKeyActive ? '' : (currentSettings?.apiKey || ''))
      setChatModel(getChatModel())
      setTestResult(null)
    }
  }, [isOpen, currentSettings, envKeyActive])

  const handleSave = () => {
    onSave({ apiKey: apiKey.trim(), chatModel })
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
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI จีบเพื่อน'
        },
        body: JSON.stringify({
          model: chatModel,
          messages: [{ role: 'user', content: 'Say "ok" in Thai.' }],
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
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span>⚙️</span>
            <div>
              <h2>ตั้งค่า API</h2>
              <p>เชื่อมต่อ OpenRouter เพื่อให้ AI จีบได้จริงๆ</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Info Banner */}
          <div className="info-banner">
            <span>💡</span>
            <div>
              <p><strong>OpenRouter</strong> เป็น API ที่รวม AI หลายตัวไว้ในที่เดียว</p>
              <p>สมัครฟรีได้ที่ <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="link">openrouter.ai</a> แล้วสร้าง API Key</p>
              <p>มีโมเดลฟรีหลายตัว ไม่ต้องเติมเงินก็ใช้ได้!</p>
            </div>
          </div>

          {/* API Key Input */}
          <div className="settings-field">
            <label className="input-label">OpenRouter API Key</label>

            {envKeyActive ? (
              <div className="env-key-banner">
                <span>🔒</span>
                <div>
                  <p><strong>Key โหลดจาก .env แล้ว!</strong></p>
                  <p>แก้ไขที่ไฟล์ <code>.env</code> → <code>VITE_OPENROUTER_API_KEY</code></p>
                </div>
                <span className="env-badge">ENV</span>
              </div>
            ) : (
              <>
                <div className="key-input-wrap">
                  <input
                    id="settings-api-key"
                    type={showKey ? 'text' : 'password'}
                    className="input-field"
                    placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxx"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    spellCheck={false}
                  />
                  <button
                    className="btn-icon"
                    onClick={() => setShowKey(s => !s)}
                    title={showKey ? 'ซ่อน' : 'แสดง'}
                  >
                    {showKey ? '🙈' : '👁️'}
                  </button>
                </div>
                {!apiKey && (
                  <p className="field-note">⚠️ หรือใส่ใน <code>.env</code> → <code>VITE_OPENROUTER_API_KEY=sk-or-...</code></p>
                )}
              </>
            )}
          </div>

          {/* Chat Model Selector */}
          <div className="settings-field">
            <label className="input-label">โมเดล AI สำหรับจีบ 💬</label>
            <div className="model-grid">
              {OPENROUTER_CHAT_MODELS.map(m => (
                <button
                  key={m.id}
                  id={`model-${m.id.replace(/[^a-z0-9]/gi, '-')}`}
                  className={`model-card ${chatModel === m.id ? 'selected' : ''}`}
                  onClick={() => setChatModel(m.id)}
                >
                  <span className="model-label">{m.label}</span>
                  {m.free && <span className="free-badge">FREE</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`test-result ${testResult.ok ? 'ok' : 'fail'}`}>
              {testResult.msg}
            </div>
          )}

          {/* Image Gen Note */}
          <div className="gen-note">
            <p>🎨 <strong>การเจนรูป</strong> ใช้ <strong>Pollinations AI</strong> (ฟรี ไม่ต้องใช้ Key)</p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" id="btn-test-key" onClick={handleTest} disabled={testing}>
            {testing ? '⏳ กำลังทดสอบ...' : '🧪 ทดสอบ Key'}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={onClose}>ยกเลิก</button>
            <button className="btn-primary" id="btn-save-settings" onClick={handleSave}>
              💾 บันทึก
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-box {
          background: var(--dark-card);
          border: 1px solid rgba(168,85,247,0.3);
          border-radius: var(--radius-lg);
          width: 100%; max-width: 560px;
          max-height: 90vh; overflow-y: auto;
          animation: slideUp 0.3s ease;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,77,141,0.1);
        }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .modal-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 24px 24px 16px;
          border-bottom: 1px solid var(--dark-border);
        }
        .modal-title { display: flex; align-items: center; gap: 12px; font-size: 1.5rem; }
        .modal-title h2 { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px; }
        .modal-title p { font-size: 0.8rem; color: var(--text-muted); }
        .modal-close {
          background: none; border: none; color: var(--text-muted);
          font-size: 1.2rem; cursor: pointer; padding: 4px 8px;
          border-radius: 8px; transition: all 0.2s;
          line-height: 1;
        }
        .modal-close:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }

        .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
        .modal-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 24px; border-top: 1px solid var(--dark-border);
          flex-wrap: wrap; gap: 10px;
        }

        .info-banner {
          display: flex; gap: 12px;
          padding: 14px 16px;
          background: rgba(168,85,247,0.1);
          border: 1px solid rgba(168,85,247,0.2);
          border-radius: var(--radius-md);
          font-size: 0.875rem; color: var(--text-secondary);
          line-height: 1.7;
        }
        .info-banner span { font-size: 1.3rem; flex-shrink: 0; margin-top: 2px; }
        .link { color: var(--pink-bright); text-decoration: none; }
        .link:hover { text-decoration: underline; }

        .settings-field { display: flex; flex-direction: column; gap: 8px; }
        .key-input-wrap { position: relative; display: flex; align-items: center; }
        .key-input-wrap .input-field { padding-right: 50px; }
        .btn-icon {
          position: absolute; right: 12px;
          background: none; border: none; cursor: pointer;
          font-size: 1.2rem; padding: 4px;
          transition: transform 0.2s;
        }
        .btn-icon:hover { transform: scale(1.2); }
        .field-note { font-size: 0.8rem; color: var(--text-muted); }

        .model-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .model-card {
          padding: 10px 12px; text-align: left;
          background: var(--dark-surface);
          border: 2px solid var(--dark-border);
          border-radius: var(--radius-md);
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: space-between; gap: 6px;
          font-family: var(--font-thai); position: relative;
        }
        .model-card:hover { border-color: var(--purple-soft); background: rgba(168,85,247,0.1); }
        .model-card.selected {
          border-color: var(--pink-bright);
          background: linear-gradient(135deg, rgba(255,77,141,0.15), rgba(124,58,237,0.1));
          box-shadow: 0 0 12px rgba(255,77,141,0.2);
        }
        .model-label { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }
        .free-badge {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; font-size: 0.65rem; font-weight: 800;
          padding: 2px 6px; border-radius: 20px; flex-shrink: 0;
        }

        .test-result {
          padding: 12px 16px; border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 600;
        }
        .test-result.ok {
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3);
          color: #10b981;
        }
        .test-result.fail {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
          color: #fb7185;
        }

        .gen-note {
          padding: 12px 16px;
          background: rgba(251,191,36,0.08);
          border: 1px solid rgba(251,191,36,0.2);
          border-radius: var(--radius-md);
          font-size: 0.85rem; color: var(--text-secondary);
        }

        @media (max-width: 480px) {
          .model-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
