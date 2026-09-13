import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import {
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
  Scale,
  FileCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
  Menu,
  ArrowDown,
  Brain,
  Paperclip,
  Image as ImageIcon,
  Activity,
  MapPin,
  Stethoscope,
  Pill,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage, ChatAttachment, AiShortcut, getStoredSettings } from '../services/openrouter';
import { CharacterEmotion } from '../avatar/AvatarController';
import { SpeechService } from '../services/speech';
import {
  TTSProcessor,
  VOICE_CHAT_DEFAULT_ID,
  VOICE_CHAT_SECONDARY_ID,
} from '../services/tts-processor';
import { useSimulationStream } from '../simulation/SimulationContext';
import { FALLBACK_CASES } from '../../../services/participantRiskApi';
import { AIRecommendationCard } from '../components/AIRecommendationCard';
import { ToolStatusBadge } from '../components/ToolStatusBadge';
import { ActionConfirmationModal } from '../components/ActionConfirmationModal';
import { InvestigationActionPanel } from '../components/InvestigationActionPanel';
import { AiResponseRenderer } from '../components/AiResponseRenderer';
import type { ActionRecommendation } from '@healthathon/shared';

interface DashboardOutletContextType {
  onTriggerAvatarSpeech?: (text: string, emotion: string) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, attachments?: ChatAttachment[], enableReasoning?: boolean) => void;
  onClearHistory: () => void;
  onSelectEmotion?: (emo: CharacterEmotion, timedownMs?: number) => void;
  selectedVoiceId?: string; // AI Kanan (Avatar)
  onSelectVoice?: (voiceId: string) => void;
  selectedChatVoiceId?: string; // Inti AI Chat (Narator INFERA)
  onSelectChatVoice?: (voiceId: string) => void;
  chatVoiceId?: string;
  elevenLabsApiKey?: string;
  isListening?: boolean;
  isSoundDetected?: boolean;
  onToggleClickToSpeak?: () => void;
  onStopSpeaking?: () => void;
  onStopStreaming?: () => void;
  onToggleMobileSidebar?: () => void;
  onToggleSettings?: () => void;
}

interface ThinkingAccordionProps {
  reasoning?: string;
  isStreaming?: boolean;
  isEnabled?: boolean;
}

const ThinkingAccordion: React.FC<ThinkingAccordionProps> = ({ reasoning, isStreaming, isEnabled = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isEnabled || !reasoning) return null;

  return (
    <div className="my-2 transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
            : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
        }`}
        title="Klik untuk melihat alur penalaran AI"
      >
        <Brain
          className={`w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0 ${
            isStreaming ? 'animate-pulse' : ''
          }`}
        />
        <span className="font-semibold">Penalaran</span>
        {isStreaming ? (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium animate-pulse">
            (Sedang memproses...)
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            ({reasoning.length} karakter)
          </span>
        )}
        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-0.5">
          {isOpen ? 'Tutup' : 'Lihat'}
        </span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 shadow-inner animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              Alur Penalaran AI (Internal Thought Process)
            </span>
            {isStreaming && (
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-ping" />
                Live Reasoning
              </span>
            )}
          </div>
          <div className="text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto custom-scrollbar">
            {reasoning}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 bg-slate-500 animate-pulse ml-1 align-middle rounded-xs" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface PlusAttachmentMenuProps {
  onOpenCaseSelector: () => void;
  onUploadImage: () => void;
  onUploadPdf: () => void;
  onUploadAll: () => void;
  onClose: () => void;
  positionClass?: string;
}

const PlusAttachmentMenu: React.FC<PlusAttachmentMenuProps> = ({
  onOpenCaseSelector,
  onUploadImage,
  onUploadPdf,
  onUploadAll,
  onClose,
  positionClass = 'bottom-full mb-3 left-0',
}) => {
  return (
    <div
      className={`absolute ${positionClass} z-50 w-64 sm:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150`}
    >
      <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center justify-between">
        <span>Tambah Lampiran / Berkas</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Option 1: Upload Image */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onUploadImage();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <ImageIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Upload Image
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Resep obat, kwitansi, bukti foto (PNG, JPG)
          </div>
        </div>
      </button>

      {/* Option 2: Upload PDF */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onUploadPdf();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Upload PDF
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Berkas klaim, SEP, resume medis (OCR)
          </div>
        </div>
      </button>

      {/* Option 3: Pilih Berkas dari Perangkat */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onUploadAll();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Paperclip className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Pilih Berkas Lainnya
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Jelajahi semua berkas dari perangkat
          </div>
        </div>
      </button>

      <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

      {/* Option 4: Pilih Kasus Klaim Simulasi */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onOpenCaseSelector();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors group cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <FileCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            Pilih Berkas Klaim (Simulasi)
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Budi Santoso, Hendra Wijaya, dsb.
          </div>
        </div>
      </button>
    </div>
  );
};

export const AiReportPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const onSendMessage = outletContext?.onSendMessage ?? ((text: string, atts?: ChatAttachment[], enableReasoning?: boolean) => {
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      attachments: atts,
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
          isReasoningEnabled: enableReasoning,
          timestamp: new Date().toISOString(),
        },
      ]);
      setLocalIsLoading(false);
    }, 1000);
  });
  const onClearHistory = outletContext?.onClearHistory ?? (() => setLocalMessages([]));

  // Chat UI states
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const allFileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuWelcomeRef = useRef<HTMLDivElement>(null);
  const plusMenuBottomRef = useRef<HTMLDivElement>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [activeSpeechMsgId, setActiveSpeechMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showCaseSelector, setShowCaseSelector] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [userFeedback, setUserFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [isDictating, setIsDictating] = useState(false);
  const [dictateError, setDictateError] = useState<string | null>(null);
  const [isDictatingSoundDetected, setIsDictatingSoundDetected] = useState<boolean>(false);
  const isDictatingRef = useRef<boolean>(false);
  const lastDictateToggleTimeRef = useRef<number>(0);
  const stopDictateRef = useRef<(() => void) | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (attachments.length >= 3) {
        alert('Maksimal 3 lampiran sekaligus (Gambar atau Dokumen PDF).');
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (!isImage && !isPdf) {
        alert('Hanya berkas Gambar (PNG, JPG, WEBP, GIF) atau Dokumen PDF yang didukung oleh OpenRouter.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran berkas maksimal 10 MB per berkas.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const newAtt: ChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: isPdf ? 'pdf' : 'image',
          mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
          dataUrl: result,
          size: file.size,
        };
        setAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const [selectedRecForConfirm, setSelectedRecForConfirm] = useState<ActionRecommendation | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(true);

  const allRecommendations = React.useMemo(() => {
    const list: ActionRecommendation[] = [];
    messages.forEach((m) => {
      if (m.recommendations && m.recommendations.length > 0) {
        list.push(...m.recommendations);
      }
    });
    return list;
  }, [messages]);

  const handleExecuteRecommendation = (rec: ActionRecommendation) => {
    if (rec.targetRoute) {
      const target = rec.targetRoute.startsWith('/dashboard')
        ? rec.targetRoute
        : `/dashboard${rec.targetRoute.startsWith('/') ? '' : '/'}${rec.targetRoute}`;
      navigate(target);
    }
  };

  const handleOpenConfirmModal = (rec: ActionRecommendation) => {
    setSelectedRecForConfirm(rec);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = (rec: ActionRecommendation, auditorNotes: string) => {
    const target = rec.targetName || rec.targetId;
    sendUserPrompt(
      `[KONFIRMASI AUDITOR RESMI] Tindakan "${rec.title}" atas subjek "${target}" telah diverifikasi dan disetujui. Catatan Berita Acara: "${auditorNotes || 'Disetujui sesuai Permenkes No. 16 Tahun 2019.'}"`
    );
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceDropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [hasNewUnseenResponse, setHasNewUnseenResponse] = useState(false);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (stopDictateRef.current) {
        stopDictateRef.current();
        stopDictateRef.current = null;
      }
    };
  }, []);

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

  // Close plus attachment menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideWelcome = plusMenuWelcomeRef.current && plusMenuWelcomeRef.current.contains(target);
      const insideBottom = plusMenuBottomRef.current && plusMenuBottomRef.current.contains(target);
      if (!insideWelcome && !insideBottom) {
        setShowPlusMenu(false);
      }
    };
    if (showPlusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlusMenu]);

  // Intelligent Scroll Handler: detect whether user is actively reading higher up
  const shouldFocusLatestPromptRef = useRef(false);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    setIsUserScrolledUp(!isNearBottom);
    if (isNearBottom) {
      setHasNewUnseenResponse(false);
    }
  };

  /**
   * Smoothly scrolls to the latest content at the bottom of the conversation.
   */
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
    setIsUserScrolledUp(false);
    setHasNewUnseenResponse(false);
  };

  const scrollToLatestPrompt = scrollToBottom;

  // Centralized user prompt dispatcher
  const sendUserPrompt = (text: string, atts?: ChatAttachment[], reasoning?: boolean) => {
    shouldFocusLatestPromptRef.current = true;
    setIsUserScrolledUp(false);
    onSendMessage(text, atts, reasoning ?? isDeepThinking);
    setTimeout(() => scrollToBottom(true), 50);
  };

  // Handle auto-dispatched prompt from "Uji AI" navigation (e.g. TransactionsPage)
  const processedAutoPromptRef = useRef(false);
  useEffect(() => {
    const state = location.state as { autoPrompt?: string; claim?: any } | undefined;
    if (state?.autoPrompt && !processedAutoPromptRef.current) {
      processedAutoPromptRef.current = true;
      const promptToSend = state.autoPrompt;
      window.history.replaceState({}, document.title);
      setTimeout(() => {
        sendUserPrompt(promptToSend, undefined, false);
      }, 120);
    }
  }, [location.state]);

  // Scroll effect triggered when new messages are added
  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      if (!isUserScrolledUp) {
        scrollToBottom(true);
      } else {
        setHasNewUnseenResponse(true);
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, isUserScrolledUp]);

  // If streaming occurs while user is not scrolled up, follow the streaming text smoothly
  useEffect(() => {
    if (isLoading && !isUserScrolledUp) {
      scrollToBottom(false);
    }
  }, [messages, isLoading, isUserScrolledUp]);

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
    if ((!trimmed && attachments.length === 0) || isLoading) return;

    sendUserPrompt(
      trimmed,
      attachments.length > 0 ? attachments : undefined,
      isDeepThinking
    );
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    sendUserPrompt(promptText, undefined, isDeepThinking);
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

  const handleToggleDictate = () => {
    const now = Date.now();
    if (now - lastDictateToggleTimeRef.current < 450) return;
    lastDictateToggleTimeRef.current = now;

    if (isDictatingRef.current) {
      isDictatingRef.current = false;
      if (stopDictateRef.current) {
        stopDictateRef.current();
        stopDictateRef.current = null;
      }
      setIsDictating(false);
      setIsDictatingSoundDetected(false);
      return;
    }

    SpeechService.unlockAudio();
    SpeechService.stopSpeaking();
    isDictatingRef.current = true;
    setIsDictating(true);
    setDictateError(null);

    const baseInput = inputText.trim();

    const stopFn = SpeechService.startListening(
      (transcript) => {
        isDictatingRef.current = false;
        setIsDictating(false);
        setIsDictatingSoundDetected(false);
        stopDictateRef.current = null;
        if (transcript.trim()) {
          setInputText(baseInput ? `${baseInput} ${transcript.trim()}` : transcript.trim());
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }
      },
      (listening) => {
        isDictatingRef.current = listening;
        setIsDictating(listening);
        if (!listening) {
          setIsDictatingSoundDetected(false);
        }
      },
      (err) => {
        console.warn('[Dictate] Speech recognition error:', err);
        isDictatingRef.current = false;
        setIsDictating(false);
        setIsDictatingSoundDetected(false);
        stopDictateRef.current = null;
        setDictateError(err);
        setTimeout(() => setDictateError(null), 8000);
      },
      (soundActive) => {
        setIsDictatingSoundDetected(soundActive);
      },
      (liveText) => {
        if (liveText.trim()) {
          setInputText(baseInput ? `${baseInput} ${liveText.trim()}` : liveText.trim());
        }
      }
    );

    stopDictateRef.current = stopFn;
  };

  const handleToggleSpeech = (msg: ChatMessage) => {
    SpeechService.unlockAudio();
    if (activeSpeechMsgId === msg.id) {
      SpeechService.stopSpeaking();
      setActiveSpeechMsgId(null);
      return;
    }

    setActiveSpeechMsgId(msg.id);
    if (outletContext?.onSelectEmotion && msg.emotion) {
      outletContext.onSelectEmotion(msg.emotion, 10000);
    }

    const storedSettings = getStoredSettings();
    const apiKey = outletContext?.elevenLabsApiKey || storedSettings.elevenLabsApiKey;
    const chatVoice =
      outletContext?.selectedChatVoiceId ||
      outletContext?.chatVoiceId ||
      storedSettings.chatVoiceId ||
      VOICE_CHAT_DEFAULT_ID;

    // Use TTSProcessor to extract clean spoken summary (up to 450 chars) without raw markdown/tables
    const spokenText = TTSProcessor.extractSpokenSummary(msg.content, undefined, 450);

    SpeechService.speak(
      spokenText,
      () => {},
      () => {},
      () => {
        setActiveSpeechMsgId(null);
        if (outletContext?.onSelectEmotion) {
          outletContext.onSelectEmotion('normal', 0);
        }
      },
      apiKey,
      chatVoice
    );
  };

  const handleExecuteShortcut = (shortcut: AiShortcut) => {
    const rawRoute = shortcut.route || shortcut.path;
    if (rawRoute) {
      const target = rawRoute.startsWith('/dashboard')
        ? rawRoute
        : `/dashboard${rawRoute.startsWith('/') ? '' : '/'}${rawRoute}`;
      navigate(target);
    } else if (shortcut.action) {
      sendUserPrompt(shortcut.action);
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
    sendUserPrompt(
      `Audit berkas klaim ${caseItem.code} atas nama ${caseItem.patient}. Terindikasi: ${caseItem.anomaly} (Skor Risiko: ${caseItem.score}). Berikan analisis kesesuaian klinis, potensi kerugian DJS, dan rujukan hukumnya.`
    );
  };

  // Quick Prompt Recommendations (5 cards: 3 on top row, 2 on bottom row)
  const quickPrompts = [
    {
      title: 'Upcoding & Phantom Billing',
      desc: 'Deteksi anomali penagihan fiktif & lonjakan severity klaim INA-CBG.',
      icon: <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      prompt:
        'Jelaskan cara mendeteksi pola upcoding kode diagnosa INA-CBG dan phantom billing pada sistem INFERA BPJS Kesehatan.',
    },
    {
      title: 'Impossible Travel Antar-Faskes',
      desc: 'Uji kecepatan perpindahan geografis & identitas pinjaman peserta.',
      icon: <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      prompt:
        'Tolong lakukan audit dan analisis mendalam terhadap kasus Impossible Travel pasien Budi Santoso (0001847291038). Uji indikator fraud spasial-temporal dan berikan rekomendasi tindakannya.',
    },
    {
      title: 'Regulasi Permenkes No. 16/2019',
      desc: 'Kaidah pencegahan fraud, sanksi administratif, & pengembalian DJS.',
      icon: <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      prompt:
        'Apa saja sanksi administratif dan langkah verifikasi pencegahan kecurangan JKN berdasarkan Permenkes No. 16 Tahun 2019?',
    },
    {
      title: 'Doctor Shopping (DSI)',
      desc: 'Deteksi kunjungan poli berulang di banyak FKRTL dalam rentang 7 hari.',
      icon: <Stethoscope className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      prompt:
        'Tolong analisis riwayat klaim pasien Hendra Wijaya (0002938471920) terkait indikasi Doctor Shopping dan peresepan obat berulang di faskes berbeda.',
    },
    {
      title: 'Obat PRB & Cooling-off Alkes',
      desc: 'Pengawasan siklus obat kronis 30 hari & batas waktu klaim kacamata/alkes.',
      icon: <Pill className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      prompt:
        'Bagaimana aturan siklus 30 hari obat Program Rujuk Balik (PRB) dan batasan masa tunggu (cooling-off) klaim kacamata serta alkes menurut Permenkes 3/2023?',
    },
  ];

  // Cases available for quick audit
  const realTimeCases = [
    ...anomalies.slice(0, 4).map((a: any) => ({
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
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Chat Narator Voice Switcher Dropdown (Inti AI Chat) */}
          <div className="relative" ref={voiceDropdownRef}>
            <button
              type="button"
              onClick={() => setIsVoiceOpen(!isVoiceOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              title="Ganti Suara Narator Inti AI Chat (Auditor / Analis)"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold">
                {(outletContext?.selectedChatVoiceId ?? VOICE_CHAT_DEFAULT_ID) === VOICE_CHAT_SECONDARY_ID
                  ? 'Analis'
                  : 'Auditor'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isVoiceOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  Suara Inti AI Chat
                </div>
                <button
                  type="button"
                  onClick={() => {
                    outletContext?.onSelectChatVoice?.(VOICE_CHAT_DEFAULT_ID);
                    setIsVoiceOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors ${
                    (outletContext?.selectedChatVoiceId ?? VOICE_CHAT_DEFAULT_ID) === VOICE_CHAT_DEFAULT_ID
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs">Auditor Sistem</div>
                    <div className="text-[10px] text-slate-400">Formal, Wibawa & Tegas</div>
                  </div>
                  {(outletContext?.selectedChatVoiceId ?? VOICE_CHAT_DEFAULT_ID) === VOICE_CHAT_DEFAULT_ID && (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    outletContext?.onSelectChatVoice?.(VOICE_CHAT_SECONDARY_ID);
                    setIsVoiceOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors ${
                    outletContext?.selectedChatVoiceId === VOICE_CHAT_SECONDARY_ID
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs">Analis Sistem</div>
                    <div className="text-[10px] text-slate-400">Netral, Terstruktur & Presisi</div>
                  </div>
                  {outletContext?.selectedChatVoiceId === VOICE_CHAT_SECONDARY_ID && (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
            <button
              type="button"
              onClick={onClearHistory}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Bersihkan Percakapan"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 relative scroll-smooth ${
              !isChatActive ? 'flex flex-col justify-center' : ''
            }`}
          >
        {!isChatActive ? (
          /* Empty / Welcome State (Exact match to ChatGPT media_1788920242379.png) */
          <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full px-4 text-center my-auto pb-12">
            <img
              src="/infera-logo.png"
              alt="INFERA Logo"
              className="w-14 h-14 object-contain mb-4 drop-shadow-md mx-auto"
            />
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-8 tracking-tight">
              Saya siap kapan pun Anda siap.
            </h2>

            {/* Active Attachment Chips Preview in Welcome State */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    {att.type === 'image' ? (
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    <span className="max-w-[180px] truncate font-medium">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-1 cursor-pointer"
                      title="Hapus lampiran"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Live Dictation / Error Feedback */}
            {dictateError && (
              <div className="w-full mb-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200 shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="flex-1 font-medium">{dictateError}</span>
                <button type="button" onClick={() => setDictateError(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isDictating && (
              <div className="w-full mb-3 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold">
                    {isDictatingSoundDetected ? 'Mendengarkan suara Anda...' : 'Mikrofon aktif — silakan bicara sekarang...'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleDictate}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 underline cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            )}

            {/* Centered Floating Input Capsule */}
            <div className="w-full bg-slate-100/75 dark:bg-slate-900/60 border-0 rounded-3xl shadow-none px-4 py-3 flex items-center gap-3 mb-6 focus-within:bg-slate-100 dark:focus-within:bg-slate-900/90 transition-all relative">
              {/* Unified Plus Button & Dropdown Menu */}
              <div className="relative shrink-0" ref={plusMenuWelcomeRef}>
                <button
                  type="button"
                  onClick={() => setShowPlusMenu(!showPlusMenu)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-2xs ${
                    showPlusMenu
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title="Tambah lampiran gambar/PDF atau pilih kasus"
                >
                  <Plus className={`w-4 h-4 transition-transform duration-150 ${showPlusMenu ? 'rotate-45' : ''}`} />
                </button>

                {showPlusMenu && (
                  <PlusAttachmentMenu
                    onOpenCaseSelector={() => setShowCaseSelector(true)}
                    onUploadImage={() => imageInputRef.current?.click()}
                    onUploadPdf={() => pdfInputRef.current?.click()}
                    onUploadAll={() => allFileInputRef.current?.click()}
                    onClose={() => setShowPlusMenu(false)}
                    positionClass="bottom-full mb-3 left-0"
                  />
                )}
              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Tanyakan apa saja seputar audit integritas JKN..."
                style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 shadow-none text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />

              {/* Berpikir chip */}
              <button
                type="button"
                onClick={() => setIsDeepThinking(!isDeepThinking)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  isDeepThinking
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Penalaran</span>
              </button>

              {/* Dictation mic */}
              <button
                type="button"
                onClick={handleToggleDictate}
                className={`p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0 ${
                  isDictating ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 animate-pulse' : ''
                }`}
                title={isDictating ? 'Sedang mendengarkan... Klik untuk berhenti' : 'Dikte suara ke teks'}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send or voice action */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() && attachments.length === 0 && !isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  inputText.trim() || attachments.length > 0
                    ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-2xs'
                    : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-400'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Prompt Cards (Arranged cleanly as 3 on top, 2 on bottom) */}
            <div className="w-full max-w-3xl space-y-2.5 text-left">
              {/* Row 1: 3 cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {quickPrompts.slice(0, 3).map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPrompt(qp.prompt)}
                    className="flex flex-col text-left p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shrink-0 shadow-2xs">
                        {qp.icon}
                      </span>
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {qp.title}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {qp.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Row 2: 2 cards (centered) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto">
                {quickPrompts.slice(3, 5).map((qp, idx) => (
                  <button
                    key={idx + 3}
                    type="button"
                    onClick={() => handleQuickPrompt(qp.prompt)}
                    className="flex flex-col text-left p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shrink-0 shadow-2xs">
                        {qp.icon}
                      </span>
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {qp.title}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {qp.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat Thread Area (Exact match to ChatGPT media_1788920238372.png) */
          <div className="max-w-3xl mx-auto w-full space-y-6 pb-36 pt-2">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isPlayingAudio = activeSpeechMsgId === msg.id;
              const feedback = userFeedback[msg.id];

              if (isUser) {
                return (
                  <div id={`msg-${msg.id}`} key={msg.id} className="flex justify-end pt-4 scroll-mt-4">
                    <div className="max-w-[85%] sm:max-w-[75%] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl px-5 py-3 text-base leading-relaxed shadow-2xs space-y-2">
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1 pb-1">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs"
                            >
                              {att.type === 'image' ? (
                                <div className="space-y-1 p-1">
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    className="max-h-48 rounded-lg object-cover w-auto"
                                  />
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 px-1 truncate max-w-[180px]">
                                    {att.name}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2.5 p-2.5 max-w-[240px]">
                                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                      {att.name}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 uppercase">
                                      PDF Berkas Klaim
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div>{msg.content}</div>
                    </div>
                  </div>
                );
              }

              return (
                <div id={`msg-${msg.id}`} key={msg.id} className="flex items-start gap-3 sm:gap-4 group pt-2">
                  <img
                    src="/infera-logo.png"
                    alt="INFERA AI"
                    className="w-7 h-7 object-contain rounded-lg shrink-0 mt-1 drop-shadow-xs"
                  />

                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Tool Steps Stepper Badge */}
                    {msg.toolSteps && msg.toolSteps.length > 0 && (
                      <ToolStatusBadge steps={msg.toolSteps} />
                    )}

                    {/* Thinking / Reasoning Accordion */}
                    <ThinkingAccordion
                      reasoning={msg.reasoning}
                      isStreaming={msg.isThinking}
                      isEnabled={msg.isReasoningEnabled ?? isDeepThinking}
                    />

                    {/* Rendered Markdown Body with GFM & Table support */}
                    <div className="text-[15px] sm:text-base leading-relaxed text-slate-900 dark:text-slate-100 font-sans break-words">
                      <AiResponseRenderer content={msg.content} />
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
                            {(sc.route || sc.path) && <ExternalLink className="w-3 h-3 opacity-70" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* AI Action Recommendation Cards (Two-Phase Action Model) */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="space-y-3 pt-1">
                        {msg.recommendations.map((rec) => (
                          <AIRecommendationCard
                            key={rec.id}
                            recommendation={rec}
                            onExecuteAction={handleExecuteRecommendation}
                            onConfirmAction={handleOpenConfirmModal}
                          />
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
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
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
          onClick={() => scrollToLatestPrompt(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 shadow-2xl hover:scale-105 transition-all text-xs font-semibold cursor-pointer border border-slate-700/50 dark:border-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          <span>Lihat Respon Terbaru</span>
        </button>
      )}

      {/* Pinned Bottom Bar (when in chat thread state) */}
      {isChatActive && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white dark:from-slate-950 dark:via-slate-950 to-transparent pt-6 pb-4 px-4 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            {/* Active Attachment Chips Preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-2 px-1">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 text-xs text-slate-800 dark:text-slate-200 shadow-2xs animate-in fade-in slide-in-from-bottom-1 duration-150"
                  >
                    {att.type === 'image' ? (
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    <span className="max-w-[160px] truncate font-medium">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-1 cursor-pointer"
                      title="Hapus lampiran"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Live Dictation / Error Feedback */}
            {dictateError && (
              <div className="w-full mb-2 p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200 shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="flex-1 font-medium">{dictateError}</span>
                <button type="button" onClick={() => setDictateError(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isDictating && (
              <div className="w-full mb-2 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold">
                    {isDictatingSoundDetected ? 'Mendengarkan suara Anda...' : 'Mikrofon aktif — silakan bicara sekarang...'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleDictate}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 underline cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            )}

            <div className="bg-slate-100/80 dark:bg-slate-900/70 border-0 rounded-3xl shadow-none px-4 py-2.5 flex items-end gap-2.5 focus-within:bg-slate-100 dark:focus-within:bg-slate-900/90 transition-all relative">
              {/* Unified Plus Button & Dropdown Menu */}
              <div className="relative shrink-0 mb-0.5" ref={plusMenuBottomRef}>
                <button
                  type="button"
                  onClick={() => setShowPlusMenu(!showPlusMenu)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-2xs ${
                    showPlusMenu
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title="Tambah lampiran gambar/PDF atau pilih kasus"
                >
                  <Plus className={`w-4 h-4 transition-transform duration-150 ${showPlusMenu ? 'rotate-45' : ''}`} />
                </button>

                {showPlusMenu && (
                  <PlusAttachmentMenu
                    onOpenCaseSelector={() => setShowCaseSelector(true)}
                    onUploadImage={() => imageInputRef.current?.click()}
                    onUploadPdf={() => pdfInputRef.current?.click()}
                    onUploadAll={() => allFileInputRef.current?.click()}
                    onClose={() => setShowPlusMenu(false)}
                    positionClass="bottom-full mb-3 left-0"
                  />
                )}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                maxLength={3000}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Tanyakan apa saja seputar audit integritas JKN..."
                style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 shadow-none text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none max-h-40 py-1.5 leading-relaxed"
              />

              {/* Berpikir toggle */}
              <button
                type="button"
                onClick={() => setIsDeepThinking(!isDeepThinking)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 mb-0.5 ${
                  isDeepThinking
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
                title="Mode penalaran mendalam"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Penalaran</span>
              </button>

              {/* Speech Recognition Mic */}
              <button
                type="button"
                onClick={handleToggleDictate}
                className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 mb-0.5 ${
                  isDictating
                    ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 animate-pulse'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={isDictating ? 'Sedang mendengarkan... Klik untuk berhenti' : 'Dikte Suara ke Teks'}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send / Stop Action Button */}
              {isLoading ? (
                <button
                  type="button"
                  onClick={() => {
                    outletContext?.onStopStreaming?.();
                    outletContext?.onStopSpeaking?.();
                  }}
                  className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 mb-0.5 shadow-xs"
                  title="Hentikan Analisis AI"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() && attachments.length === 0}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 mb-0.5 ${
                    inputText.trim() || attachments.length > 0
                      ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-2xs'
                      : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-400'
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

        {/* Right side Investigation Action Center Panel */}
        {allRecommendations.length > 0 && (
          <InvestigationActionPanel
            isOpen={isActionPanelOpen}
            onToggle={() => setIsActionPanelOpen(!isActionPanelOpen)}
            recommendations={allRecommendations}
            onExecuteRecommendation={handleExecuteRecommendation}
            onConfirmRecommendation={handleOpenConfirmModal}
          />
        )}
      </div>

      {/* Confirmation Modal (Level 3 Side-Effect Actions) */}
      <ActionConfirmationModal
        isOpen={isConfirmModalOpen}
        recommendation={selectedRecForConfirm}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setSelectedRecForConfirm(null);
        }}
        onConfirm={handleConfirmAction}
      />

      {/* Hidden File Inputs for Multimodal Attachments */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={allFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
};
