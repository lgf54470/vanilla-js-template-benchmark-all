# CSS.md — 设计令牌与 CSS 编写规范

对应 [`ARCHITECTURE.md §6.2`](../ARCHITECTURE.md#6-设计系统nova--zinc)。本文档是
`scripts/check-hardcoded-tokens.js` 的判定依据，也是新增令牌时的唯一入口。

> **色彩体系已升级为「四层架构」**（对齐 shadcn 主题生态，移植自
> ssr-react-template）：`themes/` 原始变量层 → `tokens/colors.css` 语义映射层 →
> 组件消费。**不要再按旧的「Zinc 单色阶 + 语义层」理解本文件**；§2
> 是唯一权威描述。

## 1. 文件组织与加载顺序

```
shared/styles/
├── tokens/                  # 第 1 层：结构令牌（尺寸类）+ 语义映射层
│   ├── colors.css           # 语义色映射 --color-* = var(--原始变量, oklch 兜底)（§2.2）
│   ├── spacing.css          # --space-1..12（刻度跳号：无 --space-7/9/11，见 §3）
│   ├── radius.css           # --radius 基准 + sm..4xl calc 档位（§3）
│   ├── shadow.css           # --shadow-xs..2xl
│   ├── typography.css       # --text-*/--leading-*/@font-face 三可变字体
│   ├── zindex.css           # --z-*（与 docs/Layout.md §6 表一致）
│   ├── motion.css           # 动效时长令牌（预留，当前被 no-motion 压制）
│   └── sidebar.css          # 侧栏尺寸常量（宽 16rem / icon 3rem / mobile 18rem）；颜色不在这里
├── themes/                  # 第 2/3 层：原始变量层 + 风格令牌集（本目录是令牌定义处，
│   │                        #   治理脚本白名单允许颜色字面量）
│   ├── palettes-base.css    # base-* 基色 × 7（zinc/red/…）× light/dark：shadcn 原始变量
│   │                        #   （--background/--foreground/--primary/--sidebar-* 等，oklch）
│   ├── palettes-chart.css   # chart-* 图表强调色 × 12：--chart-1..5
│   ├── palettes-swatches.css# 主题设置选色器的示意色块
│   ├── style-nova.css       # 风格基准（--ds-* 组件级样式变量全集）
│   └── style-{vega,maia,lyra,mira,luma,sera,rhea}.css   # 只覆盖与 nova 的差异（delta）
├── base/
│   ├── reset.css
│   ├── motion.css           # prefers-reduced-motion 时令牌降级（备份路径，默认被 no-motion 覆盖）
│   └── no-motion.css        # 全站无动效：animation/transition 一律 none（§9）
└── index.css                # 唯一入口：按上面顺序 @import；src/style.css 只引本文件
```

三条加载/注入通道（缺一即出样式事故，见 `docs/bug/`）：

1. **light DOM**：`src/style.css → index.css`（含 PREPAINT 之前的静态链）。
2. **首帧防闪**：`index.html` 的 PREPAINT 内联脚本在首帧前读取 localStorage 并把
   `style-*/base-*/chart-*/menu-*/dark` 类与 `--radius` 等 写到
   `<html>`（`shared/lib/appearance.js` 运行时接管同一套类）。
3. **shadow DOM**：组件经 `attachStyles()`（`shared/ui/base.js`）拿
   `adoptedStyleSheets = [iconStyles, noMotionStyles, 组件样式]`——light DOM
   规则穿不透 shadow，no-motion 必须逐 root 注入。
4. **light-DOM 页面样式**：模块页面用
   `ensurePageStyles(import.meta.url, "./styles/<page>.css")`
   （`shared/lib/page-styles.js`）按解析后 href 去重注入 `<link>`。

## 2. 色彩四层体系（权威描述）

### 2.1 第 1 层：原始变量层（`themes/palettes-*.css`）

变量名与取值**与 shadcn 官方主题完全同构**（oklch）：`:root.base-<color>` 提供
`--background --foreground --card --popover --border --input --ring --sidebar*`
`--primary --secondary --muted --accent --destructive`（各带 `-foreground`
对）， 暗色为 `:root.dark.base-<color>`。**类挂载点是 `<html>`**，由 appearance
引擎 维护（同一时刻恰有一个 `base-*`、一个 `chart-*`、一个 `style-*`）。新增基色
= 在 palettes-base.css 增加一组
`:root.base-x`/`:root.dark.base-x`，不碰任何组件。

```css
/* themes/palettes-base.css（节选）——本文件为令牌定义处，允许字面量 */
:root.base-zinc {
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.21 0.006 285.885);
  --sidebar: oklch(0.985 0 0);
  /* …全套 shadcn 变量… */
}
:root.dark.base-zinc {
  /* …暗色全套… */
}
```

### 2.2 第 2 层：语义映射层（`tokens/colors.css`）

组件**只允许引用本层**。语义令牌 = `var(--原始变量, oklch 兜底)`——未挂 `base-*`
类（极端兜底）时退到 Zinc oklch，与 shadcn 默认主题一致：

```css
:root {
  --zinc-50: oklch(0.985 0 0); /* …--zinc-950（兜底/工具场景）… */
  --color-bg: var(--background, oklch(1 0 0));
  --color-fg: var(--foreground, oklch(0.141 0.005 285.823));
  --color-muted: var(--muted, oklch(0.967 0.001 286.375));
  --color-fg-muted: var(--muted-foreground, oklch(0.552 0.016 285.938));
  --color-border: var(--border, oklch(0.92 0.004 286.32));
  --color-primary: var(--primary, oklch(0.21 0.006 285.885));
  --color-danger: var(--destructive, oklch(0.577 0.245 27.325));
  --color-overlay: rgb(0 0 0 / 40%);
  --ring: var(--ring, oklch(0.705 0.015 286.067));
  --chart-1: oklch(0.871 0.006 286.286); /* …--chart-5 兜底；chart-* 类覆盖… */
}
/* 无 base-* 类时的暗色兜底（与 base-zinc dark 相同） */
.dark:not([class*='base-']) {
  --background: oklch(0.141 0.005 285.823); /* … */
}
```

暗色切换由 appearance 引擎写 `<html>` 的 `.dark` 类（**并双写
`data-theme="dark|light"` + `style.colorScheme`**，兼容 仅认 data-theme
的旧规则），**不是** `[data-theme]` 单独驱动——新代码统一认 `.dark`。

### 2.3 第 3 层：风格令牌层（`themes/style-*.css`）

`style-*` 类同样挂 `<html>`，提供组件级样式变量 `--ds-<component>-<property>`
（含尺寸/圆角倍数/描边/阴影）。`style-nova` 是**全集基准**，其余 7 个风格
（vega/maia/lyra/mira/luma/sera/rhea）**只写 delta**；暗色增量用
`.dark.style-<name>`：

```css
/* themes/style-nova.css（节选）——组件 CSS 以 var(--ds-*, <值>) 消费 */
.style-nova {
  --ds-btn-radius: calc(var(--radius) * 2.6);
  --ds-card-ring: color-mix(in oklch, var(--foreground) 5%, transparent);
  --ds-menu-item-radius: calc(var(--radius) * 1.8);
}
/* themes/style-luma.css——大圆角/填充输入风格，只写差异 */
.style-luma {
  --ds-btn-radius: calc(var(--radius) * 2.6);
  --ds-input-bg: color-mix(in oklch, var(--input) 50%, transparent);
  --ds-input-border: transparent;
}
.dark.style-luma {
  --ds-card-ring: color-mix(in oklch, var(--foreground) 10%, transparent);
}
```

### 2.4 第 4 层：消费规则（组件/页面）

- 组件 CSS 一律引用：语义层 `--color-*`/`--ring`/`--chart-N`、风格层
  `--ds-*`（带 nova 默认值兜底）、结构层
  `--space-*/--radius-*/--text-*/--shadow-*/--z-*`。
- **禁止**直接引用 `--background`/`--primary`/`--sidebar-*` 等原始层变量与
  `--zinc-*`（它们是 palettes 的内部契约，换色板方案时不保证兼容）。
- Sidebar 颜色同理：`--sidebar-*` 原始变量由 palettes 提供，组件消费
  `var(--color-*)` 或 `--ds-sidebar-*`；`tokens/sidebar.css` 只放**尺寸**
  （`--sidebar-width: 16rem` 等）。

## 3. 间距 / 圆角 / 阴影 / 字号

```css
/* spacing：注意刻度跳号——刻意没有 --space-7/9/11（8=2rem、10=2.5rem、12=3rem），
   不要"补齐"它们，也不要引用不存在的刻度（会静默失效为 0，见 docs/bug/
   2026-08-28-css-var-typo-silent-zero.md） */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;

/* radius：单一基准 + calc 倍数档位。主题设置面板只写 --radius 即全站生效 */
--radius: 0.625rem;
--radius-sm: calc(var(--radius) * 0.6);
--radius-md: calc(var(--radius) * 0.8);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) * 1.4);
--radius-2xl: calc(var(--radius) * 1.8);
--radius-3xl: calc(var(--radius) * 2.2);
--radius-4xl: calc(var(--radius) * 2.6);
--radius-full: 9999px;

/* shadow 六档；阴影只允许出现在浮层（Design.md §3） */
--shadow-xs: 0 1px 2px rgb(0 0 0 / 5%);
--shadow-sm: 0 1px 3px rgb(0 0 0 / 10%), 0 1px 2px rgb(0 0 0 / 6%);
--shadow-md: 0 4px 12px rgb(0 0 0 / 10%);
--shadow-lg: 0 12px 32px rgb(0 0 0 / 16%);
--shadow-xl: 0 20px 40px rgb(0 0 0 / 18%);
--shadow-2xl: 0 25px 50px rgb(0 0 0 / 25%);

/* 字号：--text-2xs(10px) xs(12) sm(14) base(16) lg(18) xl(20) 2xl(24) 3xl(30)，
   与 Tailwind 刻度一致；正文默认 --text-sm */
```

## 4. 字体

- **自托管三可变字体**（`public/fonts/*.woff2`，`@font-face` 定义在
  `tokens/typography.css`）：Inter Variable（正文默认）、Manrope Variable、
  Geist Variable。不引 CDN。
- 主题设置的「正文字体/标题字体」写 `--font-sans-base` /
  `--font-heading-base`；全局规则
  `h1–h4 { font-family:
  var(--font-heading-base, inherit) }` 让所有 light-DOM
  页面标题跟随主题。
- `index.html` 对三个 woff2 做 `<link rel="preload">`。

## 5. 命名规则

- 语义色：`--color-<role>`（`bg`/`fg`/`border`/`primary`/`danger`/`warning`/`success` +
  可选 `-fg`/`-muted` 后缀）。
- 原始层：**必须与 shadcn
  官方变量同名**（`--background`、`--sidebar-accent`…），
  便于直接移植官方主题值。
- 尺度类：`--<category>-<step>`，同一类内不混用命名法。
- 风格层：`--ds-<component>-<property>` 命名空间，只在该组件确有跨主题/跨风格
  定制需求时建立；组件 CSS 以 `var(--ds-x, <nova 默认>)` 消费。
- 组件私有令牌（如 Sidebar 的 `--sidebar-width` 尺寸三件套）：
  `--<component>-<property>`。

## 6. `check-hardcoded-tokens.js` 判定规则与白名单

**禁止**（CI 失败）：

- 裸 `#hex` / `rgb(` / `hsl(` / `oklch(`（令牌定义处除外，见下）。
- 裸 `px` 用于 `border-radius`、`padding`、`margin`、`gap`（必须用
  `var(--radius-*)`/`var(--space-*)`）。
- 裸 `font-size` 数值。

**白名单**（允许字面量的令牌定义处）：

- `tokens/*.css`、`styles/themes/**`（palettes + 风格集）、`base/reset.css`。
- `1px`/`2px` 用于 `border-width`/`outline-width`；`0`、`100%`、`1fr`、`auto`
  等结构性值；SVG 内联坐标。
- 其它文件一律失败——需要新字面量时，先进 §2/§3 的令牌层再引用。

## 7. 逻辑属性（RTL 预留，见 `Layout.md §7`）

优先使用 `margin-inline` / `padding-inline` / `inset-inline-start`
而非物理方向属性，`text-align: start` 而非 `left`。例外：Grid
`grid-template-columns` 等本身与阅读方向无关的属性正常使用。

## 8. 编写规则

- 禁止 `!important`（唯一例外：`base/motion.css` 与 `base/no-motion.css`
  的动效清零规则，因为需要压制组件内的 `transition`/`animation` 声明）。
- 允许原生 CSS 嵌套（`&`），不引入 PostCSS/Sass。
- 组件样式文件与组件逻辑文件同名并列（`button.js` + `button.css`），经
  `attachStyles()`/`adoptedStyleSheets` 注入（不用 CSS-in-JS）；**shadow 内 原生
  button/input 必须重置 UA 样式**（`all: unset` 或逐属性归零——灰底/描边/
  字体泄漏是高发事故，见 `docs/bug/2026-08-28-shadow-ua-styles-leak.md`）。
- CSS 注释内**禁止出现 `*/` 序列**（包括「(星号)(斜杠)」字面描述），否则提前
  终止注释吞掉整个规则块（`docs/bug/2026-08-28-css-comment-swallowed-root-block.md`）。
- 新增令牌前先检索本文件是否已有语义等价项，避免令牌膨胀（`docs/decisions/`
  记录任何"新增一整类令牌"级别的决定）。

## 9. Shadow DOM 动效约定（no-motion）

本项目与参考模板一致，**全站无动效**：`base/no-motion.css` 以
`* { animation: none !important; transition: none !important }` 清零一切动效。
关键约束：

- **light DOM 的全局规则穿不透 shadow 边界**。组件若想与全局行为一致， 必须依赖
  `attachStyles()`（`shared/ui/base.js`）——它已把 no-motion 样式表注入每个
  shadow root，组件自身样式表排在它之后。**不要**在组件 CSS 里自带生效的
  `transition`/`animation`（写了也会被 no-motion 压制，
  属于死代码）；若未来恢复动效，需整体重新评估而非逐组件解禁。
- 组件 JS **禁止依赖 `transitionend`/`animationend` 完成关键逻辑**。
  弹层关闭后需要等动画再卸载 DOM 时，用 `waitForTransition(el, fallbackMs)`
  （`shared/lib/dom.js`）：它感知 no-motion（计算 transitionDuration 为 0
  时立即完成），不会空等固定延时。
- 弹层遮罩关闭态必须显式声明 `pointer-events: none`（仅 opacity:0 仍会
  拦截全屏点击），且若遮罩带 `display` 声明，需同时写
  `[hidden] { display: none }` （author 规则优先于 UA 的 `[hidden]`，否则 hidden
  属性失效）。
- document 级"外点关闭"必须用 `event.composedPath()` 判定点击目标（嵌套 shadow
  下 `Node.contains()` 恒 false）。
