var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/kHcRfPWBor47a1N3TKCX/RyG4YY4Or9WKSx4lYckT/jPBcSlbwL.js
import { jsx as _jsx } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, getLoadingLazyAtYPosition, Image as Image1, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";
var serializationHash = "framer-NFwQ8";
var variantClassNames = { r2UkE55_v: "framer-v-121dedw" };
var transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var toResponsiveImage = (value) => {
  if (typeof value === "object" && value !== null && typeof value.src === "string") {
    return value;
  }
  return typeof value === "string" ? { src: value } : void 0;
};
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx(MotionConfigContext.Provider, { value: contextValue, children });
};
var Variants = motion.create(React.Fragment);
var getProps = ({ height, icon, id, width, ...props }) => {
  return { ...props, z6AwEa6gl: icon ?? props.z6AwEa6gl ?? { alt: "Icon", pixelHeight: 18, pixelWidth: 19, src: "https://framerusercontent.com/images/DR5ESv57oR37TVFwEH7Mx1yI0.svg?width=19&height=18" } };
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
  const { style, className, layoutId, variant, z6AwEa6gl, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ defaultVariant: "r2UkE55_v", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsx(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-121dedw", className, classNames), "data-framer-name": "Desktop", layoutDependency, layoutId: "IntegrationIcon__r2UkE55_v", ref: refBinding, style: { backgroundColor: "var(--token-260f9222-11bc-40e3-a74c-4f1dae7b4ffa, rgb(255, 255, 255))", borderBottomLeftRadius: "50%", borderBottomRightRadius: "50%", borderTopLeftRadius: "50%", borderTopRightRadius: "50%", ...style }, children: /* @__PURE__ */ _jsx(Image1, { background: { alt: "Icon", fit: "fit", intrinsicHeight: 18, intrinsicWidth: 19, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + (0 + ((componentViewport?.height || 80) - 0 - 32) / 2)), pixelHeight: 18, pixelWidth: 19, sizes: "32px", ...toResponsiveImage(z6AwEa6gl), ...{ positionX: "center", positionY: "center" } }, className: "framer-1ql6zqh", layoutDependency, layoutId: "IntegrationIcon__XESc9sndH" }) }) }) }) });
});
var css = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-NFwQ8.framer-12wbgm7, .framer-NFwQ8 .framer-12wbgm7 { display: block; }", ".framer-NFwQ8.framer-121dedw { align-content: center; align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: auto; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); }", ".framer-NFwQ8 .framer-1ql6zqh { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 32px); overflow: visible; position: relative; width: 32px; }"];
var FramerjPBcSlbwL = withCSS(Component, css, "framer-NFwQ8");
var jPBcSlbwL_default = FramerjPBcSlbwL;
FramerjPBcSlbwL.displayName = "Integration Icon";
FramerjPBcSlbwL.defaultProps = { height: 80, width: 80 };
addPropertyControls(FramerjPBcSlbwL, { z6AwEa6gl: { __defaultAssetReference: "data:framer/asset-reference,DR5ESv57oR37TVFwEH7Mx1yI0.svg?originalFilename=icon-03.svg&preferredSize=auto&width=19&height=18", __vekterDefault: { alt: "Icon", assetReference: "data:framer/asset-reference,DR5ESv57oR37TVFwEH7Mx1yI0.svg?originalFilename=icon-03.svg&preferredSize=auto&width=19&height=18" }, title: "Icon", type: ControlType.ResponsiveImage } });
addFonts(FramerjPBcSlbwL, [{ explicitInter: true, fonts: [] }], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FramerjPBcSlbwL", "slots": [], "annotations": { "framerIntrinsicWidth": "80", "framerAutoSizeImages": "true", "framerContractVersion": "1", "framerVariables": '{"z6AwEa6gl":"icon"}', "framerColorSyntax": "true", "framerDisplayContentsDiv": "false", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","fixed"]}}}', "framerImmutableVariables": "true", "framerIntrinsicHeight": "80", "framerComponentViewportWidth": "true" } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  jPBcSlbwL_default as default
};
