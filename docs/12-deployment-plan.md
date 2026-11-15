# 12 — Deployment & Infrastructure Plan

> Owned and maintained by `ultron`.

---

## 1. Environments
- **Local Development**: Docker Compose with PostgreSQL 15 (+ optional Redis) and `pnpm dev` for the single Next.js app (`development/frontend`, http://localhost:3000, API at `/api`).
- **Staging / Preview**: Same Compose stack on the client VPS under a staging subdomain (e.g. `staging.owtlet.com`, basic-auth protected) — or locally via tunnel if the VPS is not ready (Q-003).
- **Production**: Client-provided Linux VPS (Ubuntu 22.04/24.04 LTS, ≥ 2 vCPU / 4 GB RAM recommended) running Docker Compose: `web` (Next.js standalone), `db` (PostgreSQL 15, volume), optional `redis`, `nginx` (reverse proxy + Let's Encrypt SSL) for `owtlet.com` / `www.owtlet.com`, plus a 301 redirect server for `owtlet.live` / `www.owtlet.live` → `https://owtlet.com$request_uri` (client Nov 9, REQ-F-019; config in `infrastructure/nginx/nginx.conf`).

---

## 2. Docker Architecture
- Multi-stage build (`infrastructure/docker/Dockerfile.frontend` = the single `web` image; the template's backend Dockerfile was removed — ADR-015):
  - Base: Node.js 20 Alpine
  - Builder: pnpm install, `prisma generate`, `next build` (`output: 'standalone'`)
  - Runner: Minimal production footprint without devDependencies; runs `prisma migrate deploy` then `node server.js`.
- **Env / secrets** (in `/opt/owtlet/.env`, chmod 600, never in Git; template = root `.env.example`): `DATABASE_URL`, `AGE_COOKIE_SECRET`, `ADMIN_SESSION_SECRET`, `SHOPPER_SESSION_SECRET`, `IP_HASH_SALT`, `CONFIRMATION_LINK_SECRET`, `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_URL=https://owtlet.com`, `NEXT_PUBLIC_TERRIFIC_STORE_ID=BX2hWAVam9JjsFhXP5ZF`, `NEXT_PUBLIC_TERRIFIC_EMBEDDING_ID=Cki70GhqvLgWGhJbSxg2`, `SMTP_*` (pending Q-006), `LEAFLY_*` (pending Q-001), `REDIS_URL` (optional). Per-dispensary webhook secrets live in the DB (`Dispensary.webhookSecret`).
- **DNS** (pending client, Q-003): `A owtlet.com → <VPS IP>`, `A/CNAME www → owtlet.com`, `A owtlet.live` + `www.owtlet.live → <VPS IP>` (redirect only). `owtlet.shop` is a separate project (accessories, other team member) and stays on its own Shopify DNS — not touched by this deployment.
- **Deploy steps**: `git pull` → `docker compose build web` → `docker compose up -d` → health check `GET /api/health` → Nginx reload. First deploy also runs `pnpm prisma db seed` (coverage ZIPs + migrated products).

---

## 3. Rollback & Disaster Recovery
- Keep previous image tags versioned (`owtlet-web:<git-sha>`); rollback = retag + `docker compose up -d`.
- Automated daily `pg_dump` backup (cron) with 30-day retention, copied off-server if client provides storage.
- Zero-downtime-ish restart via Nginx upstream reload; Prisma migrations are additive (destructive migrations require human approval gate).
