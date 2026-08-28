# vanilla-js-template 任务外壳：底层能力均以 deno task 定义（README「常用命令」），
# justfile 只做薄封装，不出现 npm/node 字样（ARCHITECTURE.md §15.3）。
set positional-arguments

default:
    @just --list

# 本地开发服务器（Deno + SQLite）。首次运行自动从 env.example 生成 .env。
dev:
    test -f .env || cp env.example .env
    deno task dev

fmt:
    deno fmt

# 仅检查格式（CI 第一步，见 AGENTS.md「常用命令」）。
fmt-check:
    deno fmt --check

lint:
    deno lint
    deno task lint:governance

test:
    deno test -A
