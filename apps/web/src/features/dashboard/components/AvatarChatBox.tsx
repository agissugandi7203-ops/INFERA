import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, Trash2, Download, Bot, User, Sparkles, X } from 'lucide-react';
import { ChatMessage } from '../services/openrouter';
import { CharacterEmotion } from '../avatar/AvatarController';
import { SpeechService } from '../services/speech';

interface AvatarChatBoxProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  onTriggerLipSync: (mouthOpen: number) => void;
  onAvatarStateChange?: (emotion: CharacterEmotion) => void;
  onClose?: () => void;
}

const EMOTION_MAP: Record<CharacterEmotion, { label: string; icon: string; bg: string }> = {
  normal: { label: 'Netral', icon: '😐', bg: 'bg-neutral-100 text-neutral-700' },
  happy: { label: 'Senang', icon: '😊', bg: 'bg-emerald-100 text-emerald-800' },
  sad: { label: 'Sedih', icon: '😢', bg: 'bg-blue-100 text-blue-800' },
  angry: { label: 'Marah', icon: '😠', bg: 'bg-rose-100 text-rose-800' },
  surprised: { label: 'Terkejut', icon: '😲', bg: 'bg-amber-100 text-amber-800' },
  confused: { label: 'Bingung', icon: '🤨', bg: 'bg-purple-100 text-purple-800' },
  thinking: { label: 'Berpikir', icon: '🤔', bg: 'bg-indigo-100 text-indigo-800' },
  listening: { label: 'Mendengarkan', icon: '👂', bg: 'bg-sky-100 text-sky-800' },
  speaking: { label: 'Berbicara', icon: '🗣️', bg: 'bg-teal-100 text-teal-800' },
};

export const AvatarChatBox: React.FC<AvatarChatBoxProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onClearHistory,
  onTriggerLipSync,
  onAvatarStateChange,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeAudioMessageId, setActiveAudioMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setIsRecording(false);
      if (onAvatarStateChange) onAvatarStateChange('normal');
    } else {
      if (onAvatarStateChange) onAvatarStateChange('listening');
      stopListeningRef.current = SpeechService.startListening(
        (transcript) => {
          if (transcript) {
            setInputText(transcript);
            onSendMessage(transcript);
          }
        },
        (recording) => {
          setIsRecording(recording);
          if (!recording && onAvatarStateChange) {
            onAvatarStateChange('normal');
          }
        },
        (err) => {
          console.warn(err);
          setIsRecording(false);
          if (onAvatarStateChange) onAvatarStateChange('normal');
        }
      );
    }
  };

  const handlePlayMessageAudio = (msg: ChatMessage) => {
    if (activeAudioMessageId === msg.id) {
      SpeechService.stopSpeaking();
      setActiveAudioMessageId(null);
      onTriggerLipSync(0);
      if (onAvatarStateChange) onAvatarStateChange('normal');
      return;
    }

    setActiveAudioMessageId(msg.id);
    if (onAvatarStateChange && msg.emotion) {
      onAvatarStateChange(msg.emotion);
    }

    SpeechService.speak(
      msg.content,
      (openVal) => onTriggerLipSync(openVal),
      () => {
        // onStart
      },
      () => {
        setActiveAudioMessageId(null);
        onTriggerLipSync(0);
        if (onAvatarStateChange) onAvatarStateChange('normal');
      }
    );
  };

  const handleExportChat = () => {
    const text = messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.role === 'user' ? 'User' : 'Avatar'}: ${m.content} ${
            m.emotion ? `(Emotion: ${m.emotion})` : ''
          }`
      )
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avatar-conversation-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col h-[560px] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-neutral-900">Percakapan Interaktif</h2>
            <p className="text-[10px] text-neutral-500">Avatar responsif real-time dengan OpenRouter</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportChat}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                title="Simpan / Download Percakapan"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClearHistory}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Bersihkan Riwayat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors ml-1"
              title="Tutup Percakapan"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 p-6 space-y-2">
            <Sparkles className="w-8 h-8 text-emerald-500/40 animate-pulse" />
            <p className="font-medium text-neutral-600 text-xs">Mulai Percakapan dengan Avatar!</p>
            <p className="text-[11px] text-neutral-400 max-w-xs leading-relaxed">
              Ketik pesan atau tekan ikon mikrofon untuk berbicara. Karakter akan bereaksi, berbicara
              dengan lip-sync, dan mengekspresikan emosi secara otomatis.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const emotionMeta = msg.emotion ? EMOTION_MAP[msg.emotion] : null;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                    🤖
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 shadow-xs space-y-1.5 ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-neutral-100/90 text-neutral-800 rounded-tl-xs border border-neutral-200/50'
                  }`}
                >
                  {!isUser && emotionMeta && (
                    <div className="flex items-center justify-between gap-2 pb-0.5 border-b border-neutral-200/40">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${emotionMeta.bg}`}
                      >
                        <span>{emotionMeta.icon}</span>
                        <span>{emotionMeta.label}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handlePlayMessageAudio(msg)}
                        className={`p-1 rounded-md transition-colors ${
                          activeAudioMessageId === msg.id
                            ? 'bg-emerald-200 text-emerald-800 animate-pulse'
                            : 'text-neutral-500 hover:bg-neutral-200/60'
                        }`}
                        title="Dengarkan Kembali dengan Lip-Sync"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <p className="leading-relaxed whitespace-pre-wrap text-[12px]">{msg.content}</p>

                  <div
                    className={`text-[9px] text-right font-mono ${
                      isUser ? 'text-emerald-100/80' : 'text-neutral-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-2.5 justify-start items-center text-neutral-500 text-xs">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-[11px]">
              🤖
            </div>
            <div className="bg-neutral-100 rounded-2xl px-3.5 py-2 flex items-center gap-1.5 border border-neutral-200/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-neutral-500 ml-1">Avatar sedang berpikir...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-2.5 bg-neutral-50/70 border-t border-neutral-100 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={handleVoiceToggle}
          className={`p-2.5 rounded-xl transition-all ${
            isRecording
              ? 'bg-rose-600 text-white ring-4 ring-rose-500/20 animate-pulse'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
          title={isRecording ? 'Berhenti Merekam' : 'Bicara lewat Mikrofon (Voice Input)'}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isRecording ? 'Mendengarkan suara Anda...' : 'Ketik pertanyaan atau sapa avatar...'}
          disabled={isLoading}
          className="flex-1 bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-all"
          title="Kirim Pesan"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
