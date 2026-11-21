# Contributing to SecretManager Server

Thank you for your interest in contributing to **SecretManager Server**. Because this service performs deterministic cryptographic derivation, predictability, security hygiene, and clear documentation are non-negotiable.

---

## 1. Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors regardless of experience level, background, or identity. Please treat everyone with respect and professional empathy.

---

## 2. Engineering Non-Negotiables

Before opening a Pull Request, you **must** read and follow our [Git Engineering Standards](./docs/git-standards.md).

**Key Rules:**
1. **Branch Naming**: Branch from `main` using `feat/<scope>-<desc>`, `fix/<scope>-<desc>`, `refactor/<scope>-<desc>`, `docs/<scope>-<desc>`, or `chore/<scope>-<desc>`.
2. **Conventional Commits**: Every commit must adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification.
3. **Chain-of-Thought (CoT)**: For cryptographic, security, or architectural changes, record the root cause, alternatives considered, and side effects in the commit body.
4. **Zero Secrets in VCS**: Never commit `src/.env`, `SECRET` values, private keys, or diagnostic logs.
5. **Determinism Preservation**: Any change to `generateDeterministicSecret` or `STRETCH_COUNT` in [`src/index.js`](./src/index.js) is a **BREAKING CHANGE** because it alters all derived outputs for existing users. It requires an accepted ADR and explicit migration plan.

---

## 3. Local Development Workflow

1. Fork or clone the repository:
   ```bash
   git clone https://github.com/digitalterrene/secretmanager-server.git
   cd secretmanager-server
   ```
2. Create an isolated branch:
   ```bash
   git checkout -b feat/api-add-health-endpoint
   ```
3. Configure environment and install dependencies inside `src/`:
   ```bash
   cd src
   cp example.env .env
   npm install
   ```
4. Run the server locally:
   ```bash
   node index.js
   ```
5. Verify your changes before committing:
   - Run the smoke tests in [Deployment Verification Runbook](./docs/runbooks/deployment-verification.md).
   - Run the repository hygiene audit from the repo root:
     ```bash
     node .agents/skills/senior-repo-standards/scripts/audit-hygiene.js
     ```
   - Inspect staged changes (`git diff --cached`) to ensure zero secrets or untracked logs are included.

---

## 4. Architectural Modifications & ADRs

If your contribution alters cryptographic primitives, changes the stretching iteration count, introduces persistence/caching (e.g., Redis for distributed rate limiting), or modifies public API contracts:
1. Review the [Architecture Blueprints](./docs/architecture/).
2. Submit an **Architecture Decision Record (ADR)** to [`docs/adr/`](./docs/adr/) using [`ADR-000-template.md`](./docs/adr/ADR-000-template.md) and update [`docs/adr/README.md`](./docs/adr/README.md).

---

## 5. Submitting a Pull Request

1. Rebase your branch against the latest `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```
2. Push your branch and open a PR using the [Pull Request Template](./.github/PULL_REQUEST_TEMPLATE.md).
3. Include concrete verification evidence (e.g., `curl` smoke-test outputs, audit score).
4. Address review feedback with clean, atomic commits.
