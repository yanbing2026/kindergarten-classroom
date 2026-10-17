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

线上：**Cloudflare Pages 项目 `blockquest-classroom`**（生产分支 `main`）→ https://blockquest-classroom.pages.dev/
- 部署命令（需要本机 `~/.hermes/.env` 里的账户级 token；只在单条命令上注入，**不要全局 export**）：
  ```bash
  CLOUDFLARE_API_TOKEN=$(grep -m1 '^KINDERGARTEN_CLASSROOM_CF_API_TOKEN=' ~/.hermes/.env | cut -d= -f2-) \
  CLOUDFLARE_ACCOUNT_ID=$(grep -m1 '^KINDERGARTEN_CLASSROOM_CF_ACCOUNT_ID=' ~/.hermes/.env | cut -d= -f2-) \
    npx wrangler pages deploy . --project-name blockquest-classroom --branch main
  ```
- **从仓库工作树部署**（不要从 `git archive` 解出的副本）：否则部署记录里没有 commit，答不出"线上是哪个提交"。
- 旧的 GitHub Pages 工作流已删除；`https://yanbing2026.github.io/kindergarten-classroom/` 仍能打开但**不再更新**。
- 验证：全站逐路径比对（`pages_deploy.py verify` 退出码 0）且与 `origin/main` 对树无差异。
  **"部署成功"那行字不算证据**；**`200` 也不代表文件存在**（Cloudflare Pages 把未知路径回落到 `index.html`）。
- **换 origin 是有代价的**：已安装的 PWA 仍指旧 origin，localStorage 进度不跨 origin。再迁移时先让用户导出进度。
- 完整手册（部署/验证/已知故障/Git 集成状态/2026-10-01 GH Pages 事故教训）：`docs/pages-recovery.md`。

## 绝不手改的生成文件
本仓库**没有生成文件**，全部是手写源。但有两条硬约束：
- `sw.js` 的 `APP_VERSION` / `CACHE_NAME` 必须与 `index.html` 里的 `APP_VERSION` 同步，
  否则用户拿到旧缓存（改了资源不 bump = 白改）。
- 缓存资源列表也是手工维护的：新增/改名文件后要同步进 `sw.js` 的预缓存清单。

## 流程（main 已保护）
1. 开分支（`feat/…`、`fix/…`）→ 提交 → 开 PR。**不要直接推 `main`**（已禁止直推/强推/删分支，对管理员同样生效）。
2. PR 里写清：改了什么 + `validate_content.py`、`node --check` 的结果。
3. 仓库里不放任何密钥。
