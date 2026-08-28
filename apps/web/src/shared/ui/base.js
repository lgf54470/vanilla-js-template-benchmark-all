/**
 * Web Components 样式注入与基础工具
 */

const UA_RESET_CSS = `
*, *::before, *::after {
  box-sizing: border-box;
}
button, input, textarea, select, a {
  font: inherit;
  color: inherit;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  outline: none;
  box-sizing: border-box;
  text-decoration: none;
}
button {
  cursor: pointer;
}
svg {
  display: inline-block;
  vertical-align: middle;
  fill: currentColor;
  flex-shrink: 0;
}
[hidden] {
  display: none !important;
}
`;

const NO_MOTION_CSS = `
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
}
`;

let sharedResetSheet = null;
let sharedNoMotionSheet = null;

function getSharedSheets() {
  if (typeof CSSStyleSheet !== "undefined" && typeof document !== "undefined") {
    if (!sharedResetSheet) {
      sharedResetSheet = new CSSStyleSheet();
      sharedResetSheet.replaceSync(UA_RESET_CSS);
    }
    if (!sharedNoMotionSheet) {
      sharedNoMotionSheet = new CSSStyleSheet();
      sharedNoMotionSheet.replaceSync(NO_MOTION_CSS);
    }
    return [sharedResetSheet, sharedNoMotionSheet];
  }
  return null;
}

export function attachStyles(shadowRoot, componentCssText = "") {
  if (!shadowRoot) return;

  const sheets = getSharedSheets();
  if (sheets && shadowRoot.adoptedStyleSheets) {
    const compSheet = new CSSStyleSheet();
    compSheet.replaceSync(componentCssText);
    shadowRoot.adoptedStyleSheets = [...sheets, compSheet];
  } else {
    // Fallback for environments without adoptedStyleSheets
    const styleEl = document.createElement("style");
    styleEl.textContent = `${UA_RESET_CSS}\n${NO_MOTION_CSS}\n${componentCssText}`;
    shadowRoot.appendChild(styleEl);
  }
}

export function createIcon(name, sizeClass = "") {
  return `<svg class="icon ${sizeClass}" width="16" height="16" aria-hidden="true"><use href="/icons.svg#${name}"></use></svg>`;
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
