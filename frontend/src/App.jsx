import { useState, useRef, useEffect } from 'react';
import { Shield, ShieldAlert, AlertTriangle, ShieldCheck, FileText, Camera, Mic, Square, X, Phone, ExternalLink, Share2, ArrowRight, Zap, BrainCircuit, LockKeyhole, ChevronDown, Languages, ScanText, BadgeCheck } from 'lucide-react';
import { analyzeText, analyzeImage, analyzeVoice } from './api';
import { UI_TEXT } from './translations';

const THREAT_EXAMPLES = [
  {
    type: 'DIGITAL ARREST',
    title: 'A call that turns into a threat',
    message: 'A caller claims to be police and says there is a warrant against you. They demand you stay on a video call and transfer money to “prove” your identity.',
    icon: ShieldAlert,
    style: 'text-red-700 bg-red-50 border-red-200',
  },
  {
    type: 'ELECTRICITY CUT',
    title: 'An urgent bill or disconnection notice',
    message: 'Your electricity will be disconnected tonight. Call this number immediately to avoid a penalty.',
    icon: Zap,
    style: 'text-amber-800 bg-amber-50 border-amber-200',
  },
  {
    type: 'FAKE BANK KYC',
    title: 'A link to “reactivate” your account',
    message: 'Your bank KYC has expired. Update your details now or your account will be blocked: suspicious-kyc.example',
    icon: LockKeyhole,
    style: 'text-indigo-800 bg-indigo-50 border-indigo-200',
  },
  {
    type: 'LOTTERY PRIZE',
    title: 'A prize you never entered to win',
    message: 'Congratulations! You have won a large cash prize. Pay a small processing fee today to claim your lottery winnings.',
    icon: BadgeCheck,
    style: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Is Sachet free to use?',
    answer: 'There is no charge to use this checker. Analysis availability can depend on the service configuration and its AI provider.',
  },
  {
    question: 'Do you store my messages?',
    answer: 'Sachet does not save submissions in an application database. To analyze a message, its text may be sent to the configured Groq AI service; voice recordings are also sent for transcription. Avoid submitting passwords, OTPs, or other highly sensitive information.',
  },
  {
    question: 'What if I have already been scammed?',
    answer: 'Call India’s cybercrime helpline at 1930 as soon as possible and report at cybercrime.gov.in. Contact your bank using its official number, and do not pay anyone promising to recover your money.',
  },
  {
    question: 'Can Sachet guarantee that a message is safe?',
    answer: 'No. Results are an aid, not proof. Scams change quickly, so verify requests through official channels and never share an OTP, PIN, or password.',
  },
];

export default function App() {
  // 1. Language & Storage
  const [lang, setLang] = useState(() => localStorage.getItem('sachet_lang') || 'en');
  useEffect(() => {
    localStorage.setItem('sachet_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);
  const t = UI_TEXT[lang];

  // 2. Core State
  const [activeTab, setActiveTab] = useState('text');
  const [loading, setLoading] = useState(false);
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Inputs
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageThumb, setImageThumb] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  // Refs
  const abortCtrlRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const resultRef = useRef(null);
  const headingRef = useRef(null);
  const analyzerRef = useRef(null);

  // Rotating loading text
  useEffect(() => {
    if (loading) {
      const id = setInterval(() => {
        setLoadingTextIdx(i => (i + 1) % t.analyzingStates.length);
      }, 2000);
      return () => clearInterval(id);
    }
  }, [loading, t.analyzingStates.length]);

  // Image Compression Utility (~1600px max)
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) return reject(new Error('errImage'));
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1600;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85);
      };
      img.onerror = () => reject(new Error('errImage'));
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressedBlob = await compressImage(file);
      compressedBlob.name = file.name;
      setImageFile(compressedBlob);
      setImageThumb(URL.createObjectURL(compressedBlob));
      setError(null);
    } catch (e) {
      setError(t[e.message] || t.errImage);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImageThumb(null);
  };

  // Audio Recording (60s cap)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        setAudioBlob(new Blob(chunks, { type: 'audio/webm' }));
        clearInterval(timerRef.current);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
      setRecordTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordTime(prev => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setError(t.errMic);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setRecordTime(0);
  };

  // Submit & Analysis
  const handleAnalyze = async () => {
    if (abortCtrlRef.current) abortCtrlRef.current.abort();
    abortCtrlRef.current = new AbortController();
    
    setError(null);
    setResult(null);
    setLoadingTextIdx(0);
    setLoading(true);

    try {
      let data = null;
      if (activeTab === 'text') {
        const trimmed = textInput.trim();
        if (trimmed.length < 10) throw new Error("errEmpty");
        data = await analyzeText(trimmed, lang, abortCtrlRef.current.signal);
      } else if (activeTab === 'image') {
        data = await analyzeImage(imageFile, lang, abortCtrlRef.current.signal);
      } else if (activeTab === 'voice') {
        data = await analyzeVoice(audioBlob, lang, abortCtrlRef.current.signal);
      }

      if (!data || !data.verdict) throw new Error("errModel");
      
      setResult(data);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        headingRef.current?.focus();
      }, 100);

    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      
      let msg = t.errNetwork;
      if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.message === 'errEmpty') msg = t.errEmpty;
      else if (err.message === 'timeout') msg = t.errTimeout;
      else if (err.message === 'rate_limit') msg = t.errRateLimit;
      else if (err.message === 'errModel') msg = t.errModel;
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTextInput('');
    clearImage();
    clearAudio();
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const testThreatExample = (message) => {
    setActiveTab('text');
    setTextInput(message);
    setResult(null);
    setError(null);
    analyzerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const shareWarning = () => {
    const text = `${t.verdictWarnTitle}: ${result?.explanation}\n\nChecked via Sachet AI.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isSubmitDisabled = loading || (activeTab === 'text' && !textInput.trim()) || 
                          (activeTab === 'image' && !imageFile) || 
                          (activeTab === 'voice' && !audioBlob && !isRecording);

  return (
    <div className="min-h-screen flex flex-col pb-12">
      <header className="sticky top-0 z-50 border-b border-navy-100/80 bg-paper/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="min-h-[68px] flex items-center justify-between gap-2">
            <a href="#top" className="flex items-center gap-2 shrink-0" aria-label="Sachet home">
              <span className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-navy-900 text-white flex items-center justify-center shadow-navy">
                <Shield className="w-5 h-5" />
              </span>
              <span className="text-lg md:text-xl font-extrabold tracking-tight text-navy-900">Sachet</span>
            </a>
            <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-6 text-sm font-bold text-navy-700">
              <a href="#threat-radar" className="hover:text-accent transition-colors">Scam Threat Radar</a>
              <a href="#hybrid-engine" className="hover:text-accent transition-colors">Hybrid Engine</a>
              <a href="#benchmark" className="hover:text-accent transition-colors">Benchmark</a>
              <a href="#faq" className="hover:text-accent transition-colors">FAQ</a>
            </nav>
            <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
              <div role="group" aria-label="Choose language" className="flex bg-white rounded-full p-1 shadow-soft border border-navy-100">
                {['bn', 'hi', 'en'].map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => { setLang(l); setError(null); }}
                    aria-pressed={lang === l}
                    className={`px-1.5 md:px-3 py-1.5 text-[11px] md:text-sm font-bold rounded-full transition-all ${
                      lang === l ? 'bg-accent text-white shadow-sm' : 'text-navy-700 hover:bg-navy-50'
                    }`}
                  >
                    {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'বাংলা'}
                  </button>
                ))}
              </div>
              <a href="#analyzer" aria-label="Check a message" className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 md:px-5 py-2.5 text-sm font-extrabold text-white shadow-navy hover:bg-[#3F42C7] transition-colors whitespace-nowrap">
                <span className="hidden sm:inline">Check Message</span>
                <ShieldCheck className="w-4 h-4 sm:hidden" />
                <ArrowRight className="hidden sm:block w-4 h-4" />
              </a>
            </div>
          </div>
          <nav aria-label="Section navigation" className="xl:hidden grid grid-cols-4 gap-1 pb-3 text-[11px] sm:text-xs font-bold text-navy-700 text-center">
            <a href="#threat-radar" className="hover:text-accent">Threat Radar</a>
            <a href="#hybrid-engine" className="hover:text-accent">Hybrid Engine</a>
            <a href="#benchmark" className="hover:text-accent">Benchmark</a>
            <a href="#faq" className="hover:text-accent">FAQ</a>
          </nav>
        </div>
      </header>

      <main id="top" className="w-full flex-1">
        <section className="relative overflow-hidden px-4 pt-14 pb-12 md:px-6 md:pt-20 md:pb-16">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(76,79,214,0.12),_transparent_62%)]" />
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-navy-100 bg-white/80 px-4 py-2 text-xs md:text-sm font-bold text-navy-700 shadow-soft">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>For safer digital India <span className="text-navy-200">•</span> Free message checks</span>
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight text-navy-900">
              {t.heroHeadline}
            </h1>
            <p className="mt-5 mx-auto max-w-3xl text-base md:text-xl leading-relaxed font-medium text-navy-500">
              {t.heroSub}
            </p>
            <a href="#analyzer" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-extrabold text-white shadow-navy hover:bg-[#3F42C7] transition-colors">
              {t.heroCta} <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>

        <section id="analyzer" ref={analyzerRef} className="scroll-mt-36 px-4 md:px-6 pb-16">
          <div className="max-w-3xl mx-auto flex flex-col gap-8">
            <div className="text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">{t.analyzerEyebrow}</p>
              <h2 className="mt-2 text-2xl md:text-3xl font-black text-navy-900">{t.analyzerTitle}</h2>
              <p className="mt-2 text-sm md:text-base font-medium text-navy-500">{t.analyzerHelp}</p>
            </div>

        {/* 3. Input Tiles */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'text', label: t.tabPaste, icon: FileText },
            { id: 'image', label: t.tabSnap, icon: Camera },
            { id: 'voice', label: t.tabSpeak, icon: Mic }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(null); }}
                className={`min-h-[96px] flex flex-col items-center justify-center gap-2 rounded-xl2 transition-all border-2 ${
                  active 
                    ? 'bg-white border-accent text-accent shadow-md scale-[1.02]' 
                    : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-50'
                }`}
                aria-label={tab.label}
              >
                <Icon className={`w-7 h-7 ${active ? 'text-accent' : 'text-slate-700'}`} />
                <span className="font-extrabold text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Input Area */}
        <div className="bg-white rounded-xl2 p-4 md:p-6 shadow-md border border-slate-200 flex flex-col gap-4">
          
          {/* Paste */}
          {activeTab === 'text' && (
            <div className="flex flex-col gap-3">
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                maxLength={5000}
                placeholder={t.pastePlaceholder}
                className="w-full min-h-[150px] p-4 bg-slate-50/80 rounded-xl border border-slate-300 resize-none focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-slate-900 placeholder:text-slate-500 font-medium text-base transition-all"
              />
              <div className="flex justify-between items-center px-1">
                <span className="text-xs text-slate-600 font-bold">{textInput.length}/5000</span>
                {textInput && (
                  <button onClick={() => setTextInput('')} className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg">
                    {t.clear}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {t.samples.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => setTextInput(s.text)} 
                    className="text-xs font-extrabold px-3.5 py-1.5 bg-slate-100 text-slate-800 rounded-full border border-slate-300 hover:bg-accent hover:text-white hover:border-accent transition-all shadow-sm"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Screenshot */}
          {activeTab === 'image' && (
            <div className="flex flex-col gap-4 items-center">
              {!imageThumb ? (
                <label className="w-full border-2 border-dashed border-slate-400 hover:border-accent rounded-xl2 p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition-colors">
                  <Camera className="w-8 h-8 text-slate-600 mb-3" />
                  <span className="font-extrabold text-slate-900 text-base">{t.uploadPrompt}</span>
                  <span className="text-xs text-slate-500 font-medium mt-1">Supports PNG, JPG, WEBP (Max 5MB)</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              ) : (
                <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-slate-300 bg-black">
                  <img src={imageThumb} alt="Screenshot preview" className="w-full object-contain max-h-64" />
                  <button onClick={clearImage} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-slate-900 hover:bg-white shadow-md" aria-label="Remove image">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Voice */}
          {activeTab === 'voice' && (
            <div className="flex flex-col items-center justify-center py-8 gap-6">
              {!audioBlob ? (
                <>
                  <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md ${
                      isRecording ? 'bg-red-600 text-white animate-pulse ring-8 ring-red-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </button>
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-extrabold text-slate-900">{isRecording ? t.micStop : t.micStart}</span>
                    {isRecording && <span className="text-red-600 font-extrabold text-sm">00:{recordTime.toString().padStart(2, '0')}</span>}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full">
                  <audio src={URL.createObjectURL(audioBlob)} controls className="w-full max-w-xs" />
                  <button onClick={clearAudio} className="text-xs font-extrabold text-slate-700 hover:text-slate-900 bg-slate-100 px-4 py-2 rounded-lg border border-slate-300">
                    {t.clear}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-sm font-bold flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

                    {/* Primary Action Button */}
          {!result && (
            <button
              onClick={handleAnalyze}
              disabled={isSubmitDisabled}
              className={`h-14 mt-2 rounded-xl text-lg font-extrabold flex items-center justify-center transition-all ${
                loading
                  ? 'bg-accent text-white shadow-lg cursor-wait opacity-95'
                  : isSubmitDisabled
                  ? 'bg-slate-200 text-slate-700 cursor-not-allowed border border-slate-300'
                  : 'bg-accent hover:bg-[#3F42C7] text-white shadow-md active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-3 text-white font-black">
                  <Shield className="w-6 h-6 animate-spin text-amber-300" />
                  <span className="text-white text-lg font-extrabold tracking-wide">
                    {t.analyzingStates[loadingTextIdx]}
                  </span>
                </div>
              ) : (
                t.checkBtn
              )}
            </button>
          )}
        </div>

        {/* 6. Result Card */}
        {result && (
          <div ref={resultRef} className={`rounded-xl2 p-6 md:p-8 flex flex-col gap-6 text-slate-900 border-2 shadow-lg ${
            result.verdict === 'scam' ? 'bg-red-50/90 border-red-300' :
            result.verdict === 'suspicious' ? 'bg-amber-50/90 border-amber-300' :
            'bg-emerald-50/90 border-emerald-300'
          }`}>
            
            {/* Verdict Header */}
            <div className="flex gap-4 items-start">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                result.verdict === 'scam' ? 'bg-red-600 text-white' :
                result.verdict === 'suspicious' ? 'bg-amber-500 text-white' :
                'bg-emerald-600 text-white'
              }`}>
                {result.verdict === 'scam' && <ShieldAlert className="w-8 h-8" />}
                {result.verdict === 'suspicious' && <AlertTriangle className="w-8 h-8" />}
                {result.verdict === 'safe' && <ShieldCheck className="w-8 h-8" />}
              </div>
              <div>
                <h2 tabIndex="-1" ref={headingRef} className={`text-2xl md:text-3xl font-black font-heading outline-none ${
                  result.verdict === 'scam' ? 'text-red-700' :
                  result.verdict === 'suspicious' ? 'text-amber-800' :
                  'text-emerald-800'
                }`}>
                  {result.verdict === 'scam' ? t.verdictScamTitle :
                   result.verdict === 'suspicious' ? t.verdictWarnTitle :
                   t.verdictSafeTitle}
                </h2>
                <p className="font-bold text-base md:text-lg opacity-90 mt-1 leading-relaxed text-slate-800">
                  {result.explanation}
                </p>
              </div>
            </div>

            <hr className="border-black/10" />

            {/* Red Flags */}
            {result.red_flags?.length > 0 && (
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs mb-3">{t.flagsTitle}</h3>
                <ul className="space-y-2">
                  {result.red_flags.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm md:text-base font-bold text-slate-800">
                      <span className="text-red-600 font-black mt-0.5">•</span>
                      <span>{f.explain}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What to do */}
            {result.what_to_do && (
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs mb-3">{t.stepsTitle}</h3>
                <div className="bg-white/80 rounded-xl p-4 space-y-3 border border-slate-200">
                  {result.what_to_do.map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-sm md:text-base font-extrabold text-slate-900">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-black">{idx + 1}</span>
                      <span className="pt-0.5">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <a href="tel:1930" className="h-14 rounded-xl bg-red-600 text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-red-700 shadow-md">
                <Phone className="w-5 h-5" /> {t.call1930}
              </a>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="flex-1 h-12 rounded-xl bg-white border border-slate-300 font-extrabold text-slate-900 flex items-center justify-center gap-2 hover:bg-slate-50">
                  <ExternalLink className="w-4 h-4 text-accent" /> {t.reportGov}
                </a>
                <button onClick={shareWarning} className="flex-1 h-12 rounded-xl bg-white border border-slate-300 font-extrabold text-slate-900 flex items-center justify-center gap-2 hover:bg-slate-50">
                  <Share2 className="w-4 h-4 text-accent" /> {t.shareWarning}
                </button>
              </div>
            </div>

            {/* Disclaimers & Details */}
            <div className="text-center pt-2">
              <p className="text-xs font-bold text-slate-600 mb-1">{t.disclaimerGeneral}</p>
              {result.verdict !== 'scam' && <p className="text-xs font-extrabold text-slate-900">{t.disclaimerSafe}</p>}
            </div>

            <details className="mt-2 group cursor-pointer">
              <summary className="text-xs font-extrabold text-slate-600 text-center select-none outline-none">{t.howWeDecided}</summary>
              <div className="mt-3 text-xs font-mono bg-white p-3 rounded-lg border border-slate-200 opacity-90 overflow-auto">
                <p>Rules Score: {result.engine.rule_score}/100</p>
                <p>LLM Verified: {result.engine.llm_used ? "Yes" : "No"}</p>
                {result.engine.llm_label && <p>LLM Label: {result.engine.llm_label}</p>}
                <p>Category: {result.scam_type || "None"}</p>
              </div>
            </details>

            {/* Check Another Button */}
            <button onClick={handleReset} className="h-14 mt-4 rounded-xl bg-slate-900 text-white font-extrabold text-lg hover:bg-slate-800 transition-colors shadow-md">
              {t.checkAnother}
            </button>
          </div>
        )}
          </div>
        </section>

        <section id="threat-radar" className="scroll-mt-36 px-4 md:px-6 py-16 md:py-20 bg-white/55 border-y border-navy-100/70">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Recognize the pattern</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-navy-900">Scam Threat Radar</h2>
              <p className="mt-3 text-base leading-relaxed font-medium text-navy-500">Common pressure tactics to watch for. These are illustrative examples, not live reports. Test one in the analyzer to see how Sachet responds.</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {THREAT_EXAMPLES.map(({ type, title, message, icon: Icon, style }) => (
                <article key={type} className="rounded-2xl border border-navy-100 bg-white p-5 md:p-6 shadow-soft flex flex-col">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${style}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="mt-4 text-[11px] font-black tracking-[0.16em] text-navy-500">{type}</p>
                  <h3 className="mt-1 text-lg font-extrabold text-navy-900">{title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed font-medium text-navy-500">{message}</p>
                  <button
                    type="button"
                    onClick={() => testThreatExample(message)}
                    className="mt-5 inline-flex items-center gap-2 self-start rounded-full border border-navy-100 bg-navy-50 px-4 py-2 text-sm font-extrabold text-navy-900 hover:bg-accent hover:text-white hover:border-accent transition-colors"
                  >
                    Test in Sachet <ArrowRight className="w-4 h-4" />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="hybrid-engine" className="scroll-mt-36 px-4 md:px-6 py-16 md:py-20 bg-navy-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-300">Built for a second look</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-white">A hybrid brain, with clear limits</h2>
              <p className="mt-3 text-base leading-relaxed font-medium text-indigo-100/80">Rules catch known warning signs; an AI review can add context when the provider is available.</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 transition-all duration-200 hover:border-indigo-300/60 hover:bg-indigo-400/15 hover:shadow-lg motion-safe:hover:-translate-y-1">
                <span className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-amber-300"><Zap className="w-6 h-6" /></span>
                <h3 className="mt-5 text-lg font-extrabold text-white">Fast pattern rules</h3>
                <p className="mt-2 text-sm leading-relaxed font-medium text-indigo-100/80">Local regex and rule checks look for urgency, suspicious links, requests for credentials, and other known scam signals.</p>
              </article>
              <article className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 transition-all duration-200 hover:border-indigo-300/60 hover:bg-indigo-400/15 hover:shadow-lg motion-safe:hover:-translate-y-1">
                <span className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300"><BrainCircuit className="w-6 h-6" /></span>
                <h3 className="mt-5 text-lg font-extrabold text-white">Groq-hosted AI review</h3>
                <p className="mt-2 text-sm leading-relaxed font-medium text-indigo-100/80">When configured and available, Groq-hosted language models review the message alongside rule hints. If unavailable, Sachet falls back to its rules engine.</p>
              </article>
              <article className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 transition-all duration-200 hover:border-indigo-300/60 hover:bg-indigo-400/15 hover:shadow-lg motion-safe:hover:-translate-y-1">
                <span className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300"><LockKeyhole className="w-6 h-6" /></span>
                <h3 className="mt-5 text-lg font-extrabold text-white">No Sachet message database</h3>
                <p className="mt-2 text-sm leading-relaxed font-medium text-indigo-100/80">Submissions aren’t saved in an application database. Text may be sent to Groq for analysis, and voice audio to Groq for transcription. Don’t submit passwords or OTPs.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="benchmark" className="scroll-mt-36 px-4 md:px-6 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">What Sachet supports</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-navy-900">Proof you can verify</h2>
              <p className="mt-3 text-base leading-relaxed font-medium text-navy-500">A capability snapshot—not a claim of perfect detection or guaranteed speed.</p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {[
                { value: '3', label: 'Supported languages', detail: 'English · Hindi · Bengali', icon: Languages },
                { value: '3', label: 'Ways to check', detail: 'Text · Screenshot · Voice', icon: ScanText },
                { value: '2', label: 'Analysis layers', detail: 'Rules + AI when available', icon: BrainCircuit },
                { value: '1930', label: 'Cyber fraud helpline', detail: 'India emergency support', icon: Phone },
              ].map(({ value, label, detail, icon: Icon }) => (
                <article key={label} className="rounded-2xl border border-navy-100 bg-white p-5 md:p-6 shadow-soft transition-all duration-200 hover:border-accent/40 hover:bg-indigo-50 hover:shadow-card motion-safe:hover:-translate-y-1">
                  <Icon className="w-5 h-5 text-accent" />
                  <p className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-navy-900">{value}</p>
                  <h3 className="mt-2 text-sm font-extrabold text-navy-900">{label}</h3>
                  <p className="mt-1 text-xs font-semibold text-navy-500">{detail}</p>
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed font-medium text-navy-500">Recall, false-positive rate, and end-to-end latency have not been independently benchmarked here. Results can vary by message and AI provider availability.</p>
          </div>
        </section>

        <section id="faq" className="scroll-mt-36 px-4 md:px-6 py-16 md:py-20 bg-white/55 border-y border-navy-100/70">
          <div className="max-w-4xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Good to know</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-navy-900">Frequently asked questions</h2>
            </div>
            <div className="mt-7 divide-y divide-navy-100 border-y border-navy-100">
              {FAQ_ITEMS.map(({ question, answer }) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-extrabold text-navy-900">
                    {question}
                    <ChevronDown className="w-5 h-5 shrink-0 text-accent transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 max-w-3xl pr-8 text-sm leading-relaxed font-medium text-navy-500">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 md:px-6 pt-12">
        <div className="max-w-7xl mx-auto rounded-3xl bg-navy-900 p-6 md:p-9 text-white shadow-navy">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 shrink-0 rounded-2xl bg-red-500/15 text-red-300 flex items-center justify-center"><Phone className="w-6 h-6" /></span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-200">Act quickly if money is at risk</p>
                <h2 className="mt-1 text-xl md:text-2xl font-black text-white">Call India’s cyber fraud helpline</h2>
              </div>
            </div>
            <a href="tel:1930" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-base font-black text-white hover:bg-red-700 transition-colors">
              <Phone className="w-5 h-5" /> Call 1930
            </a>
          </div>
          <div className="mt-7 flex flex-col gap-4 border-t border-white/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-100 hover:text-white">
              Report at the MHA cybercrime portal <ExternalLink className="w-4 h-4" />
            </a>
            <p className="inline-flex items-center gap-2 text-sm font-bold text-indigo-100"><Shield className="w-4 h-4 text-indigo-300" /> Made with care by Vivi</p>
          </div>
        </div>
        <p className="max-w-7xl mx-auto pt-5 text-center text-xs font-semibold text-navy-500">
          Sachet is an aid, not proof. Verify through official channels and never share an OTP, PIN, or password.
        </p>
      </footer>
    </div>
  );
}