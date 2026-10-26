var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/Yppqt3Cs3Y8TZqvASnXl/Jx2Y4gq6eTurOxx3fNuZ/SmoothScroll_Prod.js
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { addPropertyControls, ControlType, RenderTarget } from "./_framer-runtime.js";
var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function isPhoneDevice() {
  return __dai_window.matchMedia("(max-width: 767px)").matches || /iPhone|iPod|Android.+Mobile|Windows Phone|webOS|BlackBerry/i.test(__dai_navigator.userAgent);
}
function canScrollBy(node, delta) {
  const limit = node.scrollHeight - node.clientHeight;
  return delta > 0 && node.scrollTop < limit - 1 || delta < 0 && node.scrollTop > 1;
}
function findNestedScroller(path, delta) {
  for (const node of path) {
    if (!(node instanceof HTMLElement))
      continue;
    if (node === document.documentElement || node === document.body)
      break;
    if (node.scrollHeight - node.clientHeight < 1)
      continue;
    const style = getComputedStyle(node);
    if (!/^(auto|scroll|overlay)$/.test(style.overflowY))
      continue;
    if (canScrollBy(node, delta))
      return node;
    if (/^(contain|none)$/.test(style.overscrollBehaviorY))
      return node;
  }
  return null;
}
function measureHeader() {
  const width = __dai_window.innerWidth;
  const height = __dai_window.innerHeight;
  const band = height * 0.1;
  const rows = [height * 0.12, height * 0.2, height * 0.3];
  for (let y = 1; y <= band + 12; y += 12)
    rows.push(y);
  const seen = /* @__PURE__ */ new Set();
  let bottom = 0;
  for (const y of rows) {
    for (const x of [0.25, 0.5, 0.75]) {
      for (const hit of document.elementsFromPoint(width * x, y)) {
        for (let node = hit; node; node = node.parentElement) {
          if (node === document.body || seen.has(node))
            break;
          seen.add(node);
          const style = getComputedStyle(node);
          if (style.position !== "fixed" && style.position !== "sticky")
            continue;
          if (style.visibility === "hidden" || style.opacity === "0")
            continue;
          const rect = node.getBoundingClientRect();
          if (rect.height <= 0 || rect.height >= height * 0.4)
            continue;
          const centred = rect.left <= width / 2 && rect.right >= width / 2 && rect.width >= 120;
          if (rect.width < width * 0.4 && !centred)
            continue;
          let top = rect.top;
          if (style.position === "sticky") {
            const stick = Number.parseFloat(style.top);
            let parent = node.parentElement;
            while (parent && getComputedStyle(parent).display === "contents") {
              parent = parent.parentElement;
            }
            if (Number.isNaN(stick) || !parent)
              continue;
            const range = parent.getBoundingClientRect();
            if (range.top + __dai_window.scrollY > height)
              continue;
            if (range.height - rect.height < height)
              continue;
            top = stick;
          }
          if (top > band || top + rect.height <= 0)
            continue;
          bottom = Math.max(bottom, top + rect.height);
        }
      }
    }
  }
  return Math.round(bottom);
}
function SmoothScroll(props) {
  const { intensity = 50 } = props;
  const isCanvas = RenderTarget.current() === RenderTarget.canvas;
  React.useEffect(() => {
    if (isCanvas || typeof __dai_window === "undefined")
      return;
    __dai_window.__framerUniversitySmoothScroll?.release();
    if (isPhoneDevice())
      return;
    const motionQuery = __dai_window.matchMedia("(prefers-reduced-motion: reduce)");
    const rootStyle = document.documentElement.style;
    const previousPadding = rootStyle.scrollPaddingTop;
    const authoredPadding = !previousPadding && (Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0) > 0;
    let current = __dai_window.scrollY;
    let target = current;
    let frame = 0;
    let previousTime = 0;
    let stopped = false;
    let gesture = null;
    const normalized = clamp(intensity, 0, 100) / 100;
    const response = normalized <= 0.5 ? 0.22 - 0.12 * (normalized / 0.5) : 0.1 - 0.07 * ((normalized - 0.5) / 0.5);
    const writeScroll = (top) => {
      __dai_window.scrollTo({ top, behavior: "instant" });
    };
    let scrollEndHeld = false;
    const onScrollEnd = (event) => {
      if (event.target !== document)
        return;
      if (frame && event.isTrusted) {
        event.stopImmediatePropagation();
        scrollEndHeld = true;
        return;
      }
      scrollEndHeld = false;
    };
    const flushScrollEnd = () => {
      if (!scrollEndHeld)
        return;
      requestAnimationFrame(() => {
        if (!scrollEndHeld || frame)
          return;
        scrollEndHeld = false;
        document.dispatchEvent(new Event("scrollend", { bubbles: true }));
      });
    };
    const stop = () => {
      if (frame)
        cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      current = target = __dai_window.scrollY;
      flushScrollEnd();
    };
    const hasStopScroll = () => {
      if (document.querySelector("style[data-frameruni-stop-scroll]")) {
        return true;
      }
      const htmlOverflow = getComputedStyle(document.documentElement).overflowY;
      const bodyOverflow = getComputedStyle(document.body).overflowY;
      return htmlOverflow === "hidden" || htmlOverflow === "clip" || bodyOverflow === "hidden" || bodyOverflow === "clip";
    };
    const syncStoppedState = () => {
      const nextStopped = hasStopScroll();
      if (nextStopped && !stopped)
        stop();
      if (!nextStopped && stopped) {
        current = target = __dai_window.scrollY;
      }
      stopped = nextStopped;
    };
    const scheduleFrame = () => {
      frame = requestAnimationFrame(advanceFrame);
    };
    const advanceFrame = (time) => {
      if (stopped || motionQuery.matches) {
        stop();
        return;
      }
      const deltaTime = previousTime ? Math.max(0, (time - previousTime) / 1e3) : 1 / 60;
      previousTime = time;
      if (step(deltaTime))
        scheduleFrame();
      else {
        frame = 0;
        previousTime = 0;
        flushScrollEnd();
      }
    };
    const step = (deltaTime) => {
      const mix = 1 - Math.exp(-response * 60 * deltaTime);
      current += (target - current) * mix;
      if (Math.abs(target - current) < 0.35)
        current = target;
      writeScroll(current);
      return current !== target;
    };
    let cachedLimit = -1;
    const scrollLimit = () => {
      if (cachedLimit < 0) {
        cachedLimit = Math.max(0, document.documentElement.scrollHeight - __dai_window.innerHeight);
      }
      return cachedLimit;
    };
    const jumpTo = (nextTarget) => {
      if (frame)
        cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      current = target = nextTarget;
      writeScroll(nextTarget);
      flushScrollEnd();
    };
    const animateTo = (nextTarget) => {
      if (motionQuery.matches) {
        jumpTo(nextTarget);
        return;
      }
      current = __dai_window.scrollY;
      target = nextTarget;
      previousTime = 0;
      if (current === target)
        return;
      if (!frame)
        scheduleFrame();
    };
    const applyHeaderOffset = () => {
      if (previousPadding || authoredPadding)
        return;
      const value = measureHeader();
      rootStyle.scrollPaddingTop = value ? `${value}px` : previousPadding;
    };
    const alignHashTarget = () => {
      if (stopped || !__dai_window.location.hash)
        return;
      let id = __dai_window.location.hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        return;
      }
      const element = document.getElementById(id);
      if (!element)
        return;
      applyHeaderOffset();
      const padding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
      if (padding < 1)
        return;
      if (Math.abs(element.getBoundingClientRect().top - margin) > 2)
        return;
      jumpTo(resolveScrollTarget(element));
    };
    const resolveScrollTarget = (value) => {
      const limit = Math.max(0, document.documentElement.scrollHeight - __dai_window.innerHeight);
      if (typeof value === "number")
        return clamp(value, 0, limit);
      const element = value instanceof HTMLElement ? value : value === "#" || value === "#top" ? null : document.getElementById(value.replace(/^#/, ""));
      if (!element)
        return 0;
      const style = getComputedStyle(element);
      const rootStyle2 = getComputedStyle(document.documentElement);
      const margin = Number.parseFloat(style.scrollMarginTop) || 0;
      const padding = Number.parseFloat(rootStyle2.scrollPaddingTop) || 0;
      return clamp(element.getBoundingClientRect().top + __dai_window.scrollY - margin - padding, 0, limit);
    };
    const onWheel = (event) => {
      if (stopped || motionQuery.matches || event.ctrlKey || !event.cancelable)
        return;
      const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? __dai_window.innerHeight : 1;
      const delta = event.deltaY * multiplier;
      if (!delta)
        return;
      const path = event.composedPath();
      const continuing = gesture && event.timeStamp - gesture.time < 150 && (!gesture.node || path.includes(gesture.node));
      const owner = continuing ? gesture.node : findNestedScroller(path, delta);
      gesture = { node: owner, time: event.timeStamp };
      if (owner) {
        if (!canScrollBy(owner, delta))
          event.preventDefault();
        return;
      }
      event.preventDefault();
      if (!continuing || target + delta > scrollLimit())
        cachedLimit = -1;
      const nextTarget = clamp(target + delta, 0, scrollLimit());
      if (nextTarget === target)
        return;
      target = nextTarget;
      if (frame)
        return;
      current = __dai_window.scrollY;
      scheduleFrame();
      previousTime = performance.now();
      if (!step(1 / 60)) {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
        flushScrollEnd();
      }
    };
    const onScroll = () => {
      const actual = __dai_window.scrollY;
      if (frame && Math.abs(actual - current) <= 1)
        return;
      if (frame)
        cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      current = target = actual;
      flushScrollEnd();
    };
    const onClick = (event) => {
      const clickable = event.composedPath().find((node) => node instanceof HTMLElement && node.matches("a[href], button"));
      if (!clickable)
        return;
      stop();
      if (!(clickable instanceof HTMLAnchorElement))
        return;
      if (event.defaultPrevented)
        return;
      if (event.button !== 0)
        return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      if (clickable.hasAttribute("download"))
        return;
      if (clickable.target && clickable.target !== "" && clickable.target !== "_self") {
        return;
      }
      const url = new URL(clickable.href, __dai_window.location.href);
      const currentUrl = new URL(__dai_window.location.href);
      const isSamePage = url.origin === currentUrl.origin && url.pathname === currentUrl.pathname && url.search === currentUrl.search;
      if (!isSamePage || !url.hash)
        return;
      let hash = url.hash;
      try {
        hash = decodeURIComponent(url.hash);
      } catch {
        return;
      }
      const element = document.getElementById(hash.slice(1));
      if (!element && hash !== "#top" && hash !== "#")
        return;
      event.preventDefault();
      if (__dai_window.location.hash === url.hash) {
        history.replaceState(history.state, "", url.hash);
      } else {
        history.pushState(history.state, "", url.hash);
      }
      animateTo(resolveScrollTarget(element ?? hash));
    };
    const onHashChange = () => requestAnimationFrame(alignHashTarget);
    const onClickCapture = (event) => {
      const link = event.composedPath().find((node) => node instanceof HTMLAnchorElement && node.hash);
      if (link)
        applyHeaderOffset();
    };
    let resizeTimer = 0;
    const onResize = () => {
      cachedLimit = -1;
      clearTimeout(resizeTimer);
      resizeTimer = __dai_window.setTimeout(applyHeaderOffset, 100);
    };
    let alignFrame = requestAnimationFrame(() => {
      alignFrame = requestAnimationFrame(alignHashTarget);
    });
    const attributeObserver = new MutationObserver((records) => {
      const relevant = records.some((record) => record.type === "attributes" && (record.target === document.documentElement || record.target === document.body));
      if (relevant)
        syncStoppedState();
    });
    const markerObserver = new MutationObserver((records) => {
      const relevant = records.some((record) => [...record.addedNodes, ...record.removedNodes].some((node) => node instanceof Element && (node.matches("style[data-frameruni-stop-scroll]") || Boolean(node.querySelector("style[data-frameruni-stop-scroll]")))));
      if (relevant)
        syncStoppedState();
    });
    attributeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] });
    attributeObserver.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });
    markerObserver.observe(document.head, { subtree: true, childList: true });
    markerObserver.observe(document.body, { subtree: true, childList: true });
    const release = () => {
      stop();
      cancelAnimationFrame(alignFrame);
      clearTimeout(resizeTimer);
      rootStyle.scrollPaddingTop = previousPadding;
      __dai_window.removeEventListener("hashchange", onHashChange);
      __dai_window.removeEventListener("popstate", onHashChange);
      __dai_window.removeEventListener("resize", onResize);
      __dai_window.removeEventListener("load", onResize);
      __dai_window.removeEventListener("click", onClickCapture, true);
      attributeObserver.disconnect();
      markerObserver.disconnect();
      __dai_window.removeEventListener("wheel", onWheel);
      __dai_window.removeEventListener("scroll", onScroll);
      __dai_window.removeEventListener("scrollend", onScrollEnd, true);
      __dai_window.removeEventListener("touchstart", stop);
      __dai_window.removeEventListener("click", onClick);
      motionQuery.removeEventListener("change", stop);
      if (__dai_window.__framerUniversitySmoothScroll?.release === release) {
        delete __dai_window.__framerUniversitySmoothScroll;
      }
    };
    __dai_window.__framerUniversitySmoothScroll = { release };
    __dai_window.addEventListener("wheel", onWheel, { passive: false });
    __dai_window.addEventListener("scroll", onScroll, { passive: true });
    __dai_window.addEventListener("scrollend", onScrollEnd, true);
    __dai_window.addEventListener("touchstart", stop, { passive: true });
    __dai_window.addEventListener("click", onClick);
    __dai_window.addEventListener("hashchange", onHashChange);
    __dai_window.addEventListener("popstate", onHashChange);
    __dai_window.addEventListener("resize", onResize);
    __dai_window.addEventListener("load", onResize);
    __dai_window.addEventListener("click", onClickCapture, true);
    motionQuery.addEventListener("change", stop);
    syncStoppedState();
    applyHeaderOffset();
    return release;
  }, [intensity, isCanvas]);
  return /* @__PURE__ */ _jsx("div", { "data-build": "smooth-scroll-prod-20261005-01", "aria-hidden": "true", "data-smooth-scroll-host": "", style: { position: "relative", width: "100%", height: "100%", minWidth: isCanvas ? 24 : 0, minHeight: isCanvas ? 24 : 0, boxSizing: "border-box", border: "none", borderRadius: 0, pointerEvents: "none" } });
}
addPropertyControls(SmoothScroll, { intensity: { type: ControlType.Number, title: "Intensity", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", displayStepper: true, description: "More components at [Framer University](https://frameruni.link/cc)." } });
SmoothScroll.displayName = "Smooth Scroll";
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "SmoothScroll", "slots": [], "annotations": { "framerIntrinsicHeight": "24", "framerContractVersion": "1", "framerSupportedLayoutHeight": "any-prefer-fixed", "framerDisableUnlink": "* @framerSupportedLayoutWidth any-prefer-fixed", "framerIntrinsicWidth": "24" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  SmoothScroll as default
};
