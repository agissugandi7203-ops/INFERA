import React, { useState, useRef, useEffect } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { AvatarChatBox } from './components/AvatarChatBox';
import { FloatingAvatarWidget } from './components/FloatingAvatarWidget';
import { AvatarDebugControls } from './components/AvatarDebugControls';
import { AvatarController, CharacterEmotion } from './avatar/AvatarController';
import { VoiceContextMenu } from './components/VoiceContextMenu';
import {
  ChatMessage,
  OpenRouterSettings,
  DEFAULT_SETTINGS,
  getStoredSettings,
  saveStoredSettings,
  getStoredChatHistory,
  saveStoredChatHistory,
  sendOpenRouterChat,
  ANIME_VOICE_PRESETS,
} from './services/openrouter';
import { SpeechService } from './services/speech';
import {
  MessageCircle,
  Settings as SettingsIcon,
  Sparkles,
  ShieldAlert,
  HeartPulse,
  Activity,
  UserCheck,
} from 'lucide-react';

interface DashboardPageProps {
  userEmail?: string | null;
  onLogout?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  userEmail = 'dr.arief@bpjs-kesehatan.go.id',
  onLogout,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<CharacterEmotion>('normal');
  const [manualMouthOpen, setManualMouthOpen] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [settings, setSettings] = useState<OpenRouterSettings>(getStoredSettings);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSoundDetected, setIsSoundDetected] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const controllerRef = useRef<AvatarController | null>(null);
  const emotionTimedownRef = useRef<NodeJS.Timeout | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('textarea')) {
      return;
    }
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleSelectVoiceFromMenu = (voiceId: string) => {
    const newSettings = { ...settings, elevenLabsVoiceId: voiceId };
    setSettings(newSettings);
    saveStoredSettings(newSettings);

    const preset = ANIME_VOICE_PRESETS.find((v) => v.id === voiceId);
    const voiceName = preset ? preset.name : 'Anime';

    handleSelectEmotion('happy', 4000);
    SpeechService.speak(
      `Halo! Suaraku sekarang aktif menggunakan karakter ${voiceName}!`,
      (openVal) => {
        if (controllerRef.current) controllerRef.current.setMouthOpen(openVal);
        setManualMouthOpen(openVal);
      },
      undefined,
      () => {
        if (controllerRef.current) controllerRef.current.setMouthOpen(0);
        setManualMouthOpen(0);
        handleSelectEmotion('normal', 0);
      },
      settings.elevenLabsApiKey,
      voiceId
    );
  };

  const handlePreviewVoiceFromMenu = (voiceId: string) => {
    const preset = ANIME_VOICE_PRESETS.find((v) => v.id === voiceId);
    const voiceName = preset ? preset.name : 'Anime';

    handleSelectEmotion('speaking', 3000);
    SpeechService.speak(
      `Halo! Ini adalah sampel suara anime ${voiceName}.`,
      (openVal) => {
        if (controllerRef.current) controllerRef.current.setMouthOpen(openVal);
        setManualMouthOpen(openVal);
      },
      undefined,
      () => {
        if (controllerRef.current) controllerRef.current.setMouthOpen(0);
        setManualMouthOpen(0);
        handleSelectEmotion('normal', 0);
      },
      settings.elevenLabsApiKey,
      voiceId
    );
  };

  // Load chat history from localStorage
  useEffect(() => {
    const history = getStoredChatHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content:
            'Halo! Saya asisten virtual AI BPJS Kesehatan. Klik tubuh saya untuk mulai berbicara langsung menggunakan suara Anda, atau klik tombol chat di pojok kanan bawah.',
          emotion: 'happy',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  // Save history on changes
  useEffect(() => {
    if (messages.length > 0) {
      saveStoredChatHistory(messages);
    }
  }, [messages]);

  const handleClearHistory = () => {
    SpeechService.stopSpeaking();
    setMessages([]);
    localStorage.removeItem('healthathon_avatar_chat_history');
    handleSelectEmotion('normal');
  };

  const handleControllerReady = (ctrl: AvatarController) => {
    controllerRef.current = ctrl;
  };

  /**
   * Set avatar emotion with automated timedown.
   * If non-normal, reverts to normal after timedownMs (default 5.0 seconds).
   */
  const handleSelectEmotion = (emo: CharacterEmotion, timedownMs = 5000) => {
    if (emotionTimedownRef.current) {
      clearTimeout(emotionTimedownRef.current);
      emotionTimedownRef.current = null;
    }

    setCurrentEmotion(emo);
    if (controllerRef.current) {
      controllerRef.current.setEmotion(emo);
    }

    if (emo !== 'normal' && emo !== 'speaking' && timedownMs > 0) {
      emotionTimedownRef.current = setTimeout(() => {
        setCurrentEmotion('normal');
        if (controllerRef.current) {
          controllerRef.current.setEmotion('normal');
        }
      }, timedownMs);
    }
  };

  const handleMouthOpenChange = (val: number) => {
    setManualMouthOpen(val);
    if (controllerRef.current) {
      controllerRef.current.setMouthOpen(val);
    }
  };

  const handleSaveSettings = (newSettings: OpenRouterSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    setShowSettingsModal(false);
  };

  // Voice Interaction: Click to Speak
  const handleToggleClickToSpeak = () => {
    if (isListening) {
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setIsListening(false);
      handleSelectEmotion('normal', 0);
      return;
    }

    // Stop any existing speech playback before listening
    SpeechService.stopSpeaking();
    handleSelectEmotion('listening', 0);

    const stopFn = SpeechService.startListening(
      (transcript) => {
        setIsListening(false);
        setIsSoundDetected(false);
        stopListeningRef.current = null;
        if (transcript.trim()) {
          handleSendMessage(transcript.trim());
        }
      },
      (listening) => {
        setIsListening(listening);
        if (!listening) {
          setIsSoundDetected(false);
          handleSelectEmotion('normal', 0);
        }
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
        setIsSoundDetected(false);
        stopListeningRef.current = null;
        handleSelectEmotion('confused', 3000);
      },
      (soundActive) => {
        setIsSoundDetected(soundActive);
      }
    );

    stopListeningRef.current = stopFn;
  };

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim().slice(0, 1500);
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-u',
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    // AI is analyzing -> avatar assumes thinking posture
    handleSelectEmotion('thinking', 15000);

    try {
      const { reply, emotion } = await sendOpenRouterChat(text, newHistory, settings);

      const assistantMsg: ChatMessage = {
        id: 'msg-' + Date.now() + '-a',
        role: 'assistant',
        content: reply,
        emotion: emotion,
        timestamp: new Date().toISOString(),
      };

      setMessages([...newHistory, assistantMsg]);
      setIsLoading(false);

      // AI controls emotion: Trigger the AI-determined expression with timedown
      handleSelectEmotion(emotion, 5500);

      // Speak using ElevenLabs TTS — always prefer ElevenLabs key
      const el11Key = settings.elevenLabsApiKey || DEFAULT_SETTINGS.elevenLabsApiKey;
      const el11Voice = settings.elevenLabsVoiceId || DEFAULT_SETTINGS.elevenLabsVoiceId || 'cgSgspJ2msm6clMCkdW9';

      SpeechService.speak(
        reply,
        (openVal) => {
          if (controllerRef.current) {
            controllerRef.current.setMouthOpen(openVal);
          }
          setManualMouthOpen(openVal);
        },
        () => {
          // Speech started
        },
        () => {
          // Speech ended
          if (controllerRef.current) controllerRef.current.setMouthOpen(0);
          setManualMouthOpen(0);
          handleSelectEmotion('normal', 0);
        },
        el11Key,
        el11Voice
      );
    } catch (err) {
      console.error('Chat error:', err);
      setIsLoading(false);
      handleSelectEmotion('confused', 4000);

      const errorMsg: ChatMessage = {
        id: 'msg-' + Date.now() + '-err',
        role: 'assistant',
        content:
          err instanceof Error
            ? `Maaf, terjadi kendala: ${err.message}`
            : 'Maaf, terjadi kesalahan saat menghubungi layanan OpenRouter AI.',
        emotion: 'confused',
        timestamp: new Date().toISOString(),
      };

      setMessages([...newHistory, errorMsg]);
    }
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col relative overflow-x-hidden"
    >
      <DashboardHeader userEmail={userEmail} onLogout={onLogout || (() => {})} />

      {/* Main Workspace Dashboard Content */}
      <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 space-y-6">
        {/* Top Information Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900">Portal Layanan Asisten BPJS Kesehatan</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                GPT OSS 120B & ElevenLabs Anime
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Klik kanan di mana saja pada dashboard untuk <strong>Ganti Suara Anime</strong> instan, atau klik avatar untuk mulai berbicara.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => setShowSettingsModal(!showSettingsModal)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium shadow-2xs transition-colors"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span>Model AI & Suara</span>
            </button>
          </div>
        </div>

        {/* Informative Workspace Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">Konsultasi Kepesertaan JKN</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Cek status keaktifan peserta, perpindahan fasilitas kesehatan tingkat pertama (FKTP), serta panduan pembayaran iuran.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">Skrining Kesehatan Mandiri</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Deteksi dini risiko penyakit kardiovaskular, diabetes melitus, dan hipertensi dengan panduan interaktif asisten AI.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">Informasi Klaim & Faskes</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Akses informasi alur rujukan berjenjang, ketersediaan kamar rawat inap faskes mitra, dan prosedur klaim terpadu.
            </p>
          </div>
        </div>

        {/* Optional Settings Panel */}
        {showSettingsModal && (
          <div className="animate-in fade-in slide-in-from-top-3 duration-200 max-w-xl">
            <AvatarDebugControls
              currentEmotion={currentEmotion}
              onSelectEmotion={(emo) => handleSelectEmotion(emo, 6000)}
              manualMouthOpen={manualMouthOpen}
              onMouthOpenChange={handleMouthOpenChange}
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          </div>
        )}
      </main>

      {/* Floating Transparent Avatar (Always mounted to eliminate WebGL re-init glitch) */}
      <FloatingAvatarWidget
        currentEmotion={currentEmotion}
        manualMouthOpen={manualMouthOpen}
        onControllerReady={handleControllerReady}
        onClickToSpeak={handleToggleClickToSpeak}
        isListening={isListening}
        isSoundDetected={isSoundDetected}
        onOpenChat={() => setIsChatOpen(true)}
        onMinimize={() => setIsMinimized(true)}
        isMinimized={isMinimized}
      />

      {/* Restore Avatar Pop-Up Badge when Minimized */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-md hover:bg-emerald-50 text-neutral-800 hover:text-emerald-700 rounded-full shadow-xl border border-neutral-200/90 text-xs font-semibold transition-all hover:scale-105 active:scale-95 group animate-in fade-in slide-in-from-bottom-3 duration-200"
          title="Tampilkan kembali asisten avatar"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Tampilkan Avatar</span>
          <UserCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Floating Bottom-Right Chat AI Pop-Up Button (when closed) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 group"
          title="Buka Chat Percakapan AI"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border-2 border-emerald-600 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-semibold tracking-wide">Chat Asisten AI</span>
          <Sparkles className="w-3.5 h-3.5 text-emerald-200 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Floating Chat AI Pop-Up Window (Responsive for Mobile & Desktop) */}
      {isChatOpen && (
        <div className="fixed bottom-3 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:w-[420px] max-w-[calc(100vw-24px)] shadow-2xl rounded-2xl overflow-hidden border border-neutral-200/90 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <AvatarChatBox
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
            onTriggerLipSync={handleMouthOpenChange}
            onAvatarStateChange={(emo) => handleSelectEmotion(emo, 6000)}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      )}

      {/* Right-Click Context Menu for Quick Voice Selection */}
      {contextMenu && (
        <VoiceContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          currentVoiceId={settings.elevenLabsVoiceId || DEFAULT_SETTINGS.elevenLabsVoiceId || 'cgSgspJ2msm6clMCkdW9'}
          onSelectVoice={handleSelectVoiceFromMenu}
          onOpenAdvancedSettings={() => setShowSettingsModal(true)}
          onPreviewVoice={handlePreviewVoiceFromMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
