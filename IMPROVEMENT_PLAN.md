# BlockQuest Classroom — Improvement Plan（2026-11-01 复审）

**审查基准：** `main` @ `b1f2ca1`（2026-11-01） · **线上：** `https://blockquest-classroom.pages.dev/`
**审查方式：** 逐文件读源码 + `python3 tools/validate_content.py` + 线上 sha256 实测 + Git 历史比对。
**未能执行：** 本机没有 `node`（`command not found`），16 个 `scripts/test_*.js` 未在本地运行；Supabase 线上库状态无法读取（008 是否已应用未验证）；未做真机 iPad 测试。下文凡依赖这三项的地方都标了 **待验证**。
**上一版计划：** 已归档到 `docs/archive/improvement-plan-2026-11-01-pre-review.md`（其中"已完成"的表基本属实，但有 6 处数字/机制与现状不符，见 §7）。

**一句话结论：** 功能在增加，但**发布链、账号数据链、离线承诺**这三处与文档和计划写的不一致。先把这三条修到"可证明"，再谈拆 `index.html`。

---

## 0. 实施状态（2026-11-01，分支 `fix/p0-p1-audit`）

已在本分支完成并验证：

| 计划项 | 状态 | 证据 |
|---|---|---|
| §2.2 发布文档（`AGENTS.md` / `docs/pages-recovery.md`） | ✅ | 删除 GitHub Pages / `pages.yml` / "合并即上线"；验证清单新增 `index.html` + `sw.js` 单独哈希 |
| §3.1 创建账号清空本地进度 | ✅ | `scripts/test_account_flow.js` 覆盖创建、登录、跨账号、二次登录 |
| §3.2 归一化同步账户作用域 | ✅ | `scripts/test_data_layer.js` 覆盖纯字符串账户、队列、失败结果 |
| §3.3 同设备二次登录 | ✅ | `test_account_flow.js` 覆盖复用 session 与共享平板冲突重试 |
| §3.4 刷新后云同步空转 | ✅ | PIN verifier 改为 `sessionStorage`；无凭据时显示"重新登录"，停止 5 秒重试 |
| §3.5 `saveProgress` 兜底 | ✅ | `test_account_flow.js` 覆盖配额异常 + 只提示一次 |
| §3.6 账号安全 | ✅（仓库侧） | `supabase/migrations/009_account_security.sql`：枚举防护、限流、不再回传凭据、`rotate_pin`、`delete_player`、`release_player_auth` |
| §4 离线壳 | ✅ | `APP_SHELL` 33 项（含按需加载的 G1/G2 题库）；按路径导航回退；`test_offline_shell.js`；图片缓存独立版本；更新提示 |
| §5.2 G1 元数据 + 每单元 ≥8 题 | ✅ | `data/grade-1/{extra,core}.js`；G1 主科 192 题；`test_content_depth.js` |
| §5.3 21 KB 死代码 | ✅ | 内联 G1 数学题库已删；`test_content_depth.js` 防回潮 |
| §5.4 校验器 / CI | ✅ | 按文件查重、跳过 `L\d+`、纳入 G1/G2；CI 自动发现全部 `scripts/test_*.js`，内容校验改为阻断 |
| §6.2 年级题库按需加载 | ✅（部分） | `index.html` 不再同步加载 G1/G2 题库；进入课程时 `ensureGradeData()` 注入脚本，先渲染加载态，失败可重试；`test_offline_shell.js` 验证懒加载题库仍在离线缓存 |
| §6.3 标题可读性 / manifest | ✅（部分） | 年级题目标题改用 clear 字体；首页今日冒险改为原生 `<button>`；manifest 增加 `id`、横竖屏自适应、年级 shortcuts |
| §9 PR-G 家长自助账号管理 | ✅ | 家长面板接入 `rotate_pin` / `delete_player`；支持导出 + 导入备份；`test_parent_account_security.js` 覆盖改 PIN、错 PIN、删号清理与导入合并 |

## 0.1 部署记录（2026-11-01 已完成）

- PR #69 于 2026-11-01 11:57Z 合并进 `main`（`1aa85a4`），`Validate` 绿。
- 走**账号级 API token**（不需要 Cloudflare 连接器）：`GET …/upload-token` → `pages_deploy.py upload`
  → `POST /accounts/{id}/pages/projects/blockquest-classroom/deployments`（multipart：`manifest` +
  `branch=main` + `commit_hash`）。deployment `98212a38-57d2-464a-8c85-f8a981506d65`，stage `deploy: success`。
- `pages_deploy.py verify`：**170/170 路径 200 且逐字节相同，anomalies 0**。
- 四条哈希两两相等：`index.html` `38cc9219dfc843b9…df2920e`、`sw.js` `0bc2474621efee6e…0885197b`
  （本地导出树 vs 线上实际取回）。
- 线上实测：`APP_VERSION = 'v2-20261101-audit-final'`、Grade 2 显示 `PLAY NOW`、`/grade-2/` 返回
  自己的文档（不再是 iframe）、SW 缓存 **33/33** 项、Grade 2 数学题可答且计分、控制台 0 错误。

仍未完成 / 新发现：

- **线上 Supabase 后端已不存在（2026-11-01 实测）**：`sjqhcpbdgaeapljbllhp.supabase.co` 在
  `1.1.1.1`、`8.8.8.8` 上均 **NXDOMAIN**（`supabase.co` 本身正常解析），浏览器 `fetch` 直接
  `TypeError: Failed to fetch`，线上创建账号显示 "Network error, try again."（应用不崩、本地进度不受影响）。
  即：**008 / 009 迁移没有目标库可应用**。要恢复账号功能只能重建项目 → 先补基础 schema（仓库里缺
  `001`，基础表 SQL 只在 Hermes 技能 `kindergarten-classroom-dev/references/supabase-accounts.md`）
  → 按序跑 002–009 → 把新 URL + publishable key 写回 `index.html:237`。
- **§6.2 CSS 拆分 / §6.3 读屏播报**：题库按需加载已完成；首屏 CSS 仍未拆分，答题时 TTS 与
  `aria-live` 仍可能重复播报，留作后续小步优化。

---

## 1. 先看这几条（按影响排序）

| # | 结论 | 证据等级 |
|---|---|---|
| 1 | **线上 HTML 层不是 `main`**：`index.html`、`sw.js`、4 个年级页、`shared/grade-page.js` 都是旧版（`v2-20261004-a11y-buttons`），而 `data/`、`js/`、CSS 是新版 —— 典型的**部分部署**。Grade 2 仍显示 `BUILDING`，年级页仍是 iframe（**2026-11-01 已修复：见 §0.1**） | 已复核（逐文件 sha256） |
| 2 | **创建账号会清空孩子本地进度**（`cloudCreate(name,pin,{})` + 用云端 `{}` 覆盖本地） | 静态（代码路径确定） |
| 3 | **归一化云端同步从未工作过**：`kc_current_account` 存的是纯字符串，`data-layer.js` 却按 JSON 对象解析 | 静态（可写测试复现） |
| 4 | **同一设备第二次登录必然绑定失败**（每次 `signOut` + 新建匿名用户，`claim_player_auth` 因 uid 不匹配报错），且错误被吞掉 | 静态 + 008 逻辑 |
| 5 | **离线承诺不成立**：`APP_SHELL` 只有 8 个文件，13 个 head 脚本、CSS、题库都不在预缓存里 | 已复核（`sw.js` 8 项） |
| 6 | **账号层可被枚举 + 凭据外泄**：匿名可调 `get_player_salt`；`login_player`/`create_player` 把 `pin_hash` 返回给浏览器 | 静态（004/008 SQL） |
| 7 | **Grade 1 每单元只有 4 题、无 `id`**，重玩完全重复，自适应统计失效；页面却写"30+ questions" | 已复核（数据文件） |

---

## 2. P0：发布链（先让"上线"可证明）

### 2.1 线上与 `main` 不一致（已复核）

| 对象 | `main` | 线上 | 判定 |
|---|---|---|---|
| `index.html` | `7ff4dbc…` / 312,548 B / `v2-20261101-grade2-ready` | `eef77b0…` / 312,895 B / `v2-20261004-a11y-buttons` | **不同** |
| `sw.js` | `57500ea…` | `9fe2da8…` | **不同** |
| `shared/grade-page.js` | `d978652…`（`location.replace`） | `11ad698…`（仍 `createElement("iframe")`） | **不同** |
| `{pre-k,kindergarten,grade-1,grade-2}/index.html` | 4 个新版 | 4 个旧版 | **不同** |
| `data/**`、`js/*.js`、`shared/*.css`、`manifest.json` | — | 与本地逐字节相同 | 相同 |

复核命令：

```bash
curl -sL https://blockquest-classroom.pages.dev/index.html | sha256sum   # eef77b0…
git show main:index.html | sha256sum                                      # 7ff4dbc…
curl -sL https://blockquest-classroom.pages.dev/sw.js | sha256sum         # 9fe2da8…
curl -sL https://blockquest-classroom.pages.dev/shared/grade-page.js | grep iframe   # 线上仍是旧版
```

**这说明了什么：** `data/`、`js/`、CSS 是新的，**HTML 层和 SW 是旧的** —— 这是一次**部分上传/未验证**的部署，不是"Pages 短暂服务旧构建"。同时 GitHub Pages（`AGENTS.md` 里写的地址）也在服务同一个旧版。

**影响：** 首页仍是 "Grades Pre-K–8"；线上 `GRADE_CURRICULUM` 里 Grade 2 的 `ready:true` 数量是 **0**（因此仍显示 `BUILDING`）；008 迁移是否上线完全未知。上一版计划里"`main` 与线上逐字节一致"已经不成立。

### 2.2 文档与发布机制互相矛盾

- `AGENTS.md:8` 写线上是 `yanbing2026.github.io/kindergarten-classroom/`（旧站，仍在服务旧版）。
- `AGENTS.md:22` 写 `.github/workflows/pages.yml` 会在 push 时部署 —— **该文件在 `c1d6980` 已删除**，现仓库只有 `validate.yml`。
- `docs/pages-recovery.md` 写的是 Cloudflare Pages **手动直传**，并强调"合并进 `main` 不会自动上线"。

**动作（PR-A，半天）：**
1. 按 `docs/pages-recovery.md` 重新部署 `main`，跑完 `pages_deploy.py verify`（逐文件 sha 比对，`/x/index.html` 记得 `-L`）。
2. 在 `docs/pages-recovery.md` 的验证清单顶部加一条："**`index.html` 与 `sw.js` 必须单独比对**"（本次就是这两个漏了）。
3. 重写 `AGENTS.md`：域名改成 `blockquest-classroom.pages.dev`；删掉 `pages.yml` 段落；把"合并进 `main` 即上线"改成"合并后需手动/连接器部署并 verify"。
4. 修正上一版计划中的 4 个事实错误（§7）。

**验收：** 上面四条命令的哈希两两相等；`AGENTS.md` 中不再出现 `github.io` 和 `pages.yml`；随机挑 `/grade-2/`、`/data/grade-2/core.js`、`/shared/main.css` 与 `origin/main` 逐字节一致。

---

## 3. P0/P1：账号与数据（会丢孩子进度）

### 3.1 创建账号清空本地进度（P0，数据丢失）

`index.html:400` 把空对象传给服务端，`:408` 又用返回值覆盖本地：

```js
const result = await cloudCreate(name, pin, {});                       // :400
localStorage.setItem(accountProgressKey(key),
  JSON.stringify(result.data?.progress || {}));                        // :408
...
progress = loadProgress();                                             // :434 → 星星/掌握度归零
```

原来的匿名进度在 `kc_progress_v1`，账号进度在 `kc_account_progress_v1_<key>`，两者之间没有任何迁移。

**修复：** 创建时传 `progress`；若云端为空而本地非空，以本地为准上传；登录时若两边都有数据，按 `stars`/`gradeMastery` 取并集或让家长选择。保留 `kc_progress_v1` 作为首次开号的迁移源。
**验收（新测试 `scripts/test_account_flow.js`）：** 本地 `stars=12` → 创建账号 → 本地与云端都是 12；刷新后仍是 12；再登录另一台"设备"（空 localStorage）也是 12。

### 3.2 归一化同步整条链是断的（P0）

```js
// js/data-layer.js:18
function currentAccount() {
  return safeJson(localStorage.getItem(ACCOUNT_KEY) || '', null);  // "leo" → JSON.parse 抛错 → null
}
// js/data-layer.js:45  → accountKey: '' （永远是空串）
// js/data-layer.js:143 → queue.filter(x => x.accountKey === accountKey && accountKey) → 恒为空
```

而 `index.html:241/277` 写入的是**纯字符串**：

```js
function getCurrentAccount(){ return localStorage.getItem('kc_current_account') || ''; }
localStorage.setItem('kc_current_account', key);   // key = name.toLowerCase()
```

**影响：** `flushNormalized()` 永远 `{ok:true, sent:0}`；队列被 `saveQueue` 截断到 100 条，事件**静默丢弃**；`KCData.status().account` 永远是 `null`。上一版计划把"云端同步"当成已完成，实际没有一条事件到过 Supabase。

**修复：** 二选一，别两边各写一套 —— 让 `index.html` 写 `{key,name}` JSON，或让 `currentAccount()` 读 `kc_accounts_v1[key]` 还原 `{key,name}`。推荐后者（不动现有存储格式）。
**验收（新测试）：** 设 `kc_current_account='leo'` + `kc_accounts_v1` → `currentAccount().name==='leo'`；`enqueue` 一条后，`scopedQueue` 长度为 1；`status().account.name==='leo'`。

### 3.3 再次登录绑定必失败（P1）

```js
if(session){ await supa.auth.signOut(); session=null; }        // :335
const anon = await supa.auth.signInAnonymously();              // :336 → 新 uid
await supa.rpc('claim_player_auth', {p_name:name, p_pin_hash:currentPinVerifier}); // :338
```

`008_harden_claim_player_auth_throttling.sql` 里有：

```sql
if target.auth_user_id is not null and target.auth_user_id <> uid then
  raise exception 'player account is already linked';
```

首次认领（创建账号时或第一次登录）成功。之后再登录：先 `signOut` 掉 A，再建 B，认领时 `A <> B` → 直接报错。调用方只 `await` 不看返回值，于是**静默降级**，`playerId` 不再被设置（登出后即为空）。

**修复：** 复用现有匿名 session（别 `signOut`）；或把归属改成"RPC 内部用 name+hash 授权"，不再依赖 `auth_user_id` 独占；失败必须冒泡到账号条，而不是吞掉。
**验收：** 同一浏览器连续登录两次，第二次 `ensureNormalizedAuth` 返回 `ok:true`，`KCData.playerId()` 不变；用错 PIN 时返回可读错误。

### 3.4 刷新页面后云同步空转（P1）

`currentPinVerifier`（`index.html:296`）只在登录时赋值，刷新即丢失；但 `saveProgress()`（`:497`）仍会 `scheduleCloudProgressSync()`，`cloudSaveProgress`（`:350`）因为凭据为空返回 `false`，`syncCloudProgress`（`:376`）于是标记"offline"并**每 5 秒重试一次**（`:389`），永远不停。

**修复：** 明确凭据生命周期 —— session 内有效（`sessionStorage`）或刷新后要求重新输 PIN 才允许云写；同步失败要区分"离线""需要重新登录""服务端错误"，不要无限重试。
**验收：** 刷新后 10 秒内无重复 RPC；断网时显示"Saved locally"，恢复后一次成功即停。

### 3.5 `saveProgress` 没有保护（P1）

`index.html:498` 直接 `localStorage.setItem(...)`，没有 `try/catch`。iPad 隐私模式或配额满时抛异常，会中断答题 handler（同一函数后面还有 `recordActivity` 和云同步）。

**修复：** 包 `try/catch`，失败时降级到内存 + 提示"设备存储已满，请导出进度"。

### 3.6 账号安全（P0，需迁移 009）

| 问题 | 位置 | 说明 |
|---|---|---|
| 账号枚举 | `004:3-14`，`grant ... to anon`（`004:84`） | 任何匿名客户端可按名字查 `pin_salt` |
| 凭据回传 | `004:30-32`、`008` 的 `select p.pin_hash` | 登录成功后把 verifier 还给浏览器；它同时是 `save_player_progress` 的 bearer 凭据 |
| PIN 太短 | `index.html:396`（4–6 位） | 在线猜测被 30 秒锁定拖慢，但 4 位只有 10⁴ 种，脚本化一天内可命中；一旦命中，响应里的 hash 就成了长期 bearer 凭据（无改 PIN/吊销机制） |
| 开号无限流 | `004:16-34` | `create_player` 没有任何限流，可刷号/占名 |
| 无改 PIN/删号 | — | PIN 忘了账号就锁死；家长无法请求删除数据 |

**动作（PR-E，迁移 `009_account_security.sql`）：**
1. `get_player_salt` 加与登录同源的限流；对不存在的名字返回**随机假 salt**（响应形态一致，杜绝枚举）。
2. `login_player` / `create_player` 不再返回 `pin_hash` / `pin_salt`。
3. PIN 最少 6 位；或者改为服务端 pepper（`pgcrypto`/HMAC），浏览器只提交派生值。
4. `create_player` 限流 + 名称规范（与前端一致）。
5. 增加 `delete_player`（需家长 PIN）与 `rotate_pin`。
**待验证：** 008 是否已应用到线上库；Supabase 是否开启了匿名登录（否则 3.3 的整条链从来没跑起来过）。

---

## 4. P1：离线与 PWA

### 4.1 `APP_SHELL` 覆盖不全（README 承诺不成立）

`sw.js:6-16` 只预缓存 8 项：

```
./  ./index.html  ./manifest.json  ./sw.js  icons/{192,512,apple,32}
```

但首页首屏需要：**13 个 head 同步脚本（531,920 B）+ `shared/main.css`（68,146 B）+ 3 个 body 脚本**，还有 4 个年级页。首次访问时这些资源在 SW 接管之前就取完了，**不会进缓存**；此时断网刷新 → 导航层能回退到缓存的 `index.html`，但子资源全部 fetch 失败 → 白屏/无样式。要到**第二次在线访问**，子资源才会被 cache-first 分支补进缓存。README 的 "After the first visit … fully offline" 不成立。

另外：离线打开 `/grade-2/` 时，SW 回退到 `./` 的 `index.html`，但浏览器地址仍是 `/grade-2/`，`<script src="data/...">` 会解析成 `/grade-2/data/...` → 404。

**动作（PR-C）：**
1. `APP_SHELL` 补齐：`shared/main.css`、`js/*.js`（3 个）、`data/**`（当前实际加载的全部）、`pre-k|kindergarten|grade-1|grade-2/index.html`。
2. 导航请求按路径匹配缓存：`/grade-2/` 命中 `./grade-2/index.html`，根路径命中 `./index.html`。
3. `cache.addAll` 是全有或全无 —— 任一 404 会让整个 install 失败，加逐个 `cache.add` 或把失败项记录出来。
4. **后果：`APP_VERSION` 规则必须改。** 现在写的是"只有 `APP_SHELL` 里那 8 个资源变化才 bump"；扩表后，题库/JS/CSS 的任何改动都需要 bump，否则装过 PWA 的平板会长期停在旧数据。同步更新 `AGENTS.md` 和测试。
5. 加更新提示：`registration.waiting` + `updatefound` → 顶部"有新版本，点此更新"，别让平板无限期跑旧代码。

**验收（新测试 `scripts/test_offline_shell.js`）：** 解析 `index.html` 里所有本地 `<script src>` 和 `<link rel=stylesheet>`，断言每一项都在 `APP_SHELL`（或明确列入"运行时缓存"白名单）；DevTools offline 冷启动首页和 `/grade-2/` 均可交互。

### 4.2 图片缓存跟着版本号走

`IMAGE_CACHE = kc-images-${APP_VERSION}`：每次 bump 都会重下 `images/` 下全部 96 张图（2.56 MB，占整仓 3.8 MB 的 67%）。建议单独用 `IMAGE_CACHE_VERSION`，只有图片本身变了才递增。

---

## 5. P1/P2：教学内容的真实深度

### 5.1 数字对齐（已复核）

| 指标 | 文档/计划写的 | 实际 |
|---|---|---|
| Grade 2 题量 | 750 | **900**（5 科 × 6 单元 × 30 题） |
| Grade 2 单元 | 30 | 30 ✓ |
| Grade 1 ELA/科学/社会/写作 | "30+ questions per unit"（`renderGradeCourse` 页脚） | **每单元 4 题**（6 单元 / 科） |
| Grade 1 数学 | — | 6 单元 × 36 题（生成器） ✓ |
| 测试数量 | 15 | **16** |

### 5.2 Grade 1 缺题目身份（P1）

`data/grade-1/{ela,science,social-studies,writing}.js` 的题目只有 `title/prompt/choices/answer/hint/explanation`，**没有 `id`/`skillId`**。而 `index.html:4228` 用 `q.id || q.lessonId || ''` 做去重，所有 G1 题都退化成空串；`data/grade-2/core.js` 早在构建期就补了 `id/gradeId/subjectKey/unitKey/skillId/difficulty`。

**影响：** 单元只有 4 题 → 重玩永远同样 4 题；自适应排序和"最近做过"去重对 G1 全部失效；统计无法定位到具体题。

**动作：** 复用 `data/grade-2/core.js` 的 `build()` 思路给 G1 生成 `id`（`g1.<subject>.<unit>.<qNN>`）、`skillId`（已有 `G1_TITLE_SKILLS` 映射可用）、`difficulty`；每单元补到 **≥8 题**（理想 12）。修正页脚文案。
**验收：** `scripts/test_content_depth.js` 对 G1/G2 同时断言：每单元 ≥8、`id` 唯一、`answer` 在 `choices` 里、`sort.answer` 是 `words` 的排列、`text.minWords>0`。

### 5.3 21 KB 死代码（P2，顺手）

`index.html:3283-3635` 是内联的 Grade 1 数学题库（21,164 B），在 `:3636` 被 `GRADE1_INTERACTIVE.math = window.KC_G1_MATH;` 整块覆盖，之后又被 `GRADE1_MATH_BANK` 覆盖一次。删掉，并加一条断言 `GRADE1_INTERACTIVE.math === window.KC_G1_MATH` 防止回潮。

### 5.4 校验器（P2）

`tools/validate_content.py`：
- 只校验幼儿园（`VOCAB/SCIENCE/MATH + 若干 category`），**完全不覆盖 G1/G2 题库**。
- 查重是全局正则 `id\s*:\s*'([^']+)'`（`:320-331`），把字母 `L` 和等级 `L1..L10`、把 `ant` 这类跨目录同名都算重复。当前 10 条警告**没有一条是同目录真重复**，属于告警疲劳，会掩盖真问题。
- CI 里是**非阻断**（`validate.yml` 的 `cstatus` 只打 ⚠）。

**动作：** 查重按目录作用域（跳过 `L\d+`，跨目录同名不算错）；纳入 G1/G2；增加"答案必须在选项里""prompt 非空""id 唯一"；先清零再把 CI 改成阻断。

---

## 6. P2：测试与性能

### 6.1 测试"绿"不等于行为对

16 个测试里大多数是 `extractFunction(...) + includes('...')` 的**源码字符串断言**（`test_a11y_concrete_gaps`、`test_html_structure`、`test_grade2_curriculum_readiness` 都是），只能证明"某段文字还在"，不能证明行为。§3 的 bug 一个都没被拦住，也没有任何测试碰 `data-layer.js`、账号流程、SW 覆盖。

**动作（每个 P0 修复都配一个行为测试）：**
- `scripts/test_account_flow.js`：假 `localStorage` + 假 `supa.rpc`，覆盖创建/登录/二次登录/刷新。
- `scripts/test_data_layer.js`：覆盖 `currentAccount`、`enqueue`/`flushNormalized` 的账户作用域。
- `scripts/test_offline_shell.js`：SW 覆盖完整性。
- `scripts/test_content_depth.js`：G1/G2 数据契约。
**验收：** 把 §3 的 bug 故意注回去，对应测试必须变红（否则测试无效）。

### 6.2 首屏体积（P2）

| 部分 | 未压缩 |
|---|---|
| `index.html` | 312,548 B |
| head 同步脚本 ×13 | 531,920 B |
| `shared/main.css` | 68,146 B |
| **首次解析合计** | **≈ 912 KB** |

iPad 上这是 1 秒级的解析/执行，且全部发生在首屏。**动作：** 年级题库按需加载（进入 `gradeCourse` 时注入 `<script>` + `defer`，`GRADE2_INTERACTIVE` 改成 getter）；CSS 拆首屏/年级两块；目标首屏 JS ≤ 150 KB（gzip 后 ≤ 45 KB）。**注意 0-build 约束：** 拆文件可以，但顶层 `const` 在多个 classic script 之间不共享，必须显式挂 `window.*`（`data/` 已经是这个模式）。

### 6.3 可访问性与字体（P2）

- 111 处 inline `onclick` → 无法加 CSP（要上 CSP 必须先消灭它们，属 P3 大工程）。
- `renderHome` 的 `today-card` 仍是 `<div onclick>`（`index.html:960`，`test_html_structure` 显式豁免了它）；里面有 `START` 按钮，键盘可用，但语义不一致。
- `.grade-lesson-title` 用 `Press Start 2P`（像素字体，0.95rem）—— 对刚开始认字的孩子不友好；题干用了 clear 字体，标题建议也换。
- 每答一题同时 `speak()` 和更新 `aria-live` 区域，读屏会重复播报；建议 `aria-live` 只放简短结果。
- 建议补 `axe-core` 自动检查 + 一条键盘走查用例（home → grade → unit → 答题）。

---

## 7. 上一版计划中的事实错误（已在归档版保留原样）

1. "`main` 与线上逐字节一致" → 已不成立（§2.1）。
2. "CI 部署：已迁移至 Cloudflare Pages（`deploy-pages.yml` …）" → **`main` 上没有这个文件**，只有 `validate.yml`；部署是手动的。
3. "Grade 2 750 道题库" → 实际 900。
4. "15 个自动化单测" → 实际 16。
5. 文件体积/行数（312,895 B / 4,608 行）是旧版数字，当前 312,548 B / 4,606 行。
6. "P2 年级独立页去 iframe 已完成" → 代码完成，但**线上还是旧版**，所以对用户尚未生效。

---

## 8. 已了结 / 不建议再动

| 条目 | 结论 |
|---|---|
| 合并 `mastery`/`due`/`gradeMastery`/`KCData`/`skillStats` | 已由 `docs/progress-stores.md` 论证，**不要再合并** |
| 年级页去 iframe | 代码已改（`shared/grade-page.js` 用 `location.replace`），只需等部署 |
| 交互块用真 `<button>` | 已完成，`test_html_structure` 有护栏 |
| Supabase CDN 失败降级 | `initSupabase()` 幂等 + `supa=null` 兜底，保持 |
| 图片动态缓存 | 思路对，只需把版本号从 `APP_VERSION` 解耦 |

---

## 9. 实施路线（按 PR 拆，先小后大）

| 顺序 | PR | 内容 | 预估 | 必须的验证 |
|---|---|---|---|---|
| 1 | **PR-A 发布可信** | 重新部署 + verify；重写 `AGENTS.md` 发布段；修本计划事实错误 | 0.5 天 | 四条哈希相等；线上 `/grade-2/` 可交互 |
| 2 | **PR-B 账号数据链** | §3.1–3.5：创建不清空、`currentAccount` 契约、二次登录、刷新凭据、`saveProgress` 兜底 + 3 个新测试 | 1–1.5 天 | 新测试；故意注回 bug 能红 |
| 3 | **PR-C 离线** | §4：扩 `APP_SHELL`、导航按路径、更新提示、图片缓存解耦、改 `APP_VERSION` 规则 + 测试 | 0.5–1 天 | 离线冷启动首页/年级页；`test_offline_shell` |
| 4 | **PR-D 内容深度** | §5.2–5.4：G1 元数据 + 每单元 ≥8 题；校验器按目录查重并纳入 G1/G2；CI 改阻断 | 1–2 天 | `test_content_depth`；`validate_content.py` 0 误报 |
| 5 | **PR-E 账号安全** | §3.6 迁移 009 + 客户端配合 | 1 天 + DB 验证 | 枚举/限流/不返回凭据 |
| 6 | **PR-F 性能/拆模块** | §6.2 按需加载；删 21 KB 死代码；CSS 拆分 | 2–3 天 | 首屏 JS ≤ 150 KB；16 个测试 + 新增全绿 |
| 7 | **PR-G 产品/合规** | PIN 找回/改 PIN/删号/导入；manifest（`id`、解锁横屏、shortcuts）；迁移台账 | 按需 | 家长可自助恢复/删除 |

**串行原因：** PR-B 会改账号流程，PR-E 会改 RPC 契约 —— 两者必须由同一个人按顺序做，否则客户端/服务端会对不上。PR-F 排在最后，避免在错误的基线上搬代码。

---

## 10. 完成定义（DoD）

每个 PR 合并前必须贴出：

```bash
python3 tools/validate_content.py                 # 0 error / 0 误报警告
for f in $(git ls-files '*.js'); do node --check "$f" || exit 1; done
for t in scripts/test_*.js; do node "$t" || exit 1; done
```

发布后必须贴出：

```bash
curl -s https://blockquest-classroom.pages.dev/ | sha256sum
git show origin/main:index.html | sha256sum
curl -s https://blockquest-classroom.pages.dev/sw.js | sha256sum
git show origin/main:sw.js | sha256sum
```

**"上线完成"的唯一标准是上面四个哈希两两相等，而不是 HTTP 200。**（`docs/pages-recovery.md` 已经写了这条，本次就是没执行。）

---

## 11. 本次审查的边界

- 没有运行 16 个 `node` 测试（本机无 node）；结论来自读源码和线上实测，凡是"测试会不会红"的判断都需要在 CI 或装了 node 的机器上复核。
- 没有连 Supabase 线上库：`008` 是否已执行、匿名登录是否开启、`player_login_attempts` 现状都 **待验证**。
- 没有真机：TTS、触摸、离线安装的体验结论来自代码与文档，不来自设备。
- Grade 2 的 900 道题只做了**结构与重复**检查（发现 18 条同文件重复题干，多为模板化提问），没有逐题人工审校答案正确性。
