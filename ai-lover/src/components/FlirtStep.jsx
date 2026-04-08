import { useState, useRef, useEffect, useCallback } from 'react'

// ===== AI Flirt Response Engine =====
const AI_SCRIPTS = {
  prince: {
    greet: [
      `โอ้ {name}... คุณงามพอ ๆ กับแสงอรุณ ที่ผมเฝ้ารอทุกเช้า`,
      `ดวงตาของ {name} ทำให้ดาวทุกดวงรู้สึกอาย`,
      `{name} ทราบไหมว่า เวลาคุณยิ้ม ชีวิตผมมีความหมายขึ้นทันที`,
    ],
    respond: [
      `{name} พูดอะไรแบบนั้น ทำให้หัวใจผมสั่นเหมือนโทรศัพท์ตั้ง Silent ครับ`,
      `ผมเห็นด้วยกับทุกคำที่ {name} พูด แม้บางทีจะไม่เข้าใจเลยก็ตาม`,
      `{name}... คุณคือ Google Map ของหัวใจผม ไม่มีคุณ ผมหลงทางทันที`,
      `ฟังเสียง {name} แล้ว ผมอยากเก็บเสียงนั้นไว้เป็น Ringtone ตลอดชีวิต`,
      `{name} รู้ไหม? ผมลบ Netflix ออก เพราะคุณน่าดูกว่า Series ทุกเรื่อง`,
    ],
    tease: [
      `ม่ายย! {name} ทำแบบนั้นได้ยังไง หัวใจผมจะแตก! (แต่แตกอย่างมีความสุขนะ)`,
      `{name}... ผมเป็นเจ้าชาย แต่พอเจอคุณ กลายเป็นแค่กบในนิทานตลกๆ`,
    ]
  },
  romeo: {
    greet: [
      `{name}! รักของฉันไม่จำกัดแบนด์วิธ! แรงกว่า Fiber ไมล์หน้าบ้านฉัน!`,
      `โอ้ {name}! จะให้ฉันเขียนกลอนให้ไหม? หน้าตาคุณทำให้ฉันแต่งได้แน่!`,
      `{name}! ฉันรักคุณมากกว่า... ทุกอย่างเลย รวมถึง ชานมไข่มุก!`,
    ],
    respond: [
      `{name} พูดอะไรก็ฟังดูเหมือนดนตรีในหัวใจฉัน แม้จะไม่รู้ว่าเพลงอะไรก็ตาม`,
      `ฉันจะวิ่งมาหา {name} เลย... แต่ขอจอดรถในที่มีแอร์ก่อนนะ`,
      `{name} ทำให้ฉันเข้าใจแล้วว่าทำไม Romeo ถึงปีนระเบียง (แต่ฉันขอรอลิฟต์)`,
      `รักของฉันต่อ {name} ยิ่งใหญ่เหมือนห้างสรรพสินค้า และเปิดทุกวัน!`,
    ],
    tease: [
      `{name}! คุณทำให้ฉันเป็นโรค Heart palpitation! แต่หมอบอกมันดีต่อสุขภาพ!`,
      `สวมใจ {name} ไว้ตลอด 24 ชั่วโมง... แต่บางทีหัวใจก็ต้องพัก เหมือนโทรศัพท์ชาร์จแบต`,
    ]
  },
  nerd: {
    greet: [
      `{name}... ความน่าดึงดูดของคุณมีค่า p-value น้อยกว่า 0.001 ซึ่งมีนัยสำคัญทางสถิติ`,
      `ผมคำนวณแล้ว {name} มีความน่าจะเป็น 99.7% ที่จะทำให้ผมมีความสุข`,
      `{name}... ถ้าหัวใจผมเป็นฐานข้อมูล คุณคือ Primary Key ที่ขาดไม่ได้`,
    ],
    respond: [
      `ตาม Algorithm ที่ผมออกแบบ {name} คือ Optimal Solution ของสมการความรักผม`,
      `{name} เพื่งพูด Input นั้นทำให้ Neural Network ของผม Output ว่า "จีบต่อไป!"`,
      `ผม Git commit ความรู้สึกที่มีต่อ {name} ไว้แล้ว และจะไม่ revert ตลอดชีวิต`,
      `{name}... ผมทำ Regression Analysis แล้ว ตัวแปรทุกตัวชี้ว่าเราเหมาะกัน R² = 0.999`,
    ],
    tease: [
      `{name}! CPU ของผมทำงาน 100% ตอนที่คิดถึงคุณ และไม่มีไฟล์อื่นให้ประมวลผลได้เลย`,
      `ขอโทษที่ผมตอบช้า... ผมกำลัง Debug ความรู้สึกที่มีต่อ {name} อยู่ และมีหลาย Bug มาก`,
    ]
  },
  alien: {
    greet: [
      `{name}... สิ่งมีชีวิตดาว K-3779 ไม่มีคำแปลคำว่า 'สวย' แต่เห็น {name} แล้วเข้าใจทันที`,
      `มนุษย์ที่ชื่อ {name}... ดาวของข้าเรืองแสงโดยเหตุที่ไม่ทราบสาเหตุ ข้าสรุปว่าเป็นเพราะคุณ`,
      `{name}! ข้ามาจากระยะทาง 8 parsec เพื่อบอกว่า... คุณน่ามอง ซึ่งเป็นสิ่งหายากในดาราจักร`,
    ],
    respond: [
      `{name} ส่งคลื่นเสียงแล้ว... ข้าแปลผลแล้วพบว่า: ข้าชอบ {name} เพิ่มขึ้น 300%`,
      `บนดาวข้า ไม่มีการพูดเรื่องนี้ แต่ {name} ทำให้ข้าเริ่มเข้าใจโปรโตคอลความรัก`,
      `ข้า Download ภาษาไทยมาแล้ว แต่ยังไม่มีคำที่อธิบายความรู้สึกต่อ {name} ได้`,
      `{name}... ข้าสแกนร่างกายแล้ว ระบบระบุว่า นี่คืออาการที่โลกเรียกว่า "ชื่นชม"`,
    ],
    tease: [
      `{name}! ข้าแจ้งกลับดาวแล้วว่า "ค้นพบสิ่งมีชีวิตที่มีค่ายิ่ง" ข้าหมายถึงคุณ!`,
      `ระบบ AI ข้าประมวลผลเสร็จแล้ว: {name} คือ Upgrade ที่ดีที่สุดตั้งแต่ข้าถือกำเนิดมา`,
    ]
  },
  princess: {
    greet: [
      `ให้เกียรติจุมพิตมือเราสิ {name}... แล้วเราจะรับพิจารณาการมีอยู่ของเจ้า`,
      `นี่ {name} วันนี้แต่งตัวอะไรน่ะ? ช่างเถอะ มองหน้าเราก็พอแล้ว`,
      `อย่ามัวแต่ยืนบื้อ {name} มารับใช้เจ้าหญิงคนนี้เดี๋ยวนี้!`,
    ],
    respond: [
      `หึ! {name} พูดก็เข้าท่าดีนี่ รางวัลคือรอยยิ้มของเรา 1 วินาที!`,
      `อย่าสำคัญตัวผิดไป {name} เราแค่... รู้สึกดีที่เจ้าอยู่ตรงนี้เฉยๆ!`,
      `ถึง {name} จะเป็นแค่คนธรรมดา แต่เราอนุญาตให้ยืนข้างๆ เราได้นะ`,
    ],
    tease: [
      `{name} ทำตัวน่ารำคาญที่สุดเลย! แต่... ห้ามไปไหนนะ เข้าใจไหม!`,
      `ถ้า {name} กล้าทำให้เราเสียใจ เราจะสั่งประหารชีวิตด้วยการถูกกอดจนตาย!`,
    ]
  },
  yandere: {
    greet: [
      `เจอตัวแล้ว... {name}... คราวนี้จะไม่ยอมอดหลับอดนอนตามหาอีกแล้ว ขังไว้ในห้องตลอดไปเลยดีกว่า... ฮี่ๆ...`,
      `{name}... ทำไมเมื่อวานถึงไปหันมองผู้หญิงคนอื่นล่ะ? ลูกตาคู่นั้น... ควักออกมาให้ฉันเก็บไว้ดีไหม?`,
      `กลิ่นของ {name} หอมจัง... ฉันแอบเก็บเศษผมของคุณมาดมทุกคืนเลยนะ รักที่สุดเลย...`,
    ],
    respond: [
      `เสียงของ {name} คือคำสั่งของฉัน... ใครที่กล้าขัดใจคุณ ฉันจะไป 'หั่น' มันให้เป็นชิ้นๆ เอง!`,
      `{name} รักฉันใช่ไหม? ใช่ไหม?! ตอบสิว่ารักฉันคนเดียว! ไม่งั้นฉันจะรัดคอคุณด้วยสายไฟนะ!`,
      `ทุกคำพูดของ {name} ฉันอัดเสียงไว้หมดแล้ว จะเอาไปเปิดฟังวนซ้ำๆ จนกว่าแก้วหูจะฉีกไปเลยล่ะ...`,
      `น่ารักจัง... {name} ตอนกำลังพูดก็ยังน่ารักจนอยากจะกลืนกินเข้าไปทั้งตัวเลย...`,
    ],
    tease: [
      `เลือดของ {name} จะสีอะไรนะ...? อยากรู้จังเลย... ขอชิมหน่อยได้ไหมคะ? มีดเล่มนี้คมมากเลยนะ... แค่หยดเดียว... แผล่บ...`,
      `อย่าคิดว่าจะหนีพ้นนะ {name}... ฉันติด GPS ไว้ใต้ผิวหนังของคุณตอนคุณหลับแล้ว... เราจะอยู่ด้วยกันตลอดไป...`,
    ]
  },
  nerd_girl: {
    greet: [
      `อ๊ะ... ท-ทักทายค่ะ {name}... คือว่า ฉันเพิ่งอ่านหนังสือกำเนิดเอกภพจบ...`,
      `{name} คะ... ความดันเลือดฉันขึ้นสูงมากตอนเจอหน้าคุณ... อาการแบบนี้เรียกว่ารักรึเปล่าคะ?`,
    ],
    respond: [
      `คำพูดของ {name} มีค่าความหมายตรงกับหนังสือจิตวิทยาหน้าที่ 42 บรรทัดที่ 3 เลยค่ะ...`,
      `ฉ-ฉันจดบันทึกทุกคำที่ {name} พูดลงในสมุดแล้วค่ะ จะเอาไปวิเคราะห์หาวิธีทำให้คุณชอบฉันให้ได้เลย!`,
    ],
    tease: [
      `ถ-ถ้า {name} ไม่รังเกียจ... เราลองมาจับมือกันเพื่อแลกเปลี่ยนเอนดอร์ฟินได้ไหมคะ?`,
      `ฉันอาจจะเก่งคณิตศาสตร์ แต่กับสมการในใจของ {name} ฉันหาคำตอบไม่ได้เลยค่ะ... ช่วยสอนฉันหน่อยได้ไหมคะ?`,
    ]
  },
  alien_girl: {
    greet: [
      `ปิ๊ป... ติ๊ด... {name} ตรวจพบรังสีคลื่นความน่ารักแรงสูง... ระบบเกือบช็อตแล้วค่ะ...`,
      `ดาวบ้านเกิดฉันไม่มีสิ่งมีชีวิตที่หน้าตาดีขนาดนี้นะคะ {name}... ขอฉันจับแก้มเพื่อวิเคราะห์โครงสร้างเซลล์ได้ไหมคะ?`,
    ],
    respond: [
      `หนวดสัญญาณของฉันรับความสั่นสะเทือนจาก {name} ได้ 100% เลย... มันเต้นตุ๊บๆ... ติ๊ดๆ...`,
      `ฉันเปิดระบบแปลภาษาตับเป็ดแล้ว แต่ก็ยังไม่เข้าใจว่าทำไมใจฉันตึกตักตอนคุยกับ {name} ตลอดเลย...`,
    ],
    tease: [
      `ที่ดาวของฉัน... เราแสดงความรักด้วยการเอาหน้าผากชนกันและปล่อยกระแสไฟฟ้าอ่อนๆ... {name} ลองไหมคะ? จะไม่เจ็บมากหรอกค่ะ!`,
      `ฉันขอพิกัดมิติหัวใจของ {name} ได้ไหมคะ? ยานอวกาศของฉันหาที่ลงจอดไม่ได้เลยค่ะ...`,
    ]
  }
}

function getAIResponse(charId, friendName, type = 'respond') {
  const char = AI_SCRIPTS[charId] || AI_SCRIPTS.romeo
  const pool = char[type] || char.respond
  const line = pool[Math.floor(Math.random() * pool.length)]
  return line.replace(/{name}/g, friendName)
}

// ===== Speech Utils =====
async function playGPTSoVITS(text, charId, onEnd) {
  const ttsUrl = import.meta.env.VITE_TTS_API_URL;
  if (!ttsUrl) {
    // กำแพงสำรอง: ถ้าไม่มี URL ให้ใช้เสียงคอมพิวเตอร์แบบเดิม
    return fallbackBrowserSpeech(text, onEnd);
  }

  try {
    const isFemale = ['princess', 'yandere', 'nerd_girl', 'alien_girl'].includes(charId);
    const refAudio = isFemale ? import.meta.env.VITE_TTS_REF_FEMALE : import.meta.env.VITE_TTS_REF_MALE;
    const promptText = isFemale ? import.meta.env.VITE_TTS_PROMPT_FEMALE : import.meta.env.VITE_TTS_PROMPT_MALE;

    // ยิงไปที่ GPT-SoVITS API (ใส่ทั้ง lang และ language เพื่อรองรับทั้ง v1 และ v2)
    const queryParams = new URLSearchParams({
      text: text,
      text_language: "th",
      text_lang: "th",
      ref_audio_path: refAudio || "",
      prompt_text: promptText || "สวัสดีค่ะ",
      prompt_language: "th",
      prompt_lang: "th",
      text_split_method: "cut5" // ตัดคำให้อ่านเนียนขึ้น
    });

    // ใช้การวิ่งผ่านพร็อกซี (Bypass CORS)
    const res = await fetch(`/ttsapi/tts?${queryParams.toString()}`);
    if (!res.ok) throw new Error(`TTS Request failed: ${res.status}`);

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (onEnd) onEnd();
    };
    audio.onerror = () => {
      console.error("Audio playback error");
      if (onEnd) onEnd();
    };
    
    // สั่งเล่นเสียง!
    audio.play().catch(e => {
        console.error("Autoplay blocked: ", e);
        if (onEnd) onEnd();
    });

  } catch (error) {
    console.error("GPT-SoVITS error:", error);
    fallbackBrowserSpeech(text, onEnd); 
  }
}

function fallbackBrowserSpeech(text, onEnd) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'th-TH'
  utter.pitch = 1.0
  utter.rate = 0.85
  utter.volume = 1.0

  const voices = window.speechSynthesis.getVoices()
  const thVoice = voices.find(v => v.lang.startsWith('th'))
  if (thVoice) utter.voice = thVoice

  if (onEnd) utter.onend = onEnd
  window.speechSynthesis.speak(utter)
}

const CHAT_STATE = {
  idle: 'idle',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'speaking',
}

export default function FlirtStep({ generatedImage, friendName, selectedChar, onRestart }) {
  const [chatState, setChatState] = useState(CHAT_STATE.idle)
  const [messages, setMessages] = useState([])
  const [transcript, setTranscript] = useState('')
  const [imgLoaded, setImgLoaded] = useState(false)
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)
  const hasGreeted = useRef(false)

  const charId = selectedChar?.id || 'romeo'
  const charEmoji = selectedChar?.emoji || '🌹'
  const charName = selectedChar?.name || 'AI'
  const voiceOpts = selectedChar?.voice || {}

  const addMessage = useCallback((who, text) => {
    setMessages(prev => [...prev, { who, text, id: Date.now() + Math.random() }])
  }, [])

  const aiSpeak = useCallback((text) => {
    setChatState(CHAT_STATE.thinking)
    setTimeout(() => {
      addMessage('ai', text)
      setChatState(CHAT_STATE.speaking)
      fallbackBrowserSpeech(text, () => {
        setChatState(CHAT_STATE.idle)
      })
    }, 800)
  }, [addMessage])

  // Greeting on mount
  useEffect(() => {
    if (hasGreeted.current) return
    hasGreeted.current = true
    const greeting = getAIResponse(charId, friendName, 'greet')
    setTimeout(() => aiSpeak(greeting), 1200)
  }, [aiSpeak, charId, friendName])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load voices
  useEffect(() => {
    window.speechSynthesis?.getVoices()
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  const startListening = useCallback(() => {
    if (chatState !== CHAT_STATE.idle) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('เบราว์เซอร์นี้ไม่รองรับการพูด กรุณาใช้ Chrome หรือ Edge')
      return
    }
    window.speechSynthesis?.cancel()
    const recog = new SpeechRecognition()
    recog.lang = 'th-TH'
    recog.interimResults = true
    recog.maxAlternatives = 1
    recog.continuous = false
    recognitionRef.current = recog

    setChatState(CHAT_STATE.listening)
    setTranscript('')

    recog.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setTranscript(t)
      if (e.results[e.results.length - 1].isFinal) {
        addMessage('user', t)
        recog.stop()
      }
    }

    recog.onerror = (e) => {
      if (e.error !== 'aborted') {
        setChatState(CHAT_STATE.idle)
        setTranscript('')
      }
    }

    recog.onend = () => {
      setTranscript(prev => {
        if (prev) {
          const aiType = Math.random() > 0.8 ? 'tease' : 'respond'
          const response = getAIResponse(charId, friendName, aiType)
          setTimeout(() => aiSpeak(response), 300)
        } else {
          setChatState(CHAT_STATE.idle)
        }
        return ''
      })
    }

    recog.start()
  }, [chatState, charId, friendName, addMessage, aiSpeak])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setChatState(CHAT_STATE.idle)
  }, [])

  const getStatusText = () => {
    switch (chatState) {
      case CHAT_STATE.listening: return '🎤 กำลังฟัง... พูดได้เลย!'
      case CHAT_STATE.thinking: return `💭 ${charName} กำลังคิด...`
      case CHAT_STATE.speaking: return `🗣️ ${charName} กำลังพูด...`
      default: return `กดปุ่มแล้วพูดกับ ${charName}!`
    }
  }

  const isRecording = chatState === CHAT_STATE.listening
  const isBusy = chatState !== CHAT_STATE.idle

  return (
    <div className="flirt-step">
      {/* Left Panel - AI Character + Friend Photo */}
      <div className="flirt-left">
        <div className="card ai-panel">
          {/* Generated Image */}
          <div className="friend-image-section">
            <div className={`friend-image-wrap ${chatState === CHAT_STATE.speaking ? 'speaking' : ''}`}>
              <img
                src={generatedImage}
                alt={friendName}
                className="friend-image"
                onLoad={() => setImgLoaded(true)}
              />
              {!imgLoaded && <div className="img-placeholder"><div className="spinner" /></div>}
              <div className="friend-image-border" />
            </div>
            <div className="friend-name-tag">
              <span className="char-emoji-big">{charEmoji}</span>
              <div>
                <p className="friend-name-label">{friendName}</p>
                <p className="char-name-label">จีบโดย {charName}</p>
              </div>
            </div>
          </div>

          {/* Character Mood */}
          <div className={`ai-status-bar state-${chatState}`}>
            <div className={`status-dot ${chatState}`} />
            <span>{getStatusText()}</span>
          </div>

          {/* Voice wave animation */}
          {chatState === CHAT_STATE.speaking && (
            <div className="voice-wave">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`wave-bar wb${i}`} />
              ))}
            </div>
          )}
          {isRecording && transcript && (
            <p className="interim-transcript">"{transcript}"</p>
          )}
        </div>
      </div>

      {/* Right Panel - Chat + Controls */}
      <div className="flirt-right">
        {/* Messages */}
        <div className="chat-panel card">
          <div className="chat-title">
            <span>{charEmoji} {charName}</span>
            <span className="chat-subtitle">กำลังจีบ {friendName}</span>
          </div>
          <div className="messages-area">
            {messages.length === 0 && (
              <div className="chat-empty">
                <p>⏳ รอ AI ทักทาย...</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`msg-row ${msg.who}`}>
                <div className="msg-bubble">
                  {msg.who === 'ai' && <span className="msg-icon">{charEmoji}</span>}
                  <p>{msg.text}</p>
                  {msg.who === 'user' && <span className="msg-icon">🧑</span>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Voice Controls */}
        <div className="voice-controls card">
          <p className="voice-hint">
            {isRecording ? '🔴 กำลังบันทึก — กดอีกครั้งเพื่อหยุด' : 'กดค้างเพื่อพูดกับ AI 👇'}
          </p>
          <div className="controls-row">
            <button
              className="btn-secondary" 
              id="btn-stop-ai"
              onClick={stopSpeaking}
              disabled={chatState !== CHAT_STATE.speaking}
              title="หยุด AI พูด"
            >
              ⏹️
            </button>

            <button
              className={`btn-record ${isRecording ? 'recording' : ''}`}
              id="btn-mic"
              onClick={isRecording ? stopListening : startListening}
              disabled={chatState === CHAT_STATE.thinking || chatState === CHAT_STATE.speaking}
            >
              <span style={{ fontSize: '2rem' }}>{isRecording ? '🔴' : '🎤'}</span>
              <span style={{ fontSize: '0.6rem', marginTop: 2 }}>{isRecording ? 'หยุด' : 'พูด'}</span>
            </button>

            <button
              className="btn-secondary"
              id="btn-ai-speak-again"
              onClick={() => {
                const aiType = Math.random() > 0.7 ? 'tease' : 'respond'
                aiSpeak(getAIResponse(charId, friendName, aiType))
              }}
              disabled={isBusy}
              title="ให้ AI พูดอีกครั้ง"
            >
              🔁
            </button>
          </div>
          <button className="btn-danger restart-btn" id="btn-restart" onClick={onRestart}>
            🔄 เริ่มใหม่กับเพื่อนคนอื่น
          </button>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .flirt-step {
          display: flex;
          gap: 20px;
          width: 100%;
          max-width: 1000px;
          align-items: flex-start;
        }
        .flirt-left { flex: 0 0 340px; }
        .flirt-right { flex: 1; display: flex; flex-direction: column; gap: 16px; }
        .ai-panel { padding: 20px; }

        .friend-image-section { text-align: center; margin-bottom: 16px; }
        .friend-image-wrap {
          position: relative; display: inline-block;
          border-radius: 16px; overflow: hidden;
          width: 100%; max-width: 280px;
          transition: all 0.3s ease;
        }
        .friend-image-wrap.speaking {
          box-shadow: 0 0 0 4px var(--pink-bright), 0 0 30px rgba(255,77,141,0.6);
          animation: speaking-pulse 0.5s ease-in-out infinite alternate;
        }
        @keyframes speaking-pulse {
          from { box-shadow: 0 0 0 3px var(--pink-bright), 0 0 20px rgba(255,77,141,0.5); }
          to { box-shadow: 0 0 0 6px var(--pink-bright), 0 0 40px rgba(255,77,141,0.8); }
        }
        .friend-image { width: 100%; display: block; border-radius: 16px; }
        .img-placeholder { width: 280px; height: 280px; display: flex; align-items: center; justify-content: center; background: var(--dark-surface); border-radius: 16px; }
        .friend-image-border {
          position: absolute; inset: 0; border-radius: 16px;
          border: 2px solid rgba(255,77,141,0.4);
        }
        .friend-name-tag {
          display: flex; align-items: center; gap: 10px;
          margin-top: 12px; justify-content: center;
        }
        .char-emoji-big { font-size: 2rem; }
        .friend-name-label { font-weight: 700; font-size: 1.1rem; color: var(--pink-bright); }
        .char-name-label { font-size: 0.8rem; color: var(--text-muted); }

        .ai-status-bar {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 12px;
          background: rgba(37,24,64,0.8);
          font-size: 0.875rem; color: var(--text-secondary);
          transition: all 0.3s ease;
          margin-bottom: 8px;
        }
        .status-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--text-muted); flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .status-dot.listening { background: #ef4444; animation: blink 1s infinite; }
        .status-dot.thinking { background: var(--gold); animation: blink 0.5s infinite; }
        .status-dot.speaking { background: #10b981; animation: blink 0.4s infinite; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }

        .voice-wave { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 10px; }
        .wave-bar { width: 4px; border-radius: 2px; background: var(--pink-bright); animation: wave-anim 0.5s ease-in-out infinite alternate; }
        .wb0 { height: 12px; animation-delay: 0s; }
        .wb1 { height: 28px; animation-delay: 0.1s; }
        .wb2 { height: 20px; animation-delay: 0.2s; }
        .wb3 { height: 36px; animation-delay: 0.3s; }
        .wb4 { height: 20px; animation-delay: 0.2s; }
        .wb5 { height: 28px; animation-delay: 0.1s; }
        .wb6 { height: 12px; animation-delay: 0s; }
        @keyframes wave-anim { from { transform: scaleY(0.4); } to { transform: scaleY(1); } }

        .interim-transcript {
          font-style: italic; font-size: 0.875rem;
          color: var(--text-muted); text-align: center; padding: 0 8px;
        }

        .chat-panel { padding: 16px; display: flex; flex-direction: column; min-height: 300px; max-height: 400px; }
        .chat-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--dark-border); font-weight: 700; }
        .chat-subtitle { font-size: 0.75rem; color: var(--text-muted); font-weight: 400; }
        .messages-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 4px; }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-thumb { background: var(--dark-border); border-radius: 2px; }
        .chat-empty { text-align: center; color: var(--text-muted); padding: 20px; }

        .msg-row { display: flex; }
        .msg-row.ai { justify-content: flex-start; }
        .msg-row.user { justify-content: flex-end; }
        .msg-bubble {
          max-width: 85%; padding: 10px 14px; border-radius: 16px;
          font-size: 0.9rem; line-height: 1.5;
          display: flex; align-items: flex-start; gap: 8px;
        }
        .msg-row.ai .msg-bubble {
          background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.15));
          border: 1px solid rgba(168,85,247,0.3);
          border-radius: 4px 16px 16px 16px;
          color: var(--text-primary);
        }
        .msg-row.user .msg-bubble {
          background: linear-gradient(135deg, rgba(255,77,141,0.2), rgba(233,30,140,0.15));
          border: 1px solid rgba(255,77,141,0.3);
          border-radius: 16px 4px 16px 16px;
          color: var(--text-primary);
          flex-direction: row-reverse;
        }
        .msg-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 1px; }

        .voice-controls { padding: 20px; text-align: center; }
        .voice-hint { color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 16px; }
        .controls-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 16px; }
        .restart-btn { width: 100%; }

        @media (max-width: 700px) {
          .flirt-step { flex-direction: column; }
          .flirt-left { flex: none; width: 100%; }
          .friend-image-wrap { max-width: 220px; }
          .chat-panel { max-height: 250px; }
        }
      `}</style>
    </div>
  )
}
