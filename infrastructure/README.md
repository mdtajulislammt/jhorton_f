# Infrastructure Configurations (`infrastructure/`)

> Owned and maintained by **`ultron`** (DevOps & Cyber Security Specialist).

This directory contains containerization, web server, reverse proxy, backup, and CI/CD configurations for Owtlet™.

## Directory Structure

- **`docker/`**:
  - `Dockerfile.frontend`: Multi-stage production build for Next.js 14+ App Router (standalone mode, port 3000).
  - `Dockerfile.backend`: Multi-stage production build for NestJS 10+ REST API + Prisma ORM (port 4000).
  - `docker-compose.yml`: Production orchestration with PostgreSQL 16, optional Redis, NestJS backend, Next.js web, Nginx 1.27, and Certbot under `--profile prod`.
  - `init-letsencrypt.sh`: Bootstrap script to resolve Nginx-Certbot initial certificate setup for `owtlet.com`, `www.owtlet.com`, `owtlet.live`, `www.owtlet.live`.
  - `.dockerignore`: Lean build context filter excluding node_modules, build caches, and secrets.
- **`nginx/`**:
  - `nginx.conf`: Production reverse proxy configuration enforcing:
    - `https://owtlet.com`: Reverse proxy to `web:3000` (pages, static) and `backend:4000` (`/api/*`).
    - `https://owtlet.live` & `www.owtlet.live`: 301 Permanent Redirect to `https://owtlet.com$request_uri` (REQ-F-019, AC-RDR-01).
    - `https://www.owtlet.com`: 301 Permanent Redirect to canonical apex `https://owtlet.com$request_uri`.
    - `http://*` (port 80): 301 Redirect to HTTPS with Let's Encrypt ACME challenge webroot.
    - Security headers: Strict HSTS (1 year + subdomains + preload), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
    - Content-Security-Policy (CSP): Strict whitelist allowing Terrific Live SDK v2 (`https://terrific.live`, `wss://terrific.live`), Google Fonts, and self.
    - Rate limits: 10 req/s on `/api/*`, 5 req/min on sensitive authentication endpoints (`/api/admin/login`, `/api/account/login`, `/api/account/password-reset`, `/api/age-verify`).
- **`backup/`**:
  - `daily-backup.sh`: Automated daily PostgreSQL backup script generating compressed `.sql.gz` dumps with SHA-256 checksums and automated 30-day retention cleanup.
- **`ci-cd/`**:
  - `ci-cd.yml`: GitHub Actions CI/CD pipeline mirror for linting, typechecking, 592 test execution, secret hygiene audit, and Docker multi-stage build validation.
- **`DEPLOYMENT_RUNBOOK.md`**: Step-by-step production runbook for VPS setup, DNS cutover, Let's Encrypt certificates, initial database migration/seed, healthchecks, and disaster recovery.
