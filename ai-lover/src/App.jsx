import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Heart,
  RefreshCw,
  Volume2,
  VolumeX,
  Send,
  Clock,
  Sparkles,
  PartyPopper
} from "lucide-react";

// ─────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────

/** Get AI Reply + Flirt Score using OpenAI Compatible API */
async function getAIReply(userMessage, conversationHistory, gender, mode) {
  const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!API_KEY) throw new Error("คุณลืมตั้งค่า VITE_API_KEY ในไฟล์ .env");

  const API_URL = import.meta.env.VITE_API_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
  const MODEL = import.meta.env.VITE_CHAT_MODEL || import.meta.env.VITE_OPENROUTER_CHAT_MODEL || "glm-5";

  let persona = "";
  let scoringRule = "";

  if (mode === 'sweet') {
    persona = gender === 'female'
      ? "คุณคือ AI สาวน้อยน่ารัก อ่อนหวาน ขี้อายและคลั่งรัก ใช้คำว่า 'เค้า' 'ตัวเอง' 'หนู' 'พี่' และใช้หางเสียง 'ค่ะ' 'นะคะ' ทุกประโยค"
      : "คุณคือ AI หนุ่มหล่อ อบอุ่น สุภาพ เอาใจเก่ง คลั่งรัก ใช้คำว่า 'ผม' 'เธอ' 'ที่รัก' และใช้หางเสียง 'ครับ' 'นะครับ' ทุกประโยค";
    scoringRule = "ให้คะแนนใจง่ายมาก แค่ชวนคุยหรือชมก็ปาหัวใจให้ (+5 ถึง +15 ถ้าน่ารักมาก) ถ้าพิมพ์มางงๆก็ให้ 0";
  } else if (mode === 'medium') {
    persona = gender === 'female'
      ? "คุณคือ AI สาววัยรุ่นทั่วไป คุยเหมือนเพื่อน มีเล่นตัวบ้าง คุยสนุก ร่าเริง ใช้คำว่า 'เรา' 'แก' 'นาย' มีหางเสียงบ้างตามอารมณ์"
      : "คุณคือ AI หนุ่มมาดกวนนิดๆ ขี้เล่น เป็นกันเอง เหมือนเพื่อนผู้ชาย ใช้คำว่า 'เรา' 'แก' 'นาย' 'เธอ' มีหางเสียงบ้าง";
    scoringRule = "ให้คะแนนปานกลาง สมเหตุสมผล จีบเก่งให้บวก (+2 ถึง +8) ถ้าแชทกร่อยหรือแป้กให้ติดลบ (-2 ถึง 0)";
  } else {
    persona = gender === 'female'
      ? "คุณคือ AI สาววัยรุ่น ปากแจ๋ว กวนตีนสุดๆ ไม่อ่อนหวาน ขวานผ่าซาก ซีนเดเระ ใช้คำว่า 'แก' 'ฉัน' 'มึง' 'กู' ไม่ต้องมีหางเสียงสุภาพ"
      : "คุณคือ AI หนุ่มวัยรุ่น ทรงโจร กวนตีน ปากร้าย หยิ่ง ห้าวๆ ใช้คำว่า 'มึง' 'กู' 'นาย' ไม่ต้องสุภาพ";
    scoringRule = "คุณเป็นคนเปิดใจยากมากๆ หยิ่งสุดๆ ถ้าจีบน่าเบื่อให้ 0 ถ้าจีบห่วย/เสี่ยวให้ติดลบหนักๆ (-1 ถึง -5) ต้องจีบขั้นเทพ โดนใจจริงๆ ถึงจะให้บวกนิดหน่อย (+1 ถึง +5 ห้ามให้เยอะ)";
  }

  const systemPrompt = `${persona}
กฎเหล็กในการตอบ:
1. ตอบสั้นๆ (1-3 ประโยค) พิมพ์ให้เหมือนคนจริงๆ แชทกัน
2. **การเว้นจังหวะ:** ใช้เครื่องหมายจุลภาค (,) หรือเว้นวรรคเพื่อช่วยให้ AI อ่านออกเสียงได้เป็นธรรมชาติ
3. แสดงอารมณ์ตามโหมด: โหมดโหดด่าได้ช็อตฟีล โหมดหวานก็อ้อนน่ารัก โหมดกลางก็คุยชิลๆ
4. **การให้คะแนนประเมิน (สำคัญมาก):** ${scoringRule}
5. คุณต้องตอบกลับเป็น JSON เท่านั้น! โดยมีคีย์คือ:
   {
     "reply": "ข้อความตอบโต้",
     "score_change": ตัวเลขคะแนนที่ให้
   }
ห้ามตอบอย่างอื่นนอกจากโครงสร้าง JSON นี้เด็ดขาด!`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage }
  ];

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "AI Lover Dating App"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      temperature: 0.8
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error: ${err}`);
  }

  const data = await response.json();
  try {
    const rawText = data.choices[0].message.content;

    // Find JSON block in reply (AI might wrap it in ```json ... ```)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI reply");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      reply: parsed.reply || "(ยิ้มเจื่อนๆ)",
      score_change: parsed.score_change || 0
    };
  } catch (e) {
    console.error("Failed to parse JSON:", e, data.choices?.[0]?.message?.content);
    return { reply: "เอ่อ... ไม่ค่อยเข้าใจเลยค่ะ/ครับ 😅", score_change: 0 };
  }
}

async function speakWithElevenLabs(text, gender) {
  const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!API_KEY) return false;

  const voiceId = gender === 'female'
    ? import.meta.env.VITE_ELEVENLABS_VOICE_ID_FEMALE
    : import.meta.env.VITE_ELEVENLABS_VOICE_ID_MALE;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.8,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
          stability: 0.8,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) throw new Error("ElevenLabs API Error");

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
    return true;
  } catch (err) {
    console.error("ElevenLabs Error:", err);
    return false;
  }
}

// ─────────────────────────────────────────────
// BROWSER SPEECH HELPERS
// ─────────────────────────────────────────────

function useSpeechRecognition(onResult) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "th-TH";

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);

    recognitionRef.current = rec;
  }, [onResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    recognitionRef.current.start();
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return { isListening, startListening, stopListening, isSupported };
}

async function speakText(text, gender) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  // Try ElevenLabs first if enabled and configured
  const enablePremium = import.meta.env.VITE_USE_ELEVENLABS === 'true' && import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (enablePremium) {
    console.log("Using ElevenLabs TTS...");
    const success = await speakWithElevenLabs(text, gender);
    if (success) return;
    console.warn("ElevenLabs failed, falling back to browser TTS");
  } else {
    console.log("Using Browser TTS (Free)");
  }

  // Fallback to browser TTS
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  const utterance = new SpeechSynthesisUtterance(cleanText);

  const voices = window.speechSynthesis.getVoices();
  const thVoices = voices.filter(v => v.lang.startsWith("th"));

  // Gender matching for common Thai voices
  let selectedVoice = null;
  if (gender === 'female') {
    selectedVoice = thVoices.find(v =>
      v.name.toLowerCase().includes("premawadee") ||
      v.name.toLowerCase().includes("narisa") ||
      v.name.toLowerCase().includes("kanokwan") ||
      v.name.toLowerCase().includes("online") ||
      v.name.toLowerCase().includes("google")
    );
  } else {
    selectedVoice = thVoices.find(v =>
      v.name.toLowerCase().includes("pattara") ||
      v.name.toLowerCase().includes("sakda") ||
      (!v.name.toLowerCase().includes("premawadee") && !v.name.toLowerCase().includes("narisa") && !v.name.toLowerCase().includes("siri"))
    );
  }

  utterance.voice = selectedVoice || thVoices[0] || voices[0];
  utterance.lang = "th-TH";
  utterance.pitch = gender === 'female' ? 1.1 : 0.85;
  utterance.rate = 0.95;

  window.speechSynthesis.speak(utterance);
}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────

const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

function getAvatarUrl(gender) {
  const seeds = gender === 'female'
    ? ['Sara', 'Lily', 'Mimi', 'Chloe', 'Zoe', 'Aneka', 'Jessica']
    : ['Felix', 'Max', 'Leo', 'Jack', 'Caleb', 'Liam', 'Oliver'];
  const seed = seeds[Math.floor(Math.random() * seeds.length)];
  const bg = gender === 'female' ? 'fbcfe8' : 'bfdbfe';
  return `https://api.dicebear.com/8.x/adventurer/svg?seed=${seed}&backgroundColor=${bg}`;
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function FloatingItem({ item, mousePos }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = centerX - mousePos.x;
    const dy = centerY - mousePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Repel radius (150px)
    if (dist > 0 && dist < 150) {
      const force = (150 - dist) / 150; // 0 to 1
      setOffset({
        x: (dx / dist) * force * 80, // jump away up to 80px
        y: (dy / dist) * force * 80
      });
    } else {
      // Ease back
      setOffset(prev => ({
        x: prev.x * 0.9,
        y: prev.y * 0.9
      }));
    }
  }, [mousePos]);

  return (
    <div
      className="absolute transition-transform duration-300 ease-out will-change-transform"
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        zIndex: 0
      }}
    >
      <span
        ref={ref}
        className="block text-4xl animate-bounce"
        style={{
          animationDelay: `${item.delay}s`,
          animationDuration: `${item.dur}s`,
          filter: "drop-shadow(0 15px 15px rgba(0,0,0,0.5))",
          opacity: 0.8
        }}
      >
        {item.char}
      </span>
    </div>
  );
}

function FloatingEmoji({ emojis }) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {emojis.map((e, i) => (
        <FloatingItem key={i} item={e} mousePos={mousePos} />
      ))}
    </div>
  );
}

const BG_EMOJIS = [
  { char: "💖", x: 10, y: 15, delay: 0, dur: 4 },
  { char: "✨", x: 88, y: 20, delay: 0.4, dur: 5 },
  { char: "💜", x: 20, y: 80, delay: 1.2, dur: 4.5 },
  { char: "🌌", x: 75, y: 75, delay: 0.8, dur: 5.5 },
  { char: "💗", x: 50, y: 10, delay: 0.3, dur: 6 },
  { char: "🌠", x: 90, y: 50, delay: 0.7, dur: 4.2 },
  { char: "💫", x: 5, y: 50, delay: 1.5, dur: 4.8 },
  { char: "💕", x: 60, y: 85, delay: 0.9, dur: 3.8 },
  { char: "💝", x: 30, y: 30, delay: 1.1, dur: 5.2 },
  { char: "💌", x: 80, y: 40, delay: 1.8, dur: 4.6 },
  { char: "💖", x: 15, y: 60, delay: 0.2, dur: 5.8 },
  { char: "✨", x: 95, y: 80, delay: 1.4, dur: 6.2 },
  { char: "🌸", x: 40, y: 70, delay: 0.6, dur: 4.4 },
  { char: "🌷", x: 70, y: 10, delay: 1.0, dur: 5.0 },
  { char: "😻", x: 10, y: 40, delay: 0.5, dur: 5.5 },
  { char: "💘", x: 45, y: 85, delay: 1.7, dur: 4.0 },
  { char: "🌹", x: 85, y: 90, delay: 0.1, dur: 5.1 },
  { char: "💋", x: 65, y: 15, delay: 1.3, dur: 4.3 }
];

// ─── STATE 1: LANDING ─────────────────────────
function LandingScreen({ onStart }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-[#4a0018] via-[#8a0044] to-[#520022]">

      {/* 3D background elements */}
      <FloatingEmoji emojis={BG_EMOJIS} />

      {/* Cinematic Lighting overlays for background */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(0,0,0,0.5),transparent_60%)] pointer-events-none" />

      {/* Premium Rose-Gold Metal Frame Wrapper */}
      <div className="relative z-10 w-full max-w-md p-[3px] rounded-[2.2rem] bg-gradient-to-br from-[#ff55a3] via-[#ff006a] to-[#d900ff] shadow-[0_30px_60px_-15px_rgba(255,0,106,0.5)]">

        {/* Glassmorphism Panel */}
        <div className="relative w-full h-full bg-black/30 backdrop-blur-2xl rounded-[2rem] p-8 text-center overflow-hidden border border-white/10 shadow-[inset_0_2px_20px_rgba(255,255,255,0.15)] flex flex-col items-center">

          {/* Glass Reflective Surface Highlights */}
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-[2rem]" />
          <div className="absolute -inset-10 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 transform rotate-12 pointer-events-none mix-blend-overlay" />

          {/* 3D Silver Text Title */}
          <h1
            className="text-6xl font-black mb-3 relative z-10"
            style={{
              fontFamily: "'Pacifico', cursive, sans-serif",
              color: "#e8e8e8",
              textShadow: "0 1px 0 #fff, 0 2px 0 #d9d9d9, 0 3px 0 #bdbdbd, 0 4px 0 #9e9e9e, 0 5px 0 #7a7a7a, 0 15px 25px rgba(0,0,0,0.8)",
              letterSpacing: "0.05em"
            }}
          >
            AI Lover
          </h1>

          <p className="text-white/90 text-[15px] sm:text-[17px] font-extrabold mb-8 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] relative z-10 w-full max-w-[90%]">
            ลองจีบให้ติดแลถิ อย่าเก่งแต่ปากพร้อมแล้วอย่าแชอยู่!
          </p>

          <p className="text-white/80 font-bold mb-5 text-base sm:text-lg uppercase tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] relative z-10">
            อยากจีบใครเลือกเอาน้องบ่าวหรือน้องสาว?
          </p>

          {/* 3D Buttons Area */}
          <div className="flex flex-row gap-4 w-full relative z-10">

            {/* Female Button */}
            <button
              onClick={() => onStart('female')}
              className="group relative flex-1 pt-5 pb-4 px-2 rounded-2xl bg-gradient-to-b from-[#ff6fb5] to-[#ff2a7a] text-white flex flex-col items-center justify-center gap-2 transition-all duration-200 ease-out shadow-[0_8px_0_#9a0047,0_15px_20px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_10px_0_#9a0047,0_20px_25px_rgba(0,0,0,0.6)] hover:brightness-110 active:translate-y-2 active:shadow-[0_0px_0_#9a0047,0_2px_5px_rgba(0,0,0,0.5)] border-t border-white/40 overflow-hidden"
            >
              <span className="text-[3rem] sm:text-[3.5rem] drop-shadow-[0_5px_5px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform duration-300">🌸</span>
              <span className="font-extrabold text-[15px] sm:text-[17px] leading-tight drop-shadow-md">สาวนุ้ย<br /><span className="text-[12px] sm:text-[13px] text-white/80 font-semibold">(Female)</span></span>
              {/* Inner highlight */}
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </button>

            {/* Male Button */}
            <button
              onClick={() => onStart('male')}
              className="group relative flex-1 pt-5 pb-4 px-2 rounded-2xl bg-gradient-to-b from-[#38bdf8] to-[#0284c7] text-white flex flex-col items-center justify-center gap-2 transition-all duration-200 ease-out shadow-[0_8px_0_#004d7a,0_15px_20px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_10px_0_#004d7a,0_20px_25px_rgba(0,0,0,0.6)] hover:brightness-110 active:translate-y-2 active:shadow-[0_0px_0_#004d7a,0_2px_5px_rgba(0,0,0,0.5)] border-t border-white/40 overflow-hidden"
            >
              <span className="text-[3rem] sm:text-[3.5rem] drop-shadow-[0_5px_5px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform duration-300">💙</span>
              <span className="font-extrabold text-[15px] sm:text-[17px] leading-tight drop-shadow-md">พี่บ่าว<br /><span className="text-[12px] sm:text-[13px] text-white/80 font-semibold">(Male)</span></span>
              {/* Inner highlight */}
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </button>

          </div>
        </div>
      </div>

      <p className="relative z-10 mt-8 text-white/40 text-[10px] text-center w-full max-w-sm uppercase tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
        คำชี้แจง: ไม่เก็บข้อมูลการสนทนา · ประมวลผลด้วย Gemini AI
      </p>
    </div>
  );
}

// ─── STATE 2: VOICE DATING ────────────────────
function VoiceDatingScreen({ gender, onReset, onSuccess, onGoBack }) {
  const [conversation, setConversation] = useState([
    { role: "assistant", content: gender === 'female' ? "มีไร รีบๆพิมพ์มา อย่าลีลา 😒" : "ว่าไง มองหน้ามีไรเปล่า? 🤨" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [mode, setMode] = useState("hardcore");
  const [error, setError] = useState(null);

  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const avatarUrl = useRef(getAvatarUrl(gender)).current;
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto Focus Input when AI finishes thinking
  useEffect(() => {
    if (!isThinking && inputRef.current && score < 100) {
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isThinking, score]);

  // Auto Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Timer
  useEffect(() => {
    const timerId = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timerId);
  }, []);

  // Check for success condition
  useEffect(() => {
    if (score >= 100) {
      const id = setTimeout(() => {
        onSuccess(seconds, conversation.length);
      }, 1000);
      return () => clearTimeout(id);
    }
  }, [score, seconds, conversation.length, onSuccess]);

  const sendMessageToAI = async (text) => {
    setError(null);
    setIsThinking(true);

    setConversation((prev) => [...prev, { role: "user", content: text }]);

    const history = conversation.map((m) => ({
      role: m.role, content: m.content,
    })).filter((m, i) => i > 0 || m.role === 'user');

    try {
      const { reply, score_change } = await getAIReply(text, history, gender, mode);
      setScore(prev => Math.min(100, Math.max(0, prev + score_change)));

      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);

      if (!isMuted) speakText(reply, gender);
    } catch (e) {
      setError(e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ API!");
      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: "งืมๆ... สัญญาณขาดหาย มึนหัวนิดหน่อย 😵‍💫" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleTranscript = useCallback((transcript) => {
    if (transcript.trim() && score < 100) {
      sendMessageToAI(transcript);
    }
  }, [conversation, isMuted, gender, score]);

  const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition(handleTranscript);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || score >= 100) return;
    const txt = inputText;
    setInputText("");
    sendMessageToAI(txt);
  };

  // ── Go Back to Landing ──
  const handleGoBack = () => {
    setConversation([]);
    setScore(0);
    setSeconds(0);
    setInputText("");
    setError(null);
    if (onGoBack) onGoBack();
  };

  const isElevenLabsEnabled = import.meta.env.VITE_USE_ELEVENLABS === 'true' && import.meta.env.VITE_ELEVENLABS_API_KEY;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-purple-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md h-[90vh] max-h-[850px] min-h-[600px] flex flex-col bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden">

        {/* ── Back Button ── */}
        <div className="flex-shrink-0 w-full mb-3 z-10">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 backdrop-blur-md text-white/80 hover:text-white text-sm font-semibold transition-all duration-200 shadow-lg group"
            title="กลับหน้าหลัก"
          >
            <span className="text-base leading-none group-hover:-translate-x-1 transition-transform duration-200">‹</span>
            <span>ย้อนกลับ</span>
          </button>
        </div>

        {/* Header Info Bar */}
        <div className="flex-shrink-0 flex items-center justify-between mb-4 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg z-10 w-full">

          {/* Timer & TTS Status */}
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-2 text-white/80 font-mono text-sm leading-none">
              <Clock size={14} className="text-cyan-400" />
              <span>{formatTime(seconds)}</span>
            </div>
            {/* TTS Engine Badge */}
            <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${isElevenLabsEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-white/5 border-white/10 text-white/40'
              }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isElevenLabsEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
              {isElevenLabsEnabled ? 'ELEVENLABS AI' : 'BROWSER TTS'}
            </div>
          </div>

          {/* Score Meter */}
          <div className="flex flex-col items-center justify-center flex-1 mx-4">
            <div className="flex items-center gap-1 mb-1 relative">
              <Heart size={14} className={`fill-pink-500 text-pink-500 transition-all duration-300 ${score > 50 ? 'scale-110' : ''}`} />
              <span className="text-white text-xs font-bold tracking-wide">คะแนนใจ</span>
            </div>
            <div className="w-full max-w-[120px] h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative">
              <div
                className={`h-full bg-gradient-to-r ${gender === 'female' ? 'from-pink-400 to-rose-600' : 'from-cyan-400 to-blue-600'} transition-all duration-1000 ease-out`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-white/60 text-[10px] font-bold mt-1">{score} / 100</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Test Voice Button */}
            <button
              onClick={() => speakText(gender === 'female' ? "สวัสดีค่ะ ลองเสียงหน่อยนะคะ" : "สวัสดีครับ ลองเสียงหน่อยนะครับ", gender)}
              className="text-[10px] bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-2 py-1 rounded-md border border-white/10 flex items-center gap-1 transition-all active:scale-95"
              title="ทดสอบเสียง TTS"
            >
              <Sparkles size={11} className="text-yellow-400" />
              ลองเสียง
            </button>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setConversation([{ role: "assistant", content: e.target.value === 'sweet' ? (gender === 'female' ? "สวัสดีค่ะพี่... 😳" : "ไงครับคนสวย 😊") : e.target.value === 'hardcore' ? (gender === 'female' ? "มีไร รีบๆพิมพ์มา อย่าลีลา 😒" : "ว่าไง มองหน้ามีไรเปล่า? 🤨") : (gender === 'female' ? "หวัดดีค่า มีอะไรให้เราช่วยไหม? ✨" : "หวัดดีครับ ว่าไง? 💬") }]);
                setScore(0);
                setSeconds(0);
              }}
              className="bg-black/30 text-white text-[10px] px-1 py-1 rounded outline-none border border-white/20"
              title="เลือกระดับความโหด"
            >
              <option value="sweet" className="text-black">หวาน 💖</option>
              <option value="medium" className="text-black">กลาง 💬</option>
              <option value="hardcore" className="text-black">โหด 🔥</option>
            </select>
            <button onClick={() => setIsMuted((m) => !m)} className="text-white/60 hover:text-white transition-colors ml-1">
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button onClick={onReset} className="text-red-400 hover:text-red-300 transition-colors tooltip" title="เริ่มใหม่/ยกเลิก">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Character Image */}
        <div className="relative w-full mb-4 flex-shrink-0 z-10">
          <div className={`absolute -inset-1 rounded-3xl blur-lg opacity-40 animate-pulse ${gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'}`} />
          <div className={`relative bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 transition-all ${score >= 100 ? 'ring-4 ring-yellow-400 shadow-2xl shadow-yellow-500/50' : ''}`}>
            <img src={avatarUrl} alt="Your date" className="w-full h-56 object-contain object-bottom pt-4" />
            <div className="absolute top-2 left-2 bg-black/40 backdrop-blur text-white/90 text-xs px-3 py-1 rounded-full border border-white/10 font-bold">
              {gender === 'female' ? 'ดาริน 🌸' : 'เร็น 💙'}
            </div>
          </div>
        </div>

        {/* Speech Chat Area */}
        <div className="w-full flex-1 space-y-3 mb-4 overflow-y-auto custom-scrollbar z-10 pb-4 pr-1">
          {conversation.map((msg, idx) => (
            <div key={idx} className={`flex gap-2 items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className={`text-2xl shrink-0 mt-1 ${score > 80 ? 'animate-bounce' : ''}`}>
                  {gender === 'female' ? '👧' : '👦'}
                </div>
              )}

              <div className={`rounded-2xl px-4 py-3 max-w-[85%] shadow-md ${msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 rounded-tr-sm text-white'
                : 'bg-white/15 border border-white/20 rounded-tl-sm text-white'
                }`}>
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-2 items-start">
              <div className="text-2xl shrink-0 mt-1">{gender === 'female' ? '👧' : '👦'}</div>
              <div className="bg-white/15 border border-white/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] animate-pulse">
                <p className="text-white text-sm leading-relaxed whitespace-pre-line">กำลังพิมพ์... 💭</p>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Error Output */}
        {error && (
          <div className="w-full mb-3 bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-2 z-10">
            <p className="text-red-300 text-xs text-center">⚠️ {error}</p>
          </div>
        )}

        {/* Input section (Text + Mic) */}
        <div className="w-full mt-auto flex-shrink-0 z-10">
          <div className="flex gap-2 items-center bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md">
            {/* Text Input */}
            <form className="flex-1 flex bg-transparent" onSubmit={handleTextSubmit}>
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="พิมพ์ข้อความจีบตรงนี้..."
                disabled={isThinking || score >= 100}
                className="flex-1 bg-transparent text-white text-sm px-3 py-2 outline-none placeholder:text-white/40"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isThinking || score >= 100}
                className={`p-2 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${inputText.trim() ? 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-md hover:scale-105 active:scale-95' : 'bg-white/10'
                  }`}
              >
                <Send size={18} />
              </button>
            </form>

            {/* Voice Input */}
            <div className="w-px h-8 bg-white/20 mx-1"></div>
            {isSupported ? (
              <button
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onTouchStart={(e) => { e.preventDefault(); startListening(); }}
                onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
                disabled={isThinking || score >= 100}
                className={`p-3 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg scale-110' : 'bg-white/15 text-white/80 hover:bg-white/25 hover:text-white'
                  } disabled:opacity-50`}
                title="กดค้างเพื่อพูด"
              >
                <Mic size={20} />
              </button>
            ) : (
              <button disabled className="p-3 rounded-xl bg-orange-500/20 text-orange-300 tooltip" title="เบราว์เซอร์ไม่รองรับระบบเสียง">
                <MicOff size={20} />
              </button>
            )}
          </div>
          <p className="text-white/40 text-[10px] text-center mt-3">กดที่ไมค์ค้างไว้เพื่อพูดสนทนาด้วยเสียง</p>
        </div>
      </div>
    </div>
  );
}

// ─── STATE 3: SUCCESS SCREEN ──────────────────
function SuccessScreen({ timeSpent, totalLines, gender, onReset }) {
  const CONFETTI = [
    { char: "🎉", x: 10, y: -10, delay: 0, dur: 1.5 },
    { char: "💖", x: 30, y: -20, delay: 0.2, dur: 2 },
    { char: "🥳", x: 50, y: -5, delay: 0.5, dur: 1.8 },
    { char: "💐", x: 70, y: -15, delay: 0.1, dur: 2.2 },
    { char: "✨", x: 90, y: -25, delay: 0.4, dur: 1.9 },
    { char: "🎊", x: 80, y: -10, delay: 0.6, dur: 2.1 },
    { char: "😍", x: 20, y: -5, delay: 0.7, dur: 1.6 },
    { char: "💘", x: 40, y: -30, delay: 0.3, dur: 2.3 },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-yellow-400 via-pink-400 to-fuchsia-500">
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .confetti-piece { animation: fall linear infinite; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        {CONFETTI.map((c, i) => (
          <div
            key={i}
            className="confetti-piece absolute text-4xl"
            style={{ left: `${c.x}%`, animationDuration: `${c.dur + 1.5}s`, animationDelay: `${c.delay}s` }}
          >
            {c.char}
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm bg-white/30 backdrop-blur-2xl border-2 border-white/50 rounded-[2rem] p-8 shadow-2xl shadow-yellow-500/30 text-center animate-in zoom-in duration-500 mt-[-5rem]">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-yellow-300">
          <PartyPopper size={48} className="text-pink-500" />
        </div>

        <h1 className="text-4xl font-black text-white drop-shadow-md mb-2">จีบติดแล้ว!</h1>
        <p className="text-white/90 font-bold mb-6">
          {gender === 'female' ? 'คุณพิชิตใจสาวน้อยสำเร็จ 💖' : 'คุณพิชิตใจหนุ่มหล่อสำเร็จ 💙'}
        </p>

        <div className="bg-black/10 rounded-2xl p-4 mb-6 backdrop-blur-sm border border-white/20">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wide mb-1">เวลาที่ใช้</span>
              <span className="text-2xl font-black text-white">{formatTime(timeSpent)}</span>
            </div>
            <div className="flex flex-col items-center justify-center border-l border-white/20">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wide mb-1">โต้ตอบกัน</span>
              <span className="text-2xl font-black text-white">{totalLines} <span className="text-sm">ครั้ง</span></span>
            </div>
          </div>
        </div>

        <button
          onClick={onReset}
          className="w-full py-4 rounded-xl border-2 border-white bg-white text-pink-600 font-bold text-lg hover:bg-transparent hover:text-white transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <RefreshCw size={20} />
          เล่นอีกครั้ง
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

  const [timeSpent, setTimeSpent] = useState(0);
  const [totalLines, setTotalLines] = useState(0);

  const handleStart = (selectedGender) => {
    setGender(selectedGender);
    setScreen("dating");
  };

  const handleSuccess = (seconds, linesCount) => {
    setTimeSpent(seconds);
    setTotalLines(linesCount);
    setScreen("success");
  };

  const handleReset = () => {
    setScreen("landing");
    setTimeSpent(0);
    setTotalLines(0);
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Pacifico&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.innerHTML = `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }`;
    document.head.appendChild(style);
  }, []);

  return (
    <>
      {screen === "landing" && (
        <LandingScreen onStart={handleStart} />
      )}
      {screen === "dating" && (
        <VoiceDatingScreen
          gender={gender}
          onReset={handleReset}
          onSuccess={handleSuccess}
          onGoBack={handleReset}
        />
      )}
      {screen === "success" && (
        <SuccessScreen
          timeSpent={timeSpent}
          totalLines={totalLines}
          gender={gender}
          onReset={handleReset}
        />
      )}
    </>
  );
}