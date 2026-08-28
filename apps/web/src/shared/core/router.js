import { eventBus } from "./event-bus.js";
import { moduleRegistry } from "./module-registry.js";
import { t } from "../lib/i18n.js";

class Router {
  constructor() {
    this.currentPath = "";
    this.currentModuleId = "";
    this.currentInstance = null;
    this._handleHashChange = this._handleHashChange.bind(this);
  }

  init() {
    if (typeof globalThis.window === "undefined") return;

    globalThis.window.addEventListener("hashchange", this._handleHashChange);
    eventBus.on("router:navigate", (e) => {
      this.navigate(e.detail.path);
    });
    eventBus.on("locale:changed", () => {
      this._handleHashChange();
    });

    // Handle initial route
    this._handleHashChange();
  }

  destroy() {
    if (typeof globalThis.window === "undefined") return;
    globalThis.window.removeEventListener("hashchange", this._handleHashChange);
  }

  getCurrentModuleId() {
    const hash = globalThis.window ? globalThis.window.location.hash : "";
    const clean = hash.replace(/^#\/?/, "").split("?")[0].split("/")[0] || "";
    return clean || "dashboard";
  }

  navigate(path) {
    if (typeof globalThis.window === "undefined") return;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    globalThis.window.location.hash = `#${cleanPath}`;
  }

  async _handleHashChange() {
    const moduleId = this.getCurrentModuleId();
    this.currentPath = globalThis.window
      ? globalThis.window.location.hash.replace(/^#/, "")
      : `/${moduleId}`;

    const mainContainer = document.getElementById("main-content");
    if (!mainContainer) return;

    // 1. Unmount previous module
    if (this.currentInstance && typeof this.currentInstance.unmount === "function") {
      try {
        await this.currentInstance.unmount();
      } catch (err) {
        console.error("Error unmounting module:", err);
      }
    }
    this.currentInstance = null;
    mainContainer.innerHTML = "";

    // 2. Load target module
    const meta = moduleRegistry.getModule(moduleId);
    this.currentModuleId = moduleId;

    // Scroll <main> strictly to top
    mainContainer.scrollTop = 0;

    const moduleTitle = t(`modules.${moduleId}`) || meta?.title || moduleId;

    if (meta) {
      document.title = `${moduleTitle} - vanilla-js-template`;
      try {
        const instance = await moduleRegistry.loadModule(moduleId);
        this.currentInstance = instance;
        if (instance && typeof instance.mount === "function") {
          await instance.mount(mainContainer, {
            moduleId,
            meta,
            workspaceId: localStorage.getItem("current_workspace_id") || "ws_default",
          });
        }
      } catch (err) {
        console.error(`Failed to load module ${moduleId}:`, err);
        mainContainer.innerHTML = `
          <ds-empty-state icon="alert-circle" title="${
          t("common.error")
        }" description="${err.message}">
            <ds-button onclick="window.location.reload()">${t("common.retry")}</ds-button>
          </ds-empty-state>
        `;
      }
    } else {
      document.title = "404 - Not Found";
      mainContainer.innerHTML = `
        <ds-empty-state icon="help-circle" title="404" description="Module '${moduleId}' not found.">
          <ds-button onclick="window.location.hash = '#/dashboard'">${
        t("common.backToHome")
      }</ds-button>
        </ds-empty-state>
      `;
    }

    eventBus.emit("router:navigated", {
      path: this.currentPath,
      moduleId,
      meta: { ...meta, title: moduleTitle },
    });
  }
}

export const router = new Router();
