// apps/web/tests/unit/lib/dom-shim.js — 极简 DOM 桩（零依赖，docs/Testing.md §7 思路）
//
// 只覆盖 shared/lib 纯逻辑测试需要的表面：
//   - 元素：attrs/dataset/classList/style.setProperty/append/addEventListener/
//     removeEventListener/getClientRects
//   - document：documentElement / head / createElement / createElementNS / defaultView
//   - 环境：getComputedStyle / matchMedia / localStorage
// installDomShim(opts) 挂到 globalThis，返回 () => restore。组件像素渲染不测，
// 不做完整 DOM/CSS（那部分由 M3/M4 的 CDP 冒烟在真实浏览器验证）。

/** 极简元素桩（可作 SVG 与 HTML 通用） */
class El {
  constructor(tag = "div") {
    this.tagName = String(tag).toUpperCase();
    /** @type {Record<string,string>} */
    this.attrs = {};
    this.dataset = {};
    /** Set 语义的 classList：add/remove/toggle/contains + 可迭代 */
    this.classList = {
      _s: new Set(),
      add: (...cs) => cs.forEach((c) => this.classList._s.add(c)),
      remove: (...cs) => cs.forEach((c) => this.classList._s.delete(c)),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._s.has(c)) {
            this.classList._s.delete(c);
            return false;
          }
          this.classList._s.add(c);
          return true;
        }
        return force ? (this.classList._s.add(c), true) : (
          (this.classList._s.delete(c), false)
        );
      },
      contains: (c) => this.classList._s.has(c),
      [Symbol.iterator]() {
        return this._s[Symbol.iterator]();
      },
    };
    this.style = {
      _props: {},
      setProperty(k, v) {
        this._props[k] = v;
      },
      getPropertyValue(k) {
        return this._props[k] ?? "";
      },
    };
    this.children = [];
    /** @type {Record<string,Set<Function>>} */
    this._listeners = {};
  }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
  }
  getAttribute(k) {
    return this.attrs[k] ?? null;
  }
  // 常见反射属性：.rel/.href/.id 同时写入 attrs，使 getAttribute 一致
  get rel() {
    return this.attrs.rel ?? null;
  }
  set rel(v) {
    this.attrs.rel = v;
  }
  get href() {
    return this.attrs.href ?? null;
  }
  set href(v) {
    this.attrs.href = v;
  }
  get id() {
    return this.attrs.id ?? null;
  }
  set id(v) {
    this.attrs.id = v;
  }
  addEventListener(t, fn) {
    (this._listeners[t] ??= new Set()).add(fn);
  }
  removeEventListener(t, fn) {
    this._listeners[t]?.delete(fn);
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  getClientRects() {
    return { length: 0 };
  }
}

/**
 * 挂载 DOM 桩。opts:
 *   { store?: {theme?:string}, darkMedia?:boolean, visible?:boolean }
 * @returns {() => void} 恢复函数
 */
export function installDomShim(
  { store = {}, darkMedia = false } = {},
) {
  // localStorage 内存实现
  const memory = new Map(Object.entries(store));
  const localStorage = {
    items: memory,
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
  };

  const documentElement = new El("html");
  const head = new El("head");
  // window：appearance 经 doc.defaultView 取 matchMedia
  const window = {
    matchMedia: (q) => ({
      matches: darkMedia,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  };
  const document = {
    documentElement,
    head,
    createElement: (t) => new El(t),
    createElementNS: (_ns, t) => new El(t),
    defaultView: window,
  };

  // 注意：Deno 测试环境的 globalThis.localStorage 是虚拟化的，赋值会被忽略；
  // 需要 localStorage 注入的模块（如 appearance.createAppearance）必须显式传
  // 返回的 storage/door。这里仍 best-effort 设置，供不涉及 storage 的模块。
  const saved = {
    document: globalThis.document,
    localStorage: globalThis.localStorage,
    getComputedStyle: globalThis.getComputedStyle,
    matchMedia: globalThis.matchMedia,
  };
  globalThis.document = document;
  try {
    globalThis.localStorage = localStorage;
  } catch {
    // Deno 虚拟 storage 不可覆写时忽略
  }
  globalThis.getComputedStyle = () => ({ transitionDuration: "0s" });
  globalThis.matchMedia = (q) => ({
    matches: darkMedia,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  });

  return {
    document,
    documentElement,
    storage: localStorage,
    window,
    restore: () => {
      globalThis.document = saved.document;
      try {
        globalThis.localStorage = saved.localStorage;
      } catch {
        // 同上
      }
      globalThis.getComputedStyle = saved.getComputedStyle;
      globalThis.matchMedia = saved.matchMedia;
    },
  };
}

export { El };
