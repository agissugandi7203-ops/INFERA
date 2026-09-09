import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Mic,
  Square,
  ArrowUp,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Download,
  Scale,
  ShieldCheck,
  FileCheck,
  ExternalLink,
  ChevronDown,
  FileText,
  X,
  Menu,
  Settings as SettingsIcon,
  ArrowDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, AiShortcut } from '../services/openrouter';
import { CharacterEmotion } from '../avatar/AvatarController';
import { SpeechService } from '../services/speech';
import { VOICE_DEFAULT_ID, VOICE_SECONDARY_ID } from '../services/tts-processor';
import { useSimulationStream } from '../simulation/SimulationContext';
import { FALLBACK_CASES } from '../../../services/participantRiskApi';

interface DashboardOutletContextType {
  onTriggerAvatarSpeech?: (text: string, emotion: string) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  onSelectEmotion?: (emo: CharacterEmotion, timedownMs?: number) => void;
  selectedVoiceId?: string;
  onSelectVoice?: (voiceId: string) => void;
  isListening?: boolean;
  isSoundDetected?: boolean;
  onToggleClickToSpeak?: () => void;
  onStopSpeaking?: () => void;
  onToggleMobileSidebar?: () => void;
  onToggleSettings?: () => void;
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-medium"
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800/80 text-xs font-mono text-slate-400">
        <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-300">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] hover:text-white transition-colors cursor-pointer"
          title="Salin Kode"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed">
        <pre>{children}</pre>
      </div>
    </div>
  );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => (
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-5 mb-2.5 pb-1 border-b border-slate-100 dark:border-slate-800" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 my-1.5" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc pl-5 space-y-1 my-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal pl-5 space-y-1 my-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="leading-relaxed pl-0.5" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-emerald-500 pl-3.5 py-1.5 my-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-300 rounded-r-lg text-xs sm:text-sm italic" {...props} />
        ),
        table: ({ node, ...props }) => (
          <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <table className="min-w-full text-xs text-left divide-y divide-slate-200 dark:divide-slate-800" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead className="bg-slate-100 dark:bg-slate-800/90" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="px-3 py-2 text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider whitespace-nowrap" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs" {...props} />
        ),
        code: CodeBlock as any,
        a: ({ node, href, ...props }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-0.5"
            {...props}
          />
        ),
        hr: () => <hr className="my-4 border-slate-200 dark:border-slate-800" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export const AiReportPage: React.FC = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext<DashboardOutletContextType | undefined>();
  const { anomalies, setSelectedClaimForAudit } = useSimulationStream();

  // Local fallbacks if opened directly without context
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-init',
      role: 'assistant',
      content:
        'Halo! Saya asisten AI INFERA BPJS Kesehatan. Anda dapat menanyakan seputar regulasi JKN, memverifikasi anomali klaim peserta, atau melakukan penelusuran rekam data secara interaktif.',
      emotion: 'happy',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [localIsLoading, setLocalIsLoading] = useState(false);

  const messages = outletContext?.messages ?? localMessages;
  const isLoading = outletContext?.isLoading ?? localIsLoading;
  const onSendMessage = outletContext?.onSendMessage ?? ((text: string) => {
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    setLocalIsLoading(true);
    setTimeout(() => {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: 'asst-' + Date.now(),
          role: 'assistant',
          content: `Analisis Integritas JKN untuk: "${text}".\n\n### Hasil Penelusuran\nBerdasarkan Permenkes No. 16 Tahun 2019, klaim terindikasi mematuhi kaidah INA-CBG.`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setLocalIsLoading(false);
    }, 1000);
  });
  const onClearHistory = outletContext?.onClearHistory ?? (() => setLocalMessages([]));

  // Chat UI states
  const [inputText, setInputText] = useState('');
  const [isDeepThinking, setIsDeepThinking] = useState(true);
  const [activeSpeechMsgId, setActiveSpeechMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showCaseSelector, setShowCaseSelector] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [userFeedback, setUserFeedback] = useState<Record<string, 'up' | 'down'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceDropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [hasNewUnseenResponse, setHasNewUnseenResponse] = useState(false);

  // Close voice dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(e.target as Node)) {
        setIsVoiceOpen(false);
      }
    };
    if (isVoiceOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVoiceOpen]);

  const handleDownloadBAP = () => {
    const content = messages
      .map((m) => `[${m.role.toUpperCase()}] (${m.timestamp})\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bap-infera-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Intelligent Scroll Handler: detect whether user is actively reading higher up
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    setIsUserScrolledUp(!isNearBottom);
    if (isNearBottom) {
      setHasNewUnseenResponse(false);
    }
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setIsUserScrolledUp(false);
    setHasNewUnseenResponse(false);
  };

  // Intelligent Auto-scroll on incoming stream chunks
  useEffect(() => {
    if (!isUserScrolledUp) {
      scrollToBottom(false);
    } else {
      setHasNewUnseenResponse(true);
    }
  }, [messages, isLoading]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    let fullPrompt = trimmed;
    if (isDeepThinking && !trimmed.toLowerCase().includes('berpikir')) {
      // Add subtle analytical context if thinking mode enabled
      fullPrompt = trimmed;
    }

    onSendMessage(fullPrompt);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setTimeout(() => scrollToBottom(true), 60);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleToggleSpeech = (msg: ChatMessage) => {
    if (activeSpeechMsgId === msg.id) {
      SpeechService.stopSpeaking();
      setActiveSpeechMsgId(null);
      return;
    }

    setActiveSpeechMsgId(msg.id);
    if (outletContext?.onSelectEmotion && msg.emotion) {
      outletContext.onSelectEmotion(msg.emotion, 10000);
    }

    SpeechService.speak(
      msg.content,
      () => {},
      () => {},
      () => {
        setActiveSpeechMsgId(null);
        if (outletContext?.onSelectEmotion) {
          outletContext.onSelectEmotion('normal', 0);
        }
      }
    );
  };

  const handleExecuteShortcut = (shortcut: AiShortcut) => {
    if (shortcut.route) {
      navigate(shortcut.route);
    } else if (shortcut.action) {
      onSendMessage(shortcut.action);
    }
  };

  const handleSelectCaseToAudit = (caseItem: {
    code: string;
    patient: string;
    anomaly: string;
    score: number;
    raw?: any;
  }) => {
    if (caseItem.raw) {
      setSelectedClaimForAudit(caseItem.raw);
    }
    setShowCaseSelector(false);
    onSendMessage(
      `Audit berkas klaim ${caseItem.code} atas nama ${caseItem.patient}. Terindikasi: ${caseItem.anomaly} (Skor Risiko: ${caseItem.score}). Berikan analisis kesesuaian klinis, potensi kerugian DJS, dan rujukan hukumnya.`
    );
  };

  // Sample prompt cards matching user reference media_1788920242379.png
  const quickPrompts = [
    {
      title: 'Deteksi Modus Upcoding & Phantoming',
      icon: <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      prompt:
        'Jelaskan cara mendeteksi pola upcoding kode diagnosa INA-CBG dan phantom billing pada sistem VEDIKA BPJS Kesehatan.',
    },
    {
      title: 'Audit Kasus Impossible Travel Antar-Faskes',
      icon: <FileCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      prompt:
        'Bagaimana algoritma analitik mendeteksi anomali Impossible Travel kartu peserta yang digunakan bersamaan di dua faskes berjarak jauh?',
    },
    {
      title: 'Tinjau Regulasi Permenkes No. 16/2019',
      icon: <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      prompt:
        'Apa saja sanksi administratif dan langkah verifikasi pencegahan kecurangan JKN berdasarkan Permenkes No. 16 Tahun 2019?',
    },
    {
      title: 'Verifikasi Kelayakan Klaim Bersih (Clean Claim)',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      prompt:
        'Jelaskan kriteria klaim wajar (Clean Claim) yang langsung disetujui tanpa penundaan pembayaran ke faskes.',
    },
  ];

  // Cases available for quick audit
  const realTimeCases = [
    ...anomalies.slice(0, 4).map((a) => ({
      code: a.noSep,
      patient: a.namaPeserta,
      anomaly: a.anomalyTitle || 'Anomali Aliran Transaksi',
      score: a.fraudRiskScore,
      raw: a,
    })),
    ...FALLBACK_CASES.slice(0, 3).map((f) => ({
      code: f.caseCode,
      patient: f.patientName,
      anomaly: f.categoryLabel,
      score: f.riskScore,
    })),
  ];

  const hasMessages = messages.length > 0;
  const isChatActive = hasMessages && !(messages.length === 1 && messages[0].id === 'welcome-init');

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden relative">
      {/* Single Unified Header (Compact h-12 / 48px, gives maximum vertical chat space) */}
      <header className="h-12 px-3 sm:px-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile hamburger button to open sidebar */}
          <button
            type="button"
            onClick={outletContext?.onToggleMobileSidebar}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Menu Navigasi"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Official INFERA "F" Logo */}
          <div className="flex items-center gap-2">
            <img
              src="/infera-logo.png"
              alt="INFERA Logo"
              className="w-7 h-7 object-contain rounded-lg drop-shadow-xs shrink-0"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                INFERA AI
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Voice Switcher Dropdown */}
          <div className="relative" ref={voiceDropdownRef}>
            <button
              type="button"
              onClick={() => setIsVoiceOpen(!isVoiceOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              title="Ganti Suara AI (Vera / Luna)"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold">
                {outletContext?.selectedVoiceId === VOICE_SECONDARY_ID ? 'Luna' : 'Vera'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isVoiceOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    outletContext?.onSelectVoice?.(VOICE_DEFAULT_ID);
                    setIsVoiceOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors ${
                    (outletContext?.selectedVoiceId ?? VOICE_DEFAULT_ID) === VOICE_DEFAULT_ID
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Vera (Warna Hangat)</span>
                  {(outletContext?.selectedVoiceId ?? VOICE_DEFAULT_ID) === VOICE_DEFAULT_ID && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    outletContext?.onSelectVoice?.(VOICE_SECONDARY_ID);
                    setIsVoiceOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors ${
                    outletContext?.selectedVoiceId === VOICE_SECONDARY_ID
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Luna (Formal / Jelas)</span>
                  {outletContext?.selectedVoiceId === VOICE_SECONDARY_ID && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Pilih Kasus Button */}
          <button
            type="button"
            onClick={() => setShowCaseSelector(!showCaseSelector)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            title="Pilih berkas klaim riil untuk diaudit"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline text-[11px]">Pilih Kasus</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {hasMessages && (
            <>
              <button
                type="button"
                onClick={handleDownloadBAP}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Unduh Berita Acara Percakapan (BAP)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Bersihkan Percakapan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Settings Modal Toggle */}
          {outletContext?.onToggleSettings && (
            <button
              type="button"
              onClick={outletContext.onToggleSettings}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Pengaturan AI & Parameter"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Case Selector Dropdown Modal */}
      {showCaseSelector && (
        <div className="absolute top-14 right-4 sm:right-6 z-40 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 px-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Pilih Berkas Klaim Riil
            </span>
            <button
              onClick={() => setShowCaseSelector(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {realTimeCases.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectCaseToAudit(c)}
                className="w-full text-left p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-mono text-slate-500 font-semibold">{c.code}</span>
                  <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                    Skor {c.score}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                  {c.patient}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{c.anomaly}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-between relative scroll-smooth"
      >
        {!isChatActive ? (
          /* Empty / Welcome State (Exact match to ChatGPT media_1788920242379.png) */
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 text-center my-auto pb-12">
            <img
              src="/infera-logo.png"
              alt="INFERA Logo"
              className="w-14 h-14 object-contain mb-4 drop-shadow-md mx-auto"
            />
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-8 tracking-tight">
              Saya siap kapan pun Anda siap.
            </h2>

            {/* Centered Floating Input Capsule */}
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow px-4 py-3 flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                title="Menu Cepat"
              >
                <Plus className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Tanyakan apa saja seputar audit integritas JKN..."
                className="flex-1 bg-transparent border-0 outline-hidden text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />

              {/* Berpikir chip */}
              <button
                type="button"
                onClick={() => setIsDeepThinking(!isDeepThinking)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                  isDeepThinking
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>🧠</span>
                <span>Berpikir</span>
              </button>

              {/* Dictation mic */}
              <button
                type="button"
                onClick={() => outletContext?.onToggleClickToSpeak?.()}
                className={`p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0 ${
                  outletContext?.isListening ? 'text-rose-500 animate-pulse' : ''
                }`}
                title="Bicara dengan suara"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send or voice action */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() && !isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shrink-0 ${
                  inputText.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                    : 'bg-blue-500/50 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Prompt List with Icons */}
            <div className="w-full max-w-lg space-y-2 text-left">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(qp.prompt)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors text-xs sm:text-sm text-slate-700 dark:text-slate-300 group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                >
                  <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shrink-0">
                    {qp.icon}
                  </span>
                  <span className="flex-1 font-medium">{qp.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Thread Area (Exact match to ChatGPT media_1788920238372.png) */
          <div className="max-w-3xl mx-auto w-full space-y-6 pb-28 pt-2">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isPlayingAudio = activeSpeechMsgId === msg.id;
              const feedback = userFeedback[msg.id];

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[75%] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl px-5 py-3 text-sm leading-relaxed shadow-2xs">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex items-start gap-3 sm:gap-4 group">
                  <img
                    src="/infera-logo.png"
                    alt="INFERA AI"
                    className="w-7 h-7 object-contain rounded-lg shrink-0 mt-1 drop-shadow-xs"
                  />

                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Rendered Markdown Body with GFM & Table support */}
                    <div className="text-sm leading-relaxed text-slate-900 dark:text-slate-100 font-sans break-words">
                      <MarkdownRenderer content={msg.content} />
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-emerald-500 animate-pulse ml-1 align-middle rounded-xs" />
                      )}
                    </div>

                    {/* RAG Brain Injected Regulatory Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
                          <Scale className="w-3.5 h-3.5" />
                          <span>Rujukan Regulasi Terverifikasi (RAG Grounding):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cit, cIdx) => (
                            <div
                              key={cIdx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
                              title={`${cit.title}\n\n${cit.content}`}
                            >
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {cit.regulation}
                              </span>
                              {cit.article && (
                                <span className="font-mono text-[10px] text-slate-500">
                                  {cit.article}
                                </span>
                              )}
                              {cit.similarity && (
                                <span className="text-[9px] px-1 py-0.2 rounded-full bg-emerald-100/70 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold ml-0.5">
                                  {(cit.similarity * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Shortcut Chips (if available) */}
                    {msg.shortcuts && msg.shortcuts.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.shortcuts.map((sc, scIdx) => (
                          <button
                            key={scIdx}
                            type="button"
                            onClick={() => handleExecuteShortcut(sc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-semibold shadow-2xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span>{sc.label}</span>
                            {sc.route && <ExternalLink className="w-3 h-3 opacity-70" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* ChatGPT Action Buttons Bar */}
                    <div className="flex items-center gap-1 pt-1 text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Salin teks"
                      >
                        {copiedMsgId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSpeech(msg)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isPlayingAudio
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                            : 'hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={isPlayingAudio ? 'Hentikan suara' : 'Bacakan dengan suara'}
                      >
                        {isPlayingAudio ? (
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setUserFeedback((prev) => ({
                            ...prev,
                            [msg.id]: prev[msg.id] === 'up' ? undefined! : 'up',
                          }))
                        }
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          feedback === 'up'
                            ? 'text-emerald-600'
                            : 'hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="Bagus"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setUserFeedback((prev) => ({
                            ...prev,
                            [msg.id]: prev[msg.id] === 'down' ? undefined! : 'down',
                          }))
                        }
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          feedback === 'down'
                            ? 'text-rose-600'
                            : 'hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="Perlu perbaikan"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>

                      {msg.emotion && (
                        <span className="font-mono text-[10px] text-slate-400 ml-2">
                          {msg.emotion}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Assistant Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3 sm:gap-4">
                <img
                  src="/infera-logo.png"
                  alt="INFERA AI"
                  className="w-7 h-7 object-contain rounded-lg shrink-0 mt-1 drop-shadow-xs animate-pulse"
                />
                <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
                    INFERA sedang menganalisis regulasi &amp; data klaim...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating "Respons Baru di Bawah" indicator */}
      {hasNewUnseenResponse && isUserScrolledUp && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 shadow-2xl hover:scale-105 transition-all text-xs font-semibold cursor-pointer border border-slate-700/50 dark:border-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          <span>Respons Baru di Bawah</span>
        </button>
      )}

      {/* Pinned Bottom Bar (when in chat thread state) */}
      {isChatActive && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white dark:from-slate-950 dark:via-slate-950 to-transparent pt-6 pb-4 px-4 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-lg hover:shadow-xl transition-shadow px-4 py-2.5 flex items-end gap-2.5">
              {/* Plus button */}
              <button
                type="button"
                onClick={() => setShowCaseSelector(!showCaseSelector)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0 mb-0.5"
                title="Pilih Berkas Klaim"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Tanyakan apa saja seputar audit integritas JKN..."
                className="flex-1 bg-transparent border-0 outline-hidden text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none max-h-40 py-1.5 leading-relaxed"
              />

              {/* Berpikir toggle */}
              <button
                type="button"
                onClick={() => setIsDeepThinking(!isDeepThinking)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer shrink-0 mb-0.5 ${
                  isDeepThinking
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
                title="Mode penalaran mendalam"
              >
                <span>🧠</span>
                <span>Berpikir</span>
              </button>

              {/* Speech Recognition Mic */}
              <button
                type="button"
                onClick={() => outletContext?.onToggleClickToSpeak?.()}
                className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 mb-0.5 ${
                  outletContext?.isListening
                    ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 animate-pulse'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Dikte Suara"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send / Stop Action Button */}
              {isLoading ? (
                <button
                  type="button"
                  onClick={() => outletContext?.onStopSpeaking?.()}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 mb-0.5 shadow-xs"
                  title="Hentikan"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shrink-0 mb-0.5 ${
                    inputText.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                      : 'bg-blue-500/40 cursor-not-allowed'
                  }`}
                  title="Kirim Pesan"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
