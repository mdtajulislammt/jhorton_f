# TASK-014: Store → Owtlet Confirmation Webhook & Order Status Page

> **Status**: `DONE`  
> **Assignee**: `edith` (Backend & Data Architect) & `friday` (Frontend UI)  
> **Priority**: `P1` (High)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-013`  
> **Roadmap Phase**: Phase 3 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a partner dispensary, I want to confirm an order back to Owtlet, so that the shopper sees it as confirmed. Format supports HMAC-SHA256 authenticated webhooks and signed token links for dispensaries without webhook infrastructure (Q-002, docs/08 §10, ADR-005).

---

## 2. Inputs & Context Documents
- API §10: [docs/08-api-contract.md](../../docs/08-api-contract.md)
- Security §3: [docs/10-security-plan.md](../../docs/10-security-plan.md)
- Distribution & Status Roll-up: [docs/06-distribution-algorithm.md](../../docs/06-distribution-algorithm.md)

---

## 3. Step-by-Step Execution Plan
1. `src/server/orders/confirm.ts`: Cryptographic HMAC-SHA256 signature verification (`X-Owtlet-Signature`), ±5-minute timestamp replay protection (`X-Owtlet-Timestamp`), signed token links for direct confirmation (`?token=<jwt-hmac-token>`), and atomic order status roll-up (`confirmSubOrder`, `processStoreConfirmationWebhook`).
2. Next.js Route Handlers: `src/app/api/webhooks/store-confirmation/route.ts` (`POST` and `GET`).
3. NestJS Module & Controller: `development/backend/src/modules/webhooks/` (`webhooks.controller.ts`, `webhooks.module.ts`, registered in `app.module.ts`).
4. Storefront Status Tracking UI: `src/app/order/[id]/page.tsx` upgraded with real-time status banners, green confirmed badges, confirmation reference numbers (`STORE-A-xxxx`), timestamp display (EST), store tracking links, and decline alerts.
5. Automated Verification: Unit, route, and integration tests across frontend (Vitest) and backend (NestJS/Vitest).

---

## 4. Outputs Created & Modified
- `development/frontend/src/server/orders/confirm.ts`: Domain service for HMAC signature checks, signed token links, idempotency, conflict rejection, and status roll-up.
- `development/frontend/src/server/orders/index.ts`: Re-exported confirmation functions.
- `development/frontend/src/app/api/webhooks/store-confirmation/route.ts`: Public webhook Route Handler (`POST` & `GET`).
- `development/frontend/src/types/api.generated.ts`: Added `StoreConfirmationRequestDto` and `StoreConfirmationResponseData`.
- `development/frontend/src/app/order/[id]/page.tsx`: Upgraded order status tracking page.
- `development/backend/src/server/orders/confirm.ts`: Mirrored backend domain service.
- `development/backend/src/server/orders/index.ts`: Mirrored backend re-exports.
- `development/backend/src/modules/webhooks/webhooks.controller.ts`: NestJS Webhooks controller.
- `development/backend/src/modules/webhooks/webhooks.module.ts`: NestJS Webhooks module.
- `development/backend/src/app.module.ts`: Registered `WebhooksModule`.
- `development/backend/src/main.ts`: Added `rawBody: true` and webhook headers to CORS.
- `development/frontend/src/__tests__/webhook-confirmation.test.ts`: 22 unit & domain tests.
- `development/frontend/src/__tests__/routes/webhooks.route.test.ts`: 11 route tests.
- `development/backend/src/__tests__/webhook-confirmation.test.ts`: Backend test suite.

---

## 5. Acceptance Criteria
- [x] AC-CNF-01 / T-WH-01 green:
  - Correctly signed HMAC confirmation transitions SubOrder to `CONFIRMED`.
  - Parent Order status rolled up atomically (all confirmed -> `CONFIRMED`, partial -> `PARTIALLY_CONFIRMED`, all rejected -> `CANCELLED`).
  - Invalid signature or expired timestamp rejected with 401 `INVALID_SIGNATURE`.
  - Idempotent repeated confirmations return 200 without error.
  - Conflicting confirmation reference rejected with 409 `CONFIRMATION_CONFLICT`.
  - Real-time confirmation badges and reference details visible on `/order/[id]`.

---

## 6. Verification Evidence (Thanos)
- **Frontend Vitest**: `cd development/frontend && npx vitest run` -> 296 tests passed (27 test files, 100% pass rate).
- **Backend Vitest**: `bash scripts/clean-run.sh test-backend` -> 136 tests passed (14 test files, 100% pass rate).
- **Tri-Platform Verification**: `bash scripts/verify-task.sh TASK-014` -> Passed.
- **Status**: `DONE`

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-015 শুরু করো। [Tier: LEVEL: STANDARD]
```
