# Pages 站点恢复手册（`docs/pages-recovery.md`）

面向：任何改动这个仓库的 CI / 发布流程的人。记录 2026-10-01 真实事故（PR #56）的根因、
恢复步骤与验证方法。**这份是操作手册；`AGENTS.md` 只保留结论和指向这里的链接。**

## 症状

- 线上页面 404 / 白屏，或长时间停在旧构建；
- `gh api repos/yanbing2026/kindergarten-classroom/pages` 返回 **404**（别读成"仓库没有 Pages"）；
- `Deploy to GitHub Pages` 工作流在 **Configure Pages** 步骤失败（`Get Pages site failed`），
  后面的 Upload / Deploy 全部跳过，所以 `main` 上明明有新提交，线上什么也没变。

## 根因（已核实 2026-10-01 / 2026-10-04）

Pages **站点（site 配置）** 当时把 source 指向旧分支 `improvement/p1-learning-experience`。
清理 origin 上的旧分支时把这个分支删了 —— **删掉被 source 指向的分支，等于把整个站点一起删掉**：
`gh api .../pages` 从此 404，之后每次部署都失败。

旧版 `AGENTS.md` 的「发布」一节曾写：`gh api .../pages` 里那条 legacy 源（`improvement/p1-learning-experience`）
是"**残留配置，不是发布源，别被它误导，也不用去改**"。**那句话是错的**，而且正是照着它清理分支才炸的。
错的来源：2026-09-27 的核对只比对了线上 `index.html` 与 `main` 的 sha256，没有验证 `source` 到底在起什么作用
（结论碰巧是对的——那次发布确实走 Actions——但"不用管 source"这个推论是错的）。

## 现在怎么恢复（首选，已就位）

`pages.yml` 里 `actions/configure-pages@v5` 带了 `enablement: true`（PR #56）：站点缺失时该步骤会
**重新创建站点再继续部署**。所以正常路径就是 —— **往 `main` 推一次（或手动触发工作流）即自愈**。

## 手动恢复（不想等一次 push 时）

```bash
# 1. 站点是否缺失：404 = 缺失；409/200 = 已存在（不用重建）
gh api repos/yanbing2026/kindergarten-classroom/pages || true

# 2. 重建站点（Actions 构建型；已存在时返回 409 "GitHub Pages is already enabled."，属正常）
gh api --method POST repos/yanbing2026/kindergarten-classroom/pages -f build_type=workflow

# 3. 重新部署
gh workflow run pages.yml              # 或：gh run rerun <失败的-run-id>
```

## 验证（三步都要过，缺一步都别宣布修好）

```bash
gh api repos/yanbing2026/kindergarten-classroom/pages    # 期望：build_type=workflow、source.branch=main，不是 404
gh run list --workflow=pages.yml --limit 3               # 期望：最新一次 success
curl -s https://yanbing2026.github.io/kindergarten-classroom/index.html | sha256sum
sha256sum index.html                                     # 两个哈希必须相同（Pages 可能短暂服务旧构建，等 1-2 分钟再比）
```

`curl -sI` 返回 200 不算验证：页面可以 200 而 JS 已死；哈希比对才是"线上 == 仓库"的证据。

## 硬约束（避免再犯）

- **删分支前先查 source**：`gh api repos/yanbing2026/kindergarten-classroom/pages` 里的
  `source.branch` 指向哪个分支，那个分支就不能删；要删先把它切回 `main`（或用 `POST /pages` 重建为 `build_type: workflow`）。
- 站点类型是 `build_type: workflow`（Actions 部署），**不是** "Deploy from a branch"；artifact 是整仓 `.`。
- 2026-10-04 起 origin 只剩 `main` 一个分支（旧 feature/fix 分支已全部清理），这是当前的正常状态。
- 发布相关改动：动了缓存资源就要同步 `sw.js` 的 `APP_VERSION`（与 `index.html` 的 `APP_VERSION` 保持一致），
  规则见 `AGENTS.md`。
- 工作流里 `concurrency: pages` + `cancel-in-progress: true`：连续推 `main` 时前一次部署会被取消，属预期。
