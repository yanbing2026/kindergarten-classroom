# 站点部署与恢复手册（`docs/pages-recovery.md`）

面向：任何改动这个仓库的 CI / 发布流程的人。**这份是操作手册；`AGENTS.md` 只保留结论和指向这里的链接。**

- 现状线上：**https://blockquest-classroom.pages.dev/**（Cloudflare Pages 项目 `blockquest-classroom`，生产分支 `main`）
- 历史：2026-10-17 之前托管在 GitHub Pages（`https://yanbing2026.github.io/kindergarten-classroom/`）。
  该站点仍在线，但**已不是发布目标**，`pages.yml` 已移除。

## 部署（主路径：wrangler + API token）

```bash
cd ~/projects/kindergarten-classroom
TOK=$(grep -m1 '^KINDERGARTEN_CLASSROOM_CF_API_TOKEN=' ~/.hermes/.env | cut -d= -f2-)
ACC=$(grep -m1 '^KINDERGARTEN_CLASSROOM_CF_ACCOUNT_ID=' ~/.hermes/.env | cut -d= -f2-)
CLOUDFLARE_API_TOKEN="$TOK" CLOUDFLARE_ACCOUNT_ID="$ACC" \
  npx wrangler pages deploy . --project-name blockquest-classroom --branch main
```

规矩（都是踩过的）：

- token 只存 `~/.hermes/.env`（0600），**只在单条命令上注入，绝不全局 export**：全局 `CLOUDFLARE_API_TOKEN`
  会顶掉 wrangler 缓存里的 OAuth 登录，把本来能用的命令变成认证失败。
- **从仓库工作树部署，不要从 `git archive` 解出来的目录部署**：wrangler 的提交信息取自它所在的 git 仓，
  解出来的副本会让部署记录里 `commit_hash` 为空，之后答不出"线上是哪个提交"。
- token 是**账户级（account-owned）**令牌：`GET /accounts` 返回 200、`GET /user` 返回 `403 9109`，
  而 `GET /user/tokens/verify` 会回 `1000 Invalid API Token` —— **那个端点对它永远说这句话，不代表 token 无效。**

## 部署（备用路径：连接器，本机没有 token 时）

工具：`~/.hermes/scripts/pages_deploy.py`（`manifest` / `upload` / `verify`）+ `cloudflare_mcp` 连接器
（上传 JWT 只授权 `/pages/assets/*`，建 deployment 必须用连接器的权限）。

```bash
rm -rf /tmp/kc-deploy && mkdir -p /tmp/kc-deploy && git archive origin/main | tar -x -C /tmp/kc-deploy
# 1) 连接器 EXECUTE：GET /accounts/{id}/pages/projects/blockquest-classroom/upload-token → result.jwt（30 分钟）
# 2) 推资产（幂等，已在存储里的 blob 不重传）
CF_UPLOAD_JWT='<jwt>' CF_PROJECT=blockquest-classroom python3 ~/.hermes/scripts/pages_deploy.py upload /tmp/kc-deploy
# 3) 打印 manifest，粘进连接器 EXECUTE 的 multipart 调用建 deployment
python3 ~/.hermes/scripts/pages_deploy.py manifest /tmp/kc-deploy
# 4) 验证
python3 ~/.hermes/scripts/pages_deploy.py verify /tmp/kc-deploy https://blockquest-classroom.pages.dev
```

第 3 步的调用形状（字段名和 contentType 都不能错）：

```js
async () => {
  const manifest = { "/index.html": "<32位十六进制 sha256>", /* …每个文件一条 */ };
  const b = `----hermesForm${Date.now()}`;
  const body = [
    `--${b}`, 'Content-Disposition: form-data; name="manifest"', 'Content-Type: application/json', '', JSON.stringify(manifest),
    `--${b}`, 'Content-Disposition: form-data; name="branch"', '', 'main',
    `--${b}--`, ''
  ].join("\r\n");
  return cloudflare.request({
    method: "POST",
    path: `/accounts/${accountId}/pages/projects/blockquest-classroom/deployments`,
    body, contentType: `multipart/form-data; boundary=${b}`, rawBody: true
  });
}
```

这条路要靠**手抄** manifest（沙箱读不到本机文件，出网也被代理白名单挡住），而手抄会出错 ——
实测把某一条哈希抄少了 4 个字符，那条路径就 500 而其余 159 条全好。所以下一步的全站扫描是**必须**的，不是可选的。

## 验证（三步都要过，缺一步都别宣布发布成功）

- `pages_deploy.py verify` **退出码 0**：每个路径 HTTP 200 且与本地逐字节一致。
- 与 `origin/main` 对树：只在本地的文件、只在远端的文件、内容不同的文件**三者都必须为空**。
- **`200` 不代表文件存在**：Cloudflare Pages 对任何不存在的路径都回落到根 `index.html`
  （实测：未知路径返回 200 / `text/html` / 312,895 字节 = index.html 的字节数）。
  判断"某文件还在不在"要看**体积 + content-type + body**，不能看状态码。
- `/x/index.html` 会 **308** 跳到 `/x/`：`curl` 必须加 `-L`，否则把好页面误判成"哈希不一致"。
- 刚部署完边缘可能仍服务**旧版本的文件**（实测：已删除的文件在同一路径先返回旧的 895 字节，
  加 cache-buster 后才是回落）。加 `?cb=$RANDOM` 或等一两分钟再判。
- `curl -sI` 返回 200 **不算**验证：页面可以 200 而 JS 已死；哈希比对才是"线上 == 仓库"的证据。

## 已知故障与处理（均为实测）

| 现象 | 原因 | 处理 |
|---|---|---|
| `1000 Invalid API Token`（`/user/tokens/verify`） | 该端点是用户级的；账户级 token 在它上面永远报这个 | 用 `/accounts` 200 + `/user` 403(9109) 判别，别据此判 token 无效 |
| 部署记录里 `commit_hash` 为空 | 从非 git 目录（`git archive` 解出的副本）部署 | 从仓库工作树部署 |
| `9106 Authentication failed` 建 deployment | 用了上传 JWT（只授权 `/pages/assets/*`） | 建 deployment 用 API token 或连接器 |
| `8000096 A "manifest" field was expected` | body 用了 JSON | 必须 multipart 的表单字段 `manifest`（`rawBody:true` + 手写 boundary） |
| `8000011 …Git installation` | CF 侧账户级 Git 连接不可用 | 后台「Workers & Pages → 连接 Git」重连；此前用直传 |
| 某一条路径 `HTTP 500`、其余全好 | manifest 里那条哈希抄错了 | 重新部署；blob 已在存储里，无需重传 |
| wrangler + 上传 JWT → `6003` / `6111 Invalid format for Authorization header` | wrangler 要 API token，还会先请求 `/accounts` | 别拿上传 JWT 喂 wrangler |
| `gh api /user/installations` 返回 403 被读成"0 个安装" | 该端点需要 App 授权 token | 别用它判断 GitHub App 装没装；以 Cloudflare 报错为准 |

## CI 自动部署

`.github/workflows/deploy-pages.yml`：push 到 `main` 时用 repo secret `CLOUDFLARE_API_TOKEN` /
`CLOUDFLARE_ACCOUNT_ID` 跑一次 `wrangler pages deploy`，恢复"合并即上线"。
secret 未配置时该工作流会失败 —— 这是刻意的，**不要**加"secret 缺失就跳过"，否则"合并即上线"会变成一句谎话。

Cloudflare 后台的 **Git 集成**目前接不上本仓库（`8000011`，需在后台重连 GitHub 连接）。一旦重连成功，
可以用 CF 自己的 Git 构建替代上面的工作流；**两者只留一个**，否则每次 push 会部署两次。

## 历史事故（GitHub Pages，2026-10-01 / 核实于 2026-10-04）与教训

- 症状：线上 404 / 白屏；`gh api repos/yanbing2026/kindergarten-classroom/pages` 返回 **404**；
  `Deploy to GitHub Pages` 工作流在 **Configure Pages** 步骤失败（`Get Pages site failed`），后续步骤全跳过。
- 根因：Pages 站点的 source 指向旧分支 `improvement/p1-learning-experience`，清理 origin 旧分支时把它删了 ——
  **删掉被 source 指向的分支，等于把整个站点一起删掉**。
- 当时旧版 `AGENTS.md` 曾断言那条 source 是"残留配置、不用去改"，**那句话是错的**，而且正是照着它清理才炸的。
  错的来源：核对时只比对了线上 `index.html` 与 `main` 的 sha256，**没有验证 source 到底在起什么作用** ——
  结论碰巧对（那次发布确实走 Actions），但推论是错的。
- 教训（对任何托管商都成立）：**只看输出结果、不看机制，就会在机制上翻车。** 迁移或清理前先弄清
  "谁指向谁"；验证要覆盖机制本身，而不只是线上字节。

## 硬约束

- 发布改动若动了 `sw.js` 的 `APP_SHELL` 里的资源，必须同步 bump `APP_VERSION`（`index.html` 与 `sw.js` 两处一致），
  规则见 `AGENTS.md`。
- 仓库里不放任何密钥；本机凭据只存 `~/.hermes/.env`（0600），部署时按上面的方式单命令注入。
- **换 origin 的代价**（本次迁移已发生）：已安装的 PWA 仍指向旧 origin，localStorage 进度不跨 origin。
  迁移时要提醒用户先在旧站导出进度，再在新地址重新"添加到主屏幕"。
