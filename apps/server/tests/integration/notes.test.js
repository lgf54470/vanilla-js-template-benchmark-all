// apps/server/tests/integration/notes.test.js — /api/notes CRUD + 工作空间隔离
//
// 覆盖：创建/列表/更新/删除、tag 过滤、工作空间隔离（ws_work 的数据
// ws_default 看不到）、404 语义、校验错误。notes_note 表由 bootstrapMigrations
// 自动收集（modules/*/migrations）。

import assert from "node:assert/strict";

import { createSqliteAdapter } from "../../src/shared/db/sqlite.adapter.js";
import {
  bootstrapMigrations,
  ensureAuthSeed,
} from "../../src/shared/db/bootstrap.js";
import { createAppSettingsStore } from "../../src/shared/settings/app-settings.js";
import { appCache } from "../../src/shared/cache/memory-cache.js";
import { createApp } from "../../src/app.js";

const SERVER_SRC = new URL("../../src/", import.meta.url);

async function buildApp() {
  appCache.clear();
  const db = createSqliteAdapter(":memory:");
  await bootstrapMigrations(db, SERVER_SRC);
  const settingsStore = createAppSettingsStore(db, "test-key");
  await ensureAuthSeed(settingsStore);
  const app = createApp({ db, env: { APP_ENCRYPTION_KEY: "test-key" } });
  return { db, app };
}

async function login(app) {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-auth-password": "admin" },
    body: JSON.stringify({ durationOption: "24h" }),
  });
  const body = await res.json();
  return body.data.token;
}

/** 统一请求辅助：auth + workspace 头始终保留，body 存在时附 JSON 头 */
function api(
  app,
  path,
  { token, workspaceId = "ws_default", method = "GET", body } = {},
) {
  return app.request(path, {
    method,
    headers: {
      "x-auth-password": token,
      "x-workspace-id": workspaceId,
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

Deno.test("notes: CRUD 全链路 + tag 过滤", async () => {
  const { app } = await buildApp();
  const token = await login(app);

  // 创建
  let res = await api(app, "/api/notes", {
    token,
    method: "POST",
    body: { title: "买牛奶", content: "记得带环保袋", tag: "生活" },
  });
  assert.equal(res.status, 201);
  const created = (await res.json()).data;
  assert.equal(created.title, "买牛奶");
  assert.equal(created.tag, "生活");
  assert.equal(created.isPinned, false);
  assert.ok(created.id > 0);

  // 列表
  res = await api(app, "/api/notes", { token });
  const list = (await res.json()).data;
  assert.equal(list.length, 1);

  // 按 tag 过滤
  res = await api(app, "/api/notes?tag=生活", { token });
  assert.equal((await res.json()).data.length, 1);
  res = await api(app, "/api/notes?tag=不存在的tag", { token });
  assert.equal((await res.json()).data.length, 0);

  // 更新（改名 + 置顶）
  res = await api(app, `/api/notes/${created.id}`, {
    token,
    method: "PUT",
    body: {
      title: "买牛奶（大瓶）",
      content: "环保袋",
      tag: "生活",
      isPinned: true,
    },
  });
  assert.equal(res.status, 200);
  const updated = (await res.json()).data;
  assert.equal(updated.title, "买牛奶（大瓶）");
  assert.equal(updated.isPinned, true);

  // tags 聚合
  res = await api(app, "/api/notes/tags", { token });
  const tags = (await res.json()).data;
  assert.equal(tags.length, 1);
  assert.equal(tags[0].tag, "生活");
  assert.equal(tags[0].count, 1);

  // 删除
  res = await api(app, `/api/notes/${created.id}`, { token, method: "DELETE" });
  assert.equal(res.status, 200);
  res = await api(app, `/api/notes/${created.id}`, { token });
  assert.equal(res.status, 404);

  // 删除不存在的 → 404
  res = await api(app, "/api/notes/99999", { token, method: "DELETE" });
  assert.equal(res.status, 404);
});

Deno.test("notes: 工作空间隔离（ws_default 看不到 ws_work 的数据）", async () => {
  const { app } = await buildApp();
  const token = await login(app);

  await api(app, "/api/notes", {
    token,
    workspaceId: "ws_work",
    method: "POST",
    body: { title: "工作会议纪要" },
  });
  await api(app, "/api/notes", {
    token,
    workspaceId: "ws_default",
    method: "POST",
    body: { title: "私人待办" },
  });

  const defaultList =
    (await (await api(app, "/api/notes", { token, workspaceId: "ws_default" }))
      .json()).data;
  const workList =
    (await (await api(app, "/api/notes", { token, workspaceId: "ws_work" }))
      .json()).data;

  assert.equal(defaultList.length, 1);
  assert.equal(defaultList[0].title, "私人待办");
  assert.equal(workList.length, 1);
  assert.equal(workList[0].title, "工作会议纪要");
});

Deno.test("notes: 校验（空标题 400；跨工作空间访问他人笔记 404）", async () => {
  const { app } = await buildApp();
  const token = await login(app);

  let res = await api(app, "/api/notes", {
    token,
    method: "POST",
    body: { title: "   " },
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error.code, "VALIDATION_ERROR");

  // ws_work 里建一条，ws_default 凭 id 访问 → 404（findById 带 workspace 过滤）
  res = await api(app, "/api/notes", {
    token,
    workspaceId: "ws_work",
    method: "POST",
    body: { title: "work note" },
  });
  const workNote = (await res.json()).data;
  res = await api(app, `/api/notes/${workNote.id}`, {
    token,
    workspaceId: "ws_default",
  });
  assert.equal(res.status, 404);
});
