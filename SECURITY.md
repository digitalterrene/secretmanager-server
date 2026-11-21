# Security Policy & Vulnerability Reporting

The security and cryptographic integrity of **SecretManager Server** are paramount. Because this service derives deterministic secrets on behalf of users, any flaw in input validation, CORS enforcement, rate limiting, or server-side secret handling is treated with the highest priority.

---

## 1. Supported Versions

We actively maintain and provide security patches for the following versions:

| Version | Supported | Status |
|---|---|---|
| `main` (`1.x`) | :white_check_mark: | Actively supported with security hotfixes |
| `< 1.0.0` | :x: | Unsupported; upgrade to latest `main` |

---

## 2. Reporting a Vulnerability

**DO NOT file public GitHub issues for security vulnerabilities.**

To report a vulnerability privately:
- Use **GitHub Private Vulnerability Reporting** on [`digitalterrene/secretmanager-server`](https://github.com/digitalterrene/secretmanager-server/security/advisories/new).

Please include the following in your report:
- **Component**: The affected endpoint, middleware, or file (e.g., `src/index.js`, `src/vercel.json`, CORS policy, rate limiter).
- **Vulnerability Class**: e.g., Cryptographic Weakness, CORS Bypass, Rate-Limit Bypass, ReDoS (Regular Expression Denial of Service), Information Disclosure.
- **Proof of Concept**: Minimal reproduction steps or `curl` commands that demonstrate the issue safely without impacting production availability.
- **Impact Assessment**: Potential blast radius and severity.

---

## 3. Vulnerability Response SLA

| Severity | Initial Response | Assessment & Triage | Resolution Target |
|---|---|---|---|
| **Critical** | Within 12 hours | Within 24 hours | 48–72 hours |
| **High** | Within 24 hours | Within 48 hours | 7 business days |
| **Medium / Low** | Within 72 hours | Within 5 business days | Next release cycle |

---

## 4. Scope & Responsible Disclosure Guidelines

- **In Scope**: Cryptographic derivation logic (`generateDeterministicSecret`), input validation (`validateInputs`), CORS allowlist bypasses, rate-limiting bypasses, dependency vulnerabilities in `src/package.json`, and secret exposure risks.
- **Out of Scope**: Volumetric Denial of Service (DoS/DDoS) attacks against production Vercel endpoints, social engineering, or brute-forcing weak user passphrases outside the documented regex policy.
- **Guidelines**:
  - Do not attempt to exfiltrate production environment variables or degrade live service availability.
  - Give maintainers reasonable time to remediate before public disclosure.
  - For our detailed threat model and defense-in-depth architecture, see [docs/architecture/security-and-rbac.md](./docs/architecture/security-and-rbac.md).
