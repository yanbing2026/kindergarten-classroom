# AGENTS.md — kindergarten-classroom (BlockQuest Classroom)

面向所有在这个仓库干活的人与 AI（Hermes、ChatGPT、Meta AI …）。动手前先读这份。

## 这是什么
面向平板的**单页幼儿园/一年级补充学习 PWA**（字母、数字、英语、中文、西语、数学），离线优先，
朗读用浏览器内置 TTS，**无外部 AI API、无服务器**。
线上：https://yanbing2026.github.io/kindergarten-classroom/

## 构建
**没有构建步骤**（no build、no npm、no generator）：`index.html`、`js/`、`data/`、`shared/`、
`sw.js` 都是手写源文件，直接编辑。不要引入打包器。

## 测试
```bash
python3 tools/validate_content.py     # 内容校验：VOCAB_LEVELS/SCIENCE_LEVELS 必填字段、重复 id、缺图
node --check <file>                   # 对 js/、shared/、data/*.js 与 sw.js 逐个跑
```
CI：`.github/workflows/validate.yml`（push + PR 自动跑；内容校验告警不阻断）。

## 发布
`.github/workflows/pages.yml`：push 到 `main` → `actions/deploy-pages`，artifact 为整仓（`.`）。
合并进 `main` 即上线。
- 线上 `index.html` 应与 `main` 逐字节一致（`curl -s <线上>/index.html | sha256sum` == 本地文件的 sha256；
  Pages 可能短暂服务旧构建，等一两分钟再比）。
- **站点（site 配置）丢了就什么都发不出去**：`gh api .../pages` 返回 404 + 工作流在 Configure Pages 步骤失败。
  **已核实（2026-10-01）**：清理 origin 旧分支时删掉了 Pages source 指向的
  `improvement/p1-learning-experience`，整个站点随之消失。旧版本节曾写"那只是残留配置、不用去改"——
  **那句是错的，别再照着做**。现在 `configure-pages` 带 `enablement: true`，站点会在下次 push 到 `main` 时自动重建。
- **删分支前先看 `gh api repos/yanbing2026/kindergarten-classroom/pages` 的 `source.branch`**：它指向的分支不能删。
- 故障排查与手动重建步骤：`docs/pages-recovery.md`。

## 绝不手改的生成文件
本仓库**没有生成文件**，全部是手写源。但有两条硬约束：
- `sw.js` 的 `APP_VERSION` / `CACHE_NAME` 必须与 `index.html` 里的 `APP_VERSION` 同步，
  否则用户拿到旧缓存（改了资源不 bump = 白改）。
- 缓存资源列表也是手工维护的：新增/改名文件后要同步进 `sw.js` 的预缓存清单。

## 流程（main 已保护）
1. 开分支（`feat/…`、`fix/…`）→ 提交 → 开 PR。**不要直接推 `main`**（已禁止直推/强推/删分支，对管理员同样生效）。
2. PR 里写清：改了什么 + `validate_content.py`、`node --check` 的结果。
3. 仓库里不放任何密钥。
