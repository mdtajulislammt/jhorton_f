# TASK-007: Custom Cannabis Cart API (30-min TTL) & Cart Drawer

> **Status**: `READY`  
> **Assignee**: `edith` (Backend & Data Architect)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `HEAVY`  
> **Token Budget**: High (~4,000 - 6,000 tokens)  
> **Model Advice**: Use High-Reasoning / CoT Model (e.g. Sonnet / Pro / R1 / GPT-4o / o1)  
> **Dependencies**: `TASK-006`  
> **Roadmap Phase**: Phase 1 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a shopper, I want cannabis items I add (from the catalog, a brand storefront or a video) held in Owtlet's own cart — until 30 minutes after the live show ends for live-show carts, otherwise 30 minutes after my last change — so that I can check out with partner dispensaries.

---

## 2. Inputs & Context Documents
- API: [docs/08-api-contract.md](../../docs/08-api-contract.md) §4
- Backend: [docs/06-backend-architecture.md](../../docs/06-backend-architecture.md) §3
- Journey J-2: [docs/04-experience-spec.md](../../docs/04-experience-spec.md)

---

## 3. Step-by-Step Execution Plan
1. `src/server/cart`: get-or-create by `owt_cart` cookie; `src/server/cart/expiry.ts` implements docs/07 §2.2 (live-show hold via `Cart.liveShowId` + `LiveShow.endedAt`/`scheduledEndAt`, else `lastActivityAt + 30 min`); reject/purge expired (410 `CART_EXPIRED`); optional Redis TTL mirror. Export `recomputeHeldCarts(showId)` for TASK-016's End show.
2. Payload mapper: `{ action, source, liveShowId?, channelBrandSlug?, cartProducts[] }` → add/update/remove (lines keyed by product + channel brand; NULL-safe upsert); resolve `productId` → `terrificProductId` → `sku`; unmapped → 404 `UNMAPPED_PRODUCT`.
3. Route Handlers `GET|DELETE /api/cart`, `POST|PATCH|DELETE /api/cart/items`.
4. Friday: `cart.store.ts` (Zustand, incl. `hold`), `useCart` (TanStack Query), CartDrawer, CartLine (one price for show products, brand channel chip), CartTimer ("Held until 30 min after the show ends" / 30:00 countdown), `/cart` page with Empty/Expired states.

---

## 4. Expected Outputs
- `src/server/cart/*`, `src/app/api/cart/**`, `src/stores/cart.store.ts`, `src/hooks/useCart.ts`, `src/components/modules/cart/*`, `src/app/(shop)/cart/page.tsx`

---

## 5. Acceptance Criteria
- [ ] AC-CART-01/02 and AC-HOLD-01 (service level) pass; T-CART-01 and T-HOLD-01 green.
- [ ] Unmapped product ids are rejected with `UNMAPPED_PRODUCT` and nothing is added.
- [ ] All 6 UI states in the cart drawer/page.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && pnpm test -- cart`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-008 শুরু করো। [Tier: LEVEL: HEAVY]
```
