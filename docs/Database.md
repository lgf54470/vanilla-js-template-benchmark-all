# Database.md — 数据库设计规范

对应
[`ARCHITECTURE.md §9`](../ARCHITECTURE.md#9-数据库架构)。工作空间隔离的封装器
API 与切换时序见 `Workspace.md`；本文件聚焦
schema、迁移、适配器、查询优化与加密。

## 1. 三类表

| 类别           | 命名                   | 说明                                     |
| -------------- | ---------------------- | ---------------------------------------- |
| 全局配置       | `app_settings`（单表） | 键值对，key 命名空间化                   |
| 核心基础设施表 | `core_*`               | 跨模块，不属于任何单一 sidebar 模块      |
| 业务模块表     | `[module]_xxx`         | 必须带 `workspace_id`（`core_*` 表除外） |

### 1.1 `app_settings`

```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,          -- JSON 字符串
  is_encrypted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
```

key
命名空间约定：`settings:profile`、`settings:display`、`settings:auth`、`settings:workspace`、`accounts:webdav`、`accounts:<provider>`。命名空间前缀决定读写该
key 的模块归属（`settings:*` 归 settings 模块，`accounts:*`
归对应集成模块），跨模块读取 `app_settings` 的其他 key 视同跨模块耦合，同样受
`check-module-boundaries.js` 约束——**只有 `shared/core` 提供的
`getSetting(key)`/`setSetting(key, value)`
封装可以被任意模块调用，模块不得直接拼 SQL 查 `app_settings` 表**。

### 1.2 `core_workspaces`

完整 DDL 见
[`ARCHITECTURE.md §9.3`](../ARCHITECTURE.md#9-数据库架构)；种子数据与切换机制见
`Workspace.md`。

### 1.3 `core_sessions`（会话吊销表，本文档新增细化）

```sql
CREATE TABLE core_sessions (
  id TEXT PRIMARY KEY,             -- 会话令牌的 jti（随机 id，不是令牌本身）
  issued_at TEXT NOT NULL,
  expires_at TEXT,                 -- NULL 表示"保持登录直到下次浏览器打开"类会话，靠客户端存储生命周期而非服务端过期
  revoked_at TEXT,
  storage_kind TEXT NOT NULL CHECK (storage_kind IN ('persistent', 'session'))
);
```

用途：支持"退出登录"主动使某个令牌失效（仅靠 HMAC 签名+exp
无法做到主动吊销，必须有一张表记录
`revoked_at`）。校验中间件每次请求需要查这张表——是**每请求必读的热数据**，因此按
`id` 主键点查天然 O(1)，且结果应进入 §5 的进程内缓存（短 TTL，如
30s，用吊销延迟换取避免每请求打数据库）。

### 1.4 业务模块表模板

```sql
CREATE TABLE <module>_<entity> (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES core_workspaces(id),
  -- ...业务列...
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_<module>_<entity>_workspace ON <module>_<entity>(workspace_id, updated_at DESC);
```

任何额外的高频查询列（如按 `status` 过滤）需要建 `(workspace_id, status, ...)`
复合索引，`workspace_id`
必须是复合索引的**第一列**，保证"先按工作空间收窄，再按其他条件过滤"的执行计划。

## 2. 迁移系统

- 每模块自带 `migrations/000N_<slug>.sql`，编号在模块内自增（不是全局自增）。
- 迁移执行记录表：

```sql
CREATE TABLE core_migrations (
  module TEXT NOT NULL,
  version INTEGER NOT NULL,
  applied_at TEXT NOT NULL,
  PRIMARY KEY (module, version)
);
```

- `just db-migrate` 扫描所有 `modules/*/migrations/*.sql`，按
  `(module, version)` 与 `core_migrations`
  比对，未应用的按文件名数字序执行，单事务内完成"执行 SQL + 写入 core_migrations
  记录"，任一失败整体回滚。
- 迁移文件**只增不改**：已合并到主分支的迁移文件禁止再编辑，需要修正就新增一个后续迁移。

## 3. 适配器契约与选择矩阵

契约定义、`DEPLOY_TARGET` 到具体适配器的选择矩阵见
[`ARCHITECTURE.md §9.2`](../ARCHITECTURE.md#9-数据库架构)。三个实现文件：

```
apps/server/src/shared/db/
├── adapter.js       # JSDoc 契约（无实现）
├── sqlite.adapter.js
├── d1.adapter.js
├── turso.adapter.js
└── resolve.js        # 按 DEPLOY_TARGET 选择上面某一个
```

三个实现对外暴露完全一致的
`{ query, execute, transaction }`，业务代码（`repository.js`）不感知底层是哪一个——这是"同一套
repository 代码无需修改即可在四个平台运行"的关键。

## 4. 查询优化

### 4.1 Keyset 分页（禁止 `OFFSET`）

```js
// repository.js
async function listPage(db, workspaceId, { cursor, limit = 20 }) {
  const params = cursor ? [workspaceId, cursor.updatedAt, cursor.id, limit] : [workspaceId, limit];
  const sql = cursor
    ? `SELECT * FROM notes_data WHERE workspace_id = ? AND (updated_at, id) < (?, ?) ORDER BY updated_at DESC, id DESC LIMIT ?`
    : `SELECT * FROM notes_data WHERE workspace_id = ? ORDER BY updated_at DESC, id DESC LIMIT ?`;
  return db.query(sql, params);
}
```

### 4.2 批量 `IN` 查询（仍是参数化，不是拼接值）

```js
function buildInClause(ids) {
  return { placeholders: ids.map(() => "?").join(","), params: ids };
}
const { placeholders, params } = buildInClause(ids);
await db.query(
  `SELECT * FROM notes_data WHERE workspace_id = ? AND id IN (${placeholders})`,
  [workspaceId, ...params],
);
```

`placeholders` 只由代码生成的 `?`
序列拼接，**值**始终通过参数数组传递，因此不违反"禁止字符串拼接
SQL"规则（该规则针对值拼接，不针对占位符数量的结构性生成）。

## 5. 加密与掩码

### 5.1 敏感字段清单

邮箱、姓名、性别、年龄、地址、电话、用户名、密码、大模型 API
Key、Token、数据库账户/密码。

### 5.2 加密实现

```js
// shared/crypto/field-crypto.js
export async function encryptField(plaintext, keyMaterial) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importKey(keyMaterial);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return base64Encode(concatBytes(iv, new Uint8Array(cipher)));
}
export async function decryptField(payload, keyMaterial) {
  const bytes = base64Decode(payload);
  const iv = bytes.slice(0, 12);
  const key = await importKey(keyMaterial);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    bytes.slice(12),
  );
  return new TextDecoder().decode(plain);
}
```

`keyMaterial` 来自平台机密 `APP_ENCRYPTION_KEY`（见
`Deployment.md §环境变量`），repository
层的读写辅助函数（`insertWithEncryption`/`selectWithDecryption`）根据每张表的"敏感列清单"（模块自己在
`repository.js` 顶部声明
`const ENCRYPTED_COLUMNS = ['email', 'phone']`）自动加解密，业务 service
层不直接接触加解密逻辑。

### 5.3 前端掩码

```html
<masked-field value="user@example.com" mask-type="email"></masked-field>
```

`mask-type`
决定掩码策略：`email`(`u***@e***.com`)、`phone`(`138****1234`)、`generic`(首尾各留
1-2
字符)。默认掩码，眼睛图标切换明文，组件卸载/页面刷新后状态重置为掩码（不持久化明文展示状态）。

## 6. 工作空间隔离测试用例（回归红线）

`Workspace.md §测试` 有完整清单，这里列最核心的一条：**任意模块的
`repository.listXxx(workspaceId)` 在切换 `workspaceId`
后，返回结果必须不包含另一工作空间的数据**——这条测试对每个新模块的
`repository.js` 都是强制的（`docs/Testing.md`
的集成测试模板已内置该断言，新模块复制模板即可）。
