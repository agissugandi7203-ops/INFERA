import React, { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { CharacterModel } from './CharacterModel';
import { AvatarController, CharacterEmotion } from './AvatarController';

interface AvatarCanvasProps {
  currentEmotion?: CharacterEmotion;
  mouthOpenAmount?: number;
  onControllerReady?: (controller: AvatarController) => void;
  className?: string;
}

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  currentEmotion = 'normal',
  mouthOpenAmount = 0,
  onControllerReady,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AvatarController | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let app: Application | null = null;
    let isDisposed = false;

    async function initPixi() {
      if (!mountRef.current) return;

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
          antialias: true,
          resolution: 1,
          autoDensity: false,
          preference: 'webgl',
          powerPreference: 'high-performance',
        });

        if (isDisposed) {
          try {
            app.destroy(true, { children: true, texture: false });
          } catch {
            // ignore
          }
          return;
        }

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
        await model.load(
          '/avatar/character-manifest.json?v=' + Date.now(),
          '/avatar/character-atlas.png?v=' + Date.now()
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

        // Framing: 1.18 fitScale (hides dangling fingertips while preserving skirt and arms)
        const fitScale = 1.18;
        model.rootContainer.scale.set(fitScale);
        model.rootContainer.position.x = VIRTUAL_WIDTH / 2 - 562 * fitScale;
        model.rootContainer.position.y = 65 - 180 * fitScale;

        app.stage.addChild(model.rootContainer);

        // Safe tick loop with explicit render call
        app.ticker.add((ticker) => {
          const delta = ticker?.deltaMS ?? 16.6;
          controller.update(Math.min(delta, 100));
          app?.render();
        });

        app.render();

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

        console.info(`[Avatar] WebGL Model loaded successfully: ${model.sprites.size} sprites mounted.`);

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

    initPixi();

    return () => {
      isDisposed = true;
      if (app) {
        try {
          app.destroy(true, { children: true, texture: false });
        } catch {
          // ignore cleanup errors
        }
        app = null;
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
