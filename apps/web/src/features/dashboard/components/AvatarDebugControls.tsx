import React, { useState } from 'react';
import { CharacterEmotion } from '../avatar/AvatarController';
import { OpenRouterSettings, ANIME_VOICE_PRESETS } from '../services/openrouter';
import { SpeechService } from '../services/speech';
import { Bot, Check, Volume2, Play, Square, Sparkles } from 'lucide-react';

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
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    settings.elevenLabsVoiceId || 'cgSgspJ2msm6clMCkdW9'
  );
  const [customVoiceId, setCustomVoiceId] = useState('');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeVoiceId = selectedVoiceId === 'custom' ? (customVoiceId.trim() || 'cgSgspJ2msm6clMCkdW9') : selectedVoiceId;

  const handleTestVoice = async () => {
    if (isPlayingPreview) {
      SpeechService.stopSpeaking();
      setIsPlayingPreview(false);
      return;
    }

    setIsPlayingPreview(true);
    const sampleText = 'Halo kak! Ini adalah contoh suara anime ElevenLabs untuk asisten virtualmu. Bagaimana, imut kan?';
    
    await SpeechService.speak(
      sampleText,
      () => {},
      () => setIsPlayingPreview(true),
      () => setIsPlayingPreview(false),
      elevenLabsKey || settings.elevenLabsApiKey,
      activeVoiceId
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      apiKey: apiKeyInput,
      model: selectedModel,
      elevenLabsApiKey: elevenLabsKey,
      elevenLabsVoiceId: activeVoiceId,
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

          <div className="pt-2 border-t border-neutral-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pilih Karakter Suara Anime (ElevenLabs)</span>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Gratis di Free Tier
              </span>
            </div>

            <div className="space-y-1">
              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-neutral-800"
              >
                {ANIME_VOICE_PRESETS.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    ✨ {voice.name} — {voice.character}
                  </option>
                ))}
                <option value="custom">✏️ Masukkan Custom Voice ID...</option>
              </select>

              {/* Display active description */}
              {selectedVoiceId !== 'custom' && (
                <p className="text-[11px] text-neutral-500 italic px-1">
                  {ANIME_VOICE_PRESETS.find((v) => v.id === selectedVoiceId)?.description}
                </p>
              )}
            </div>

            {selectedVoiceId === 'custom' && (
              <input
                type="text"
                placeholder="Masukkan Voice ID ElevenLabs (Contoh: cgSgspJ2msm6clMCkdW9)"
                value={customVoiceId}
                onChange={(e) => setCustomVoiceId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
              />
            )}

            {/* Test Voice Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestVoice}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 text-[11px] font-semibold transition-all shadow-2xs"
              >
                {isPlayingPreview ? (
                  <>
                    <Square className="w-3 h-3 fill-indigo-800" />
                    <span>Hentikan Suara</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-indigo-800" />
                    <span>Dengarkan Sampel Suara Anime</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-neutral-400 font-mono truncate">
                ID: {activeVoiceId}
              </span>
            </div>

            <div className="pt-1 space-y-1">
              <label className="text-[11px] font-medium text-neutral-600 block">
                ElevenLabs API Key
              </label>
              <input
                type="password"
                placeholder="Masukkan ElevenLabs API Key (Opsional / Free Tier)"
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
              />
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Suara anime di atas 100% kompatibel dengan akun gratis ElevenLabs (10.000 karakter/bulan). Jika key kosong atau kuota habis, audio otomatis menggunakan suara anime ceria sintetis browser.
              </p>
            </div>
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
