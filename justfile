# vanilla-js-template — 任务运行器（全部基于 Deno，AGENTS.md「常用命令」）
# Windows 下 just 会调用 deno 的 .cmd 后缀由 just 自动处理。

default:
    @just --list

# 本地开发（Deno + SQLite；M2 接入 --env-file 与数据库）
dev:
    deno run -A apps/server/src/platform-adapters/local.entry.js

# 格式化（vendored 源码已通过根 deno.json 排除）
fmt:
    deno fmt

# 仅检查格式（CI 第一步）
fmt-check:
    deno fmt --check

# deno lint + 治理脚本（check-hardcoded-tokens 自 M1 起接入）
lint:
    deno lint
    deno run -A scripts/check-hardcoded-tokens.js
    deno check apps/server/src/platform-adapters/

# 全量测试
test:
    deno test -A

# 执行数据库迁移（本地 SQLite；D1/Turso 由部署流程处理）
db-migrate:
    deno run -A scripts/db-migrate.js

# 组装前端静态产物 dist/web（平台发布用）
build-web:
    deno run -A scripts/build-web.js

# vendored 依赖冒烟（docs/Vendoring.md）
smoke-vendor:
    deno run -A scripts/smoke-vendor.js

# 部署（runbook 见 docs/Deployment.md；各入口 M2 落地）
deploy-cloudflare:
    @echo "deploy-cloudflare: M2 落地"
deploy-vercel:
    @echo "deploy-vercel: M2 落地"
deploy-deno:
    @echo "deploy-deno: M2 落地"
deploy-docker:
    @echo "deploy-docker: M2 落地"