import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Settings, Heart, PartyPopper, RefreshCw, Mic, MicOff } from "lucide-react";
import { saveSettings } from "./api";
import CameraStep from "./components/CameraStep";
import GenerateStep from "./components/GenerateStep";
import './App.css';

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────
async function getAIReply(userMessage, conversationHistory, gender, mode) {
  const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!API_KEY) throw new Error("ไม่มี API Key — ตั้งค่าใน Settings ก่อน!");

  const API_URL = import.meta.env.VITE_API_BASE_URL || "https://openrouter.ai/api/v1/chat/completions";
  const MODEL = import.meta.env.VITE_CHAT_MODEL || import.meta.env.VITE_OPENROUTER_CHAT_MODEL || "google/gemma-3-12b-it:free";

  const personas = {
    sweet: {
      female: "คุณคือ AI สาวน้อยน่ารัก อ่อนหวาน ขี้อาย คลั่งรัก ใช้ 'เค้า' 'หนู' 'พี่' ลงท้าย 'ค่ะ' 'นะคะ'",
      male:   "คุณคือ AI หนุ่มหล่อ อบอุ่น สุภาพ เอาใจเก่ง ใช้ 'ผม' 'ที่รัก' ลงท้าย 'ครับ'"
    },
    medium: {
      female: "คุณคือ AI สาววัยรุ่น คุยเหมือนเพื่อน เล่นตัวบ้าง ร่าเริง ใช้ 'เรา' 'แก'",
      male:   "คุณคือ AI หนุ่มมาดกวน ขี้เล่น เป็นกันเอง ใช้ 'เรา' 'แก' 'นาย'"
    },
    hardcore: {
      female: "คุณคือ AI สาวปากแจ๋ว กวนตีน ซีนเดเระ ใช้ 'แก' 'ฉัน' 'มึง' ไม่สุภาพ",
      male:   "คุณคือ AI หนุ่มทรงโจร กวนตีน ปากร้าย หยิ่ง ใช้ 'มึง' 'กู'"
    }
  };
  const scorings = {
    sweet:    "ให้คะแนนง่ายมาก (+5 ถึง +15) ถ้าน่ารักและเอาใจ",
    medium:   "ให้คะแนนปานกลาง (+2 ถึง +8) ถ้าแป้กหักออก (-2 ถึง 0)",
    hardcore: "ให้คะแนนยากมาก ต้องจีบเทพจริงๆ (+1 ถึง +5) ถ้าห่วยหักหนัก (-1 ถึง -5)"
  };

  const systemPrompt = `${personas[mode]?.[gender] || personas.hardcore.female}
กฎ: ตอบ 1-3 ประโยค เหมือนแชทจริงๆ ใช้ comma/จุดไข่ปลาเพื่อหยุดหายใจ
คะแนน: ${scorings[mode] || scorings.hardcore}
ตอบเป็น JSON เท่านั้น: {"reply": "...", "score_change": 0}`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "AI Lover"
    },
    body: JSON.stringify({ model: MODEL, messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage }
    ], temperature: 0.85 }),
  });
  const data = await response.json();
  const match = data.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/);
  if (!match) return { reply: "เอ่อ...😅", score_change: 0 };
  return JSON.parse(match[0]);
}

function speakText(text, gender) {
  if (!window.speechSynthesis) return;
  const clean = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}]/gu, '').replace(/[|#$]/g, ' ').trim();
  if (!clean) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(clean);
  const voices = window.speechSynthesis.getVoices();
  utter.voice = voices.find(v => v.lang.startsWith("th")) || voices[0];
  utter.lang = "th-TH";
  utter.pitch = gender === 'female' ? 1.25 : 0.88;
  utter.rate  = 0.95;
  window.speechSynthesis.speak(utter);
}

const formatTime = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

// ─────────────────────────────────────────────
// LANDING SCREEN
// ─────────────────────────────────────────────
function LandingScreen({ onStart, onOpenSettings }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="landing-bg">
      {/* Animated particles */}
      <div className="landing-particles" aria-hidden="true">
        {['💖','✨','💜','🌸','💘','💫','💕','🌠','💝','💌'].map((e, i) => (
          <span key={i} className="particle" style={{ '--i': i, '--total': 10 }}>{e}</span>
        ))}
      </div>

      <div className="landing-card">
        {/* Top badge */}
        <div className="landing-badge">
          <span>✨</span> AI Dating App
        </div>

        {/* Title */}
        <h1 className="landing-title">AI Lover</h1>
        <p className="landing-sub">
          ถ่ายรูปเพื่อน → ให้ AI วาดใหม่ → แล้วให้ AI จีบเพื่อนคุณ!
        </p>

        {/* Steps hint */}
        <div className="landing-steps">
          <div className="step-item"><span className="step-num">1</span><span>📸 ถ่ายรูปเพื่อน</span></div>
          <div className="step-arrow">→</div>
          <div className="step-item"><span className="step-num">2</span><span>🎨 AI วาดรูปใหม่</span></div>
          <div className="step-arrow">→</div>
          <div className="step-item"><span className="step-num">3</span><span>💘 AI จีบเพื่อน</span></div>
        </div>

        {/* Gender buttons */}
        <p className="landing-choose">เลือก AI ที่จะจีบเพื่อนของคุณ</p>
        <div className="landing-btns">
          <button
            id="btn-start-female"
            className={`gender-btn gender-btn--female ${hovered === 'female' ? 'hovered' : ''}`}
            onMouseEnter={() => setHovered('female')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onStart('female')}
          >
            <span className="gender-emoji">🌸</span>
            <span className="gender-name">สาวนุ้ย</span>
            <span className="gender-eng">Female AI</span>
          </button>

          <button
            id="btn-start-male"
            className={`gender-btn gender-btn--male ${hovered === 'male' ? 'hovered' : ''}`}
            onMouseEnter={() => setHovered('male')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onStart('male')}
          >
            <span className="gender-emoji">💙</span>
            <span className="gender-name">พี่บ่าว</span>
            <span className="gender-eng">Male AI</span>
          </button>
        </div>



        <p className="landing-footer">
          ไม่เก็บข้อมูล · ประมวลผลด้วย AI
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DATING / CHAT SCREEN
// ─────────────────────────────────────────────
function DatingScreen({ gender, avatarUrl, friendName, onReset, onSuccess, onOpenSettings }) {
  const [conversation, setConversation] = useState([
    { role: "assistant", content: gender === 'female'
        ? `สวัสดีค่ะ... 😳 ${friendName} น่ะ หน้าตาน่ารักนะ`
        : `เฮ้ ${friendName}! มีอะไรให้ผมช่วยไหมครับ 😏` 
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [mode, setMode] = useState("hardcore");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (score >= 100) setTimeout(() => onSuccess(seconds, conversation.length), 1200);
  }, [score]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation]);
  useEffect(() => { if (!isThinking) inputRef.current?.focus(); }, [isThinking]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isThinking || score >= 100) return;
    setIsThinking(true);
    setConversation(prev => [...prev, { role: "user", content: text }]);
    try {
      const { reply, score_change } = await getAIReply(text, conversation, gender, mode);
      setScore(prev => Math.min(100, Math.max(0, prev + score_change)));
      setConversation(prev => [...prev, { role: "assistant", content: reply }]);
      speakText(reply, gender);
    } catch {
      setConversation(prev => [...prev, { role: "assistant", content: "สัญญาณหาย... 😵‍💫" }]);
    } finally { setIsThinking(false); }
  }, [conversation, gender, mode, isThinking, score]);

  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('เบราว์เซอร์ไม่รองรับ ใช้ Chrome หรือ Edge'); return; }
    const rec = new SR();
    rec.lang = 'th-TH'; rec.interimResults = false;
    rec.onresult = e => sendMessage(e.results[0][0].transcript);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [sendMessage]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const scoreColor = score < 30 ? '#6b7280' : score < 60 ? var_('--gold') : score < 85 ? var_('--pink-bright') : '#10b981';

  return (
    <div className="dating-bg">
      <div className="dating-card">
        {/* Header bar */}
        <div className="dating-header">
          <button className="dating-back-btn" onClick={onReset} title="กลับ">‹ กลับ</button>
          
          <div className="dating-score-area">
            <Heart size={13} className="dating-heart" style={{ color: score > 50 ? 'var(--pink-bright)' : 'var(--text-muted)' }} />
            <div className="score-bar-wrap">
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${score}%` }} />
              </div>
              <span className="score-num">{score}/100</span>
            </div>
          </div>

          <div className="dating-header-right">
            <span className="dating-timer">⏱ {formatTime(seconds)}</span>
            <select
              value={mode}
              onChange={e => { setMode(e.target.value); setScore(0); }}
              className="mode-select"
            >
              <option value="sweet">💖 หวาน</option>
              <option value="medium">💬 กลาง</option>
              <option value="hardcore">🔥 โหด</option>
            </select>
          </div>
        </div>

        {/* Avatar */}
        <div className="dating-avatar-area">
          <div className="avatar-glow" style={{ opacity: score > 60 ? 1 : 0.3 }} />
          <div className="avatar-wrap">
            <img src={avatarUrl} alt={friendName} className="ai-avatar-img" />
            {isThinking && <div className="thinking-overlay">💭</div>}
          </div>
          <div className="avatar-name-tag">
            <span className="avatar-friend-name">{friendName}</span>
            <span className={`avatar-status ${isThinking ? 'thinking' : 'online'}`}>
              {isThinking ? 'กำลังพิมพ์...' : '● ออนไลน์'}
            </span>
          </div>
        </div>

        {/* Conversation */}
        <div className="messages-area custom-scrollbar">
          {conversation.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
              <div className="msg-bubble">
                {msg.role === 'ai' && <span className="msg-icon">{gender === 'female' ? '👧' : '👦'}</span>}
                <p>{msg.content}</p>
                {msg.role === 'user' && <span className="msg-icon">🧑</span>}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form className="dating-input-form" onSubmit={e => { e.preventDefault(); sendMessage(inputText); setInputText(""); }}>
          <input
            ref={inputRef}
            className="dating-input"
            placeholder={score >= 100 ? '🎉 จีบติดแล้ว!' : 'พิมพ์จีบเลย...'}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isThinking || score >= 100}
          />
          <button
            type="button"
            className={`btn-voice ${isListening ? 'active' : ''}`}
            onMouseDown={startVoice}
            onMouseUp={stopVoice}
            onTouchStart={e => { e.preventDefault(); startVoice(); }}
            onTouchEnd={e => { e.preventDefault(); stopVoice(); }}
            disabled={isThinking || score >= 100}
            title="กดค้างเพื่อพูด"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            type="submit"
            className="btn-send"
            disabled={!inputText.trim() || isThinking || score >= 100}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

// dummy helper — CSS variables in JS
function var_(name) { return `var(${name})`; }

// ─────────────────────────────────────────────
// SUCCESS SCREEN
// ─────────────────────────────────────────────
function SuccessScreen({ timeSpent, totalLines, gender, onReset }) {
  return (
    <div className="success-bg">
      <div className="success-confetti" aria-hidden="true">
        {['🎉','💖','🥳','💐','✨','🎊','😍','💘','🌟','🎆'].map((e, i) => (
          <span key={i} className="confetti-piece" style={{ '--i': i }}>{e}</span>
        ))}
      </div>
      <div className="success-card">
        <div className="success-icon-wrap">
          <PartyPopper size={52} className="success-icon" />
        </div>
        <h2 className="success-title">จีบติดแล้ว! 🎉</h2>
        <p className="success-sub">
          {gender === 'female' ? 'คุณพิชิตใจสาวน้อยสำเร็จ 💖' : 'คุณพิชิตใจหนุ่มหล่อสำเร็จ 💙'}
        </p>
        <div className="success-stats">
          <div className="stat-box">
            <span className="stat-label">เวลาที่ใช้</span>
            <span className="stat-value">{formatTime(timeSpent)}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-box">
            <span className="stat-label">โต้ตอบกัน</span>
            <span className="stat-value">{totalLines} <small>ครั้ง</small></span>
          </div>
        </div>
        <button className="success-replay-btn" onClick={onReset}>
          <RefreshCw size={18} /> เล่นอีกครั้ง
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [gender, setGender] = useState('female');
  const [friendPhoto, setFriendPhoto] = useState(null);
  const [friendName, setFriendName] = useState("");
  const [aiAvatar, setAiAvatar] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [stats, setStats] = useState({ time: 0, lines: 0 });

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', () => window.speechSynthesis.getVoices());
  }, []);

  const handleStart = (g) => { setGender(g); setScreen("camera"); };
  const handlePhotoTaken = (photo, name) => { setFriendPhoto(photo); setFriendName(name); setScreen("generate"); };
  const handleImageGenerated = (url) => { setAiAvatar(url); setScreen("dating"); };
  const handleSuccess = (t, l) => { setStats({ time: t, lines: l }); setScreen("success"); };
  const handleReset = () => { setScreen("landing"); setFriendPhoto(null); setFriendName(""); setAiAvatar(null); };

  return (
    <>
      {screen === "landing"  && <LandingScreen onStart={handleStart} onOpenSettings={() => setIsSettingsOpen(true)} />}
      {screen === "camera"   && (
        <div className="page-bg">
          <CameraStep onPhotoTaken={handlePhotoTaken} />
        </div>
      )}
      {screen === "generate" && (
        <div className="page-bg">
          <GenerateStep
            gender={gender}
            friendPhoto={friendPhoto}
            friendName={friendName}
            onImageGenerated={handleImageGenerated}
            onBack={() => setScreen("camera")}
          />
        </div>
      )}
      {screen === "dating"   && (
        <DatingScreen
          gender={gender}
          avatarUrl={aiAvatar}
          friendName={friendName}
          onReset={handleReset}
          onSuccess={handleSuccess}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}
      {screen === "success"  && (
        <SuccessScreen
          timeSpent={stats.time}
          totalLines={stats.lines}
          gender={gender}
          onReset={handleReset}
        />
      )}

    </>
  );
}