# 自托管字体说明

三款可变字体均为 **SIL Open Font License 1.1**（见同目录 `OFL-LICENSE.txt`），
自托管于本目录，不引 CDN（`docs/CSS.md §4`）。

| 文件                     | Family 名          | 字重范围 | 来源                                    |
| ------------------------ | ------------------ | -------- | --------------------------------------- |
| `Inter-Variable.woff2`   | `Inter Variable`   | 100–900  | Google Fonts（Inter v20，latin 子集）   |
| `Manrope-Variable.woff2` | `Manrope Variable` | 200–800  | Google Fonts（Manrope v20，latin 子集） |
| `Geist-Variable.woff2`   | `Geist Variable`   | 100–900  | Google Fonts（Geist v5，latin 子集）    |

- 获取方式：`https://fonts.googleapis.com/css2?family=<Fam>:wght@<range>`（现代
  UA 返回 可变字体 woff2），取 latin 子集文件下载。
- `@font-face` 定义在 `src/shared/styles/tokens/typography.css`；`index.html`
  对三个 woff2 做 `<link rel="preload">`。
- 更新方式：重新按上表下载替换同名文件并更新本表版本号；字体文件属二进制资产，
  随仓库版本管理。
