# public/fonts/ —— 自托管可变字体落位

把以下三个 woff2 放入本目录即自动生效（`tokens/typography.css` 的 `@font-face`
按 `url("/fonts/<file>")` 优先加载，`local()` 系统安装名兜底）：

| 文件                     | 字体             | 用于                       |
| ------------------------ | ---------------- | -------------------------- |
| `inter-variable.woff2`   | Inter Variable   | 正文默认（--font-sans）    |
| `manrope-variable.woff2` | Manrope Variable | 标题默认（--font-heading） |
| `geist-variable.woff2`   | Geist Variable   | 等宽（--font-mono）        |

字体文件缺失时的行为：

- `@font-face` 的 `url()` 加载失败 → 回退 `local()` → 系统字体栈，渲染不阻塞；
- `index.html` 对三个 woff2 的 `<link rel="preload">` 会出现 404（仅控制台提示，
  不影响首帧与功能）；
- 字体加载遵守 `font-display: swap`（文件存在但网络慢时先显示回退字体）。

获取渠道（任选其一，注意核对开源许可证随仓库保留）：

- Inter: https://github.com/rsms/inter/releases （OFL）
- Manrope: https://github.com/shorinkin/manrope 或 Google Fonts（OFL）
- Geist: https://github.com/vercel/geist-font/releases （OFL）

下载可变字体版本（Variable，单一 woff2 覆盖全字重），放入后无需改任何代码。
