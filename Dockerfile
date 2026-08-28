# Docker/VPS 镜像（docs/Deployment.md §6，ARCHITECTURE.md §15.4）。
# 先本地执行：just build-web && deno compile --allow-net --allow-env --allow-read \
#   --output dist/server apps/server/src/platform-adapters/docker.entry.js
FROM gcr.io/distroless/cc:latest

COPY dist/server /server
COPY dist/web /public
ENV STATIC_ROOT=/public
ENV DEPLOY_TARGET=docker

ENTRYPOINT ["/server"]