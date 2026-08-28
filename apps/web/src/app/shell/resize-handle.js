import { SIDEBAR_WIDTH_LIMITS } from "@contracts/constants.js";
import { setSidebarWidth } from "../../shared/lib/appearance.js";

export function initResizeHandle(handleElement) {
  if (!handleElement || typeof globalThis.window === "undefined") return;

  let isDragging = false;
  let rafId = null;
  let lastX = 0;
  let dragWidth = 0;

  const applyDrag = () => {
    rafId = null;
    const provider = document.querySelector("ds-sidebar-provider");
    if (!provider) return;

    const left = provider.getBoundingClientRect().left;
    const rawWidth = Math.round(lastX - left);

    // Threshold collapse (< 140px collapses to icon mode)
    if (rawWidth < 140) {
      provider.setOpen(false);
      return;
    } else {
      if (!provider.store.getState().open) {
        provider.setOpen(true);
      }
    }

    dragWidth = Math.min(
      SIDEBAR_WIDTH_LIMITS.max,
      Math.max(SIDEBAR_WIDTH_LIMITS.min, rawWidth),
    );

    document.documentElement.style.setProperty("--sidebar-width", `${dragWidth}px`);
    document.documentElement.style.setProperty("--sidebar-current-width", `${dragWidth}px`);
  };

  const onPointerDown = (e) => {
    isDragging = true;
    lastX = e.clientX;
    document.body.classList.add("sidebar-resizing");
    try {
      handleElement.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    lastX = e.clientX;
    if (rafId === null) {
      rafId = requestAnimationFrame(applyDrag);
    }
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    document.body.classList.remove("sidebar-resizing");

    if (rafId !== null) {
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
    document.documentElement.style.setProperty("--sidebar-width", `${defaultWidth}px`);
    document.documentElement.style.setProperty("--sidebar-current-width", `${defaultWidth}px`);
    setSidebarWidth(defaultWidth);
  };

  handleElement.addEventListener("pointerdown", onPointerDown);
  handleElement.addEventListener("pointermove", onPointerMove);
  handleElement.addEventListener("pointerup", onPointerUp);
  handleElement.addEventListener("pointercancel", onPointerUp);
  handleElement.addEventListener("dblclick", onDblClick);
}
