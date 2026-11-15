# TASK-002: Scaffold Single Next.js App (UI + API) with Prisma & Docker PostgreSQL

> **Status**: `DONE`  
> **Assignee**: `friday` (Web Frontend Specialist)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-001`  
> **Roadmap Phase**: Phase 1 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a developer, I want one Next.js App Router project that hosts both the storefront UI and the `/api` backend, wired to PostgreSQL through Prisma, so that all Owtlet features build on a single deployable.

---

## 2. Inputs & Context Documents
- Spine: [docs/architecture-spine.md](../../docs/architecture-spine.md)
- Frontend structure: [docs/05-frontend-architecture.md](../../docs/05-frontend-architecture.md)
- Backend structure: [docs/06-backend-architecture.md](../../docs/06-backend-architecture.md)
- **Context Constraint**: LOAD ONLY this task file + the spine + 05/06.

---

## 3. Step-by-Step Execution Plan
1. In `development/frontend/`, initialize Next.js 14+ (App Router, TypeScript strict, ESLint, Tailwind, `src/` dir); add shadcn/ui, Zustand, TanStack Query, React Hook Form, Zod, Vitest, Playwright.
2. Add Prisma (`prisma/schema.prisma` with the datasource only) and `src/server/db.ts` Prisma singleton; add `src/server/http.ts` envelope helpers `ok()` / `fail()`.
3. Create `GET /api/health` Route Handler returning the envelope with DB ping.
4. Use the prepared `infrastructure/docker/docker-compose.yml` (`postgres`, optional `redis` profile, `web` + `nginx` under `prod` profile) — adjust `Dockerfile.frontend` to Next `output: "standalone"`. (`development/backend` / `development/mobile` were already removed — ADR-015; do not recreate.)
5. `.env.example` is already Owtlet-specific — run `bash scripts/sync-env.sh` to create `development/frontend/.env`; add any new key to `.env.example` first. Replace the template's leftover `src/` demo files (e.g. middleware with `/dashboard`, `/profile`) with the Owtlet structure from docs/05.

---

## 4. Expected Outputs
- `development/frontend/package.json`, `next.config.mjs` (`output: "standalone"`), `src/app/layout.tsx`, `src/app/api/health/route.ts`, `src/server/db.ts`, `src/server/http.ts`, `prisma/schema.prisma`
- `infrastructure/docker/docker-compose.yml`, `.env.example`

---

## 5. Acceptance Criteria
- [x] `pnpm dev` serves `/` and `GET /api/health` → returns envelope with DB ping.
- [x] `docker compose up -d db` + `prisma generate` succeed with Next `output: "standalone"`.
- [x] `pnpm lint`, `pnpm tsc --noEmit`, `pnpm test` pass cleanly.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && npm run lint && npm run tsc && npm test && bash scripts/verify-task.sh TASK-002`
- **Status**: `VERIFIED`
- **Output Log**:
  - `next lint`: ✔ No ESLint warnings or errors
  - `tsc --noEmit`: Passed with 0 errors
  - `vitest run`: 2 passed (HTTP Envelope helpers)
  - `scripts/verify-task.sh TASK-002`: ✅ VERIFICATION PASSED: Task TASK-002 meets all criteria.
  - HTTP Server: Next.js standalone server started and served `/` (307 age gate redirect, 200 with `owt_age` cookie) and `GET /api/health` (standard envelope).

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-003 শুরু করো। [Tier: LEVEL: STANDARD]
```
