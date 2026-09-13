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
  AlertCircle,
  MoreVertical,
  X,
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
  liveTranscript?: string;
  errorMessage?: string | null;
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
const DEFAULT_SCALE_DESKTOP = 1.0; // 100% standard on PC/Laptop

/**
 * Calculates responsive mobile scale based on viewport width:
 * ~45% - 48% of screen width so the avatar sits comfortably as a companion
 * without dominating or obstructing dashboard data.
 */
export const calculateResponsiveMobileScale = (width = typeof window !== 'undefined' ? window.innerWidth : 390): number => {
  const targetW = width * 0.46;
  const s = targetW / BASE_WIDTH;
  return Math.min(0.58, Math.max(0.40, Math.round(s * 100) / 100));
};

export const FloatingAvatarWidget: React.FC<FloatingAvatarWidgetProps> = ({
  currentEmotion,
  manualMouthOpen,
  onControllerReady,
  onClickToSpeak,
  isListening = false,
  isSoundDetected = false,
  liveTranscript,
  errorMessage,
  onOpenChat,
  onMinimize,
  isMinimized = false,
  selectedVoiceId = VOICE_DEFAULT_ID,
  onSelectVoice,
}) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const defaultScale = isMobile ? calculateResponsiveMobileScale() : DEFAULT_SCALE_DESKTOP;

  // Scale factor: 1.0 (100%) on desktop, responsive ~0.45-0.50 on mobile
  const [scale, setScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCALE);
      if (saved) {
        const val = parseFloat(saved);
        // Automatically migrate legacy 1.4 or 0.7 default to new standard
        if (val === 1.4 || val === 0.7) {
          return isMobile ? calculateResponsiveMobileScale() : DEFAULT_SCALE_DESKTOP;
        }
        if (val >= 0.35 && val <= 2.2) {
          return isMobile ? Math.min(val, 0.75) : val;
        }
      }
    } catch { /* ignore */ }
    return isMobile ? calculateResponsiveMobileScale() : DEFAULT_SCALE_DESKTOP;
  });

  const minScale = isMobile ? 0.35 : 0.50;
  const maxScale = typeof window !== 'undefined'
    ? Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT, isMobile ? 0.90 : 2.0)
    : (isMobile ? 0.80 : 1.8);

  // Effective pixel size (used for bounds checking and pill placement)
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
      const initW = Math.round(BASE_WIDTH * defaultScale);
      return {
        x: Math.max(10, window.innerWidth - initW - (isMobile ? 12 : 36)),
        y: isMobile ? 65 : 50,
      };
    }
    return { x: 800, y: 50 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ x: number; y: number } | null>(null);
  const [showVoiceSubmenu, setShowVoiceSubmenu] = useState(false);
  const openedAtRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);

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
        if (Math.hypot(dx, dy) > 5) {
          dragStartRef.current.hasMoved = true;
          setShowMenu(false);
          setMenuCoords(null);
        } else {
          return;
        }
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
        const now = Date.now();
        if (now - lastTapTimeRef.current < 450) {
          return;
        }
        lastTapTimeRef.current = now;
        onClickToSpeak();
      }
    };

    const onGlobalClick = (e: MouseEvent) => {
      // Cooldown check: prevent immediately closing if the right click release or immediate click fires
      if (performance.now() - openedAtRef.current < 250) {
        return;
      }
      if (showMenu && !(e.target as HTMLElement).closest('.avatar-control-menu') && !(e.target as HTMLElement).closest('.avatar-pill-btn')) {
        setShowMenu(false);
        setShowVoiceSubmenu(false);
        setMenuCoords(null);
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
  }, [currentWidth, currentHeight, onClickToSpeak, showMenu]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.ignore-drag')) return;
    if ((e.target as HTMLElement).closest('.avatar-control-menu')) return;
    if ((e.target as HTMLElement).closest('.avatar-pill-btn')) return;
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
    setMenuCoords({
      x: Math.min(e.clientX, window.innerWidth - 270),
      y: Math.min(e.clientY, window.innerHeight - 440),
    });
    setShowMenu(true);
  };

  // Scale slider: runs completely outside the scaled container so NO position feedback loop
  const handleScaleChange = useCallback((val: number) => {
    const clamped = Math.max(minScale, Math.min(maxScale, val));
    setScale(clamped);
    scaleRef.current = clamped;
    try { localStorage.setItem(STORAGE_KEY_SCALE, clamped.toString()); } catch { /* ignore */ }
  }, [minScale, maxScale]);

  const handleReset = () => {
    const s = isMobile ? calculateResponsiveMobileScale() : DEFAULT_SCALE_DESKTOP;
    const w = Math.round(BASE_WIDTH * s);
    const p = {
      x: Math.max(10, window.innerWidth - w - (isMobile ? 12 : 36)),
      y: isMobile ? 65 : 50,
    };
    setPosition(p);
    setScale(s);
    scaleRef.current = s;
    setShowMenu(false);
    setShowVoiceSubmenu(false);
    setMenuCoords(null);
    try {
      localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(p));
      localStorage.setItem(STORAGE_KEY_SCALE, s.toString());
    } catch { /* ignore */ }
  };

  // Floating Control Pill Coordinates (Anchored to top-right of the avatar box)
  const pillX = Math.min(
    window.innerWidth - (isMobile ? 80 : 86),
    Math.max(10, position.x + currentWidth - (isMobile ? 74 : 80))
  );
  const pillY = Math.max(10, Math.min(window.innerHeight - 52, position.y + 8));

  // Menu popup coordinates
  const menuWidth = isMobile ? Math.min(window.innerWidth - 24, 280) : 260;
  const menuX = menuCoords
    ? menuCoords.x
    : (isMobile
        ? Math.max(12, Math.min(window.innerWidth - menuWidth - 12, pillX - menuWidth + 70))
        : Math.min(window.innerWidth - menuWidth - 16, Math.max(12, pillX - menuWidth + 74)));
  const menuY = menuCoords
    ? menuCoords.y
    : Math.max(12, Math.min(window.innerHeight - 440, pillY + 36));

  // Toolbar anchored to FIXED base position — NOT dependent on live scale value.
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
        {/* Listening Indicator / Live Speech Preview */}
        {isListening && (
          <div
            className={`absolute top-10 left-1/2 -translate-x-1/2 max-w-[340px] flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold shadow-xl transition-all duration-200 pointer-events-none z-30 ${
              isSoundDetected
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/60'
                : 'bg-slate-800/95 backdrop-blur-md text-slate-100 border border-slate-700/80'
            }`}
          >
            <Mic className={`w-3.5 h-3.5 flex-shrink-0 ${isSoundDetected ? 'animate-pulse' : 'text-slate-300'}`} />
            {isSoundDetected && (
              <span className="absolute -top-0.5 right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            )}
            <span className="truncate">
              {liveTranscript ? `"${liveTranscript}"` : (isSoundDetected ? 'Mendengarkan...' : 'Menunggu suara Anda...')}
            </span>
          </div>
        )}

        {/* Microphone Error Notification */}
        {errorMessage && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 max-w-[320px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-rose-600/95 text-white shadow-2xl z-30 pointer-events-none border border-rose-400/60 leading-snug">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-200" />
            <span>{errorMessage}</span>
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

      {/* ━━ Floating Action Pill (Titik Tiga & Minimize) ━━
          Anchored outside scale container in screen space so buttons are ALWAYS touch-friendly and crisp */}
      {!isMinimized && (
        <div
          className={`avatar-pill-btn ignore-drag pointer-events-auto fixed z-50 flex items-center gap-1 px-1.5 py-1 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white backdrop-blur-md shadow-lg border border-white/20 select-none transition-all duration-150 ${
            isMobile || isHovered || showMenu ? 'opacity-100 scale-100' : 'opacity-70 sm:opacity-0 hover:opacity-100'
          }`}
          style={{
            left: `${pillX}px`,
            top: `${pillY}px`,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Titik Tiga (More Options & Sizing) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openedAtRef.current = performance.now();
              setMenuCoords(null);
              setShowMenu((prev) => !prev);
            }}
            className={`p-1.5 rounded-full transition-colors ${
              showMenu ? 'bg-emerald-500 text-white' : 'text-slate-200 hover:text-white hover:bg-white/20'
            }`}
            title="Opsi & Ukuran FERA"
            aria-label="Opsi FERA"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3 bg-white/25" />

          {/* Quick Minimize */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              onMinimize();
            }}
            className="p-1.5 rounded-full text-slate-200 hover:text-rose-300 hover:bg-white/20 transition-colors"
            title="Sembunyikan Avatar (Minimize)"
            aria-label="Sembunyikan Avatar"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ━━ Desktop Quick Slider Toolbar (Hover Only) ━━ */}
      {!isMinimized && !isMobile && (
        <div
          className={`ignore-drag pointer-events-auto fixed z-50 transition-opacity duration-150 ${
            isHovered && !showMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            left: `${toolbarX}px`,
            top: `${toolbarY}px`,
            transform: 'translateX(-50%)',
          }}
          onMouseEnter={() => setIsHovered(true)}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/96 dark:bg-slate-900/96 backdrop-blur-md shadow-xl border border-neutral-200/90 dark:border-slate-800 select-none">
            <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />

            <input
              type="range"
              min={minScale}
              max={maxScale}
              step="0.05"
              value={scale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="w-24 sm:w-28 h-1.5 bg-neutral-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            <span className="text-[10px] font-mono font-semibold text-neutral-600 dark:text-slate-300 w-10 text-right">
              {Math.round(scale * 100)}%
            </span>

            <div className="w-px h-3 bg-neutral-200 dark:bg-slate-700" />

            <button
              type="button"
              onClick={() => onMinimize()}
              className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-slate-100 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Sembunyikan Avatar"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ━━ Mobile & Desktop Unified Control Menu (Titik Tiga & Context Menu) ━━ */}
      {showMenu && !isMinimized && (
        <div
          style={{
            position: 'fixed',
            left: `${menuX}px`,
            top: `${menuY}px`,
            width: `${menuWidth}px`,
            zIndex: 100,
          }}
          className="avatar-control-menu bg-white/98 dark:bg-slate-900/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-2 space-y-2 text-xs animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
                Asisten FERA
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowMenu(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Size Presets & Slider */}
          <div className="px-2 py-1 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Ukuran Avatar
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {Math.round(scale * 100)}%
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              {isMobile ? (
                <>
                  {[
                    { label: '40%', val: 0.40, desc: 'Kecil' },
                    { label: '50%', val: 0.50, desc: 'Sedang' },
                    { label: '65%', val: 0.65, desc: 'Ideal' },
                    { label: '100%', val: 1.00, desc: 'Penuh' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handleScaleChange(p.val)}
                      className={`py-1 px-0.5 rounded-lg text-[10px] font-medium border text-center transition-all ${
                        Math.abs(scale - p.val) < 0.04
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { label: '75%', val: 0.75 },
                    { label: '100%', val: 1.00 },
                    { label: '125%', val: 1.25 },
                    { label: '150%', val: 1.50 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handleScaleChange(p.val)}
                      className={`py-1 px-0.5 rounded-lg text-[10px] font-medium border text-center transition-all ${
                        Math.abs(scale - p.val) < 0.04
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Continuous Smooth Range Slider */}
            <div className="pt-1 flex items-center gap-2">
              <input
                type="range"
                min={minScale}
                max={maxScale}
                step="0.05"
                value={scale}
                onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          {/* Voice Selector Submenu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowVoiceSubmenu((prev) => !prev);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Karakter Suara</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  showVoiceSubmenu ? 'rotate-90 text-indigo-600 dark:text-indigo-400' : ''
                }`}
              />
            </button>

            {showVoiceSubmenu && (
              <div className="mt-1 mb-1 p-1 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectVoice) onSelectVoice(VOICE_DEFAULT_ID);
                    setShowVoiceSubmenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    (selectedVoiceId || VOICE_DEFAULT_ID) === VOICE_DEFAULT_ID
                      ? 'bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        (selectedVoiceId || VOICE_DEFAULT_ID) === VOICE_DEFAULT_ID
                          ? 'bg-emerald-600'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    <span>Fera (Default)</span>
                  </div>
                  {(selectedVoiceId || VOICE_DEFAULT_ID) === VOICE_DEFAULT_ID && (
                    <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectVoice) onSelectVoice(VOICE_SECONDARY_ID);
                    setShowVoiceSubmenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    selectedVoiceId === VOICE_SECONDARY_ID
                      ? 'bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedVoiceId === VOICE_SECONDARY_ID
                          ? 'bg-emerald-600'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    <span>Luna</span>
                  </div>
                  {selectedVoiceId === VOICE_SECONDARY_ID && (
                    <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-0.5 pt-0.5 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => { setShowMenu(false); onClickToSpeak(); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors text-left"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isListening ? 'Selesai Berbicara' : 'Bicara dengan Suara'}</span>
            </button>

            {onOpenChat && (
              <button
                onClick={() => { setShowMenu(false); onOpenChat(); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors text-left"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Buka Chat AI</span>
              </button>
            )}

            <button
              onClick={() => { setShowMenu(false); onMinimize(); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors text-left"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Sembunyikan Avatar</span>
            </button>

            <button
              onClick={handleReset}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors text-left"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Posisi &amp; Ukuran</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
