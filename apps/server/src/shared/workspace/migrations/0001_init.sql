-- core_workspaces DDL + 6 个系统工作空间种子（docs/Workspace.md §2）。
-- name 的 "i18n:" 前缀表示引用 i18n key；用户自建工作空间一律存字面量。
CREATE TABLE core_workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'folder',
  color_token TEXT NOT NULL DEFAULT 'zinc',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO core_workspaces (id, name, icon, color_token, sort_order, is_system, created_at, updated_at) VALUES
  ('ws_default',       'i18n:workspace.seed.default',       'home',           'zinc', 0, 1, datetime('now'), datetime('now')),
  ('ws_work',          'i18n:workspace.seed.work',          'briefcase',      'zinc', 1, 1, datetime('now'), datetime('now')),
  ('ws_study',         'i18n:workspace.seed.study',         'graduation-cap', 'zinc', 2, 1, datetime('now'), datetime('now')),
  ('ws_life',          'i18n:workspace.seed.life',          'heart',          'zinc', 3, 1, datetime('now'), datetime('now')),
  ('ws_entertainment', 'i18n:workspace.seed.entertainment', 'gamepad-2',      'zinc', 4, 1, datetime('now'), datetime('now')),
  ('ws_travel',        'i18n:workspace.seed.travel',        'plane',          'zinc', 5, 1, datetime('now'), datetime('now'));