# DevSecOps Security Pipeline — OWASP NodeGoat

**IE3142 – DevOps Security | Group Assignment**

Securing the intentionally vulnerable **OWASP NodeGoat** application through threat modelling, secure-coding remediation, and an automated CI/CD security pipeline.

---

## Overview

This project takes OWASP NodeGoat ("RetireEasy", an employee retirement-savings web application) and applies the full DevSecOps cycle: containerisation, STRIDE threat modelling, exploit-and-fix of four vulnerabilities, and a GitHub Actions pipeline with four automated security gates — one of which blocks the build on a real code-injection finding.

All security testing was performed **only** against the group's own local instance, under an approved Ethical Clearance Form.

## Technology Stack

- **Application:** Node.js, Express, Swig templating
- **Database:** MongoDB
- **Containers:** Docker, Docker Compose
- **Pipeline:** GitHub Actions
- **Security tools:** Semgrep (SAST), npm audit (SCA), Gitleaks (secrets), Trivy (container scanning)

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (running)
- [Git](https://git-scm.com/downloads)

## Run locally

```bash
# 1. Clone the repository
git clone https://github.com/BhanukaWijesundara/devsecops-security-pipeline.git
cd devsecops-security-pipeline

# 2. Build and start both containers with one command
docker compose up --build
```

When you see `web-1 | Express http server listening on port 4000`, open:

```
http://localhost:4000
```

Log in with the seeded account **`user1` / `User1_123`**, or sign up a new account.

To stop: press `Ctrl + C` in the terminal.

> **Note:** the app code is baked into the image at build time, so after any code change re-run `docker compose up --build` (not just `docker compose up`).

### Apple Silicon (M1/M2/M3) note

If the MongoDB container fails to start, add one line under the `mongo` service in `docker-compose.yml`:

```yaml
  mongo:
    image: mongo:4.4
    platform: linux/amd64
```

## Architecture

```
Browser ──HTTP:4000──▶ NodeGoat web container ──internal network──▶ MongoDB container
        (host boundary)          (Node.js/Express)   (mongo:27017, not published to host)
```

Two communicating components (`web` + `mongo`) brought up by a single command. MongoDB is `expose`d only on the internal Docker network, never published to the host.

## Repository structure

```
devsecops-security-pipeline/
├── app/                         NodeGoat application source
├── config/                      application configuration
├── Dockerfile                   web image build
├── docker-compose.yml           one-command launch (web + mongo)
├── .semgrepignore               scopes SAST to application code
├── .semgrep/
│   └── block-rules.yml          custom SAST rule (blocks on code injection)
├── .github/workflows/
│   └── security-pipeline.yml    CI/CD pipeline (build/test + 4 security gates)
└── docs/
    └── evidence/                screenshots for the report appendices
```

## CI/CD security pipeline

The pipeline (`.github/workflows/security-pipeline.yml`) runs on every push and pull request to `main`:

| Stage | Tool | Behaviour |
|---|---|---|
| Build & Test | Node.js | Baseline build |
| **SAST** | **Semgrep** | **Blocking** — fails the build on code-injection patterns (e.g. `eval` on request data) |
| Dependency scan | npm audit | Report-only (NodeGoat ships intentionally vulnerable deps) |
| Secret scan | Gitleaks | Scans full commit history for committed secrets |
| Container scan | Trivy | Report-only (pinned `mongo:4.4` has known CVEs by design) |

Branch protection on `main` requires the SAST gate to pass before merging, so a failing gate genuinely blocks integration.

## Vulnerabilities remediated

| ID | Vulnerability | Fix |
|---|---|---|
| T1 | Server-Side JS Injection (`eval`) | Replaced `eval()` with `parseInt()` |
| T2 | Stored XSS | Enabled Swig output auto-escaping |
| T3 | Broken Access Control (IDOR) | Derive `userId` from the session, not the URL |
| T4 | CSRF | Enabled `csurf` tokens on state-changing forms |

Each vulnerability was exploited, fixed, and re-tested; evidence is in `docs/evidence/`.

## Secrets management

No credentials are hard-coded in the repository. Application secrets are provided through **GitHub Actions encrypted secrets** and injected at runtime via environment variables.

## Team

| Member | Role |
|---|---|
| Bhanuka Wijesundara | DevSecOps Lead — Architecture & CI/CD |
| Sachinthani | Secrets & Documentation Lead |
| Vinod | Dependency & Container Security |
| Sajana | Secure Coding & SAST Lead |

## Ethical use

This repository is for educational use within the IE3142 module. OWASP NodeGoat is intentionally vulnerable and was tested only in a local, isolated environment. Do not deploy it to a public server.

## AI usage disclosure

AI tools were used for guidance, debugging and drafting during this project. All work was reviewed, validated and implemented by the group, as detailed in the report's Individual Contribution Statement.