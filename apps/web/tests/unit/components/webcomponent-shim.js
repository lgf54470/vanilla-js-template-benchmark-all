// apps/web/tests/unit/components/webcomponent-shim.js — 极简 Web Components 运行时桩
//
// 供**组件行为单测**在零依赖 Deno 下实例化真实组件类：提供 HTMLElement /
// customElements / CSSStyleSheet / MutationObserver / document + 轻量 shadow。
// 只覆盖组件逻辑侧调用面（不渲染像素、不解析 innerHTML 成 DOM），跑完 restore。
// 组件像素与真实浏览器行为仍由 M3 的 CDP 冒烟（scripts/e2e）在 Chrome 里验证。

class CssStyleSheet {
  replaceSync(text) {
    this._text = text;
  }
}

class MutationObserver {
  constructor(cb) {
    this._cb = cb;
  }
  observe(target, options) {
    this._target = target;
    this._options = options;
  }
  disconnect() {
    this._target = null;
  }
}

function makeClassList() {
  const s = new Set();
  return {
    _s: s,
    add: (...cs) => cs.forEach((c) => s.add(c)),
    remove: (...cs) => cs.forEach((c) => s.delete(c)),
    toggle: (c, force) =>
      force
        ? (s.add(c), true)
        : (s.has(c) ? (s.delete(c), false) : (s.add(c), true)),
    contains: (c) => s.has(c),
    [Symbol.iterator]() {
      return s[Symbol.iterator]();
    },
  };
}

class ShadowRoot {
  constructor() {
    this.adoptedStyleSheets = [];
    this._listeners = {};
    this._tablist = null;
    this._buttons = [];
    this._panel = null;
  }
  set innerHTML(markup) {
    // 足够组件 render 用：重建 tablist/panel 骨架，清空按钮
    this._tablist = makeTablist();
    if (markup.includes('class="panel"')) this._panel = new El("div");
    this._buttons = [];
  }
  querySelector(sel) {
    if (sel === ".tablist") return this._tablist;
    if (sel === ".panel") return this._panel;
    return null;
  }
  querySelectorAll(sel) {
    return sel === ".tab" ? this._buttons : [];
  }
  addEventListener(type, fn) {
    (this._listeners[type] ??= new Set()).add(fn);
  }
  fire(type, ev) {
    for (const fn of [...(this._listeners[type] ?? [])]) fn(ev);
  }
}

function makeTablist() {
  const t = {
    children: [],
    _buttons: [],
    set innerHTML(_v) {
      this.children = [];
      this._buttons = [];
    },
    append(el) {
      this.children.push(el);
      this._buttons.push(el);
    },
    querySelectorAll(sel) {
      return sel === ".tab" ? this._buttons : [];
    },
    setAttribute() {},
    getAttribute() {
      return null;
    },
    removeAttribute() {},
  };
  return t;
}

class El {
  constructor(tag = "div") {
    this.tagName = String(tag || "div").toUpperCase();
    this._attrs = {};
    this.dataset = {};
    this.classList = makeClassList();
    this.children = [];
    this._listeners = {};
    this.style = {
      _p: {},
      setProperty(k, v) {
        this._p[k] = v;
      },
      getPropertyValue(k) {
        return this._p[k] ?? "";
      },
    };
    this._text = "";
    this.tabIndex = -1;
    this.hidden = false;
  }
  setAttribute(k, v) {
    this._attrs[k] = String(v);
  }
  getAttribute(k) {
    return this._attrs[k] ?? null;
  }
  hasAttribute(k) {
    return k in this._attrs;
  }
  removeAttribute(k) {
    delete this._attrs[k];
  }
  addEventListener(type, fn) {
    (this._listeners[type] ??= new Set()).add(fn);
  }
  removeEventListener(type, fn) {
    this._listeners[type]?.delete(fn);
  }
  dispatchEvent(ev) {
    for (const fn of [...(this._listeners[ev.type] ?? [])]) fn.call(this, ev);
    return true;
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  attachShadow() {
    this.shadowRoot = new ShadowRoot();
    return this.shadowRoot;
  }
  focus() {}
  get className() {
    return this.getAttribute("class") ?? "";
  }
  set className(v) {
    this.setAttribute("class", v);
  }
  get textContent() {
    return this._text;
  }
  set textContent(v) {
    this._text = String(v);
  }
}

/** 挂 Web Components 全局并返回 restore 函数。 */
export function installWebComponentGlobals() {
  const saved = {};
  for (
    const k of [
      "HTMLElement",
      "customElements",
      "CSSStyleSheet",
      "MutationObserver",
      "document",
    ]
  ) {
    saved[k] = globalThis[k];
  }
  globalThis.HTMLElement = El;
  const registry = new Map();
  globalThis.customElements = {
    define(name, Ctor) {
      if (!registry.has(name)) registry.set(name, Ctor);
    },
    get(name) {
      return registry.get(name);
    },
  };
  globalThis.CSSStyleSheet = CssStyleSheet;
  globalThis.MutationObserver = MutationObserver;
  globalThis.document = {
    createElement: (t) => new El(t),
    createElementNS: (_ns, t) => new El(t),
    documentElement: new El("html"),
    defaultView: globalThis,
  };

  return () => {
    for (const k of Object.keys(saved)) {
      if (saved[k] === undefined) delete globalThis[k];
      else globalThis[k] = saved[k];
    }
  };
}

export { El };
