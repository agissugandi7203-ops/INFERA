var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/QdwB35upeNMnMLXJGDL8/V7yDGW3ctWH35WNG5uCs/HcSHdSDmW.js
import { jsx as _jsx } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, getLoadingLazyAtYPosition, Image as Image1, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";
var serializationHash = "framer-scK7c";
var variantClassNames = { VoFmnTrtN: "framer-v-ekyt1f" };
var toResponsiveImage = (value) => {
  if (typeof value === "object" && value !== null && typeof value.src === "string") {
    return value;
  }
  return typeof value === "string" ? { src: value } : void 0;
};
var transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx(MotionConfigContext.Provider, { value: contextValue, children });
};
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, image, width, ...props }) => {
  return { ...props, zDJH8fw1b: image ?? props.zDJH8fw1b ?? { alt: "Client Logo", pixelHeight: 30, pixelWidth: 130, src: "https://framerusercontent.com/images/ttAkZdMWSVdnEFWOMAGPd02naww.svg?width=130&height=30" } };
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
  const { style, className, layoutId, variant, zDJH8fw1b, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ defaultVariant: "VoFmnTrtN", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsx(Image1, { ...restProps, ...gestureHandlers, background: { alt: "Client Logo", fit: "fit", intrinsicHeight: 30, intrinsicWidth: 130, loading: getLoadingLazyAtYPosition(componentViewport?.y || 0), pixelHeight: 30, pixelWidth: 130, sizes: componentViewport?.width || "100vw", ...toResponsiveImage(zDJH8fw1b), ...{ positionX: "center", positionY: "center" } }, className: cx(scopingClassNames, "framer-ekyt1f", className, classNames), "data-framer-name": "Desktop", fitImageDimension: "width", layoutDependency, layoutId: "ClientLogo__VoFmnTrtN", ref: refBinding, style: { ...style } }) }) }) });
});
var css = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-scK7c.framer-1h61pzg, .framer-scK7c .framer-1h61pzg { display: block; }", ".framer-scK7c.framer-ekyt1f { height: auto; overflow: visible; position: relative; width: auto; }"];
var FramerHcSHdSDmW = withCSS(Component, css, "framer-scK7c");
var HcSHdSDmW_default = FramerHcSHdSDmW;
FramerHcSHdSDmW.displayName = "Client Logo";
FramerHcSHdSDmW.defaultProps = { height: 20, width: 87 };
addPropertyControls(FramerHcSHdSDmW, { zDJH8fw1b: { __defaultAssetReference: "data:framer/asset-reference,ttAkZdMWSVdnEFWOMAGPd02naww.svg?originalFilename=client-01.svg&width=130&height=30", __vekterDefault: { alt: "Client Logo", assetReference: "data:framer/asset-reference,ttAkZdMWSVdnEFWOMAGPd02naww.svg?originalFilename=client-01.svg&width=130&height=30" }, title: "Image", type: ControlType.ResponsiveImage } });
addFonts(FramerHcSHdSDmW, [{ explicitInter: true, fonts: [] }], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "FramerHcSHdSDmW", "slots": [], "annotations": { "framerComponentViewportWidth": "true", "framerContractVersion": "1", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fit-image","fixed"]}}}', "framerColorSyntax": "true", "framerIntrinsicWidth": "87", "framerImmutableVariables": "true", "framerDisplayContentsDiv": "false", "framerVariables": '{"zDJH8fw1b":"image"}', "framerIntrinsicHeight": "20", "framerAutoSizeImages": "true" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  HcSHdSDmW_default as default
};
