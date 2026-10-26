var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/3os2fpLFWkj2OyEHziTZ/9Rqj2nO2fFrHPJh744wb/c_B_UMA4E.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, getLoadingLazyAtYPosition, Image as Image1, useActiveVariantCallback, useComponentViewport, useLocaleInfo, useOnVariantChange, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";
var cycleOrder = ["cQ4sOwQSF", "mi5BBpoBa", "jGENgE00C"];
var serializationHash = "framer-Gx9ok";
var variantClassNames = { cQ4sOwQSF: "framer-v-wpyfiq", jGENgE00C: "framer-v-1grxdhc", mi5BBpoBa: "framer-v-qri6z9" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { delay: 0, duration: 0.4, ease: [0.44, 0, 0.56, 1], type: "tween" };
var transformTemplate1 = (_, t) => `translateX(-50%) ${t}`;
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx(MotionConfigContext.Provider, { value: contextValue, children });
};
var humanReadableVariantMap = { "01": "cQ4sOwQSF", "02": "mi5BBpoBa", "03": "jGENgE00C" };
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "cQ4sOwQSF" };
};
var createLayoutDependency = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component = /* @__PURE__ */ React.forwardRef(function(props, ref) {
  const fallbackRef = useRef(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React.useId();
  const { activeLocale, setLocale } = useLocaleInfo();
  const componentViewport = useComponentViewport();
  const { style, className, layoutId, variant, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "cQ4sOwQSF", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback(baseVariant);
  const onAppearojykui = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("mi5BBpoBa", true), 3e3);
  });
  const onAppear14qz7nn = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("jGENgE00C", true), 3e3);
  });
  const onAppear1s1a3sm = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("cQ4sOwQSF", true), 3e3);
  });
  useOnVariantChange(baseVariant, { default: onAppearojykui, jGENgE00C: onAppear1s1a3sm, mi5BBpoBa: onAppear14qz7nn });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsx(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-wpyfiq", className, classNames), "data-framer-name": "01", "data-highlight": true, layoutDependency, layoutId: "AlertCard__cQ4sOwQSF", ref: refBinding, style: { ...style }, ...addPropertyOverrides({ jGENgE00C: { "data-framer-name": "03" }, mi5BBpoBa: { "data-framer-name": "02" } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsxs(motion.div, { className: "framer-1qtq221", "data-framer-name": "Top", layoutDependency, layoutId: "AlertCard__zzbZdY1g8", children: [/* @__PURE__ */ _jsx(Image1, { background: { alt: "Dashboard", fit: "fit", intrinsicHeight: 70, intrinsicWidth: 280, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + 0 + 0 + 0), pixelHeight: 70, pixelWidth: 280, positionX: "center", positionY: "center", sizes: `min(${componentViewport?.width || "100vw"}, 280px)`, src: "https://framerusercontent.com/images/e7N84L0vlZQpYYqGdndB2EPeKk.svg?width=280&height=70" }, className: "framer-l0wo93", "data-border": true, "data-framer-name": "01", fitImageDimension: "height", layoutDependency, layoutId: "AlertCard__PlcF9_ERO", style: { "--border-bottom-width": "1px", "--border-color": "var(--token-3992e4b1-4934-4fc5-9122-067e1dd544fa, rgb(221, 229, 237))", "--border-left-width": "1px", "--border-right-width": "1px", "--border-style": "solid", "--border-top-width": "1px", borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10 }, ...addPropertyOverrides({ jGENgE00C: { background: { alt: "Dashboard", fit: "fit", intrinsicHeight: 70, intrinsicWidth: 280, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + 0 + 26), pixelHeight: 70, pixelWidth: 280, positionX: "center", positionY: "center", sizes: `calc(min(${componentViewport?.width || "100vw"}, 280px) * 0.8607)`, src: "https://framerusercontent.com/images/e7N84L0vlZQpYYqGdndB2EPeKk.svg?width=280&height=70" }, transformTemplate: transformTemplate1 }, mi5BBpoBa: { background: { alt: "Dashboard", fit: "fit", intrinsicHeight: 70, intrinsicWidth: 280, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + 0 + 52), pixelHeight: 70, pixelWidth: 280, positionX: "center", positionY: "center", sizes: `calc(min(${componentViewport?.width || "100vw"}, 280px) * 0.7214)`, src: "https://framerusercontent.com/images/e7N84L0vlZQpYYqGdndB2EPeKk.svg?width=280&height=70" }, transformTemplate: transformTemplate1 } }, baseVariant, gestureVariant) }), /* @__PURE__ */ _jsx(Image1, { background: { alt: "Dashboard", fit: "fit", intrinsicHeight: 70, intrinsicWidth: 280, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + 0 + 26), pixelHeight: 70, pixelWidth: 280, positionX: "center", positionY: "center", sizes: `calc(min(${componentViewport?.width || "100vw"}, 280px) * 0.8607)`, src: "https://framerusercontent.com/images/qRR37bNghXttLizbZI0gYViJtDE.svg?width=280&height=70" }, className: "framer-1oijqd", "data-border": true, "data-framer-name": "02", fitImageDimension: "height", layoutDependency, layoutId: "AlertCard__OOORmtCo7", style: { "--border-bottom-width": "1px", "--border-color": "var(--token-3992e4b1-4934-4fc5-9122-067e1dd544fa, rgb(221, 229, 237))", "--border-left-width": "1px", "--border-right-width": "1px", "--border-style": "solid", "--border-top-width": "1px", borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10 }, transformTemplate: transformTemplate1, ...addPropertyOverrides({ jGENgE00C: { background: { alt: "Dashboard", fit: "fit", intrinsicHeight: 70, intrinsicWidth: 280, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + 0 + 52), pixelHeight: 70, pixelWidth: 280, positionX: "center", positionY: "center", sizes: `calc(min(${componentViewport?.width || "100vw"}, 280px) * 0.7214)`, src: "https://framerusercontent.com/images/qRR37bNghXttLizbZI0gYViJtDE.svg?width=280&height=70" } }, mi5BBpoBa: { background: { alt: "Dashboard", fit: "fit", intrinsicHeight: 70, intrinsicWidth: 280, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + 0 + 0 + 0), pixelHeight: 70, pixelWidth: 280, positionX: "center", positionY: "center", sizes: `min(${componentViewport?.width || "100vw"}, 280px)`, src: "https://framerusercontent.com/images/qRR37bNghXttLizbZI0gYViJtDE.svg?width=280&height=70" }, transformTemplate: void 0 } }, baseVariant, gestureVariant) }), /* @__PURE__ */ _jsx(Image1, { background: { alt: "Dashboard", fit: "fit", intrinsicHeight: 70, intrinsicWidth: 280, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + 0 + 52), pixelHeight: 70, pixelWidth: 280, positionX: "center", positionY: "center", sizes: `calc(min(${componentViewport?.width || "100vw"}, 280px) * 0.7214)`, src: "https://framerusercontent.com/images/KeTabRzcIFVfk1ymsNMeghVPnM.svg?width=280&height=70" }, className: "framer-dtevcc", "data-border": true, "data-framer-name": "03", fitImageDimension: "height", layoutDependency, layoutId: "AlertCard__NwsKeUEJL", style: { "--border-bottom-width": "1px", "--border-color": "var(--token-3992e4b1-4934-4fc5-9122-067e1dd544fa, rgb(221, 229, 237))", "--border-left-width": "1px", "--border-right-width": "1px", "--border-style": "solid", "--border-top-width": "1px", borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10 }, transformTemplate: transformTemplate1, ...addPropertyOverrides({ jGENgE00C: { background: { alt: "Dashboard", fit: "fit", intrinsicHeight: 70, intrinsicWidth: 280, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + 0 + 0 + 0), pixelHeight: 70, pixelWidth: 280, positionX: "center", positionY: "center", sizes: `min(${componentViewport?.width || "100vw"}, 280px)`, src: "https://framerusercontent.com/images/KeTabRzcIFVfk1ymsNMeghVPnM.svg?width=280&height=70" }, transformTemplate: void 0 }, mi5BBpoBa: { background: { alt: "Dashboard", fit: "fit", intrinsicHeight: 70, intrinsicWidth: 280, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + 0 + 26), pixelHeight: 70, pixelWidth: 280, positionX: "center", positionY: "center", sizes: `calc(min(${componentViewport?.width || "100vw"}, 280px) * 0.8607)`, src: "https://framerusercontent.com/images/KeTabRzcIFVfk1ymsNMeghVPnM.svg?width=280&height=70" } } }, baseVariant, gestureVariant) })] }) }) }) }) });
});
var css = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-Gx9ok.framer-1lsxw4z, .framer-Gx9ok .framer-1lsxw4z { display: block; }", ".framer-Gx9ok.framer-wpyfiq { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-Gx9ok .framer-1qtq221 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: 100px; justify-content: flex-start; max-width: 280px; overflow: visible; padding: 0px; position: relative; width: 100%; z-index: 2; }", ".framer-Gx9ok .framer-l0wo93 { flex: none; height: auto; overflow: var(--overflow-clip-fallback, clip); position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); z-index: 3; }", ".framer-Gx9ok .framer-1oijqd { flex: none; height: auto; left: 50%; overflow: var(--overflow-clip-fallback, clip); position: absolute; top: 26px; width: 86%; will-change: var(--framer-will-change-override, transform); z-index: 2; }", ".framer-Gx9ok .framer-dtevcc { flex: none; height: auto; left: 50%; overflow: var(--overflow-clip-fallback, clip); position: absolute; top: 52px; width: 72%; will-change: var(--framer-will-change-override, transform); z-index: 1; }", ".framer-Gx9ok.framer-v-qri6z9 .framer-l0wo93 { left: 50%; position: absolute; top: 52px; width: 72%; z-index: 1; }", ".framer-Gx9ok.framer-v-qri6z9 .framer-1oijqd, .framer-Gx9ok.framer-v-1grxdhc .framer-dtevcc { left: unset; position: relative; top: unset; width: 100%; z-index: 3; }", ".framer-Gx9ok.framer-v-qri6z9 .framer-dtevcc { top: 26px; width: 86%; z-index: 2; }", ".framer-Gx9ok.framer-v-1grxdhc .framer-l0wo93 { left: 50%; position: absolute; top: 26px; width: 86%; z-index: 2; }", ".framer-Gx9ok.framer-v-1grxdhc .framer-1oijqd { top: 52px; width: 72%; z-index: 1; }", '.framer-Gx9ok[data-border="true"]::after, .framer-Gx9ok [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var Framerc_B_UMA4E = withCSS(Component, css, "framer-Gx9ok");
var c_B_UMA4E_default = Framerc_B_UMA4E;
Framerc_B_UMA4E.displayName = "Alert Card";
Framerc_B_UMA4E.defaultProps = { height: 100, width: 280 };
addPropertyControls(Framerc_B_UMA4E, { variant: { options: ["cQ4sOwQSF", "mi5BBpoBa", "jGENgE00C"], optionTitles: ["01", "02", "03"], title: "Variant", type: ControlType.Enum } });
addFonts(Framerc_B_UMA4E, [{ explicitInter: true, fonts: [] }], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "Framerc_B_UMA4E", "slots": [], "annotations": { "framerIntrinsicWidth": "280", "framerAutoSizeImages": "true", "framerDisplayContentsDiv": "false", "framerComponentViewportWidth": "true", "framerIntrinsicHeight": "100", "framerContractVersion": "1", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]},"mi5BBpoBa":{"layout":["fixed","auto"]},"jGENgE00C":{"layout":["fixed","auto"]}}}', "framerColorSyntax": "true", "framerImmutableVariables": "true" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  c_B_UMA4E_default as default
};
