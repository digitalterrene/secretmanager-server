# ADR-002: 10,000-Round HMAC-SHA256 Hash Stretching for Secret Generation

- **Status**: Accepted
- **Date**: 2026-11-22
- **Authors**: Digital Terrene Engineering
- **Deciders**: Repository Maintainers
- **Technical Story**: Cryptographic derivation engine (`generateDeterministicSecret` in `src/index.js`)

---

## 1. Context & Problem Statement

Single-pass hashing (e.g., `SHA256(phrase + timestamp)`) is too fast and vulnerable to high-throughput brute-force attacks if `SERVER_SECRET` is ever exposed. At the same time, the derivation algorithm must:
- Produce a fixed-length, high-entropy 256-bit output.
- Run reliably in serverless Node.js environments (`@vercel/node`) without native binary compilation failures across platforms.
- Complete fast enough to fit comfortably within serverless HTTP latency budgets.

---

## 2. Decision

We will use **10,000 sequential iterations of HMAC-SHA256** using Node.js's built-in `crypto.createHmac("sha256", SERVER_SECRET)`, seeded with `${phrase}${timestamp}${SERVER_SECRET}`.

Implementation Details:
- `STRETCH_COUNT` is fixed at `10000` in [`src/index.js`](../../src/index.js).
- Each iteration feeds the lowercase hex digest of the previous iteration into `crypto.createHmac("sha256", SERVER_SECRET)`.
- Zero native C++ addon dependencies are required at runtime, ensuring 100% portability across Windows, macOS, Linux, and Vercel serverless containers.

---

## 3. Consequences

### Positive Impacts
- **Zero Native Build Friction**: Uses Node.js standard library `crypto` (OpenSSL-backed), avoiding native ABI issues on serverless platforms.
- **Deterministic & Portable**: Identical output across all Node.js versions and operating systems.
- **Keyed Stretching**: Binds `SERVER_SECRET` into every single iteration via HMAC, preventing length-extension attacks and unkeyed precomputation.

### Negative Impacts & Operational Costs
- **Not Memory-Hard**: Unlike Argon2id or scrypt, HMAC-SHA256 is CPU-bound rather than memory-hard, making it more susceptible to GPU/ASIC acceleration if `SERVER_SECRET` were ever compromised.
- **Synchronous Event-Loop Blocking**: Running 10,000 synchronous iterations blocks the Node.js event loop for ~10–25ms per request.
- **Hardcoded Iteration Count**: `STRETCH_COUNT` is currently a constant (`10000`); changing it alters all outputs and constitutes a breaking change.

### Risks and Mitigations
- **Risk**: Future cryptographic standards may require a memory-hard KDF (Argon2id).
- **Mitigation**: Any future migration to Argon2id (already present as an unused dependency in `src/package.json`) MUST be introduced on a versioned endpoint (e.g., `POST /v2/generate-secret`) so existing `v1` derived secrets remain reproducible.

---

## 4. Alternatives Considered & Disqualification Rationale

### Option A: Argon2id (`argon2` npm package)
- *Pros*: Memory-hard, resistant to GPU/ASIC cracking, OWASP-recommended KDF.
- *Cons*: Native C++ binding (`node-gyp` / prebuilds) can complicate serverless cold starts and cross-platform builds; deferred for a potential versioned `v2` endpoint.

### Option B: `crypto.pbkdf2` (Async)
- *Pros*: Built into Node.js, non-blocking async API (runs on libuv threadpool), standardized (RFC 2898).
- *Cons*: Not originally selected for `v1`; switching now would break determinism for existing users without endpoint versioning.
