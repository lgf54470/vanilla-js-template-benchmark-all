-- shared/workspace/migrations/0001_seed.sql — 6 个系统工作空间（Workspace.md §2）
-- INSERT OR IGNORE：可重复执行，不覆盖用户对系统工作空间的重命名/改图标。

INSERT OR IGNORE INTO core_workspaces
  (id, name, icon, color_token, sort_order, is_system, created_at, updated_at)
VALUES
  ('ws_default',       'i18n:workspace.seed.default',       'home',           'zinc', 0, 1, datetime('now'), datetime('now')),
  ('ws_work',          'i18n:workspace.seed.work',          'briefcase',      'zinc', 1, 1, datetime('now'), datetime('now')),
  ('ws_study',         'i18n:workspace.seed.study',         'graduation-cap', 'zinc', 2, 1, datetime('now'), datetime('now')),
  ('ws_life',          'i18n:workspace.seed.life',          'heart',          'zinc', 3, 1, datetime('now'), datetime('now')),
  ('ws_entertainment', 'i18n:workspace.seed.entertainment', 'gamepad-2',      'zinc', 4, 1, datetime('now'), datetime('now')),
  ('ws_travel',        'i18n:workspace.seed.travel',        'plane',          'zinc', 5, 1, datetime('now'), datetime('now'));
