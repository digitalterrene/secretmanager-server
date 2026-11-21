# ADR-003: Serverless Express Deployment on Vercel (`@vercel/node`)

- **Status**: Accepted
- **Date**: 2026-11-22
- **Authors**: Digital Terrene Engineering
- **Deciders**: Repository Maintainers
- **Technical Story**: Production hosting configuration (`src/vercel.json`, CORS origin commits `6374c63`, `71b536a`, `b4aadec`)

---

## 1. Context & Problem Statement

The SecretManager frontend (`https://secretmanager-delta.vercel.app`) is hosted on Vercel. We need a low-maintenance, HTTPS-enabled production hosting model for the Express API with minimal operational overhead, automatic TLS, and simple environment variable management for `SERVER_SECRET`.

---

## 2. Decision

We will deploy the Express application to **Vercel Serverless Functions** using `@vercel/node`, configured in [`src/vercel.json`](../../src/vercel.json), with CORS restricted strictly to the production Vercel frontend and local development origin.

Implementation Details:
- `src/vercel.json` builds `*.js` via `@vercel/node` and routes `/(.*)` to `/`.
- `corsOptions` in `src/index.js` permits only `http://localhost:3000` and `https://secretmanager-delta.vercel.app` for `POST` requests.
- `SECRET` is managed exclusively in Vercel's encrypted Environment Variables UI.

---

## 3. Consequences

### Positive Impacts
- **Zero Server Management**: Automatic TLS certificates, edge CDN routing, and instant Git-push deployments.
- **Unified Ecosystem**: Frontend and backend share the same Vercel organization, deployment logs, and rollback workflow.
- **Cost Efficiency**: Pay-per-invocation / free-tier friendly for bursty secret generation workloads.

### Negative Impacts & Operational Costs
- **Ephemeral In-Memory Rate Limiting**: `express-rate-limit`'s default `MemoryStore` does not persist across cold starts or share counters between concurrent lambda instances.
- **Cold Start Latency**: Infrequent requests may incur Node.js serverless cold-start overhead (~100–300ms).
- **Root Directory Configuration**: Because application files live inside `src/`, Vercel project settings must target `src` as the Root Directory (or align routing accordingly).

### Risks and Mitigations
- **Risk**: Distributed or cold-start-assisted rate-limit bypass on serverless instances.
- **Mitigation**: Monitor request volume in Vercel logs; if abuse is observed, introduce an Upstash Redis store for `express-rate-limit` and enable Vercel Attack Challenge Mode / Firewall rules.

---

## 4. Alternatives Considered & Disqualification Rationale

### Option A: Self-Managed VPS / Docker Container (DigitalOcean, EC2)
- *Pros*: Persistent in-memory rate limiting, no cold starts, full OS control.
- *Cons*: Requires manual TLS renewal, OS patching, process supervision, and ongoing monthly server costs disproportionate to a single-endpoint API.

### Option B: AWS Lambda + API Gateway
- *Pros*: Deep AWS IAM/KMS integration and native throttling policies.
- *Cons*: Higher configuration complexity (SAM/Terraform, API Gateway CORS wiring) compared to Vercel's zero-config workflow.
