# BlockQuest API (Cloudflare Worker + D1 Backend)

Cloudflare Worker and D1 SQLite backend for BlockQuest Classroom. Replaces the legacy Supabase backend with a low-latency, zero-cost-tier, edge-hosted API.

API Contract: See [`docs/cloud-backend-d1.md`](../docs/cloud-backend-d1.md).

---

## 1. D1 Database Setup

Create the D1 database:

```bash
npx wrangler d1 create blockquest-classroom
```

Copy the returned `database_id` into `worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "blockquest-classroom"
database_id = "<YOUR_D1_DATABASE_ID>"
```

Apply the schema (`worker/schema.sql`):

```bash
# Local development database
npx wrangler d1 execute blockquest-classroom --local --file=./schema.sql

# Production Cloudflare D1 database
npx wrangler d1 execute blockquest-classroom --remote --file=./schema.sql
```

---

## 2. Secrets Configuration

Set the token signing secret in Cloudflare:

```bash
npx wrangler secret put TOKEN_SECRET
# Enter a strong 32+ character random secret when prompted
```

---

## 3. Deployment

Run tests locally first:

```bash
node scripts/test_cloud_backend.js
```

Deploy the Worker:

```bash
cd worker
npx wrangler deploy
```

The deployed Worker is available at: `https://blockquest-api.yanbing2004.workers.dev` (or your configured Worker route).

---

## 4. Curl Smoke Test Commands

Replace `$BASE_URL` with your local (`http://localhost:8787`) or production Worker endpoint (`https://blockquest-api.yanbing2004.workers.dev`).

```bash
export BASE_URL="https://blockquest-api.yanbing2004.workers.dev"
```

### 1. CORS Preflight
```bash
curl -i -X OPTIONS "$BASE_URL/salt" \
  -H "Origin: https://blockquest-classroom.pages.dev" \
  -H "Access-Control-Request-Method: POST"
# Expect: HTTP 204 No Content
```

### 2. Fetch Salt (Anti-enumeration: returns random salt even if user doesn't exist)
```bash
curl -s -X POST "$BASE_URL/salt" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex"}'
# Expect: {"ok":true,"salt":"..."}
```

### 3. Create Account
```bash
CREATE_RES=$(curl -s -X POST "$BASE_URL/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex",
    "pinVerifier": "w9zHq1Jv2P4K6L8M0N...",
    "salt": "YmFzZTY0c2FsdDE2Ynl0ZXM=",
    "progress": {"letters": {"stars": 5}}
  }')
echo "$CREATE_RES"
# Extract token:
TOKEN=$(echo "$CREATE_RES" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
```

### 4. Login
```bash
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","pinVerifier":"w9zHq1Jv2P4K6L8M0N..."}'
# Expect: {"ok":true,"name":"Alex","playerId":1,"token":"...","progress":{"letters":{"stars":5}}}
```

### 5. Get Account Profile & Progress
```bash
curl -s -X GET "$BASE_URL/me" \
  -H "Authorization: Bearer $TOKEN"
# Expect: {"ok":true,"name":"Alex","playerId":1,"progress":{...},"updatedAt":...}
```

### 6. Save Progress
```bash
curl -s -X POST "$BASE_URL/progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"progress":{"letters":{"stars":10,"mastery":100}}}'
# Expect: {"ok":true,"savedAt":...}
```

### 7. Change PIN (Rotates PIN; immediately invalidates old token)
```bash
NEW_TOKEN_RES=$(curl -s -X POST "$BASE_URL/pin" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldVerifier": "w9zHq1Jv2P4K6L8M0N...",
    "newVerifier": "nEwVeRiFiEr9988776655...",
    "newSalt": "bmV3U2FsdDE2Ynl0ZXN4eXo="
  }')
echo "$NEW_TOKEN_RES"
NEW_TOKEN=$(echo "$NEW_TOKEN_RES" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Old token is now rejected:
curl -s -X GET "$BASE_URL/me" -H "Authorization: Bearer $TOKEN"
# Expect: {"ok":false,"error":"unauthorized"} (HTTP 401)
```

### 8. Upload Activity Events
```bash
curl -s -X POST "$BASE_URL/events" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "clientEventId": "evt-001",
        "gradeLevel": "k",
        "subjectKey": "math",
        "unitKey": "counting",
        "eventType": "answer",
        "correct": 1,
        "firstTry": 1,
        "score": 100,
        "durationMs": 3200
      }
    ]
  }'
# Expect: {"ok":true,"accepted":1}
```

### 9. Get Parent Dashboard Report
```bash
curl -s -X GET "$BASE_URL/report?days=30" \
  -H "Authorization: Bearer $NEW_TOKEN"
# Expect: {"ok":true,"progress":[],"events":[...]}
```

### 10. Delete Account
```bash
curl -s -X DELETE "$BASE_URL/player" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pinVerifier":"nEwVeRiFiEr9988776655..."}'
# Expect: {"ok":true}
```
