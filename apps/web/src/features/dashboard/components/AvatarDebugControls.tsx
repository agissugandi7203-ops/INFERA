import React, { useState } from 'react';
import { CharacterEmotion } from '../avatar/AvatarController';
import { OpenRouterSettings } from '../services/openrouter';
import { SpeechService } from '../services/speech';
import {
  VOICE_DEFAULT_ID,
  VOICE_SECONDARY_ID,
  VOICE_CHAT_DEFAULT_ID,
  VOICE_CHAT_SECONDARY_ID,
} from '../services/tts-processor';
import { Check, Volume2, Play, Square, Cpu } from 'lucide-react';

interface AvatarDebugControlsProps {
  currentEmotion: CharacterEmotion;
  onSelectEmotion: (emotion: CharacterEmotion) => void;
  manualMouthOpen: number;
  onMouthOpenChange: (val: number) => void;
  settings: OpenRouterSettings;
  onSaveSettings: (settings: OpenRouterSettings) => void;
}

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-120b:nitro', name: 'GPT OSS 120B (Nitro)', desc: 'Cepat & cerdas' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Google — efisien' },
  { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash', desc: 'Google — terbaru' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', desc: 'Free tier' },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', desc: 'Free — reasoning' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Ringan & cepat' },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', desc: 'Anthropic' },
];

const AVATAR_VOICE_OPTIONS = [
  { id: VOICE_DEFAULT_ID, name: 'Vera (AI Kanan)', desc: 'Avatar 2D — Ramah, hangat & interaktif' },
  { id: VOICE_SECONDARY_ID, name: 'Luna (AI Kanan)', desc: 'Avatar 2D — Ceria, ekspresif & lembut' },
];

const CHAT_VOICE_OPTIONS = [
  { id: VOICE_CHAT_DEFAULT_ID, name: 'Auditor Sistem', desc: 'Inti AI Chat — Formal, wibawa & tegas' },
  { id: VOICE_CHAT_SECONDARY_ID, name: 'Analis Sistem', desc: 'Inti AI Chat — Netral, analitik & presisi' },
];

const EMOTIONS: { id: CharacterEmotion; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'angry', label: 'Angry' },
  { id: 'surprised', label: 'Surprised' },
  { id: 'confused', label: 'Confused' },
  { id: 'thinking', label: 'Thinking' },
  { id: 'listening', label: 'Listening' },
  { id: 'speaking', label: 'Speaking' },
];

export const AvatarDebugControls: React.FC<AvatarDebugControlsProps> = ({
  currentEmotion,
  onSelectEmotion,
  manualMouthOpen,
  onMouthOpenChange,
  settings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'model' | 'voice' | 'emotion'>('model');
  const [selectedModel, setSelectedModel] = useState(settings.model || 'openai/gpt-oss-120b:nitro');
  const [selectedAvatarVoiceId, setSelectedAvatarVoiceId] = useState<string>(
    settings.avatarVoiceId || settings.elevenLabsVoiceId || VOICE_DEFAULT_ID
  );
  const [selectedChatVoiceId, setSelectedChatVoiceId] = useState<string>(
    settings.chatVoiceId || VOICE_CHAT_DEFAULT_ID
  );
  const [previewingVoice, setPreviewingVoice] = useState<'avatar' | 'chat' | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestAvatarVoice = async () => {
    if (previewingVoice === 'avatar') {
      SpeechService.stopSpeaking();
      setPreviewingVoice(null);
      return;
    }
    setPreviewingVoice('avatar');
    const sampleText = 'Halo! Saya asisten avatar AI Kanan BPJS Kesehatan siap berdialog dengan Anda.';
    await SpeechService.speak(
      sampleText,
      onMouthOpenChange,
      () => setPreviewingVoice('avatar'),
      () => {
        setPreviewingVoice(null);
        onMouthOpenChange(0);
      },
      settings.elevenLabsApiKey,
      selectedAvatarVoiceId
    );
  };

  const handleTestChatVoice = async () => {
    if (previewingVoice === 'chat') {
      SpeechService.stopSpeaking();
      setPreviewingVoice(null);
      return;
    }
    setPreviewingVoice('chat');
    const sampleText =
      'Laporan audit investigasi INFERA: Indikasi anomali klaim berisiko tinggi telah terdeteksi.';
    await SpeechService.speak(
      sampleText,
      () => {},
      () => setPreviewingVoice('chat'),
      () => setPreviewingVoice(null),
      settings.elevenLabsApiKey,
      selectedChatVoiceId
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      model: selectedModel,
      avatarVoiceId: selectedAvatarVoiceId,
      elevenLabsVoiceId: selectedAvatarVoiceId,
      chatVoiceId: selectedChatVoiceId,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const TABS = [
    { id: 'model' as const, label: 'Model AI' },
    { id: 'voice' as const, label: 'Suara' },
    { id: 'emotion' as const, label: 'Emosi' },
  ];

  return (
    <div className="space-y-4 text-xs">
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Model AI Tab */}
      {activeTab === 'model' && (
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 mb-1">
            <Cpu className="w-3.5 h-3.5 text-[#007a3d]" />
            <span>Model Bahasa (LLM)</span>
          </div>
          <div className="space-y-1.5">
            {AVAILABLE_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedModel === m.id
                    ? 'border-slate-900 dark:border-emerald-500 bg-slate-900 dark:bg-emerald-950/40 text-white dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">{m.name}</div>
                  <div className={`text-[10px] mt-0.5 ${selectedModel === m.id ? 'text-slate-300 dark:text-emerald-300/70' : 'text-slate-400'}`}>
                    {m.desc}
                  </div>
                </div>
                {selectedModel === m.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            {savedSuccess ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Check className="w-3.5 h-3.5" /> Tersimpan
              </span>
            ) : <span />}
            <button type="submit" className="px-4 py-2 bg-[#007a3d] hover:bg-[#006834] text-white rounded-xl text-xs font-semibold transition-colors">
              Simpan
            </button>
          </div>
        </form>
      )}

      {/* Voice Tab */}
      {activeTab === 'voice' && (
        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. Suara AI Kanan (Avatar Karakter 2D) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                <Volume2 className="w-3.5 h-3.5 text-[#007a3d]" />
                <span>Suara AI Kanan (Avatar 2D)</span>
              </div>
              <button
                type="button"
                onClick={handleTestAvatarVoice}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white text-slate-700 dark:text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
              >
                {previewingVoice === 'avatar' ? (
                  <><Square className="w-2.5 h-2.5 fill-current" /><span>Stop</span></>
                ) : (
                  <><Play className="w-2.5 h-2.5 fill-current" /><span>Tes Avatar</span></>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {AVATAR_VOICE_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedAvatarVoiceId(v.id)}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    selectedAvatarVoiceId === v.id
                      ? 'border-[#007a3d] bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-white text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{v.name}</span>
                    {selectedAvatarVoiceId === v.id && <Check className="w-3 h-3 text-[#007a3d]" />}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5 leading-tight">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Suara Inti AI Chat (Narator Sistem INFERA) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Suara Inti AI Chat (Narator INFERA)</span>
              </div>
              <button
                type="button"
                onClick={handleTestChatVoice}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white text-slate-700 dark:text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
              >
                {previewingVoice === 'chat' ? (
                  <><Square className="w-2.5 h-2.5 fill-current" /><span>Stop</span></>
                ) : (
                  <><Play className="w-2.5 h-2.5 fill-current" /><span>Tes Chat</span></>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CHAT_VOICE_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedChatVoiceId(v.id)}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    selectedChatVoiceId === v.id
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-white text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{v.name}</span>
                    {selectedChatVoiceId === v.id && <Check className="w-3 h-3 text-blue-600" />}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5 leading-tight">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            {savedSuccess ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Check className="w-3.5 h-3.5" /> Konfigurasi Tersimpan
              </span>
            ) : <span />}
            <button
              type="submit"
              className="px-4 py-2 bg-[#007a3d] hover:bg-[#006834] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </form>
      )}

      {/* Emotion Tab */}
      {activeTab === 'emotion' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700">Status Avatar</span>
            <span className="text-slate-400 font-mono capitalize">{currentEmotion}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {EMOTIONS.map((emo) => (
              <button
                key={emo.id}
                onClick={() => onSelectEmotion(emo.id)}
                className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                  currentEmotion === emo.id
                    ? 'border-[#007a3d] bg-[#007a3d]/10 text-[#007a3d] font-semibold'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {emo.label}
              </button>
            ))}
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700">Lip-Sync Manual</span>
              <span className="font-mono text-slate-500">{Math.round(manualMouthOpen * 100)}%</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.05"
              value={manualMouthOpen}
              onChange={(e) => onMouthOpenChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#007a3d]"
            />
          </div>
        </div>
      )}
    </div>
  );
};