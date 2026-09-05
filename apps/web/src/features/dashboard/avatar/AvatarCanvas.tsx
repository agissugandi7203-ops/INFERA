import React, { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { CharacterModel } from './CharacterModel';
import { AvatarController, CharacterEmotion } from './AvatarController';

interface AvatarCanvasProps {
  currentEmotion?: CharacterEmotion;
  mouthOpenAmount?: number;
  onControllerReady?: (controller: AvatarController) => void;
  className?: string;
  isMinimized?: boolean;
}

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  currentEmotion = 'normal',
  mouthOpenAmount = 0,
  onControllerReady,
  className = '',
  isMinimized = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AvatarController | null>(null);
  const appRef = useRef<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pause ticker when minimized or tab hidden
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    if (isMinimized) {
      if (app.ticker.started) app.ticker.stop();
    } else if (!document.hidden) {
      if (!app.ticker.started) app.ticker.start();
    }
  }, [isMinimized]);

  useEffect(() => {
    let app: Application | null = null;
    let isDisposed = false;

    // Visibility change handler to stop WebGL render loops in background tabs
    const handleVisibility = () => {
      if (!app) return;
      if (document.hidden || isMinimized) {
        if (app.ticker.started) app.ticker.stop();
      } else {
        if (!app.ticker.started) app.ticker.start();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    async function initPixi() {
      if (!mountRef.current || isDisposed) return;

      try {
        setLoading(true);
        setError(null);

        // Fixed virtual canvas resolution (800x1000 - portrait aspect ratio)
        const VIRTUAL_WIDTH = 800;
        const VIRTUAL_HEIGHT = 1000;

        app = new Application();
        await app.init({
          width: VIRTUAL_WIDTH,
          height: VIRTUAL_HEIGHT,
          backgroundAlpha: 0,
          antialias: false, // Turn off costly MSAA for 2D sprites — massive GPU load drop
          resolution: 1,
          autoDensity: false,
          preference: 'webgl',
          powerPreference: 'low-power',
        });

        if (isDisposed) {
          try {
            app.destroy(true, { children: true, texture: false });
          } catch {
            // ignore
          }
          return;
        }

        appRef.current = app;

        // Attach WebGL canvas to dedicated mount container
        const canvas = app.canvas;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'contain';
        canvas.style.display = 'block';

        if (mountRef.current) {
          mountRef.current.innerHTML = '';
          mountRef.current.appendChild(canvas);
        }

        const model = new CharacterModel();
        // Load with browser cache (no cache-busting date stamps)
        await model.load(
          '/avatar/character-manifest.json',
          '/avatar/character-atlas.png'
        );

        if (isDisposed) {
          try {
            model.destroy();
            app.destroy(true, { children: true, texture: false });
          } catch {
            // ignore
          }
          return;
        }

        const controller = new AvatarController(model);
        controllerRef.current = controller;

        // Framing: 1.18 fitScale
        const fitScale = 1.18;
        model.rootContainer.scale.set(fitScale);
        model.rootContainer.position.x = VIRTUAL_WIDTH / 2 - 562 * fitScale;
        model.rootContainer.position.y = 65 - 180 * fitScale;

        app.stage.addChild(model.rootContainer);

        // Throttled 30 FPS tick loop for idle state (reduces CPU/GPU usage by ~70%)
        let lastRender = 0;
        const TARGET_FRAME_MS = 33.3; // 30 FPS is silky smooth for 2D anime character

        app.ticker.add((ticker) => {
          if (isDisposed || !app) return;
          const now = performance.now();
          if (now - lastRender < TARGET_FRAME_MS) return;
          lastRender = now;

          const delta = Math.min(ticker?.deltaMS ?? 33.3, 100);
          controller.update(delta);
          app.render();
        });

        app.render();

        if (isMinimized) {
          app.ticker.stop();
        }

        const canvasEl = app.canvas;
        if (canvasEl) {
          const onContextLost = (e: Event) => {
            e.preventDefault();
            console.warn('[Avatar] WebGL context lost.');
            setError('Akselerasi grafis WebGL terputus sementara. Silakan klik tombol di bawah untuk memuat ulang.');
          };
          const onContextRestored = () => {
            console.info('[Avatar] WebGL context restored.');
            setError(null);
          };
          canvasEl.addEventListener('webglcontextlost', onContextLost);
          canvasEl.addEventListener('webglcontextrestored', onContextRestored);
        }

        setLoading(false);
        if (onControllerReady) {
          onControllerReady(controller);
        }
      } catch (err) {
        if (!isDisposed) {
          console.error('[Avatar] Initialization failure:', err);
          setError(err instanceof Error ? err.message : 'Unknown WebGL canvas initialization error.');
          setLoading(false);
        }
      }
    }

    // Defer initialization by 60ms to let primary page DOM & charts paint with 0ms lag
    const initTimer = setTimeout(initPixi, 60);

    return () => {
      isDisposed = true;
      clearTimeout(initTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (app) {
        try {
          app.destroy(true, { children: true, texture: false });
        } catch {
          // ignore cleanup errors
        }
        app = null;
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (controllerRef.current && currentEmotion) {
      controllerRef.current.setEmotion(currentEmotion);
    }
  }, [currentEmotion]);

  useEffect(() => {
    if (controllerRef.current && mouthOpenAmount !== undefined) {
      controllerRef.current.setMouthOpen(mouthOpenAmount);
    }
  }, [mouthOpenAmount]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  return (
    <div className={'relative flex items-center justify-center overflow-hidden ' + className}>
      {/* Dedicated unmanaged DOM container for Pixi canvas */}
      <div ref={mountRef} className="w-full h-full flex items-center justify-center" />

      {loading && (
        <div className='absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/40 backdrop-blur-sm text-white pointer-events-none'>
          <div className='w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3' />
          <p className='text-xs font-medium tracking-wide text-neutral-200'>Memuat Avatar 2D Anime...</p>
        </div>
      )}

      {error && (
        <div className='absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 text-center text-white space-y-3 z-30'>
          <div className="space-y-1 max-w-xs">
            <p className='text-xs font-semibold text-rose-300'>Kendala Tampilan Avatar</p>
            <p className='text-[11px] text-slate-300 leading-relaxed'>{error}</p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors"
          >
            Muat Ulang Visual
          </button>
        </div>
      )}
    </div>
  );
};
