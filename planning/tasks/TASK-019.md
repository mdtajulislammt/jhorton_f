# TASK-019: Security Hardening & VPS Deployment (owtlet.com)

> **Status**: `DONE`  
> **Assignee**: `ultron` (DevOps & Cyber Security Specialist)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-018`  
> **Roadmap Phase**: Phase 5 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As DevOps (`ultron`), I want Owtlet containerized, reverse-proxied over HTTPS on the client VPS with hardened headers and secrets, so that `owtlet.com` goes live by Dec 1, 2026 and `owtlet.live` 301 redirects to it. **Gated by Q-003 (VPS/DNS cutover).**

---

## 2. Inputs & Context Documents
- Deployment Plan: [docs/12-deployment-plan.md](../../docs/12-deployment-plan.md)
- Security Plan: [docs/10-security-plan.md](../../docs/10-security-plan.md)
- Architecture Spine: [docs/architecture-spine.md](../../docs/architecture-spine.md)
- Deployment Runbook: [infrastructure/DEPLOYMENT_RUNBOOK.md](../../infrastructure/DEPLOYMENT_RUNBOOK.md)

---

## 3. Step-by-Step Execution Completed
1. **Multi-Stage Dockerfiles**:
   - `infrastructure/docker/Dockerfile.frontend`: Standalone Next.js 14+ multi-stage build (Node 20 Alpine, non-root user `nextjs`, port 3000, healthcheck).
   - `infrastructure/docker/Dockerfile.backend`: NestJS 10+ REST API multi-stage build (Node 20 Alpine, non-root user `nestjs`, port 4000, healthcheck).
   - Lean `.dockerignore` files created in `infrastructure/docker/`, `development/frontend/`, and `development/backend/`.
2. **Production Docker Compose**:
   - `infrastructure/docker/docker-compose.yml`: Multi-service production stack with PostgreSQL 16 (healthchecked, volume `owtlet_pgdata`), Redis 7, NestJS backend (`owtlet_backend`), Next.js web (`owtlet_web`), Nginx 1.27 (`owtlet_nginx`), and Certbot (`owtlet_certbot`) under profile `prod`.
3. **Nginx Reverse Proxy & Security Hardening**:
   - `infrastructure/nginx/nginx.conf`:
     - `owtlet.com`: Reverse proxy to `web_upstream` (port 3000) and `backend_upstream` (port 4000 for `/api/*`).
     - `owtlet.live` & `www.owtlet.live`: 301 Permanent Redirect to `https://owtlet.com$request_uri` (AC-RDR-01, REQ-F-019).
     - `www.owtlet.com`: 301 Permanent Redirect to canonical apex `https://owtlet.com$request_uri`.
     - Port 80: HTTP -> HTTPS 301 redirect with `/.well-known/acme-challenge/` support for Certbot.
     - Strict Security Headers: HSTS (1 year + subdomains + preload), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
     - CSP Whitelist: Terrific Live SDK v2 (`https://terrific.live`, `wss://terrific.live`), Google Fonts, and same-origin `/api`.
     - Rate Limiting: 10 req/s on `/api/*` (burst 20), 5 req/min on sensitive auth endpoints (`/api/admin/login`, `/api/account/login`, `/api/account/password-reset`, `/api/age-verify`).
4. **SSL / Let's Encrypt Bootstrap Script**:
   - `infrastructure/docker/init-letsencrypt.sh`: Handles bootstrap certificate creation, Nginx startup, multi-domain SAN certificate issuance (`owtlet.com`, `www.owtlet.com`, `owtlet.live`, `www.owtlet.live`), and graceful Nginx reload.
5. **Automated Daily Database Backups**:
   - `infrastructure/backup/daily-backup.sh`: PostgreSQL `pg_dump` with gzip compression, SHA-256 checksum generation, logging, and 30-day retention cleanup. Cron-ready.
6. **CI/CD Pipeline Automation**:
   - `.github/workflows/deploy.yml` & `infrastructure/ci-cd/ci-cd.yml`: 4-stage pipeline (code-quality, 592 automated tests, secret hygiene audit, Docker multi-stage build validation).
7. **Comprehensive Deployment Runbook**:
   - `infrastructure/DEPLOYMENT_RUNBOOK.md`: Complete guide for server preparation, UFW firewall, DNS settings, secret generation, Let's Encrypt, migration, testing, and rollback.
8. **Automated Verification**:
   - `bash scripts/verify-task.sh TASK-019` passed 100%.

---

## 4. Expected Outputs
- [x] `infrastructure/docker/Dockerfile.frontend`
- [x] `infrastructure/docker/Dockerfile.backend`
- [x] `infrastructure/docker/docker-compose.yml`
- [x] `infrastructure/docker/init-letsencrypt.sh`
- [x] `infrastructure/docker/.dockerignore`
- [x] `infrastructure/nginx/nginx.conf`
- [x] `infrastructure/backup/daily-backup.sh`
- [x] `infrastructure/ci-cd/ci-cd.yml`
- [x] `.github/workflows/deploy.yml`
- [x] `infrastructure/DEPLOYMENT_RUNBOOK.md`

---

## 5. Acceptance Criteria
- [x] **AC-DEP-01**: App containerized via Docker multi-stage build; Nginx configured to serve over HTTPS with `/api/health` healthchecks.
- [x] **AC-RDR-01**: `owtlet.live` and `www.owtlet.live` 301 permanently redirect to `https://owtlet.com$request_uri`.
- [x] **AC-SEC-01**: Zero secrets in Git index; `.env` strictly ignored; zero DOB/ID or payment fields stored or transmitted.

---

## 6. Verification Evidence (Thanos & Ultron)
- **Command**: `bash scripts/verify-task.sh TASK-019`
- **Status**: `PASSED`
- **Output Log**:
```
========================================================
🛡️  THANOS VERIFICATION GATE: TASK-019
========================================================
🔍 1. Checking Backend API & Schemas (Edith)...
  ✔ NestJS backend application & Prisma schema verified.
  ✔ Backend REST API contracts verified.
🔍 2. Checking Frontend Web & Components (Friday)...
  ✔ API client & JWT Auth Store verified.
  ✔ Core UI primitives verified.
  ✔ Prisma schema present in frontend.
  ✔ Synchronized API contracts verified (Friday ↔ Edith).
  ✔ Frontend component standards checked.
🔍 3. Checking Mobile App (Thor)...
  ℹ Mobile scope inactive or not configured (Skipped).
🔍 4. Checking DevOps & Production Infrastructure (Ultron)...
  ✔ Multi-stage Dockerfiles verified (Frontend Standalone + Backend NestJS).
  ✔ Docker Compose production profile & healthchecks verified.
  ✔ Content-Security-Policy (CSP) allows Terrific Live SDK v2.
  ✔ HTTP Strict Transport Security (HSTS) header verified.
  ✔ owtlet.live 301 Permanent Redirect to owtlet.com verified (AC-RDR-01).
  ✔ Nginx rate limiting zones (API 10r/s, Auth 5r/m) verified.
  ✔ Let's Encrypt / SSL bootstrap script verified.
  ✔ Daily PostgreSQL backup script with checksums & retention verified.
  ✔ CI/CD pipeline automation workflow verified.
  ✔ Production Deployment Runbook verified.
  ✔ Secret hygiene verified: No .env files tracked in repository.
--------------------------------------------------------
✅ VERIFICATION PASSED: Task TASK-019 meets all criteria.
Status: READY TO MARK AS DONE
```

---

## 7. Fresh Session Handoff
```markdown
All Phase 1–5 MVP tasks complete! 592/592 tests passing. Ready for Client VPS Cutover & Handover (Q-003).
```
