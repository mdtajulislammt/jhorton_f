# TASK-023: Live Player Age Check & Cart Per-Store Price Fix

> **Status**: `DONE`  
> **Assignee**: `friday` (Web) + `edith` (cart service)  
> **Priority**: `P0` (blocks live shopping)  
> **Complexity Level**: `HEAVY` (touches age-gate logic and cart pricing)  
> **Dependencies**: TASK-005 (age gate), TASK-007 (cart), TASK-008 (Terrific embed)  
> **Found by**: TASK-022 visual QA, 2026-11-16

---

## 1. Bug A — Live player never loads (AC-LIVE-01)
- `src/components/modules/live/TerrificEmbed.tsx` checks `Cookies.get('owt_age')` in the browser.
- `owt_age` is HttpOnly by design (TASK-005, asserted in `e2e/age-gate.spec.ts`), so the browser cannot read it.
- Result: every verified visitor sees "Age Verification Required" and the Terrific SDK is never injected. Affects `/`, `/live`, `/live/[showId]`, `/videos/[id]`.
- Keep the cookie HttpOnly. Options:
  1. Server pages verify the signed cookie and pass `ageVerified` to `TerrificEmbed` (recommended; middleware already guards these routes).
  2. Add a small `GET /api/age-verify` status endpoint the embed calls.
  3. Middleware sets a non-sensitive, non-HttpOnly companion flag (weakest).
- Update `src/__tests__/components/terrific-embed.test.tsx` accordingly.

## 2. Bug B — Per-store products show $0.00 in the cart
- `src/server/cart/index.ts` (`formatCartDto`) calls `computeCatalogPricing(product)` without `product.inventory`, so `fromPrice` is null and unit price falls back to `'0.00'` when the line has no `preferredDispensaryId`.
- Checkout prices the same line correctly ($60 each vs $0.00 in cart/drawer).
- Fix: `computeCatalogPricing(product, product.inventory)` (frontend server layer and the NestJS mirror in `development/backend/` if it has the same code). Add a unit test for a PER_STORE line without a preferred store.
- Interim mitigation already shipped in TASK-022: catalog card quick-add for PER_STORE products links to the product page (store choice) instead of adding directly.

## 3. Acceptance
- [x] Verified visitor sees the Terrific player on `/` and `/live/[showId]`; unverified request still redirected by middleware; cookie stays HttpOnly.
- [x] PER_STORE cart line without a store shows the lowest in-stock price (same as the catalog "From" price).
- [x] Tests pass; `bash scripts/verify-task.sh TASK-023`.

## 4. Progress log
- **2026-11-16** — Done.
  - **Bug A (option 1):** new `src/server/age-session/verified.ts` → `isAgeVerified()` runs the same HMAC check as the middleware (`verifyAgeToken`) on `cookies()`. `TerrificEmbed` now takes a **required** `ageVerified` prop, and `js-cookie` and the client cookie read are removed. `/`, `/live`, `/live/[showId]`, `/videos/[id]` pass it. The cookie stays HttpOnly.
  - **Bug B:** `formatCartDto` passes active-store inventory to `computeCatalogPricing` (the cart include now selects `dispensary.isActive`), in both `development/frontend` and `development/backend`.
  - **Build unblocked (found while verifying):** `shopper-account/edge-crypto.ts` got a type-only `BufferSource` cast (same as `age-session/crypto.ts`), which fixes the long-standing TS error. `/account/login`, `/account/register`, `/account/reset` and `/admin/login` are wrapped in `<Suspense>` because `useSearchParams()` failed prerender. **`next build` now passes** (run in an isolated copy, not the working tree's `.next`).
  - Tests: +4 `age-verified.test.ts`, +4 `cart-pricing.test.ts` (fails 3/4 against the old code), +2 `terrific-embed.test.tsx` (unverified fallback, no client cookie read). Frontend 461/461, backend 145/145. Typecheck 0 errors (frontend + backend). ESLint 0 errors.
  - Browser check (Playwright, isolated dev server): unverified → redirected to `/age-gate`, no Terrific requests; `owt_age` httpOnly=true; after verifying, `/`, `/live`, `/live/[showId]` render the anchor + SDK script with no fallback; a PER_STORE cart line without a store shows $58.00 (catalog From $58.00), not $0.00. The video area renders black in headless Chromium, so actual stream playback still needs a check in a real browser.
  - Kept from TASK-022: PER_STORE catalog quick-add links to the product page to choose a store. Checkout allocation can choose a store whose price is above the "From" price (seen: $60 vs $58), so picking the store up front avoids a price change at checkout.
