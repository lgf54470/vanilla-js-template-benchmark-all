/**
 * ds-workspace-switcher — 工作空间切换器（docs/Components.md §4）。
 *
 * 位于 <ds-sidebar-header>。触发器 = 当前工作空间磁贴 + 名称 + chevrons；
 * 下拉 = 「工作空间」标签 + 列表（磁贴 + 名称 + 当前项 circle-check 对勾）
 * + 分隔线 + 新建项（打开 ds-dialog 表单）。
 *
 * - items 走 property（数组）：[{ id, name, icon }]
 * - 选中项 → workspace-switcher-select { workspaceId } + event-bus 广播
 *   workspace:changed（Workspace.md 切换时序）
 * - Ctrl/Cmd+1..6 快捷切换前 6 个（document 级监听）
 * - 新建表单 → workspace-switcher-create { name, icon }（创建逻辑在壳层/模块）
 */
import { attachStyles, createIcon } from "../base.js";
import { t } from "../../i18n/translate.js";
import { emit } from "../../core/event-bus.js";

const cssUrl = new URL("./workspace-switcher.css", import.meta.url).href;

class DsWorkspaceSwitcher extends HTMLElement {
  static observedAttributes = ["current-id"];

  /** @type {Array<{id: string, name: string, icon?: string}>} */
  #items = [];
  #root;
  #triggerTile;
  #triggerName;
  #listHost;
  #dialog;
  #nameInput;
  #iconInput;
  #onKeydown;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <ds-dropdown-menu align="start" side="bottom">
        <button type="button" slot="trigger" part="trigger"
          aria-haspopup="menu"></button>
        <ds-dropdown-label></ds-dropdown-label>
        <div part="list"></div>
        <ds-dropdown-separator></ds-dropdown-separator>
        <ds-dropdown-item part="create"></ds-dropdown-item>
      </ds-dropdown-menu>
      <ds-dialog></ds-dialog>
    `;
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#buildTrigger();
    this.#buildMenu();
    this.#buildDialog();
    this.#onKeydown = (e) => this.#shortcut(e);
    document.addEventListener("keydown", this.#onKeydown);
    this.#render();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.#onKeydown);
  }

  attributeChangedCallback() {
    this.#render();
  }

  get items() {
    return this.#items;
  }

  set items(value) {
    this.#items = Array.isArray(value) ? value : [];
    this.#render();
  }

  get currentId() {
    return this.getAttribute("current-id") ?? "";
  }

  set currentId(value) {
    this.setAttribute("current-id", String(value));
  }

  #buildTrigger() {
    const trigger = this.#root.querySelector('[slot="trigger"]');
    this.#triggerTile = document.createElement("span");
    this.#triggerTile.setAttribute("part", "tile");
    this.#triggerName = document.createElement("span");
    this.#triggerName.setAttribute("part", "trigger-name");
    const chevron = createIcon("chevrons-up-down");
    trigger.append(this.#triggerTile, this.#triggerName, chevron);
  }

  #buildMenu() {
    const menu = this.#root.querySelector("ds-dropdown-menu");
    menu.querySelector("ds-dropdown-label").textContent = t(
      "sidebar.workspaces",
      "工作空间",
    );

    this.#listHost = this.#root.querySelector('[part="list"]');
    this.#listHost.setAttribute("role", "group");

    const create = this.#root.querySelector('[part="create"]');
    create.append(this.#tile("plus"), document.createElement("span"));
    create.querySelector("span").textContent = t(
      "workspace.create",
      "新建工作空间",
    );
    create.addEventListener("click", () => {
      this.#nameInput.value = "";
      this.#iconInput.value = "";
      this.#dialog.setAttribute("open", "");
    });
  }

  #buildDialog() {
    this.#dialog = this.#root.querySelector("ds-dialog");
    this.#dialog.setAttribute(
      "title",
      t("workspace.create", "新建工作空间"),
    );

    const nameInput = document.createElement("ds-input");
    nameInput.setAttribute("label", t("workspace.name", "名称"));
    nameInput.setAttribute("placeholder", t("workspace.nameHint", "必填"));
    const iconInput = document.createElement("ds-input");
    iconInput.setAttribute("label", t("workspace.icon", "图标"));
    iconInput.setAttribute("placeholder", "folder");

    const cancel = document.createElement("ds-button");
    cancel.setAttribute("variant", "outline");
    cancel.textContent = t("common.cancel", "取消");
    cancel.setAttribute("slot", "footer");
    cancel.addEventListener(
      "click",
      () => this.#dialog.removeAttribute("open"),
    );

    const submit = document.createElement("ds-button");
    submit.textContent = t("common.create", "创建");
    submit.setAttribute("slot", "footer");
    submit.addEventListener("click", () => {
      const name = this.#nameInput.value.trim();
      if (!name) {
        this.#nameInput.setAttribute("invalid", "");
        return;
      }
      this.#nameInput.removeAttribute("invalid");
      this.#dialog.removeAttribute("open");
      this.dispatchEvent(
        new CustomEvent("workspace-switcher-create", {
          detail: { name, icon: this.#iconInput.value.trim() || "folder" },
          bubbles: true,
          composed: true,
        }),
      );
    });

    this.#dialog.append(nameInput, iconInput, cancel, submit);
    this.#nameInput = nameInput;
    this.#iconInput = iconInput;
  }

  /** @param {string} icon @returns {HTMLElement} */
  #tile(icon) {
    const tile = document.createElement("span");
    tile.setAttribute("part", "tile");
    if (icon) tile.append(createIcon(icon));
    return tile;
  }

  #render() {
    // 触发器
    const current = this.#items.find((w) => w.id === this.currentId) ??
      this.#items[0];
    this.#triggerTile.replaceChildren();
    this.#triggerTile.append(createIcon(current?.icon ?? "home"));
    this.#triggerName.textContent = current?.name ?? "";

    // 列表
    this.#listHost.replaceChildren();
    for (const w of this.#items) {
      const item = document.createElement("ds-dropdown-item");
      item.dataset.shortcut = String(this.#items.indexOf(w) + 1);
      const name = document.createElement("span");
      name.setAttribute("part", "item-name");
      name.textContent = w.name;
      item.append(this.#tile(w.icon ?? "folder"), name);
      if (w.id === this.currentId) {
        const check = createIcon("circle-check");
        check.setAttribute("part", "check");
        item.append(check);
        item.setAttribute("aria-current", "true");
      }
      item.addEventListener("click", () => this.#select(w.id));
      this.#listHost.append(item);
    }
  }

  #select(workspaceId) {
    this.dispatchEvent(
      new CustomEvent("workspace-switcher-select", {
        detail: { workspaceId },
        bubbles: true,
        composed: true,
      }),
    );
    emit("workspace:changed", { workspaceId });
    this.currentId = workspaceId;
  }

  /** Ctrl/Cmd+1..6 切换前 6 个工作空间。 */
  #shortcut(e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const n = Number(e.key);
    if (!Number.isInteger(n) || n < 1 || n > 6) return;
    const target = this.#items[n - 1];
    if (target) {
      e.preventDefault();
      this.#select(target.id);
    }
  }
}

customElements.define("ds-workspace-switcher", DsWorkspaceSwitcher);
