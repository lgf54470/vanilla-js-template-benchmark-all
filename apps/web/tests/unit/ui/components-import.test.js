import assert from "node:assert/strict";

Deno.test("ui: 验证全部 UI 组件导入与 Custom Elements 注册完整性 (模拟标准浏览器规范)", async () => {
  // Mock browser globals strictly matching W3C CustomElementRegistry specification
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
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelectorAll: () => [],
      querySelector: () => null,
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
    };
  }

  // Import full UI index
  const uiModule = await import("../../../src/shared/ui/index.js");
  assert.ok(uiModule);

  // Check critical elements registered
  assert.ok(globalThis.customElements.get("ds-button"));
  assert.ok(globalThis.customElements.get("ds-icon-button"));
  assert.ok(globalThis.customElements.get("ds-input"));
  assert.ok(globalThis.customElements.get("ds-select"));
  assert.ok(globalThis.customElements.get("ds-checkbox"));
  assert.ok(globalThis.customElements.get("ds-theme-switch"));
  assert.ok(globalThis.customElements.get("ds-lang-switch"));
  assert.ok(globalThis.customElements.get("ds-appearance-sheet"));
  assert.ok(globalThis.customElements.get("ds-sidebar-provider"));
  assert.ok(globalThis.customElements.get("ds-sidebar"));
  assert.ok(globalThis.customElements.get("ds-workspace-switcher"));
  assert.ok(globalThis.customElements.get("ds-nav-user"));
  assert.ok(globalThis.customElements.get("ds-dialog"));
  assert.ok(globalThis.customElements.get("ds-sheet"));
  assert.ok(globalThis.customElements.get("ds-toast"));
  assert.ok(globalThis.customElements.get("ds-dropdown-menu"));
});
