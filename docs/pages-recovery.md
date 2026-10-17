# 站点部署与恢复手册（`docs/pages-recovery.md`）

面向：任何改动这个仓库的 CI / 发布流程的人。**这份是操作手册；`AGENTS.md` 只保留结论和指向这里的链接。**

- 现状线上：**https://blockquest-classroom.pages.dev/**（Cloudflare Pages 项目 `blockquest-classroom`，直传型）
- 历史：2026-10-17 之前托管在 GitHub Pages（`https://yanbing2026.github.io/kindergarten-classroom/`）。
  该站点仍在线，但**已不是发布目标**，`pages.yml` 已移除。

## 为什么现在是"手动部署"（2026-10-17 起）

Cloudflare 侧的 Git 集成本仓库接不上：

```
8000011 There is an internal issue with your Cloudflare Pages Git installation.
        If this issue persists after reinstalling your installation, contact support
```

**只在 GitHub 装 App 不够**（`Cloudflare Workers and Pages`，`github.com/apps/cloudflare-workers-and-pages`
—— 注意 slug 不是 `cloudflare-pages`，那个 404）；真正的修复是在 Cloudflare 后台
**Workers & Pages → 连接 Git** 重连一次账户级连接。接通后 push 到 `main` 即自动部署，
本节的步骤退化为"只在需要手工重推时使用"。

## 部署（手动，无需长期凭据）

工具：Hermes 主机上的 `~/.hermes/scripts/pages_deploy.py`（`manifest` / `upload` / `verify` 三个子命令）
+ `cloudflare_mcp` 连接器（它才有建 deployment 的权限）。**本机没有 Cloudflare 长期凭据，全程不需要 API token。**

```bash
cd ~/projects/kindergarten-classroom && git fetch origin

# 1) 导出要发布的树（= git 跟踪的文件，不含 .git）
rm -rf /tmp/kc-deploy && mkdir -p /tmp/kc-deploy && git archive origin/main | tar -x -C /tmp/kc-deploy

# 2) 上传令牌（30 分钟有效）：连接器 EXECUTE 调
#    GET /accounts/{account_id}/pages/projects/blockquest-classroom/upload-token  → result.jwt

# 3) 推资产（幂等：存储里已有的 blob 不会重传）
CF_UPLOAD_JWT='<上一步的 jwt>' CF_PROJECT=blockquest-classroom \
  python3 ~/.hermes/scripts/pages_deploy.py upload /tmp/kc-deploy

# 4) 打印 manifest，粘进连接器 EXECUTE 的 multipart 调用建 deployment（见下）
python3 ~/.hermes/scripts/pages_deploy.py manifest /tmp/kc-deploy

# 5) 验证（必须）
python3 ~/.hermes/scripts/pages_deploy.py verify /tmp/kc-deploy https://blockquest-classroom.pages.dev
```

第 4 步的连接器调用形状（字段名和 contentType 都不能错）：

```js
async () => {
  const manifest = { "/index.html": "<32位十六进制 sha256>", /* …每个文件一条 */ };
  const b = `----hermesForm${Date.now()}`;
  const body = [
    `--${b}`, 'Content-Disposition: form-data; name="manifest"', 'Content-Type: application/json', '', JSON.stringify(manifest),
    `--${b}`, 'Content-Disposition: form-data; name="branch"', '', 'main',
    `--${b}`, 'Content-Disposition: form-data; name="commit_hash"', '', '<origin/main 全 sha（可选，便于追溯）>',
    `--${b}--`, ''
  ].join("\r\n");
  return cloudflare.request({
    method: "POST",
    path: `/accounts/${accountId}/pages/projects/blockquest-classroom/deployments`,
    body, contentType: `multipart/form-data; boundary=${b}`, rawBody: true
  });
}
```

## 验证（三步都要过，缺一步都别宣布发布成功）

- `pages_deploy.py verify` **退出码 0**：全站每个路径 HTTP 200 且与本地/`origin/main` 逐字节一致。
- 与 `origin/main` 对树：只在本地的文件、只在远端的文件、内容不同的文件**三者都必须为空**。
- `/x/index.html` 会 **308** 跳到 `/x/`：`curl` 必须加 `-L`，否则会把好页面误判成"哈希不一致"。
- `curl -sI` 返回 200 **不算**验证：页面可以 200 而 JS 已死；哈希比对才是"线上 == 仓库"的证据。

## 已知故障与处理（均为实测）

| 现象 | 原因 | 处理 |
|---|---|---|
| `9106 Authentication failed` 建 deployment | 用了上传 JWT（它只授权 `/pages/assets/*`） | deployment 必须由连接器建 |
| `8000096 A "manifest" field was expected` | body 用了 JSON | 必须 multipart 的表单字段 `manifest`（`rawBody:true` + 手写 boundary） |
| `8000011 …Git installation` | CF 侧账户级 Git 连接不可用 | 后台「连接 Git」重连；此前用直传 |
| 某一条路径 `HTTP 500`、其余全好 | manifest 里那条哈希抄错了 | 重新部署；blob 已在存储里，无需重传 |
| wrangler + 上传 JWT → `6003` / `6111 Invalid format for Authorization header` | wrangler 要 API token 格式，还会先请求 `/accounts` | 不要拿上传 JWT 喂 wrangler |
| `gh api /user/installations` 返回 403 被读成"0 个安装" | 该端点需要 App 授权 token，普通 OAuth token 不行 | 别用它判断 GitHub App 装没装；以 Cloudflare 报错为准 |

## 历史事故（GitHub Pages，2026-10-01 / 核实于 2026-10-04）与教训

- 症状：线上 404 / 白屏；`gh api repos/yanbing2026/kindergarten-classroom/pages` 返回 **404**；
  `Deploy to GitHub Pages` 工作流在 **Configure Pages** 步骤失败（`Get Pages site failed`），后续步骤全跳过。
- 根因：Pages 站点的 source 指向旧分支 `improvement/p1-learning-experience`，清理 origin 旧分支时把它删了 ——
  **删掉被 source 指向的分支，等于把整个站点一起删掉**。
- 当时旧版 `AGENTS.md` 曾断言那条 source 是"残留配置、不用去改"，**那句话是错的**，而且正是照着它清理才炸的。
  错的来源：核对时只比对了线上 `index.html` 与 `main` 的 sha256，**没有验证 source 到底在起什么作用** ——
  结论碰巧对（那次发布确实走 Actions），但推论是错的。
- 教训（对任何托管商都成立）：**只看输出结果、不看机制，就会在机制上翻车。** 迁移或清理前，先弄清
  "谁指向谁"；验证要覆盖机制本身，而不只是线上字节。

## 硬约束

- 发布改动若动了 `sw.js` 的 `APP_SHELL` 里的资源，必须同步 bump `APP_VERSION`（`index.html` 与 `sw.js` 两处一致），
  规则见 `AGENTS.md`。
- **换 origin 的代价**（本次迁移已发生）：已安装的 PWA 仍指向旧 origin，localStorage 进度不跨 origin。
  迁移时要提醒用户先在旧站导出进度，再在新地址重新"添加到主屏幕"。
