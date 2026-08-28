/**
 * ds-nav-user — 侧栏底部用户菜单（docs/Components.md §5）。
 *
 * 触发器 = ds-avatar + 用户名 + ellipsis；下拉 = 菜单头（首字母头像方块 +
 * 用户名 + 次行掩码邮箱）→ 分隔线 → 设置/配置文件/用户资料 → 分隔线 →
 * 退出登录（--color-danger 结束态视觉）。
 *
 * - 属性：name、email（壳层已 maskValue 后下发；未配置显示「未绑定邮箱」占位）
 * - 事件：nav-user-navigate { href } / nav-user-logout（登出跳转由壳层处理）
 */
import { attachStyles, createIcon } from "../base.js";
import { t } from "../../i18n/translate.js";

const cssUrl = new URL("./nav-user.css", import.meta.url).href;

/** 导航项定义：href + i18n key + 兜底文案 */
const LINKS = [
  {
    href: "/settings",
    key: "nav.settings",
    fallback: "设置",
    icon: "settings",
  },
  {
    href: "/settings/profile",
    key: "nav.profile",
    fallback: "配置文件",
    icon: "user",
  },
  {
    href: "/settings/account",
    key: "nav.account",
    fallback: "用户资料",
    icon: "sliders-horizontal",
  },
];

class DsNavUser extends HTMLElement {
  static observedAttributes = ["name", "email"];

  #root;
  #triggerName;
  #headerName;
  #headerEmail;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <ds-dropdown-menu align="start" side="top">
        <button type="button" slot="trigger" part="trigger"
          aria-haspopup="menu"></button>
        <div part="menu-header"></div>
        <ds-dropdown-separator></ds-dropdown-separator>
      </ds-dropdown-menu>
    `;
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#buildTrigger();
    this.#buildMenu();
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  get name() {
    return this.getAttribute("name") ?? "";
  }

  set name(value) {
    this.setAttribute("name", String(value ?? ""));
  }

  get email() {
    return this.getAttribute("email") ?? "";
  }

  set email(value) {
    this.setAttribute("email", String(value ?? ""));
  }

  #buildTrigger() {
    const trigger = this.#root.querySelector('[slot="trigger"]');
    const avatar = document.createElement("ds-avatar");
    avatar.setAttribute("size", "sm");
    this.#triggerName = document.createElement("span");
    this.#triggerName.setAttribute("part", "trigger-name");
    trigger.append(avatar, this.#triggerName, createIcon("ellipsis"));
  }

  #buildMenu() {
    const menu = this.#root.querySelector("ds-dropdown-menu");

    // 菜单头：首字母头像方块 + 用户名 + 掩码邮箱
    const header = this.#root.querySelector('[part="menu-header"]');
    const headTile = document.createElement("span");
    headTile.setAttribute("part", "head-tile");
    const headText = document.createElement("div");
    headText.setAttribute("part", "head-text");
    this.#headerName = document.createElement("div");
    this.#headerName.setAttribute("part", "head-name");
    this.#headerEmail = document.createElement("div");
    this.#headerEmail.setAttribute("part", "head-email");
    headText.append(this.#headerName, this.#headerEmail);
    header.append(headTile, headText);

    // 导航项
    for (const link of LINKS) {
      const item = document.createElement("ds-dropdown-item");
      item.append(createIcon(link.icon));
      const label = document.createElement("span");
      label.textContent = t(link.key, link.fallback);
      item.append(label);
      item.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("nav-user-navigate", {
            detail: { href: link.href },
            bubbles: true,
            composed: true,
          }),
        );
      });
      menu.append(item);
    }

    // 分隔线 + 登出（结束态视觉：--color-danger，非强警示）
    menu.append(document.createElement("ds-dropdown-separator"));
    const logout = document.createElement("ds-dropdown-item");
    logout.setAttribute("part", "logout");
    logout.append(createIcon("log-out"));
    const logoutLabel = document.createElement("span");
    logoutLabel.textContent = t("nav.logout", "退出登录");
    logout.append(logoutLabel);
    logout.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("nav-user-logout", {
          bubbles: true,
          composed: true,
        }),
      );
    });
    menu.append(logout);
  }

  #render() {
    const name = this.name || t("nav.user", "用户");
    this.#triggerName.textContent = name;
    this.#root.querySelector('[slot="trigger"] ds-avatar')?.setAttribute(
      "name",
      name,
    );
    this.#headerName.textContent = name;
    this.#headerEmail.textContent = this.email ||
      t("nav.emailUnbound", "未绑定邮箱");
    const tile = this.#root.querySelector('[part="head-tile"]');
    tile.textContent = name.slice(0, 1).toUpperCase();
  }
}

customElements.define("ds-nav-user", DsNavUser);
