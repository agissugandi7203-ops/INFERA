/**
 * LayoutIsland
 *
 * Wraps any Framer-exported component (or group of them) in its own
 * isolated framer-motion LayoutGroup so internal `layoutId` props
 * cannot collide with siblings in another part of the tree.
 *
 * Why this is needed:
 *   Bundled Framer components contain string-literal `layoutId` props
 *   on motion nodes. The exporter prefixes those ids per-component
 *   (so a Badge inside Stack and a Badge inside Center no longer
 *   share `layoutId="eTnAKyjwo"`). But if the consumer mounts the
 *   SAME component multiple times on one page — three Badges inside
 *   a Stack, say — framer-motion's shared-layout machinery still
 *   picks one as the "live" instance and animates the rest to ghost
 *   positions with opacity: 0. The text disappears.
 *
 *   LayoutIsland blocks that by giving every wrap its own
 *   LayoutGroup id (via React.useId()) and setting
 *   `inherit={false}` so the inner group doesn't merge with any
 *   outer LayoutGroup.
 *
 * IMPORTANT LIMIT — INNER-SIBLING COLLISIONS:
 *   LayoutIsland isolates *across* component imports. It does NOT
 *   solve collisions when a single exported component renders N
 *   copies of an internal sub-component (e.g. `Stack` rendering
 *   three internal `Badge` instances; `FAQ List` rendering six
 *   internal items). Those N sub-components share the same prefixed
 *   layoutId inside Stack's own internal LayoutGroup, so 1 stays
 *   visible and the other N−1 ghost.
 *
 *   When you see this symptom — a Stack/List of N items where
 *   only one renders its text — apply the CSS escape-hatch on the
 *   ghosted nodes:
 *
 *     .ghosted-class {
 *       opacity: 1 !important;
 *       transform: none !important;
 *       pointer-events: auto !important;
 *     }
 *
 *   You can identify ghosted nodes in devtools: they have inline
 *   `transform: translate3d(Xpx, Ypx, 0px) scale(...)` plus
 *   `opacity: 0` on what should be visible text. This costs the
 *   shared-layout animation between siblings (which was the point
 *   of the inner LayoutGroup) but recovers the visible content
 *   (which is what the user actually needs).
 *
 * Usage:
 *
 *   import LayoutIsland from "./utils/LayoutIsland";
 *
 *   <LayoutIsland>
 *     <Stack />     {/* Stack renders 3 Badges internally — all isolated *​/}
 *   </LayoutIsland>
 *
 *   <LayoutIsland>
 *     <Center />    {/* separate island — Badge inside Center won't collide *​/}
 *   </LayoutIsland>
 */
"use client";
import { LayoutGroup } from "framer-motion";
import { useId, type ReactNode } from "react";

export default function LayoutIsland({ children }: { children: ReactNode }) {
  const id = useId();
  return (
    <LayoutGroup id={id} inherit={false}>
      {children}
    </LayoutGroup>
  );
}
