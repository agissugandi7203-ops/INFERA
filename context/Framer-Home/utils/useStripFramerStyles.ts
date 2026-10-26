/**
 * useStripFramerStyles
 *
 * React hook that strips specified inline-style properties from a
 * target element on mount and re-strips them whenever the Framer
 * runtime re-applies them.
 *
 * Why this is needed:
 *   The Framer runtime claims ownership of certain inline-style
 *   properties (backdrop-filter, mask, background, overflow,
 *   will-change, --extracted-* CSS variables) and re-writes them on
 *   every render cycle — even without an active animation. Inline
 *   `style="..."` always beats external `!important` in the CSS
 *   cascade, so any author override applies for one frame then snaps
 *   back. There is no CSS-only counter.
 *
 *   The MutationObserver below watches the target's `style` attribute
 *   and re-strips the properties every time the runtime touches them.
 *   `attributeFilter: ["style"]` keeps the observer cost negligible.
 *
 * Usage:
 *
 *   import useStripFramerStyles from "./utils/useStripFramerStyles";
 *
 *   function HeaderFix() {
 *     useStripFramerStyles(".framer-1a4zuki", [
 *       "backdropFilter",
 *       "webkitBackdropFilter",
 *       "mask",
 *       "background",
 *     ]);
 *     return null;
 *   }
 *
 *   // Then mount <HeaderFix /> once at the page root.
 */
"use client";
import { useEffect } from "react";

type StyleProperty = keyof CSSStyleDeclaration;

/**
 * Watch `selector`'s `style` attribute and clear each named property
 * whenever the runtime sets it. Cleared properties are set to "none"
 * (for filter/mask family) or "" (for color/background family) — the
 * sensible neutral value for each.
 *
 * Tears down the observer on unmount.
 */
export default function useStripFramerStyles(
  selector: string,
  properties: string[],
): void {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;
    const strip = () => {
      for (const prop of properties) {
        // For filter/mask family: explicit "none" defeats runtime values.
        // For background family: "" lets CSS take over.
        const neutral = /filter|mask|overflow|will/i.test(prop) ? "none" : "";
        // @ts-expect-error — dynamic style key set.
        el.style[prop as StyleProperty] = neutral;
      }
    };
    strip();
    const mo = new MutationObserver(strip);
    mo.observe(el, { attributes: true, attributeFilter: ["style"] });
    return () => mo.disconnect();
  }, [selector, properties.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
}
