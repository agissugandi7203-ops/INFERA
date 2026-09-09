import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardTopNav } from './DashboardTopNav';
import { FloatingAvatarWidget } from '../components/FloatingAvatarWidget';
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
  runAgentInvestigationStream,
} from '../services/openrouter';
import { SpeechService } from '../services/speech';
import {
  VOICE_DEFAULT_ID,
  VOICE_SECONDARY_ID,
  VOICE_CHAT_DEFAULT_ID,
  VOICE_CHAT_SECONDARY_ID,
  TTSProcessor,
} from '../services/tts-processor';
import { UserCheck, ShieldAlert, X } from 'lucide-react';
import { SimulationProvider, useSimulationStream } from '../simulation/SimulationContext';
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
  const location = useLocation();
  const { claims, anomalies, selectedClaimForAudit } = useSimulationStream();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isAlertExiting, setIsAlertExiting] = useState<boolean>(false);

  // Auto-close mobile sidebar drawer on navigation
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

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
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSoundDetected, setIsSoundDetected] = useState<boolean>(false);

  const controllerRef = useRef<AvatarController | null>(null);
  const emotionTimedownRef = useRef<NodeJS.Timeout | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const isVoiceProcessingRef = useRef<boolean>(false);

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
    const newSettings = {
      ...settings,
      elevenLabsVoiceId: validVoiceId,
      avatarVoiceId: validVoiceId,
    };
    setSettings(newSettings);
    saveStoredSettings(newSettings);

    const voiceLabel = validVoiceId === VOICE_DEFAULT_ID ? 'Vera (AI Kanan)' : 'Luna (AI Kanan)';
    handleSelectEmotion('happy', 3500);

    const confirmText = `Suara avatar AI Kanan telah diubah ke ${voiceLabel}. Saya siap membantu!`;
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

  const handleSelectChatVoice = (voiceId: string) => {
    const validVoiceId =
      voiceId === VOICE_CHAT_SECONDARY_ID ? VOICE_CHAT_SECONDARY_ID : VOICE_CHAT_DEFAULT_ID;
    const newSettings = { ...settings, chatVoiceId: validVoiceId };
    setSettings(newSettings);
    saveStoredSettings(newSettings);
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

  // 1. Dedicated AI Voice Assistant Handler (Conversational, Short, ElevenLabs TTS)
  const handleVoiceAssistant = async (text: string) => {
    const trimmed = text.trim().slice(0, 1500);
    if (!trimmed || isLoading || isVoiceProcessingRef.current) return;
    isVoiceProcessingRef.current = true;

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
      // mode: 'voice' ensures concise, conversational, speech-friendly answer
      const { reply, emotion, metadata, shortcuts, citations } = await sendOpenRouterChat(
        trimmed,
        newHistory,
        settings,
        'voice'
      );

      const assistantMsg: ChatMessage = {
        id: 'msg-' + Date.now() + '-a',
        role: 'assistant',
        content: reply,
        emotion,
        shortcuts,
        citations,
        timestamp: new Date().toISOString(),
      };

      setMessages([...newHistory, assistantMsg]);
      setIsLoading(false);

      handleSelectEmotion(emotion, 5500);

      // Speak using ElevenLabs TTS (VOICE ASSISTANT ONLY)
      const voiceSettings = TTSProcessor.computeVoiceSettings(metadata);
      const speechText = TTSProcessor.extractSpokenSummary(reply, metadata, 220);

      const el11Key = settings.elevenLabsApiKey || DEFAULT_SETTINGS.elevenLabsApiKey;
      const el11Voice = settings.avatarVoiceId || settings.elevenLabsVoiceId || VOICE_DEFAULT_ID;

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
    } finally {
      isVoiceProcessingRef.current = false;
    }
  };

  // 2. Dedicated AI Chat Handler (Text-Only, Multi-Paragraph, Real SSE Streaming, NO TTS)
  const handleStreamChat = async (text: string) => {
    const trimmed = text.trim().slice(0, 3000);
    if (!trimmed || isLoading) return;

    const userMsgId = 'msg-' + Date.now() + '-u';
    const assistantMsgId = 'msg-' + Date.now() + '-a';

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date().toISOString(),
    };

    const historyWithUser = [...messages, userMsg];
    setMessages([...historyWithUser, initialAssistantMsg]);
    setIsLoading(true);

    handleSelectEmotion('thinking', 20000);

    const abortCtrl = new AbortController();

    try {
      await runAgentInvestigationStream(
        trimmed,
        historyWithUser,
        settings,
        {
          claims,
          anomalies,
          selectedClaim: selectedClaimForAudit,
          userRole: 'auditor',
        },
        {
          onMetadata: (meta) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, citations: meta.citations }
                  : m
              )
            );
          },
          onToolStep: (step) => {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMsgId) return m;
                const existingSteps = m.toolSteps || [];
                const idx = existingSteps.findIndex((s) => s.id === step.id);
                const nextSteps =
                  idx >= 0
                    ? existingSteps.map((s, i) => (i === idx ? step : s))
                    : [...existingSteps, step];
                return { ...m, toolSteps: nextSteps };
              })
            );
          },
          onRecommendation: (rec) => {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMsgId) return m;
                const existingRecs = m.recommendations || [];
                if (existingRecs.some((r) => r.id === rec.id)) return m;
                return { ...m, recommendations: [...existingRecs, rec] };
              })
            );
          },
          onDelta: (_delta, fullText) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: fullText, isStreaming: true }
                  : m
              )
            );
          },
          onDone: (fullText, recommendations, shortcuts) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: fullText,
                      recommendations:
                        recommendations.length > 0 ? recommendations : m.recommendations,
                      shortcuts,
                      isStreaming: false,
                    }
                  : m
              )
            );
            setIsLoading(false);
            handleSelectEmotion('normal', 0);
          },
          onError: (streamErr) => {
            setIsLoading(false);
            handleSelectEmotion('confused', 4000);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content:
                        m.content.trim() ||
                        `Maaf, terjadi kendala koneksi AI: ${streamErr.message}`,
                      isStreaming: false,
                    }
                  : m
              )
            );
          },
        },
        abortCtrl.signal
      );
    } catch (err) {
      setIsLoading(false);
      handleSelectEmotion('confused', 4000);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  m.content.trim() ||
                  `Maaf, terjadi kendala saat menghubungi AI: ${
                    err instanceof Error ? err.message : 'Kesalahan tidak dikenal'
                  }`,
                isStreaming: false,
              }
            : m
        )
      );
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
          handleVoiceAssistant(transcript.trim());
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
    const el11Voice = settings.avatarVoiceId || settings.elevenLabsVoiceId || VOICE_DEFAULT_ID;

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
  }, [settings.elevenLabsApiKey, settings.avatarVoiceId, settings.elevenLabsVoiceId]);

  const outletContextValue = React.useMemo(
    () => ({
      onTriggerAvatarSpeech: handleTriggerSpeechFromPage,
      messages,
      isLoading,
      onSendMessage: handleStreamChat,
      onClearHistory: handleClearHistory,
      onSelectEmotion: handleSelectEmotion,
      selectedVoiceId: settings.avatarVoiceId || settings.elevenLabsVoiceId || VOICE_DEFAULT_ID,
      onSelectVoice: handleSelectVoice,
      selectedChatVoiceId: settings.chatVoiceId || VOICE_CHAT_DEFAULT_ID,
      onSelectChatVoice: handleSelectChatVoice,
      isListening,
      isSoundDetected,
      onToggleClickToSpeak: handleToggleClickToSpeak,
      onStopSpeaking: () => SpeechService.stopSpeaking(),
      onToggleMobileSidebar: () => setIsMobileSidebarOpen((prev) => !prev),
      onToggleSettings: () => setShowSettingsModal((prev) => !prev),
      // Voice separation: AI Kanan uses avatarVoiceId, Inti AI Chat uses chatVoiceId
      chatVoiceId: settings.chatVoiceId || VOICE_CHAT_DEFAULT_ID,
      elevenLabsApiKey: settings.elevenLabsApiKey || DEFAULT_SETTINGS.elevenLabsApiKey,
    }),
    [
      handleTriggerSpeechFromPage,
      messages,
      isLoading,
      handleStreamChat,
      handleClearHistory,
      handleSelectEmotion,
      settings.avatarVoiceId,
      settings.elevenLabsVoiceId,
      settings.chatVoiceId,
      settings.elevenLabsApiKey,
      handleSelectVoice,
      handleSelectChatVoice,
      isListening,
      isSoundDetected,
    ]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fafafa] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Desktop Floating Rounded Sidebar */}
      <div className="hidden md:block p-3 shrink-0 h-full">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          userEmail={userEmail}
          onLogout={onLogout}
          onOpenAvatarChat={() => navigate('/dashboard/ai-report')}
        />
      </div>

      {/* Mobile Drawer Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[82vw] h-full p-3 shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileSidebarOpen(false)}
              userEmail={userEmail}
              onLogout={onLogout}
              onNavigate={() => setIsMobileSidebarOpen(false)}
              onOpenAvatarChat={() => {
                setIsMobileSidebarOpen(false);
                navigate('/dashboard/ai-report');
              }}
            />
          </div>
        </div>
      )}

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* TopNav is only displayed for other pages; on Chat AI, AiReportPage provides the single unified minimal header */}
        {location.pathname !== '/dashboard/ai-report' && (
          <DashboardTopNav
            onToggleSettings={() => setShowSettingsModal(!showSettingsModal)}
            selectedVoiceId={settings.avatarVoiceId || settings.elevenLabsVoiceId || VOICE_DEFAULT_ID}
            onSelectVoice={handleSelectVoice}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          />
        )}

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
                className="text-[11px] font-semibold text-white hover:underline shrink-0 cursor-pointer"
              >
                Chat AI
              </button>
              <button
                onClick={() => {
                  setIsAlertExiting(true);
                  setTimeout(clearAnomalyAlert, 300);
                }}
                className="text-rose-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                title="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Routed Content via Outlet */}
        <main
          id="dashboard-main-scroll"
          className={`flex-1 min-w-0 ${
            location.pathname === '/dashboard/ai-report'
              ? 'overflow-hidden flex flex-col bg-white dark:bg-slate-950 p-0'
              : 'overflow-y-auto p-4 sm:p-6 overscroll-contain bg-slate-50/50 dark:bg-slate-950'
          }`}
        >
          <div
            className={
              location.pathname === '/dashboard/ai-report'
                ? 'flex-1 flex flex-col h-full w-full min-h-0'
                : 'max-w-6xl mx-auto w-full space-y-5'
            }
          >
            <Outlet context={outletContextValue} />
          </div>

          {/* Settings Modal (if opened) */}
          {showSettingsModal && (
            <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Konfigurasi Model & Suara</h3>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
        onOpenChat={() => navigate('/dashboard/ai-report')}
        onMinimize={() => setIsMinimized(true)}
        isMinimized={isMinimized || location.pathname === '/dashboard/ai-report'}
        selectedVoiceId={settings.avatarVoiceId || settings.elevenLabsVoiceId || VOICE_DEFAULT_ID}
        onSelectVoice={handleSelectVoice}
      />

      {/* Avatar Pop-Up Trigger when Minimized (hidden on ai-report page) */}
      {isMinimized && location.pathname !== '/dashboard/ai-report' && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 rounded-full shadow-md border border-slate-200 dark:border-slate-700 text-xs font-medium transition-colors cursor-pointer"
          title="Buka Asisten AI"
        >
          <div className="w-2 h-2 rounded-full bg-[#007a3d]" />
          <span>Buka Asisten AI</span>
          <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
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
