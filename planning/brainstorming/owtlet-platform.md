# 💡 Brainstorming & Ideation: Owtlet™ Live Shopping for Cannabis
- **Date**: 2026-11-15
- **Owner**: `nick_fury` (Client Advocate & PM / Scope Guard)
- **Status**: APPROVED
- **Methodology**: SCAMPER Framework, Reverse Brainstorming (Failure Inversion), Anti-Bias Audit, Value-vs-Complexity Matrix

---

## 1. Problem Statement & Core Value

- **Problem Statement**: Adult (21+) cannabis consumers in the New York metro area seek the excitement of interactive live-stream shopping and brand discovery, yet strict state regulations (NY OCM), non-bankable cannabis payments, and fragmented hyper-local dispensary licensing make direct e-commerce fulfillment legally treacherous and friction-heavy.
- **Core Value**: Owtlet™ unlocks an effortless video-to-cart experience by embedding the Terrific live-shopping SDK v2 with unified show pricing, dynamic multi-dispensary smart order routing to licensed NY partners, and a zero-liability, zero-ID handoff to Leafly/retailer checkout.

---

## 2. SCAMPER Exploration (Feature Ideation & Differentiation)

```
        ┌────────────────────────────────────────────────────────┐
        │                 S.C.A.M.P.E.R. MATRIX                  │
        └────────────────────────────────────────────────────────┘
  [S] Substitute   ──► Zero ID storage, signed 21+ cryptographic cookie
  [C] Combine      ──► Video stream + Pinned live cart + 30-min show hold
  [A] Adapt        ──► TikTok/Insta live-shopping UI + Instacart multi-store routing
  [M] Modify       ──► Magnify peak live drop bursts; Minify guest checkout
  [P] Put to Use   ──► Out-of-stock telemetry for partner dispensary restock alerts
  [E] Eliminate    ──► No payment gateways, no ID scan DB, no Shopify bridge
  [R] Reverse      ──► Reverse store selection: select video/strains first, route store at cart
```

### 2.1 S — Substitute
1. **Substitute Form Registration with Signed Attestation**: Replace intrusive upfront signup and KYC with a lightweight, cryptographically signed HTTP-only 21+ cookie (`owt_age_verified`). Zero government IDs stored, zero birth dates collected.
2. **Substitute Manual Dispensary Selection**: Replace customer guesswork with an algorithmic greedy allocator that automatically matches cart items against licensed partner dispensaries based on stock density, delivery ZIP eligibility, and open operating hours.
3. **Substitute External Chat Buy Links**: Replace clunky external affiliate links with native client-side Terrific SDK v2 bridge hooks (`cartSyncHandler` and `goToCheckoutHandler`) directly pinning products into Owtlet’s local PostgreSQL cart.
4. **Substitute Dual-Cart Accessory Bridge**: Substitute complex Shopify Storefront token bridges by isolating cannabis exclusively on Owtlet (accessories handled entirely by separate Shopify store `owtlet.shop`, eliminating cart fragmentation).

### 2.2 C — Combine
1. **Combine Live Stream Broadcast with Cart Hold Dynamics**: Automatically link cart lifetime to the active broadcast state. If products are pinned during a live show, cart items are locked and held until **30 minutes after the show officially ends** (`max(lastActivityAt, endedAt) + 30m`), preventing cart evaporation during long streams.
2. **Combine Multi-Dispensary Items into a Parent/Sub-Order Structure**: Combine items from disparate partner dispensaries into one intuitive cart review screen, decomposing behind the scenes into 1 Parent `Order` and N Dispensary `SubOrders`.
3. **Combine Brand Channels with Assigned Partner Fulfillment**: Combine brand curation (`/brands/[slug]`) with exclusive dispensary assignment, ensuring brand-specific drops are routed solely to contracted retail partners.

### 2.3 A — Adapt
1. **Adapt TikTok Shop & Instagram Live UI**: Implement floating interactive product pills over live video/replays with live animated stock tags ("Pinned", "Only 3 left in Brooklyn"), allowing instant one-tap add-to-cart without stalling stream playback.
2. **Adapt DoorDash / Instacart Multi-Store Transparency**: Clearly display split order bundles at checkout (e.g., "Package 1: Dispensary A — Delivery to 10001", "Package 2: Dispensary B — In-Store Pickup"), highlighting operating hours and delivery cutoffs.
3. **Adapt Frictionless Handoff Patterns**: Pre-compile cart payloads and contact data into secure deep-link query parameters or transfer envelopes so the shopper transitions seamlessly to Leafly or retailer web POS without duplicate typing.

### 2.4 M — Modify / Magnify / Minify
1. **Magnify (Traffic Spikes & Inventory Contention)**: During high-profile live drops with 5,000+ simultaneous viewers, inventory depletion occurs in seconds. Implement optimistic client UI cart reservation with server-side atomic inventory decrements and clear out-of-stock alerts.
2. **Minify (Ultra-Lean Guest Checkout)**: Strip down checkout friction to the absolute minimum: Name, Email, Phone, and (if delivery) Address + ZIP. No mandatory password creation, no verification delays, instant transfer to dispensary fulfillment.

### 2.5 P — Put to Another Use
1. **Out-of-Stock Telemetry for Dispensary Stocking**: Transform unfulfillable cart attempts (e.g., shopper in Queens wants a strain only stocked in Manhattan) into demand-heatmaps for Owtlet dispensary partner account managers.
2. **Video Drop-off & Cart Conversion Analytics**: Repurpose Terrific SDK playback events to provide brand partners with granular funnel analytics: viewer retention vs. product pin clicks vs. dispensary handoffs.

### 2.6 E — Eliminate
1. **Eliminate In-App Cannabis Payment Processing**: Completely remove payment gateways (Stripe, Authorize.net) for cannabis. Eliminates merchant account bans, high-risk processing surcharges, chargeback liabilities, and federal banking complications.
2. **Eliminate Government ID Retention**: Strictly eliminate document scanning, storage of driver's licenses, and PII storage. Verification shifts 100% to licensed dispensaries upon physical delivery or pickup per NY state regulations.
3. **Eliminate Price Discrepancies During Live Shows**: Eliminate per-store price confusion by establishing a single mandatory `owtletPrice` for all products featured in live shows.
4. **Eliminate Unnecessary Microservices & Multi-App Complexity**: Consolidate full-stack architecture into a unified Next.js App Router deployment (PostgreSQL + Prisma), eliminating inter-service latency and infrastructure overhead.

### 2.7 R — Reverse / Rearrange
1. **Reverse Dispensary Selection**: Instead of forcing the user to pick a local dispensary upfront before browsing, let them fall in love with the video content, brand story, and strains first; dynamically route to the nearest eligible dispensary at the cart/checkout step.
2. **Rearrange Fulfillment Re-assignment**: Give shoppers complete manual override power at checkout to switch an auto-assigned dispensary (e.g., from Home Delivery in Queens to Pickup near their Manhattan workplace).

---

## 3. Reverse Brainstorming (Failure Inversion & Threat Modeling)

```
        ┌────────────────────────────────────────────────────────┐
        │            REVERSE BRAINSTORMING INVERSION             │
        └────────────────────────────────────────────────────────┘
  Question: "How could a shopper or system completely break or abandon Owtlet?"
```

| # | Potential Failure Mode | Root Cause | Preventative NFR / Architectural Requirement |
|---|---|---|---|
| **F-01** | **Live Stream Desync & Freeze on Cart Click** | Synchronous API calls or heavy bundle execution stalling the Terrific SDK video player. | **NFR-PERF-01**: Terrific event bridge (`cartSyncHandler`) must dispatch non-blocking asynchronous actions into a client Zustand store with optimistic UI update and non-intrusive toast. Player must not drop frames. |
| **F-02** | **"Order Splitting Shock" at Checkout** | Shopper unaware that 3 products added from a stream are stocked by 3 different dispensaries across NY. | **NFR-UX-01**: Cart & Checkout must display clear "Fulfillment Grouping" badges indicating the fulfilling store, delivery eligibility, and separate delivery fees/minimums before the user taps "Proceed". |
| **F-03** | **Dispensary Closes Mid-Stream** | Shopper watches a 40-minute replay at 8:50 PM; dispensary closes at 9:00 PM; checkout fails at 9:10 PM. | **NFR-ROUTING-01**: Allocator must evaluate real-time store operating and delivery hours. If current time is within 15 minutes of closing, display an explicit urgency banner ("Store closing soon for delivery") or route to an open alternative store. |
| **F-04** | **Leafly / Retailer Handoff Link Dead / 404** | External retailer changes menu URL, POS SKU mismatch, or Leafly partnership pending. | **NFR-HANDOFF-01**: Implement polymorphic `HandoffProvider` interface (`LeaflyProvider` / `RetailerPageProvider`). If Leafly fails or is unconfigured, fallback automatically to verified retailer direct order page with full order summary pre-formatted. |
| **F-05** | **Ghost Inventory & Out-of-Stock at Handoff** | Inventory sold out in store POS between live show pin and final checkout handoff. | **NFR-STOCK-01 (REQ-F-017)**: Execute pre-handoff inventory check. If out of stock, surface an immediate alternative partner dispensary or suggest in-stock replacement strain with 1-click swap. |
| **F-06** | **Rapid Double-Tap Order Duplication** | Mobile user taps "Complete at Dispensary" repeatedly during spotty cellular connection. | **NFR-SEC-01**: Require client-side button disablement upon click and enforce an Idempotency Key on `POST /api/orders/checkout`. |
| **F-07** | **Underage Visitor Directly Accesses Video/Catalog** | User bypasses age gate modal via direct URL link (`/catalog/product-xyz` or `/live/show-abc`). | **NFR-SEC-02**: Next.js Edge Middleware (`middleware.ts`) must intercept ALL routes (except public static assets and age-gate landing) and verify cryptographic signature on `owt_age_verified`. SSR must emit zero catalog/video HTML without cookie. |
| **F-08** | **Out-of-State / Unsupported ZIP Delivery Attempt** | Shopper enters a New Jersey or non-covered Long Island ZIP. | **NFR-ROUTING-02**: Immediate client-side and server-side ZIP validation against the partner dispensary delivery coverage table. Informative error: *"Delivery unavailable in ZIP [XXXXX]. Please switch to In-Store Pickup or enter a covered NY Metro address."* |
| **F-09** | **Live Show Cart Expires While Viewer is Still Watching** | Static 30-minute inactivity timer clearing items while shopper is actively watching a 60-minute stream. | **NFR-CART-01 (REQ-F-016)**: Implement dynamic cart expiration logic: `Cart.expiresAt = LiveShow.isActive ? max(lastActivityAt, LiveShow.endedAt) + 30m : lastActivityAt + 30m`. Background reaper job must spare live show carts. |
| **F-10** | **Banking / Processing Regulatory Red-Flag** | Platform flagged as unlicensed cannabis seller by payment or hosting providers. | **NFR-COMPLIANCE-01**: Zero credit card processing code or tokens anywhere in codebase. Explicit legal footer on all pages and handoff screens: *"Owtlet is an advertising and technology platform. All cannabis products are sold, fulfilled, and verified exclusively by licensed New York adult-use dispensaries."* |

---

## 4. Anti-Bias & Assumption Auditing

### 4.1 The "Happy Path" Bias
- **The Bias**: Assuming shoppers have gigabit Wi-Fi, stream live shows on 4K desktop screens, and order from a single dispensary located down the street.
- **The Reality**: 85%+ of live shopping occurs on mobile smartphones (iOS Safari / Android Chrome) on spotty 4G/5G connections; dispensaries have restrictive delivery zones and distinct cut-off hours; orders frequently split between Manhattan and Brooklyn.
- **Remedy**: Mobile-first tactile layout (44px touch targets, bottom sheets), ultra-lightweight client bundles, resilient offline cart persistence, transparent store split visualizer.

### 4.2 The "Tech-First" Bias
- **The Bias**: Wanting to build custom WebSocket media streaming, Kafka event buses, or complex microservices.
- **The Reality**: The budget is $3,000 and the hard launch deadline is Dec 1, 2026. Terrific live SDK v2 already handles video streaming, chat, and product pinning; Next.js 14 App Router + Prisma + PostgreSQL provides all necessary speed and transactional integrity.
- **Remedy**: Follow ADR-003 and ADR-006 strictly. Zero unnecessary infrastructure.

### 4.3 The "Silent Feature Creep"
- **The Bias**: Trying to build accessory Shopify checkouts, brand self-registration portals, customer reward points, and driver GPS tracking.
- **The Reality**: Accessories belong to `owtlet.shop` (ADR-008); brands are created by Owtlet admins (ADR-009); driver tracking is handled by the dispensary's POS/fleet.
- **Remedy**: Nick Fury scope lockdown: anything outside REQ-F-001 through REQ-F-019 is rejected.

---

## 5. Prioritization Matrix (Value vs. Complexity)

```
       ▲ HIGH
       │ 
       │   [Must-Have: MVP]                     [Nice-to-Have: Post-MVP]
       │   • 21+ Age Gate Edge Middleware       • Bi-directional POS Webhook Sync
       │   • Terrific SDK v2 Video Bridge       • In-stream Live Chat Moderation
       │   • Custom Cannabis PostgreSQL Cart    • SMS Status Alerts (Twilio)
       │   • Dynamic Multi-Dispensary Allocator • Predictive Strains Recommender
V      │   • 30-Min Post-Show Cart Hold Rule
A      │   • Leafly/Retailer Handoff Engine
L      │   • Brand Storefront Channels
U      │   • Store Hours & Distance Checks
E      │ 
       │ ───────────────────────────────────────────────────────────────
       │ 
       │   [Low-Priority / Experimental]        [REJECTED / OUT OF SCOPE]
       │   • Shopper Reviews & Ratings          • In-App Cannabis Payment Processing
       │   • Dark/Light Mode Theme Toggle       • Government ID OCR / Storage
       │   • Social Sharing Buttons             • Shopify Accessory Bridge (ADR-008)
       │                                        • Brand Self-Service Portal (ADR-009)
       │                                        • Native Mobile Apps (iOS/Android)
       │ 
       └─────────────────────────────────────────────────────────────►
                                 COMPLEXITY
```

### 5.1 Must-Have (MVP — Hard Launch Dec 1, 2026)
1. **REQ-F-001**: Strict 21+ Age Gate with signed HTTP-only cookie (`owt_age_verified`).
2. **REQ-F-002**: PostgreSQL Cannabis Catalog with strain type, THC/CBD %, brand, and per-dispensary inventory.
3. **REQ-F-003**: Terrific Live SDK v2 integration (`cartSyncHandler` + `goToCheckoutHandler`) supporting live shows, replays, and shoppable video.
4. **REQ-F-004 & REQ-F-016**: Custom Cannabis Cart with dynamic 30-min-post-show hold rule.
5. **REQ-F-006**: Zero-liability Checkout Handoff (`HandoffProvider` supporting Leafly primary and Retailer Web POS fallback).
6. **REQ-F-007, 008, 012, 013**: Smart Multi-Dispensary Order Allocator (Parent Order + Sub-Orders, delivery ZIP checking, pickup vs delivery, store hours display, store change override).
7. **REQ-F-010**: Admin Console for catalog, brands, dispensaries, live show mapping, and orders.
8. **REQ-F-011**: Brand Storefronts (`/brands/[slug]`) assigned to partner dispensaries.
9. **REQ-F-015**: Single `owtletPrice` enforcement for show-pinned products.
10. **REQ-F-017**: Pre-handoff out-of-stock detection with alternative dispensary suggestions.
11. **REQ-F-019**: Permanent 301 redirect from `owtlet.live` to `owtlet.com`.

### 5.2 Nice-to-Have (Post-MVP / Phase 2)
1. Automated bi-directional POS inventory sync webhooks (Dutchie / Treez / Meadow).
2. Live in-video interactive emoji reactions and custom chat styling.
3. Automated SMS notification on dispensary sub-order confirmation (Twilio).
4. Customer favorite strains / reorder quick-lists.

### 5.3 Rejected / Out of Scope (Guarded by Nick Fury)
1. **In-App Cannabis Payment Processing**: Strictly prohibited. Legal and banking liability.
2. **Government ID & Document Uploads**: Strictly prohibited. Retailer conducts physical check.
3. **Shopify Accessory Cart Integration**: Out of scope per ADR-008. Handled by `owtlet.shop`.
4. **Brand Self-Registration**: Out of scope per ADR-009. Admin creates brands manually.
5. **Native Mobile App (iOS / Android)**: Out of scope per Q-T02. Responsive web only.

---

## 6. Actionable Takeaways for Chief Orchestrator (`iron_man`)

1. **Architecture Spine Alignment**: Ensure `docs/architecture-spine.md` reflects the greedy dispensary allocator logic and the `HandoffProvider` abstraction.
2. **Database Schema Verification**: Confirm Prisma schema in `docs/07-database-design.md` has `owtletPrice`, `Cart.liveShowId`, `Order` / `SubOrder` hierarchy, and zero ID/payment fields.
3. **Edge Middleware Enforcement**: Implement age gate at the Next.js Edge Middleware layer to guarantee zero catalog/video content leakage to unverified visitors.
4. **Test Suite Invariants**: Instruct `thanos` to include test suites for:
   - Cart expiration calculation (live show vs regular 30m).
   - Multi-dispensary order splitting (ZIP delivery eligibility + greedy grouping).
   - Handoff URL generation with fallback to retailer direct link.
   - Age gate signature validation.

