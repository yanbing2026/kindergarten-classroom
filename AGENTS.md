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
**合并进 `main` 不等于上线。** 当前是 Cloudflare Pages 直传部署，没有 GitHub Actions 部署工作流
（`pages.yml` / `deploy-pages.yml` 都已移除）。完整步骤、连接器调用形状和故障表见
**`docs/pages-recovery.md`**；这里只留结论：

1. 从 `origin/main` 导出树 → 用 `pages_deploy.py` 上传 → 由 Cloudflare 连接器创建 deployment。
2. 部署后必须跑 `pages_deploy.py verify`，并**单独比对 `index.html` 与 `sw.js` 的 sha256**：
   ```bash
   curl -sL https://blockquest-classroom.pages.dev/index.html | sha256sum
   curl -sL https://blockquest-classroom.pages.dev/sw.js | sha256sum
   git show origin/main:index.html | sha256sum
   git show origin/main:sw.js | sha256sum
   ```
   **HTTP 200 不算上线证据，四个哈希两两相等才算。** `/x/index.html` 会 308，`curl` 必须加 `-L`。
3. 只更新了 HTML 层而漏掉 `sw.js` / 年级页 = 部分部署。2026-11-01 就发生过一次：
   `data/`、`js/`、CSS 是新的，`index.html`、`sw.js`、4 个年级页仍是旧版，Grade 2 在线上仍显示 `BUILDING`。
4. GitHub Pages 站点配置与旧分支的故事只作历史教训保留在 `docs/pages-recovery.md`，
   **不要**再把 `gh api .../pages` 当成当前发布机制。

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
