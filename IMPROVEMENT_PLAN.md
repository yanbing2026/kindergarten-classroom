# BlockQuest Classroom — Improvement Plan

**基准：** `main` @ `5b19d74`（2026-10-04，PR #62） · **本次核实：** 2026-10-17
**怎么核实的：** 全新克隆 + 15 个 `scripts/test_*.js` 全跑 + `python3 tools/validate_content.py` + 逐文件 `node --check` + 线上 `index.html` sha256 比对（命令见 §2 表格右列）。
**先读这一句：** 旧版（2026-09-24，基准 `315d03d`）把 9/30–10/4 期间**已经修掉**的条目列为 P0 待办，还把 2026-09-24 就已 **CLOSED** 的 PR #1/#2 写成"未合并"。它过期了，别照着做 —— 原文归档在 `docs/archive/improvement-plan-2026-09-24.md`。

## 1. 当前状态

- `main` 与线上**逐字节一致**：sha256 `eef77b08ee326ea43ac2dc750f750a5a35454c5690ca20ac4a2716612b32df1d`，`APP_VERSION = v2-20261004-a11y-buttons`（`index.html` 与 `sw.js` 两处一致）
- CI（`Validate`）最近运行全部 success；**本地 15 个测试 + 内容校验全 PASS**（发布已迁到 Cloudflare Pages，GH Pages 工作流已移除，见 `docs/pages-recovery.md`）
- **没有开着的 PR / issue**（63 个 PR：60 merged、3 closed；当前 0 个 open issue）
- 体积现状：`index.html` **312,895 字节 / 4,607 行**（一个内联 `<script>` 还是主体）；`js/` 已有 3 个模块（data-layer / skill-engine / blipola-runtime）；`data/` 下 13 个 `*.js` 题库；全仓（不含 `.git`/`node_modules`）约 4.0 MB
- **结论：没有在飞的线头。** 下面是确认过仍然成立的事项。

## 2. 仍然成立的事项

### 2.1 已核实"确实还没做"

| 项 | 事实 | 核实方式 | 量级 |
|---|---|---|---|
| **首页宣称大于事实** | `index.html:961` 渲染 `📚 Grades Pre-K–8`，而 3–8 年级其实是占位（`course framework ready` 共 7 处） | `grep -n 'Grades Pre-K–8' index.html`；`grep -c 'course framework ready' index.html` → 7 | XS |
| **年级页仍走 iframe** | `shared/grade-page.js:9` 动态建 `iframe`（`src=config.engineUrl`），高度 `calc(100vh - 100px)`、`min-height:720px`，另有 7 秒"起不来"兜底 | 读 `shared/grade-page.js`（24 行）；全仓 `iframe` 命中 **1 处** | M |
| **服务端登录限流未核实** | 仓库里有 `supabase/migrations/005_login_throttling.sql`，但**没人验证它真的拦得住**；客户端那层只是内存计数（`LOGIN_MAX_ATTEMPTS`） | 列 `supabase/migrations/`；需要 review 迁移 + RPC 实际行为 | S（审，不是写） |
| **进度 schema 尚未收敛** | `__blipola` 已消失（0 处），现存 `mastery`（51 处）+ `due{}`（5 处）+ `KCData`（16 处）—— 两套半并行 | `grep -c` 这三个键 | M（先决定，再动） |
| **`index.html` 仍是单体** | 312 KB / 4,607 行，主体仍是一个内联 script | `wc -c`、`wc -l` | L（增量） |
| **身份/年级文案分散在多处** | 年级名到 slug 的映射在 `index.html` 里手写多处（`g1/g2/k/prek` → `grade-1/...`），改一处容易漏 | `grep -n "grade-1':'Grade 1'" index.html` | S |

### 2.2 已核实"其实已经修了"（旧版把它们列为待办）

| 旧条目 | 当时的问题 | 核实方式 | 结论 |
|---|---|---|---|
| P0-1 | `data/grade-1/math.js` 截断 → 一年级数学内容静默消失 | `node --check data/grade-1/math.js` 通过；文件 7.1 KB | **已修** |
| P0-2 | `sw.js` precache 了不存在的 `js/blipola-voice.js` → `cache.addAll` 原子失败、SW 装不上 | `grep blipola-voice sw.js` 无命中；`node scripts/test_app_shell.js` PASS（断言每个 APP_SHELL 路径都存在） | **已修** |
| P0-3 | Supabase CDN 不可达 → 顶层 `ReferenceError` → 整页白屏 | `index.html:244 let supa = null` + `initSupabase()` 幂等，CDN 失败时 `supa` 保持 null | **已修** |
| P0-4 | PR #1 / #2 悬着待合并 | 两个都于 **2026-09-24 CLOSED**（不是合并） | **已了结** |
| P1-5 | `window.supa` 从不赋值 → 规范化同步层是死代码 | `index.html` 现有 2 处 `window.supa =` | **前提已不成立** |
| P1-6 | Grade 2 只有 5 道题循环 6 次、提示全是套话 | `data/grade-2/core.js` 305 行 / 207 个不重复字符串字面量 | **已修** |
| P1-7 | `images/words/` 1.2 MB 死图且被 precache | 目录已删；`node scripts/test_image_references.js` PASS（零引用） | **已修** |
| P1-9 | CI 只检查 2 个 JS 文件，所以才漏掉 P0-1 | `validate.yml` 循环 `node --check` 每个 JS + 内联块 + `TEST_SCRIPTS` 数组（现 15 个测试） | **已修** |
| P1-11 | issue #34 语义化 G1 数学交互 | `gh issue view 34` → CLOSED；`scripts/test_g1_math_interactions.js` 守着 | **已完成** |
| P2-17 | 本文件过期 | 本次刷新 | **本次完成** |

> 核实过程的教训：`iframe` 那项我第一次只 grep 了年级目录和 `index.html`，得出"已修"的错结论；grep 全仓（含 `shared/*.js`）才看到真身。**判定"已修"必须覆盖全部实现位置**，这条同样适用于 §5 的"别动"清单。

## 3. 动手前必读（抄自 `AGENTS.md`，别绕开）

- `main` 受保护：**分支 → PR → squash merge**，**合并即上线**；不要直推 `main`
- **文档（prose）由 Hermes 写；代码改动走 agy**（见 `plan-delegate-verify`）
- **版本号规则**：只有 `sw.js` 的 `APP_SHELL` 里那 8 个资源（`'./'`、`index.html`、`manifest.json`、`sw.js`、4 个图标）**内容变化**时才需要 bump `APP_VERSION`（两处同步）。**纯文档/测试改动不需要 bump** —— 它们不在预缓存清单里，bump 只会让所有已安装用户白重下一遍缓存
- 收尾必做：改动文件逐个 `node --check`、跑相关 `scripts/test_*.js`、`python3 tools/validate_content.py`；合并后等一两分钟再比线上 `index.html` 的 sha256
- 站点曾因删分支而消失（2026-10-01）：**删任何分支前先看 `gh api repos/yanbing2026/kindergarten-classroom/pages` 的 `source.branch`**；恢复手册 `docs/pages-recovery.md`

## 4. 建议顺序

1. **首页宣称/占位一致**（2.1 第 1 项，XS，代码 → agy；改文案不改资源 → 无需 bump）
2. **服务端限流核实**（S，纯 review）→ 有结论再决定要不要动 `005` 迁移
3. **年级页去 iframe**（M，代码 → agy；注意 `?grade=X&pageShell=1` 壳模式与 iframe 内的 TTS/自动播放行为，改动后要在真机上验一次）
4. **进度 schema 收敛的"决定"**（M）→ 决定了再动代码
5. **`index.html` 拆模块**（L，增量：一次拆一个模块，每次保持 15 个测试全绿）

## 5. 什么别动（本次复核仍然成立）

TTS 层（`playBrowserUtterance` / `getBestVoice`：特性探测 + `voiceschanged` + 出错也 resolve，不会卡住）、trace 画布的触摸处理（`touch-action:none`、去 tap 高亮）、emoji `onerror` 兜底、账号名 `esc()` 转义、PBKDF2（120k）PIN 校验流程（不传/不存明文 PIN）、离线优先 localStorage + 不阻塞课程的异步云同步、PWA 安装/更新管道（`skipWaiting`、缓存版本、network-first 导航）。

---

**归档：** 2026-09-24 版（基准 `315d03d`）→ `docs/archive/improvement-plan-2026-09-24.md`。
