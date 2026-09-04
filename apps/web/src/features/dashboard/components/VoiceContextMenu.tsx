import React, { useEffect, useRef } from 'react';
import { ANIME_VOICE_PRESETS, VoicePreset } from '../services/openrouter';
import { Volume2, Check, Sparkles, Settings2, Play } from 'lucide-react';

interface VoiceContextMenuProps {
  x: number;
  y: number;
  currentVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  onOpenAdvancedSettings: () => void;
  onPreviewVoice: (voiceId: string) => void;
  onClose: () => void;
}

export const VoiceContextMenu: React.FC<VoiceContextMenuProps> = ({
  x,
  y,
  currentVoiceId,
  onSelectVoice,
  onOpenAdvancedSettings,
  onPreviewVoice,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust position so it doesn't overflow screen viewport
  const menuWidth = 260;
  const menuHeight = 310;
  const posX = Math.min(x, window.innerWidth - menuWidth - 16);
  const posY = Math.min(y, window.innerHeight - menuHeight - 16);

  return (
    <div
      ref={menuRef}
      style={{ left: `${Math.max(12, posX)}px`, top: `${Math.max(12, posY)}px` }}
      className="fixed z-50 w-64 rounded-2xl border border-neutral-200/90 bg-white/95 p-2 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 select-none text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-neutral-100 mb-1.5">
        <div className="flex items-center gap-1.5 font-bold text-neutral-800">
          <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Ganti Suara Anime</span>
        </div>
        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5" /> Gratis
        </span>
      </div>

      <p className="px-2.5 pb-1.5 text-[10px] text-neutral-400">
        Klik suara untuk langsung berganti:
      </p>

      {/* Voice Items */}
      <div className="space-y-1">
        {ANIME_VOICE_PRESETS.map((voice: VoicePreset) => {
          const isSelected = currentVoiceId === voice.id;
          return (
            <div
              key={voice.id}
              className={`group flex items-center justify-between rounded-xl px-2.5 py-2 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-indigo-50 text-indigo-900 font-medium'
                  : 'hover:bg-neutral-50 text-neutral-700'
              }`}
              onClick={() => {
                onSelectVoice(voice.id);
                onClose();
              }}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs truncate">
                    {voice.name}
                  </span>
                  {isSelected && (
                    <Check className="w-3 h-3 text-indigo-600 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-neutral-500 truncate">
                  {voice.character}
                </span>
              </div>

              {/* Quick Preview Button */}
              <button
                type="button"
                title="Dengarkan sampel"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewVoice(voice.id);
                }}
                className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white text-indigo-700 transition-all shrink-0"
              >
                <Play className="w-3 h-3 fill-indigo-600" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer / Advanced Option */}
      <div className="mt-1.5 pt-1.5 border-t border-neutral-100">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenAdvancedSettings();
          }}
          className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition text-[11px] font-medium"
        >
          <Settings2 className="w-3.5 h-3.5 text-neutral-400" />
          <span>Pengaturan Suara Lengkap...</span>
        </button>
      </div>
    </div>
  );
};
