import React, { useState } from 'react';
import { CharacterEmotion } from '../avatar/AvatarController';
import { OpenRouterSettings } from '../services/openrouter';
import { SpeechService } from '../services/speech';
import { VOICE_DEFAULT_ID, VOICE_SECONDARY_ID } from '../services/tts-processor';
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

const VOICE_OPTIONS = [
  { id: VOICE_DEFAULT_ID, name: 'Vera', desc: 'Suara default — jernih & natural' },
  { id: VOICE_SECONDARY_ID, name: 'Luna', desc: 'Suara alternatif — lebih lembut' },
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
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    settings.elevenLabsVoiceId === VOICE_SECONDARY_ID ? VOICE_SECONDARY_ID : VOICE_DEFAULT_ID
  );
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestVoice = async () => {
    if (isPlayingPreview) {
      SpeechService.stopSpeaking();
      setIsPlayingPreview(false);
      return;
    }
    setIsPlayingPreview(true);
    const sampleText = 'Halo! Sistem analisis risiko peserta JKN siap digunakan.';
    await SpeechService.speak(
      sampleText,
      () => {},
      () => setIsPlayingPreview(true),
      () => setIsPlayingPreview(false),
      settings.elevenLabsApiKey,
      selectedVoiceId
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({ ...settings, model: selectedModel, elevenLabsVoiceId: selectedVoiceId });
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
      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Model AI Tab */}
      {activeTab === 'model' && (
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
            <Cpu className="w-3.5 h-3.5 text-[#007a3d]" />
            <span>Model Bahasa (LLM)</span>
          </div>
          <div className="space-y-1.5">
            {AVAILABLE_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  selectedModel === m.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">{m.name}</div>
                  <div className={`text-[10px] mt-0.5 ${selectedModel === m.id ? 'text-slate-300' : 'text-slate-400'}`}>
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
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
            <Volume2 className="w-3.5 h-3.5 text-[#007a3d]" />
            <span>Suara AI</span>
          </div>
          <div className="space-y-1.5">
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVoiceId(v.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  selectedVoiceId === v.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">{v.name}</div>
                  <div className={`text-[10px] mt-0.5 ${selectedVoiceId === v.id ? 'text-slate-300' : 'text-slate-400'}`}>
                    {v.desc}
                  </div>
                </div>
                {selectedVoiceId === v.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleTestVoice}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 text-xs font-medium transition-colors"
          >
            {isPlayingPreview ? (
              <><Square className="w-3 h-3 fill-slate-700" /><span>Hentikan</span></>
            ) : (
              <><Play className="w-3 h-3 fill-slate-700" /><span>Coba Suara</span></>
            )}
          </button>
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