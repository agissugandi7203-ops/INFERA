import React, { useState } from 'react';
import { CharacterEmotion } from '../avatar/AvatarController';
import { OpenRouterSettings } from '../services/openrouter';
import { Bot, Check, Volume2 } from 'lucide-react';

interface AvatarDebugControlsProps {
  currentEmotion: CharacterEmotion;
  onSelectEmotion: (emotion: CharacterEmotion) => void;
  manualMouthOpen: number;
  onMouthOpenChange: (val: number) => void;
  settings: OpenRouterSettings;
  onSaveSettings: (settings: OpenRouterSettings) => void;
}

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-120b:nitro', name: 'OpenAI GPT OSS 120B (Nitro - Cepat & Cerdas)' },
  { id: 'google/gemini-3.8-flash', name: 'Google Gemini 3.8 Flash' },
  { id: 'google/gemini-2.5-flash', name: 'Google Gemini 2.5 Flash' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku' },
];

const EMOTIONS: { id: CharacterEmotion; label: string; icon: string }[] = [
  { id: 'normal', label: 'Normal', icon: '😐' },
  { id: 'happy', label: 'Happy', icon: '😊' },
  { id: 'sad', label: 'Sad', icon: '😢' },
  { id: 'angry', label: 'Angry', icon: '😠' },
  { id: 'surprised', label: 'Surprised', icon: '😲' },
  { id: 'confused', label: 'Confused', icon: '🤨' },
  { id: 'thinking', label: 'Thinking', icon: '🤔' },
  { id: 'listening', label: 'Listening', icon: '👂' },
  { id: 'speaking', label: 'Speaking', icon: '🗣️' },
];

export const AvatarDebugControls: React.FC<AvatarDebugControlsProps> = ({
  currentEmotion,
  onSelectEmotion,
  manualMouthOpen,
  onMouthOpenChange,
  settings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'emotion' | 'settings'>('settings');
  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey);
  const [selectedModel, setSelectedModel] = useState(settings.model || 'openai/gpt-oss-120b:nitro');
  const [elevenLabsKey, setElevenLabsKey] = useState(settings.elevenLabsApiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      apiKey: apiKeyInput,
      model: selectedModel,
      elevenLabsApiKey: elevenLabsKey,
      elevenLabsVoiceId: 'A4AyGcPAjb1pHgflyZZp',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-4 space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-1.5 font-bold text-neutral-800">
          <Bot className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan AI & Model Suara</span>
        </div>

        <div className="flex bg-neutral-100 p-0.5 rounded-lg text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'settings'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Model & API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emotion')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'emotion'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Tes Emosi
          </button>
        </div>
      </div>

      {activeTab === 'emotion' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-neutral-700">Preset Emosi Manual</span>
            <span className="text-neutral-400 font-mono capitalize">Status: {currentEmotion}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {EMOTIONS.map((emo) => (
              <button
                key={emo.id}
                onClick={() => onSelectEmotion(emo.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                  currentEmotion === emo.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs font-semibold'
                    : 'border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <span>{emo.icon}</span>
                <span className="capitalize">{emo.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-neutral-700">Bukaan Mulut (Lip-Sync Manual)</span>
              <span className="font-mono text-neutral-500">{Math.round(manualMouthOpen * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={manualMouthOpen}
              onChange={(e) => onMouthOpenChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Model OpenRouter
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              OpenRouter API Key
            </label>
            <input
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
            />
          </div>

          <div className="pt-1 border-t border-neutral-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Model Suara ElevenLabs</span>
            </div>
            <p className="text-[10px] text-neutral-500">
              Voice ID aktif: <strong className="font-mono text-neutral-700">A4AyGcPAjb1pHgflyZZp</strong>
            </p>
            <input
              type="password"
              placeholder="Masukkan ElevenLabs API Key (Opsional)"
              value={elevenLabsKey}
              onChange={(e) => setElevenLabsKey(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
            />
            <p className="text-[10px] text-neutral-400">
              Jika kosong, audio tetap bekerja menggunakan sintesis suara alami browser (Web Speech).
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Check className="w-3.5 h-3.5" /> Pengaturan Tersimpan!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
