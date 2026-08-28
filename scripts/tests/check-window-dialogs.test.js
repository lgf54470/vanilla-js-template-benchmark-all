// scripts/tests/check-window-dialogs.test.js — check-window-dialogs 行为级测试
// 正向：走 ds-dialog 且注释/字符串提到 alert 不误报；反向：真实 alert() 报错。
import {
  assertResult,
  runCheck,
  withWorkspace,
} from "./helpers/check-runner.js";

const CLEAN = {
  "apps/web/src/modules/notes/index.js":
    "import { openDialog } from '@shared/ui/dialog/use.js';\nopenDialog('确认删除？');\n",
};

Deno.test("check-window-dialogs 正向：ds-dialog 通过、字符串提到 alert 不误报", async () => {
  await withWorkspace({
    ...CLEAN,
    "apps/web/src/shared/ui/dialog/use.js":
      'document.title = "不能用 alert 弹窗";\nconst label = "prompt(\'x\') 是反例";\n',
  }, async (ws) => {
    const res = await runCheck(ws, "check-window-dialogs.js");
    assertResult(res, 0, "未发现 alert/confirm/prompt 调用");
  });
});

Deno.test("check-window-dialogs 反向：真实 alert() 报错", async () => {
  await withWorkspace({
    "apps/web/src/main.js": "alert('发生错误');\n",
  }, async (ws) => {
    const res = await runCheck(ws, "check-window-dialogs.js");
    assertResult(res, 1, "alert");
  });
});

Deno.test("check-window-dialogs 反向：confirm()/prompt() 同样拦截", async () => {
  await withWorkspace({
    "apps/web/src/app/login/login.js":
      "if (confirm('确认退出？')) logout();\nconst name = prompt('请输入');\n",
  }, async (ws) => {
    const res = await runCheck(ws, "check-window-dialogs.js");
    assertResult(res, 1, "confirm");
    assertResult(res, 1, "prompt");
  });
});
