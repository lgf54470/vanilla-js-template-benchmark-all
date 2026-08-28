import { initAppearance } from "./shared/lib/appearance.js";
import { router } from "./shared/core/router.js";
import "./app/shell/app-shell.js";

// 1. Initialize appearance
initAppearance();

// 2. Mount App Shell
const appContainer = document.getElementById("app");
if (appContainer) {
  appContainer.innerHTML = `<app-shell></app-shell>`;
}

// 3. Start Router
router.init();
