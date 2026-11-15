# TASK-011: Multi-Dispensary Distribution & Parent/Sub-Order Creation

> **Status**: `BACKLOG`  
> **Assignee**: `edith` (Backend & Data Architect)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `HEAVY`  
> **Token Budget**: High (~4,000 - 6,000 tokens)  
> **Model Advice**: Use High-Reasoning / CoT Model (e.g. Sonnet / Pro / R1 / GPT-4o / o1)  
> **Dependencies**: `TASK-007`, `TASK-010`  
> **Roadmap Phase**: Phase 2 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As Owtlet, I want each cart split into a parent order plus per-dispensary sub-orders — honoring pickup/delivery eligibility, brand channels and the shopper's store choice, then favoring the store with the most items — so that shoppers get their order from as few (and the right) stores as possible.

---

## 2. Inputs & Context Documents
- Algorithm: [docs/06-backend-architecture.md](../../docs/06-backend-architecture.md) §4
- API §8: [docs/08-api-contract.md](../../docs/08-api-contract.md)
- ADR-007: [planning/decisions.md](../decisions.md)

---

## 3. Step-by-Step Execution Plan
1. `src/server/distribution/allocate.ts` — pure allocator (docs/06 §4): per-line eligibility (fulfillment type, ZIP, brand channel) → `itemOverrides` → `preferredDispensaryId` (shopper change / profile default) → greedy most-items with deterministic tie-breaks; returns subOrders (`assignment`, `alternatives`) + unfulfillable (`suggestions`, ≤ 3 nearest stores with stock). Prices via `pricing.unitPrice`.
2. `POST /api/orders/preview` (with `previewHash`), `POST /api/orders` (validates `contact` + `deliveryAddress` for DELIVERY; transaction: Order with `fulfillmentType` + contact + optional `shopperId`, SubOrders, OrderItems, cart → CHECKED_OUT), `GET /api/orders/[id]` (cart session or owning shopper).
3. Order number generator `OWT-xxxxxx`; status roll-up helper.

---

## 4. Expected Outputs
- `src/server/distribution/*`, `src/server/orders/*`, `src/app/api/orders/**`, tests

---

## 5. Acceptance Criteria
- [ ] T-DST-01/02/04, T-ORD-01, T-FUL-01, T-SEL-01, T-OOS-01, T-BRD-01 (allocator part) green; AC-DST-01/02, AC-FUL-01/02, AC-SEL-01, AC-OOS-01, AC-PRC-01 pass at API level.
- [ ] Order rejects DOB/ID/payment keys (`.strict()`).
- [ ] Order creation is atomic; stale preview → 409.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && pnpm test -- distribution orders`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-012 শুরু করো। [Tier: LEVEL: STANDARD]
```
