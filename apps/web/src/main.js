import { initAppearance } from "./shared/lib/appearance.js";
import { router } from "./shared/core/router.js";
import { eventBus } from "./shared/core/event-bus.js";
import { isAuthenticated } from "./shared/auth/client-auth.js";
import "./shared/auth/login-page.js";
import "./app/shell/app-shell.js";

// 1. Initialize appearance
initAppearance();

const appContainer = document.getElementById("app");

function renderApp() {
  if (!appContainer) return;

  if (isAuthenticated()) {
    appContainer.innerHTML = `<app-shell></app-shell>`;
    router.init();
  } else {
    appContainer.innerHTML = `<login-page></login-page>`;
  }
}

// 2. Listen to Auth State Changes
eventBus.on("auth:changed", (e) => {
  if (e.detail?.authenticated) {
    renderApp();
  } else {
    renderApp();
  }
});

eventBus.on("auth:unauthorized", () => {
  renderApp();
});

// 3. Initial Mount
renderApp();
