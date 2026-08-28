# docs/deploy/ — 部署实操记录

`../Deployment.md` 是通用
runbook（"怎么部署到某平台"的标准流程）；这里记录**某一次具体部署**的实际操作、遇到的平台特有坑、与
runbook 不一致的地方（并反过来推动 runbook 更新）。文件名
`YYYY-MM-DD-<platform>-<slug>.md`。

## 模板

```markdown
# YYYY-MM-DD: <平台> <这次部署做了什么>

- 目标环境：<production / preview / 具体 VPS>
- 对应 `Deployment.md` 章节：<§X>

## 操作记录

<实际执行的命令、控制台操作步骤>

## 与 runbook 的差异

<如果这次操作发现 `Deployment.md` 的步骤已过时/不准确，写明差异，并同步提 PR
更新该文件>

## 遇到的问题

<平台特有的坑，比如某个 secret 命名规则、某个 D1 迁移命令的参数变化>

## 结果

<成功/回滚，耗时，是否需要后续跟进>
```

暂无记录。
