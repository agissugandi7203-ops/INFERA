import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardTopNav } from './DashboardTopNav';
import { FloatingAvatarWidget } from '../components/FloatingAvatarWidget';
import { AvatarChatBox } from '../components/AvatarChatBox';
import { AvatarDebugControls } from '../components/AvatarDebugControls';
import { AvatarController, CharacterEmotion } from '../avatar/AvatarController';
import {
  ChatMessage,
  OpenRouterSettings,
  DEFAULT_SETTINGS,
  getStoredSettings,
  saveStoredSettings,
  getStoredChatHistory,
  saveStoredChatHistory,
  sendOpenRouterChat,
} from '../services/openrouter';
import { SpeechService } from '../services/speech';
import {
  VOICE_DEFAULT_ID,
  VOICE_SECONDARY_ID,
  TTSProcessor,
} from '../services/tts-processor';
import { MessageCircle, UserCheck, ShieldAlert, X } from 'lucide-react';
import { SimulationProvider } from '../simulation/SimulationContext';
import type { JknClaimRecord } from '@healthathon/shared';

interface DashboardLayoutProps {
  userEmail?: string | null;
  onLogout?: () => void;
}

const DashboardLayoutContent: React.FC<
  DashboardLayoutProps & {
    latestAnomalyAlert: JknClaimRecord | null;
    clearAnomalyAlert: () => void;
  }
> = ({
  userEmail = 'dr.arief@bpjs-kesehatan.go.id',
  onLogout,
  latestAnomalyAlert,
  clearAnomalyAlert,
}) => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isAlertExiting, setIsAlertExiting] = useState<boolean>(false);

  // Auto-dismiss anomaly alert after 5 seconds with smooth slide-up
  useEffect(() => {
    if (!latestAnomalyAlert) {
      setIsAlertExiting(false);
      return;
    }
    setIsAlertExiting(false);

    const exitTimer = setTimeout(() => {
      setIsAlertExiting(true);
    }, 4500);

    const clearTimer = setTimeout(() => {
      clearAnomalyAlert();
      setIsAlertExiting(false);
    }, 5000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(clearTimer);
    };
  }, [latestAnomalyAlert, clearAnomalyAlert]);

  // Avatar & Chat States (Persistent across all sub-pages for Anti-Lag)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<CharacterEmotion>('normal');
  const [manualMouthOpen, setManualMouthOpen] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [settings, setSettings] = useState<OpenRouterSettings>(getStoredSettings);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSoundDetected, setIsSoundDetected] = useState<boolean>(false);

  const controllerRef = useRef<AvatarController | null>(null);
  const emotionTimedownRef = useRef<NodeJS.Timeout | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

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

  // React to streaming anomalies
  useEffect(() => {
    if (!latestAnomalyAlert) return;
    if (latestAnomalyAlert.riskLevel === 'CRITICAL') {
      handleSelectEmotion('surprised', 4000);
    } else if (latestAnomalyAlert.riskLevel === 'HIGH') {
      handleSelectEmotion('thinking', 3500);
    }
  }, [latestAnomalyAlert]);

  const handleSelectVoice = (voiceId: string) => {
    const validVoiceId = voiceId === VOICE_SECONDARY_ID ? VOICE_SECONDARY_ID : VOICE_DEFAULT_ID;
    const newSettings = { ...settings, elevenLabsVoiceId: validVoiceId };
    setSettings(newSettings);
    saveStoredSettings(newSettings);

    const voiceLabel = validVoiceId === VOICE_DEFAULT_ID ? 'Vera (Default)' : 'Luna';
    handleSelectEmotion('happy', 3500);

    const confirmText = `Suara telah diubah ke ${voiceLabel}. Saya siap membantu!`;
    const confirmSettings = TTSProcessor.computeVoiceSettings({
      text: confirmText,
      emotion: 'happy',
      expressions: [{ type: 'happy', intensity: 0.6 }],
    });

    SpeechService.speak(
      confirmText,
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
      newSettings.elevenLabsApiKey || DEFAULT_SETTINGS.elevenLabsApiKey,
      validVoiceId,
      confirmSettings
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
            'Halo! Saya asisten AI INFERA (Integrated Fraud Early-Warning & Risk Analytics) BPJS Kesehatan. Anda dapat menanyakan seputar regulasi JKN, memverifikasi anomali klaim peserta, atau berdiskusi langsung dengan suara.',
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

    handleSelectEmotion('thinking', 15000);

    try {
      const { reply, emotion, metadata } = await sendOpenRouterChat(text, newHistory, settings);

      const assistantMsg: ChatMessage = {
        id: 'msg-' + Date.now() + '-a',
        role: 'assistant',
        content: reply,
        emotion: emotion,
        timestamp: new Date().toISOString(),
      };

      setMessages([...newHistory, assistantMsg]);
      setIsLoading(false);

      handleSelectEmotion(emotion, 5500);

      const voiceSettings = TTSProcessor.computeVoiceSettings(metadata);
      const speechText = TTSProcessor.prepareTextForTTS(reply, metadata);

      const el11Key = settings.elevenLabsApiKey || DEFAULT_SETTINGS.elevenLabsApiKey;
      const el11Voice = settings.elevenLabsVoiceId || DEFAULT_SETTINGS.elevenLabsVoiceId || VOICE_DEFAULT_ID;

      SpeechService.speak(
        speechText,
        (openVal) => {
          if (controllerRef.current) {
            controllerRef.current.setMouthOpen(openVal);
          }
          setManualMouthOpen(openVal);
        },
        () => {},
        () => {
          if (controllerRef.current) controllerRef.current.setMouthOpen(0);
          setManualMouthOpen(0);
          handleSelectEmotion('normal', 0);
        },
        el11Key,
        el11Voice,
        voiceSettings
      );
    } catch (err) {
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

  const handleTriggerSpeechFromPage = React.useCallback((text: string, emotion: string) => {
    handleSelectEmotion(emotion as CharacterEmotion, 6000);
    const el11Key = settings.elevenLabsApiKey || DEFAULT_SETTINGS.elevenLabsApiKey;
    const el11Voice = settings.elevenLabsVoiceId || DEFAULT_SETTINGS.elevenLabsVoiceId || VOICE_DEFAULT_ID;

    SpeechService.speak(
      text,
      (openVal) => {
        if (controllerRef.current) controllerRef.current.setMouthOpen(openVal);
        setManualMouthOpen(openVal);
      },
      () => {},
      () => {
        if (controllerRef.current) controllerRef.current.setMouthOpen(0);
        setManualMouthOpen(0);
        handleSelectEmotion('normal', 0);
      },
      el11Key,
      el11Voice
    );
  }, [settings.elevenLabsApiKey, settings.elevenLabsVoiceId]);

  const outletContextValue = React.useMemo(
    () => ({ onTriggerAvatarSpeech: handleTriggerSpeechFromPage }),
    [handleTriggerSpeechFromPage]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fafafa] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Floating Rounded Sidebar */}
      <div className="p-3 shrink-0 h-full">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          userEmail={userEmail}
          onLogout={onLogout}
          onOpenAvatarChat={() => setIsChatOpen(true)}
        />
      </div>

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <DashboardTopNav
          onToggleSettings={() => setShowSettingsModal(!showSettingsModal)}
          selectedVoiceId={settings.elevenLabsVoiceId || VOICE_DEFAULT_ID}
        />

        {/* Live Anomaly Toast (top-right, compact with smooth slide-up exit) */}
        {latestAnomalyAlert && (
          <div
            className={`fixed top-4 right-4 z-50 w-72 transition-all duration-500 ease-out transform ${
              isAlertExiting
                ? '-translate-y-12 opacity-0 pointer-events-none'
                : 'translate-y-0 opacity-100'
            }`}
          >
            <div className="bg-rose-600 text-white rounded-xl px-3.5 py-2.5 shadow-lg flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight">Anomali Terdeteksi</div>
                <div className="text-[11px] text-rose-200 truncate">{latestAnomalyAlert.namaPeserta}</div>
              </div>
              <button
                onClick={() => {
                  clearAnomalyAlert();
                  navigate('/dashboard/ai-report');
                }}
                className="text-[11px] font-semibold text-white hover:underline shrink-0"
              >
                Audit
              </button>
              <button
                onClick={() => {
                  setIsAlertExiting(true);
                  setTimeout(clearAnomalyAlert, 300);
                }}
                className="text-rose-300 hover:text-white transition-colors shrink-0"
                title="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Routed Content via Outlet */}
        <main id="dashboard-main-scroll" className="flex-1 overflow-y-auto p-5 sm:p-6 overscroll-contain bg-slate-50/50 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto w-full space-y-5">
            <Outlet context={outletContextValue} />
          </div>

          {/* Settings Modal (if opened) */}
          {showSettingsModal && (
            <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-5 max-w-xl w-full border border-slate-200 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Konfigurasi Model & Suara</h3>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <AvatarDebugControls
                  currentEmotion={currentEmotion}
                  onSelectEmotion={(emo) => handleSelectEmotion(emo, 6000)}
                  manualMouthOpen={manualMouthOpen}
                  onMouthOpenChange={handleMouthOpenChange}
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Persistent Floating 2D Avatar (Zero-unmount: guarantees anti-lag) */}
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
        selectedVoiceId={settings.elevenLabsVoiceId || VOICE_DEFAULT_ID}
        onSelectVoice={handleSelectVoice}
      />

      {/* Avatar Pop-Up Trigger when Minimized */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-full shadow-md border border-slate-200 text-xs font-medium transition-colors"
          title="Buka Asisten AI"
        >
          <div className="w-2 h-2 rounded-full bg-[#007a3d]" />
          <span>Buka Asisten AI</span>
          <UserCheck className="w-4 h-4 text-slate-600" />
        </button>
      )}

      {/* Floating Chat Box Trigger (Neutral Modern Styling, No Star SVG) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl border border-slate-700/50 text-xs font-medium transition-all hover:scale-105 active:scale-95"
          title="Tanya Regulasi & Kasus"
        >
          <MessageCircle className="w-4 h-4 text-slate-300" />
          <span className="tracking-tight font-medium">Tanya Regulasi &amp; Kasus</span>
        </button>
      )}


      {/* Floating Chat Modal */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 sm:right-6 sm:bottom-6 z-50 sm:w-[420px] max-w-[calc(100vw-32px)] shadow-2xl rounded-2xl overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
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
    </div>
  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = (props) => {
  const [latestAnomalyAlert, setLatestAnomalyAlert] = useState<JknClaimRecord | null>(null);

  return (
    <SimulationProvider onAnomalyDetected={(claim) => setLatestAnomalyAlert(claim)}>
      <DashboardLayoutContent
        {...props}
        latestAnomalyAlert={latestAnomalyAlert}
        clearAnomalyAlert={() => setLatestAnomalyAlert(null)}
      />
    </SimulationProvider>
  );
};
