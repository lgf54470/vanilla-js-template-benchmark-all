# vanilla-js-template — 任务运行器（全部基于 Deno，见 ARCHITECTURE.md §2.1/§15.3）
# 不出现 npm/node 字样；平台部署 CLI 通过 deno run npm:<pkg>@<锁定版本> 临时执行（§2.4）。

set positional-arguments := true

# .env 存在时才注入（Deno 的 --env-file 在文件缺失时直接报错；仓库不入库 .env）
ENV_FLAG := `test -f .env && echo "--env-file=.env" || echo ""`

default:
    @just --list

# 本地开发服务器（Deno + SQLite，首次运行自动迁移 + 种子 + 可选 DEV_SEED_AUTH_PASSWORD）
# env -u PORT：以 .env 的 PORT 为准，避免外部已导出的 PORT 意外覆盖（见 docs/Deployment.md §9）
dev:
    env -u PORT deno run -A {{ENV_FLAG}} apps/server/src/platform-adapters/local.entry.js

# 格式化（deno fmt，含 CSS/JSON/MD 白名单外文件）
fmt:
    deno fmt

# 仅检查格式（CI 第一步）
fmt-check:
    deno fmt --check

# 静态检查：deno lint + 零依赖治理脚本（ARCHITECTURE §16）
lint:
    deno lint
    deno run -A scripts/run-checks.js

# 全量测试（单元/集成/组件；e2e 冒烟缺前置时自动 ignore 跳过）
test:
    deno test -A

# 仅 UI 冒烟（需 dev server + Chrome CDP，见 docs/Testing.md §4）
test-e2e:
    deno test -A apps/web/tests/e2e/

# 覆盖率摘要（shared/lib、shared/crypto、*/repository.js 阈值门禁见 scripts/check-coverage.js）
coverage:
    deno test -A --coverage=coverage
    deno run -A scripts/check-coverage.js

# 数据库迁移（按 DEPLOY_TARGET 解析适配器；本地默认 .data/dev.sqlite3）
db-migrate:
    deno run -A {{ENV_FLAG}} scripts/db-migrate.js

# 种子数据（六个系统工作空间，幂等）
db-seed:
    deno run -A {{ENV_FLAG}} scripts/db-seed.js

# 重新生成前端模块注册表（apps/web/src/modules/registry.generated.js）
generate-registry:
    deno run -A scripts/generate-registry.js

# 组装前端静态产物 dist/web（Cloudflare/Vercel/Deno Deploy 用，见 docs/Deployment.md §2）
build-web:
    deno run -A scripts/build-web.js

# 手动同步 vendored 依赖（hono | libsql-client），见 docs/Vendoring.md
vendor-update name:
    deno run -A scripts/vendor-fetch.js "{{name}}"

# 启用提交信息校验钩子（Conventional Commits + 逐文件说明）
hooks:
    git config core.hooksPath .githooks

# 平台部署（临时执行平台 CLI，不落盘依赖；版本显式锁定，见 ARCHITECTURE §2.4）
deploy-cloudflare:
    deno run -A npm:wrangler@4.14.0 deploy

deploy-vercel:
    deno run -A npm:vercel@47.0.3 deploy --prod

deploy-deno:
    deno run -A npm:deployctl@1.56.0 deploy --entrypoint=apps/server/src/platform-adapters/deno.entry.js --static-dir=dist/web

deploy-docker: docker-build
    @echo "dist/server 产物已就绪，按 docs/Deployment.md §6 打镜像并上传。"

# deno compile 产出单文件二进制（Docker/VPS 目标，ARCHITECTURE §15.4）
docker-build:
    deno run -A scripts/build-web.js
    deno compile -A --output dist/server apps/server/src/platform-adapters/docker.entry.js
