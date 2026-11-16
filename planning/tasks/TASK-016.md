# TASK-016: Live Shows Model, Show Rail & Replays

> **Status**: `DONE`  
> **Assignee**: `friday` (Web Frontend Specialist)  
> **Priority**: `P1` (High)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-008`  
> **Roadmap Phase**: Phase 4 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a shopper, I want to see what is live now, upcoming shows, replays and shoppable videos with their pinned products, so that I can join, rewatch or shop any video; as an admin, I want to start and end shows so carts are held until 30 minutes after the show ends.

---

## 2. Inputs & Context Documents
- API §7: [docs/08-api-contract.md](../../docs/08-api-contract.md)

---

## 3. Step-by-Step Execution Plan
1. Edith: `src/server/live-shows` + `GET /api/live-shows?status=&format=&brand=`; product pinning via `ShowProduct` (reject products without `owtletPrice` → 422 `PRICE_REQUIRED`), `Product.terrificProductId` mapping.
2. Edith: admin `POST /api/admin/live-shows/{id}/start` (status LIVE, `startedAt`) and `/end` (`endedAt`, status REPLAY, `cart.recomputeHeldCarts(showId)`); `scheduledEndAt` fallback.
3. Friday: ShowRail, LiveBadge, replay listing on `/`; `/videos` + `/videos/[id]` for `SHOPPABLE_VIDEO` (embed with `source = terrific_video`).
4. Verify on the Terrific account that shoppable videos/replays fire the same `cartSyncHandler` (record result in updateplanning.md).

---

## 4. Expected Outputs
- `src/server/live-shows/*`, `src/app/api/live-shows/route.ts`, `src/components/modules/live/*`

---

## 5. Acceptance Criteria
- [x] Live/upcoming/replay/shoppable-video states render with skeleton & empty states.
- [x] AC-LIVE-04, AC-HOLD-01 (End show) and AC-PRC-01 (pinning guard) pass; T-HOLD-01 green.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && npx vitest run src/__tests__/live-shows.test.ts src/__tests__/routes/live-shows.route.test.ts src/__tests__/components/live-shows.test.tsx`
- **Status**: `PASSED`
- **Output Log**: 
  - `src/__tests__/live-shows.test.ts`: 9/9 passed (ordering, filtering, AC-PRC-01 price guard, AC-HOLD-01 cart hold recomputation)
  - `src/__tests__/routes/live-shows.route.test.ts`: 4/4 passed (`GET /api/live-shows` and `GET /api/live-shows/[id]`)
  - `src/__tests__/components/live-shows.test.tsx`: 9/9 passed (`LiveBadge`, `ShowCard`, `ShowRail`, `PinnedProductRail` with AC-LIVE-04)
  - Tri-Platform verification: `bash scripts/verify-task.sh TASK-016` PASSED.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-017 শুরু করো। [Tier: LEVEL: LIGHT]
```
