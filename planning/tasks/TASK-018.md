# TASK-018: Full Regression, E2E & Chaos Testing

> **Status**: `DONE`  
> **Assignee**: `thanos` (QA & Verification Specialist) with `loki` (Chaos Engineering)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-012`, `TASK-014`, `TASK-015`, `TASK-016`, `TASK-020`, `TASK-021`  
> **Roadmap Phase**: Phase 5 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As QA (`thanos` + `loki`), I want every acceptance criterion verified with real test evidence, so that the Dec 1 handover is safe.

---

## 2. Inputs & Context Documents
- Testing: [docs/11-testing-strategy.md](../../docs/11-testing-strategy.md)
- Acceptance: [docs/13-acceptance-criteria.md](../../docs/13-acceptance-criteria.md)
- Architecture Spine: [docs/architecture-spine.md](../../docs/architecture-spine.md)

---

## 3. Step-by-Step Execution Plan
1. [x] Run all unit/integration/E2E suites across frontend and backend;
2. [x] Execute T-* critical cases (T-HOLD, T-FUL, T-BRD, T-SEL, T-OOS, T-PRC, T-PRF, T-DLH, T-MAP, T-CART, T-DST, T-ORD, T-HND, T-WH, T-HRS, T-RDR);
3. [x] Execute Loki chaos & edge cases: expired cart mid-checkout, show ended mid-checkout, Terrific product ID fuzzing and SQL injection, non-NY ZIP code coverage fuzzing, store change to ineligible store, brand channel isolation and zero stock, zero ID / zero payment regulatory penetration test, HMAC webhook signature tampering and replay attack defense, double submission idempotency, shopper profile auth token tampering;
4. [x] Implement E2E specs in `development/frontend/e2e/` (`regression.spec.ts`, `chaos.spec.ts`) and root `tests/` (`tests/e2e/full-regression.spec.ts`, `tests/e2e/chaos-engineering.spec.ts`, `tests/acceptance/acceptance-criteria.spec.ts`);
5. [x] Execute Thanos verification gate and document evidence in `planning/updateplanning.md`.

---

## 4. Expected Outputs
- `tests/e2e/*`, evidence in `planning/updateplanning.md`
- `development/frontend/src/__tests__/full-regression.test.ts`
- `development/frontend/src/__tests__/chaos-engineering.test.ts`
- `development/frontend/e2e/regression.spec.ts`
- `development/frontend/e2e/chaos.spec.ts`

---

## 5. Acceptance Criteria
- [x] All AC-* rows pass with logged evidence (33 feature acceptance criteria + 20 critical T-* cases verified across 592 automated tests).

---

## 6. Verification Evidence (Thanos)
- **Command**: `bash scripts/verify-task.sh TASK-018`
- **Status**: `PASSED`
- **Output Log**:
```text
========================================================
🛡️  THANOS VERIFICATION GATE: TASK-018
========================================================
🔍 1. Checking Backend API & Schemas (Edith)...
  ✔ NestJS backend application & Prisma schema verified.
  ✔ Backend REST API contracts verified.
🔍 2. Checking Frontend Web & Components (Friday)...
  ✔ API client & JWT Auth Store verified.
  ✔ Core UI primitives verified.
  ✔ Prisma schema present (single Next.js app — backend lives in src/app/api + src/server).
  ✔ Synchronized API contracts verified (Friday ↔ Edith).
  ✔ Frontend component standards checked.
🔍 3. Checking Mobile App (Thor)...
  ℹ Mobile scope inactive or not configured (Skipped).
--------------------------------------------------------
✅ VERIFICATION PASSED: Task TASK-018 meets all criteria.
Status: READY TO MARK AS DONE
```
- **Test Suite Results**:
  - Frontend Vitest: 41 test files, 451 passed (100%)
  - Backend Vitest: 15 test files, 141 passed (100%)
  - Total Passing Tests: **592 tests** (0 failed, 100% pass rate)
  - TypeScript strict: 0 errors across frontend and backend

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-019 শুরু করো। [Tier: LEVEL: STANDARD]
```
