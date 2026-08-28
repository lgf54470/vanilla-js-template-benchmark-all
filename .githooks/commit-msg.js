// commit-msg 校验（docs/Commit.md §5）：
// 1) 首行 <type>(<scope>): <subject>，type 枚举、scope 小写字母/数字/连字符、subject ≤ 50 字符；
// 2) 正文至少一行 `- <path>: <改动说明>`；
// 3) 失败时指明具体不满足的部分，而不是笼统报错。
import { readFileSync } from "node:fs";
import process from "node:process";

const TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
];

const file = process.argv[2];
if (!file) {
  console.error("commit-msg: 缺少提交信息文件参数");
  process.exit(1);
}

const raw = readFileSync(file, "utf8");
const lines = raw.split("\n");
const subject = (lines[0] ?? "").trimEnd();

const problems = [];
const firstLine =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)\(([a-z0-9-]+)\): (.{1,50})$/;
if (!firstLine.test(subject)) {
  const mType = subject.match(/^(\w+)(\(|:)/);
  const mScope = subject.match(/^\w+\(([^)]*)\)/);
  if (!mType || !TYPES.includes(mType[1])) {
    problems.push(
      `type 不合法（应为 ${TYPES.join("|")} 之一）："${
        subject.split(/[(:]/)[0]
      }"`,
    );
  } else if (!mScope || !/^[a-z0-9-]+$/.test(mScope[1])) {
    problems.push(
      `scope 不合法（小写字母/数字/连字符）：${
        mScope ? `"${mScope[1]}"` : "缺失"
      }`,
    );
  } else {
    const s = subject.slice(subject.indexOf(":") + 1).trim();
    problems.push(
      `subject 不合法（长度 1-50，祈使句，不加句号）：当前长度 ${s.length}`,
    );
  }
}

const bodyLines = lines.slice(1);
const hasFileLine = bodyLines.some((l) => /^- [\w./-]+: .+/.test(l));
if (!hasFileLine) {
  problems.push(
    "正文缺少改动行：至少一行形如 `- <path/to/file>: <改动内容，到方法/组件级>`",
  );
}

if (problems.length > 0) {
  console.error("commit-msg 校验未通过：");
  for (const p of problems) console.error(`  - ${p}`);
  console.error("规范见 docs/Commit.md");
  process.exit(1);
}
