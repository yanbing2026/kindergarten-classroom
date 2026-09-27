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
**已核实（2026-09-27）**：线上 `index.html` 与 `main` 逐字节一致（sha256 相同），发布确实走 Actions；
`gh api .../pages` 里显示的那条 legacy 源（`improvement/p1-learning-experience`，2026-09-06 停更）
是**残留配置，不是发布源**，别被它误导，也不用去改。

## 绝不手改的生成文件
本仓库**没有生成文件**，全部是手写源。但有两条硬约束：
- `sw.js` 的 `APP_VERSION` / `CACHE_NAME` 必须与 `index.html` 里的 `APP_VERSION` 同步，
  否则用户拿到旧缓存（改了资源不 bump = 白改）。
- 缓存资源列表也是手工维护的：新增/改名文件后要同步进 `sw.js` 的预缓存清单。

## 流程（main 已保护）
1. 开分支（`feat/…`、`fix/…`）→ 提交 → 开 PR。**不要直接推 `main`**（已禁止直推/强推/删分支，对管理员同样生效）。
2. PR 里写清：改了什么 + `validate_content.py`、`node --check` 的结果。
3. 仓库里不放任何密钥。
