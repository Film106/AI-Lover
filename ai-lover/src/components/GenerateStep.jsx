import { useState, useRef, useEffect } from 'react'
import './components.css'

const AI_CHARACTERS = [
  {
    id: 'prince',
    emoji: '🤴',
    name: 'เจ้าชาย Charming',
    desc: 'หล่อ หรู สุภาพ แต่แอบอสัตย์',
    voice: { pitch: 0.8, rate: 0.85, name: 'male' },
    color: '#fbbf24'
  },
  {
    id: 'romeo',
    emoji: '🌹',
    name: 'โรมิโอ สยบสาว',
    desc: 'พูดโรแมนติก แต่มีพิรุธมาก',
    voice: { pitch: 0.9, rate: 0.9, name: 'male' },
    color: '#f43f5e'
  },
  {
    id: 'nerd',
    emoji: '🤓',
    name: 'หนุ่มเนิร์ด ขาแว่น',
    desc: 'จีบด้วยสมการ สถิติ และ Excel',
    voice: { pitch: 1.1, rate: 1.0, name: 'male' },
    color: '#06b6d4'
  },
  {
    id: 'alien',
    emoji: '👽',
    name: 'เอเลี่ยน Z-9',
    desc: 'มาจากดาวอื่น ไม่เข้าใจโลกมนุษย์',
    voice: { pitch: 1.4, rate: 1.1, name: 'alien' },
    color: '#10b981'
  }
]

const FUNNY_THEMES = [
  { id: 'superhero', label: '🦸 ซูเปอร์ฮีโร่', prompt: 'as a superhero with silly cape and muscles pose, comic style, bright colors' },
  { id: 'royalty', label: '👑 ราชวงศ์โบราณ', prompt: 'as ancient royalty with exaggerated crown and fancy clothes, oil painting style' },
  { id: 'anime', label: '🌸 ตัวละครอนิเมะ', prompt: 'as anime character with big eyes, dramatic wind effect and sparkles, cute' },
  { id: 'meme', label: '😂 มีมอินเตอร์เน็ต', prompt: 'in dramatic meme format, funny expression, bold text caption style' },
  { id: 'boss', label: '💼 บอสนักธุรกิจ', prompt: 'as powerful business mogul in a huge office, with money raining, funny serious face' },
  { id: 'wizard', label: '🧙 พ่อมดมหัศจรรย์', prompt: 'as a funny wizard with tall hat and glowing wand, magical sparkles everywhere' },
]

export default function GenerateStep({ friendPhoto, friendName, onImageGenerated, onBack }) {
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [selectedChar, setSelectedChar] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [genStatus, setGenStatus] = useState('')
  const prevBlobRef = useRef(null)

  // Hugging Face model endpoints (tried in order)
  const HF_MODELS = [
    'black-forest-labs/FLUX.1-schnell',
    'stabilityai/stable-diffusion-xl-base-1.0',
  ]

  const generateImage = async () => {
    if (!selectedTheme) return
    setIsGenerating(true)
    setGeneratedUrl(null)
    setLoadError(false)

    // Revoke old blob URL to free memory
    if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current)

    const theme = FUNNY_THEMES.find(t => t.id === selectedTheme)
    const prompt = `Funny cartoon illustration of a person named ${friendName}, ${theme.prompt}, high quality, vibrant colors, detailed`

    const hfToken = import.meta.env.VITE_HF_TOKEN
    const headers = {
      'Content-Type': 'application/json',
      ...(hfToken ? { 'Authorization': `Bearer ${hfToken}` } : {})
    }

    let success = false
    for (const model of HF_MODELS) {
      try {
        setGenStatus(`🎨 กำลังเจนรูปด้วย ${model.split('/')[1]}...`)

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 60000)

        const res = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              inputs: prompt,
              parameters: { width: 512, height: 512 }
            }),
            signal: controller.signal,
          }
        )
        clearTimeout(timeout)

        if (res.status === 503) {
          // Model loading, wait and retry once
          setGenStatus(`⏳ โมเดลกำลังโหลด รอสักครู่...`)
          await new Promise(r => setTimeout(r, 8000))
          const res2 = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            { method: 'POST', headers, body: JSON.stringify({ inputs: prompt }) }
          )
          if (!res2.ok) throw new Error(`HTTP ${res2.status}`)
          const blob2 = await res2.blob()
          if (!blob2.type.startsWith('image/')) throw new Error('Not an image')
          const url2 = URL.createObjectURL(blob2)
          prevBlobRef.current = url2
          setGeneratedUrl(url2)
          success = true
          break
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const blob = await res.blob()
        if (!blob.type.startsWith('image/')) throw new Error('Not image')

        const blobUrl = URL.createObjectURL(blob)
        prevBlobRef.current = blobUrl
        setGeneratedUrl(blobUrl)
        success = true
        break
      } catch (err) {
        console.error(`Model ${model} failed:`, err.message)
        setGenStatus(`⚠️ ลองโมเดลถัดไป...`)
      }
    }

    if (!success) {
      setLoadError(true)
    }

    setGenStatus('')
    setIsGenerating(false)
  }

  // Cleanup blob on unmount
  useEffect(() => {
    return () => { if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current) }
  }, [])

  const handleRegenerate = () => {
    setLoadError(false)
    setGeneratedUrl(null)
    setGenStatus('')
    generateImage()
  }

  const handleConfirm = () => {
    if (!generatedUrl || loadError) return
    const char = selectedChar ? AI_CHARACTERS.find(c => c.id === selectedChar) : AI_CHARACTERS[0]
    onImageGenerated(generatedUrl, char)
  }

  return (
    <div className="generate-step">
      <div className="card generate-card">
        <div className="section-title">
          <h2>🎨 ขั้นตอนที่ 2</h2>
          <p>เลือกสไตล์รูปตลกๆ สำหรับ <strong style={{ color: 'var(--pink-bright)' }}>{friendName}</strong>!</p>
        </div>

        {/* Theme Selector */}
        <div className="theme-section">
          <label className="input-label">เลือกธีมรูปตลก 🎭</label>
          <div className="theme-grid">
            {FUNNY_THEMES.map(theme => (
              <button
                key={theme.id}
                id={`theme-${theme.id}`}
                className={`theme-card ${selectedTheme === theme.id ? 'selected' : ''}`}
                onClick={() => { setSelectedTheme(theme.id); setGeneratedUrl(null); setLoadError(false) }}
              >
                <span className="theme-label">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          className="btn-primary gen-btn"
          id="btn-generate"
          onClick={generateImage}
          disabled={!selectedTheme || isGenerating}
        >
          {isGenerating ? <><div className="spinner" style={{ width: 20, height: 20, margin: 0 }} /> กำลังเจน...</> : '✨ เจนรูปตลก!'}
        </button>

        {/* Generated Image Loading */}
        {isGenerating && (
          <div className="gen-loading">
            <div className="spinner" />
            <p>{genStatus || `⏳ กำลังเจนรูป ${friendName}...`}<br/><small>อาจใช้เวลา 10-20 วินาที</small></p>
          </div>
        )}

        {/* Status during fetch (not fully loading) */}
        {!isGenerating && genStatus && !generatedUrl && (
          <div className="gen-loading">
            <p>{genStatus}</p>
          </div>
        )}

        {generatedUrl && !isGenerating && (
          <div className="gen-result">
            <div className="gen-image-wrap">
              <img
                src={generatedUrl}
                alt="generated"
                className="gen-image"
              />
              <div className="gen-image-glow" />
            </div>
            <p className="gen-caption">🎉 รูปของ {friendName} พร้อมแล้ว! ตลกมาก 😂</p>
            <button className="btn-secondary" id="btn-regen" onClick={handleRegenerate}>
              🔄 เจนใหม่อีกรอบ
            </button>
          </div>
        )}

        {loadError && !isGenerating && (
          <div className="gen-loading">
            <p className="error-msg">❌ เจนรูปไม่ได้ กรุณาลองใหม่<br/><small>อาจเกิดจากเซิร์ฟเวอร์โหลดหนักในขณะนี้</small></p>
            <button className="btn-secondary" id="btn-retry-gen" onClick={handleRegenerate}>🔄 ลองใหม่</button>
          </div>
        )}


        {/* Character Selector */}
        {generatedUrl && !loadError && (
          <div className="char-section">
            <label className="input-label">เลือก AI ที่จะจีบ {friendName} 💘</label>
            <div className="char-grid">
              {AI_CHARACTERS.map(char => (
                <button
                  key={char.id}
                  id={`char-${char.id}`}
                  className={`char-card ${selectedChar === char.id ? 'selected' : ''}`}
                  style={{ '--char-color': char.color }}
                  onClick={() => setSelectedChar(char.id)}
                >
                  <span className="char-emoji">{char.emoji}</span>
                  <span className="char-name">{char.name}</span>
                  <span className="char-desc">{char.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="gen-actions">
          <button className="btn-secondary" id="btn-back-gen" onClick={onBack}>
            ← กลับ
          </button>
          {generatedUrl && !loadError && selectedChar && (
            <button className="btn-primary" id="btn-go-flirt" onClick={handleConfirm}>
              💘 ไปจีบเลย!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
