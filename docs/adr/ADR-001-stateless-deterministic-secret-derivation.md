# ADR-001: Stateless Deterministic Secret Derivation (Zero-Persistence Model)

- **Status**: Accepted
- **Date**: 2026-11-22
- **Authors**: Digital Terrene Engineering
- **Deciders**: Repository Maintainers
- **Technical Story**: Core architectural foundation (`src/index.js`)

---

## 1. Context & Problem Statement

Traditional password and secret managers store encrypted vaults in a central database (PostgreSQL, MongoDB, or cloud object storage). Operating a persistent credential vault introduces substantial operational and security liabilities:
- Database breach exposure (offline cracking of stolen vaults).
- User authentication, session management, account recovery, and backup infrastructure.
- High ongoing infrastructure and compliance costs.

We need a lightweight backend that enables users to derive strong, reproducible cryptographic secrets from a memorable passphrase and a 13-digit Unix timestamp without storing any user credentials or vaults on the server.

---

## 2. Decision

We will adopt a **stateless, zero-persistence deterministic derivation architecture**.

Implementation Details:
- The server maintains **no database**, **no user accounts**, and **no persistent secret storage**.
- Every secret is computed on demand via `POST /generate-secret` from `(phrase, timestamp, SERVER_SECRET)`.
- Determinism guarantees that supplying the same `phrase` and `timestamp` to a server holding the same `SERVER_SECRET` always reproduces the exact same 64-character hexadecimal secret.
- The server echoes `{ secret, phrase, timestamp }` in the response so the client can bind/display the inputs without server-side session state.

---

## 3. Consequences

### Positive Impacts
- **Minimal Breach Surface**: Even full compromise of the deployment filesystem or logs yields no stored user secret database.
- **Zero Database Overhead**: No schema migrations, backups, connection pooling, or database hosting costs.
- **Trivial Horizontal Scaling**: Any stateless instance with the same `SECRET` environment variable produces identical results.

### Negative Impacts & Operational Costs
- **Irreversible Key Coupling**: Rotating or losing `SERVER_SECRET` immediately invalidates every user's previously derived secrets.
- **No Built-in Secret Revocation / Rotation per Entry**: Users must supply a new `timestamp` or `phrase` to rotate an individual derived secret.
- **Input Echo Exposure**: Returning `phrase` in the HTTP JSON payload requires strict TLS and `Cache-Control: no-store` hygiene on clients and proxies.

### Risks and Mitigations
- **Risk**: Accidental loss of `SERVER_SECRET` breaks reproducibility permanently.
- **Mitigation**: Store `SERVER_SECRET` in an encrypted external secret manager and restrict Vercel environment variable edit permissions to maintainers.

---

## 4. Alternatives Considered & Disqualification Rationale

### Option A: Encrypted Database Vault (PostgreSQL + Envelope Encryption)
- *Pros*: Supports secret rotation, metadata tagging, audit trails, and independent per-secret revocation.
- *Cons*: Requires authentication, KMS integration, database hosting, backups, and significantly increases breach blast radius.

### Option B: Pure Client-Side Derivation (Zero Server)
- *Pros*: Passphrase never leaves the browser; zero server hosting cost.
- *Cons*: Lacks a confidential server-side pepper (`SERVER_SECRET`) and server-side rate limiting, making offline brute-force against weak user passphrases trivial if an attacker knows the algorithm and timestamp.
