# TASK-005: 21+ Age Gate (Middleware, Cookie, API & UI)

> **Status**: `DONE`  
> **Assignee**: `edith` (Backend & Data Architect)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-002`, `TASK-003`, `TASK-004`  
> **Roadmap Phase**: Phase 1 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a regulated cannabis platform, Owtlet needs every visitor to attest they are 21+ before seeing any product, price, or video, so that we stay compliant without storing ID.

---

## 2. Inputs & Context Documents
- API: [docs/08-api-contract.md](../../docs/08-api-contract.md) §2
- Security: [docs/10-security-plan.md](../../docs/10-security-plan.md) §1–2
- Journey J-1: [docs/04-experience-spec.md](../../docs/04-experience-spec.md)
- **Context Constraint**: LOAD ONLY this task file + listed sections.

---

## 3. Step-by-Step Execution Plan
1. `src/server/age-session`: sign/verify `owt_age` (HMAC `AGE_COOKIE_SECRET`, nonce + exp, 30 days); write hashed `AgeVerificationSession` row.
2. `POST /api/age-verify` + Server Action `confirmAge()`; 403 on decline.
3. `src/middleware.ts`: redirect storefront routes to `/age-gate?next=`; return 451 `AGE_GATE_REQUIRED` for `/api/*` except `age-verify` and `webhooks/*`.
4. Friday builds `/age-gate` page (AgeGateDialog, ExitScreen) with lexicon copy.

---

## 4. Expected Outputs
- `src/server/age-session/*`, `src/app/api/age-verify/route.ts`, `src/actions/age.ts`, `src/middleware.ts`, `src/app/age-gate/page.tsx`, tests

---

## 5. Acceptance Criteria
- [x] AC-AGE-01/02/03 in `docs/13-acceptance-criteria.md` pass.
- [x] Tampered/expired cookie is rejected.
- [x] No DOB/ID collected or stored.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && npm test && npx playwright test`
- **Status**: `PASSED`
- **Output Log**:
  - `Playwright E2E Tests` (3/3 passed):
    - `AC-AGE-01`: First visit to storefront routes redirects to `/age-gate` before any product, price, or video renders.
    - `AC-AGE-02`: Declining (under 21) shows the Exit Screen with NY OCM legal notice, link to `cannabis.ny.gov`, and sets no verified cookie.
    - `AC-AGE-03`: Confirming 21+ sets `owt_age` HTTP-only signed cookie with 30-day expiry and redirects to intended destination; subsequent visits load directly without re-prompt.
  - `Vitest Unit & Integration Tests` (38/38 passed):
    - Cryptographic HMAC-SHA256 signing and verification (`signAgeToken`, `verifyAgeToken`).
    - Malformed, expired, and tampered token rejection with cookie cleanup.
    - `POST /api/age-verify` (400 on invalid body, 403 on decline, 200 on confirm).
    - `GET /api/age-verify` returns verification status.
    - Edge Middleware guard: redirects storefront routes to `/age-gate?next=`; returns HTTP 451 `AGE_GATE_REQUIRED` on unverified `/api/*` endpoints; allows bypass on public endpoints.
    - Regulatory audit: zero DOB, government ID, or payment fields collected or stored in `AgeVerificationSession`.
  - Tri-Platform Verification (`bash scripts/verify-task.sh TASK-005`): Passed.
  - TypeScript: `tsc --noEmit` passed (0 errors).
  - ESLint: `next lint` passed (0 warnings/errors).

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-006 শুরু করো। [Tier: LEVEL: STANDARD]
```
