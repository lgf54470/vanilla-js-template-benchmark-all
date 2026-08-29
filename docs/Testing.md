# Testing.md — 测试规范

对应 [`ARCHITECTURE.md §13`](../ARCHITECTURE.md#13-测试策略)。全部基于 Deno 内置
`Deno.test`，零第三方测试依赖。

## 1. 测试金字塔

| 层级         | 覆盖对象                                                                    | 目录约定                                        |
| ------------ | --------------------------------------------------------------------------- | ----------------------------------------------- |
| 单元测试     | `shared/lib` 纯函数、`shared/crypto`、`shared/lib/breakpoints.js` 等        | `apps/*/tests/unit/**`，镜像 `src/` 路径        |
| 集成测试     | `service.js` + 真实 SQLite adapter（临时文件或内存库），覆盖 workspace 隔离 | `apps/server/tests/integration/modules/<id>/**` |
| 组件逻辑测试 | Web Components 的状态机/属性映射（不测渲染像素）                            | `apps/web/tests/unit/components/**`             |
| UI 冒烟/E2E  | 登录、切换工作空间、暗黑模式切换等关键路径                                  | `apps/web/tests/e2e/**`，用 §4 的自研 CDP 驱动  |

## 2. 单元测试示例

```js
// apps/server/tests/unit/shared/crypto/field-crypto.test.js
import { assertEquals } from "node:assert/strict"; // Deno 兼容 node:assert，零依赖
import {
  decryptField,
  encryptField,
} from "../../../../src/shared/crypto/field-crypto.js";

Deno.test("encryptField/decryptField 往返一致", async () => {
  const key = "test-key-material";
  const cipher = await encryptField("user@example.com", key);
  const plain = await decryptField(cipher, key);
  assertEquals(plain, "user@example.com");
});

Deno.test("相同明文两次加密产生不同密文（随机 IV）", async () => {
  const key = "test-key-material";
  const a = await encryptField("secret", key);
  const b = await encryptField("secret", key);
  assertEquals(a === b, false);
});
```

## 3. 集成测试示例（工作空间隔离回归，强制模板）

```js
// apps/server/tests/integration/modules/notes/workspace-isolation.test.js
import { assertEquals } from "node:assert/strict";
import { createSqliteAdapter } from "../../../../src/shared/db/sqlite.adapter.js";
import { createScopedRepository } from "../../../../src/shared/db/scoped-repository.js";

Deno.test("notes_data 按 workspace 隔离", async () => {
  const db = await createSqliteAdapter(":memory:");
  await db.execute(
    "CREATE TABLE notes_data (id TEXT, workspace_id TEXT, title TEXT)",
  );
  const repo = createScopedRepository(db, "notes_data");

  await repo.forWorkspace("ws_work").insert({ id: "1", title: "work note" });
  await repo.forWorkspace("ws_life").insert({ id: "2", title: "life note" });

  const workRows = await repo.forWorkspace("ws_work").list();
  const lifeRows = await repo.forWorkspace("ws_life").list();

  assertEquals(workRows.length, 1);
  assertEquals(lifeRows.length, 1);
  assertEquals(workRows[0].title, "work note");
});
```

新模块的 `repository.js`
**必须**复制这个模板并替换表名/字段，作为该模块的最低测试门槛（`docs/Workspace.md §8`
的第 1 条）。

## 4. UI 冒烟测试：自研 CDP 驱动

不引入 Playwright/Puppeteer，改为基于 Deno 与浏览器均原生支持的全局 `WebSocket`
API，手写一个极简 Chrome DevTools Protocol
客户端（`scripts/testing/cdp-client.js`，约 150 行）：

```js
// 概念示意，非完整实现
export async function connectCdp(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve) => socket.addEventListener("open", resolve));
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) pending.get(msg.id).resolve(msg.result);
  });
  return {
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve) => {
        pending.set(id, { resolve });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close: () => socket.close(),
  };
}
```

冒烟测试用它依次 `Page.navigate` → 等待 `Page.loadEventFired` →
`Runtime.evaluate` 断言关键 DOM
状态。已落地的用例（`apps/web/tests/e2e/auth-gate.test.js`， 4 个）：

1. **未登录不渲染
   AppShell**——登录页是独立全屏视图，无侧栏/头部（曾叠在主页上）；
2. **登录后装配 AppShell**——侧栏图标受 `--icon-sm` 约束（曾渲染 240×150
   巨大图标）；
3. **收起态侧栏**——隐藏菜单文字与内联子菜单、图标保持
   16px、点图标栏菜单导航到模块主页；
4. **未登录直接访问模块路由**——弹回独立登录页。

前置（dev server + Chrome CDP）不满足时自动 `ignore` 跳过，`just test` 的 CI
不受影响。本地运行：

```bash
just dev &
google-chrome --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/e2e-chrome &
deno test -A apps/web/tests/e2e/
```

（e2e 对 `E2E_APP_URL` 环境变量敏感，默认 `http://127.0.0.1:8788`；登录密码为开发种子默认
`admin`——`apps/server/src/shared/db/bootstrap.js` 的 `DEFAULT_DEV_PASSWORD`，仅当
`settings:auth` 缺失时写入。它**不读取** `.env` 的 DEV 变量，`.env` 里若还残留
`DEV_SEED_AUTH_PASSWORD=change-me-in-dev` 是已废弃的死配置，可删，别用它登录。）

## 5. 覆盖率与门禁

- `deno test --coverage=coverage` + `deno coverage coverage`，`shared/*` 与
  `*/repository.js` 要求行覆盖率 ≥ 80%；组件视觉相关代码不强制覆盖率（由 UI
  冒烟测试兜底关键路径即可）。
- CI（`ci.yml`）失败条件：任意测试失败，或
  `shared/lib`、`shared/crypto`、`*/repository.js` 覆盖率低于阈值。

## 6. 测试命名与结构约定

- 文件名
  `<subject>.test.js`，`Deno.test('<中文或英文描述该做什么>', async () => {...})`，描述用一句话说清楚"验证什么行为"，不是"测试
  XX 函数"这种同义反复。
- 每个 `repository.js` 至少包含：CRUD 基本行为测试 + 工作空间隔离测试（§3
  模板）+ 参数化 SQL 未被绕过的检查（可选，主要靠 `check-sql-concat.js`
  静态扫描）。
- 集成测试的数据库一律用 `:memory:`
  或临时文件，测试结束后清理，禁止连到本地开发用的 `.data/dev.sqlite3`。

## 7. 治理/构建脚本测试（scripts/tests）

`scripts/` 下所有治理脚本（`check-*.js`）与构建脚本（`build-web.js` /
`generate-registry.js` / `vendor-fetch.js`）都带行为级测试，目录约定
`scripts/tests/<script-name>.test.js`，由 `deno test -A` 自动发现 （根
`deno.json` 不排除 `scripts/`）。零第三方依赖（硬规则 1），不引入
jsdom/@std，与组件 DOM 桩同一思路。

### 7.1 为什么用临时工作区

治理脚本以 `import.meta.dirname/..` 作为 ROOT 扫描**整个仓库**，负测试若直接
在仓库里摆破损文件会误伤真实代码。因此全部测试都走
`scripts/tests/helpers/check-runner.js`：把被测脚本**复制进系统临时目录**的
`scripts/` 下（ROOT 即落在 fixture 上），摆入正常/故意破损的文件，子进程执行
后断言退出码 + 输出片段，跑完递归删除（`Deno.remove`，注意 Deno 2.x 已移除
`Deno.rm`）。

### 7.2 基建 API

```js
import {
  assertResult,
  readWorkspaceFile,
  runCheck, // 跑治理脚本（读权限 + just/deno 执行权）
  runScript, // 通用：可传权限参数/命令行参数/环境变量
  withWorkspace, // { "相对路径": "内容" } → 临时目录，回调后自动清理
} from "./helpers/check-runner.js";

Deno.test("check-x 反向：违规样本报错", async () => {
  await withWorkspace({
    "apps/web/src/main.js": "alert('x');\n",
  }, async (ws) => {
    const res = await runCheck(ws, "check-window-dialogs.js");
    assertResult(res, 1, "alert("); // 退出码 1 + 输出片段双断言
  });
});
```

权限约定：

- 治理脚本默认 `--allow-read --allow-env --allow-run=deno,just,which`
  （`check-justfile` / `check-deno-tasks` 要执行子进程）；
- 构建脚本额外 `--allow-write`（写 `dist/` 与生成文件）；
- `vendor-fetch` 用非限定 `--allow-run`（内部起 `tar` 子进程）+
  `--allow-net=127.0.0.1`，并通过 `VENDOR_REGISTRY` 环境变量把下载源指到
  测试自起的本地 HTTP 服务（fixture tarball 现场 `tar -czf` 打包，含 `package/`
  根，与 npm tarball 布局一致），全程不碰网络。

### 7.3 已踩过的坑（改基建时先看这里）



### 7.4 fixture 用例清单



新治理/构建脚本**必须**带同样式的最小测试（正/负各至少一例），并在此表追加一行；
`just test` 的 CI 会一并执行（`check-justfile` 相关用例依赖 CI 安装的 `just`）。
