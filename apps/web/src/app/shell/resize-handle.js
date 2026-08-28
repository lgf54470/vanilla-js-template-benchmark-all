import { SIDEBAR_WIDTH_LIMITS } from "@contracts/constants.js";
import { setSidebarWidth } from "../../shared/lib/appearance.js";

export function initResizeHandle(handleElement) {
  if (!handleElement || typeof globalThis.window === "undefined") return () => {};

  let isDragging = false;
  let rafId = null;
  let lastX = 0;
  let dragWidth = 0;

  const applyDrag = () => {
    rafId = null;
    const provider = document.querySelector("ds-sidebar-provider");
    if (!provider) return;

    const left = provider.getBoundingClientRect ? provider.getBoundingClientRect().left : 0;
    const rawWidth = Math.round(lastX - left);

    // Threshold collapse (< 140px collapses to icon mode)
    if (rawWidth < 140) {
      if (typeof provider.setOpen === "function") provider.setOpen(false);
      return;
    } else {
      if (provider.store && !provider.store.getState().open) {
        if (typeof provider.setOpen === "function") provider.setOpen(true);
      }
    }

    dragWidth = Math.min(
      SIDEBAR_WIDTH_LIMITS.max,
      Math.max(SIDEBAR_WIDTH_LIMITS.min, rawWidth),
    );

    if (document.documentElement && document.documentElement.style) {
      document.documentElement.style.setProperty("--sidebar-width", `${dragWidth}px`);
      document.documentElement.style.setProperty("--sidebar-current-width", `${dragWidth}px`);
    }
  };

  const onPointerDown = (e) => {
    isDragging = true;
    lastX = e.clientX;
    document.body?.classList?.add("sidebar-resizing");
    try {
      handleElement.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    lastX = e.clientX;
    if (rafId === null && typeof requestAnimationFrame === "function") {
      rafId = requestAnimationFrame(applyDrag);
    }
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    document.body?.classList?.remove("sidebar-resizing");

    if (rafId !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    try {
      handleElement.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (dragWidth >= SIDEBAR_WIDTH_LIMITS.min) {
      setSidebarWidth(dragWidth);
    }
  };

  const onDblClick = () => {
    const defaultWidth = SIDEBAR_WIDTH_LIMITS.default;
    if (document.documentElement && document.documentElement.style) {
      document.documentElement.style.setProperty("--sidebar-width", `${defaultWidth}px`);
      document.documentElement.style.setProperty("--sidebar-current-width", `${defaultWidth}px`);
    }
    setSidebarWidth(defaultWidth);
  };

  handleElement.addEventListener("pointerdown", onPointerDown);
  handleElement.addEventListener("pointermove", onPointerMove);
  handleElement.addEventListener("pointerup", onPointerUp);
  handleElement.addEventListener("pointercancel", onPointerUp);
  handleElement.addEventListener("dblclick", onDblClick);

  return () => {
    handleElement.removeEventListener("pointerdown", onPointerDown);
    handleElement.removeEventListener("pointermove", onPointerMove);
    handleElement.removeEventListener("pointerup", onPointerUp);
    handleElement.removeEventListener("pointercancel", onPointerUp);
    handleElement.removeEventListener("dblclick", onDblClick);
  };
}

export function initSidebarResize(container) {
  if (!container) return () => {};
  const handle = container.querySelector ? container.querySelector(".app-shell__resize") : null;
  if (handle) {
    return initResizeHandle(handle);
  }
  return () => {};
}
