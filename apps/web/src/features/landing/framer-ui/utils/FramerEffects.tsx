/**
 * FramerEffects — auto-populated by the exporter
 *
 * The bundled Framer runtime's withFX HOC does NOT execute the
 * `__framer__*` animation props it receives. This file
 * reimplements those animations via WAAPI so the rendered
 * components actually animate.
 *
 *
 * NOTE: 35 effect targets were detected but not auto-populated below.
 * You'll need to populate them manually following the discovery loop:
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)
 *   - .framer-styles-preset-1couuo6 (__framer__styleAppearEffectEnabled): transition is a spring — pre-sampling not auto-extracted (see Discovery Loop)

 * Mount this component once at the page root.
 */
"use client";
import { useEffect } from "react";

interface RevealSpec {
  selector: string;
  keyframes: Keyframe[];
  duration: number;
  easing?: string;
  threshold?: number;
  once?: boolean;
}

interface LoopSpec {
  selector: string;
  keyframes: Keyframe[];
  duration: number;
  easing?: string;
  pauseOffscreen?: boolean;
}

const REVEAL_SPECS: RevealSpec[] = [];

const LOOP_SPECS: LoopSpec[] = [];

export default function FramerEffects() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const fired = new Set<Element>();

    for (const spec of REVEAL_SPECS) {
      const targets = document.querySelectorAll<HTMLElement>(spec.selector);
      if (targets.length === 0) continue;
      targets.forEach((el) => {
        const initial = el.animate(spec.keyframes.slice(0, 1) as Keyframe[], { duration: 1, fill: "forwards" });
        initial.pause();
      });
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (spec.once !== false && fired.has(e.target)) continue;
          (e.target as HTMLElement).animate(spec.keyframes, {
            duration: spec.duration,
            easing: spec.easing,
            fill: "forwards",
          });
          if (spec.once !== false) fired.add(e.target);
        }
      }, { threshold: spec.threshold ?? 0, rootMargin: "0px" });
      targets.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    for (const spec of LOOP_SPECS) {
      const targets = document.querySelectorAll<HTMLElement>(spec.selector);
      const anims: Animation[] = [];
      targets.forEach((el) => {
        const anim = el.animate(spec.keyframes, {
          duration: spec.duration,
          easing: spec.easing,
          iterations: Infinity,
        });
        anims.push(anim);
      });
      if (spec.pauseOffscreen) {
        const io = new IntersectionObserver((entries) => {
          for (const e of entries) {
            const i = Array.from(targets).indexOf(e.target as HTMLElement);
            if (i < 0) continue;
            if (e.isIntersecting) anims[i]?.play();
            else anims[i]?.pause();
          }
        }, { threshold: 0 });
        targets.forEach((el) => io.observe(el));
        cleanups.push(() => io.disconnect());
      }
      cleanups.push(() => anims.forEach((a) => a.cancel()));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
