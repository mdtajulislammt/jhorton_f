# TASK-010: Dispensaries: ZIP Coverage, Hours & Distance API

> **Status**: `BACKLOG`  
> **Assignee**: `edith` (Backend & Data Architect)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-004`  
> **Roadmap Phase**: Phase 2 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As the checkout system, I need to know which partner dispensaries can serve a shopper for pickup or delivery (delivery ZIPs, brand assignment), whether they are open / delivering now, and how far they are, so that orders route only to eligible stores.

---

## 2. Inputs & Context Documents
- API §6: [docs/08-api-contract.md](../../docs/08-api-contract.md)
- Backend §3: [docs/06-backend-architecture.md](../../docs/06-backend-architecture.md)

---

## 3. Step-by-Step Execution Plan
1. `src/server/dispensaries`: `findEligible({ fulfillmentType, zip, brandId? })` (DELIVERY = `offersDelivery` ∧ zip ∈ `coverageZips`; PICKUP = `offersPickup`, sorted by distance; brand → assigned stores only), `isOpenNow(STORE hours)`, `isDeliveringNow(DELIVERY hours)` in America/New_York (DST, past-midnight closing), `distanceMiles(zip, dispensary)` from ZIP centroids.
2. `GET /api/dispensaries?zip=&fulfillment=&brand=` with 422 `NO_COVERAGE` for DELIVERY outside the 5 regions.

---

## 4. Expected Outputs
- `src/server/dispensaries/*`, `src/app/api/dispensaries/route.ts`, tests

---

## 5. Acceptance Criteria
- [ ] T-DST-03, T-HRS-01, T-DLH-01 and T-FUL-01 green (REQ-F-012, REQ-F-018).
- [ ] Coverage limited to Manhattan, Queens, Brooklyn, Westchester, Long Island.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && pnpm test -- dispensaries`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-011 শুরু করো। [Tier: LEVEL: HEAVY]
```
