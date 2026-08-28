-- auth 模块核心表：app_settings（全局键值）+ core_sessions（会话吊销）。
-- settings:auth 的密码哈希由首次登录/初始化流程写入（shared/auth/password.js 格式）。
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  is_encrypted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core_sessions (
  id TEXT PRIMARY KEY,
  issued_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  storage_kind TEXT NOT NULL CHECK (storage_kind IN ('persistent', 'session'))
);