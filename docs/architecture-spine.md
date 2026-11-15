# Architecture Spine (Single Unified Contract)

> **Purpose**: Serves as the lean, high-density invariant contract for all agents. 
> To maximize token efficiency, specialists **MUST NOT** load all 14 files in `docs/` for standard tasks (`LEVEL: STANDARD` / `LEVEL: LIGHT`). Load **only this spine** and your assigned `planning/tasks/TASK-XXX.md`.

---

## 1. System Topology & Stack

- **Project**: Owtlet™ — 21+ Cannabis Marketplace + Live Shopping (`owtlet.com`).
- **Target Coverage**: Manhattan, Queens, Brooklyn, Westchester County, Long Island (NY).
- **Core Architecture**: Single full-stack Next.js 14+ app (App Router, TypeScript strict, RSC) in `development/frontend/` hosting both storefront UI and backend Route Handlers (`src/app/api/*`) + Server Actions (`src/actions/*`) + Domain Services (`src/server/*`). Prisma ORM, PostgreSQL 15+, optional Redis.
- **External Video Integration**:
  - **Terrific Live SDK v2**: `https://terrific.live/terrific-sdk.js?storeId=BX2hWAVam9JjsFhXP5ZF`.
  - **Player Embed**: `<div data-source="terrific" embedding-id="Cki70GhqvLgWGhJbSxg2">`.
  - **Client Bridge**: `window.terrificLiveSettings` configured **before** SDK loads with `cartSyncConfig.cartSyncHandler({action, cartProducts})` and `goToCheckoutConfig.goToCheckoutHandler({cartProducts, coupons, redirectUrl})`.
- **Scope & Compliance Invariant**:
  - **Cannabis Only**: Platform handles cannabis exclusively. Accessories are sold on the separate `owtlet.shop` Shopify store (out of scope, ADR-008). Zero Shopify checkout runtime integration.
  - **Zero ID & Zero Payment**: Owtlet never processes cannabis payments and never collects/stores government ID or DOB. All checkout hands off to licensed partner dispensaries.
  - **Compliant Checkout Handoff**: `HandoffProvider` interface supporting Leafly (primary, pending Q-001) and dispensary direct menu/order page (fallback via `handoffUrlTemplate`).
- **Domain Routing**: `owtlet.com` primary storefront; `owtlet.live` permanently redirects (301) to `https://owtlet.com`.

---

## 2. API Design & Data Invariants

### 2.1 Standard API Envelopes
- **Success (`200 OK`, `201 Created`)**:
  ```json
  {
    "success": true,
    "data": {},
    "message": "Operation completed",
    "timestamp": "ISO-8601"
  }
  ```
- **Error (`400`, `401`, `403`, `404`, `409`, `422`, `451`, `500`)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable message",
      "details": []
    },
    "timestamp": "ISO-8601"
  }
  ```

### 2.2 Security & Authentication Invariants
- **`owt_age` (21+ Attestation Cookie)**: Signed HMAC-SHA256 (`AGE_COOKIE_SECRET`, 30-day TTL). Enforced by `middleware.ts` across all storefront routes. Unverified requests return 307 redirect or HTTP 451 `AGE_GATE_REQUIRED`. Zero DOB/ID columns.
- **`owt_cart` (Cart Session Cookie)**: Cryptographic 256-bit session token. Carts filled from a LIVE show are held until `max(lastActivityAt, endedAt) + 30m` (REQ-F-016); standard carts expire after 30 minutes sliding inactivity.
- **`owt_shopper` (Optional Shopper Profile Session)**: Argon2id password hash, signed 30-day session cookie. Stores location, saved addresses, and default store preference. Guest checkout is always available without an account.
- **`owt_admin` (Admin Session)**: Argon2id credentials, HTTP-only, SameSite=Strict, 8-hour TTL.
- **Webhook Security**: `POST /api/webhooks/store-confirmation` verified via HMAC-SHA256 header `X-Owtlet-Signature` and timestamp replay protection (±5 min).

### 2.3 Product, Cart & Allocation Invariants
- **Pricing Rule**: `unitPrice = Product.owtletPrice ?? Inventory.price`. Products pinned in live shows MUST have `owtletPrice` set, establishing one unified price across all dispensaries.
- **Cart Sync**: Terrific `cartSyncHandler` dispatches directly to `/api/cart/items`. Unknown or unmapped product IDs return 404 `UNMAPPED_PRODUCT` with non-blocking toast.
- **Multi-Dispensary Allocator**:
  - Cart splits into 1 Parent `Order` + N Dispensary `SubOrders`.
  - **Fulfillment Types**: `DELIVERY` (requires `offersDelivery` AND customer ZIP ∈ `coverageZips`) or `PICKUP` (requires `offersPickup`, ordered by nearest distance).
  - **Brand Channel Isolation**: Items added from `/brands/[slug]` carry `channelBrandId` and are strictly restricted to that brand's assigned partner dispensaries.
  - **Greedy Assignment**: Store supplying the highest quantity of cart items is assigned first; tie-broken by lowest subtotal, nearest distance, and shopper preference.
  - **Out-of-Stock Telemetry**: Pre-handoff check flags unavailable items with nearest alternative store suggestions.

---

## 3. Frontend Architecture Invariants (Friday & Jarvis)

- **State Management**:
  - Global UI & Cart: Zustand (`useCartStore`, `useCheckoutStore`).
  - Server Async Cache: `@tanstack/react-query` with declarative query keys.
- **Component Primitives**: Reuse Radix UI primitives from `src/components/ui/` styled with Tailwind CSS.
- **6 Mandatory UI States**: Every screen and interactive module must handle:
  1. Default/Success State
  2. Loading Skeleton (`<Skeleton />` — zero blank screens)
  3. Empty State (Domain-specific copy with clear actionable CTA)
  4. Validation/Error State (Inline field errors + toast alert)
  5. Responsive Breakpoints (Mobile 375px, Tablet 768px, Desktop 1280px)
  6. Interactive/Focus State (`hover:`, `active:scale-[0.98]`, `focus-visible:ring-2`, 44x44px touch targets)
- **Zero Dummy Text Mandate**: Absolutely no "Lorem Ipsum" or generic placeholders. Consume real cannabis terminology from `docs/domain-lexicon.md`.
- **No-Dead-Button Rule**: Every button, link, and interactive widget must trigger an active router navigation, modal trigger, or toast notification.

---

## 4. Backend Architecture Invariants (Edith)

- **Layered Monolith Pattern**:
  - Transport: Next.js Route Handlers (`src/app/api/*`) and Server Actions (`src/actions/*`).
  - Domain Services: Pure TypeScript business logic in `src/server/<domain>/` (e.g., `products`, `pricing`, `cart`, `distribution`, `dispensaries`, `checkout-handoff`, `admin`).
  - Persistence: Prisma ORM singleton (`src/server/db.ts`) with PostgreSQL 15+.
- **Strict Validation**: All route payloads and actions validated with Zod schemas (`.strict()`).
- **Transactional Integrity**: Multi-record mutations (cart checkout, order creation) wrapped in `prisma.$transaction`.
- **Store Hours & Timezone**: All store operating hours and delivery windows evaluated in `America/New_York` with full DST and past-midnight closing support.

---

## 5. Quality, Review & Verification Guardrails (Thanos, Loki, Ultron)

- **Pre-Implementation Readiness Gate**: Run `bash scripts/check-readiness.sh [TASK-ID]` before starting any implementation task. Must report `PASS`.
- **Clean Execution Rule**: Always run test suites and verification via `bash scripts/clean-run.sh` to prevent verbose log pollution.
- **4-Perspective Code Review**: Before task completion, code must pass multi-perspective review (`.agents/skills/multi-perspective-code-review/SKILL.md`):
  1. *Blind Hunter*: Adversarial edge-case audit.
  2. *Contract Auditor*: API & schema compliance check.
  3. *Architecture Guard*: Layer isolation & zero-ID verification.
  4. *UX Auditor*: 6 UI states & tactile responsiveness check.
- **Fresh Session Handoff**: Once a task is verified `DONE`, provide the fresh session handoff command:
  `"planning/updateplanning.md পড়ে [Next TASK-ID] শুরু করো। [Tier: LEVEL_NAME]"`
