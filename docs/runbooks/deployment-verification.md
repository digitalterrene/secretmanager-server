# Deployment Verification Runbook

- **Audience**: Maintainers, Release Engineers, On-Call / Verification Agents
- **Scope**: Local development verification and Vercel production release smoke testing
- **Last Updated**: 2026-11-22

---

## 1. Pre-Deployment Checklist

Before promoting a commit to `main` / Vercel Production:

- [ ] `src/.env` is **not** staged or tracked in git (`git status --ignored`).
- [ ] Vercel Production Environment Variable `SECRET` is set and **unchanged** from prior production releases (changing `SECRET` breaks determinism!).
- [ ] `corsOptions.origin` in [`src/index.js`](../../src/index.js) includes the active production frontend URL (`https://secretmanager-delta.vercel.app`).
- [ ] Repository hygiene audit passes:
  ```bash
  node .agents/skills/senior-repo-standards/scripts/audit-hygiene.js
  ```

---

## 2. Automated Smoke Tests

Set `BASE_URL` to your target environment (`http://localhost:4000` for local, or your Vercel deployment URL for production):

```bash
export BASE_URL="http://localhost:4000"
```

### Test 1: Happy Path & Determinism Check (`200 OK`)

Run the same request twice and verify both responses return `HTTP 200`, a 64-character lowercase hex `secret`, and **identical** outputs:

```bash
RESP1=$(curl -sS -X POST "$BASE_URL/generate-secret" \
  -H "Content-Type: application/json" \
  -d '{"phrase":"b@Sesfhgjk1","timestamp":"1731255347375"}')

RESP2=$(curl -sS -X POST "$BASE_URL/generate-secret" \
  -H "Content-Type: application/json" \
  -d '{"phrase":"b@Sesfhgjk1","timestamp":"1731255347375"}')

echo "Response 1: $RESP1"
echo "Response 2: $RESP2"
test "$RESP1" = "$RESP2" && echo "PASS: Deterministic output verified" || echo "FAIL: Non-deterministic output!"
```

Expected payload shape:
```json
{
  "secret": "<64-char-lowercase-hex>",
  "phrase": "b@Sesfhgjk1",
  "timestamp": "1731255347375"
}
```

### Test 2: Invalid Passphrase Rejection (`400 Bad Request`)

```bash
curl -i -sS -X POST "$BASE_URL/generate-secret" \
  -H "Content-Type: application/json" \
  -d '{"phrase":"weak","timestamp":"1731255347375"}'
```

Expected: `HTTP/1.1 400 Bad Request` with:
```json
{"error":"Invalid passphrase. It must contain at least one letter, one number, and one special character, and be at least 6 characters long."}
```

### Test 3: Invalid Timestamp Rejection (`400 Bad Request`)

```bash
curl -i -sS -X POST "$BASE_URL/generate-secret" \
  -H "Content-Type: application/json" \
  -d '{"phrase":"b@Sesfhgjk1","timestamp":"12345"}'
```

Expected: `HTTP/1.1 400 Bad Request` with:
```json
{"error":"Invalid timestamp. It should be a 13-digit Unix timestamp."}
```

### Test 4: CORS Preflight Check (`200 OK`)

Verify that the production frontend origin receives `Access-Control-Allow-Origin` and an unauthorized origin does not:

```bash
# Allowed origin — must include Access-Control-Allow-Origin
curl -i -sS -X OPTIONS "$BASE_URL/generate-secret" \
  -H "Origin: https://secretmanager-delta.vercel.app" \
  -H "Access-Control-Request-Method: POST"

# Disallowed origin — must NOT include Access-Control-Allow-Origin
curl -i -sS -X OPTIONS "$BASE_URL/generate-secret" \
  -H "Origin: https://evil.example.com" \
  -H "Access-Control-Request-Method: POST"
```

### Test 5: Liveness Probe (`POST /`)

```bash
curl -i -sS -X POST "$BASE_URL/"
```

Expected: `HTTP/1.1 200 OK` with `Server running on port <PORT>`.

---

## 3. Rollback Procedure (Vercel)

If any smoke test fails after a production deployment:

1. Open the **Vercel Dashboard → Project → Deployments**.
2. Locate the last verified healthy Production deployment.
3. Click **⋯ → Instant Rollback** (or **Promote to Production**).
4. Re-run **Test 1** and **Test 4** against the production URL to confirm recovery.
5. Open a post-incident issue using [`.github/ISSUE_TEMPLATE/bug_report.md`](../../.github/ISSUE_TEMPLATE/bug_report.md).
