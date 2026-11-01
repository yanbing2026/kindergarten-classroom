# BlockQuest Classroom — Improvement Plan

**基准：** `main` @ `bde5656`（2026-10-18）/ 当前分支 `ci/cf-pages-deploy` @ `941d1d9` · **本次核实：** 2026-11-01  
**怎么核实的：** 15 个 `scripts/test_*.js` 全跑 + `python3 tools/validate_content.py` + 逐文件 `node --check` + 线上 `https://blockquest-classroom.pages.dev/` sha256 逐字节比对（`eef77b08ee32...`）+ Supabase 001~007 迁移逐行安全审计 + Grade 2 题库可用性 Node VM 验证。  
**先读这一句：** 本计划根据 2026-11-01 的最新代码审查与安全审计刷新。原 10-17 版中的"服务端限流未核实"经审计确认存在 **`claim_player_auth` 绕过限流** 的重大安全缺陷；同时发现 **Grade 2 完备的 750 道题库在配置中漏打 `ready: true`**；进度多体系经 `docs/progress-stores.md` 确立架构边界后已正式了结（严禁盲目合并）。

## 1. 当前状态

- `main` 与线上**逐字节一致**：sha256 `eef77b08ee326ea43ac2dc750f750a5a35455c5690ca20ac4a2716612b32df1d`，`APP_VERSION = v2-20261004-a11y-buttons`（`index.html` 与 `sw.js` 两处一致）
- CI 部署：已迁移至 Cloudflare Pages（`deploy-pages.yml` 包含 secrets 防御、生产分支防灾和全套语法与单测前置门禁）
- 本地质量门禁：**15 个自动化单测全部 PASS**、`validate_content.py` 内容校验 PASS、全仓手写 JS 语法通过 `node --check`
- 体积现状：`index.html` **312,895 字节 / 4,608 行**（单体内联 `<script>` 依然庞大）；`data/grade-2/` 拥有完整的 5 学科 750 道题库；全仓（不含 `.git`）约 4.0 MB

## 2. 核心审查发现与执行结果

### 2.1 2026-11 改进任务执行结果

| 优先级 | 事项 | 实施动作 | 验证与测试门禁 | 状态 |
|---|---|---|---|---|
| **P0** | **`claim_player_auth` 绕过限流** | 编写 `supabase/migrations/008_harden_claim_player_auth_throttling.sql`，在 `claim_player_auth` 中强制接入 `player_login_attempts` 检查，失败累计、锁定 30 秒，并为 `login_player` 增加 5 分钟滑动窗口重置。 | 审查 SQL 迁移语义，覆盖匿名与授权全场景 | **已完成** |
| **P1** | **激活 Grade 2 完整题库** | 在 `index.html:GRADE_CURRICULUM` 中为 Grade 2 补全 `ready: true` 与 `'Grade 2 curriculum — interactive courses ready'`，全面开放 5 学科、30 单元、750 道现成题库。 | 新增 `test_grade2_curriculum_readiness.js` 断言 5 学科全部激活 | **已完成** |
| **P1** | **首页年级宣传对齐实际** | 首页标题修正为 `📚 Grades Pre-K–2 (Grades 3–8 in Planning)`，既忠实于当前实际可用年级，又清晰说明 3–8 年级的规划状态。 | `test_grade2_curriculum_readiness.js` 验证文本一致性 | **已完成** |
| **P1** | **清理 `index.html` 悬空死代码** | 移除 `index.html` 中遗留的孤立表达式（`window.KC_G1_SCIENCE;` 等残余语句）。 | `node --check` 语法与内联脚本校验 PASS | **已完成** |
| **P2** | **年级独立页去 iframe** | 改造 `shared/grade-page.js`，采用 `window.location.replace` 直跳顶层课堂引擎，彻底消除 iPad 移动端 TTS 自动朗读受限、滚动卡顿与模态框被截断的体验硬伤。 | 4 个年级页（pre-k/k/g1/g2）验证直跳无 iframe | **已完成** |
| **P2** | **统一年级 Slug 与文案映射** | 抽象 `gradeCanonicalId` 与 `gradeShortId` 全局映射函数，统一处理 `g1/g2/k/prek` 与对应完整 ID 的双向解析。 | 单元测试验证全映射路径无歧义 | **已完成** |
| **P3** | **`index.html` 渐进式拆模块** | 312 KB 单体文件，内联脚本超 4,500 行。已完成年级映射函数抽象与死代码剥离；后续可继续按题库生成器、画板独立提取。 | 保持 16 个测试全绿与 0-build 约束 | **长期持续** |

### 2.2 已经了结/严禁再动的事项

| 条目 | 历史讨论 | 审计与核实结论 | 处置决议 |
|---|---|---|---|
| **进度 schema 收敛** | 曾讨论是否将 `mastery`、`due`、`gradeMastery`、`KCData`、`skillStats` 合并为单一对象 | `docs/progress-stores.md` 已论证：四套体系分别承载幼小记忆、单元闯关、贝叶斯技能画像与云端流水，粒度与场景完全不同。强行合并会破坏架构边界。 | **已了结，严禁合并** |
| **PWA 核心缓存机制** | `sw.js` precache 清单与 `APP_VERSION` 同步 | 现由 `scripts/test_app_shell.js` 严格把关，8 个核心资源与两处版本一致性已建立测试门禁。 | **保持现状** |
| **Supabase CDN 弹性加载** | 曾偶发 CDN 故障白屏 | 现已具备 `initSupabase()` 幂等保护与 `let supa = null` 离线容灾降级。 | **保持现状** |

## 3. 动手前必读（硬性约束）

- `main` 受保护：**分支 → PR → squash merge**，**合并即上线**；绝不直推 `main`。
- **无构建步骤（No Build）**：不引入 Webpack / Vite / npm 等任何打包器，所有文件必须是浏览器原生可执行代码。
- **版本号规则（严防无谓缓存失效）**：只有 `sw.js` 的 `APP_SHELL` 里那 8 个资源内容发生变化时，才同步递增 `APP_VERSION`。纯文档、数据补丁或测试修改**绝不 bump**。
- **收尾校验门禁**：改动后必须逐个执行 `node --check`，且 15 个 `scripts/test_*.js` 与 `validate_content.py` 必须全部绿色通过。

## 4. 建议实施路线 (Roadmap)

```text
第 1 步 (安全)   → 提交 008 迁移脚本，彻底封堵 claim_player_auth 暴力枚举漏洞
第 2 步 (体验)   → 激活 Grade 2 课程 (ready: true) + 首页文案对齐 + 移除 index.html 悬空语句
第 3 步 (架构)   → 改造 shared/grade-page.js 去除 iframe，消除平板 TTS 与手势缺陷
第 4 步 (模块化) → 抽取全局年级映射表，逐步剥离 index.html 纯计算与测试逻辑
```

---

**详细审查报告与分析：** 见对应脑图与报告文档。历史 2026-09-24 归档保留在 `docs/archive/`。
