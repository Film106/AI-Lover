import { useState, useRef, useEffect } from 'react'
import { getVastSettings, chatWithAI } from '../api'
import './components.css'

const AI_CHARACTERS = {
  male: [
    { id: 'prince', emoji: '🤴', name: 'เจ้าชาย Charming', desc: 'หล่อ หรู สุภาพ แต่แอบอสัตย์', color: '#fbbf24' },
    { id: 'romeo',  emoji: '🌹', name: 'โรมิโอ สยบสาว', desc: 'พูดโรแมนติก แต่มีพิรุธมาก', color: '#f43f5e' },
    { id: 'nerd',   emoji: '🤓', name: 'หนุ่มเนิร์ด ขาแว่น', desc: 'จีบด้วยสมการ สถิติ และ Excel', color: '#06b6d4' },
    { id: 'alien',  emoji: '👽', name: 'เอเลี่ยน Z-9', desc: 'มาจากดาวอื่น ไม่เข้าใจโลกมนุษย์', color: '#10b981' }
  ],
  female: [
    { id: 'princess',  emoji: '👸', name: 'เจ้าหญิงผู้งดงาม', desc: 'สวย หรูหรา แต่เอาแต่ใจนิดๆ', color: '#f472b6' },
    { id: 'yandere',   emoji: '🔪', name: 'สาวยันเดเระ', desc: 'รักคุณมาก... มากจนน่ากลัว', color: '#ef4444' },
    { id: 'nerd_girl', emoji: '👓', name: 'สาวแว่นหนอนหนังสือ', desc: 'ขี้อาย คุยเก่งแค่เรื่องเรียน', color: '#3b82f6' },
    { id: 'alien_girl',emoji: '🛸', name: 'เอเลี่ยนสาว Z-9', desc: 'มาจากดาวอื่น มึนๆ เอ๋อๆ', color: '#8b5cf6' }
  ]
}

const PROMPT_TEMPLATES = {
  male: [
    "masterpiece, best quality, very aesthetic, absurdres, 1boy, solo, portrait, short messy black hair, handsome, detailed eyes, looking at viewer, casual hoodie, 2d anime style, flat color, solid background",
    "masterpiece, best quality, very aesthetic, absurdres, 1boy, solo, portrait, smart looking, glasses, office shirt, gentle smile, 2d anime style, flat color",
    "masterpiece, best quality, very aesthetic, absurdres, 1boy, solo, portrait, street wear, cool expression, spiky hair, neon background, 2d anime style"
  ],
  female: [
    "masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, portrait, cute smile, long straight hair, pink dress, drooling, half-closed eyes, 2d anime style, flat color, solid background",
    "masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, portrait, short bob hair, looking shy, school uniform, detailed beautiful eyes, 2d anime style, flat color",
    "masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, portrait, elegant, wavy brown hair, elegant gown, soft lighting, 2d anime style"
  ]
};

export default function GenerateStep({ gender, friendPhoto, friendName, onImageGenerated, onBack }) {
  const [selectedChar, setSelectedChar] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [loadError, setLoadError] = useState(null)
  const [genStatus, setGenStatus] = useState('')
  const prevBlobRef = useRef(null)

  const vastUrl = getVastSettings()

  const generateImage = async () => {
    if (!vastUrl) {
      setLoadError("❌ ไม่พบ VITE_VAST_API_URL ในไฟล์ .env");
      return;
    }

    setIsGenerating(true)
    setGeneratedUrl(null)
    setLoadError(null)

    if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current)

    // สุ่ม Prompt ตามเพศเป็นค่าเริ่มต้น
    const templates = PROMPT_TEMPLATES[gender] || PROMPT_TEMPLATES.female;
    let randomPrompt = templates[Math.floor(Math.random() * templates.length)];
    const negativePrompt = "lowres, (bad), text, error, missing, extra, fewer, cropped, jpeg artifacts, worst quality, bad quality, watermark, displeasing, unfinished, chromatic aberration, scan, scan artifacts, floating hair, anti-gravity, ugly";

    try {
      // แปล Prompt ภาษาไทยเป็นอังกฤษ (ถ้ามี)
      if (userPrompt.trim()) {
        setGenStatus('🌐 กำลังแปลคำความต้องการของคุณเป็นภาษา AI...');
        try {
          const translated = await chatWithAI([{
            role: 'system', 
            content: 'You are an expert Danbooru tag generator for Stable Diffusion. Translate the user prompt into English comma-separated tags describing the subject. Exclude quality tags like masterpiece. Only return the tags, no other text.'
          }, {
            role: 'user',
            content: userPrompt.trim()
          }]);
          
          if (translated) {
            randomPrompt = `masterpiece, best quality, very aesthetic, absurdres, ${gender === 'female' ? '1girl' : '1boy'}, solo, ${translated}`;
          }
        } catch (e) {
          console.error("Translation failed:", e);
          randomPrompt = `masterpiece, best quality, very aesthetic, absurdres, ${gender === 'female' ? '1girl' : '1boy'}, solo, ${userPrompt.trim()}`;
        }
      }

      setGenStatus(`🔍 กำลังค้นหาโมเดลในเซิร์ฟเวอร์...`)

      // 1. ดึงรายชื่อโมเดลทั้งหมด
      const resModels = await fetch(`/sdapi/v1/sd-models`).catch(e => {
        throw new Error("ต่อเชื่อมเซิร์ฟเวอร์ไม่ได้ (เช็ค URL ใน .env หรืออาจเป็นปัญหา CORS)");
      });

      if (!resModels.ok) throw new Error(`ไม่สามารถโหลด Model ได้ (Code: ${resModels.status})`);
      const modelsData = await resModels.json()
      
      let selectedModel = null;
      if (Array.isArray(modelsData) && modelsData.length > 0) {
        // ล็อคเป้าใช้โมเดล Animagine XL แบบเจาะจง ถ้าไม่มีค่อยใช้ตัวแรก
        const animagineModel = modelsData.find(m => m.title.toLowerCase().includes('animaginexl'));
        selectedModel = animagineModel ? animagineModel.title : modelsData[0].title;
        setGenStatus(`🔄 ล็อคโมเดล: ${selectedModel.split('.')[0].substring(0, 18)}...`)
        
        // 2. สั่งเปลี่ยน Model
        await fetch(`/sdapi/v1/options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sd_model_checkpoint: selectedModel })
        }).catch(e => console.log('Model switch fail, continuing anyway.', e));
      }

      setGenStatus(`🎨 กำลังสเก็ตช์ภาพให้ ${friendName}...`)
      
      const isImg2Img = !!friendPhoto
      const endpoint = isImg2Img ? `/sdapi/v1/img2img` : `/sdapi/v1/txt2img`

      // 3. เจนภาพ
      const resGen = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: randomPrompt,
          negative_prompt: negativePrompt,
          steps: 28,
          width: 832,
          height: 1152,
          sampler_name: "Euler a",
          cfg_scale: 7,
          ...(isImg2Img && { 
              "init_images": [friendPhoto.split(',')[1]],
              "denoising_strength": 0.55 
          })
        })
      })
      
      if (!resGen.ok) throw new Error(`เกิดข้อผิดพลาดตอนเจนภาพ (Code: ${resGen.status})`);
      const data = await resGen.json()
      
      if (data?.images?.[0]) {
          setGeneratedUrl(`data:image/png;base64,${data.images[0]}`)
      } else {
          throw new Error("ได้ข้อมูลภาพแต่ไร้ภาพ (ลองลดขนาดภาพหรือเช็ค VRAM)");
      }
    } catch (err) {
      console.error("Vast API Error:", err)
      setLoadError(`❌ ระบบติดขัด: ${err.message}`)
    }
    
    setGenStatus('')
    setIsGenerating(false)
  }

  useEffect(() => {
    return () => { if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current) }
  }, [])

  const handleConfirm = () => {
    if (!generatedUrl || loadError) return
    const charList = AI_CHARACTERS[gender] || AI_CHARACTERS.female
    const char = selectedChar ? charList.find(c => c.id === selectedChar) : charList[0]
    onImageGenerated(generatedUrl, char)
  }

  const activeCharacters = AI_CHARACTERS[gender] || AI_CHARACTERS.female

  return (
    <div className="generate-step">
      <div className="card generate-card">
        <div className="section-title">
          <h2>🎨 ขั้นตอนที่ 2: สร้างตัวตนใหม่ให้ {friendName}</h2>
          <p>ระบบจะสุ่มสไตล์ภาพและ AI จะออกแบบให้เข้ากับแนว {gender === 'female' ? "สาวน้อยน่ารัก" : "หนุ่มมาดเท่"} อัตโนมัติ!</p>
        </div>

        {!generatedUrl && !isGenerating && (
          <div className="prompt-input-wrap" style={{marginBottom: '20px', width: '100%', textAlign: 'left'}}>
            <label className="input-label" htmlFor="user-prompt" style={{display: 'block', marginBottom: '8px'}}>
              พิมพ์บอก AI ว่าอยากได้แนวไหน (ภาษาไทยได้เลย!) ✍️
            </label>
            <textarea 
              id="user-prompt"
              className="input-field" 
              rows="3" 
              placeholder="เช่น ใส่ชุดนักเรียนญี่ปุ่น ถือไอศกรีม ยิ้มร่าเริง ฉากหลังเป็นทะเล..." 
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              style={{resize: 'none'}}
            />
            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'left'}}>
              * หรือเว้นว่างไว้ให้ช่างภาพ AI ของเราสุ่มจัดให้ก็ได้นะ!
            </p>
          </div>
        )}

        {!generatedUrl && !isGenerating && (
          <button 
            className="btn-primary gen-btn" 
            onClick={generateImage}
            style={{ padding: '18px', fontSize: '1.2rem' }}
          >
            ✨ เริ่มแปลงร่างเลย!
          </button>
        )}

        {isGenerating && (
          <div className="gen-loading">
            <div className="spinner" />
            <p style={{ marginTop: '10px', fontSize: '0.95rem' }}>{genStatus}</p>
          </div>
        )}

        {loadError && !isGenerating && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <div className="error-msg">{loadError}</div>
            <button className="btn-secondary" onClick={generateImage} style={{ marginTop: '12px' }}>
              <span style={{ marginRight: '6px' }}>🔄</span> ลองใหม่
            </button>
            <p style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              หาเซิร์ฟเวอร์ Vast.ai ไม่เจอ: <br/>ตรวจสอบว่ายิงไปที่ `{vastUrl}` สำเร็จหรือไม่
            </p>
          </div>
        )}

        {generatedUrl && (
          <div className="gen-result">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--pink-bright)', marginBottom: '4px' }}>
              แปลงโฉมเสร็จแล้ว! ✨
            </h3>
            <div className="gen-image-wrap">
              <div className="gen-image-glow" />
              <img src={generatedUrl} alt="Generated UI" className="gen-image" />
            </div>
            
            <div className="char-selection" style={{ marginTop: '16px', width: '100%' }}>
              <p className="input-label" style={{ textAlign: 'center' }}>เลือกนิสัย AI แชทของคุณ:</p>
              <div className="char-grid">
                {activeCharacters.map(c => (
                  <div 
                    key={c.id} 
                    className={`char-card ${selectedChar === c.id ? 'selected' : ''}`}
                    style={{ '--char-color': c.color }}
                    onClick={() => setSelectedChar(c.id)}
                  >
                    <span className="char-emoji">{c.emoji}</span>
                    <span className="char-name">{c.name}</span>
                    <span className="char-desc">{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="gen-actions" style={{ width: '100%', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setGeneratedUrl(null)}>
                🔄 สุ่มใหม่
              </button>
              <button className="btn-primary" onClick={handleConfirm} disabled={!selectedChar}>
                ลุยไปจีบกันเลย! 💘
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button className="btn-secondary" onClick={onBack} disabled={isGenerating}>
          ← กลับไปหน้าหลัก
        </button>
      </div>
    </div>
  )
}