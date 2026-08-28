// apps/web/src/modules/registry.generated.js — 由 scripts/generate-registry.js 生成，勿手改
// 侧栏/路由数据源（ARCHITECTURE.md §4.2）。新增模块：建目录 + module.json 后重跑
// `just generate:registry`。
export const moduleRegistry = [
  {
    "id": "dashboard",
    "order": 0,
    "icon": "layout-dashboard",
    "labelKey": "dashboard.menu.title",
    "route": "/dashboard",
  },
  {
    "id": "channels",
    "order": 10,
    "icon": "list-tree",
    "labelKey": "channels.menu.title",
    "route": "/channels",
  },
  {
    "id": "tokens",
    "order": 20,
    "icon": "key",
    "labelKey": "tokens.menu.title",
    "route": "/tokens",
  },
  {
    "id": "logs",
    "order": 30,
    "icon": "scroll-text",
    "labelKey": "logs.menu.title",
    "route": "/logs",
  },
  {
    "id": "system",
    "order": 40,
    "icon": "monitor",
    "labelKey": "system.menu.title",
    "route": "/system",
  },
  {
    "id": "docs",
    "order": 50,
    "icon": "book-open",
    "labelKey": "docs.menu.title",
    "route": "/docs",
  },
  {
    "id": "auth",
    "order": 60,
    "icon": "shield",
    "labelKey": "auth.menu.title",
    "route": "/auth",
  },
  {
    "id": "notes",
    "order": 70,
    "icon": "notebook-pen",
    "labelKey": "notes.menu.title",
    "route": "/notes",
    "submodules": [
      {
        "id": "all",
        "labelKey": "notes.menu.all",
        "route": "/notes/all",
      },
      {
        "id": "tags",
        "labelKey": "notes.menu.tags",
        "route": "/notes/tags",
      },
    ],
  },
  {
    "id": "settings",
    "order": 80,
    "icon": "settings",
    "labelKey": "settings.menu.title",
    "route": "/settings",
    "submodules": [
      {
        "id": "profile",
        "labelKey": "settings.menu.profile",
        "route": "/settings/profile",
      },
      {
        "id": "account",
        "labelKey": "settings.menu.account",
        "route": "/settings/account",
      },
    ],
  },
];
