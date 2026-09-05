import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Mic,
  MicOff,
  Volume2,
  Trash2,
  Download,
  ShieldCheck,
  Plus,
  X,
  Copy,
  Check,
} from 'lucide-react';
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
  normal: { label: 'Netral', icon: '😐', bg: 'bg-slate-100 text-slate-700' },
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
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Only scroll if there are messages and user isn't actively inspecting older text
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

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
      () => {},
      () => {
        setActiveAudioMessageId(null);
        onTriggerLipSync(0);
        if (onAvatarStateChange) onAvatarStateChange('normal');
      }
    );
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleExportChat = () => {
    const text = messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.role === 'user' ? 'Auditor' : 'Asisten JKN'}: ${m.content} ${
            m.emotion ? `(Emotion: ${m.emotion})` : ''
          }`
      )
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bap-asisten-jkn-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col h-[600px] overflow-hidden font-sans">
      {/* Header (ChatGPT / Modern SaaS Style) */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#007a3d] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 leading-tight">
              Asisten Regulasi &amp; Risiko JKN
            </h2>
            <p className="text-[10px] text-slate-400">
              Penalaran hukum &amp; audit analitik klaim
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Ekspor Percakapan"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Bersihkan Percakapan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message Canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 mb-1 border border-slate-200/80 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-[#007a3d]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Ready When You Are
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Tanyakan pasal regulasi JKN, investigasi modus fraud, atau verifikasi batasan klaim.
            </p>

            <div className="flex flex-wrap gap-1.5 justify-center max-w-sm pt-4">
              {[
                'Sanksi peminjaman kartu',
                'Batas supply PRB 30 hari',
                'Indikator Doctor Shopping',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSendMessage(prompt)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-[11px] text-slate-700 font-medium transition-colors border border-slate-200/70"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const emotionMeta = msg.emotion ? EMOTION_MAP[msg.emotion] : null;

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[82%] bg-[#f4f4f4] text-slate-900 rounded-2xl px-4 py-2.5 shadow-2xs border border-slate-200/60">
                    <p className="leading-relaxed whitespace-pre-wrap text-xs">{msg.content}</p>
                    <div className="text-[9px] text-right font-mono text-slate-400 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // AI Response: ChatGPT Style (NO BUBBLE, Clean Prose directly on Canvas)
            return (
              <div key={msg.id} className="flex gap-3 items-start justify-start group">
                <div className="w-6 h-6 rounded-md bg-[#007a3d] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  {emotionMeta && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                      <span>{emotionMeta.icon}</span>
                      <span>{emotionMeta.label}</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Action Bar under AI Response */}
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => handlePlayMessageAudio(msg)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                        activeAudioMessageId === msg.id
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'hover:bg-slate-100 text-slate-500'
                      }`}
                      title="Dengarkan Suara Avatar"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{activeAudioMessageId === msg.id ? 'Memutar...' : 'Dengarkan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
                      title="Salin Teks"
                    >
                      {copiedMessageId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-medium">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    <span className="font-mono text-[9px] ml-auto">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 items-start justify-start text-slate-500 text-xs">
            <div className="w-6 h-6 rounded-md bg-[#007a3d] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 py-1 text-xs text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-400 ml-1">Menyusun penalaran regulasi...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ChatGPT Modern Composer Layout */}
      <div className="p-3 bg-white border-t border-slate-100 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-[#f4f4f4] focus-within:border-slate-400 focus-within:bg-white shadow-2xs transition-all p-2 flex flex-col gap-1.5"
        >
          {/* Multiline input */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isRecording ? 'Mendengarkan suara Anda...' : 'Tanyakan apa saja...'}
            rows={1}
            disabled={isLoading}
            className="w-full bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none px-2 pt-1 max-h-28 min-h-[28px]"
          />

          {/* Action Row */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setInputText((prev) => (prev ? prev + ' (analisis Permenkes 16/2019)' : 'Analisis sesuai Permenkes 16/2019'))}
                className="p-1 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors"
                title="Tambahkan konteks regulasi"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-600 font-mono">
                RAG Aktif
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`p-1.5 rounded-full transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-200'
                    : 'text-slate-500 hover:bg-slate-200/80'
                }`}
                title={isRecording ? 'Berhenti dikte' : 'Mulai dikte suara'}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              <button
                type="submit"
                disabled={!inputText.trim() && !isLoading}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isLoading
                    ? 'bg-slate-900 text-white cursor-pointer hover:bg-slate-800'
                    : inputText.trim()
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xs cursor-pointer'
                    : 'bg-slate-300 text-slate-400 cursor-not-allowed'
                }`}
                title={isLoading ? 'Hentikan jawaban' : 'Kirim pesan'}
              >
                {isLoading ? (
                  <Square className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
