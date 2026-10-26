/**
 * ResponsiveWrapper
 *
 * Wraps a Framer-exported component with multi-variant support
 * (Desktop / Tablet / Phone / etc.) and automatically picks the
 * appropriate variant based on the viewport width.
 *
 * Why this is needed:
 *   Framer-exported components render at their canvas-time width
 *   (typically 1200px or 1920px) and don't auto-switch variants on
 *   resize. The consumer has to wire viewport-based variant
 *   selection by hand for every multi-variant component.
 *
 *   This wrapper takes a Component + variants map and watches
 *   `window.matchMedia` for breakpoint changes, passing the right
 *   `variant` prop down on each viewport.
 *
 * Usage:
 *
 *   import ResponsiveWrapper from "./utils/ResponsiveWrapper";
 *   import Header from "./Header";
 *
 *   <ResponsiveWrapper
 *     Component={Header}
 *     variants={{
 *       base: "Phone",     // 0+
 *       md: "Tablet",      // 810+
 *       lg: "Desktop",     // 1200+
 *     }}
 *   />
 *
 * Breakpoints follow the responsive-runtime defaults (Framer's own
 * canvas breakpoints).
 */
"use client";
import { useEffect, useState, type ComponentType } from "react";

interface ResponsiveWrapperProps<P extends { variant?: string }> {
  Component: ComponentType<P>;
  variants: {
    base?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
  };
  // Any other props get forwarded as-is.
  [key: string]: unknown;
}

const BREAKPOINTS = {
  base: 0,
  sm: 390,
  md: 810,
  lg: 1200,
  xl: 1440,
  "2xl": 1920,
} as const;

function pickVariant(
  width: number,
  variants: ResponsiveWrapperProps<{ variant?: string }>["variants"],
): string | undefined {
  const order: Array<keyof typeof BREAKPOINTS> = ["2xl", "xl", "lg", "md", "sm", "base"];
  for (const bp of order) {
    if (width >= BREAKPOINTS[bp] && variants[bp]) {
      return variants[bp];
    }
  }
  return variants.base;
}

export default function ResponsiveWrapper<P extends { variant?: string }>({
  Component,
  variants,
  ...rest
}: ResponsiveWrapperProps<P>) {
  const [variant, setVariant] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return variants.lg ?? variants.base;
    return pickVariant(window.innerWidth, variants);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setVariant(pickVariant(window.innerWidth, variants));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [variants]);

  return <Component {...(rest as unknown as P)} variant={variant} />;
}
