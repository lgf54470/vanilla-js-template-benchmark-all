-- modules/notes/migrations/0001_init.sql — 笔记表（Database.md §1 业务表）
-- 表名 notes_note 遵循 <module>_<name> 约定；所有业务表必须带 workspace_id
-- 并经 createScopedRepository(...).forWorkspace(id) 访问（Workspace.md §3）。

CREATE TABLE IF NOT EXISTS notes_note (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tag TEXT NOT NULL DEFAULT '',
  is_pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_note_workspace
  ON notes_note(workspace_id, updated_at DESC);
