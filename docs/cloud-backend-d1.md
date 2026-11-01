# 账号后端：从 Supabase 迁到 Cloudflare Worker + D1

**状态**：2026-11-01 立项。线上 Supabase 项目已不存在（`sjqhcpbdgaeapljbllhp.supabase.co` NXDOMAIN），
账号/云同步不可用；本文件是替代后端的唯一契约。

## 为什么不是"重建 Supabase"

- 原生 Supabase 项目的免费档在一周无活动后会暂停，删除/暂停都可能发生，本项目已经踩了一次。
- Cloudflare 已经是本站的宿主（Pages），token 已有 D1 / Workers 权限，管理面收敛到一个账号。
- 代价：D1 只能从 Worker 访问，必须自己写 HTTP 层；下面这份就是那一层。

## 组件

| 件 | 位置 | 说明 |
|---|---|---|
| Worker | `worker/`（`src/index.js`、`src/auth.js`、`src/store.js`） | 唯一的 API 入口，`https://blockquest-api.yanbing2004.workers.dev`（已部署 2026-11-01） |
| 数据库 | D1 `blockquest-classroom` | SQLite；`schema.sql` 已应用，database_id `d57c6538-1d80-4e27-9b16-10f44cf05f69` |
| 密钥 | `wrangler secret put TOKEN_SECRET` | 本机副本 `~/.hermes/state/kc_worker_secret.txt`（600） |
| 客户端 | `js/cloud-api.js`（新）+ `index.html` + `js/data-layer.js` | 用 `fetch` 替代 supabase-js |

## 不变的东西（务必保持）

- **PIN 永不出设备**。客户端仍用 PBKDF2-SHA256、120000 次迭代、16 字节随机 salt，算出
  `pinVerifier`（base64）后只发 verifier。
- `sessionStorage` 里的 verifier（`kc_pin_verifier_v1`）仍是"本标签页已登录"的凭据；token 存
  `localStorage`（`kc_cloud_token_v1`），过期 30 天。
- 离线优先：没有账号时全部进度在 `kc_progress_v1`；有账号时同时写 `kc_account_progress_v1_<name>`。
  网络挂了只影响云同步，不影响孩子玩。
- 本地 `kc_accounts_v1` / `kc_current_account` 的数据形状不变。

## HTTP 契约

所有响应 `application/json`，成功 `{ok:true,…}`，失败 `{ok:false,error:<code>}`（HTTP 4xx/5xx）。
错误码：`bad_request`、`not_found`、`bad_credentials`、`locked_out`、`name_taken`、`unauthorized`、
`token_expired`、`server_error`。

| 方法 | 路径 | 认证 | 请求体 | 响应 |
|---|---|---|---|---|
| POST | `/salt` | 无 | `{name}` | `{ok:true,salt}` —— **名字不存在也返回一个随机 salt**（等长耗时，防枚举） |
| POST | `/create` | 无 | `{name,pinVerifier,salt,progress}` | `{ok:true,name,playerId,token}` |
| POST | `/login` | 无 | `{name,pinVerifier}` | `{ok:true,name,playerId,token,progress}` |
| GET | `/me` | Bearer | — | `{ok:true,name,playerId,progress,updatedAt}` |
| POST | `/progress` | Bearer | `{progress}` | `{ok:true,savedAt}` |
| POST | `/pin` | Bearer | `{oldVerifier,newVerifier,newSalt}` | `{ok:true,token}`（旧 token 立即失效） |
| DELETE | `/player` | Bearer | `{pinVerifier}` | `{ok:true}` |
| POST | `/events` | Bearer | `{events:[…]}`（≤50/次） | `{ok:true,accepted}` |
| POST | `/rows` | Bearer | `{rows:[…]}`（≤200/次，camelCase 字段） | `{ok:true,saved}` |
| POST | `/goals` | Bearer | `{goals:[…]}`（≤50/次，camelCase 字段） | `{ok:true,saved}` |
| GET | `/report?days=30` | Bearer | — | `{ok:true,progress:[…],events:[…],goals:[…]}` |

- `name`：1–20 字符，大小写不敏感唯一（存 `name_key = lower(trim(name))`）。
- `progress`：任意 JSON 对象（孩子进度包），服务端只做 `JSON.stringify` 存储与长度上限（64 KB）。
- 事件对象字段沿用 `js/data-layer.js` 现有 payload：`gradeLevel,subjectKey,unitKey,eventType,
  correct,firstTry,score,durationMs,metadata,clientEventId`。
- 限流：同名账号 60 秒内 5 次登录失败 → `locked_out`（HTTP 429），成功登录清零。
- CORS：允许 `https://blockquest-classroom.pages.dev` 及其预览子域、`http://localhost:*`、
  以及 `Origin: null`（`file://` 本地测试，只发 verifier/token，不发 PIN）。

## 表结构（`worker/schema.sql`）

```sql
players(id INTEGER PRIMARY KEY, name TEXT NOT NULL, name_key TEXT NOT NULL UNIQUE,
        pin_verifier TEXT NOT NULL, pin_salt TEXT NOT NULL, progress TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)
player_progress(player_id INTEGER NOT NULL, grade_level TEXT, subject_key TEXT, unit_key TEXT,
        mastery INTEGER, stars INTEGER, attempts INTEGER, correct INTEGER, first_try_correct INTEGER,
        metadata TEXT, updated_at INTEGER NOT NULL,
        PRIMARY KEY(player_id,grade_level,subject_key,unit_key))
activity_events(id INTEGER PRIMARY KEY, player_id INTEGER NOT NULL, client_event_id TEXT NOT NULL,
        grade_level TEXT, subject_key TEXT, unit_key TEXT, event_type TEXT, correct INTEGER,
        first_try INTEGER, score REAL, duration_ms INTEGER, metadata TEXT, created_at INTEGER NOT NULL,
        UNIQUE(player_id,client_event_id))
daily_goals(player_id INTEGER NOT NULL, goal_date TEXT NOT NULL, target_questions INTEGER,
        completed_questions INTEGER, completed INTEGER, metadata TEXT,
        PRIMARY KEY(player_id,goal_date))
login_attempts(name_key TEXT NOT NULL, ts INTEGER NOT NULL)
```

索引：`activity_events(player_id, created_at)`、`login_attempts(name_key, ts)`。

## 与旧 Supabase 的语义差异（有意为之）

- **没有匿名 Auth、没有 `claim_player_auth`**：设备绑定那一层只为满足 Supabase RLS 而存在。
  现在 token 就是身份，同一设备换账号只需换 token。
- `rotate_pin` / `delete_player` 保留原语义，但由 token 授权（不再要旧 verifier 双份校验时仍校验，
  防止 token 被盗后无声改 PIN）。
- `release_player_auth` 删除（无对应概念）。
- 家长面板的"云同步报告"改走 `/report`。

## 交付顺序

1. Worker + schema + 本地 store 测试（不联网可跑）。
2. 建 D1、应用 schema、部署 Worker、用 curl 跑一遍真 E2E（建号→登录→存进度→改 PIN→删号）。
3. 客户端切换（`js/cloud-api.js` + `index.html` + `data-layer.js` + `sw.js` APP_SHELL/版本）。
4. 线上验证：建号、登录、答题、刷新后进度还在、家长改 PIN、删号。
