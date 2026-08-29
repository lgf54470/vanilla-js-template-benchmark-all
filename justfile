# vanilla-js-template — 常用命令（全部基于 Deno，见 ARCHITECTURE.md §15.3 与 docs/Deployment.md）
ENV := "--env-file=.env"

default:
	@just --list

# 本地开发：Deno + SQLite，浏览器打开提示的地址
dev:
	@deno run {{ENV}} -A --watch apps/server/src/platform-adapters/local.entry.js

# 格式化
fmt:
	@deno fmt

# 仅检查格式（CI 第一步用）
fmt-check:
	@deno fmt --check

# 静态检查：deno lint + 自定义治理脚本（scripts/run-checks.js）
lint:
	@deno lint
	@deno run -A scripts/run-checks.js

# 全量测试：单元 / 集成 / UI 冒烟
test:
	@deno test -A

# 从各模块 module.json 生成注册表（新增/改模块后运行）
generate-registry:
	@deno run -A scripts/generate-registry.js

# 执行数据库迁移
db-migrate:
	@deno run {{ENV}} -A scripts/db-migrate.js

# 写入 / 重置种子数据（含默认工作空间）
db-seed:
	@deno run {{ENV}} -A scripts/db-seed.js

# 组装前端静态产物 dist/web（Cloudflare / Vercel / Deno Deploy 发布用）
build-web:
	@deno run -A scripts/build-web.js

# Docker 镜像：deno compile 产出单一可执行文件（见 docs/Deployment.md §6）
docker-build:
	@just build-web
	@deno compile --allow-net --allow-env --allow-read --output dist/server apps/server/src/platform-adapters/docker.entry.js

build:
	@just docker-build

# 手动同步 vendored 依赖源码（见 docs/Vendoring.md §4）
vendor-update name:
	@echo "手动流程见 docs/Vendoring.md §4：拉取上游对应版本源码、diff 审查、更新 VENDOR.md 后提交，不做自动升级"

# 部署：CLI 经 deno run -A npm:<pkg> 临时执行，不落盘依赖（ARCHITECTURE.md §2.4），版本锁定见 docs/Deployment.md
deploy-cloudflare:
	@deno run -A npm:wrangler@4.14.0 deploy

deploy-vercel:
	@deno run -A npm:vercel@41 deploy --prod

deploy-deno:
	@deno run -A npm:deployctl@1 deploy --static-dir=dist/web apps/server/src/platform-adapters/deno.entry.js

deploy-docker:
	@just docker-build
	@echo "镜像已构建（dist/server），推送与远端运行步骤见 docs/Deployment.md §6"
