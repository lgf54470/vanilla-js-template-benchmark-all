import assert from "node:assert/strict";

Deno.test("ui: 验证 packages/ui (Base UI) 与全部组件、Shell 导入完整性 (模拟浏览器 W3C 规范)", async () => {
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

  // 1. Direct import @ui package
  const uiPackage = await import("@ui");
  assert.ok(uiPackage);

  // Check Base UI custom elements
  const expectedElements = [
    "ds-button",
    "ds-badge",
    "ds-card",
    "ds-input",
    "ds-textarea",
    "ds-select",
    "ds-checkbox",
    "ds-switch",
    "ds-separator",
    "ds-kbd",
    "ds-dialog",
    "ds-alert",
    "ds-sheet",
    "ds-popover",
    "ds-tooltip",
    "ds-dropdown-menu",
    "ds-toast",
    "ds-avatar",
    "ds-breadcrumb",
    "ds-empty-state",
    "ds-skeleton",
    "ds-tabs",
    "ds-accordion-item",
    "ds-collapsible",
    "ds-table",
    "ds-scroll-area",
    "ds-progress",
    "ds-spinner",
    "ds-pagination",
    "ds-segmented-control",
    "ds-masked-field",
    "ds-sidebar-provider",
    "ds-sidebar",
    "ds-sidebar-trigger",
    "ds-sidebar-menu-button",
    "ds-workspace-switcher",
    "ds-theme-switch",
    "ds-lang-switch",
    "ds-nav-user",
    "ds-appearance-sheet",
  ];
  for (const elName of expectedElements) {
    assert.ok(globalThis.customElements.get(elName), `Element <${elName}> should be registered`);
  }

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
