# UI themes（可爱 / 精简版）

2026-11-02 起，界面从 8-bit 像素风换成「软圆角 + 大按钮」的儿童界面，并且**两套主题可切换**。
本文只讲这套系统的约定；具体像素值看 `shared/main.css` 顶部的令牌。

## 两套主题

| 主题 | id | 底色 | 主按钮 | 气质 |
| --- | --- | --- | --- | --- |
| 奶油简约 | `cream` | 米白 `#FFFBF4` | 珊瑚 `#E85F2E` | 最干净，像绘本 |
| 天空小熊 | `sky` | 蓝→薄荷→奶油渐变 | 薄荷绿 `#2FA37C` | 更活泼，有天空感 |

默认 `cream`。选择存在 `localStorage` 的 `kc_theme_v1`，入口是顶栏的 🎨。

## 机制

- 主题写在 `<html data-theme="cream|sky">` 上，CSS 用 `html[data-theme="sky"] { --kc-*: … }` 覆盖变量。
- **首帧不闪错主题**：`<head>` 里有一小段内联脚本，在样式表之前读 `kc_theme_v1` 并设 `data-theme`，
  所以刷新时不会先闪一下默认色。这段必须留在 `<head>`、必须有 `try/catch`。
- `setTheme(id)` 负责写 `data-theme` + localStorage 并重绘；`getTheme()` 读当前值。
- 新增第三套主题 = 在 `shared/main.css` 加一个 `html[data-theme="<id>"]` 块，把下面这些变量全部给出，
  然后在主题面板里加一张卡。**不要**为某个主题写单独的选择器规则。

## 令牌（新代码只用这些）

```
底色   --kc-bg  --kc-bg-2  --kc-bg-gradient  --kc-surface
文字   --kc-ink  --kc-ink-soft
描边   --kc-line（只用于阴影/极淡边线，不是黑色硬边）
主色   --kc-primary  --kc-primary-dark  --kc-primary-ink
底片   --kc-chip  --kc-chip-2
状态   --kc-ok  --kc-warn  --kc-today-kicker  --kc-dot-bg
圆角   --r-sm 16  --r-md 22  --r-lg 28  --r-xl 34  --r-pill 999
阴影   --sh-1（贴地 3px）  --sh-2（按钮 6px）  --sh-3（浮起 10/30）
字体   --font-pixel（标题：Baloo 2）  --font-clear（正文：Nunito）
```

`--mc-*` 那一组是**兼容别名**，只为了让没改到的老规则不至于崩，值全部指向新令牌。
新代码不要再用 `--mc-*`。

## 硬规矩

- **不要硬编码颜色**。`#2b1b0e`、`#333` 一类的值在主题化之后就是 bug —— 深色主题下会变成黑边。
  需要新颜色就加令牌，并在两套主题里都给值。
- **不要用 `inset` 内浮雕阴影**，也不要用 3–4px 深色描边。这套设计靠底色、圆角、贴地阴影分层。
- 主按钮上的文字必须是 `--kc-primary-ink`；主色改深是为了让白字达到 3:1（大号粗体）以上。
- 点按目标 ≥44px；正文最小 13px，标题 24px 起。

## 首页结构（2026-11-02 起）

首页只有三块，顺序固定，**不要再往里塞**：

1. greeting（`Hi, {账号名}!` / `Hi there!`）+ hero 卡（今日任务：标题、Play、三个任务点 + `x of 3`）
2. `Grades` —— 4 个已开放年级一行（Pre-K / Kindergarten / Grade 1 / Grade 2），
   其余年级收在 `Grades 3–8 ▾` 里，默认收起
3. `More` —— 5 格：Free Play / Draw / Trophies / Worksheets / Language（Language 打一个小 sheet 选中文/西语）

以下内容已从首页移除，不要加回来：`DAILY QUEST` 面板（信息压进 hero 的圆点）、
`All caught up` 面板、`Choose your grade` 大标题、页脚钻石行、顶栏 🏠 和版本号文本。

## 验证

```bash
# 语法 + 结构 + 全部单测
python3 - <<'EOF' > /tmp/inline.js
import re; h = open('index.html').read()
print("\n".join(re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', h, re.S)))
EOF
node --check /tmp/inline.js && node scripts/test_html_structure.js
for t in scripts/test_*.js; do node "$t" >/dev/null 2>&1 || echo "FAIL $t"; done

# 真机尺寸截图（无头 chrome，两套主题 + 平板）
~/.hermes/scripts/kc_shot.sh /tmp/a.png 390,844 cream
~/.hermes/scripts/kc_shot.sh /tmp/b.png 390,844 sky
~/.hermes/scripts/kc_shot.sh /tmp/c.png 1024,768 cream
```

截图脚本会把页面复制到 `/tmp`、追加一段设置主题/跳转屏幕的脚本再截，所以它**不会**改仓库里的文件。
`node --check` 与源码文本测试都看不见内联模板字符串的结构问题，改首页必须看截图。
