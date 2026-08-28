-- shared/core/migrations/0001_init.sql — 核心基础设施表（Database.md §1）
-- app_settings / core_workspaces / core_sessions。core_migrations 由迁移执行器自举。

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  is_encrypted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core_workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'folder',
  color_token TEXT NOT NULL DEFAULT 'zinc',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core_sessions (
  id TEXT PRIMARY KEY,
  issued_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  storage_kind TEXT NOT NULL CHECK (storage_kind IN ('persistent', 'session'))
);

CREATE INDEX IF NOT EXISTS idx_core_sessions_revoked ON core_sessions(revoked_at);
