// apps/web/src/shared/gallery.js — 组件画廊（dev 路由 /__dev/components，Components.md §1）
//
// 生产构建剔除。渲染 shared/ui 下全部组件的可交互示例，替代 Storybook。
// 样式只用语义/结构令牌（--color-* / --ds-* / --space-*），禁止硬编码字面量。

import "./ui/index.js";
import { confirmDialog, toast } from "./ui/index.js";

export function renderGallery(container) {
  container.innerHTML = `
  <style>
    .gallery{padding:2rem 2.5rem;color:var(--color-fg);max-width:60rem;margin:0 auto}
    .gallery h1{font-size:1.5rem;font-weight:700;margin-bottom:.25rem}
    .gallery .sub{color:var(--color-fg-muted);font-size:.85rem;margin-bottom:2rem}
    .sec{margin-bottom:2rem}
    .sec h2{font-size:1rem;font-weight:600;margin-bottom:.75rem;padding-bottom:.35rem;
      border-bottom:1px solid var(--color-border)}
    .row{display:flex;flex-wrap:wrap;gap:var(--space-4);align-items:center}
    .col{display:flex;flex-direction:column;gap:var(--space-3)}
    .label{font-size:.75rem;color:var(--color-fg-muted)}
  </style>
  <div class="gallery">
    <h1>组件画廊</h1>
    <div class="sub">/__dev/components — 开发模式专属，生产构建剔除</div>

    <section class="sec"><h2>Button</h2><div class="row">
      <ds-button variant="primary">Primary</ds-button>
      <ds-button variant="secondary">Secondary</ds-button>
      <ds-button variant="ghost">Ghost</ds-button>
      <ds-button variant="danger">Danger</ds-button>
      <ds-button variant="primary" icon="plus">带图标</ds-button>
      <ds-button disabled>Disabled</ds-button>
      <ds-icon-button icon="settings" aria-label="设置"></ds-icon-button>
      <ds-icon-button icon="bell" aria-label="通知"></ds-icon-button>
    </div></section>

    <section class="sec"><h2>输入</h2><div class="col" style="max-width:22rem">
      <ds-input placeholder="用户名" icon="user"></ds-input>
      <ds-input placeholder="搜索…" icon="search"></ds-input>
      <ds-textarea placeholder="多行文本"></ds-textarea>
      <ds-select placeholder="选择一个选项" value="b">
        <option value="a">选项 A</option>
        <option value="b">选项 B</option>
        <option value="c">选项 C</option>
      </ds-select>
    </div></section>

    <section class="sec"><h2>布尔输入</h2><div class="row">
      <ds-checkbox label="记住我" checked></ds-checkbox>
      <ds-checkbox label="订阅通知"></ds-checkbox>
      <ds-switch label="深色模式" checked></ds-switch>
      <ds-switch label="自动保存"></ds-switch>
    </div></section>

    <section class="sec"><h2>分段控件</h2><div class="col" style="max-width:20rem">
      <ds-segmented-control value="b">
        <ds-segmented-control-item value="a" label="A"></ds-segmented-control-item>
        <ds-segmented-control-item value="b" label="B"></ds-segmented-control-item>
        <ds-segmented-control-item value="c" label="C"></ds-segmented-control-item>
      </ds-segmented-control>
      <ds-segmented-control value="24h" grids="2x4">
        <ds-segmented-control-item value="4h" label="4 小时"></ds-segmented-control-item>
        <ds-segmented-control-item value="8h" label="8 小时"></ds-segmented-control-item>
        <ds-segmented-control-item value="12h" label="12 小时"></ds-segmented-control-item>
        <ds-segmented-control-item value="24h" label="24 小时"></ds-segmented-control-item>
        <ds-segmented-control-item value="7d" label="7 天"></ds-segmented-control-item>
        <ds-segmented-control-item value="14d" label="14 天"></ds-segmented-control-item>
        <ds-segmented-control-item value="30d" label="30 天"></ds-segmented-control-item>
        <ds-segmented-control-item value="90d" label="90 天"></ds-segmented-control-item>
      </ds-segmented-control>
    </div></section>

    <section class="sec"><h2>标签页</h2><div class="col" style="max-width:28rem">
      <ds-tabs value="overview">
        <ds-tab value="overview" label="概览">
          <div style="font-size:.85rem;color:var(--color-fg)">概览面板内容。</div>
        </ds-tab>
        <ds-tab value="detail" label="明细">
          <div style="font-size:.85rem;color:var(--color-fg-muted)">明细面板内容。</div>
        </ds-tab>
        <ds-tab value="logs" label="日志">
          <div style="font-size:.85rem;color:var(--color-fg-muted)">日志面板内容。</div>
        </ds-tab>
      </ds-tabs>
    </div></section>

    <section class="sec"><h2>展示</h2><div class="row">
      <ds-badge>默认</ds-badge>
      <ds-badge variant="success">成功</ds-badge>
      <ds-badge variant="warning">警告</ds-badge>
      <ds-badge variant="danger">危险</ds-badge>
      <ds-badge variant="outline">描边</ds-badge>
      <ds-avatar name="Buffy" size="36"></ds-avatar>
      <ds-avatar name="Code" size="36"></ds-avatar>
      <ds-skeleton width="12rem"></ds-skeleton>
    </div></section>

    <section class="sec"><h2>卡片与状态</h2><div class="row">
      <ds-card style="width:16rem">
        <span slot="header">标题</span>
        <div style="font-size:.85rem;color:var(--color-fg-muted)">卡片内容占位。</div>
        <span slot="footer"><ds-button variant="ghost" size="sm">查看详情</ds-button></span>
      </ds-card>
      <ds-empty-state icon="search" title="没有结果" description="换个关键词试试"></ds-empty-state>
      <ds-page-placeholder icon="sparkles" title="模块开发中" description="此模块尚未实现，占位展示。"></ds-page-placeholder>
    </div></section>

    <section class="sec"><h2>浮层</h2><div class="row">
      <ds-tooltip content="悬浮提示内容"><ds-button variant="secondary">Hover me</ds-button></ds-tooltip>
      <ds-button id="g-dialog-open" variant="secondary">打开对话框</ds-button>
      <ds-button id="g-confirm" variant="danger">危险确认</ds-button>
      <ds-button id="g-toast" variant="primary">Toast</ds-button>
      <ds-button id="g-sheet" variant="secondary">打开抽屉</ds-button>
      <ds-button id="g-dropdown" variant="secondary">下拉菜单</ds-button>
    </div>
    <ds-dialog id="g-dialog" title="对话框标题" description="这是 ds-dialog 的说明文字。Esc 或点击遮罩关闭。">
      <div style="font-size:.85rem">内容区…</div>
    </ds-dialog>
    <ds-sheet id="g-sheet-el" side="right"><div style="padding:1rem">抽屉内容</div></ds-sheet>
    </section>

    <section class="sec"><h2>掩码字段</h2><div class="col" style="max-width:22rem">
      <div class="row"><span class="label">邮箱</span><masked-field mask-type="email"></masked-field></div>
      <div class="row"><span class="label">手机</span><masked-field mask-type="phone"></masked-field></div>
      <div class="row"><span class="label">通用</span><masked-field mask-type="generic"></masked-field></div>
    </div></section>

    <section class="sec"><h2>主题控件</h2><div class="row">
      <ds-theme-switch value="system"></ds-theme-switch>
      <ds-lang-switch value="zh-CN"></ds-lang-switch>
      <ds-workspace-badge icon="home" name="默认工作空间"></ds-workspace-badge>
      <ds-breadcrumb><a href="#">根</a><span class="sep">/</span><a href="#" aria-current="page">当前页</a></ds-breadcrumb>
    </div></section>

    <section class="sec"><h2>Sidebar 组合演示</h2>
      <div style="border:1px solid var(--color-border);border-radius:var(--ds-card-radius);overflow:hidden;height:20rem">
      <ds-sidebar-provider defaultopen>
        <ds-sidebar variant="sidebar" collapsible="icon">
          <ds-sidebar-header>
            <ds-workspace-switcher value="ws_default"
              items='[{"id":"ws_default","name":"默认","icon":"home"},{"id":"ws_work","name":"工作","icon":"briefcase"}]'>
            </ds-workspace-switcher>
          </ds-sidebar-header>
          <ds-sidebar-content>
            <ds-sidebar-group>
              <ds-sidebar-group-label>菜单</ds-sidebar-group-label>
              <ds-sidebar-menu>
                <ds-sidebar-menu-item icon="layout-dashboard" label="仪表盘" route="/dashboard" title="仪表盘" isactive="true"></ds-sidebar-menu-item>
                <ds-sidebar-menu-item icon="notebook-pen" label="笔记" route="/notes" title="笔记"></ds-sidebar-menu-item>
                <ds-sidebar-menu-item icon="settings" label="设置" route="/settings" title="设置"></ds-sidebar-menu-item>
              </ds-sidebar-menu>
            </ds-sidebar-group>
          </ds-sidebar-content>
          <ds-sidebar-footer>
            <ds-nav-user name="Buffy" email="b***@e***.com"></ds-nav-user>
          </ds-sidebar-footer>
        </ds-sidebar>
      </ds-sidebar-provider>
      </div>
    </section>
  </div>`;

  // ---- 交互接线 ----
  const q = (s) => container.querySelector(s);

  // masked-field：property 注入明文
  container.querySelectorAll("masked-field").forEach((el, i) => {
    el.value = ["user@example.com", "13800001234", "SecretAPIKey123"][i];
  });

  q("#g-dialog-open").addEventListener("click", () => q("#g-dialog").show());
  q("#g-sheet").addEventListener("click", () => q("#g-sheet-el").show());
  q("#g-toast").addEventListener("click", () => {
    toast.info("这是一条 info 提示");
    setTimeout(() => toast.success("操作成功"), 400);
    setTimeout(() => toast.error("操作失败"), 800);
  });
  q("#g-confirm").addEventListener("click", async () => {
    const ok = await confirmDialog({
      title: "确认删除？",
      description: "此操作不可撤销，删除后数据无法恢复。",
      confirmLabel: "删除",
      danger: true,
    });
    toast.info(ok ? "已确认删除" : "已取消");
  });
  q("#g-dropdown").addEventListener("click", () => {
    toast.info("ds-dropdown-menu 请参考 NavUser / WorkspaceSwitcher 的下拉");
  });
}
