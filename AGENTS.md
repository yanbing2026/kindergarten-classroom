# AGENTS.md — kindergarten-classroom (BlockQuest Classroom)

面向所有在这个仓库干活的人与 AI（Hermes、ChatGPT、Meta AI …）。动手前先读这份。

## 这是什么
面向平板的**单页幼儿园 / 一年级 / 二年级补充学习 PWA**（字母、数字、英语、中文、西语、数学、科学、社会、写作），
离线优先，朗读用浏览器内置 TTS，**无外部 AI API、无应用服务器**。
线上：https://blockquest-classroom.pages.dev/

> 历史地址 `https://yanbing2026.github.io/kindergarten-classroom/` 仍可能在线，但**不是发布目标**，也可能长期停在旧版本。

## 构建
**没有构建步骤**（no build、no npm、no generator）：`index.html`、`js/`、`data/`、`shared/`、
`sw.js` 都是手写源文件，直接编辑。不要引入打包器。

## 测试
```bash
python3 tools/validate_content.py                 # 内容校验（含 G1/G2 题库深度，需 node 才能跑题库部分）
node --check <file>                               # 对 js/、shared/、data/*.js 与 sw.js 逐个跑
for t in scripts/test_*.js; do node "$t" || exit 1; done
```
CI：`.github/workflows/validate.yml`（push + PR 自动跑；**所有** `scripts/test_*.js` 与内容校验都阻断）。

## 发布
**合并进 `main` = 上线。** `.github/workflows/deploy-pages.yml` 在 push 到 `main` 时用 wrangler
把该提交的跟踪树直传到 Cloudflare Pages（项目 `blockquest-classroom`），部署前先跑与 `validate.yml`
一致的阻断门（JS 语法、内联脚本、全部 `scripts/test_*.js`、内容校验）。需要 repo secrets
`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`（缺任一，job 会在第一步显式失败）。

1. **合并后必须看那次 run**：`gh run list --branch main`。部署失败 = 线上仍是上一个版本，
   Actions 的红灯就是唯一的告警，merge 成功不代表上线。
2. **线上的字节才是证据**，不是绿灯：
   ```bash
   curl -sL https://blockquest-classroom.pages.dev/index.html | sha256sum
   curl -sL https://blockquest-classroom.pages.dev/sw.js | sha256sum
   git show origin/main:index.html | sha256sum
   git show origin/main:sw.js | sha256sum
   ```
   **HTTP 200 不算上线证据，四个哈希两两相等才算。** `/x/index.html` 会 308，`curl` 必须加 `-L`；
   部署后约 45 秒内边缘可能仍返回旧字节，等一会儿再验。
3. 只更新了 HTML 层而漏掉 `sw.js` / 年级页 = 部分部署。2026-11-01 就发生过一次：
   `data/`、`js/`、CSS 是新的，`index.html`、`sw.js`、4 个年级页仍是旧版，Grade 2 在线上仍显示 `BUILDING`。
4. **手动兜底**：workflow 坏了或需要从别的 ref 重推时，跑 `~/.hermes/scripts/kc_deploy_pages.sh [ref]`
   （upload-token → 资产上传 → 建 deployment → 轮询 → 逐路径 verify）。陷阱与两种 token 的判据见
   `docs/pages-recovery.md`。
5. GitHub Pages 站点配置与旧分支的故事只作历史教训保留在 `docs/pages-recovery.md`，
   **不要**再把 `gh api .../pages` 当成当前发布机制。

## 账号后端（Supabase）
账号 / 云同步走 Supabase（项目 URL 与 publishable key 写死在 `index.html` 的 `initSupabase()` 里；
表结构与 RPC 在 `supabase/migrations/002–009`，其中 009 是枚举防护 + 限流 + `rotate_pin` /
`delete_player` / `release_player_auth`）。**注意仓库里没有 `001`**：`players` 表 + `kc_current_account`
相关基础 SQL 只存在于 Hermes 技能 `kindergarten-classroom-dev` 的 `references/supabase-accounts.md`，
重建项目时必须先从那里取基础 schema，再按序跑 002–009。

**2026-11-01 实测：`sjqhcpbdgaeapljbllhp.supabase.co` 已不解析（NXDOMAIN），账号功能在线上不可用。**
线上表现：创建/登录返回 "Network error, try again."，应用本身不崩、本地进度（`kc_progress_v1`）不受影响。
恢复顺序：重建项目 → 依次执行 001–009 → 把新的 project URL + publishable key 替换进 `initSupabase()` →
bump `APP_VERSION`（PostgREST 端点变了，缓存必须换）。

## 绝不手改的生成文件
本仓库**没有生成文件**，全部是手写源。但有两条硬约束：
- `sw.js` 的 `APP_VERSION` / `CACHE_NAME` 必须与 `index.html` 里的 `APP_VERSION` 同步。
  **`APP_SHELL` 里的任何资源（HTML、JS、CSS、题库）一改就必须 bump `APP_VERSION`**，
  否则装过 PWA 的平板会长期跑旧代码。`scripts/test_app_shell.js` 会检查两处版本一致。
- 缓存资源列表是手工维护的：新增/改名页面、脚本、样式或题库后，必须同步进 `sw.js` 的 `APP_SHELL`。
  `scripts/test_offline_shell.js` 会解析 `index.html` 与 4 个年级页，漏一个就红。

## 流程（main 已保护）
1. 开分支（`feat/…`、`fix/…`）→ 提交 → 开 PR。**不要直接推 `main`**（已禁止直推/强推/删分支，对管理员同样生效）。
2. PR 里写清：改了什么 + `validate_content.py`、`node --check`、`scripts/test_*.js` 的结果。
3. 仓库里不放任何密钥。
