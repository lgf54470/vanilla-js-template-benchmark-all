import { SIDEBAR_WIDTH_LIMITS } from "@contracts/constants.js";
import { setSidebarWidth } from "../../shared/lib/appearance.js";

export function initResizeHandle(handleElement) {
  if (!handleElement || typeof globalThis.window === "undefined") return;

  let isDragging = false;
  let startX = 0;
  let startWidth = 0;

  const onPointerDown = (e) => {
    isDragging = true;
    startX = e.clientX;
    const currentWidthPx = handleElement.previousElementSibling?.getBoundingClientRect().width ||
      SIDEBAR_WIDTH_LIMITS.default;
    startWidth = currentWidthPx;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    handleElement.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;

    // Threshold collapse check (< 160px collapses to icon mode)
    if (newWidth < 160) {
      const provider = document.querySelector("ds-sidebar-provider");
      if (provider) provider.setOpen(false);
      return;
    } else {
      const provider = document.querySelector("ds-sidebar-provider");
      if (provider && !provider.store.getState().open) {
        provider.setOpen(true);
      }
    }

    const clamped = Math.max(
      SIDEBAR_WIDTH_LIMITS.min,
      Math.min(SIDEBAR_WIDTH_LIMITS.max, newWidth),
    );

    document.documentElement.style.setProperty("--sidebar-width", `${clamped}px`);
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";

    try {
      handleElement.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const computed = globalThis.getComputedStyle(document.documentElement).getPropertyValue(
      "--sidebar-width",
    );
    const widthVal = parseFloat(computed);
    if (!isNaN(widthVal)) {
      setSidebarWidth(widthVal);
    }
  };

  // Double click resets to default 16rem (256px)
  const onDblClick = () => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${SIDEBAR_WIDTH_LIMITS.default}px`,
    );
    setSidebarWidth(SIDEBAR_WIDTH_LIMITS.default);
  };

  handleElement.addEventListener("pointerdown", onPointerDown);
  handleElement.addEventListener("pointermove", onPointerMove);
  handleElement.addEventListener("pointerup", onPointerUp);
  handleElement.addEventListener("pointercancel", onPointerUp);
  handleElement.addEventListener("dblclick", onDblClick);
}
