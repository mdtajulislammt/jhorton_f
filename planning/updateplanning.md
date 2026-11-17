# Session Progress & Checkpoint Log

## Current Status

- **Project**: Owtlet™ — cannabis marketplace + live shopping (`owtlet.com`) · Client: Jesce Horton (Grand National Agency) · Deadline: **Dec 1, 2026**
- **Project Phase**: Phase 0 complete (planning & scaffolding filled) → Phase 1 Foundation 100% COMPLETE → Phase 2 Complete → **Phase 3 In Progress**
- **Last Updated**: 2026-11-16
- **Current Task**: Completed [`TASK-023`](tasks/TASK-023.md) (live player age check, cart price, build unblocked) after [`TASK-022`](tasks/TASK-022.md) storefront redesign. Next: client VPS cutover & handover (gated by Q-003). Earlier: [`TASK-019`](tasks/TASK-019.md) (Docker production build, Nginx reverse proxy, Let's Encrypt SSL, owtlet.live 301 redirect, backup, and CI/CD)
- **Next Dependency-Ready Task**: All Core MVP Tasks (Phase 0 through Phase 5) are 100% Complete! Ready for Client VPS Cutover & Handover (Gated by Q-003).
- **Overall Status**: `PHASE_5_COMPLETE` (All Foundation, Checkout, Channels, Media, Admin, Testing, and Deployment Infrastructure Complete)
- **Architecture change (2026-11-16, ADR-016)**: Per explicit developer instruction, decoupled architecture into two dedicated folders: `development/frontend/` (Next.js 14+ Storefront Web app, port 3000) and `development/backend/` (NestJS 10+ REST API + Prisma ORM + Swagger docs, port 4000). Next.js proxies `/api/*` to the NestJS backend via rewrites. 592 unit & integration tests passing with 100% pass rate (451 frontend + 141 backend).
- **Client-answer gap closure (2026-11-15)**: Audited against Jesce's written answers (saved verbatim in `input/client-docs/`). Added REQ-F-011…019 (brand storefronts, pickup/delivery, store change + default store, guest checkout + optional profile, one price for show products, cart hold until 30 min after the show ends, out-of-stock suggestions, delivery hours, owtlet.live redirect; shoppable video in REQ-F-003), AC-BRD/FUL/SEL/PRF/PRC/HOLD/OOS/DLH/RDR + AC-LIVE-04, ADR-009…015, TASK-020/021 (BACKLOG). Schema in docs/07 now 21 models (`prisma validate` ✅).
- **Scope change (2026-11-15)**: Platform is **cannabis-only**; accessories / `owtlet.shop` Shopify are out of scope (separate team member). REQ-F-005 removed, TASK-009 CANCELLED, Q-005 resolved, `AccessoryRef`/`ProductKind`/Shopify endpoints removed from docs (ADR-008).

---

- **Storefront redesign (2026-11-16, TASK-022, DONE)**: Synthesized Weedable/Leafly/Dutchie direction in Owtlet branding (reference: https://claude.ai/artifact/QbZH2VukL1aEvHzqcU5AqB). Phases 1–5 and visual QA done. QA fixed brand fonts (undefined `var(--font-dela/rose)` made Dela Gothic One and Red Rose never render), filter rail heading, link contrast, PER_STORE quick-add. Frontend-only. 451/451 tests, `verify-task.sh TASK-022` passed. Follow-up pixel pass vs the design v3 artifact (1120px column, LiveStage band, 4-up pinned grid, brand cards, reference shop rail with THC range, header sizes) and a Terrific fix (script needs a `storeId` attribute; stream now loads, as a floating widget per the embedding's dashboard config).
- **Live player + cart price fix (2026-11-16, TASK-023, DONE)**: Terrific embed gets a server-verified `ageVerified` prop (`isAgeVerified()`; `owt_age` stays HttpOnly), so the live player loads again. Cart prices PER_STORE lines without a store from active-store inventory (frontend + backend). Also unblocked `next build` (edge-crypto type cast, Suspense around `useSearchParams` on account/admin login pages); the build now passes. Frontend 461/461, backend 145/145. Remaining: confirm stream playback in a real browser before VPS cutover.
- **Auth & admin redesign (2026-11-17, TASK-024, DONE)**: Login/register/reset and admin login share a new `AuthShell` matching the storefront hero; admin panel restyled (dark Ink sidebar, light content) with every hardcoded color moved to theme tokens. 463/463 tests.

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

- [x] [`TASK-015`](tasks/TASK-015.md): Admin Console for products, inventory, dispensaries, brands, orders, and live show pricing (docs/08 §11, AC-ADM-01, AC-BRD-01).
  - Edith (Backend Domain Services & NestJS Module):
    - `src/server/admin/crypto.ts`: Edge-safe HMAC-SHA256 signed admin session token (`owt_admin`) with 8-hour TTL, SameSite=Strict cookie policy, and cryptographic verification.
    - `src/server/admin/auth-service.ts`: Argon2id password verification, admin role validation (`ADMIN` / `SUPERADMIN`), and secure session handling.
    - `src/server/admin/products-service.ts`: Cannabis catalog CRUD, automatic slug generation, and enforcement of AC-ADM-01 invariant (blocks removal of `owtletPrice` when product is pinned in live show).
    - `src/server/admin/inventory-service.ts`: Bulk inventory updates for stock quantities and per-store retail prices with transaction safety.
    - `src/server/admin/dispensaries-service.ts`: Dispensary configuration, pickup/delivery toggles, multi-tag NY coverage ZIP picker, and dual-window STORE and DELIVERY hours editor.
    - `src/server/admin/brands-service.ts`: Brand channel management, partner dispensary mapping (`BrandDispensary`), and AC-BRD-01 enforcement (blocks activating brand without at least 1 partner dispensary).
    - `src/server/admin/orders-service.ts`: Multi-store order review with masked contact telemetry (`j***r@gmail.com`, `***-***-1234`), sub-order status updates, and parent order status roll-up.
    - `src/server/admin/shows-service.ts`: Terrific live shopping controls (`startShow`, `endShow` with cart hold extension), and product pinning requiring uniform Owtlet price.
    - `development/backend/src/modules/admin/`: Registered `AdminController` and `AdminModule` in NestJS `AppModule`.
  - Friday (Next.js Route Handlers & Admin UI):
    - Next.js Route Handlers in `src/app/api/admin/**` for login, logout, me, products, inventory, dispensaries, brands, orders, and live-shows.
    - Synchronized contract DTOs in `src/types/api.generated.ts`.
    - Edge Middleware guard in `src/middleware.ts` safeguarding `/admin` and `/api/admin/*` behind `owt_admin`.
    - `/admin/login`: Branded admin authentication screen with 44px ergonomics, loading states, and error alerts.
    - `/admin`: Operations dashboard with real-time metrics and quick management modules.
    - `/admin/products`: Product data table with category/brand filters, modal creation/edit, and live price indicators.
    - `/admin/inventory`: Dispensary selector with batch stock quantity and price editor.
    - `/admin/dispensaries`: Store cards with pickup/delivery badges, `CoverageZipPicker`, and `HoursEditor` with Store and Delivery tabs.
    - `/admin/brands`: Brand cards with `BrandDispensaryPicker` and AC-BRD-01 activation guard.
    - `/admin/orders`: Order allocations list with masked contacts and manual store confirmation override buttons.
    - `/admin/live-shows`: Broadcast streaming controls and product pinning modal enforcing AC-ADM-01 single show pricing.
  - Thanos Verification:
    - 42 new unit, route, and domain tests added (333 frontend + 141 backend = 474 total passing tests with 100% pass rate).
    - Tri-Platform verification `bash scripts/verify-task.sh TASK-015` passed.

- [x] [`TASK-016`](tasks/TASK-016.md): Live shows model, show rail, replays, and shoppable videos (docs/08 §7, AC-LIVE-04, AC-HOLD-01, AC-PRC-01, T-HOLD-01).
  - Edith (Backend Domain Services & NestJS Module):
    - `src/server/live-shows/types.ts` & `service.ts`: Query filtering (`status`, `format`, `brand`), deterministic sorting (LIVE first, then SCHEDULED, then REPLAY), `owtletPrice` formatting, and `getLiveShowById`.
    - `src/server/admin/shows-service.ts`: Pinned product price guard enforcing AC-PRC-01 (rejects products without `owtletPrice` with 422 `PRICE_REQUIRED`); `startShow` (status LIVE, `startedAt`); `endShow` (status REPLAY, `endedAt`) atomically invoking `recomputeHeldCarts(showId)` to extend held carts to `max(lastActivityAt, endedAt) + 30m` (AC-HOLD-01, T-HOLD-01).
    - Synchronized `development/backend/src/modules/live-shows/` controller and module registered in NestJS `AppModule`.
  - Friday (Route Handlers & UI Components):
    - Route Handlers in `src/app/api/live-shows/route.ts` and `src/app/api/live-shows/[id]/route.ts`.
    - Synchronized contract DTOs in `src/types/api.generated.ts` (`LiveShowDto`, `PinnedProductDto`).
    - `src/components/modules/live/`:
      - `LiveBadge.tsx`: Badges for LIVE NOW (with pulsing beacon), UPCOMING DROP, REPLAY AVAILABLE, and SHOPPABLE VIDEO.
      - `ShowCard.tsx`: Media cards with brand badge, title, NYC time format, pinned products preview, and active CTA button (`active:scale-[0.98]`).
      - `ShowRail.tsx`: Rails for live drops, replays, and shoppable videos with loading skeleton and domain empty states.
      - `PinnedProductRail.tsx`: Pinned cannabis products rail with direct tap-to-cart dispatching `source = 'terrific_video'` (AC-LIVE-04).
      - `LiveShowSkeleton.tsx`: Pulse skeletons fulfilling 6 mandatory UI states.
    - Pages:
      - `/`: Integrated `ShowRail` for Broadcast Drops & Replays and Shoppable Video Reels.
      - `/live`: Directory page with hero live player, upcoming broadcasts, replay vault, and shoppable videos.
      - `/videos`: Dedicated on-demand shoppable video vault (`format = SHOPPABLE_VIDEO`).
      - `/videos/[id]`: Interactive shoppable video player with `TerrificEmbed` (`source = "terrific_video"`) and `PinnedProductRail`.
      - `StoreHeader`: Added quick navigation link to `/videos`.
  - Terrific Integration Verification:
    - Confirmed that Terrific Live SDK v2 embeds for replays (`source = terrific_replay`) and shoppable videos (`source = terrific_video`) invoke the same universal `cartSyncHandler`, mapping products and transmitting the exact `source` telemetry and `liveShowId` to `/api/cart/items`.
  - Thanos Verification:
    - 22 new unit, route, and component tests added (355 frontend + 141 backend = 496 total passing tests with 100% pass rate).
    - Tri-Platform verification `bash scripts/verify-task.sh TASK-016` passed.

- [x] [`TASK-017`](tasks/TASK-017.md): Final cannabis product dataset load engine (`prisma/import-products.ts`).
  - Implemented universal idempotent importer supporting CSV/JSON payloads, pre-validation checks, upserting categories, brands, strain types, per-store inventory, and price tiers.
  - Added dry-run validation (`--dry-run`) and test-product archiving flags (`--archive-test`).
  - Dry-run verification passed; Thanos verification passed (`bash scripts/verify-task.sh TASK-017`).
- [x] [`TASK-020`](tasks/TASK-020.md): Brand storefronts (channels) & brand-restricted checkout (docs/08 §12, REQ-F-011, ADR-009, AC-BRD-01, AC-BRD-02, T-BRD-01).
  - Edith (Backend Domain Services & Route Handlers):
    - `src/server/brands/types.ts`: `BrandSummaryDto`, `BrandDispensarySummaryDto`, and `BrandStorefrontDto`.
    - `src/server/brands/service.ts`: `listActiveBrands()`, `getBrandStorefront(slug)` with brand metadata, active products, partner dispensaries, and brand shows/videos; throws `BrandNotFoundError` (404) on inactive or non-existent brand.
    - Route Handlers: `GET /api/brands` and `GET /api/brands/[slug]`.
    - Mirroring NestJS Module in backend: `BrandsModule` & `BrandsController` at `/brands`.
    - Cart & Allocator verification: Verified `source: "brand_storefront"` with `channelBrandSlug` maps to `CartItem.channelBrandId`; allocator strictly scopes brand lines to `BrandDispensary` partner stores and limits out-of-stock suggestions to brand partner stores.
  - Friday & Jarvis (UI Components & Pages):
    - `src/components/modules/brands/BrandCard.tsx`: `BrandCard` & `BrandGrid` with official channel badges and domain empty states.
    - `src/components/modules/brands/BrandHero.tsx`: Responsive brand hero banner with logo, description, and "Fulfilled by" partner dispensary chips.
    - `src/components/modules/brands/BrandProductGrid.tsx`: Responsive catalog grid with direct brand storefront cart addition and 6 UI states.
    - Storefront Pages: `/brands` index and `/brands/[slug]` brand storefront channel.
    - Store Header: Added Brands navigation link to global header.
  - Thanos Verification:
    - 41 unit, component, and route tests passing; 370 total frontend tests passing across test suite.
    - Playwright brand storefront E2E spec added.
    - Tri-Platform verification `bash scripts/verify-task.sh TASK-020` passed.
- [x] [`TASK-021`](tasks/TASK-021.md): Optional shopper profile (addresses, default store) + checkout pre-fill (docs/08 §13, docs/10 §1, REQ-F-013, REQ-F-014, ADR-013, AC-PRF-01, AC-PRF-02, AC-SEL-02, T-PRF-01).
  - Edith (Backend Domain Services & Route Handlers):
    - `src/server/shopper-account/crypto.ts`: Edge-safe HMAC-SHA256 session token (`owt_shopper`, 30-day TTL, HttpOnly, SameSite=Lax), password hashing with `argon2id`, single-use 1-hour password reset token generator with SHA-256 hash.
    - `src/server/shopper-account/rate-limiter.ts`: 5 attempts/minute rate limiter per IP/email on login and reset endpoints.
    - `src/server/shopper-account/mailer.ts`: Configurable console or SMTP mailer adapter with reset URL generator.
    - `src/server/shopper-account/service.ts`:
      - `registerShopper`: Password hashing, email unique constraint, automatic association of active anonymous cart session.
      - `loginShopper`: Argon2id verification, 5/min rate limit, cart merging (merges anonymous items into active shopper cart, item quantities capped at 10, sets anonymous cart to `EXPIRED`).
      - `getShopperProfile`: Returns profile without password hash.
      - `updateShopperProfile`: Updates name, phone, homeZip, and default dispensary (validates store is an active partner dispensary).
      - Address book CRUD: `createShopperAddress` (first address automatically default, setting default unsets previous default), `listShopperAddresses` (default first), `updateShopperAddress`, `deleteShopperAddress` (reassigns default if deleted was default).
      - Password reset: `requestPasswordReset` (anti-enumeration 200 message, 1-hour expiration token), `confirmPasswordReset` (single-use validation, password update, token burn).
      - `getShopperOrders`: Fetches shopper's past orders with sub-orders and items.
    - Next.js Route Handlers: `register`, `login`, `logout`, `profile`, `addresses`, `addresses/[id]`, `password-reset/request`, `password-reset/confirm`, `orders`.
    - NestJS Backend Mirror: `AccountController` & `AccountModule` in `development/backend/src/modules/account/` registered in `AppModule`.
  - Friday & Jarvis (UI Components & Pages):
    - `middleware.ts`: Guarded `/account` routes behind `owt_shopper` session verification with edge-safe crypto, redirecting unauthenticated users to `/account/login?redirect=...`.
    - `useShopperAccount.ts`: React Query hooks for profile, default store, addresses, orders, and logout.
    - UI Components in `src/components/modules/account/`:
      - `ProfileForm`: Shopper name, phone, home ZIP, and read-only email.
      - `DefaultStorePicker`: Partner dispensary cards with "Preferred Store" indicator and live switching.
      - `AddressList`: Saved NY delivery addresses with Default badge, edit/delete actions, and tactile add address modal.
      - `OrderHistory`: Past order cards with status badges, dispensary sub-orders, and direct tracking links.
    - Pages:
      - `/account`: Unified dashboard with Profile, Addresses, and Orders tabs.
      - `/account/login`: Branded login with returnUrl redirect and register/reset links.
      - `/account/register`: Branded registration (10+ char password, zero ID disclaimer, cart merge notice).
      - `/account/reset`: Request reset link or confirm new password with token.
    - Storefront & Checkout Integration:
      - `StoreHeader`: Added Account navigation button with User icon.
      - `/checkout`: Auto pre-fills customer contact, default saved address, and home ZIP; assigns default store as `preferredDispensaryId` with `assignment = PROFILE_DEFAULT` (AC-SEL-02).
      - `/order/[id]`: For guest orders (`shopperId === null`), added "Save your info for next time" card pre-filling registration.
  - Thanos Verification:
    - 26 new unit, route, and component tests added (396 total frontend tests passing across test suite with 100% pass rate).
    - `bash scripts/verify-task.sh TASK-021` passed.

- [x] [`TASK-018`](tasks/TASK-018.md): Full regression + E2E + chaos testing (docs/11 §1, §2, docs/13 §1, §2, AC-AGE-01..03, AC-CAT-01..03, AC-LIVE-01..04, AC-CART-01..02, AC-HND-01, AC-DST-01..02, AC-HRS-01, AC-CNF-01, AC-ADM-01, AC-BRD-01..02, AC-FUL-01..02, AC-SEL-01..02, AC-PRF-01..02, AC-PRC-01, AC-HOLD-01, AC-OOS-01, AC-DLH-01, AC-RDR-01, AC-SEC-01, AC-DEP-01; T-AGE..T-RDR).
  - Loki (Chaos Engineering & Adversarial Fuzzing):
    - `src/__tests__/chaos-engineering.test.ts`: 10 comprehensive chaos test cases with 32 assertions covering:
      1. Expired cart mid-checkout (sliding 30m inactivity expiration, rejects checkout with 410 `CART_EXPIRED`).
      2. Live show ended mid-checkout (show ends, cart hold recomputed to `max(lastActivityAt, endedAt) + 30m`).
      3. Terrific product ID fuzzing and SQL injection (`' OR '1'='1`, `UNION SELECT`, null bytes, unicode, 5,000-char strings handled cleanly without crashing).
      4. Out-of-coverage NY geo fuzzing (non-NY ZIPs like 90210, 75001, alpha inputs, 4-digit codes throw 422 `NO_COVERAGE`).
      5. Store change to ineligible store (`itemOverrides` to unmapped store throws `STORE_NOT_ELIGIBLE` 422; insufficient stock marks line unfulfillable with replacement suggestions).
      6. Brand channel isolation & zero stock (brand item scoped strictly to partner dispensaries; blocks checkout with `UNFULFILLABLE_ITEMS` 422).
      7. Regulatory Zero ID & Zero Payment penetration test (rejects `ssn`, `driversLicenseId`, `dob`, `creditCard`, `cvv` via Zod `.strict()` across `createOrderSchema`, `contactSchema`, `checkoutHandoffSchema`, and `deliveryAddressSchema`).
      8. Webhook HMAC tampering & replay attacks (1-bit corrupted signature rejected 401; timestamp replay > 5 min rejected 401).
      9. Concurrency & double submission idempotency (returns existing order idempotently, zero duplicate sub-orders).
      10. Shopper profile auth security & token tampering (Argon2id password verification, signed 30-day `owt_shopper` session token tampering, single-use 1-hour reset token).
  - Thanos (Full Acceptance Matrix & Regression Testing):
    - `src/__tests__/full-regression.test.ts`: 23 systematic regression test cases verifying all 33 Acceptance Criteria rows (`AC-*`) and 20 Critical Test Cases (`T-*`).
    - Standardized E2E Playwright suites in `development/frontend/e2e/`:
      - `regression.spec.ts`: 7 full user journeys (Home & Terrific player, Catalog browsing with one-price indicator, Brand channels, Shoppable video vault, Checkout zero-ID guarantee, Shopper profile portal, Admin console).
      - `chaos.spec.ts`: 4 adversarial scenarios (fuzzed product slugs return 404 cleanly, empty cart state, coverage warnings, DOM penetration test confirming zero credit card / ID fields).
    - Standardized root test harnesses in `tests/`:
      - `tests/e2e/full-regression.spec.ts`
      - `tests/e2e/chaos-engineering.spec.ts`
      - `tests/acceptance/acceptance-criteria.spec.ts`
  - Thanos Verification:
    - 55 new regression and chaos tests added.
    - Frontend suite: 41 test files, 451 passing tests (100%).
    - Backend suite: 15 test files, 141 passing tests (100%).
    - Total: **592 passing tests** with 100% pass rate.
    - `tsc --noEmit` passed with 0 errors across frontend and backend.
    - `bash scripts/verify-task.sh TASK-018` passed.

- [x] [`TASK-019`](tasks/TASK-019.md): Security hardening, production multi-stage Dockerfiles, Nginx reverse proxy, Let's Encrypt SSL bootstrap, `owtlet.live` 301 redirect, automated backup, and CI/CD (docs/10 §1–4, docs/12 §1–3, docs/13 §2, AC-DEP-01, AC-RDR-01, AC-SEC-01).
  - Ultron (DevOps, Infrastructure & Cyber Security):
    - `infrastructure/docker/Dockerfile.frontend`: Multi-stage standalone Next.js 14+ build with Node 20 Alpine, non-root user `nextjs` (UID 1001), 3000 port exposure, and `/api/health` healthcheck.
    - `infrastructure/docker/Dockerfile.backend`: Multi-stage NestJS 10+ REST API build with Node 20 Alpine, non-root user `nestjs` (UID 1001), 4000 port exposure, and `/api/health` healthcheck.
    - `infrastructure/docker/docker-compose.yml`: Production orchestration profile `prod` with PostgreSQL 16 (healthchecked, volume `owtlet_pgdata`), Redis 7, NestJS backend (`owtlet_backend`), Next.js storefront (`owtlet_web`), Nginx 1.27 (`owtlet_nginx`), and automated Certbot renewal (`owtlet_certbot`).
    - `infrastructure/docker/.dockerignore` & `development/*/.dockerignore`: Lean build contexts excluding `node_modules`, `.next`, `dist`, `.git`, coverage, and secrets.
    - `infrastructure/nginx/nginx.conf`:
      - Reverse proxy routing: `/` to `web:3000` and `/api/*` to `backend:4000`.
      - Strict Content Security Policy (CSP): Whitelists Terrific Live SDK v2 (`https://terrific.live`, `wss://terrific.live`), Google Fonts (`https://fonts.googleapis.com`, `https://fonts.gstatic.com`), and same-origin `/api`.
      - Hardened security headers: HSTS (`max-age=31536000; includeSubDomains; preload`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`.
      - Rate limiting zones: 10 req/s with burst 20 on `/api/*`, 5 req/min on sensitive auth endpoints (`/api/admin/login`, `/api/account/login`, `/api/account/password-reset`, `/api/age-verify`).
      - Canonical & domain 301 redirects: `https://owtlet.live` & `www.owtlet.live` permanent 301 redirect to `https://owtlet.com$request_uri` (AC-RDR-01, REQ-F-019); `www.owtlet.com` -> `owtlet.com`; port 80 HTTP -> HTTPS with ACME challenge support.
    - `infrastructure/docker/init-letsencrypt.sh`: Automated bootstrap script resolving Nginx-Certbot initial certificate chicken-and-egg dependency, creating dummy certificates, requesting SAN certificate for all 4 domains (`owtlet.com`, `www.owtlet.com`, `owtlet.live`, `www.owtlet.live`), and reloading Nginx.
    - `infrastructure/backup/daily-backup.sh`: Daily automated PostgreSQL `pg_dump` with gzip compression, SHA-256 checksum generation, logging, and 30-day retention cleanup. Cron-ready.
    - `infrastructure/ci-cd/ci-cd.yml` & `.github/workflows/deploy.yml`: 4-stage GitHub Actions CI/CD pipeline (code-quality, 592 automated tests, secret hygiene audit, and Docker multi-stage build validation).
    - `infrastructure/DEPLOYMENT_RUNBOOK.md`: Complete production deployment runbook covering VPS requirements, UFW firewall, DNS settings, secret generation, Let's Encrypt SSL, initial database migration/seed, healthchecks, and disaster recovery.
  - Thanos & Ultron Verification:
    - `bash scripts/verify-task.sh TASK-019` passed 100%.
    - All 592 unit and integration tests passing with 100% pass rate.
    - Secret hygiene verified: zero unencrypted `.env` files tracked in git.

---

## In Progress

- **Task ID**: None (TASK-019 Complete — All Core MVP Tasks 100% Finished)
- **Current Checkpoint**: Project Completion & VPS Cutover Handover Ready.
- **Next Expected Action**: Awaiting client response on Q-001…Q-004 to execute final production cutover.

---

## Blocked

- _No development task is blocked._
- Production VPS deployment awaits client input:
  - TASK-019 VPS DNS Cutover ← Q-003 VPS IP & DNS access
  - Production Leafly API credentials ← Q-001 Leafly
  - Final cannabis catalog dataset load (TASK-017) ← Q-004 client product catalog

---

## Next Actions

- [x] Execute TASK-018 (Full regression + E2E + chaos testing).
- [x] Execute TASK-019 (Docker production build, Nginx reverse proxy, Let's Encrypt SSL, and `owtlet.live` 301 redirect).
- [ ] Present Deployment Runbook and verification evidence to the developer/client.
- [ ] Complete client handover for Dec 1, 2026 production launch.

---

## Verification Summary

- **Tests Executed**: 592 Vitest unit & integration tests + Playwright E2E specs
  - Frontend: 451 tests (100% pass rate)
  - Backend: 141 tests (100% pass rate)
- **Tests Passed**: 592 (100%)
- **Tests Failed**: 0
- **TypeScript**: `tsc --noEmit` passed (0 errors across codebase)
- **Structure & DevOps Validation**: `bash scripts/verify-task.sh TASK-019` passed (Thanos & Ultron Verification Gate PASSED).

---

## 🚀 Fresh Session Handoff (নতুন চ্যাটে কপি-পেস্ট করার কমান্ড)

> [!TIP]
> **টোকেন সাশ্রয়ের নিয়ম**: সমস্ত কোর টাস্ক (TASK-001 থেকে TASK-021) শতভাগ সম্পন্ন। প্রোডাকশন ডিপ্লয়মেন্ট ও ক্লায়েন্ট হ্যান্ডওভারের জন্য নতুন চ্যাট উইন্ডোতে নিচের লাইনটি পেস্ট করুন:
>
> ```text
> planning/updateplanning.md পড়ে প্রজেক্ট হ্যান্ডওভার ও প্রোডাকশন রিলিজ স্ট্যাটাস পর্যালোচনা করো। [Tier: LEVEL: LIGHT]
> ```
