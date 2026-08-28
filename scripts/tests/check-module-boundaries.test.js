// scripts/tests/check-module-boundaries.test.js — check-module-boundaries 行为级测试
// 正向：模块间经 event-bus / 模块注册表协作 + 共享目录 import 通过；模块 → 生成
// 的 registry.generated.js 不是跨模块；反向：直接 import 其它模块路径报错。
import {
  assertResult,
  runCheck,
  withWorkspace,
} from "./helpers/check-runner.js";

const OK = {
  "apps/web/src/modules/dashboard/index.js":
    "import { emit } from '@shared/core/event-bus.js';\nimport { getCapability } from '@shared/core/module-registry.js';\nimport './components/card.js';\n",
  "apps/web/src/modules/dashboard/components/card.js":
    "export const Card = () => {};\n",
  // 生成注册表直接落在 modules/ 根，import 它不算跨模块
  "apps/web/src/modules/registry.generated.js": "export const modules = [];\n",
  "apps/web/src/modules/notes/index.js":
    "import { modules } from '../registry.generated.js';\n",
  "apps/web/src/shared/core/event-bus.js": "export const emit = () => {};\n",
  "apps/web/src/shared/core/module-registry.js":
    "export const getCapability = () => {};\n",
};

Deno.test("check-module-boundaries 正向：经总线/注册表与共享目录协作通过", async () => {
  await withWorkspace(OK, async (ws) => {
    const res = await runCheck(ws, "check-module-boundaries.js");
    assertResult(res, 0, "未发现跨模块 import");
  });
});

Deno.test("check-module-boundaries 反向：模块直 import 其它模块报错", async () => {
  await withWorkspace({
    ...OK,
    "apps/web/src/modules/notes/index.js":
      "import { helper } from '../dashboard/components/card.js';\n",
  }, async (ws) => {
    const res = await runCheck(ws, "check-module-boundaries.js");
    assertResult(res, 1, "notes → dashboard");
  });
});

Deno.test("check-module-boundaries 反向：后端模块跨模块同样拦截", async () => {
  await withWorkspace({
    "apps/server/src/modules/notes/routes.js":
      "import { x } from '../dashboard/service.js';\n",
    "apps/server/src/modules/dashboard/service.js": "export const x = 1;\n",
  }, async (ws) => {
    const res = await runCheck(ws, "check-module-boundaries.js");
    assertResult(res, 1, "notes → dashboard");
  });
});
