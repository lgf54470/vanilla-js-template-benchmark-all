# 任务运行器外壳：底层一律 deno task / deno run，不出现 npm/node 字样。
set windows-shell := ["bash", "-cu"]

default:
    @just --list

# 首次运行从 env.example 生成 .env（仅含变量名与开发默认值，无真实机密）
[private]
ensure-env:
    @test -f .env || cp env.example .env

# 本地开发（Deno + SQLite），浏览器打开提示的地址
dev: ensure-env
    deno task dev

# 格式化 / 格式检查（CI 第一步）/ 静态检查（deno lint + 零依赖治理脚本链）
fmt:
    deno fmt

fmt-check:
    deno fmt --check

lint:
    deno lint
    deno run -A scripts/run-checks.js

# 全量测试：单元 + 集成 + UI 冒烟（CDP 前置不满足时冒烟自动跳过）
test:
    deno test -A

# 数据库迁移 / 种子数据（默认工作空间等）
db-migrate: ensure-env
    deno task db:migrate

db-seed: ensure-env
    deno task db:seed

# 新增/删除前端模块后重新生成模块注册表（apps/web/src/modules/registry.generated.js）
generate-registry:
    deno task registry:generate

# 组装前端静态产物到 dist/web（apps/web/* + packages/contracts，四平台共用）
build-web:
    deno task build:web

# 手动同步 vendored 依赖源码（人工审查，不自动升级）
vendor-update name="hono":
    deno task vendor:update {{name}}

# 启用 Conventional Commits 提交信息校验钩子
hooks:
    git config core.hooksPath .githooks

# Docker 镜像构建（deno compile 产物 + distroless/scratch 基础镜像，见 Dockerfile）
docker-build:
    docker build -t vanilla-js-template:latest .

# 部署目标：部署 CLI 属一次性工具，临时执行不落盘依赖（ARCHITECTURE §2.4），版本显式锁定
deploy-cloudflare: build-web
    deno run -A npm:wrangler@4.14.0 deploy

deploy-vercel: build-web
    deno run -A npm:vercel@44.2.7 deploy --prod

deploy-deno: build-web
    deno run -A jsr:@deno/deployctl@1.12.0 deploy --prod --static-dir=dist/web \
        --entrypoint apps/server/src/platform-adapters/deno.entry.js

deploy-docker: docker-build
    @echo "镜像已构建：vanilla-js-template:latest；按目标 registry 自行 push（VPS 侧 docker compose up -d）"
