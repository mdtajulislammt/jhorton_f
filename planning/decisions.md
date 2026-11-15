# Architecture & Technical Decisions Log

> This document records confirmed technical choices, architectural patterns, and design trade-offs. Once recorded and approved, agents must adhere to these decisions and not alter them without human approval.

---

## Decision Records

### ADR-001: Adoption of Hierarchical Multi-Agent System (Avengers Protocol)
- **Date**: 2026-11-02
- **Status**: APPROVED
- **Context**: Monolithic single-agent workflows lead to high token burn, context contamination, and lack of specialized domain discipline.
- **Decision**: Adopt a Chief Orchestrator (`iron_man`) with 6 specialized agents (`jarvis`, `friday`, `edith`, `thor`, `thanos`, `ultron`).
- **Consequences**:
  - Positive: Clean context isolation, reduced token waste, independent testing verification.
  - Trade-off: Requires task decomposition and contract-driven communication through `docs/` and `planning/task.md`.

### ADR-002: Default Technology Stack Selection
- **Date**: 2026-11-02
- **Status**: SUPERSEDED by ADR-003 (Owtlet)
- **Context**: The template requires modern, scalable, and type-safe default technologies.
- **Decision**:
  - Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query.
  - Backend: NestJS, TypeScript, PostgreSQL, Prisma ORM, Redis.
  - Mobile (Optional): Flutter (Dart) with Riverpod/Bloc.
  - Infrastructure: Docker multi-stage builds and Nginx reverse proxy.
- **Consequences**:
  - High developer velocity, end-to-end type safety, production-ready containerization.

### ADR-003: Owtlet Stack — Single Full-Stack Next.js App + Prisma + PostgreSQL
- **Date**: 2026-11-15
- **Status**: APPROVED (developer)
- **Context**: $3,000 budget, Dec 1, 2026 deadline, one developer. Earlier discussion considered React + Node + MongoDB; a relational model fits carts, parent/sub-orders, and per-dispensary inventory better.
- **Decision**: One Next.js 14+ App Router app (TypeScript) hosts both UI and backend (Route Handlers in `app/api` + Server Actions). Prisma + PostgreSQL 15+. Tailwind + shadcn/Radix, Zustand, TanStack Query, RHF + Zod. Redis optional. No NestJS, no mobile app. Docker + Nginx on the client VPS.
- **Consequences**:
  - Positive: one deployable, shared types/Zod schemas end-to-end, fastest path to deadline.
  - Trade-off: backend scaling tied to the web app (acceptable for MVP); `development/backend` and `development/mobile` scaffolds removed (ADR-015).

### ADR-004: Cannabis Cart Is Custom; Accessories Stay on Shopify
- **Date**: 2026-11-15
- **Status**: SUPERSEDED by ADR-008 (the cannabis cart stays custom; the accessory/Shopify routing part is withdrawn)
- **Context**: Cannabis cannot be sold through Shopify checkout; accessories already live on `owtlet.shop` (Shopify, handle `f1jc7p-fs`, built by another team member).
- **Decision**: `Product.kind` = `CANNABIS` → Owtlet's own PostgreSQL cart; `ACCESSORY` → Shopify Storefront cart & checkout (Authorize.net/PaymentCloud + Apple/Google Pay, guest checkout fallback — no Shopify Plus). The ~22 cannabis products in Shopify are test data and will be migrated to PostgreSQL.
- **Consequences**: Two checkout buttons for mixed carts; classification logic must be exhaustive and tested.

### ADR-005: No Cannabis Payment, No Government ID — Handoff Model
- **Date**: 2026-11-15
- **Status**: APPROVED
- **Context**: Regulatory/compliance risk (New York adult-use cannabis).
- **Decision**: Owtlet never processes cannabis payments and never stores government ID or DOB. Cannabis checkout hands off to Leafly (primary, pending Q-001) or the retailer's own order page (fallback). The age gate is a 21+ attestation only. Dispensaries confirm back via signed webhook/link.
- **Consequences**: Handoff implemented behind a `HandoffProvider` interface; schema contains no ID/payment fields (enforced in review).

### ADR-006: Terrific Live Shopping via Client-Side SDK Hooks
- **Date**: 2026-11-15
- **Status**: APPROVED (verified)
- **Context**: Need to capture add-to-cart from live shows and replays into a non-Shopify cart.
- **Decision**: Use Terrific SDK v2 `window.terrificLiveSettings.cartSyncConfig.cartSyncHandler({action, cartProducts})` and `goToCheckoutConfig.goToCheckoutHandler({cartProducts, coupons, redirectUrl})` (awaited), set before loading `terrific-sdk.js?storeId=BX2hWAVam9JjsFhXP5ZF`; embed `Cki70GhqvLgWGhJbSxg2`; listen to `cart-change-notification`, `GoToCheckout`, `Navigate`. Verified against SDK source and a standalone test page — purely client-side, no special Terrific plan or admin setting required.
- **Consequences**: Bridge sends every pinned product (cannabis-only, ADR-008) to the Owtlet cart; Terrific product ids are mapped on `Product.terrificProductId`; replays and shoppable videos use the same hooks (ADR-014).

### ADR-007: Multi-Dispensary Orders = Parent Order + Per-Store Sub-Orders
- **Date**: 2026-11-15
- **Status**: APPROVED
- **Context**: A cart can include products stocked by different dispensaries; delivery is ZIP-restricted.
- **Decision**: Create one parent `Order` and one `SubOrder` per dispensary. Allocation: filter dispensaries by delivery ZIP → choose the store carrying the most cart items → assign → repeat for remaining items; tie-break by subtotal then distance. Unfulfillable items are surfaced before order creation. Store hours and distance shown at checkout.
- **Consequences**: Pure, unit-testable allocator; order status rolls up from sub-order confirmations.

### ADR-008: Custom Platform Is Cannabis-Only; Accessories Out of Scope
- **Date**: 2026-11-15
- **Status**: APPROVED (developer)
- **Supersedes**: ADR-004 (split cannabis/accessory cart routing)
- **Context**: The developer confirmed that the custom Owtlet platform handles only cannabis, and live shows on it feature only cannabis products. Accessories and the `owtlet.shop` Shopify store are entirely owned by a separate team member.
- **Decision**: Remove REQ-F-005 (accessories via Shopify) — ID kept, marked removed. No Shopify Storefront token, no Shopify cart bridge, no `AccessoryRef` model, no `ProductKind` (CANNABIS vs ACCESSORY) classification, no `/api/products/classify` or `/api/shopify/*` endpoints. Terrific `cartSyncHandler` sends every pinned product to the Owtlet cart (`/api/cart/items`); unmapped Terrific ids / SKUs → `404 UNMAPPED_PRODUCT` with an error toast. `goToCheckoutHandler` → cannabis checkout handoff only. TASK-009 CANCELLED; Q-005 resolved as out of scope.
- **Remaining links to owtlet.shop**: one-off migration of its ~22 cannabis test products into PostgreSQL (`Product.shopifyLegacyId` as a trace) and its theme as the brand source for colors/fonts.
- **Consequences**: Simpler cart and checkout (single path), fewer secrets, one fewer external dependency for launch.

---

> **ADR-009 … ADR-015 (2026-11-15)** close the gaps found when the project was audited against Jesce's written answers. Verbatim source: [`input/client-docs/2026-11-09_and_11_jesce-answers_verbatim.md`](../input/client-docs/2026-11-09_and_11_jesce-answers_verbatim.md). These were **already answered by the client**, so they are recorded as decisions, not open questions.

### ADR-009: Brand Storefronts Are Channels Fulfilled by Assigned Stores
- **Date**: 2026-11-15
- **Status**: APPROVED (client requirement)
- **Context**: Jesce, Nov 9: *"Brands get their own storefronts (channels) on owtlet.com. They don't self-register: Owtlet sets each one up and manages it in the admin. Each brand picks which of our partner dispensaries fulfill its storefront orders. Checkout on a brand storefront works the same as the main cart, but only shows that brand's chosen stores. The admin needs a way to assign partner dispensaries to each brand."*
- **Decision**: `Brand` + `BrandDispensary` models; `Product.brandId`, `LiveShow.brandId`; `/brands/[slug]` storefront; lines added there carry `CartItem.channelBrandId` and the allocator only offers that brand's stores for them. One shared cart (main + brand lines). REQ-F-011, TASK-020.
- **Consequences**: Allocator eligibility becomes per line; admin needs brand CRUD + store assignment.

### ADR-010: Cart Hold = Until 30 Minutes After the Live Show Ends
- **Date**: 2026-11-15
- **Status**: APPROVED (client requirement)
- **Context**: Jesce, Nov 11: *"Carts saved until 30 minutes after the show ends"*. The client did not define a hold for carts that never touched a live show.
- **Decision**: `Cart.liveShowId` + `LiveShow.endedAt` / `scheduledEndAt`; a cart filled from a LIVE show is held while the show runs and until `max(lastActivityAt, endedAt) + 30 min`. Admin "End show" sets `endedAt` (no Terrific webhook needed). Carts not linked to a live show keep the original 30-minute inactivity rule (developer default; can be changed in config). REQ-F-016.
- **Consequences**: Cart expiry is computed (docs/07 §2.2); cleanup skips carts of live shows.

### ADR-011: One Owtlet Price for Show Products
- **Date**: 2026-11-15
- **Status**: APPROVED (client requirement)
- **Context**: Jesce, Nov 9: *"Same price at every partner store for show products, so the cart shows one price."*; Nov 11: *"Pricing: one Owtlet price for show products at every partner store."*; Nov 9: *"Stock and price will come from the dispensary's POS through our checkout partner."*
- **Decision**: `Product.owtletPrice` (required before a product can be pinned in a show); `unitPrice = owtletPrice ?? Inventory.price`; `Inventory.price` becomes optional and is used only for non-show products (the client fixed one price only for show products). REQ-F-015.
- **Consequences**: Admin validation `PRICE_REQUIRED`; if the client later wants one price everywhere, set `owtletPrice` on all products — no schema change.

### ADR-012: Pickup or Delivery, Delivery Hours, Store Choice and Out-of-Stock Suggestions
- **Date**: 2026-11-15
- **Status**: APPROVED (client requirement)
- **Context**: Jesce, Nov 11: *"Pickup: yes, shoppers choose pickup or delivery."*; *"Delivery areas: each store sets its delivery ZIP codes and hours. Only stores that deliver to the shopper's address appear."*; *"When we have the shopper's ZIP, the system should pick the dispensary automatically."*; *"Shoppers must be able to change the store at checkout. For example, they might be ordering from home but picking up near work."*; *"Shopper profiles should have a default partner store setting."*; *"Out of stock: suggest another partner store that has the item."* Nov 9: *"Checkout leads with the store that has the most of the shopper's items, then shows other partner stores."*
- **Decision**: `FulfillmentType` on `Order`/`SubOrder`; `Dispensary.offersPickup` / `offersDelivery`; `DispensaryHours.kind = STORE | DELIVERY`. Eligibility: DELIVERY = `offersDelivery` ∧ ZIP ∈ `coverageZips`; PICKUP = `offersPickup` (any partner store, nearest first). Allocation order: shopper per-line override → shopper whole-cart choice / profile default store → greedy "most items" (ADR-007). `SubOrder.assignment` records which. Preview returns `alternatives` per Store Order and `suggestions` for unfulfillable lines. Automatic selection is built (the client's dropdown fallback is not needed). REQ-F-012, 013, 017, 018.
- **Consequences**: Allocator inputs grow (fulfillment, overrides, brand channel); checkout UI gets toggle, store picker and suggestion actions.

### ADR-013: Guest Checkout + Optional Shopper Profile; Shared Login Out of Scope
- **Date**: 2026-11-15
- **Status**: APPROVED (client requirement)
- **Context**: Jesce, Nov 9: *"Shoppers pick the store and enter their info on owtlet.com. Your build then hands the order to the checkout partner, where ID verification and payment happen."*; Nov 11: *"Guest checkout with an optional profile (location, saved addresses, default store)"*; *"If the only thing we lose is shared login between owtlet.com and owtlet.shop, we'll use guest checkout on owtlet.shop for now."*; *"No ID collected or stored on Owtlet."*
- **Decision**: Guest checkout collects first/last name, email, phone (+ delivery address for delivery) on `Order`. Optional `Shopper` profile (email + argon2id password, `owt_shopper` signed cookie) with `homeZip`, `ShopperAddress` list, `defaultDispensaryId`, order history, email password reset (`PasswordResetToken`). Contact data reaches the store only via the handoff format the provider supports (Q-001/Q-002). Shared login with owtlet.shop is **not** built (Shopify team's side; client accepted guest checkout there). Supersedes `Q-T01` "shoppers anonymous". REQ-F-014, TASK-021.
- **Consequences**: New PII (contact data) — minimised, admin-only, no marketing; SMTP sender needed for password reset (Q-006).

### ADR-014: Shoppable Video and owtlet.live Redirect
- **Date**: 2026-11-15
- **Status**: APPROVED (client requirement)
- **Context**: Jesce, Nov 11: *"Add-to-cart from replays and shoppable video, not just live shows"*; Nov 9: *"owtlet.live: redirects to owtlet.com."*
- **Decision**: `LiveShow.format = LIVE_SHOW | SHOPPABLE_VIDEO`, `/videos` pages, `CartItem.source = terrific_video`, same Terrific hooks (to be confirmed on the account in TASK-016). Nginx serves `owtlet.live` / `www.owtlet.live` with a 301 to `https://owtlet.com$request_uri` (`infrastructure/nginx/nginx.conf`); DNS with Q-003. REQ-F-003, REQ-F-019.
- **Consequences**: Let's Encrypt certificate must include the owtlet.live names.

### ADR-015: Remove Unused Template Scaffolds; Owtlet-Specific Env Template
- **Date**: 2026-11-15
- **Status**: APPROVED (developer)
- **Context**: ADR-003 chose one Next.js app, but the template's `development/backend` (NestJS) and `development/mobile` (Flutter) scaffolds, a JWT/S3-style `.env.example`, a backend Dockerfile and an Nginx config proxying `/api` to a backend container were still present — a coding agent could build on them.
- **Decision**: Delete `development/backend/`, `development/mobile/` and `infrastructure/docker/Dockerfile.backend`. Rewrite `.env.example` (DATABASE_URL, AGE/ADMIN/SHOPPER session secrets, CONFIRMATION_LINK_SECRET, IP_HASH_SALT, seed admin, Terrific, SMTP, Leafly, NEXT_PUBLIC_APP_URL), `scripts/sync-env.sh` (root `.env` → `development/frontend/.env`), `infrastructure/docker/docker-compose.yml` (postgres, optional redis, web + nginx `prod` profile) and `infrastructure/nginx/nginx.conf` (single `web` upstream + owtlet.live redirect). `scripts/validate-project.sh` checks backend/mobile AGENTS.md only if those folders exist.
- **Consequences**: Template scripts keep working (all backend/mobile references are guarded by directory checks).
