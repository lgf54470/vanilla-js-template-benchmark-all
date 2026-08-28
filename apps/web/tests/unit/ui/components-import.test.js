import assert from "node:assert/strict";

Deno.test("ui: 验证全部 UI 组件、Shell 与模块导入完整性 (模拟浏览器 W3C 规范)", async () => {
  if (typeof globalThis.window === "undefined") {
    globalThis.window = {
      location: { hash: "", reload: () => {} },
      addEventListener: () => {},
      removeEventListener: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    };
  }
  if (typeof globalThis.document === "undefined") {
    globalThis.document = {
      createElement: () => ({
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        style: { setProperty: () => {} },
      }),
      documentElement: {
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        setAttribute: () => {},
        style: { setProperty: () => {} },
      },
      body: {
        classList: { add: () => {}, remove: () => {}, contains: () => false },
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelectorAll: () => [],
      querySelector: () => null,
      getElementById: () => null,
    };
  }
  if (typeof globalThis.customElements === "undefined") {
    const nameMap = new Map();
    const constructorSet = new Set();
    globalThis.customElements = {
      define: (name, constructor) => {
        if (nameMap.has(name)) {
          throw new Error(`CustomElementRegistry: '${name}' has already been defined`);
        }
        if (constructorSet.has(constructor)) {
          throw new Error(
            "CustomElementRegistry: this constructor has already been used with this registry",
          );
        }
        nameMap.set(name, constructor);
        constructorSet.add(constructor);
      },
      get: (name) => nameMap.get(name),
    };
  }
  if (typeof globalThis.HTMLElement === "undefined") {
    globalThis.HTMLElement = class {
      constructor() {
        this.shadowRoot = {
          innerHTML: "",
          appendChild: () => {},
          querySelector: () => null,
          querySelectorAll: () => [],
        };
      }
      attachShadow() {
        return this.shadowRoot;
      }
      getAttribute() {
        return null;
      }
      setAttribute() {}
      removeAttribute() {}
      hasAttribute() {
        return false;
      }
      addEventListener() {}
      removeEventListener() {}
      dispatchEvent() {
        return true;
      }
      closest() {
        return null;
      }
      querySelector() {
        return null;
      }
      querySelectorAll() {
        return [];
      }
    };
  }

  // 1. Import UI components
  const uiModule = await import("../../../src/shared/ui/index.js");
  assert.ok(uiModule);

  // 2. Import Shell and Shell helpers
  const resizeHandleModule = await import("../../../src/app/shell/resize-handle.js");
  assert.ok(typeof resizeHandleModule.initSidebarResize === "function");
  assert.ok(typeof resizeHandleModule.initResizeHandle === "function");

  const appShellModule = await import("../../../src/app/shell/app-shell.js");
  assert.ok(appShellModule);
  assert.ok(globalThis.customElements.get("app-shell"));

  // 3. Import all modules
  const modules = [
    "analytics",
    "appearance",
    "bookmarks",
    "dashboard",
    "notes",
    "passwords",
    "settings",
    "todo",
    "workspace",
  ];
  for (const modName of modules) {
    const mod = await import(`../../../src/modules/${modName}/index.js`);
    assert.ok(mod, `Module ${modName} import failed`);
  }
});
