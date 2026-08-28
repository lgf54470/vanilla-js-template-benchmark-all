set shell := ["bash", "-c"]

# 本地开发服务器
dev:
    deno task dev

# 格式化代码
fmt:
    deno task fmt

# 仅检查代码格式
fmt-check:
    deno task fmt:check

# 静态检查与自定义治理规则
lint:
    deno task lint

# 全量测试
test:
    deno task test

# 执行数据库迁移
db-migrate:
    deno task db:migrate

# 写入/重置初始种子数据
db-seed:
    deno task db:seed

# 组装前端静态产物到 dist/web
build-web:
    deno task build:web

# 重新生成前端模块注册表
generate-registry:
    deno task generate:registry

# 构建独立服务端二进制
build:
    deno compile --allow-net --allow-env --allow-read --allow-write --output dist/server apps/server/src/platform-adapters/docker.entry.js

# 构建 Docker 镜像
docker-build:
    docker build -t vanilla-js-template:latest .

# 更新 vendored 依赖
vendor-update name:
    @echo "Updating vendored dependency: {{name}}"
    deno run --allow-read --allow-write --allow-net --allow-run scripts/vendor-update.js {{name}}

# 部署至 Cloudflare Workers
deploy-cloudflare: build-web
    deno run -A npm:wrangler@4.14.0 deploy

# 部署至 Vercel
deploy-vercel: build-web
    deno run -A npm:vercel@latest deploy --prod

# 部署至 Deno Deploy
deploy-deno: build-web
    deno run -A jsr:@deno/deployctl deploy --static-dir=dist/web apps/server/src/platform-adapters/deno.entry.js

# 部署至 Docker / VPS
deploy-docker: build
    @echo "Deploy binary dist/server generated."
