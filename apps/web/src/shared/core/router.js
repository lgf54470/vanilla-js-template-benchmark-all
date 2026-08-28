import { eventBus } from "./event-bus.js";
import { moduleRegistry } from "./module-registry.js";

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

    // Handle initial route
    this._handleHashChange();
  }

  destroy() {
    if (typeof globalThis.window === "undefined") return;
    globalThis.window.removeEventListener("hashchange", this._handleHashChange);
  }

  getCurrentModuleId() {
    const hash = globalThis.window ? globalThis.window.location.hash : "";
    const clean = hash.replace(/^#\/?/, "").split("/")[0] || "";
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

    if (meta) {
      document.title = `${meta.title || meta.id} - vanilla-js-template`;
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
        console.error(`Failed to mount module ${moduleId}:`, err);
        mainContainer.innerHTML = `
          <ds-empty-state icon="alert-circle" title="模块加载失败" description="${err.message}">
            <ds-button onclick="window.location.reload()">重新加载</ds-button>
          </ds-empty-state>
        `;
      }
    } else {
      document.title = "404 - 未找到模块";
      mainContainer.innerHTML = `
        <ds-empty-state icon="help-circle" title="未找到页面" description="请求的模块 '${moduleId}' 不存在或未注册。">
          <ds-button onclick="window.location.hash = '#/dashboard'">返回首页</ds-button>
        </ds-empty-state>
      `;
    }

    eventBus.emit("router:navigated", {
      path: this.currentPath,
      moduleId,
      meta,
    });
  }
}

export const router = new Router();
