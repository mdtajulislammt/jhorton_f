# Session Progress & Checkpoint Log

## Current Status

- **Project**: Owtlet™ — cannabis marketplace + live shopping (`owtlet.com`) · Client: Jesce Horton (Grand National Agency) · Deadline: **Dec 1, 2026**
- **Project Phase**: Phase 0 complete (planning & scaffolding filled) → Phase 1 Foundation 100% COMPLETE → Phase 2 Complete → **Phase 3 In Progress**
- **Last Updated**: 2026-11-16
- **Current Task**: Completed [`TASK-014`](tasks/TASK-014.md) (Dispensary confirmation webhook & order status tracking)
- **Next Dependency-Ready Task**: [`TASK-015`](tasks/TASK-015.md) (Admin console for products, inventory, hours, brands, and order overrides)
- **Overall Status**: `IN_PROGRESS` (Phase 3 In Progress)
- **Architecture change (2026-11-16, ADR-016)**: Per explicit developer instruction, decoupled architecture into two dedicated folders: `development/frontend/` (Next.js 14+ Storefront Web app, port 3000) and `development/backend/` (NestJS 10+ REST API + Prisma ORM + Swagger docs, port 4000). Next.js proxies `/api/*` to the NestJS backend via rewrites. 432 total tests passing (296 frontend + 136 backend).
- **Client-answer gap closure (2026-11-15)**: Audited against Jesce's written answers (saved verbatim in `input/client-docs/`). Added REQ-F-011…019 (brand storefronts, pickup/delivery, store change + default store, guest checkout + optional profile, one price for show products, cart hold until 30 min after the show ends, out-of-stock suggestions, delivery hours, owtlet.live redirect; shoppable video in REQ-F-003), AC-BRD/FUL/SEL/PRF/PRC/HOLD/OOS/DLH/RDR + AC-LIVE-04, ADR-009…015, TASK-020/021 (BACKLOG). Schema in docs/07 now 21 models (`prisma validate` ✅).
- **Scope change (2026-11-15)**: Platform is **cannabis-only**; accessories / `owtlet.shop` Shopify are out of scope (separate team member). REQ-F-005 removed, TASK-009 CANCELLED, Q-005 resolved, `AccessoryRef`/`ProductKind`/Shopify endpoints removed from docs (ADR-008).

---

## Completed

- [x] Initialized Avengerse Multi-Agent Template configuration (`project.config.md`).
- [x] Defined global rules and 5-layer architecture (`AGENTS.md`).
- [x] [`TASK-001`](tasks/TASK-001.md): Owtlet brief filled in `README.md`; stack set to Next.js full-stack (Route Handlers + Server Actions) + Prisma + PostgreSQL (Redis optional, mobile disabled) in `project.config.md`.
- [x] `docs/01`–`14`, `architecture-spine.md`, `domain-lexicon.md` filled with Owtlet specifics (Prisma schema, `/api` contract, distribution algorithm, Terrific bridge, security/compliance, roadmap).
- [x] Brand tokens extracted from the owtlet.shop Shopify theme (Mint `#70F1C7`, Ink `#0D221E`, Sage `#BBD7D1`, Dela Gothic One + Red Rose).
- [x] Terrific SDK v2 client-side hooks verified with a standalone test page (ADR-006).
- [x] ADR-003…008 recorded; open questions Q-001…Q-005 logged (Q-005 later resolved as out of scope); task board TASK-001…019 created.
- [x] Gap closure vs client answers: REQ-F-011…019, ADR-009…015, TASK-020/021, schema/API/journeys/roadmap updated; template scaffolds cleaned (2026-11-15).
- [x] [`TASK-002`](tasks/TASK-002.md): Scaffolded Next.js App Router (TypeScript strict, Tailwind CSS, shadcn/ui primitives, Zustand, TanStack Query, Vitest). Configured `next.config.mjs` (`output: 'standalone'`), `src/server/db.ts` Prisma singleton, `src/server/http.ts` envelope helpers (`ok()`/`fail()`), `GET /api/health` Route Handler with DB ping, 21+ Age Gate middleware, and `Dockerfile.frontend` standalone build. All lint, typecheck, tests, and Thanos verification passed.
- [x] [`TASK-003`](tasks/TASK-003.md): Applied Owtlet brand tokens (Mint `#70F1C7`, Ink `#0D221E`, Sage `#BBD7D1`, Dela Gothic One + Red Rose) into `globals.css` and `tailwind.config.ts`. Styled UI primitives (`Button` pill variants Mint→Volt hover, `Badge` with pulsing LIVE Ember badge, `Card`, `Input` with 44px ergonomics, `Dialog`, `Skeleton`, `EmptyState`) with strict WCAG 2.2 AA contrast (~11.88:1 Mint+Ink). Documented all 6 UI-state patterns with Owtlet domain copy in `DESIGN_GUIDELINES.md`. 18 tests passing; Thanos verification passed.
- [x] [`TASK-004`](tasks/TASK-004.md): 21-model relational schema migrated in PostgreSQL with raw GIN index on `dispensaries.coverage_zips`. Seed script (`prisma/seed.ts`) populates 40 NY coverage ZIPs (Manhattan, Brooklyn, Queens, Westchester, Long Island), 5 cannabis categories, 7 strains, 3 dispensaries (Gotham Greenery [pickup+delivery], Kings County [pickup-only], Empire Express [delivery-only]) with 42 hours records (STORE & DELIVERY kinds), 2 brands with partner store mappings, 5 products (3 show products with `owtletPrice` and 2 catalog products with per-store prices), 10 inventory records, 1 active live show with 3 pinned show products, 1 demo shopper with default store + saved address, and 1 admin user with argon2id password. Confirmed zero ID/DOB/payment fields. 22 tests passing; Thanos verification passed.
- [x] [`TASK-005`](tasks/TASK-005.md): 21+ Age Gate edge middleware (`src/middleware.ts`) enforcing HMAC-SHA256-signed attestation cookie (`owt_age`, 30-day TTL, HttpOnly, SameSite=Lax). Route Handler `POST /api/age-verify` and Server Action `confirmAge()` with audit logging (`AgeVerificationSession`, zero DOB/ID). Storefront redirection to `/age-gate?next=`; unverified `/api/*` requests blocked with HTTP 451 `AGE_GATE_REQUIRED`. Fully styled `/age-gate` UI with prompt and exit screens matching domain lexicon. 38 Vitest tests + 3 Playwright E2E tests passing; Thanos verification passed.
- [x] [`TASK-006`](tasks/TASK-006.md): Cannabis catalog API, pages, one-price pricing logic, and Shopify test-data import.
  - `src/server/pricing`: `determinePriceMode`, `resolveUnitPrice`, `computeCatalogPricing`, `formatMoney` (REQ-F-015, ADR-011). Uniform Owtlet price for show products (`priceMode = 'OWTLET'`) vs retail per-store price (`priceMode = 'PER_STORE'`).
  - `src/server/products`: `listProducts` with filtering (category, strainType, minThc/maxThc, brand, search query) and cursor pagination; `getProductBySlug` with multi-dispensary availability, ZIP delivery coverage, distance calculation; `resolveProduct` by `productId`, `terrificProductId`, `externalId`, or `sku` (T-MAP-01).
  - Route Handlers: `GET /api/products`, `GET /api/products/[slug]`, `GET /api/products/resolve` with strict Zod validation and standardized envelope.
  - `prisma/seed-shopify-import.ts`: 22 authentic Shopify test cannabis products from store `f1jc7p-fs` with `shopifyLegacyId` mapped across all 5 NY categories, 3 partner dispensaries, and initial inventory.
  - Friday & Jarvis UI: `/shop`, `/shop/[category]`, `/product/[slug]` with `ProductCard` (one price vs from $X), `FilterBar`, `StoreAvailabilityList` (pickup/delivery badges, out-of-stock suggestions, ZIP checker), `ProductGridSkeleton`, `ProductDetailSkeleton`, 44px ergonomics, active compression (`active:scale-[0.98]`).
  - 87 unit and integration tests passing; Thanos verification passed.
- [x] [`TASK-007`](tasks/TASK-007.md): Custom cannabis cart API (30-min TTL / show-end + 30 min hold) & Cart Drawer.
  - `src/server/cart`: Cart service & expiry calculation (`expiry.ts`) enforcing REQ-F-016 & ADR-012 (show-end + 30m hold for live show carts, otherwise 30-min sliding window from last activity).
  - Route Handlers: `GET /api/cart`, `DELETE /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items`, `DELETE /api/cart/items` with cookie-backed session (`owt_cart`).
  - Friday & Jarvis UI: `CartDrawer` with slide-in animation, `CartLine` with Owtlet single-price indicators, `CartTimer` countdown badge, and `/cart` page with all 6 mandatory UI states.
  - 34 unit and integration tests added; Thanos verification passed.
- [x] [`TASK-008`](tasks/TASK-008.md): Terrific Live Shopping SDK v2 Embed & Cart/Checkout Bridge.
  - `src/lib/terrific.ts`: Universal client bridge implementing `TerrificBridge` (`sync`, `reconcile`, `goToCheckout`, `initializeSettings`). Normalizes pinned cannabis products from player stream, sends direct to `/api/cart/items` with `source` (`terrific_live` / `terrific_replay` / `terrific_video`) and `liveShowId`. Handles unmapped products with 404 `UNMAPPED_PRODUCT` non-blocking toast (`"This product isn't available on Owtlet yet."`).
  - `src/stores/toast.store.ts` & `src/components/ui/toaster.tsx`: Lightweight, accessible, design-token styled toast notification system (`toast.success`, `toast.error`, `toast.info`).
  - `src/hooks/useTerrificBridge.ts`: React hook managing SDK event listeners (`cart-change-notification`, `GoToCheckout`, `Navigate`) and automatic cleanup.
  - `src/components/modules/live/TerrificEmbed.tsx`: Client component rendering `<div data-source="terrific" embedding-id="...">` with strict pre-age-gate script blocking (never injects SDK before age gate), 6 UI states (Default, Shimmer Skeleton, Empty State, Error with Retry, Video/Vertical responsive aspect ratios, Live Badge overlay).
  - Pages: Integrated live stream hero on `/` (`src/app/page.tsx`), dedicated live show player on `/live/[showId]` (`src/app/live/[showId]/page.tsx`), show/replay index `/live` (`src/app/live/page.tsx`), and placeholder `/checkout` route.
  - 13 unit and component tests added (134 total Vitest tests passing across codebase) + Playwright E2E spec (`e2e/live.spec.ts`). Thanos verification passed.
- [x] [`TASK-010`](tasks/TASK-010.md): Dispensary eligibility, hours, distance API (REQ-F-012, REQ-F-018, ADR-010, T-DST-03, T-HRS-01, T-DLH-01, T-FUL-01).
  - `src/server/dispensaries/hours.ts`: `isOpenNow`, `isDeliveringNow`, `getDispensaryHoursToday`, `getZonedTime`. Accurate timezone calculation in `America/New_York` with full past-midnight shift closing (e.g. 18:00 to 02:00 next day) and DST spring-forward / fall-back transitions. Independent STORE vs DELIVERY hours evaluation.
  - `src/server/dispensaries/distance.ts`: Haversine straight-line distance calculation from centroid coordinates (`calculateDistanceMiles`), and NY 5-region coverage ZIP lookup (`getZipInfo`).
  - `src/server/dispensaries/eligibility.ts`: `findEligible` engine supporting DELIVERY (`offersDelivery` ∧ `zip ∈ coverageZips` with strict 5-region NY coverage gate; throws `NoCoverageError` 422 if outside) and PICKUP (`offersPickup`, sorted nearest first by `distanceMiles`); brand-scoping via `brandSlug` / `brandId`.
  - Route Handler: `GET /api/dispensaries?zip=&fulfillment=&brand=` in `src/app/api/dispensaries/route.ts` with strict Zod validation, 400 for missing zip on delivery, 422 for `NO_COVERAGE`, and standard envelope.
  - Updated `src/types/api.generated.ts` with synchronized dispensary contract types.
  - 30 new unit, integration & route handler tests added (164 total tests passing across codebase). Thanos verification passed.
- [x] [`TASK-011`](tasks/TASK-011.md): Multi-dispensary distribution allocator & parent/sub-order generation (docs/06 §4, docs/08 §8, ADR-005, ADR-007, ADR-011, ADR-012, T-DST-01..04, T-ORD-01, T-FUL-01, T-SEL-01, T-OOS-01, T-BRD-01, T-PRC-01, AC-SEC-01).
  - `src/server/distribution/allocate.ts`: Pure greedy allocator. Evaluates per-line candidate stores (fulfillment type: DELIVERY `offersDelivery` ∧ `zip ∈ coverageZips`, PICKUP `offersPickup`, and brand channel scoping `channelBrandId ∈ dispensary.brandIds`). Applies shopper `itemOverrides` (validating store eligibility → 422 `STORE_NOT_ELIGIBLE`; out-of-stock → unfulfillable `NOT_AT_SELECTED_STORE` with stock suggestions), then assigns remaining lines to `preferredDispensaryId` (`SHOPPER_CHANGED` / `PROFILE_DEFAULT`). Executes greedy auto-allocation loop for remaining lines: selects store supplying the most items in stock (`stockQty >= qty`, never splits a line), with deterministic tie-breaks: lowest subtotal → nearest distance → preferred store hint → name ASC. Outputs sub-orders with lead store covering most items, alternatives per sub-order (`canSupplyAll`, `missingProductIds`, distance), out-of-stock suggestions (≤ 3 nearest active stores with stock), prices via `pricing.unitPrice` (`owtletPrice` uniformity), and SHA-256 `previewHash`.
  - `src/server/distribution/preview.ts`: `createDistributionPreview()` loading cart, active dispensaries, operating hours (America/New_York), distance, and product inventories from PostgreSQL with 21-region NY coverage gate (`NoCoverageError` 422).
  - `src/server/orders/types.ts`: Strict Zod validation schemas (`createOrderSchema`, `previewDistributionSchema`, `contactSchema`, `deliveryAddressSchema`) enforcing `.strict()` on all object levels — rejects any DOB, government ID, or cannabis payment data (AC-SEC-01).
  - `src/server/orders/order-number.ts` & `status.ts`: Collision-free `OWT-xxxxxx` order number generator and status roll-up logic (CONFIRMED when all sub-orders confirmed, PARTIALLY_CONFIRMED, HANDED_OFF, CANCELLED).
  - `src/server/orders/create.ts`: Atomic transaction creating parent `Order`, child `SubOrder` records, and `OrderItem` rows. Validates cart hold expiration (410 `CART_EXPIRED`), unfulfillable items (422 `UNFULFILLABLE_ITEMS`), and stale preview hashes (409 `PREVIEW_STALE`). Idempotent per cart (returns existing order 200 on repeated checkout). Updates cart `status = CHECKED_OUT`.
  - `src/server/orders/get.ts`: `getOrderById()` with ownership access control (cookie cart session or authenticated shopper ID; 403 `FORBIDDEN` / 404 `NOT_FOUND`).
  - Route Handlers: `POST /api/orders/preview`, `POST /api/orders`, and `GET /api/orders/[id]`.
  - Synchronized `src/types/api.generated.ts` with complete order and preview contract DTOs.
  - 50 new unit, integration & route handler tests added (214 total Vitest tests passing across codebase with 100% pass rate). Thanos verification passed.
- [x] [`TASK-012`](tasks/TASK-012.md): Interactive Cannabis Checkout Page, Multi-Store Split, Hours & Distance, and Guest Routing (AC-HRS-01, AC-DLH-01, AC-FUL-01/02, AC-SEL-01, AC-OOS-01, AC-PRF-01, AC-SEC-01).
  - `src/stores/checkout.store.ts`: LocalStorage-persisted Zustand store managing fulfillment method (PICKUP/DELIVERY), NY delivery address, proximity ZIP, customer contact info, preferred dispensary ID, and per-line store overrides (`itemOverrides`).
  - `src/hooks/useCheckoutPreview.ts`: React Query integration orchestrating distribution preview, error states (`NO_COVERAGE`, `CART_EXPIRED`, `STORE_NOT_ELIGIBLE`), atomic order creation mutation, item removal, and auto-refetch on store changes.
  - `src/components/modules/checkout/`:
    - `FulfillmentToggle.tsx`: Tactile pill toggle between Delivery and Dispensary Pickup.
    - `DeliveryAddressForm.tsx` & `PickupLocationForm.tsx`: 5-digit NY coverage validation and proximity ZIP locator for pickup.
    - `SubOrderCard.tsx`: Multi-dispensary split card with live NY operating/delivery hours (`America/New_York`), open/closed status, distance, single Owtlet live show pricing, and assignment badge.
    - `StorePickerDialog.tsx`: Alternative dispensary picker modal with distance, stock coverage ("In Stock - All Items" vs "Missing X items"), and real-time re-allocation.
    - `UnfulfillableList.tsx`: Out-of-stock resolution card with suggested alternatives and item removal (blocks Place Order until resolved).
    - `ContactForm.tsx`: Guest contact form with zero ID / zero payment policy compliance banner and optional profile save.
    - `NoCoverageAlert.tsx`: 5-region NY coverage warning with instant "Switch to Dispensary Pickup" CTA.
    - `CheckoutSummary.tsx`: Order summary with subtotal, dispensary count, zero-payment regulatory disclaimer, and Place Cannabis Order CTA.
    - `CheckoutSkeleton.tsx`: Complete pulse skeleton fulfilling 6 mandatory UI states.
  - `src/app/checkout/page.tsx`: Full storefront checkout page integration.
  - `src/app/order/[id]/page.tsx`: Order confirmation and routing handoff status page.
  - 19 new Vitest unit and component tests added (233 total Vitest tests passing across codebase with 100% pass rate). Playwright E2E spec added. Thanos verification passed.
- [x] [`TASK-013`](tasks/TASK-013.md): Compliant Cannabis Checkout Handoff Providers (Leafly & Retailer Page) (docs/08 §9, ADR-005, T-HND-01, AC-HND-01, AC-SEC-01).
  - Edith (Backend Domain Services):
    - `src/server/checkout-handoff/types.ts`: `HandoffProvider` interface, `HandoffPayload`, `CheckoutHandoffResult`, and strict Zod validation schema `checkoutHandoffSchema` enforcing Zero ID & Zero Payment policy (`.strict()` rejects any payment/ID fields).
    - `src/server/checkout-handoff/providers/retailer-page.provider.ts`: `RetailerPageProvider` supporting template interpolation (`{subOrderId}`, `{orderId}`, `{orderNumber}`, `{dispensaryId}`, `{ref}`) and slug-based fallback URLs.
    - `src/server/checkout-handoff/providers/leafly.provider.ts`: `LeaflyProvider` compliant deep-link stub per Q-001 with `leaflyStoreId` and `owtlet_ref` tracking.
    - `src/server/checkout-handoff/handoff-service.ts`: `executeCheckoutHandoff()` with strict session/shopper ownership verification, atomic SubOrder status transition to `HANDED_OFF`, `handoffUrl` recording, and parent Order status roll-up.
  - Edith (NestJS Controller & Module):
    - `src/modules/checkout/checkout.controller.ts` & `src/modules/checkout/checkout.module.ts`: `@Controller('checkout')` with `@Post('handoff')` registered in `app.module.ts`.
  - Friday (Route Handler & UI Components):
    - `src/app/api/checkout/handoff/route.ts`: Next.js Route Handler for `POST /api/checkout/handoff`.
    - `src/components/modules/checkout/HandoffButton.tsx`: Tactile handoff button (Mint `#70F1C7` → Volt hover, 44px ergonomics, `active:scale-[0.98]`) with Leafly/Retailer badges, 6 UI states (default, connecting spinner, transferred to store, error retry), and domain compliance copy.
    - `src/app/order/[id]/page.tsx`: Upgraded order status screen rendering dispensary sub-orders, product breakdowns, line totals, and live `HandoffButton` per sub-order.
  - Thanos Verification:
    - 30 new unit, route, and component tests added (263 total frontend Vitest tests passing with 100% pass rate).
    - Tri-Platform verification `bash scripts/verify-task.sh TASK-013` passed.
- [x] [`TASK-014`](tasks/TASK-014.md): Store Confirmation Webhook & Real-Time Order Tracking (docs/08 §10, AC-CNF-01, T-WH-01).
  - Edith (Backend Domain Services):
    - `src/server/orders/confirm.ts`: Cryptographic HMAC-SHA256 signature verification (`X-Owtlet-Signature`), ±5-minute timestamp replay protection (`X-Owtlet-Timestamp`), signed token links for direct confirmation (`?token=<jwt-hmac-token>`), and atomic order status roll-up (`confirmSubOrder`, `processStoreConfirmationWebhook`).
    - Enforced idempotency on repeated confirmations (`idempotent: true`) and strict conflict rejection (`409 CONFIRMATION_CONFLICT`) when conflicting confirmation references or invalid state transitions occur.
  - Edith (NestJS Controller & Module):
    - `src/modules/webhooks/webhooks.controller.ts` & `src/modules/webhooks/webhooks.module.ts`: `@Controller('webhooks')` with `@Post('store-confirmation')` and `@Get('store-confirmation')` registered in `app.module.ts`.
    - Configured NestJS with `{ rawBody: true }` and enabled `X-Owtlet-Timestamp` and `X-Owtlet-Dispensary` in CORS.
  - Friday (Route Handler & Order Status Tracking UI):
    - `src/app/api/webhooks/store-confirmation/route.ts`: Next.js public webhook Route Handler supporting both `POST` (HMAC-signed payload) and `GET` (signed link variant with browser redirect to `/order/[id]?confirmed=true`).
    - `src/app/order/[id]/page.tsx`: Upgraded storefront order status tracking page displaying real-time confirmed badges (`CheckCircle2`), store confirmation references (`STORE-A-xxxx`), confirmed timestamp in `America/New_York` (EST), direct store tracking links, and helpful dispensary decline alerts.
  - Thanos Verification:
    - 45 new unit, route, and domain tests added (296 frontend Vitest tests + 136 backend Vitest tests = 432 total passing tests with 100% pass rate).
    - Tri-Platform verification `bash scripts/verify-task.sh TASK-014` passed.

---

## In Progress

- **Task ID**: None (TASK-014 Complete)
- **Next Task ID**: [`TASK-015`](tasks/TASK-015.md) (Admin console for inventory, hours, and live show pricing)
- **Assigned Agent**: `friday` & `edith`
- **Current Checkpoint**: Ready for TASK-015.
- **Next Expected Action**: Build `/admin` dashboard and Route Handlers for products, inventory stock/price, store hours, and live show pricing overrides.

---

## Blocked

- _No foundation task is blocked._
- Late-stage tasks waiting on clarifications (client questions sent Nov 14–15, awaiting reply; Q-006 internal):
  - TASK-017 (final product data) ← Q-004
  - TASK-019 (deploy) ← Q-003 VPS/DNS (owtlet.com + owtlet.live)
  - Production password-reset email (TASK-021/019) ← Q-006 SMTP sender

---

## Next Actions

- [ ] Execute TASK-015 (Admin console for inventory, hours, and live show pricing).
- [ ] Proceed to TASK-016 (Live shows + replays + shoppable videos; start/end show).
- [ ] Follow up with the client on Q-001…Q-004 (needed by ~Nov 22 to keep Phase 3–5 on schedule).

---

## Verification Summary

- **Tests Executed**: 432 Vitest unit & integration tests (296 frontend + 136 backend) + Playwright E2E specs
- **Tests Passed**: 432 (100%)
- **Tests Failed**: 0
- **TypeScript**: `tsc --noEmit` passed across both `development/frontend` and `development/backend` (0 errors)
- **Structure Validation**: `bash scripts/verify-task.sh TASK-014` passed (Edith NestJS backend & Friday frontend verified).

---

## 🚀 Fresh Session Handoff (নতুন চ্যাটে কপি-পেস্ট করার কমান্ড)

> [!TIP]
> **টোকেন সাশ্রয়ের নিয়ম**: প্রতি ১-২টি টাস্ক শেষ হলে বর্তমান চ্যাট বন্ধ করে **নতুন চ্যাট উইন্ডো** খুলুন এবং নিচের এক লাইন পেস্ট করুন:
>
> ```text
> planning/updateplanning.md পড়ে TASK-015 শুরু করো। [Tier: LEVEL: STANDARD]
> ```
