// scripts/generate-registry.js — 扫描 modules/*/module.json 生成注册表
//
// 产出 apps/web/src/modules/registry.generated.js（ARCHITECTURE.md §4.2：
// 构建期扫描生成清单，运行时不做目录遍历）。sidebar 据此渲染，新增模块只需
// 新增目录 + module.json，不动 shell。
//
// 用法：deno run -A scripts/generate-registry.js（justfile 的 generate:registry）

import { createLogger } from "../apps/server/src/shared/logger/logger.js";

const log = createLogger({ module: "web", component: "GenerateRegistry" });

const MODULES_DIR = new URL("../apps/web/src/modules/", import.meta.url);
const OUT_FILE = new URL(
  "../apps/web/src/modules/registry.generated.js",
  import.meta.url,
);

/** 校验 module.json 的必填字段与取值合法性 */
function validateModule(id, json) {
  if (!json.id || json.id !== id) {
    throw new Error(`module.json: id 缺失或与目录名不一致（${id}）`);
  }
  if (
    typeof json.order !== "number" || typeof json.icon !== "string" ||
    typeof json.labelKey !== "string" || typeof json.route !== "string"
  ) {
    throw new Error(`module.json: ${id} 缺少 order/icon/labelKey/route`);
  }
  if (!json.route.startsWith("/")) {
    throw new Error(`module.json: ${id} 的 route 必须以 / 开头`);
  }
  if (json.submodules) {
    for (const sub of json.submodules) {
      if (
        !sub.id || typeof sub.labelKey !== "string" ||
        !sub.route?.startsWith("/")
      ) {
        throw new Error(`module.json: ${id} 的子模块字段不完整`);
      }
    }
  }
}

const modules = [];
for (const entry of Deno.readDirSync(MODULES_DIR)) {
  if (!entry.isDirectory) continue;
  const jsonPath = new URL(`${entry.name}/module.json`, MODULES_DIR);
  let json;
  try {
    json = JSON.parse(Deno.readTextFileSync(jsonPath));
  } catch (err) {
    throw new Error(`读取 ${entry.name}/module.json 失败: ${err.message}`);
  }
  validateModule(entry.name, json);
  modules.push(json);
}

modules.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

const output =
  `// apps/web/src/modules/registry.generated.js — 由 scripts/generate-registry.js 生成，勿手改
// 侧栏/路由数据源（ARCHITECTURE.md §4.2）。新增模块：建目录 + module.json 后重跑
// \`just generate:registry\`。
export const moduleRegistry = ${JSON.stringify(modules, null, 2)};
`;

Deno.writeTextFileSync(OUT_FILE, output);
log.info(`registry 已生成：${modules.length} 个模块 → registry.generated.js`);
