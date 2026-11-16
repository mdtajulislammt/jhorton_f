# TASK-008: Terrific Live Shopping Embed & Cart/Checkout Bridge

> **Status**: `DONE`  
> **Assignee**: `friday` (Web Frontend Specialist)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `HEAVY`  
> **Token Budget**: High (~4,000 - 6,000 tokens)  
> **Model Advice**: Use High-Reasoning / CoT Model (e.g. Sonnet / Pro / R1 / GPT-4o / o1)  
> **Dependencies**: `TASK-007`  
> **Roadmap Phase**: Phase 1 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a viewer of an Owtlet live show, replay or shoppable video, I want to tap a pinned product and have it land in the Owtlet cart instantly, and jump to checkout from the player, so that video shopping feels seamless.

---

## 2. Inputs & Context Documents
- Frontend §4: [docs/05-frontend-architecture.md](../../docs/05-frontend-architecture.md)
- Flow 3.1/3.2: [docs/02-system-architecture.md](../../docs/02-system-architecture.md)
- ADR-006: [planning/decisions.md](../decisions.md)
- Reference: verified standalone test page (`terrific-test/index.html`)

---

## 3. Step-by-Step Execution Plan
1. `TerrificEmbed.tsx` (client): set `window.terrificLiveSettings` (cartSyncConfig.cartSyncHandler, goToCheckoutConfig.goToCheckoutHandler) **before** injecting `https://terrific.live/terrific-sdk.js?storeId=BX2hWAVam9JjsFhXP5ZF`; render `<div data-source="terrific" embedding-id="Cki70GhqvLgWGhJbSxg2">`.
2. `src/lib/terrific.ts` bridge: live shows pin **cannabis products only** — send every product to `/api/cart/items` with `source` (`terrific_live` / `terrific_replay` / `terrific_video`) and the current `liveShowId` (links the cart for the show-end hold, REQ-F-016); `404 UNMAPPED_PRODUCT` → error toast "This product isn't available on Owtlet yet." + log. No accessory/Shopify routing.
3. `goToCheckoutHandler` reconciles cart then routes to `/checkout`, returns a resolved value.
4. Subscribe to `cart-change-notification`, `GoToCheckout`, `Navigate` on `window.terrificLive` to sync the Zustand badge.
5. Place the embed on `/` and `/live/[showId]`, loaded only after the age gate.

---

## 4. Expected Outputs
- `src/components/modules/live/TerrificEmbed.tsx`, `src/lib/terrific.ts`, `src/hooks/useTerrificBridge.ts`, `src/app/page.tsx`, `src/app/live/[showId]/page.tsx`, `src/app/live/page.tsx`, `src/app/checkout/page.tsx`, unit/component tests (`src/__tests__/terrific-bridge.test.ts`, `src/__tests__/components/terrific-embed.test.tsx`), and Playwright E2E spec (`e2e/live.spec.ts`).

---

## 5. Acceptance Criteria
- [x] AC-LIVE-01/02/03 pass; T-TRF-01 and T-MAP-01 green.
- [x] add/update/remove actions all reflected in the server cart.
- [x] SDK script never loads before the age gate.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && npx vitest run src/__tests__/terrific-bridge.test.ts src/__tests__/components/terrific-embed.test.tsx`
- **Status**: `PASSED`
- **Output Log**: 
  - `src/__tests__/terrific-bridge.test.ts`: 9 tests passed (100%)
  - `src/__tests__/components/terrific-embed.test.tsx`: 4 tests passed (100%)
  - All 134 unit and integration tests passed across the repository.
  - TypeScript `tsc --noEmit` passed with 0 errors.
  - ESLint `next lint` passed with 0 errors.
  - Automated Tri-Platform Verification: `bash scripts/verify-task.sh TASK-008` PASSED.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-010 শুরু করো। [Tier: LEVEL: STANDARD]
```
