/**
 * apps/web/src/modules/components/index.js
 * Shadcn Base UI 组件库互动文档与实时测试看板
 */

import { COMPONENT_CATALOG, COMPONENT_CATEGORIES } from "./catalog.js";
import { getComponentDemo } from "./demos.js";
import { createIcon, toast } from "@ui";

export default function renderComponentsModule(container) {
  let activeCategory = "all";
  let searchQuery = "";

  // Parse active component from hash query
  const getActiveId = () => {
    const hash = globalThis.location?.hash || "";
    const match = hash.match(/[?&]c=([a-z0-9-]+)/);
    return match ? match[1] : "calendar";
  };

  let activeComponentId = getActiveId();

  const render = () => {
    const currentItem = COMPONENT_CATALOG.find((c) => c.id === activeComponentId) ||
      COMPONENT_CATALOG[0];
    const demo = getComponentDemo(currentItem.id);

    const filteredList = COMPONENT_CATALOG.filter((c) => {
      const matchCat = activeCategory === "all" || c.category === activeCategory;
      const matchQuery = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.zh.includes(searchQuery) || c.id.includes(searchQuery);
      return matchCat && matchQuery;
    });

    container.innerHTML = `
      <div class="components-page" style="display: flex; flex-direction: column; gap: var(--space-6); max-width: 72rem; margin: 0 auto; padding-bottom: var(--space-12);">
        <!-- 头部概览 -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-6);">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <h1 style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-fg); margin: 0;">${currentItem.name}</h1>
              <span style="font-size: var(--text-sm); color: var(--color-fg-muted); font-weight: 500;">(${currentItem.zh})</span>
              <ds-badge variant="secondary">Base UI</ds-badge>
            </div>
            <p style="font-size: var(--text-sm); color: var(--color-fg-muted); margin: 0; max-width: 42rem;">${currentItem.desc}</p>
          </div>

          <div style="display: flex; gap: var(--space-2);">
            <a href="${currentItem.docs}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-3); height: 2.25rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); background-color: var(--color-card); color: var(--color-fg); font-size: var(--text-sm); font-weight: 500;">
              ${createIcon("external-link")}
              <span>Shadcn 官方文档</span>
            </a>
          </div>
        </div>

        <!-- 筛选与组件列表栏 -->
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); flex-wrap: wrap;">
            <div style="display: flex; gap: var(--space-1); flex-wrap: wrap;">
              ${
      COMPONENT_CATEGORIES.map((cat) => `
                <button
                  type="button"
                  class="cat-btn"
                  data-cat="${cat.id}"
                  style="padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: 500; border: 1px solid ${
        activeCategory === cat.id ? "var(--color-primary)" : "var(--color-border)"
      }; background-color: ${
        activeCategory === cat.id ? "var(--color-primary)" : "var(--color-card)"
      }; color: ${
        activeCategory === cat.id ? "var(--color-primary-fg)" : "var(--color-fg)"
      }; cursor: pointer;"
                >
                  ${cat.label}
                </button>
              `).join("")
    }
            </div>

            <div style="width: 16rem;">
              <ds-input id="comp-search" placeholder="搜索 62 款组件..." value="${searchQuery}"></ds-input>
            </div>
          </div>

          <!-- 组件徽章列表 -->
          <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); padding: var(--space-3); border-radius: var(--radius-lg); background-color: var(--color-muted); max-height: 8.5rem; overflow-y: auto;">
            ${
      filteredList.map((item) => `
              <button
                type="button"
                class="comp-badge-btn"
                data-id="${item.id}"
                style="display: inline-flex; align-items: center; gap: var(--space-1); padding: 0.25rem 0.625rem; border-radius: var(--radius-md); font-size: var(--text-xs); font-weight: 500; border: 1px solid ${
        activeComponentId === item.id ? "var(--color-primary)" : "transparent"
      }; background-color: ${
        activeComponentId === item.id ? "var(--color-card)" : "transparent"
      }; color: var(--color-fg); cursor: pointer;"
              >
                <span>${item.name}</span>
              </button>
            `).join("")
    }
          </div>
        </div>

        <!-- 实时交互预览卡片 -->
        <div style="border-radius: var(--radius-xl); border: 1px solid var(--color-border); background-color: var(--color-card); overflow: hidden; box-shadow: var(--shadow-sm);">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); background-color: var(--color-muted);">
            <div style="display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">
              ${createIcon("play")}
              <span>实时交互演示 (Live Preview)</span>
            </div>
            <ds-badge variant="outline">Native Web Component</ds-badge>
          </div>

          <div id="demo-canvas" style="padding: var(--space-12) var(--space-6); min-height: 16rem; display: flex; align-items: center; justify-content: center; background-color: var(--color-bg);"></div>
        </div>

        <!-- 代码示例与规范 -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: var(--space-4);">
          <!-- 代码示例 -->
          <div style="border-radius: var(--radius-xl); border: 1px solid var(--color-border); background-color: var(--color-card); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: var(--text-sm); font-weight: 600;">HTML / 使用示例</span>
              <button type="button" id="btn-copy-code" style="display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--text-xs); color: var(--color-primary); cursor: pointer; border: none; background: transparent;">
                ${createIcon("copy")}
                <span>复制</span>
              </button>
            </div>
            <pre style="margin: 0; padding: var(--space-3); background-color: var(--color-muted); border-radius: var(--radius-md); font-family: monospace; font-size: var(--text-xs); overflow-x: auto; color: var(--color-fg);"><code>${demo.code}</code></pre>
          </div>

          <!-- 插槽与结构 -->
          <div style="border-radius: var(--radius-xl); border: 1px solid var(--color-border); background-color: var(--color-card); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2);">
            <span style="font-size: var(--text-sm); font-weight: 600;">标准插槽与语义 (data-slot)</span>
            <div style="padding: var(--space-3); background-color: var(--color-muted); border-radius: var(--radius-md); font-family: monospace; font-size: var(--text-xs); color: var(--color-fg-muted); line-height: 1.5;">
              ${demo.slots}
            </div>
          </div>
        </div>
      </div>
    `;

    // Render demo into canvas
    const canvas = container.querySelector("#demo-canvas");
    if (canvas && demo.render) {
      demo.render(canvas);
    }

    // Bind event handlers
    container.querySelectorAll(".cat-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.getAttribute("data-cat");
        render();
      });
    });

    container.querySelectorAll(".comp-badge-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeComponentId = btn.getAttribute("data-id");
        if (globalThis.location) globalThis.location.hash = `#/components?c=${activeComponentId}`;
        render();
      });
    });

    const searchInp = container.querySelector("#comp-search");
    searchInp?.addEventListener("ds-input", (e) => {
      searchQuery = e.detail.value;
      render();
    });

    container.querySelector("#btn-copy-code")?.addEventListener("click", () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(demo.code);
        toast.success("示例代码已复制到剪贴板");
      }
    });
  };

  render();

  const onHashChange = () => {
    const newId = getActiveId();
    if (newId !== activeComponentId) {
      activeComponentId = newId;
      render();
    }
  };

  globalThis.addEventListener("hashchange", onHashChange);
  return () => globalThis.removeEventListener("hashchange", onHashChange);
}
