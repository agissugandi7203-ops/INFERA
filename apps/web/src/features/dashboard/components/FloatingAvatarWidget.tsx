import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AvatarCanvas } from '../avatar/AvatarCanvas';
import { AvatarController, CharacterEmotion } from '../avatar/AvatarController';
import {
  Mic,
  EyeOff,
  MessageSquare,
  RotateCcw,
  Sliders,
  Volume2,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  VOICE_DEFAULT_ID,
  VOICE_SECONDARY_ID,
} from '../services/tts-processor';

interface FloatingAvatarWidgetProps {
  currentEmotion: CharacterEmotion;
  manualMouthOpen: number;
  onControllerReady: (ctrl: AvatarController) => void;
  onClickToSpeak: () => void;
  isListening?: boolean;
  isSoundDetected?: boolean;
  onOpenChat?: () => void;
  onMinimize: () => void;
  isMinimized?: boolean;
  selectedVoiceId?: string;
  onSelectVoice?: (voiceId: string) => void;
}

const STORAGE_KEY_POS = 'healthathon_avatar_pos';
const STORAGE_KEY_SCALE = 'healthathon_avatar_scale_factor';

const BASE_WIDTH = 380;
const BASE_HEIGHT = 520;
const DEFAULT_SCALE_DESKTOP = 1.4;
const DEFAULT_SCALE_MOBILE = 0.7;

export const FloatingAvatarWidget: React.FC<FloatingAvatarWidgetProps> = ({
  currentEmotion,
  manualMouthOpen,
  onControllerReady,
  onClickToSpeak,
  isListening = false,
  isSoundDetected = false,
  onOpenChat,
  onMinimize,
  isMinimized = false,
  selectedVoiceId = VOICE_DEFAULT_ID,
  onSelectVoice,
}) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const DEFAULT_SCALE = isMobile ? DEFAULT_SCALE_MOBILE : DEFAULT_SCALE_DESKTOP;

  // Scale factor — default 1.4 (140%) on desktop, 0.7 (70%) on mobile
  const [scale, setScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCALE);
      if (saved) {
        const val = parseFloat(saved);
        if (val >= 0.45 && val <= 2.5) {
          return isMobile ? Math.min(val, 0.85) : val;
        }
      }
    } catch { /* ignore */ }
    return isMobile ? DEFAULT_SCALE_MOBILE : DEFAULT_SCALE_DESKTOP;
  });

  const maxScale = typeof window !== 'undefined'
    ? Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT, isMobile ? 0.95 : 2.2)
    : (isMobile ? 0.85 : 2.0);

  // Effective pixel size (used for bounds checking only)
  const currentWidth = Math.round(BASE_WIDTH * scale);
  const currentHeight = Math.round(BASE_HEIGHT * scale);

  // Position state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
      }
    } catch { /* ignore */ }
    if (typeof window !== 'undefined') {
      const initW = Math.round(BASE_WIDTH * DEFAULT_SCALE);
      return {
        x: Math.max(10, window.innerWidth - initW - (isMobile ? 15 : 40)),
        y: isMobile ? 20 : 50,
      };
    }
    return { x: 800, y: 50 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showVoiceSubmenu, setShowVoiceSubmenu] = useState(false);
  const openedAtRef = useRef<number>(0);

  const isMouseDownRef = useRef(false);
  const posRef = useRef(position);
  posRef.current = position;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const animFrameRef = useRef<number | null>(null);

  const dragStartRef = useRef({
    startX: 0, startY: 0,
    initX: 0, initY: 0,
    hasMoved: false,
  });

  // Window resize bounds
  useEffect(() => {
    const handle = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, Math.max(10, window.innerWidth - currentWidth - 10)),
        y: Math.min(prev.y, Math.max(10, window.innerHeight - currentHeight - 10)),
      }));
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [currentWidth, currentHeight]);

  // Global pointer events for drag
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isMouseDownRef.current) return;
      const { startX, startY, initX, initY, hasMoved } = dragStartRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!hasMoved) {
        if (Math.hypot(dx, dy) > 5) dragStartRef.current.hasMoved = true;
        else return;
      }
      const nextX = Math.max(10, Math.min(window.innerWidth - currentWidth - 10, initX + dx));
      const nextY = Math.max(10, Math.min(window.innerHeight - currentHeight - 10, initY + dy));
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => {
        const p = { x: nextX, y: nextY };
        posRef.current = p;
        setPosition(p);
        setIsDragging(true);
      });
    };

    const onUp = () => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      const wasDragging = dragStartRef.current.hasMoved;
      setIsDragging(false);
      if (wasDragging) {
        try { localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(posRef.current)); } catch { /* ignore */ }
      } else {
        onClickToSpeak();
      }
    };

    const onGlobalClick = (e: MouseEvent) => {
      // Cooldown check: prevent immediately closing if the right click release or immediate click fires
      if (performance.now() - openedAtRef.current < 250) {
        return;
      }
      if (contextMenu && !(e.target as HTMLElement).closest('.avatar-context-menu')) {
        setContextMenu(null);
        setShowVoiceSubmenu(false);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('click', onGlobalClick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('click', onGlobalClick);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentWidth, currentHeight, onClickToSpeak, contextMenu]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.ignore-drag')) return;
    if ((e.target as HTMLElement).closest('.avatar-context-menu')) return;
    e.preventDefault();
    isMouseDownRef.current = true;
    dragStartRef.current = {
      startX: e.clientX, startY: e.clientY,
      initX: posRef.current.x, initY: posRef.current.y,
      hasMoved: false,
    };
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openedAtRef.current = performance.now();
    setShowVoiceSubmenu(false);
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 280),
    });
  };

  // Scale slider: runs completely outside the scaled container so NO position feedback loop
  const handleScaleChange = useCallback((val: number) => {
    const minS = isMobile ? 0.45 : 0.5;
    const clamped = Math.max(minS, Math.min(maxScale, val));
    setScale(clamped);
    scaleRef.current = clamped;
    try { localStorage.setItem(STORAGE_KEY_SCALE, clamped.toString()); } catch { /* ignore */ }
  }, [isMobile, maxScale]);

  const handleReset = () => {
    const s = DEFAULT_SCALE;
    const w = Math.round(BASE_WIDTH * s);
    const p = {
      x: Math.max(10, window.innerWidth - w - (isMobile ? 15 : 40)),
      y: isMobile ? 20 : 50,
    };
    setPosition(p);
    setScale(s);
    scaleRef.current = s;
    setContextMenu(null);
    setShowVoiceSubmenu(false);
    try {
      localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(p));
      localStorage.setItem(STORAGE_KEY_SCALE, s.toString());
    } catch { /* ignore */ }
  };

  // Toolbar anchored to FIXED base position — NOT dependent on live scale value.
  // This prevents the slider from moving under the cursor as scale changes → zero flicker.
  const toolbarX = position.x + BASE_WIDTH / 2;
  const toolbarY = position.y + 8;

  return (
    <>
      {/* ━━ Scaled Avatar Container ━━ */}
      <div
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          zIndex: 40,
          touchAction: 'none',
          userSelect: 'none',
          display: isMinimized ? 'none' : 'block',
          willChange: 'transform',
        }}
        className={`select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        title="Klik untuk berbicara • Klik & tahan untuk geser • Klik kanan untuk opsi"
      >
        {/* Listening Indicator (inside canvas — not in toolbar) */}
        {isListening && (
          <div
            className={`absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg transition-colors duration-200 pointer-events-none z-30 whitespace-nowrap ${
              isSoundDetected
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
                : 'bg-slate-800/90 backdrop-blur-md text-slate-100 border border-slate-700/80'
            }`}
          >
            <Mic className={`w-3.5 h-3.5 flex-shrink-0 ${isSoundDetected ? 'animate-pulse' : 'text-slate-300'}`} />
            {isSoundDetected && (
              <span className="absolute -top-0.5 right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            )}
            <span>{isSoundDetected ? 'Mendengarkan...' : 'Menunggu suara...'}</span>
          </div>
        )}

        {/* WebGL Avatar */}
        <div className="w-full h-full pointer-events-none overflow-hidden">
          <AvatarCanvas
            currentEmotion={isListening ? 'listening' : currentEmotion}
            mouthOpenAmount={manualMouthOpen}
            onControllerReady={onControllerReady}
            isMinimized={isMinimized}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* ━━ Floating Toolbar — OUTSIDE scale container, anchored in screen space ━━
           This means slider position is NEVER affected by scale changes → zero flicker */}
      {!isMinimized && (
        <div
          className={`ignore-drag pointer-events-auto fixed z-50 transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            left: `${toolbarX}px`,
            top: `${toolbarY}px`,
            transform: 'translateX(-50%)',
          }}
          onMouseEnter={() => setIsHovered(true)}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/96 backdrop-blur-md shadow-xl border border-neutral-200/90 select-none">
            <Sliders className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />

            {/* Slider: min/max/value are scale factors; NO DOM reflow when sliding */}
            <input
              type="range"
              min={isMobile ? 0.45 : 0.5}
              max={maxScale}
              step="0.05"
              value={scale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="w-24 sm:w-32 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            <span className="text-[10px] font-mono font-semibold text-neutral-600 w-10 text-right">
              {Math.round(scale * 100)}%
            </span>

            <div className="w-px h-3 bg-neutral-200" />

            <button
              type="button"
              onClick={() => onMinimize()}
              className="p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
              title="Sembunyikan Avatar"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ━━ Right-Click Context Menu ━━ */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 100,
          }}
          className="avatar-context-menu w-56 bg-white/96 backdrop-blur-md rounded-2xl shadow-2xl border border-neutral-200/90 p-1.5 space-y-0.5 text-xs animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            Opsi Asisten Avatar
          </div>

          <button
            onClick={() => { setContextMenu(null); setShowVoiceSubmenu(false); onClickToSpeak(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium transition-colors text-left"
          >
            <Mic className="w-4 h-4 text-emerald-600" />
            <span>{isListening ? 'Selesai Berbicara' : 'Berbicara dengan suara'}</span>
          </button>

          {onOpenChat && (
            <button
              onClick={() => { setContextMenu(null); setShowVoiceSubmenu(false); onOpenChat(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors text-left"
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Buka teks</span>
            </button>
          )}

          {/* Menu Suara */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowVoiceSubmenu((prev) => !prev);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 font-medium transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <span>Suara</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  showVoiceSubmenu ? 'rotate-90 text-indigo-600' : ''
                }`}
              />
            </button>

            {showVoiceSubmenu && (
              <div className="mt-1 mb-1 p-1 bg-neutral-50/90 rounded-xl border border-neutral-200/80 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectVoice) onSelectVoice(VOICE_DEFAULT_ID);
                    setContextMenu(null);
                    setShowVoiceSubmenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    (selectedVoiceId || VOICE_DEFAULT_ID) === VOICE_DEFAULT_ID
                      ? 'bg-emerald-100/80 text-emerald-900 font-semibold shadow-2xs'
                      : 'text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        (selectedVoiceId || VOICE_DEFAULT_ID) === VOICE_DEFAULT_ID
                          ? 'bg-emerald-600'
                          : 'bg-neutral-300'
                      }`}
                    />
                    <span>Vera (Default)</span>
                  </div>
                  {(selectedVoiceId || VOICE_DEFAULT_ID) === VOICE_DEFAULT_ID && (
                    <Check className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectVoice) onSelectVoice(VOICE_SECONDARY_ID);
                    setContextMenu(null);
                    setShowVoiceSubmenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    selectedVoiceId === VOICE_SECONDARY_ID
                      ? 'bg-emerald-100/80 text-emerald-900 font-semibold shadow-2xs'
                      : 'text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedVoiceId === VOICE_SECONDARY_ID
                          ? 'bg-emerald-600'
                          : 'bg-neutral-300'
                      }`}
                    />
                    <span>Luna</span>
                  </div>
                  {selectedVoiceId === VOICE_SECONDARY_ID && (
                    <Check className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="h-px bg-neutral-100 mx-2" />

          <button
            onClick={() => { setContextMenu(null); setShowVoiceSubmenu(false); onMinimize(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium transition-colors text-left"
          >
            <EyeOff className="w-4 h-4" />
            <span>Sembunyikan</span>
          </button>

          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 font-medium transition-colors text-left"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      )}
    </>
  );
};
