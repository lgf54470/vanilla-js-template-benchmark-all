# public/fonts — 自托管可变字体（来源与校验和）

对应 `docs/CSS.md §4`：三可变字体自托管，不引 CDN。均为 latin 子集、
`wght` 可变轴，取自 Fontsource CDN（jsDelivr），版本显式锁定：

| 文件 | 字体 | 来源 URL（fontsource v5.3.0） | SHA-256 |
| --- | --- | --- | --- |
| `inter-var-latin.woff2` | Inter Variable | `https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@5.3.0/latin-wght-normal.woff2` | `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62` |
| `manrope-var-latin.woff2` | Manrope Variable | `https://cdn.jsdelivr.net/fontsource/fonts/manrope:vf@5.3.0/latin-wght-normal.woff2` | `a30ddcd349703aff7464c34bef3fffdff405ee50c113440d7c8693c02d210972` |
| `geist-var-latin.woff2` | Geist Variable | `https://cdn.jsdelivr.net/fontsource/fonts/geist:vf@5.3.0/latin-wght-normal.woff2` | `19f9c92546aa300c312235e3125af1b81394d8db9a4bc4a425cd5b641d2d54e1` |

- 三者许可证均为 OFL 1.1（SIL Open Font License）；上游仓库：
  Inter → https://github.com/rsms/inter ，Manrope → https://github.com/shapingtheadrian/manrope ，
  Geist → https://github.com/vercel/geist-font 。
- `@font-face` 定义在 `src/shared/styles/tokens/typography.css`；
  `index.html` 对三个文件做 `<link rel="preload">`。
- 更新字体 = 重新下载并回填本表版本与校验和（`sha256sum *.woff2`）。
