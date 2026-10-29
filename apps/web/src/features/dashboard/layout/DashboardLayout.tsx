import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardTopNav } from './DashboardTopNav';
import { FloatingAvatarWidget } from '../components/FloatingAvatarWidget';
import { AvatarDebugControls } from '../components/AvatarDebugControls';
import { AvatarController, CharacterEmotion } from '../avatar/AvatarController';
import {
  ChatMessage,
  ChatAttachment,
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
import { ShieldAlert, X, Sparkles } from 'lucide-react';
import { SimulationProvider, useSimulationStream } from '../simulation/SimulationContext';
import type { JknClaimRecord, RealtimeVoiceName } from '@healthathon/shared';
import { RealtimeVoiceService } from '../services/RealtimeVoiceService';

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
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('infera_avatar_minimized');
      if (saved !== null) return saved === 'true';
    }
    return false; // Tampilkan pop-up asisten Fera di halaman utama secara default
  });
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSoundDetected, setIsSoundDetected] = useState<boolean>(false);
  const [liveVoiceText, setLiveVoiceText] = useState<string>('');
  const [voiceErrorMessage, setVoiceErrorMessage] = useState<string | null>(null);
  const [isWebRtcActive, setIsWebRtcActive] = useState<boolean>(false);

  const controllerRef = useRef<AvatarController | null>(null);
  const realtimeServiceRef = useRef<RealtimeVoiceService | null>(null);
  const emotionTimedownRef = useRef<NodeJS.Timeout | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const isVoiceProcessingRef = useRef<boolean>(false);
  const activeStreamAbortRef = useRef<AbortController | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const lastToggleClickTimeRef = useRef<number>(0);
  const lastProcessedVoiceTextRef = useRef<{ text: string; timestamp: number }>({ text: '', timestamp: 0 });

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

  // Cleanly disconnect WebRTC Realtime Voice on unmount
  useEffect(() => {
    return () => {
      if (realtimeServiceRef.current) {
        realtimeServiceRef.current.disconnect();
      }
    };
  }, []);

  const handleSelectVoice = (voiceId: string) => {
    const validVoiceId = voiceId === VOICE_SECONDARY_ID ? VOICE_SECONDARY_ID : VOICE_DEFAULT_ID;
    const newSettings = {
      ...settings,
      elevenLabsVoiceId: validVoiceId,
      avatarVoiceId: validVoiceId,
    };
    setSettings(newSettings);
    saveStoredSettings(newSettings);

    const voiceLabel = validVoiceId === VOICE_DEFAULT_ID ? 'Fera (AI Kanan)' : 'Luna (AI Kanan)';
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
    const now = Date.now();

    // Guard against duplicate voice input within 3.5s (e.g. mobile microphone echo or dual recognition triggers)
    if (
      trimmed.toLowerCase() === lastProcessedVoiceTextRef.current.text.toLowerCase() &&
      now - lastProcessedVoiceTextRef.current.timestamp < 3500
    ) {
      console.warn('[Voice] Ignored duplicate voice input within 3.5s:', trimmed);
      return;
    }

    if (!trimmed || isLoading || isVoiceProcessingRef.current) return;
    lastProcessedVoiceTextRef.current = { text: trimmed, timestamp: now };
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
  const handleStreamChat = async (text: string, attachments?: ChatAttachment[], enableReasoning = false) => {
    const trimmed = text.trim().slice(0, 3000);
    if ((!trimmed && (!attachments || attachments.length === 0)) || isLoading) return;

    const userMsgId = 'msg-' + Date.now() + '-u';
    const assistantMsgId = 'msg-' + Date.now() + '-a';

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      attachments,
      timestamp: new Date().toISOString(),
    };

    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      isReasoningEnabled: enableReasoning,
      timestamp: new Date().toISOString(),
    };

    const historyWithUser = [...messages, userMsg];
    setMessages([...historyWithUser, initialAssistantMsg]);
    setIsLoading(true);

    handleSelectEmotion('thinking', 20000);

    if (activeStreamAbortRef.current) {
      activeStreamAbortRef.current.abort();
    }
    const abortCtrl = new AbortController();
    activeStreamAbortRef.current = abortCtrl;

    // Frame-aligned stream updates using requestAnimationFrame for butter-smooth token rendering
    let pendingText: string | null = null;
    let pendingReasoning: string | null = null;
    let streamRafId: number | null = null;

    const flushStreamUpdates = () => {
      if (pendingText === null && pendingReasoning === null) return;
      const textToApply = pendingText;
      const reasoningToApply = pendingReasoning;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantMsgId) return m;
          return {
            ...m,
            ...(textToApply !== null ? { content: textToApply, isStreaming: true, isThinking: false } : {}),
            ...(reasoningToApply !== null ? { reasoning: reasoningToApply, isThinking: true } : {}),
          };
        })
      );
    };

    const scheduleStreamUpdate = () => {
      if (streamRafId === null) {
        streamRafId = requestAnimationFrame(() => {
          streamRafId = null;
          flushStreamUpdates();
        });
      }
    };

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
          enableReasoning,
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
          onReasoning: (_delta, fullReasoning) => {
            if (!enableReasoning) return;
            pendingReasoning = fullReasoning;
            scheduleStreamUpdate();
          },
          onDelta: (_delta, fullText) => {
            pendingText = fullText;
            scheduleStreamUpdate();
          },
          onDone: (fullText, recs, shortcuts) => {
            if (streamRafId !== null) {
              cancelAnimationFrame(streamRafId);
              streamRafId = null;
            }
            pendingText = null;
            pendingReasoning = null;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: fullText,
                      recommendations: recs,
                      shortcuts,
                      isStreaming: false,
                      isThinking: false,
                    }
                  : m
              )
            );
            handleSelectEmotion('happy', 5000);
            setIsLoading(false);
          },
          onError: (err) => {
            if (streamRafId !== null) {
              cancelAnimationFrame(streamRafId);
              streamRafId = null;
            }
            pendingText = null;
            pendingReasoning = null;
            console.error('Agent Stream Error:', err);
            handleSelectEmotion('confused', 4000);
            setIsLoading(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content:
                        m.content.trim() ||
                        `Maaf, terjadi kendala saat investigasi AI: ${err.message}`,
                      isStreaming: false,
                    }
                  : m
              )
            );
          },
        },
        abortCtrl.signal,
        attachments
      );
    } catch (err) {
      console.error('Agent Investigation Error:', err);
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
    } finally {
      if (activeStreamAbortRef.current === abortCtrl) {
        activeStreamAbortRef.current = null;
      }
    }
  };

  const handleStopStreaming = React.useCallback(() => {
    if (activeStreamAbortRef.current) {
      activeStreamAbortRef.current.abort();
      activeStreamAbortRef.current = null;
    }
    SpeechService.stopSpeaking();
    setIsLoading(false);
    handleSelectEmotion('normal', 0);
  }, [handleSelectEmotion]);

  const startFallbackWebSpeech = () => {
    isListeningRef.current = true;
    setIsListening(true);
    handleSelectEmotion('listening', 0);
    setVoiceErrorMessage(null);
    setLiveVoiceText('');

    const stopFn = SpeechService.startListening(
      (transcript) => {
        isListeningRef.current = false;
        setIsListening(false);
        setIsSoundDetected(false);
        setLiveVoiceText('');
        stopListeningRef.current = null;
        if (transcript.trim()) {
          handleVoiceAssistant(transcript.trim());
        }
      },
      (listening) => {
        isListeningRef.current = listening;
        setIsListening(listening);
        if (!listening) {
          setIsSoundDetected(false);
          setLiveVoiceText('');
          handleSelectEmotion('normal', 0);
        }
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        isListeningRef.current = false;
        setIsListening(false);
        setIsSoundDetected(false);
        setLiveVoiceText('');
        stopListeningRef.current = null;
        setVoiceErrorMessage(err);
        setTimeout(() => setVoiceErrorMessage(null), 8000);
        handleSelectEmotion('confused', 4000);
      },
      (soundActive) => {
        setIsSoundDetected(soundActive);
      },
      (liveText) => {
        setLiveVoiceText(liveText);
      }
    );

    stopListeningRef.current = stopFn;
  };

  const handleToggleClickToSpeak = async () => {
    const now = Date.now();
    // Guard: Debounce fast consecutive taps / simulated click bounce on mobile (450ms)
    if (now - lastToggleClickTimeRef.current < 450) {
      return;
    }
    lastToggleClickTimeRef.current = now;

    // 1. If WebRTC Realtime Voice is active, clicking disconnects the session (toggle off)
    if (isWebRtcActive || realtimeServiceRef.current?.isConnected()) {
      if (realtimeServiceRef.current) {
        realtimeServiceRef.current.disconnect();
      }
      setIsWebRtcActive(false);
      setIsListening(false);
      setIsSoundDetected(false);
      isListeningRef.current = false;
      handleSelectEmotion('normal', 0);
      return;
    }

    // 2. If fallback STT listening is active, cancel it
    if (isListeningRef.current) {
      isListeningRef.current = false;
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setIsListening(false);
      handleSelectEmotion('normal', 0);
      return;
    }

    SpeechService.unlockAudio();
    SpeechService.stopSpeaking();

    // 3. Connect via OpenAI Realtime WebRTC (sub-second duplex voice)
    try {
      if (!realtimeServiceRef.current) {
        realtimeServiceRef.current = new RealtimeVoiceService();
      }

      const activeVoice = (settings.avatarVoiceId || settings.elevenLabsVoiceId || VOICE_DEFAULT_ID) as RealtimeVoiceName;

      realtimeServiceRef.current.setListeners({
        onStateChange: (state) => {
          if (state === 'connected') {
            setIsWebRtcActive(true);
            setIsListening(false);
            setVoiceErrorMessage(null);
          } else if (state === 'listening') {
            setIsWebRtcActive(true);
            setIsListening(true);
            setIsSoundDetected(true);
            handleSelectEmotion('listening', 0);
          } else if (state === 'speaking') {
            setIsWebRtcActive(true);
            setIsListening(false);
            setIsSoundDetected(false);
            handleSelectEmotion('speaking', 0);
          } else if (state === 'disconnected') {
            setIsWebRtcActive(false);
            setIsListening(false);
            setIsSoundDetected(false);
            handleSelectEmotion('normal', 0);
          } else if (state === 'error') {
            setIsWebRtcActive(false);
            setIsListening(false);
            setIsSoundDetected(false);
            handleSelectEmotion('confused', 3000);
          }
        },
        onMouthOpen: (mouthOpen) => {
          if (controllerRef.current) {
            controllerRef.current.setMouthOpen(mouthOpen);
          }
          setManualMouthOpen(mouthOpen);
        },
        onEmotionChange: (emo) => {
          handleSelectEmotion(emo, 4000);
        },
        onLiveSpeechText: (liveText) => {
          // Updates avatar badge / indicator during speech, NEVER inserts chat bubble
          setLiveVoiceText(liveText);
        },
        onTranscript: (item) => {
          setLiveVoiceText('');
          if (item.role === 'user') {
            const userMsg: ChatMessage = {
              id: item.id || 'msg-' + Date.now() + '-u',
              role: 'user',
              content: item.text,
              timestamp: item.timestamp || new Date().toISOString(),
            };
            setMessages((prev) => [...prev, userMsg]);
          } else if (item.role === 'assistant') {
            const assistantMsg: ChatMessage = {
              id: item.id || 'msg-' + Date.now() + '-a',
              role: 'assistant',
              content: item.text,
              timestamp: item.timestamp || new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }
        },
        onError: (err) => {
          console.warn('[RealtimeVoice] Error:', err);
          setVoiceErrorMessage(err);
          setIsWebRtcActive(false);
          setIsListening(false);
          setTimeout(() => setVoiceErrorMessage(null), 8000);
          handleSelectEmotion('confused', 4000);
        },
      });

      setIsListening(true);
      handleSelectEmotion('listening', 0);
      setVoiceErrorMessage(null);

      await realtimeServiceRef.current.connect(activeVoice);
    } catch (realtimeErr) {
      console.warn('[DashboardLayout] Realtime WebRTC failed, falling back to Web Speech:', realtimeErr);
      setIsWebRtcActive(false);
      startFallbackWebSpeech();
    }
  };

  const handleTriggerSpeechFromPage = React.useCallback((text: string, emotion: string) => {
    SpeechService.unlockAudio();
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

  // Dedicated scroll preservation to prevent jumping to top on background data updates
  const mainScrollRef = useRef<HTMLElement>(null);
  const scrollPosRef = useRef<number>(0);

  const handleMainScroll = React.useCallback((e: React.UIEvent<HTMLElement>) => {
    scrollPosRef.current = e.currentTarget.scrollTop;
  }, []);

  // Restore scroll position if it accidentally drops to 0 during background stream ticks or anomaly alerts
  useEffect(() => {
    if (mainScrollRef.current && scrollPosRef.current > 0) {
      if (mainScrollRef.current.scrollTop === 0) {
        mainScrollRef.current.scrollTop = scrollPosRef.current;
      }
    }
  }, [claims, latestAnomalyAlert]);

  // Reset scroll position cleanly when navigating between pages
  useEffect(() => {
    scrollPosRef.current = 0;
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

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
      onStopStreaming: handleStopStreaming,
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
      handleStopStreaming,
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f5f8] dark:bg-[#0c0d11] text-slate-900 dark:text-slate-100 font-sans">
      {/* Desktop Floating Rounded Sidebar (Eduplex style) */}
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
          ref={mainScrollRef}
          onScroll={handleMainScroll}
          id="dashboard-main-scroll"
          style={{ overflowAnchor: 'auto' }}
          className={`flex-1 min-w-0 ${
            location.pathname === '/dashboard/ai-report'
              ? 'overflow-hidden flex flex-col bg-white dark:bg-slate-950 p-0'
              : 'overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 overscroll-contain bg-[#f4f5f8] dark:bg-[#0c0d11]'
          }`}
        >
          <div
            className={
              location.pathname === '/dashboard/ai-report'
                ? 'flex-1 flex flex-col h-full w-full min-h-0'
                : 'w-full max-w-[1760px] mx-auto space-y-6'
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

      {/* Floating launcher when Fera is minimized */}
      {isMinimized && location.pathname !== '/dashboard/ai-report' && (
        <button
          type="button"
          onClick={() => {
            setIsMinimized(false);
            try {
              localStorage.setItem('infera_avatar_minimized', 'false');
            } catch {}
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full bg-[#131418] text-white border border-white/20 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Buka Asisten Fera"
        >
          <div className="relative w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 ring-2 ring-[#131418]" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>Asisten Fera</span>
            </div>
            <div className="text-[10px] text-white/60">Tanya AI &amp; Suara</div>
          </div>
        </button>
      )}

      {/* Persistent Floating 2D Avatar (Zero-unmount: guarantees anti-lag) */}
      <FloatingAvatarWidget
        currentEmotion={currentEmotion}
        manualMouthOpen={manualMouthOpen}
        onControllerReady={handleControllerReady}
        onClickToSpeak={handleToggleClickToSpeak}
        isListening={isListening}
        isSoundDetected={isSoundDetected}
        liveTranscript={liveVoiceText}
        errorMessage={voiceErrorMessage}
        onOpenChat={() => navigate('/dashboard/ai-report')}
        onMinimize={() => {
          setIsMinimized(true);
          try {
            localStorage.setItem('infera_avatar_minimized', 'true');
          } catch {}
        }}
        isMinimized={isMinimized}
        selectedVoiceId={settings.avatarVoiceId || settings.elevenLabsVoiceId || VOICE_DEFAULT_ID}
        onSelectVoice={handleSelectVoice}
        isWebRtcActive={isWebRtcActive}
      />
    </div>
  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = (props) => {
  const [latestAnomalyAlert, setLatestAnomalyAlert] = useState<JknClaimRecord | null>(null);

  const handleAnomalyDetected = React.useCallback((claim: JknClaimRecord) => {
    setLatestAnomalyAlert(claim);
  }, []);

  const handleClearAnomalyAlert = React.useCallback(() => {
    setLatestAnomalyAlert(null);
  }, []);

  return (
    <SimulationProvider onAnomalyDetected={handleAnomalyDetected}>
      <DashboardLayoutContent
        {...props}
        latestAnomalyAlert={latestAnomalyAlert}
        clearAnomalyAlert={handleClearAnomalyAlert}
      />
    </SimulationProvider>
  );
};
