var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/rofp3mS0LNY15cjhHzia/zmpvLkvKOP6Dr1PgUapT/BlurGradient_Prod.js
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { addPropertyControls, ControlType } from "./_framer-runtime.js";
import { MotionConfigContext, spring } from "framer-motion";
function BlurGradient({ blur, borderRadius, direction }) {
  const nativeTransition = React.useContext(MotionConfigContext).transition;
  const { filterTransition, settleMs } = React.useMemo(() => {
    const seconds = Math.max(0, Number(nativeTransition?.duration ?? 0.3));
    const delay = Math.max(0, Number(nativeTransition?.delay ?? 0));
    let timing = `${seconds}s linear`;
    if (nativeTransition?.type === "spring") {
      if (nativeTransition.stiffness && nativeTransition.damping) {
        timing = String(spring({ keyframes: [0, 1], stiffness: nativeTransition.stiffness, damping: nativeTransition.damping, mass: nativeTransition.mass ?? 1 }));
      } else {
        timing = String(spring(seconds, nativeTransition.bounce ?? 0.25));
      }
    } else if (Array.isArray(nativeTransition?.ease) && nativeTransition.ease.length === 4) {
      timing = `${seconds}s cubic-bezier(${nativeTransition.ease.join(", ")})`;
    } else if (typeof nativeTransition?.ease === "string" && ["linear", "ease", "ease-in", "ease-out", "ease-in-out"].includes(nativeTransition.ease)) {
      timing = `${seconds}s ${nativeTransition.ease}`;
    }
    const match = timing.match(/^([\d.]+)(ms|s)/);
    const animationMs = match ? Number(match[1]) * (match[2] === "s" ? 1e3 : 1) : seconds * 1e3;
    const part = `${timing} ${delay}s`;
    return { filterTransition: `backdrop-filter ${part}, -webkit-backdrop-filter ${part}`, settleMs: animationMs + delay * 1e3 };
  }, [nativeTransition]);
  const rootRef = React.useRef(null);
  const [renderLayers, setRenderLayers] = React.useState(true);
  const [hasBlurLayers, setHasBlurLayers] = React.useState(blur > 0);
  const [displayBlur, setDisplayBlur] = React.useState(blur);
  React.useEffect(() => {
    let frame = 0;
    let nextFrame = 0;
    let settleTimer = 0;
    if (blur > 0) {
      if (!hasBlurLayers) {
        setDisplayBlur(0);
        setHasBlurLayers(true);
        frame = requestAnimationFrame(() => {
          nextFrame = requestAnimationFrame(() => setDisplayBlur(blur));
        });
      } else {
        setDisplayBlur(blur);
      }
    } else {
      setDisplayBlur(0);
      if (settleMs === 0)
        setHasBlurLayers(false);
      else
        settleTimer = __dai_window.setTimeout(() => setHasBlurLayers(false), settleMs + 50);
    }
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(nextFrame);
      __dai_window.clearTimeout(settleTimer);
    };
  }, [blur, settleMs]);
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root)
      return;
    let inView = true;
    const update = () => setRenderLayers(inView && !document.hidden);
    const observer = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    }) : null;
    observer?.observe(root);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const getGradientDirection = (direction2) => {
    switch (direction2) {
      case "toBottom":
        return "to bottom";
      case "toTop":
        return "to top";
      case "toLeft":
        return "to left";
      case "toRight":
        return "to right";
      default:
        return "to bottom";
    }
  };
  const blurSteps = React.useMemo(() => [{ blur: `${displayBlur / 2 / 2 / 2 / 2 / 2 / 2 / 2}px`, gradient: `rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 12.5%, rgba(0, 0, 0, 1) 25%, rgba(0, 0, 0, 0) 37.5%` }, { blur: `${displayBlur / 2 / 2 / 2 / 2 / 2 / 2}px`, gradient: `rgba(0, 0, 0, 0) 12.5%, rgba(0, 0, 0, 1) 25%, rgba(0, 0, 0, 1) 37.5%, rgba(0, 0, 0, 0) 50%` }, { blur: `${displayBlur / 2 / 2 / 2 / 2 / 2}px`, gradient: `rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 1) 37.5%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 62.5%` }, { blur: `${displayBlur / 2 / 2 / 2 / 2}px`, gradient: `rgba(0, 0, 0, 0) 37.5%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 1) 62.5%, rgba(0, 0, 0, 0) 75%` }, { blur: `${displayBlur / 2 / 2 / 2}px`, gradient: `rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 1) 62.5%, rgba(0, 0, 0, 1) 75%, rgba(0, 0, 0, 0) 87.5%` }, { blur: `${displayBlur / 2 / 2}px`, gradient: `rgba(0, 0, 0, 0) 62.5%, rgba(0, 0, 0, 1) 75%, rgba(0, 0, 0, 1) 87.5%, rgba(0, 0, 0, 0) 100%` }, { blur: `${displayBlur / 2}px`, gradient: `rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 1) 87.5%, rgba(0, 0, 0, 1) 100%` }, { blur: `${displayBlur}px`, gradient: `rgba(0, 0, 0, 0) 87.5%, rgba(0, 0, 0, 1) 100%` }], [displayBlur]);
  return /* @__PURE__ */ _jsx("div", { ref: rootRef, style: { position: "absolute", inset: 0, overflow: "hidden" }, children: renderLayers && hasBlurLayers && blurSteps.map((step, index) => /* @__PURE__ */ _jsx("div", { style: { position: "absolute", inset: 0, zIndex: index + 1, backdropFilter: `blur(${step.blur})`, WebkitBackdropFilter: `blur(${step.blur})`, maskImage: `linear-gradient(${getGradientDirection(direction)}, ${step.gradient})`, WebkitMaskImage: `linear-gradient(${getGradientDirection(direction)}, ${step.gradient})`, borderRadius, pointerEvents: "none", transition: filterTransition } }, index)) });
}
BlurGradient.defaultProps = { blur: 10, borderRadius: "0px", direction: "toBottom" };
addPropertyControls(BlurGradient, { blur: { title: "Blur", type: ControlType.Number, defaultValue: 10, min: 0, max: 100, step: 1, description: "Large blur values (10<) can impact performance." }, borderRadius: { title: "Radius", type: ControlType.BorderRadius, defaultValue: "0px" }, direction: { title: "Direction", type: ControlType.SegmentedEnum, options: ["toBottom", "toTop", "toLeft", "toRight"], optionTitles: ["\u2193", "\u2191", "\u2190", "\u2192"], defaultValue: "toBottom", description: "More components at [Framer University](https://frameruni.link/cc)." } });
BlurGradient.displayName = "Blur Gradient";
var BlurGradient_Prod_default = BlurGradient;
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "BlurGradient", "slots": [], "annotations": { "framerContractVersion": "1", "framerSupportedLayoutHeight": "any-prefer-fixed", "framerIntrinsicHeight": "240", "framerSupportedLayoutWidth": "any-prefer-fixed", "framerDisableUnlink": "*", "framerIntrinsicWidth": "240" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  BlurGradient_Prod_default as default
};
